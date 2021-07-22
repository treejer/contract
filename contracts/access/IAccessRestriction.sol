// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.9;

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

    function ifTreeFactory(address _address) external view;

    function isTreeFactory(address _address) external view returns (bool);

    function ifAuction(address _address) external view;

    function isAuction(address _address) external view returns (bool);

    function ifGenesisTree(address _address) external view;

    function isGenesisTree(address _address) external view returns (bool);

    function ifTreasury(address _address) external view;

    function isTreasury(address _address) external view returns (bool);

    function ifRegularSell(address _address) external view;

    function isRegularSell(address _address) external view returns (bool);

    function paused() external view returns (bool);

    function ifNotPaused() external view;

    function ifPaused() external view;
}
