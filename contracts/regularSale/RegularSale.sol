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
    uint256 public maxTreeSupply;

    /** NOTE {isRegularSale} set inside the initialize to {true} */
    bool public isRegularSale;

    /** NOTE referralTreePaymentToPlanter amount */
    uint256 public referralTreePaymentToPlanter;

    /** NOTE referralTreePaymentToAmbassador amount */
    uint256 public referralTreePaymentToAmbassador;
    /** NOTE referralTriggerCount   */
    uint256 public referralTriggerCount;
    /** NOTE mapping of referrer address to claimableTreesWeth */
    mapping(address => uint256) public referrerClaimableTreesWeth;
    /** NOTE mapping of referrer address to claimableTreesDai */
    mapping(address => uint256) public referrerClaimableTreesDai;
    /** NOTE mapping of referrer address to referrerCount */
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
        address recipient,
        address referrer,
        uint256 count,
        uint256 amount
    );
    event RegularMint(address recipient, uint256 treeId, uint256 price);
    event TreeFundedById(
        address funder,
        address recipient,
        address referrer,
        uint256 treeId,
        uint256 amount
    );
    event LastFundedTreeIdUpdated(uint256 lastFundedTreeId);
    event MaxTreeSupplyUpdated(uint256 maxTreeSupply);
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

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
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
     * @dev initialize AccessRestriction contract and set true for isRegularSale
     * set {_price} to tree price and 10000 to lastFundedTreeId and 20 to referralTriggerCount
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
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
        maxTreeSupply = 1000000;

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

    /** @dev admin set TreeFactory contract address
     * @param _address set to the address of TreeFactory contract
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev admin set DaiFund contract address
     * @param _address set to the address of DaiFund contract
     */
    function setDaiFundAddress(address _address) external onlyAdmin {
        IDaiFund candidateContract = IDaiFund(_address);

        require(candidateContract.isDaiFund());

        daiFund = candidateContract;
    }

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
     * @param _address set to the address of Allocation contract
     */
    function setAllocationAddress(address _address) external onlyAdmin {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /** @dev admin set PlanterFund contract address
     * @param _address set to the address of PlanterFund contract
     */
    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFundContract = candidateContract;
    }

    /** @dev admin set WethFund contract address
     * @param _address set to the address of WethFund contract
     */
    function setWethFundAddress(address _address) external onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);

        require(candidateContract.isWethFund());

        wethFund = candidateContract;
    }

    /**
     * @dev admin set Attributes contract address
     * @param _address set to the address of Attribute contract
     */

    function setAttributesAddress(address _address) external onlyAdmin {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    // **** FUNDTREE SECTION ****

    /** @dev admin set the price of trees
     * @param _price price of tree
     */
    function updatePrice(uint256 _price) external ifNotPaused onlyDataManager {
        price = _price;
        emit PriceUpdated(_price);
    }

    /**
     * @dev admin update lastFundedTreeId
     * @param _lastFundedTreeId id of last funded tree
     */
    function updateLastFundedTreeId(uint256 _lastFundedTreeId)
        external
        ifNotPaused
        onlyDataManager
    {
        require(
            _lastFundedTreeId > lastFundedTreeId,
            "Input must be gt last tree sold"
        );

        lastFundedTreeId = _lastFundedTreeId;

        emit LastFundedTreeIdUpdated(_lastFundedTreeId);
    }

    /**
     * @dev admin update maxTreeSupply
     */
    function updateMaxTreeSupply(uint256 _maxTreeSupply)
        external
        ifNotPaused
        onlyDataManager
    {
        require(
            _maxTreeSupply > maxTreeSupply,
            "Input must be gt last tree supply"
        );

        maxTreeSupply = _maxTreeSupply;

        emit MaxTreeSupplyUpdated(_maxTreeSupply);
    }

    /**
     * @dev fund {_count} tree
     * NOTE if {_recipient} address exist trees minted to the {_recipient}
     * and mint to the function caller otherwise
     * NOTE function caller pay for the price of trees
     * NOTE based on the allocation data for tree totalBalances and PlanterFund
     * contract balance and projected earnings updated
     * NOTE generate unique symbols for trees
     * NOTE if referrer address exists {_count} added to the referrerCount
     * @param _count number of trees to fund
     * @param _referrer address of referrer
     * @param _recipient address of recipient
     */
    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) external ifNotPaused {
        require(lastFundedTreeId + _count <= maxTreeSupply, "max supply");

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

    /**
     * @dev fund {_count} tree
     * NOTE if {_recipient} address exist tree minted to the {_recipient}
     * and mint to the function caller otherwise
     * NOTE function caller pay for the price of trees
     * NOTE based on the allocation data for tree totalBalances and PlanterFund
     * contract balance and projected earnings updated
     * NOTE generate unique symbols for trees
     * NOTE if referrer address exists {_count} added to the referrerCount
     * @param _treeId id of tree to fund
     * @param _referrer address of referrer
     * @param _recipient address of recipient
     */
    function fundTreeById(
        uint256 _treeId,
        address _referrer,
        address _recipient
    ) external ifNotPaused {
        require(_treeId <= maxTreeSupply, "max supply");

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

        uint256 treeId = _treeId;
        address referrer = _referrer;

        treeFactory.mintTreeById(treeId, recipient);

        attribute.createAttribute(treeId);

        (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        ) = allocation.findAllocationData(treeId);

        daiFund.fundTree(
            treeId,
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

        if (referrer != address(0)) {
            _calculateReferrerCount(referrer, 1);
        }

        emit TreeFundedById(_msgSender(), recipient, referrer, treeId, price);
    }

    // **** REFERRAL SECTION ****

    /**
     * @dev admin update referral tree payments
     * @param _referralTreePaymentToPlanter is referral tree payment to planter amount
     * @param _referralTreePaymentToAmbassador is referral tree payment to ambassador amount
     */
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external ifNotPaused onlyDataManager {
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;

        emit ReferralTreePaymentsUpdated(
            _referralTreePaymentToPlanter,
            _referralTreePaymentToAmbassador
        );
    }

    /**
     * @dev admin update referral trigger count
     * @param _count number set to referralTriggerCount
     */
    function updateReferralTriggerCount(uint256 _count)
        external
        ifNotPaused
        onlyDataManager
    {
        referralTriggerCount = _count;
        emit ReferralTriggerCountUpdated(_count);
    }

    /**
     * @dev update referrer claimable trees
     * @param _referrer address of referrer
     * @param _count amount added to referrerClaimableTreesWeth
     */
    function updateReferrerClaimableTreesWeth(address _referrer, uint256 _count)
        external
        onlyTreejerContract
    {
        referrerClaimableTreesWeth[_referrer] += _count;
    }

    /**
     * @dev update referrerCount and calculate referrerClaimableTreesDai based on
     * referrerCount and referralTriggerCount
     * @param _referrer address of referrer
     * @param _count added number to referrerCount of referrer
     */
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

    /**
     * @dev referrer claim rewards and trees mint to the referral
     * NOTE referrer can claim up to 45 trees in each request
     */
    function claimReferralReward() external ifNotPaused {
        uint256 claimableTreesCount = referrerClaimableTreesDai[_msgSender()] +
            referrerClaimableTreesWeth[_msgSender()];

        require(claimableTreesCount > 0, "invalid gift owner");

        if (claimableTreesCount > 50) {
            claimableTreesCount = 50;
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

    /**
     * @dev mint trees to the referral and update projected earnings
     * @param _count number of trees to mint
     * @param _referrer address of referrer
     */
    function _mintReferralReward(uint256 _count, address _referrer) private {
        uint256 tempLastFundedTreeId = lastFundedTreeId;

        for (uint256 i = 0; i < _count; i++) {
            tempLastFundedTreeId = treeFactory.mintTree(
                tempLastFundedTreeId,
                _referrer
            );

            attribute.createAttribute(tempLastFundedTreeId);

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
