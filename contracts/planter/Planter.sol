//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

contract Planter is Initializable, RelayRecipient {
    using SafeMathUpgradeable for uint32;
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

    modifier existPlanter(address _planterAddress) {
        require(planters[_planterAddress].planterType > 0);
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

    function updateCapacity(address _planterAddress, uint32 _capacity)
        external
        onlyAdmin
        existPlanter(_planterAddress)
    {
        if (_capacity > planters[_planterAddress].plantedCount) {
            planters[_planterAddress].capacity = _capacity;
        }
    }

    function plantingPermision(address _planterAddress)
        external
        existPlanter(_planterAddress)
        returns (bool)
    {
        accessRestriction.isGenesisTree(msg.sender);
        if (
            planters[_planterAddress].plantedCount <
            planters[_planterAddress].capacity &&
            planters[_planterAddress].status == 1
        ) {
            planters[_planterAddress].plantedCount = planters[_planterAddress]
            .plantedCount
            .add(1);
            return true;
        }
        return false;
    }

    function updateOrganizationPlanterPayment() external {}

    function getPlanterPaymentPortion() external {}
}
