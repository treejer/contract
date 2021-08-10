// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title ICommunityGifts */

interface ICommunityGifts {
    function isCommunityGifts() external view returns (bool);

    function setTreeAttributesAddress(address _address) external;

    function setTreeFactoryAddress(address _address) external;

    function updateGiftees(address _giftee, uint32 _symbol) external;

    function claimTree() external;

    function setExpireDate(uint256 _expireDate) external;

    function transferTree(address _giftee, uint32 _symbol) external;

    event GifteeUpdated(address giftee);
    event TreeClaimed(uint256 treeId);
    event TreeTransfered(uint256 treeId);
}
