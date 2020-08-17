// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "../../node_modules/@openzeppelin/contracts/utils/Pausable.sol";


contract AccessRestriction is AccessControl, Pausable {

    address public owner = msg.sender;

    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AMBASSADOR_ROLE = keccak256("AMBASSADOR_ROLE");

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

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }



}