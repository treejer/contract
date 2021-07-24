//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

contract Planter is Initializable, RelayRecipient {
    using SafeMathUpgradeable for uint32;
    using SafeMathUpgradeable for uint256;
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
    modifier onlyGenesisTree() {
        accessRestriction.ifGenesisTree(_msgSender());
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
            accessRestriction.isPlanter(_msgSender()) &&
                planters[_msgSender()].planterType == 0,
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

        PlanterData storage planter = planters[_msgSender()];

        planter.planterType = _planterType;
        planter.status = status;
        planter.countryCode = _countryCode;
        planter.capacity = 100;
        planter.longitude = _longitude;
        planter.latitude = _latitude;
    }

    function organizationJoin(
        address organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _capacity,
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

        PlanterData storage planter = planters[organizationAddress];

        planter.planterType = 2;
        planter.status = 1;
        planter.countryCode = _countryCode;
        planter.capacity = _capacity;
        planter.longitude = _longitude;
        planter.latitude = _latitude;
    }

    //TODO:remove this function??
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
        require(_capacity > tempPlanter.plantedCount, "invalid capacity");
        tempPlanter.capacity = _capacity;
        if (tempPlanter.status == 2) {
            tempPlanter.status = 1;
        }
    }

    function plantingPermission(
        address _planterAddress,
        address _assignedPlanterAddress
    ) external returns (bool) {
        accessRestriction.ifGenesisTree(_msgSender());

        PlanterData storage tempPlanter = planters[_planterAddress];
        if (tempPlanter.planterType > 0) {
            if (
                _planterAddress == _assignedPlanterAddress ||
                (tempPlanter.planterType == 3 &&
                    memberOf[_planterAddress] == _assignedPlanterAddress)
            ) {
                if (
                    tempPlanter.status == 1 &&
                    tempPlanter.plantedCount < tempPlanter.capacity
                ) {
                    tempPlanter.plantedCount = tempPlanter
                    .plantedCount
                    .add(1)
                    .toUint32();
                    if (tempPlanter.plantedCount >= tempPlanter.capacity) {
                        tempPlanter.status = 2;
                    }
                    return true;
                }
            }
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

    //TODO: remove existPlanter check?
    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        existPlanter(_planterAddress)
        returns (
            bool,
            address,
            address,
            uint256
        )
    {
        PlanterData storage tempPlanter = planters[_planterAddress];
        if (tempPlanter.status == 4) {
            return (false, address(0), address(0), 0);
        } else {
            if (
                tempPlanter.planterType == 1 ||
                tempPlanter.planterType == 2 ||
                tempPlanter.status == 0
            ) {
                return (true, address(0), refferedBy[_planterAddress], 10000);
            } else {
                return (
                    true,
                    memberOf[_planterAddress],
                    refferedBy[_planterAddress],
                    organizationRules[memberOf[_planterAddress]][
                        _planterAddress
                    ]
                );
            }
        }
    }

    function reducePlantCount(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyGenesisTree
    {
        PlanterData storage tempPlanter = planters[_planterAddress];

        tempPlanter.plantedCount = tempPlanter.plantedCount.sub(1).toUint32();

        if (tempPlanter.status == 2) {
            tempPlanter.status = 1;
        }
    }

    function planterCheck(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyGenesisTree
        returns (bool)
    {
        PlanterData storage tempPlanter = planters[_planterAddress];

        if (tempPlanter.status == 1) {
            tempPlanter.plantedCount = tempPlanter
            .plantedCount
            .add(1)
            .toUint32();

            if (tempPlanter.plantedCount == tempPlanter.capacity) {
                tempPlanter.status = 2;
            }
            return true;
        }
        return false;
    }

    function canVerify(address _planterAddress, address _verifier)
        external
        view
        returns (bool)
    {
        uint8 _planterType = planters[_planterAddress].planterType;

        uint8 _verifierStatus = planters[_verifier].status;

        if (_planterType > 1) {
            if (_verifierStatus == 1 || _verifierStatus == 2) {
                if (_planterType == 2) {
                    return memberOf[_verifier] == _planterAddress;
                } else if (_planterType == 3) {
                    return
                        memberOf[_verifier] == memberOf[_planterAddress] ||
                        memberOf[_planterAddress] == _verifier;
                }
            }
        }
        return false;
    }
}
