// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title IHonoraryTree */

interface IHonoraryTree {
    /** @dev emitted when a tree range set for honorary trees */
    event TreeRangeSet();
    /** @dev emitted when a tree range released from honorary trees */
    event TreeRangeReleased();

    /**
     * @dev emitted when admin add a recipient
     * @param recipient address of recipient
     */
    event RecipientAdded(address recipient);

    /**
     * @dev emitted when admin update date of a recipient
     * @param recipient address of recipient
     */
    event RecipientUpdated(address recipient);

    /** @dev emitted when referral tree payments set by admin
     * @param referralTreePaymentToPlanter referral tree payment to planter amount
     * @param referralTreePaymentToAmbassador referral tree payment to ambassador amount
     */
    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );

    /** @dev emitted when a tree claimed by recipient
     * @param treeId is id of climed tree
     */
    event Claimed(uint256 treeId);

    /** @dev emitted when claim failed
     * @param recipient address of recipient
     */
    event ClaimFailed(address recipient);

    /**
     * @dev return symbol in {_index}
     * @param _index is index of array
     * @return symbol in {_index}
     */
    function symbols(uint256 _index) external returns (uint64 symbol);

    /**
     * @dev return if symbol in {_index} is used or not
     * @param _index is index of array
     * @return isUsed , if symbol in {_index} is used or not
     */
    function used(uint256 _index) external returns (bool isUsed);

    /** @dev admin set {_address} to trust forwarder*/
    function setTrustedForwarder(address _address) external;

    /** @dev admin set {_daiTokenAddress} to DaiToken contract address */
    function setDaiTokenAddress(address _daiTokenAddress) external;

    /** @dev admin set {_address} to Attribute contract address */
    function setAttributesAddress(address _address) external;

    /** @dev admin set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev admin set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /**
     * @dev admin set a range of trees with saleType of '0' for honorary trees
     * NOTE saleType of tree set to '5'
     * NOTE the prepaid amount is deducted from the total amount t pay
     * NOTE emit a {TreeRangeSet} event
     * @param _sponsor address of account pay for value of honorary trees
     * @param _startTreeId start tree id of honorary tree to claim
     * @param _upTo end tree id of honorary tree to claim
     */

    function setTreeRange(
        address _sponsor,
        uint256 _startTreeId,
        uint256 _upTo
    ) external;

    /**
     * @dev admin release tree range
     * NOTE saleType of trees set to '0'
     * NOTE calculate prePaidCount value to deducte from number of tree count
     * when new tree range set
     * NOTE emit a {TreeRangeReleased} event
     */
    function releaseTreeRange() external;

    /**
     * @dev admin reserve a symbol
     * @param _uniquenessFactor unique symbol to reserve
     */
    function reserveSymbol(uint64 _uniquenessFactor) external;

    /**
     * @dev admin release all reserved and not used symbols
     */
    function releaseReservedSymbol() external;

    /**
     * @dev admin add recipient
     * NOTE emit a {RecipientAdded} event
     * @param _recipient address of recipient
     * @param _startDate start date for {_recipient} to claim tree
     * @param _expiryDate expiry date for {_recipient} to claim tree
     * @param _coefficient coefficient value
     */
    function addRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate,
        uint64 _coefficient
    ) external;

    /**
     * @dev admin update {_recipient} data
     * NOTE emit a {RecipientUpdated} event
     * @param _recipient address of recipient to update date
     * @param _startDate new start date for {_recipient} to claim tree
     * @param _expiryDate new expiry date for {_recipient} to claim tree
     * @param _coefficient coefficient value
     */
    function updateRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate,
        uint64 _coefficient
    ) external;

    /** @dev admin can set referral tree payments
     * NOTE emit a {ReferralTreePaymentsUpdated} event
     * @param _referralTreePaymentToPlanter is referral tree payment to planter amount
     * @param _referralTreePaymentToAmbassador is referral tree payment to ambassador amount
     */
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external;

    /**
     * @dev recipient claim a tree and tree minted to recipient.
     * projected earnings updated and random attributes set for that tree
     * NOTE emit a {Claimed} or {ClaimFailed} event
     */

    function claim() external;

    function initialize(
        address _accessRestrictionAddress,
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external;

    /**
     * @dev return data of an recipient {_address}
     * @param _address of recipient to get data
     * @return expiryDate
     * @return startDate
     */
    function recipients(address _address)
        external
        view
        returns (
            uint64 expiryDate,
            uint64 startDate,
            uint64 coefficient
        );

    /** @return true in case of HonoraryTree contract have been initialized */
    function isHonoraryTree() external view returns (bool);

    /** @return number of claimed trees */
    function claimedCount() external view returns (uint256);

    /** @return id of tree to claim */
    function currentTreeId() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function upTo() external view returns (uint256);

    /** @return tree count that paid before for it*/
    function prePaidTreeCount() external view returns (uint256);

    /** @return referralTreePaymentToPlanter amount */
    function referralTreePaymentToPlanter() external view returns (uint256);

    /** @return referralTreePaymentToAmbassador amount */
    function referralTreePaymentToAmbassador() external view returns (uint256);
}
