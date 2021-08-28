//SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

/** @title Planter contract */
contract Planter is Initializable, RelayRecipient {
    using SafeCastUpgradeable for uint256;

    /** NOTE {isPlanter} set inside the initialize to {true} */
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

    /** NOTE mapping of planterAddress to PlanterData */
    mapping(address => PlanterData) public planters;

    /** NOTE mapping of planterAddress to address of refferedBy */
    mapping(address => address) public refferedBy;

    /** NOTE mapping of planterAddress to organizationAddress that planter is member of it */
    mapping(address => address) public memberOf;

    /** NOTE mapping of organizationAddress to mapping of planterAddress to portionValue */
    mapping(address => mapping(address => uint256)) public organizationRules;

    event PlanterJoin(address planterId);
    event OrganizationJoin(address organizationId);
    event PlanterUpdated(address planterId);
    event AcceptedByOrganization(address planterId);
    event RejectedByOrganization(address planterId);
    event PortionUpdated(address planterId);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check _planterAddress is exist*/
    modifier existPlanter(address _planterAddress) {
        require(
            planters[_planterAddress].planterType > 0,
            "planter does not exist"
        );
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /** NOTE modifier for check msg.sender planterType is organization*/
    modifier onlyOrganization() {
        require(
            planters[_msgSender()].planterType == 2,
            "Planter is not organization"
        );
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isPlanter
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPlanter = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev based on {_planterType} a planter can join as individual planter or
     * member of an organization
     * @param _planterType 1 for individual and 3 for member of organization
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _refferedBy address of referral
     * @param _organizationAddress address of organization to be member of
     * NOTE if join as a member of an organization, when that organization
     * accept planter, planter status set to active
     */
    function planterJoin(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _refferedBy,
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

        emit PlanterJoin(_msgSender());
    }

    /**
     * @dev admin add a plater as organization (planterType 2) so planterType 3
     * can be member of these planters.
     * @param _organizationAddress address of organization planter
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _capacity plant capacity of organization planter
     * @param _refferedBy address of referral
     */
    function organizationJoin(
        address _organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _capacity,
        address _refferedBy
    ) external onlyDataManager {
        require(
            planters[_organizationAddress].planterType == 0 &&
                accessRestriction.isPlanter(_organizationAddress),
            "User exist or not planter"
        );

        if (_refferedBy != address(0)) {
            require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );

            refferedBy[_organizationAddress] = _refferedBy;
        }

        PlanterData storage planter = planters[_organizationAddress];

        planter.planterType = 2;
        planter.status = 1;
        planter.countryCode = _countryCode;
        planter.capacity = _capacity;
        planter.longitude = _longitude;
        planter.latitude = _latitude;

        emit OrganizationJoin(_organizationAddress);
    }

    //TODO:remove this function??

    /**
     * @dev planter with type 1 , 3 can update their planterType using this
     * function.
     * planterType 3 (member of organization) can change to
     * planterType 1 (individual planter) with input value {_planterType}
     * of 1 and zeroAddress as {_organizationAddress}
     * or choose other organization to be member of with
     * input value {_planterType} of 3 and {_organizationAddress}.
     * planterType 1 can only change to planterType 3 with input value
     * {_planterAddress} of 3 and {_organizationAddress}
     * if planter type 3 choose another oraganization
     * or planterType 1 chage to planterType 3, they must be accepted by the
     * organization to be an active planter
     */
    function updatePlanterType(uint8 _planterType, address _organizationAddress)
        external
        existPlanter(_msgSender())
    {
        require(
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );

        PlanterData storage planter = planters[_msgSender()];

        require(
            planter.status == 0 || planter.status == 1,
            "invalid planter status"
        );

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

        emit PlanterUpdated(_msgSender());
    }

    /** @dev organization can accept planter to be it's member or reject
     * @param _planterAddress address of planter
     * @param _acceptance accept or reject
     */
    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool _acceptance
    ) external onlyOrganization existPlanter(_planterAddress) {
        require(
            memberOf[_planterAddress] == _msgSender() &&
                planters[_planterAddress].status == 0,
            "Planter not request or not pending"
        );

        PlanterData storage planter = planters[_planterAddress];

        if (_acceptance) {
            planter.status = 1;

            emit AcceptedByOrganization(_planterAddress);
        } else {
            planter.status = 1;
            planter.planterType = 1;
            memberOf[_planterAddress] = address(0);

            emit RejectedByOrganization(_planterAddress);
        }
    }

    /** @dev admin update capacity of planter {_planterAddress}
     * @param _planterAddress address of planter to update capacity
     * @param _capacity capacity that set to planter capacity
     */
    function updateCapacity(address _planterAddress, uint32 _capacity)
        external
        onlyDataManager
        existPlanter(_planterAddress)
    {
        PlanterData storage tempPlanter = planters[_planterAddress];
        require(_capacity > tempPlanter.plantedCount, "invalid capacity");
        tempPlanter.capacity = _capacity;
        if (tempPlanter.status == 2) {
            tempPlanter.status = 1;
        }
        emit PlanterUpdated(_planterAddress);
    }

    /** @dev return if a planter can plant a tree and increase planter plantedCount 1 time.
     * @param _planterAddress address of planter who want to plant tree
     * @param _assignedPlanterAddress address of planter that tree assigned to
     * @return if a planter can plant a tree or not
     */
    function plantingPermission(
        address _planterAddress,
        address _assignedPlanterAddress
    ) external onlyTreejerContract returns (bool) {
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
                    tempPlanter.plantedCount += 1;

                    if (tempPlanter.plantedCount >= tempPlanter.capacity) {
                        tempPlanter.status = 2;
                    }
                    return true;
                }
            }
        }

        return false;
    }

    /** @dev oragnization can update planterPayment rules of it's members
     * @param _planterAddress address of planter
     * @param _planterAutomaticPaymentPortion payment portion value
     * NOTE only organization (planterType = 2) can call this function
     */
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

        emit PortionUpdated(_planterAddress);
    }

    /** @dev return planter paymentPortion for an accepted organizationPlanter
     * @param _planterAddress address of planter to get payment portion
     * @return {true} as first param in valid planter case and seccond param is
     * address of organization that {_planterAddress} is member of it.
     * and third param is address of referral and the last one is portion value
     */
    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        )
    {
        PlanterData storage tempPlanter = planters[_planterAddress];
        if (tempPlanter.status == 4 || tempPlanter.planterType == 0) {
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

    /** @dev when tree plant of {_planterAddress} rejected, plantedCount of {_planterAddress}
     * must reduce 1 time and if planter status is full capacity {2} update it to active {1}
     * @param _planterAddress address of planter
     * NOTE only treeFactory contract can call this function
     */
    function reducePlantCount(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyTreejerContract
    {
        PlanterData storage tempPlanter = planters[_planterAddress];

        tempPlanter.plantedCount -= 1;

        if (tempPlanter.status == 2) {
            tempPlanter.status = 1;
        }
    }

    /** @dev check that planter {_planterAddress} can plant regular tree
     * @param _planterAddress address of planter
     * NOTE treeFactory contract can call this function
     * NOTE change status to full capacity if plantedCount be equal with
     * planter capacity after increase plantedCount by 1
     * @return true in case of planter status is active {1}
     */
    function planterCheck(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyTreejerContract
        returns (bool)
    {
        PlanterData storage tempPlanter = planters[_planterAddress];

        if (tempPlanter.status == 1) {
            tempPlanter.plantedCount += 1;

            if (tempPlanter.plantedCount == tempPlanter.capacity) {
                tempPlanter.status = 2;
            }
            return true;
        }
        return false;
    }

    /** @dev check that {_verifier} can verify plant or update requests of {_planterAddress}
     * @param _planterAddress address of planter
     * @param _verifier address of verifier
     * @return true in case of {_verifier} can verify {_planterAddress} and false otherwise
     */
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

    /** @dev check allowance to assign tree to planter {_planterAddress}
     * @param _planterAddress address of assignee planter
     * @return true in case of active planter or orgnization planter and false otherwise
     */
    function canAssignTreeToPlanter(address _planterAddress)
        external
        view
        returns (bool)
    {
        PlanterData storage tempPlanter = planters[_planterAddress];

        return tempPlanter.status == 1 || tempPlanter.planterType == 2;
    }
}
