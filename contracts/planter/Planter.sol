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
        require(
            planters[_planterAddress].planterType > 0,
            "planter does not exist"
        );
        _;
    }
    modifier onlyTreasury() {
        accessRestriction.ifTreasury(_msgSender());
        _;
    }
    modifier onlyOrganization() {
        require(
            planters[_msgSender()].planterType == 2,
            "Planter is not organization"
        );
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
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );

        if (_planterType == 3) {
            require(
                planters[_organizationAddress].planterType == 2,
                "organization address not valid"
            );
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

    function organizationJoin(
        address organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 capacity,
        address payable _refferedBy
    ) external onlyAdmin {
        require(
            planters[organizationAddress].planterType == 0 &&
                accessRestriction.isPlanter(organizationAddress),
            "User exist or not planter"
        );

        if (_refferedBy != address(0)) {
            require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );

            refferedBy[organizationAddress] = _refferedBy;
        }

        planters[organizationAddress] = PlanterData(
            2,
            1,
            _countryCode,
            0,
            capacity,
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
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );

        PlanterData storage planter = planters[_msgSender()];

        require(planter.planterType != 2, "Caller is organizationPlanter");

        if (_planterType == 3) {
            require(
                planters[_organizationAddress].planterType == 2,
                "organization address not valid"
            );

            memberOf[_msgSender()] = _organizationAddress;

            planter.status = 0;
        } else {
            require(planter.planterType == 3, "invalid planterType in change");

            if (planter.planterType == 3) {
                memberOf[_msgSender()] = address(0);
            }

            if (planter.status == 0) {
                planter.status = 1;
            }
        }

        planter.planterType = _planterType;
    }

    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool acceptance
    ) external onlyOrganization existPlanter(_planterAddress) {
        require(
            memberOf[_planterAddress] == _msgSender() &&
                planters[_planterAddress].status == 0,
            "Planter not request or not pending"
        );

        PlanterData storage planter = planters[_planterAddress];

        if (acceptance) {
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
        PlanterData storage tempPlanter = planters[_planterAddress];
        if (_capacity > tempPlanter.plantedCount) {
            tempPlanter.capacity = _capacity;
        }
    }

    function plantingPermision(address _planterAddress)
        external
        existPlanter(_planterAddress)
        returns (bool)
    {
        accessRestriction.isGenesisTree(_msgSender());
        PlanterData storage tempPlanter = planters[_planterAddress];
        if (
            tempPlanter.plantedCount < tempPlanter.capacity &&
            tempPlanter.status == 1
        ) {
            tempPlanter.plantedCount = tempPlanter
            .plantedCount
            .add(1)
            .toUint32();
            return true;
        }
        return false;
    }

    function updateOrganizationPlanterPayment(
        address _planterAddress,
        uint256 _planterAutomaticPaymentPortion
    ) external onlyOrganization existPlanter(_planterAddress) {
        require(planters[_planterAddress].status > 0, "invalid planter status");
        require(
            memberOf[_planterAddress] == _msgSender(),
            "invalid input planter"
        );
        require(
            _planterAutomaticPaymentPortion < 10001,
            "invalid payment portion"
        );

        organizationRules[_msgSender()][
            _planterAddress
        ] = _planterAutomaticPaymentPortion;
    }

    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        existPlanter(_planterAddress)
        returns (
            address,
            address,
            uint256
        )
    {
        PlanterData storage tempPlanter = planters[_planterAddress];
        if (tempPlanter.status == 4) {
            return (address(0), address(0), 0);
        } else {
            if (
                tempPlanter.planterType == 1 ||
                tempPlanter.planterType == 2 ||
                tempPlanter.status == 0
            ) {
                return (_planterAddress, address(0), 10000);
            } else {
                return (
                    _planterAddress,
                    memberOf[_planterAddress],
                    organizationRules[memberOf[_planterAddress]][
                        _planterAddress
                    ]
                );
            }
        }
    }
}
