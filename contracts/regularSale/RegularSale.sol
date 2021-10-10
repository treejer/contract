// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IDaiFund.sol";
import "../tree/IAttribute.sol";
import "../treasury/IAllocation.sol";
import "../gsn/RelayRecipient.sol";
import "../treasury/IPlanterFund.sol";
import "../treasury/IWethFund.sol";

/** @title RegularSale contract */
contract RegularSale is Initializable, RelayRecipient {
    uint256 public lastFundedTreeId;
    uint256 public price;

    /** NOTE {isRegularSale} set inside the initialize to {true} */
    bool public isRegularSale;

    /** NOTE regular planter fund amount */
    uint256 public referralTreePaymentToPlanter;

    /** NOTE regular referral fund amount */
    uint256 public referralTreePaymentToAmbassador;

    //TODO: ADD_COMMENT
    uint256 public referralTriggerCount;

    mapping(address => uint256) public referrerClaimableTreesWeth;
    mapping(address => uint256) public referrerClaimableTreesDai;

    mapping(address => uint256) public referrerCount;

    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 research;
        uint256 localDevelopment;
        uint256 insurance;
        uint256 treasury;
        uint256 reserve1;
        uint256 reserve2;
    }

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IAttribute public attribute;
    IDaiFund public daiFund;
    IAllocation public allocation;
    IERC20Upgradeable public daiToken;
    IPlanterFund public planterFundContract;
    IWethFund public wethFund;

    event PriceUpdated(uint256 price);
    event TreeFunded(
        address funder,
        address owner,
        address referrer,
        uint256 count,
        uint256 amount
    );
    event RegularMint(address owner, uint256 treeId, uint256 price);
    event TreeFundedById(
        address funder,
        address owner,
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

    event ReferralRewardClaimed(
        address referrer,
        uint256 count,
        uint256 amount
    );

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
     * @dev initialize accessRestriction contract and set true for isRegularSale
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

        isRegularSale = true;
        lastFundedTreeId = 10000;

        referralTriggerCount = 20;
        price = _price;

        emit ReferralTriggerCountUpdated(20);
        emit PriceUpdated(_price);
    }

    // **** SET ADDRESS SECTION ****

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

    /** @dev admin set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev admin set daiFund contract address
     * @param _address daiFund contract address
     */
    function setDaiFundAddress(address _address) external onlyAdmin {
        IDaiFund candidateContract = IDaiFund(_address);

        require(candidateContract.isDaiFund());

        daiFund = candidateContract;
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

    /** @dev admin set wethFund contract address
     * @param _address wethFund contract address
     */
    function setWethFundAddress(address _address) external onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);

        require(candidateContract.isWethFund());

        wethFund = candidateContract;
    }

    /**
     * @dev admin set AttributesAddress
     * @param _address set to the address of attribute
     */

    function setAttributesAddress(address _address) external onlyAdmin {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    // **** FUNDTREE SECTION ****

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     */
    function updatePrice(uint256 _price) external onlyDataManager {
        price = _price;
        emit PriceUpdated(_price);
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

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * price }
     * @param _count is the number of trees requested by user
     * @param _referrer is address of referrer
     */
    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) external {
        require(_count > 0 && _count < 101, "invalid count");

        uint256 totalPrice = price * _count;

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "invalid amount"
        );

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            totalPrice
        );

        require(success, "unsuccessful transfer");

        address recipient = _recipient == address(0)
            ? _msgSender()
            : _recipient;

        emit TreeFunded(_msgSender(), recipient, _referrer, _count, totalPrice);

        uint256 tempLastFundedTreeId = lastFundedTreeId;

        TotalBalances memory totalBalances;

        for (uint256 i = 0; i < _count; i++) {
            tempLastFundedTreeId = treeFactory.mintTree(
                tempLastFundedTreeId,
                recipient
            );

            attribute.createAttribute(tempLastFundedTreeId);

            (
                uint16 planterShare,
                uint16 ambassadorShare,
                uint16 researchShare,
                uint16 localDevelopmentShare,
                uint16 insuranceShare,
                uint16 treasuryShare,
                uint16 reserve1Share,
                uint16 reserve2Share
            ) = allocation.findAllocationData(tempLastFundedTreeId);

            totalBalances.planter += (price * planterShare) / 10000;
            totalBalances.ambassador += (price * ambassadorShare) / 10000;
            totalBalances.research += (price * researchShare) / 10000;
            totalBalances.localDevelopment +=
                (price * localDevelopmentShare) /
                10000;
            totalBalances.insurance += (price * insuranceShare) / 10000;
            totalBalances.treasury += (price * treasuryShare) / 10000;
            totalBalances.reserve1 += (price * reserve1Share) / 10000;
            totalBalances.reserve2 += (price * reserve2Share) / 10000;

            planterFundContract.updateProjectedEarnings(
                tempLastFundedTreeId,
                (price * planterShare) / 10000,
                (price * ambassadorShare) / 10000
            );

            //TODO : NAMING
            emit RegularMint(recipient, tempLastFundedTreeId, price);
        }

        daiFund.fundTreeBatch(
            totalBalances.planter,
            totalBalances.ambassador,
            totalBalances.research,
            totalBalances.localDevelopment,
            totalBalances.insurance,
            totalBalances.treasury,
            totalBalances.reserve1,
            totalBalances.reserve2
        );

        lastFundedTreeId = tempLastFundedTreeId;

        if (_referrer != address(0)) {
            _calculateReferrerCount(_referrer, _count);
        }
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {price} and the {_treeId} must be more than {lastFundedTreeId} to
     * make sure that has not been sold before
     * @param _treeId is the id of tree requested by user
     * @param _referrer is address of referrer
     */
    function fundTreeById(
        uint256 _treeId,
        address _referrer,
        address _recipient
    ) external {
        require(_treeId > lastFundedTreeId, "invalid tree");

        require(daiToken.balanceOf(_msgSender()) >= price, "invalid amount");

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            price
        );

        require(success, "unsuccessful transfer");

        address recipient = _recipient == address(0)
            ? _msgSender()
            : _recipient;

        emit TreeFundedById(_msgSender(), recipient, _referrer, _treeId, price);

        treeFactory.mintTreeById(_treeId, recipient);

        attribute.createAttribute(_treeId);

        (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        ) = allocation.findAllocationData(_treeId);

        daiFund.fundTree(
            _treeId,
            price,
            planterShare,
            ambassadorShare,
            researchShare,
            localDevelopmentmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
        );

        if (_referrer != address(0)) {
            _calculateReferrerCount(_referrer, 1);
        }
    }

    // **** REFERRAL SECTION ****

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
    function updateReferralTriggerCount(uint256 _count)
        external
        onlyDataManager
    {
        referralTriggerCount = _count;
        emit ReferralTriggerCountUpdated(_count);
    }

    //TODO: ADD_COMMENT
    function updateReferrerClaimableTreesWeth(address _referrer, uint256 _count)
        external
        onlyTreejerContract
    {
        referrerClaimableTreesWeth[_referrer] += _count;
    }

    function _calculateReferrerCount(address _referrer, uint256 _count)
        private
    {
        uint256 tempReferrerCount = referrerCount[_referrer] + _count;

        if (tempReferrerCount >= referralTriggerCount) {
            uint256 toClaimCount = tempReferrerCount / referralTriggerCount;
            tempReferrerCount -= toClaimCount * referralTriggerCount;
            referrerClaimableTreesDai[_referrer] += toClaimCount;
        }

        referrerCount[_referrer] = tempReferrerCount;
    }

    //TODO: ADD_COMMENT
    function claimReferralReward() external {
        uint256 claimableTreesCount = referrerClaimableTreesDai[_msgSender()] +
            referrerClaimableTreesWeth[_msgSender()];

        require(claimableTreesCount > 0, "invalid gift owner");

        if (claimableTreesCount > 45) {
            claimableTreesCount = 45;
        }

        int256 difference = int256(referrerClaimableTreesDai[_msgSender()]) -
            int256(claimableTreesCount);

        uint256 totalPrice = 0;

        if (difference > -1) {
            totalPrice =
                claimableTreesCount *
                (referralTreePaymentToPlanter +
                    referralTreePaymentToAmbassador);

            referrerClaimableTreesDai[_msgSender()] -= claimableTreesCount;

            daiFund.transferReferrerDai(totalPrice);
        } else {
            if (referrerClaimableTreesDai[_msgSender()] > 0) {
                totalPrice =
                    referrerClaimableTreesDai[_msgSender()] *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador);

                referrerClaimableTreesDai[_msgSender()] = 0;

                daiFund.transferReferrerDai(totalPrice);
            }

            uint256 claimableTreesWethTotalPrice = uint256(-difference) *
                (referralTreePaymentToPlanter +
                    referralTreePaymentToAmbassador);

            referrerClaimableTreesWeth[_msgSender()] -= uint256(-difference);

            wethFund.updateDaiDebtToPlanterContract(
                claimableTreesWethTotalPrice
            );

            totalPrice += claimableTreesWethTotalPrice;
        }

        emit ReferralRewardClaimed(
            _msgSender(),
            claimableTreesCount,
            totalPrice
        );

        _mintReferralReward(claimableTreesCount, _msgSender());
    }

    //TODO: ADD_COMMENT
    function _mintReferralReward(uint256 _count, address _referrer) private {
        uint256 tempLastFundedTreeId = lastFundedTreeId;

        for (uint256 i = 0; i < _count; i++) {
            tempLastFundedTreeId = treeFactory.mintTree(
                tempLastFundedTreeId,
                _referrer
            );

            planterFundContract.updateProjectedEarnings(
                tempLastFundedTreeId,
                referralTreePaymentToPlanter,
                referralTreePaymentToAmbassador
            );

            emit RegularMint(_referrer, tempLastFundedTreeId, price);
        }

        lastFundedTreeId = tempLastFundedTreeId;
    }
}
