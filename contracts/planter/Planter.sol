//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

contract Planter is Initializable, RelayRecipient {
    using SafeMathUpgradeable for uint32;
    using SafeCastUpgradeable for uint256;
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

    function planterJoin(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address payable _refferedBy,
        address _organizationAddress
    ) external {
        require(
            planters[_msgSender()].planterType == 0 &&
                accessRestriction.isPlanter(_msgSender()),
            "User exist or not planter"
        );

        require(
            _planterType >= 1 && _planterType <= 3,
            "planterType not allowed values"
        );

        //TODO:check if _planterType == 2 msg.sender has organization role

        if (_organizationAddress != address(0)) {
            //TODO:_organizationAddress has organization role and _planterType == 3
        }

        if (_refferedBy != address(0)) {
            require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );

            refferedBy[_msgSender()] = _refferedBy;
        }

        uint8 status = 1;

        if (_planterType == 3) {
            memberOf[_msgSender()] = _organizationAddress;
            status = 0;
        }

        planters[_msgSender()] = PlanterData(
            _planterType,
            status,
            _countryCode,
            0,
            100,
            0,
            _longitude,
            _latitude
        );
    }

    function updatePlanterType(uint8 _planterType, address _organizationAddress)
        external
        existPlanter(_msgSender())
    {
        require(
            _planterType >= 1 && _planterType <= 3,
            "planterType not allowed values"
        );

        //TODO:check if _planterType == 2 msg.sender has organization role

        if (_organizationAddress != address(0)) {
            //TODO:_organizationAddress has organization role and _planterType == 3
        }

        PlanterData storage planter = planters[_msgSender()];

        if (_planterType == 3) {
            memberOf[_msgSender()] = _organizationAddress;
            planter.status = 0;
            planter.planterType = _planterType;
        } else {
            if (planter.planterType == 3) {
                memberOf[_msgSender()] = address(0);
            }
            if (planter.status == 0) {
                planter.status = 1;
            }
        }
    }

    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool acceptance
    ) external existPlanter(_msgSender()) existPlanter(_planterAddress) {
        //TODO:msg.sender organization

        //TODO:Do we need to check planter status?

        require(
            memberOf[_planterAddress] == _msgSender(),
            "PlanterAddress not request"
        );

        PlanterData storage planter = planters[_planterAddress];

        if (acceptance == true) {
            planter.status = 1;
        } else {
            planter.status = 1;
            planter.planterType = 1;
            memberOf[_planterAddress] = address(0);
        }
    }

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
            .add(1)
            .toUint32();
            return true;
        }
        return false;
    }

    function updateOrganizationPlanterPayment() external {}

    function getPlanterPaymentPortion() external {}
}
