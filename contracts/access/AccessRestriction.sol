// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract AccessRestriction is AccessControlUpgradeable, PausableUpgradeable {
    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AMBASSADOR_ROLE = keccak256("AMBASSADOR_ROLE");
    bytes32 public constant TREE_FACTORY_ROLE = keccak256("TREE_FACTORY_ROLE");
    bytes32 public constant SEED_FACTORY_ROLE = keccak256("SEED_FACTORY_ROLE");
    bytes32 public constant O2_FACTORY_ROLE = keccak256("O2_FACTORY_ROLE");
    bytes32 public constant AUCTION_ROLE = keccak256("AUCTION_ROLE");
    bytes32 public constant GENESIS_TREE_ROLE = keccak256("GENESIS_TREE_ROLE");
    bytes32 public constant INCREMENTAL_SELL_ROLE = keccak256("INCREMENTAL_SELL_ROLE");

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isAccessRestriction;

    function initialize(address _deployer) public initializer {
        AccessControlUpgradeable.__AccessControl_init();
        PausableUpgradeable.__Pausable_init();

        isAccessRestriction = true;

        if (hasRole(DEFAULT_ADMIN_ROLE, _deployer) == false) {
            _setupRole(DEFAULT_ADMIN_ROLE, _deployer);
        }
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");
        _;
    }

    function ifPlanterOrAmbassador(address _address) public view {
        require(
            isPlanterOrAmbassador(_address),
            "Caller is not a planter or ambassador"
        );
    }

    function isPlanterOrAmbassador(address _address)
        public
        view
        returns (bool)
    {
        return (isPlanter(_address) || isAmbassador(_address));
    }

    function ifPlanter(address _address) public view {
        require(isPlanter(_address), "Caller is not a planter");
    }

    function isPlanter(address _address) public view returns (bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

    function ifAmbassador(address _address) public view {
        require(isAmbassador(_address), "Caller is not a ambassador");
    }

    function isAmbassador(address _address) public view returns (bool) {
        return hasRole(AMBASSADOR_ROLE, _address);
    }

    function ifAdmin(address _address) public view {
        require(isAdmin(_address), "Caller is not admin");
    }

    function isAdmin(address _address) public view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    function ifNotPaused() public view {
        require(!paused(), "Pausable: paused");
    }

    function ifPaused() public view {
        require(paused(), "Pausable: not paused");
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function ifTreeFactory(address _address) public view {
        require(isTreeFactory(_address), "Caller is not TreeFactory");
    }

    function isTreeFactory(address _address) public view returns (bool) {
        return hasRole(TREE_FACTORY_ROLE, _address);
    }

    function ifSeedFactory(address _address) public view {
        require(isSeedFactory(_address), "Caller is not SeedFactory");
    }

    function isSeedFactory(address _address) public view returns (bool) {
        return hasRole(SEED_FACTORY_ROLE, _address);
    }

    function ifO2Factory(address _address) public view {
        require(isO2Factory(_address), "Caller is not O2Factory");
    }

    function isO2Factory(address _address) public view returns (bool) {
        return hasRole(O2_FACTORY_ROLE, _address);
    }

    function ifAuction(address _address) public view {
        require(isAuction(_address), "Caller is not Auction");
    }

    function isAuction(address _address) public view returns (bool) {
        return hasRole(AUCTION_ROLE, _address);
    }

    function ifGenesisTree(address _address) public view {
        require(isAuction(_address), "Caller is not GenesisTree");
    }

    function isGenesisTree(address _address) public view returns (bool) {
        return hasRole(GENESIS_TREE_ROLE, _address);
    }
    function isIncrementalSell(address _address) public view returns (bool) {
        return hasRole(INCREMENTAL_SELL_ROLE, _address);
    }
    function ifIncrementalSell(address _address) public view {
        require(isIncrementalSell(_address), "Caller is not IncrementalSell");
    }

    function ifAuctionOrIncrementalSell(address _address) public view {
        require(isIncrementalSell(_address) || isAuction(_address), "Caller is not IncrementalSell or Auction");
    }
}
