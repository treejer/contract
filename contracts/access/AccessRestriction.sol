// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./IAccessRestriction.sol";

/** @title AccessRestriction contract */

contract AccessRestriction is
    AccessControlUpgradeable,
    PausableUpgradeable,
    IAccessRestriction
{
    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");
    bytes32 public constant DATA_MANAGER_ROLE = keccak256("DATA_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant SCRIPT_ROLE = keccak256("SCRIPT_ROLE");

    /** NOTE {isAccessRestriction} set inside the initialize to {true} */
    bool public override isAccessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller not admin");
        _;
    }

    /// @inheritdoc IAccessRestriction
    function initialize(address _deployer) external override initializer {
        AccessControlUpgradeable.__AccessControl_init();
        PausableUpgradeable.__Pausable_init();

        isAccessRestriction = true;

        if (!hasRole(DEFAULT_ADMIN_ROLE, _deployer)) {
            _setupRole(DEFAULT_ADMIN_ROLE, _deployer);
        }
    }

    /// @inheritdoc IAccessRestriction
    function pause() external override onlyAdmin {
        _pause();
    }

    /// @inheritdoc IAccessRestriction
    function unpause() external override onlyAdmin {
        _unpause();
    }

    /// @inheritdoc IAccessRestriction
    function ifPlanter(address _address) external view override {
        require(isPlanter(_address), "Caller not planter");
    }

    /// @inheritdoc IAccessRestriction
    function ifAdmin(address _address) external view override {
        require(isAdmin(_address), "Caller not admin");
    }

    /// @inheritdoc IAccessRestriction
    function ifTreejerContract(address _address) external view override {
        require(isTreejerContract(_address), "Caller not treejer contract");
    }

    /// @inheritdoc IAccessRestriction
    function ifDataManager(address _address) external view override {
        require(isDataManager(_address), "Caller not data manager");
    }

    /// @inheritdoc IAccessRestriction
    function ifScript(address _address) external view override {
        require(isScript(_address), "Caller not script");
    }

    /// @inheritdoc IAccessRestriction
    function ifVerifier(address _address) external view override {
        require(isVerifier(_address), "Caller not verifier");
    }

    /// @inheritdoc IAccessRestriction
    function ifDataManagerOrTreejerContract(address _address)
        external
        view
        override
    {
        require(
            isDataManager(_address) || isTreejerContract(_address),
            "Caller not dm or tc"
        );
    }

    /// @inheritdoc IAccessRestriction
    function ifNotPaused() external view override {
        require(!paused(), "Pausable: paused");
    }

    /// @inheritdoc IAccessRestriction
    function ifPaused() external view override {
        require(paused(), "Pausable: not paused");
    }

    /// @inheritdoc IAccessRestriction
    function paused()
        public
        view
        virtual
        override(PausableUpgradeable, IAccessRestriction)
        returns (bool)
    {
        return PausableUpgradeable.paused();
    }

    /// @inheritdoc IAccessRestriction
    function isPlanter(address _address) public view override returns (bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

    /// @inheritdoc IAccessRestriction
    function isAdmin(address _address) public view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /// @inheritdoc IAccessRestriction
    function isTreejerContract(address _address)
        public
        view
        override
        returns (bool)
    {
        return hasRole(TREEJER_CONTRACT_ROLE, _address);
    }

    /// @inheritdoc IAccessRestriction
    function isDataManager(address _address)
        public
        view
        override
        returns (bool)
    {
        return hasRole(DATA_MANAGER_ROLE, _address);
    }

    /// @inheritdoc IAccessRestriction
    function isVerifier(address _address) public view override returns (bool) {
        return hasRole(VERIFIER_ROLE, _address);
    }

    /// @inheritdoc IAccessRestriction
    function isScript(address _address) public view override returns (bool) {
        return hasRole(SCRIPT_ROLE, _address);
    }
}
