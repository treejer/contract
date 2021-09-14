// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title AccessRestriction interface*/

interface IAccessRestriction {
    /** @return true if AccessRestriction contract have been initialized  */
    function isAccessRestriction() external view returns (bool);

    /** @return if account {account} has role {role} or not */
    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);

    /** @return admin role */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev grant role {role} to account {account}
     * NOTE emit a {RoleGranted} event
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev revoke role {role} from account {account}
     * NOTE emit a {RoleRevoked} event
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev renounce role {role} from account {account}
     * NOTE emit a {RoleRevoked} event
     */
    function renounceRole(bytes32 role, address account) external;

    /**
     * @dev check if given address is planter
     * @param _address input address
     */
    function ifPlanter(address _address) external view;

    /**
     * @dev check if given address has Planter role
     * @param _address input address
     * @return if given address has Planter role
     */
    function isPlanter(address _address) external view returns (bool);

    /**
     * @dev check if given address is Admin
     * @param _address input address
     */
    function ifAdmin(address _address) external view;

    /**
     * @dev check if given address has Admin role
     * @param _address input address
     * @return if given address has Admin role
     */
    function isAdmin(address _address) external view returns (bool);

    /**
     * @dev check if given address has data manager role
     * @param _address input address
     * @return if given address has data manager role
     */
    function isDataManager(address _address) external view returns (bool);

    /**
     * @dev check if given address is Treejer contract
     * @param _address input address
     */
    function ifTreejerContract(address _address) external view;

    /**
     * @dev check if given address has Treejer contract role
     * @param _address input address
     * @return if given address has Treejer contract role
     */
    function isTreejerContract(address _address) external view returns (bool);

    /**
     * @dev check if given address is data manager
     * @param _address input address
     */
    function ifDataManager(address _address) external view;

    /**
     * @dev check if given address is DataManager or Treejer contract
     * @param _address input address
     */
    function ifDataManagerOrTreejerContract(address _address) external view;

    /**
     * @dev check if given address is script
     * @param _address input address
     */
    function ifScript(address _address) external view;

    /** @return if functionality is paused*/
    function paused() external view returns (bool);

    /** @dev check if functionality is not puased */
    function ifNotPaused() external view;

    /** @dev check if functionality is puased */
    function ifPaused() external view;

    /** @dev unpause functionality */
    function unpause() external;

    /** @dev pause functionality */
    function pause() external;

    /** @dev emitted when role granted to account */
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /** @dev emitted when role revoked from account */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
}
