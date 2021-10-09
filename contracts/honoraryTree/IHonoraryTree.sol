// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title IHonoraryTree */

interface IHonoraryTree {
    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return Attribute contract address */
    function attribute() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    function recipients(address _address)
        external
        view
        returns (
            uint64 expiryDate,
            uint64 startDate,
            uint64 status
        );

    function symbols(uint256 _index) external returns (uint64 symbol);

    function used(uint256 _index) external returns (bool used);

    /** @return true in case of HonoraryTree contract have been initialized */
    function isHonoraryTree() external view returns (bool);

    function claimedCount() external view returns (uint256);

    /** @return id of tree to claim */
    function currentTreeId() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function upTo() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function prePaidTreeCount() external view returns (uint256);

    /** @return referralTreePaymentToPlanter amount */
    function referralTreePaymentToPlanter() external view returns (uint256);

    /** @return referralTreePaymentToAmbassador amount */
    function referralTreePaymentToAmbassador() external view returns (uint256);

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

    function setTreeRange(
        address _adminWalletAddress,
        uint256 _startTreeId,
        uint256 _upTo
    ) external;

    function releaseTreeRange() external;

    function reserveSymbol(uint64 _uniquenessFactor) external;

    function releaseReservedSymbol() external;

    function addRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate
    ) external;

    function updateRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate
    ) external;

    /** @dev admin can set planter and referral funds amount
     * @param _referralTreePaymentToPlanter is the planter fund amount
     * @param _referralFund is the referral fund amount
     * NOTE emit a {ReferralTreePaymentsUpdated} event
     */
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralFund
    ) external;

    function claim() external;

    /** @dev emitted when a community gift range set */
    event TreeRangeSet();
    event TreeRangeReleased();

    event RecipientUpdated(address recipient);
    event RecipientAdded(address recipient);

    /** @dev emitted when planter and referral funds set by updateReferralTreePayments
     * @param referralTreePaymentToPlanter planter fund amount
     * @param referralTreePaymentToAmbassador referral fund amount
     */
    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );

    /** @dev emitted when a tree claimed by recipient
     * @param treeId is id of climed tree
     */
    event Claimed(uint256 treeId);
    event ClaimFailed(address recipient);
}
