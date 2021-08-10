// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title ICommunityGifts */

interface ICommunityGifts {
    function isCommunityGifts() external view returns (bool);

    function planterFund() external view returns (uint256);

    function referralFund() external view returns (uint256);

    function communityGifts(address _address)
        external
        view
        returns (
            uint32 symbol,
            bool claimed,
            bool exist
        );

    function claimedCount() external view returns (uint256);

    function expireDate() external view returns (uint256);

    function giftCount() external view returns (uint256);

    function setTreeAttributesAddress(address _address) external;

    function setTreeFactoryAddress(address _address) external;

    function setPlanterFundAddress(address _address) external;

    function setGiftsRange(uint256 _startTreeId, uint256 _endTreeId) external;

    function updateGiftees(address _giftee, uint32 _symbol) external;

    function claimTree() external;

    function setExpireDate(uint256 _expireDate) external;

    function transferTree(address _giftee, uint32 _symbol) external;

    function setPrice(uint256 _planterFund, uint256 _referralFund) external;

    event GifteeUpdated(address giftee);
    event TreeClaimed(uint256 treeId);
    event TreeTransfered(uint256 treeId);
}
