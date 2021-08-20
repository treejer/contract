// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title ICommunityGifts */

interface ICommunityGifts {
    /** @return true in case of CommnunityGift contract have been initialized */
    function isCommunityGifts() external view returns (bool);

    /** @return planter fund amount */
    function planterFund() external view returns (uint256);

    /** @return referral fund amount */
    function referralFund() external view returns (uint256);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return TreeAttribute contract address */
    function treeAttribute() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    /** @dev return communityGifts data based on giftee address
     * @return symbol that is unique
     * @return claimed that is true when a gift claimed
     * @return exist that is true when a communityGift is exist
     */
    function communityGifts(address _address)
        external
        view
        returns (
            uint32 symbol,
            bool claimed,
            bool exist
        );

    /** @return maximum time to claim a tree */
    function expireDate() external view returns (uint256);

    /** @return total number of tree that gifted */
    function giftCount() external view returns (uint256);

    /** @return maximum amount of gift trees*/
    function maxGiftCount() external view returns (uint256);

    /** @return id of tree to claim */
    function toClaim() external view returns (uint256);

    /** @return maximum id of trees can be claimed up to it */
    function upTo() external view returns (uint256);

    /** @dev admin set {_address} to trust forwarder*/
    function setTrustedForwarder(address _address) external;

    /** @dev admin set {_daiTokenAddress} to DaiToken contract address */
    function setDaiTokenAddress(address _daiTokenAddress) external;

    /** @dev admin set {_address} to TreeAttribute contract address */
    function setTreeAttributesAddress(address _address) external;

    /** @dev admin set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev admin set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev admin set the gift range from {_startTreeId} to {_endTreeId}
     * with planter fund amount {_planterFund} and referral fund amount {_referralFund}
     * NOTE community gift ends at {_expireDate} and giftees can claim gifts until {_expireDate}
     * NOTE when a community gift set {_adminWalletAddress} transfer total value of trees
     * calculated based on planter and referral funds and number of gifted trees to
     * planterFund contract
     * @param _startTreeId stating tree id for gifts range
     * @param _endTreeId ending tree id for gifts range
     * @param _planterFund planter fund amount
     * @param _referralFund referral fund amount
     * @param _expireDate expire date of community gift
     * @param _adminWalletAddress address of the admin wallet
     * NOTE emit a {CommuintyGiftSet} event
     */
    function setGiftsRange(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _planterFund,
        uint256 _referralFund,
        uint64 _expireDate,
        address _adminWalletAddress
    ) external;

    /** @dev admin assign an unique symbol to a giftee
     * @param _giftee address of giftee
     * @param _symbol unique symbol assigned to a giftee
     * NOTE emit a {GifteeUpdated} event
     */
    function updateGiftees(address _giftee, uint32 _symbol) external;

    /** @dev giftee can claim assigned tree before communityGift expireDate
     * and ownership of tree transfered to giftee that is giftee
     * NOTE giftees that claim their gift soon get low tree id
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     * NOTE emit a {TreeClaimed} event
     */
    function claimTree() external;

    /** @dev admin can set the maximum time that giftees can claim their gift before
     * expire date of community gift reach
     * @param _expireDate is the maximum time to claim tree
     */
    function setExpireDate(uint256 _expireDate) external;

    /** @dev if giftee did not claim gift, admin can transfer reserved symbol to
     * a giftee
     * @param _giftee is the address of giftee to transfer gift
     * @param _symbol is the reserved symbol is transfering to giftee
     * NOTE ownership of tree transfer to {_giftee}
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     * NOTE emit a {TreeTransfered} event
     */
    function transferTree(address _giftee, uint32 _symbol) external;

    /** @dev admin can set planter and referral funds amount
     * @param _planterFund is the planter fund amount
     * @param _referralFund is the referral fund amount
     * NOTE emit a {CommunityGiftPlanterFund} event
     */
    function setPrice(uint256 _planterFund, uint256 _referralFund) external;

    /** @dev emitted when giftee update
     * @param giftee is address of new giftee
     */
    event GifteeUpdated(address giftee);

    /** @dev emitted when a tree claimed by giftee
     * @param treeId is id of climed tree
     */
    event TreeClaimed(uint256 treeId);

    /** @dev  emitted when atree transfer to a giftee by admin
     * @param treeId is id of transfered tree
     */
    event TreeTransfered(uint256 treeId);

    /** @dev emitted when planter and referral funds set by setPrice
     * @param planterFund planter fund amount
     * @param referralFund referral fund amount
     */
    event CommunityGiftPlanterFund(uint256 planterFund, uint256 referralFund);

    /** @dev emitted when a community gift range set */
    event CommuintyGiftSet();
}
