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
import "./IRegularSaleV2.sol";

/** @title RegularSale contract */
contract RegularSaleV2 is Initializable, RelayRecipient, IRegularSaleV2 {
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

    uint256 public override lastFundedTreeId;
    uint256 public override price;
    uint256 public override maxTreeSupply;

    /** NOTE {isRegularSale} set inside the initialize to {true} */
    bool public override isRegularSale;

    /** NOTE referralTreePaymentToPlanter amount */
    uint256 public override referralTreePaymentToPlanter;

    /** NOTE referralTreePaymentToAmbassador amount */
    uint256 public override referralTreePaymentToAmbassador;
    /** NOTE referralTriggerCount   */
    uint256 public override referralTriggerCount;
    /** NOTE mapping of referrer address to claimableTreesWeth */
    mapping(address => uint256) public override referrerClaimableTreesWeth;
    /** NOTE mapping of referrer address to claimableTreesDai */
    mapping(address => uint256) public override referrerClaimableTreesDai;
    /** NOTE mapping of referrer address to referrerCount */
    mapping(address => uint256) public override referrerCount;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IAttribute public attribute;
    IDaiFund public daiFund;
    IAllocation public allocation;
    IERC20Upgradeable public daiToken;
    IPlanterFund public planterFundContract;
    IWethFund public wethFund;

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
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc IRegularSaleV2
    function initialize(address _accessRestrictionAddress, uint256 _price)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        isRegularSale = true;
        lastFundedTreeId = 10000;
        maxTreeSupply = 1e6;

        referralTriggerCount = 20;
        price = _price;

        emit ReferralTriggerCountUpdated(20);
        emit PriceUpdated(_price);
    }

    // **** SET ADDRESS SECTION ****

    /// @inheritdoc IRegularSaleV2
    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /// @inheritdoc IRegularSaleV2
    function setTreeFactoryAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setDaiFundAddress(address _address) external override onlyAdmin {
        IDaiFund candidateContract = IDaiFund(_address);

        require(candidateContract.isDaiFund());

        daiFund = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setDaiTokenAddress(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setAllocationAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setPlanterFundAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFundContract = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setWethFundAddress(address _address) external override onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);

        require(candidateContract.isWethFund());

        wethFund = candidateContract;
    }

    /// @inheritdoc IRegularSaleV2
    function setAttributesAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    // **** FUNDTREE SECTION ****

    /// @inheritdoc IRegularSaleV2
    function updatePrice(uint256 _price)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        price = _price;
        emit PriceUpdated(_price);
    }

    /// @inheritdoc IRegularSaleV2
    function updateLastFundedTreeId(uint256 _lastFundedTreeId)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        require(
            _lastFundedTreeId > lastFundedTreeId,
            "Invalid lastFundedTreeId"
        );

        lastFundedTreeId = _lastFundedTreeId;

        emit LastFundedTreeIdUpdated(_lastFundedTreeId);
    }

    /// @inheritdoc IRegularSaleV2
    function updateMaxTreeSupply(uint256 _maxTreeSupply)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        require(lastFundedTreeId < _maxTreeSupply, "Invalid maxTreeSupply");

        maxTreeSupply = _maxTreeSupply;

        emit MaxTreeSupplyUpdated(_maxTreeSupply);
    }

    /// @inheritdoc IRegularSaleV2
    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) external override ifNotPaused {
        require(
            lastFundedTreeId + _count < maxTreeSupply,
            "Max supply reached"
        );

        require(_count > 0 && _count < 101, "Invalid count");

        address recipient = _recipient == address(0)
            ? _msgSender()
            : _recipient;

        require(recipient != _referrer, "Invalid referrer");

        uint256 totalPrice = price * _count;

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "Insufficient balance"
        );

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            totalPrice
        );

        require(success, "Unsuccessful transfer");

        emit TreeFunded(_msgSender(), recipient, _referrer, _count, totalPrice);

        uint256 tempLastFundedTreeId = lastFundedTreeId;

        TotalBalances memory totalBalances;

        for (uint256 i = 0; i < _count; i++) {
            tempLastFundedTreeId = treeFactory.mintTree(
                tempLastFundedTreeId,
                recipient
            );

            bool successAttr = attribute.createAttribute(
                tempLastFundedTreeId,
                1
            );

            require(successAttr, "Attribute not generated");

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

    /// @inheritdoc IRegularSaleV2
    function fundTreeById(
        uint256 _treeId,
        address _referrer,
        address _recipient
    ) external override ifNotPaused {
        require(
            _treeId > lastFundedTreeId && _treeId < maxTreeSupply,
            "Invalid treeId"
        );

        require(
            daiToken.balanceOf(_msgSender()) >= price,
            "Insufficient balance"
        );

        address recipient = _recipient == address(0)
            ? _msgSender()
            : _recipient;

        require(recipient != _referrer, "Invalid referrer");

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            price
        );

        require(success, "Unsuccessful transfer");

        uint256 treeId = _treeId;
        address referrer = _referrer;

        treeFactory.mintTreeById(treeId, recipient);

        bool successAttr = attribute.createAttribute(treeId, 1);

        require(successAttr, "Attribute not generated");

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

    /// @inheritdoc IRegularSaleV2
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external override ifNotPaused onlyDataManager {
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;

        emit ReferralTreePaymentsUpdated(
            _referralTreePaymentToPlanter,
            _referralTreePaymentToAmbassador
        );
    }

    /// @inheritdoc IRegularSaleV2
    function updateReferralTriggerCount(uint256 _count)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        require(_count > 0, "Invalid count");
        referralTriggerCount = _count;
        emit ReferralTriggerCountUpdated(_count);
    }

    /// @inheritdoc IRegularSaleV2
    function updateReferrerClaimableTreesWeth(address _referrer, uint256 _count)
        external
        override
        onlyTreejerContract
    {
        referrerClaimableTreesWeth[_referrer] += _count;
    }

    /// @inheritdoc IRegularSaleV2
    function updateReferrerClaimableTreesDai(address _referrer, uint256 _count)
        external
        override
        onlyTreejerContract
    {
        _calculateReferrerCount(_referrer, _count);
    }

    /// @inheritdoc IRegularSaleV2
    function claimReferralReward() external override ifNotPaused {
        uint256 claimableTreesCount = referrerClaimableTreesDai[_msgSender()] +
            referrerClaimableTreesWeth[_msgSender()];
        require(claimableTreesCount > 0, "Claimable zero");

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

            bool successAttr = attribute.createAttribute(
                tempLastFundedTreeId,
                1
            );

            require(successAttr, "Attribute not generated");

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
