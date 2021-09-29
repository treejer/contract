//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IDaiFunds.sol";
import "../treasury/IAllocation.sol";
import "../gsn/RelayRecipient.sol";
import "../treasury/IPlanterFund.sol";
import "../treasury/IWethFunds.sol";

/** @title RegularSell contract */
contract RegularSell is Initializable, RelayRecipient {
    uint256 public lastFundedTreeId;
    uint256 public price;

    /** NOTE {isRegularSell} set inside the initialize to {true} */
    bool public isRegularSell;

    /** NOTE regular planter fund amount */
    uint256 public referralTreePaymentToPlanter;

    /** NOTE regular referral fund amount */
    uint256 public referralTreePaymentToAmbassador;

    //TODO: ADD_COMMENT
    uint256 public referralTriggerCount;

    mapping(address => uint256) public referrerClaimableTreesWeth;
    mapping(address => uint256) public referrerClaimableTreesDai;

    mapping(address => uint256) public referrerCount;

    struct FundDistribution {
        uint256 planterFund;
        uint256 referralFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
    }

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IDaiFunds public daiFunds;
    IAllocation public allocation;
    IERC20Upgradeable public daiToken;
    IPlanterFund public planterFundContract;
    IWethFunds public wethFunds;

    event PriceUpdated(uint256 price);
    event TreeFunded(
        address buyer,
        address referrer,
        uint256 count,
        uint256 amount
    );
    event RegularMint(address buyer, uint256 treeId, uint256 price);
    event TreeFundedById(
        address buyer,
        address referrer,
        uint256 treeId,
        uint256 amount
    );
    event LastFundedTreeIdUpdated(uint256 lastFundedTreeId);
    event ReferralTriggerCountUpdated(uint256 count);
    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );

    event ReferrGiftClaimed(address referrer, uint256 count, uint256 amount);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isRegularSell
     * set {_price} to tree price and set 10000 to lastFundedTreeId
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _price initial tree price
     */
    function initialize(address _accessRestrictionAddress, uint256 _price)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        isRegularSell = true;
        lastFundedTreeId = 10000;

        referralTriggerCount = 20;
        price = _price;

        emit ReferralTriggerCountUpdated(20);
        emit PriceUpdated(_price);
    }

    /**
     * @dev admin set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /** @dev data manager can update lastFundedTreeId */
    function updateLastFundedTreeId(uint256 _lastFundedTreeId)
        external
        onlyDataManager
    {
        require(
            _lastFundedTreeId > lastFundedTreeId,
            "Input must be gt last tree sold"
        );

        lastFundedTreeId = _lastFundedTreeId;

        emit LastFundedTreeIdUpdated(_lastFundedTreeId);
    }

    /** @dev admin set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev admin set daiFunds contract address
     * @param _address daiFunds contract address
     */
    function setDaiFundsAddress(address _address) external onlyAdmin {
        IDaiFunds candidateContract = IDaiFunds(_address);

        require(candidateContract.isDaiFunds());

        daiFunds = candidateContract;
    }

    /** @dev admin set daiToken contract address
     * @param _address daiToken contract address
     */
    function setDaiTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /**
     * @dev admin set Allocation contract address
     * @param _address set to the address of Allocation
     */
    function setAllocationAddress(address _address) external onlyAdmin {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /** @dev admin set planterFund contract address
     * @param _address planterFund contract address
     */
    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFundContract = candidateContract;
    }

    /** @dev admin set wethFunds contract address
     * @param _address wethFunds contract address
     */
    function setWethFundsAddress(address _address) external onlyAdmin {
        IWethFunds candidateContract = IWethFunds(_address);

        require(candidateContract.isWethFunds());

        wethFunds = candidateContract;
    }

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     */
    function updatePrice(uint256 _price) external onlyDataManager {
        price = _price;
        emit PriceUpdated(_price);
    }

    //TODO: ADD_COMMENT
    function updateReferralTriggerCount(uint256 _count)
        external
        onlyDataManager
    {
        referralTriggerCount = _count;
        emit ReferralTriggerCountUpdated(_count);
    }

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * price }
     * @param _count is the number of trees requested by user
     * @param _referrer is address of refferer
     */
    function fundTree(uint256 _count, address _referrer) external {
        require(_count > 0 && _count < 101, "invalid count");

        uint256 totalPrice = price * _count;

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "invalid amount"
        );

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            totalPrice
        );

        require(success, "unsuccessful transfer");

        emit TreeFunded(_msgSender(), _referrer, _count, totalPrice);

        uint256 tempLastRegularSold = lastFundedTreeId;

        FundDistribution memory totalFunds;

        for (uint256 i = 0; i < _count; i++) {
            tempLastRegularSold = treeFactory.mintTree(
                tempLastRegularSold,
                _msgSender()
            );

            (
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = allocation.findTreeDistribution(tempLastRegularSold);

            totalFunds.planterFund += (price * planterFund) / 10000;
            totalFunds.referralFund += (price * referralFund) / 10000;
            totalFunds.treeResearch += (price * treeResearch) / 10000;
            totalFunds.localDevelop += (price * localDevelop) / 10000;
            totalFunds.rescueFund += (price * rescueFund) / 10000;
            totalFunds.treejerDevelop += (price * treejerDevelop) / 10000;
            totalFunds.reserveFund1 += (price * reserveFund1) / 10000;
            totalFunds.reserveFund2 += (price * reserveFund2) / 10000;

            planterFundContract.setPlanterFunds(
                tempLastRegularSold,
                (price * planterFund) / 10000,
                (price * referralFund) / 10000
            );

            emit RegularMint(_msgSender(), tempLastRegularSold, price);
        }

        daiFunds.regularFund(
            totalFunds.planterFund,
            totalFunds.referralFund,
            totalFunds.treeResearch,
            totalFunds.localDevelop,
            totalFunds.rescueFund,
            totalFunds.treejerDevelop,
            totalFunds.reserveFund1,
            totalFunds.reserveFund2
        );

        lastFundedTreeId = tempLastRegularSold;

        if (_referrer != address(0)) {
            _funcReferrer(_referrer, _count);
        }
    }

    function _funcReferrer(address _referrer, uint256 _count) private {
        uint256 localReferrerCount = referrerCount[_referrer] + _count;

        if (localReferrerCount >= referralTriggerCount) {
            uint256 temp = localReferrerCount / referralTriggerCount;
            localReferrerCount -= temp * referralTriggerCount;
            referrerClaimableTreesDai[_referrer] += temp;
        }

        referrerCount[_referrer] = localReferrerCount;
    }

    //TODO: ADD_COMMENT
    function _mintReferralTree(uint256 _count, address _referrer) private {
        uint256 tempLastRegularSold = lastFundedTreeId;

        for (uint256 i = 0; i < _count; i++) {
            tempLastRegularSold = treeFactory.mintTree(
                tempLastRegularSold,
                _referrer
            );

            planterFundContract.setPlanterFunds(
                tempLastRegularSold,
                referralTreePaymentToPlanter,
                referralTreePaymentToAmbassador
            );

            emit RegularMint(_referrer, tempLastRegularSold, price);
        }

        lastFundedTreeId = tempLastRegularSold;
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {price} and the {_treeId} must be more than {lastFundedTreeId} to
     * make sure that has not been sold before
     * @param _treeId is the id of tree requested by user
     * @param _referrer is address of referrer
     */
    function requestByTreeId(uint256 _treeId, address _referrer) external {
        require(_treeId > lastFundedTreeId, "invalid tree");

        require(daiToken.balanceOf(_msgSender()) >= price, "invalid amount");

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            price
        );

        require(success, "unsuccessful transfer");

        emit TreeFundedById(_msgSender(), _referrer, _treeId, price);

        treeFactory.mintTreeById(_treeId, _msgSender());

        (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        ) = allocation.findTreeDistribution(_treeId);

        daiFunds.fundTree(
            _treeId,
            price,
            planterShare,
            ambassadorShare,
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
        );

        if (_referrer != address(0)) {
            _funcReferrer(_referrer, 1);
        }
    }

    //TODO: ADD_COMMENT
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external onlyDataManager {
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;

        emit ReferralTreePaymentsUpdated(
            _referralTreePaymentToPlanter,
            _referralTreePaymentToAmbassador
        );
    }

    //TODO: ADD_COMMENT
    function updateGenesisReferrerGift(address _referrer, uint256 _count)
        external
        onlyTreejerContract
    {
        referrerClaimableTreesWeth[_referrer] += _count;
    }

    //TODO: ADD_COMMENT
    function claimGifts() external {
        uint256 _count = referrerClaimableTreesDai[_msgSender()] +
            referrerClaimableTreesWeth[_msgSender()];

        require(_count > 0, "invalid gift owner");

        if (_count > 45) {
            _count = 45;
        }

        int256 x = int256(referrerClaimableTreesDai[_msgSender()]) -
            int256(_count);

        uint256 _amount = 0;

        if (x > -1) {
            _amount =
                _count *
                (referralTreePaymentToPlanter +
                    referralTreePaymentToAmbassador);

            referrerClaimableTreesDai[_msgSender()] -= _count;

            daiFunds.refererTransferDai(_amount);
        } else {
            if (referrerClaimableTreesDai[_msgSender()] > 0) {
                _amount =
                    referrerClaimableTreesDai[_msgSender()] *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador);

                referrerClaimableTreesDai[_msgSender()] = 0;

                daiFunds.refererTransferDai(_amount);
            }

            uint256 wethAmount = uint256(-x) *
                (referralTreePaymentToPlanter +
                    referralTreePaymentToAmbassador);

            referrerClaimableTreesWeth[_msgSender()] -= uint256(-x);

            wethFunds.updateDaiSwap(wethAmount);

            _amount += wethAmount;
        }

        emit ReferrGiftClaimed(_msgSender(), _count, _amount);

        _mintReferralTree(_count, _msgSender());
    }
}
