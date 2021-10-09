// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title ICommunityGifts */

interface ICommunityGifts {
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

    function giftees(address _address)
        external
        view
        returns (
            uint64 expireDate,
            uint64 startDate,
            uint64 status
        );

    function symbols(uint256 _index) external returns (uint64 symbol);

    function used(uint256 _index) external returns (bool used);

    /** @return true in case of CommnunityGift contract have been initialized */
    function isCommunityGifts() external view returns (bool);

    function claimedCount() external view returns (uint256);

    /** @return id of tree to claim */
    function currentTree() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function upTo() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function count() external view returns (uint256);

    /** @return planter fund amount */
    function planterFund() external view returns (uint256);

    /** @return referral fund amount */
    function referralFund() external view returns (uint256);

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

    function setGiftRange(
        address _adminWalletAddress,
        uint256 _startTreeId,
        uint256 _upTo
    ) external;

    function freeGiftRange() external;

    function reserveSymbol(uint64 _symbol) external;

    function removeReservedSymbol() external;

    function addGiftee(
        address _funder,
        uint64 _startDate,
        uint64 _expireDate
    ) external;

    function updateGiftee(
        address _funder,
        uint64 _startDate,
        uint64 _expireDate
    ) external;

    /** @dev admin can set planter and referral funds amount
     * @param _planterFund is the planter fund amount
     * @param _referralFund is the referral fund amount
     * NOTE emit a {CommunityGiftPlanterFund} event
     */
    function setPrice(uint256 _planterFund, uint256 _referralFund) external;

    function claimGift() external;

    /** @dev emitted when giftee update
     * @param giftee is address of new giftee
     */
    event GifteeUpdated(address giftee);

    /** @dev emitted when a tree claimed by giftee
     * @param treeId is id of climed tree
     */
    event TreeClaimed(uint256 treeId);

    /** @dev emitted when planter and referral funds set by setPrice
     * @param planterFund planter fund amount
     * @param referralFund referral fund amount
     */
    event CommunityGiftPlanterFund(uint256 planterFund, uint256 referralFund);

    /** @dev emitted when a community gift range set */
    event CommuintyGiftSet();

    event TreeNotClaimed(address giftee);
}
