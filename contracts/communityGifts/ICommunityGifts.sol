// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title ICommunityGifts */

interface ICommunityGifts {
    /**
     * @return true in case of CommnunityGift contract have been initialized
     */
    function isCommunityGifts() external view returns (bool);

    /**
     * @return planter share
     */
    function planterFund() external view returns (uint256);

    /**
     * @return referral share
     */
    function referralFund() external view returns (uint256);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @return TreeFactory contract address
     */
    function treeFactory() external view returns (address);

    /**
     * @return PlanterFund contract address
     */
    function planterFundContract() external view returns (address);

    /**
     * @return TreeAttribute contract address
     */
    function treeAttribute() external view returns (address);

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

    /** @return total number of claimed tree  */
    function claimedCount() external view returns (uint256);

    /** @return maximum time to claim a tree */
    function expireDate() external view returns (uint256);

    /** @return total number of tree that gifted */
    function giftCount() external view returns (uint256);

    /** @dev admin set {_address} to trust forwarder*/
    function setTrustedForwarder(address _address) external;

    /** @dev admin set {_address} to TreeAttribute contract address */
    function setTreeAttributesAddress(address _address) external;

    /** @dev admin set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev admin set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev admin set the gift range from {_startTreeId} to {_endTreeId}
     * @param _startTreeId stating tree id for gifts range
     * @param _endTreeId ending tree id for gifts range
     */
    function setGiftsRange(uint256 _startTreeId, uint256 _endTreeId) external;

    /** @dev admin assign an unique symbol to a giftee
     * @param _giftee address of giftee
     * @param _symbol unique symbol assigned to a giftee
     * NOTE emit a {GifteeUpdated} event
     */
    function updateGiftees(address _giftee, uint32 _symbol) external;

    /** @dev giftee can claim assigned tree before communityGift expireDate
     * and ownership of tree transfered to giftee that is msg.sender
     * NOTE giftees that claim their gift soon get low tree id
     * NOTE planter and referral share transfer to planterFund contract
     * NOTE emit a {TreeClaimed} event
     */
    function claimTree() external;

    /** @dev admin can set the maximun time that giftees can claim their gift
     * @param _expireDate is the maximum time to claim tree
     */
    function setExpireDate(uint256 _expireDate) external;

    /** @dev if giftee did not claim gift admin can transfer reserved symbol to
     * another giftee
     * @param _giftee is the address of new giftee to transfer gift
     * @param _symbol is the reserved symbol is transfering to new giftee
     * NOTE ownership of tree transfer to {_giftee}
     * NOTE planter and referral share transfer to planterFund contract
     * NOTE emit a {TreeTransfered} event
     */
    function transferTree(address _giftee, uint32 _symbol) external;

    /** @dev admin can set planter and referral share
     * @param _planterFund is the share of planter
     * @param _referralFund is the share of referral
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
}
