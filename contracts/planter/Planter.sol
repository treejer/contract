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

    mapping(address => PlanterData) public planters;
    mapping(address => address) public refferedBy;
    mapping(address => address) public memberOf;
    mapping(address => mapping(address => uint256)) public organizationRules;

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

    function planterJoin(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address payable _refferedBy,
        address _organizationAddress
    ) external {
        require(_planterType >= 1 && _planterType <= 3, "planterType not true");
        if (_refferedBy != address(0)) {
            require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );
        }
        if (_organizationAddress != address(0)) {
            //TODO:_organizationAddress has organization role
        }
    }

    function updatePlanterType() external {}

    function acceptPlanterFromOrganization() external {}

    function updateCapacity() external {}

    function plantingPermision() external {}

    function updateOrganizationPlanterPayment() external {}

    function getPlanterPaymentPortion() external {}
}
