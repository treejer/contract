// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;

/** @title RegularSale interface */
interface IRegularSale {
    /** @return last funded regular tree */
    function lastFundedTreeId() external view returns (uint256);

    /** @return last funded regular tree */
    function maxTreeSupply() external view returns (uint256);

    /** @return price of tree */
    function price() external view returns (uint256);

    /**
     * @return true if RegularSale contract has been initialized
     */
    function isRegularSale() external view returns (bool);

    /** @return referralTreePaymentToPlanter */
    function referralTreePaymentToPlanter() external view returns (uint256);

    /** @return referralTreePaymentToAmbassador */
    function referralTreePaymentToAmbassador() external view returns (uint256);

    /** @return referralTriggerCount */
    function referralTriggerCount() external view returns (uint256);

    /** @return referrerClaimableTreesWeth */
    function referrerClaimableTreesWeth(address _referrer)
        external
        view
        returns (uint256);

    /** @return referrerClaimableTreesDai  */
    function referrerClaimableTreesDai(address _referrer)
        external
        view
        returns (uint256);

    /** @return referrerCount */
    function referrerCount(address _referrer) external view returns (uint256);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return DaiFund contract address */
    function daiFund() external view returns (address);

    /** @return Allocation contract address */
    function allocation() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return WethFund contract address */
    function wethFund() external view returns (address);

    /** @dev admin set trusted forwarder address */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set {_address} to DaiFund contract address */
    function setDaiFundAddress(address _address) external;

    /** @dev set {_address} to DaiToken contract address */
    function setDaiTokenAddress(address _address) external;

    /** @dev set {_address} to Allocation contract address */
    function setAllocationAddress(address _address) external;

    /** @dev set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev set {_address} to WethFund contract address */
    function setWethFundAddress(address _address) external;

    // **** FUNDTREE SECTION ****

    /** @dev admin set the price of trees
     * NOTE emit a {PriceUpdated} event
     * @param _price price of tree
     */
    function updatePrice(uint256 _price) external;

    /**
     * @dev admin update lastFundedTreeId
     * NOTE emit a {LastFundedTreeIdUpdated} event
     * @param _lastFundedTreeId id of last funded tree
     */
    function updateLastFundedTreeId(uint256 _lastFundedTreeId) external;

    /**
     * @dev admin update maxTreeSupply
     */
    function updateMaxTreeSupply(uint256 _maxTreeSupply) external;

    /**
     * @dev fund {_count} tree
     * NOTE if {_recipient} address exist trees minted to the {_recipient}
     * and mint to the function caller otherwise
     * NOTE function caller pay for the price of trees
     * NOTE based on the allocation data for tree totalBalances and PlanterFund
     * contract balance and projected earnings updated
     * NOTE generate unique symbols for trees
     * NOTE if referrer address exists {_count} added to the referrerCount
     * NOTE emit a {TreeFunded} and {RegularMint} event
     * @param _count number of trees to fund
     * @param _referrer address of referrer
     * @param _recipient address of recipient
     */
    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) external;

    /**
     * @dev fund {_count} tree
     * NOTE if {_recipient} address exist tree minted to the {_recipient}
     * and mint to the function caller otherwise
     * NOTE function caller pay for the price of trees
     * NOTE based on the allocation data for tree totalBalances and PlanterFund
     * contract balance and projected earnings updated
     * NOTE generate unique symbols for trees
     * NOTE if referrer address exists {_count} added to the referrerCount
     * NOTE emit a {TreeFundedById} event
     * @param _treeId id of tree to fund
     * @param _referrer address of referrer
     * @param _recipient address of recipient
     */
    function fundTreeById(
        uint256 _treeId,
        address _referrer,
        address _recipient
    ) external;

    // **** REFERRAL SECTION ****

    /**
     * @dev admin update referral tree payments
     * NOTE emit a {ReferralTreePaymentsUpdated} event
     * @param _referralTreePaymentToPlanter is referral tree payment to planter amount
     * @param _referralTreePaymentToAmbassador is referral tree payment to ambassador amount
     */
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external;

    /**
     * @dev admin update referral trigger count
     * NOTE emit a {ReferralTriggerCountUpdated} event
     * @param _count number set to referralTriggerCount
     */
    function updateReferralTriggerCount(uint256 _count) external;

    /**
     * @dev update referrer claimable trees
     * @param _referrer address of referrer
     * @param _count amount added to referrerClaimableTreesWeth
     */
    function updateReferrerClaimableTreesWeth(address _referrer, uint256 _count)
        external;

    /**
     * @dev referrer claim rewards and trees mint to the referral
     * NOTE referrer can claim up to 45 trees in each request
     * NOTE emit a {ReferralRewardClaimed} event
     */
    function claimReferralReward() external;

    /**
     * @dev emited when price of tree updated
     * @param price is price of tree
     */
    event PriceUpdated(uint256 price);

    /**
     * @dev emited when {count} trees fund
     * @param funder address of funder
     * @param recipient address of recipient
     * @param referrer address of referrer
     * @param count number of trees to fund
     * @param amount total price of trees
     */
    event TreeFunded(
        address funder,
        address recipient,
        address referrer,
        uint256 count,
        uint256 amount
    );

    /**
     * @dev emitted when each Regular Tree minted by {funder}
     * @param recipient address of recipient
     * @param treeId id of tree
     * @param price price of tree
     */
    event RegularMint(address recipient, uint256 treeId, uint256 price);

    /**
     * @dev emitted when tree with id {treeId} fund
     * @param funder address of funder
     * @param recipient address of recipient
     * @param referrer address of referrer
     * @param treeId id of tree to fund
     * @param amount total price of trees
     */
    event TreeFundedById(
        address funder,
        address recipient,
        address referrer,
        uint256 treeId,
        uint256 amount
    );

    /**
     * @dev emitted when lastFundedTreeId updatd
     * @param lastFundedTreeId id of tree lastFundedTreeId updated to
     */
    event LastFundedTreeIdUpdated(uint256 lastFundedTreeId);
    /**
     * @dev emitted when referralTriggerCount updated
     * @param count number set to referralTriggerCount
     */
    event ReferralTriggerCountUpdated(uint256 count);

    /**
     * @dev emitted when referralTreePayments updated
     * @param referralTreePaymentToPlanter is referralTreePaymentToPlanter amount
     * @param referralTreePaymentToAmbassador is referralTreePaymentToAmbassador amount
     */
    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );

    /**
     * @dev emitted when referral reward claimed
     * @param referrer address of referrer
     * @param count number of trees claimed
     * @param amount total price of claimed trees
     */
    event ReferralRewardClaimed(
        address referrer,
        uint256 count,
        uint256 amount
    );
}
