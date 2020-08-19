// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "../../node_modules/@openzeppelin/contracts/utils/Pausable.sol";


contract AccessRestriction is AccessControl, Pausable {

    address public owner = msg.sender;

    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AMBASSADOR_ROLE = keccak256("AMBASSADOR_ROLE");

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isAccessRestriction = true;

    constructor() public {
        if(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) == false) {
            _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        }
        if(hasRole(PLANTER_ROLE, msg.sender) == false) {
            _setupRole(PLANTER_ROLE, msg.sender);
        }
        if(hasRole(AMBASSADOR_ROLE, msg.sender) == false) {
            _setupRole(AMBASSADOR_ROLE, msg.sender);
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
        require(hasRole(PLANTER_ROLE, _address) || hasRole(AMBASSADOR_ROLE, _address), "Caller is not a planter or ambassador");
    }
    
    function ifPlanter(address _address) public view {
        require(hasRole(PLANTER_ROLE, _address), "Caller is not a planter");
    }

    function isPlanter(address _address) public view returns(bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

    function ifAmbassador(address _address) public view {
        require(hasRole(AMBASSADOR_ROLE, _address), "Caller is not a ambassador");
    }

    function isAmbassador(address _address) public view returns(bool) {
        return hasRole(AMBASSADOR_ROLE, _address);
    }

    function ifAdmin(address _address) public view {
        require(hasRole(DEFAULT_ADMIN_ROLE, _address), "Caller is not admin");
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



}