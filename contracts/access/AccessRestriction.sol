// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/utils/Pausable.sol";


contract AccessRestriction is AccessControlUpgradeSafe, PausableUpgradeSafe {

    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AMBASSADOR_ROLE = keccak256("AMBASSADOR_ROLE");
    bytes32 public constant TREE_FACTORY_ROLE = keccak256("TREE_FACTORY_ROLE");
    bytes32 public constant SEED_FACTORY_ROLE = keccak256("SEED_FACTORY_ROLE");
    bytes32 public constant O2_FACTORY_ROLE = keccak256("O2_FACTORY_ROLE");

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isAccessRestriction;


    function initialize(address _deployer) public initializer {  

        AccessControlUpgradeSafe.__AccessControl_init();
        PausableUpgradeSafe.__Pausable_init();

        isAccessRestriction = true;

        if(hasRole(DEFAULT_ADMIN_ROLE, _deployer) == false) {
            _setupRole(DEFAULT_ADMIN_ROLE, _deployer);
        }
        if(hasRole(PLANTER_ROLE, _deployer) == false) {
            _setupRole(PLANTER_ROLE, _deployer);
        }
        if(hasRole(AMBASSADOR_ROLE, _deployer) == false) {
            _setupRole(AMBASSADOR_ROLE, _deployer);
        }

        if(hasRole(TREE_FACTORY_ROLE, _deployer) == false) {
            _setupRole(TREE_FACTORY_ROLE, _deployer);
        }

        if(hasRole(SEED_FACTORY_ROLE, _deployer) == false) {
            _setupRole(SEED_FACTORY_ROLE, _deployer);
        }

        if(hasRole(O2_FACTORY_ROLE, _deployer) == false) {
            _setupRole(O2_FACTORY_ROLE, _deployer);
        }
    }

    modifier onlyOwnerOfTree(address _account)
    {
        require(msg.sender == _account, "Sender not authorized, Only owner of tree authorized!");
        _;
    }

    modifier planterOrAmbassador()
    {
        require(hasRole(PLANTER_ROLE, msg.sender) ||
                hasRole(AMBASSADOR_ROLE, msg.sender),
                "Caller is not a planter or ambassador");
        _;
    }

    modifier onlyPlanter()
    {
        require(hasRole(PLANTER_ROLE, msg.sender),
                "Caller is not a planter");
        _;
    }

    modifier onlyAmbassador()
    {
        require(hasRole(AMBASSADOR_ROLE, msg.sender),
                "Caller is not a ambassador");
        _;
    }

    modifier onlyAdmin()
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "Caller is not admin");
        _;
    }

    function ifPlanterOrAmbassador(address _address) public view {
        require(isPlanterOrAmbassador(_address), "Caller is not a planter or ambassador");
    }


    function isPlanterOrAmbassador(address _address) public view returns(bool) {
        return ( isPlanter(_address) || isAmbassador(_address) );
    }
    
    
    function ifPlanter(address _address) public view {
        require(isPlanter(_address), "Caller is not a planter");
    }

    function isPlanter(address _address) public view returns(bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

    function ifAmbassador(address _address) public view {
        require(isAmbassador(_address), "Caller is not a ambassador");
    }

    function isAmbassador(address _address) public view returns(bool) {
        return hasRole(AMBASSADOR_ROLE, _address);
    }

    function ifAdmin(address _address) public view {
        require(isAdmin(_address), "Caller is not admin");
    }

    function isAdmin(address _address) public view returns(bool) {
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

    function isTreeFactory(address _address) public view returns(bool) {
        return hasRole(TREE_FACTORY_ROLE, _address);
    }


    function ifSeedFactory(address _address) public view {
        require(hasRole(SEED_FACTORY_ROLE, _address), "Caller is not SeedFactory");
    }

    function ifO2Factory(address _address) public view {
        require(hasRole(O2_FACTORY_ROLE, _address), "Caller is not O2Factory");
    }


}