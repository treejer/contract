//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

contract Planter is Initializable, RelayRecipient {
    bool public isPlanter;

    IAccessRestriction public accessRestriction;

    struct PlanterData {
        uint8 planterType;
        uint8 status;
        uint16 countryCode;
        uint32 score;
        uint32 capacity;
        uint32 plantedCount;
        uint64 longitude;
        uint64 latitude;
    }

    mapping(address => uint8) public planters;
    mapping(address => address) public refferedBy;
    mapping(address => address) public memberOf;
    //mapping(address => address) public organizationRules;
    // mapping(address => uint256) public refferedBy;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPlanter = true;
        accessRestriction = candidateContract;
    }

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    function planterJoin() external {}

    function updatePlanterType() external {}

    function acceptPlanterFromOrganization() external {}

    function updateCapacity() external {}

    function plantingPermision() external {}

    function updateOrganizationPlanterPayment() external {}

    function getPlanterPaymentPortion() external {}
}
