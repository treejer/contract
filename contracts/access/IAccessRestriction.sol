// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IAccessRestriction {
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    function isAccessRestriction() external view returns (bool);

    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);

    function getRoleMemberCount(bytes32 role) external view returns (uint256);

    function getRoleMember(bytes32 role, uint256 index)
        external
        view
        returns (address);

    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;

    function ifPlanter(address _address) external view;

    function isPlanter(address _address) external view returns (bool);

    function ifAdmin(address _address) external view;

    function isAdmin(address _address) external view returns (bool);

    function ifAuction(address _address) external view;

    function isAuction(address _address) external view returns (bool);

    function ifIncrementalSell(address _address) external view;

    function isIncrementalSell(address _address) external view returns (bool);

    function ifIncrementalSellOrAuction(address _address) external view;

    function ifIncrementalSellOrAuctionOrRegularSell(address _address)
        external
        view;

    function ifTreeFactory(address _address) external view;

    function isTreeFactory(address _address) external view returns (bool);

    function ifTreasury(address _address) external view;

    function isTreasury(address _address) external view returns (bool);

    function ifRegularSell(address _address) external view;

    function isRegularSell(address _address) external view returns (bool);

    function ifFunds(address _address) external view;

    function isFunds(address _address) external view returns (bool);

    function ifCommunityGifts(address _address) external view;

    function isCommunityGifts(address _address) external view returns (bool);

    function ifAdminOrCommunityGifts(address _address) external view;

    function ifAuctionOrCommunityGifts(address _address) external view;

    function paused() external view returns (bool);

    function ifNotPaused() external view;

    function ifPaused() external view;
}
