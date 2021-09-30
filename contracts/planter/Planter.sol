// SPDX-License-Identifier: GPL-3.0

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
        uint32 supplyCap;
        uint32 plantedCount;
        uint64 longitude;
        uint64 latitude;
    }

    /** NOTE mapping of planterAddress to PlanterData */
    mapping(address => PlanterData) public planters;

    /** NOTE mapping of planterAddress to address of invitedBy */
    mapping(address => address) public invitedBy;

    /** NOTE mapping of planterAddress to organizationAddress that planter is member of it */
    mapping(address => address) public memberOf;

    /** NOTE mapping of organizationAddress to mapping of planterAddress to portionValue */
    mapping(address => mapping(address => uint256))
        public organizationMemberShare;

    event PlanterJoined(address planter);
    event OrganizationJoined(address organization);
    event PlanterUpdated(address planter);
    event AcceptedByOrganization(address planter);
    event RejectedByOrganization(address planter);
    event OrganizationMemberShareUpdated(address planter);

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

    /** NOTE modifier for check _planter is exist*/
    modifier existPlanter(address _planter) {
        require(planters[_planter].planterType > 0, "planter does not exist");
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
     * @param _invitedBy address of referral
     * @param _organization address of organization to be member of
     * NOTE if join as a member of an organization, when that organization
     * accept planter, planter status set to active
     */
    function join(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
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
                planters[_organization].planterType == 2,
                "organization address not valid"
            );
        }

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _msgSender() &&
                    accessRestriction.isPlanter(_invitedBy),
                "invitedBy not true"
            );

            invitedBy[_msgSender()] = _invitedBy;
        }

        uint8 status = 1;

        if (_planterType == 3) {
            memberOf[_msgSender()] = _organization;
            status = 0;
        }

        PlanterData storage planterData = planters[_msgSender()];

        planterData.planterType = _planterType;
        planterData.status = status;
        planterData.countryCode = _countryCode;
        planterData.supplyCap = 100;
        planterData.longitude = _longitude;
        planterData.latitude = _latitude;

        emit PlanterJoined(_msgSender());
    }

    //TODO: ADD_COMMENT
    function joinByAdmin(
        address _planter,
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) external onlyDataManager {
        require(
            accessRestriction.isPlanter(_planter) &&
                planters[_planter].planterType == 0,
            "User exist or not planter"
        );

        require(
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );

        if (_planterType == 3) {
            require(
                planters[_organization].planterType == 2,
                "organization address not valid"
            );

            memberOf[_planter] = _organization;
        }

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _planter &&
                    accessRestriction.isPlanter(_invitedBy),
                "invitedBy not true"
            );

            invitedBy[_planter] = _invitedBy;
        }

        PlanterData storage planterData = planters[_planter];

        planterData.planterType = _planterType;
        planterData.status = 1;
        planterData.countryCode = _countryCode;
        planterData.supplyCap = 100;
        planterData.longitude = _longitude;
        planterData.latitude = _latitude;

        emit PlanterJoined(_planter);
    }

    /**
     * @dev admin add a plater as organization (planterType 2) so planterType 3
     * can be member of these planters.
     * @param _organization address of organization planter
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _supplyCap plant supplyCap of organization planter
     * @param _invitedBy address of referral
     */
    function joinOrganization(
        address _organization,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _supplyCap,
        address _invitedBy
    ) external onlyDataManager {
        require(
            planters[_organization].planterType == 0 &&
                accessRestriction.isPlanter(_organization),
            "User exist or not planter"
        );

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _msgSender() &&
                    accessRestriction.isPlanter(_invitedBy),
                "invitedBy not true"
            );

            invitedBy[_organization] = _invitedBy;
        }

        PlanterData storage planterData = planters[_organization];

        planterData.planterType = 2;
        planterData.status = 1;
        planterData.countryCode = _countryCode;
        planterData.supplyCap = _supplyCap;
        planterData.longitude = _longitude;
        planterData.latitude = _latitude;

        emit OrganizationJoined(_organization);
    }

    //TODO:remove this function??

    /**
     * @dev planter with planterType 1 , 3 can update their planterType using this
     * function.
     * planterType 3 (member of organization) can change to
     * planterType 1 (individual planter) with input value {_planterType}
     * of 1 and zeroAddress as {_organization}
     * or choose other organization to be member of with
     * input value {_planterType} of 3 and {_organization}.
     * planterType 1 can only change to planterType 3 with input value
     * {_planter} of 3 and {_organization}
     * if planter planterType 3 choose another oraganization
     * or planterType 1 chage to planterType 3, they must be accepted by the
     * organization to be an active planter
     */
    function updatePlanterType(uint8 _planterType, address _organization)
        external
        existPlanter(_msgSender())
    {
        require(
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );

        PlanterData storage planterData = planters[_msgSender()];

        require(
            planterData.status == 0 || planterData.status == 1,
            "invalid planter status"
        );

        require(planterData.planterType != 2, "Caller is organizationPlanter");

        if (_planterType == 3) {
            require(
                planters[_organization].planterType == 2,
                "organization address not valid"
            );

            memberOf[_msgSender()] = _organization;

            planterData.status = 0;
        } else {
            require(
                planterData.planterType == 3,
                "invalid planterType in change"
            );

            if (planterData.planterType == 3) {
                memberOf[_msgSender()] = address(0);
            }

            if (planterData.status == 0) {
                planterData.status = 1;
            }
        }

        planterData.planterType = _planterType;

        emit PlanterUpdated(_msgSender());
    }

    /** @dev organization can accept planter to be it's member or reject
     * @param _planter address of planter
     * @param _acceptance accept or reject
     */
    function acceptPlanterByOrganization(address _planter, bool _acceptance)
        external
        onlyOrganization
        existPlanter(_planter)
    {
        require(
            memberOf[_planter] == _msgSender() &&
                planters[_planter].status == 0,
            "Planter not request or not pending"
        );

        PlanterData storage planterData = planters[_planter];

        if (_acceptance) {
            planterData.status = 1;

            emit AcceptedByOrganization(_planter);
        } else {
            planterData.status = 1;
            planterData.planterType = 1;
            memberOf[_planter] = address(0);

            emit RejectedByOrganization(_planter);
        }
    }

    /** @dev admin update supplyCap of planter {_planter}
     * @param _planter address of planter to update supplyCap
     * @param _supplyCap supplyCap that set to planter supplyCap
     */
    function updateSupplyCap(address _planter, uint32 _supplyCap)
        external
        onlyDataManager
        existPlanter(_planter)
    {
        PlanterData storage planterData = planters[_planter];
        require(_supplyCap > planterData.plantedCount, "invalid supplyCap");
        planterData.supplyCap = _supplyCap;
        if (planterData.status == 2) {
            planterData.status = 1;
        }
        emit PlanterUpdated(_planter);
    }

    /** @dev return if a planter can plant a tree and increase planter plantedCount 1 time.
     * @param _planter address of planter who want to plant tree
     * @param _assignedPlanterAddress address of planter that tree assigned to
     * @return if a planter can plant a tree or not
     */
    function manageAssignedTreePermission(
        address _planter,
        address _assignedPlanterAddress
    ) external onlyTreejerContract returns (bool) {
        PlanterData storage planterData = planters[_planter];
        if (planterData.planterType > 0) {
            if (
                _planter == _assignedPlanterAddress ||
                (planterData.planterType == 3 &&
                    memberOf[_planter] == _assignedPlanterAddress)
            ) {
                if (
                    planterData.status == 1 &&
                    planterData.plantedCount < planterData.supplyCap
                ) {
                    planterData.plantedCount += 1;

                    if (planterData.plantedCount >= planterData.supplyCap) {
                        planterData.status = 2;
                    }
                    return true;
                }
            }
        }

        return false;
    }

    /** @dev oragnization can update planterPayment rules of it's members
     * @param _planter address of planter
     * @param _organizationMemberShareAmount payment portion value
     * NOTE only organization (planterType = 2) can call this function
     */
    function updateOrganizationMemberShare(
        address _planter,
        uint256 _organizationMemberShareAmount
    ) external onlyOrganization existPlanter(_planter) {
        require(planters[_planter].status > 0, "invalid planter status");
        require(memberOf[_planter] == _msgSender(), "invalid input planter");
        require(
            _organizationMemberShareAmount < 10001,
            "invalid payment portion"
        );

        organizationMemberShare[_msgSender()][
            _planter
        ] = _organizationMemberShareAmount;

        emit OrganizationMemberShareUpdated(_planter);
    }

    /** @dev return planter paymentPortion for an accepted organizationPlanter
     * @param _planter address of planter to get payment portion
     * @return {true} as first param in valid planter case and seccond param is
     * address of organization that {_planter} is member of it.
     * and third param is address of referral and the last one is portion value
     */
    function getOrganizationMemberData(address _planter)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        )
    {
        PlanterData storage planterData = planters[_planter];
        if (planterData.status == 4 || planterData.planterType == 0) {
            return (false, address(0), address(0), 0);
        } else {
            if (
                planterData.planterType == 1 ||
                planterData.planterType == 2 ||
                planterData.status == 0
            ) {
                return (true, address(0), invitedBy[_planter], 10000);
            } else {
                return (
                    true,
                    memberOf[_planter],
                    invitedBy[_planter],
                    organizationMemberShare[memberOf[_planter]][_planter]
                );
            }
        }
    }

    /** @dev when tree plant of {_planter} rejected, plantedCount of {_planter}
     * must reduce 1 time and if planter status is full supplyCap {2} update it to active {1}
     * @param _planter address of planter
     * NOTE only treeFactory contract can call this function
     */
    function reducePlantedCount(address _planter)
        external
        existPlanter(_planter)
        onlyTreejerContract
    {
        PlanterData storage planterData = planters[_planter];

        planterData.plantedCount -= 1;

        if (planterData.status == 2) {
            planterData.status = 1;
        }
    }

    /** @dev check that planter {_planter} can plant regular tree
     * @param _planter address of planter
     * NOTE treeFactory contract can call this function
     * NOTE change status to full supplyCap if plantedCount be equal with
     * planter supplyCap after increase plantedCount by 1
     * @return true in case of planter status is active {1}
     */
    function manageTreePermission(address _planter)
        external
        existPlanter(_planter)
        onlyTreejerContract
        returns (bool)
    {
        PlanterData storage planterData = planters[_planter];

        if (planterData.status == 1) {
            planterData.plantedCount += 1;

            if (planterData.plantedCount == planterData.supplyCap) {
                planterData.status = 2;
            }
            return true;
        }
        return false;
    }

    /** @dev check that {_verifier} can verify plant or update requests of {_planter}
     * @param _planter address of planter
     * @param _verifier address of verifier
     * @return true in case of {_verifier} can verify {_planter} and false otherwise
     */
    function canVerify(address _planter, address _verifier)
        external
        view
        returns (bool)
    {
        uint8 planterType = planters[_planter].planterType;

        uint8 verifierStatus = planters[_verifier].status;

        if (planterType > 1) {
            if (verifierStatus == 1 || verifierStatus == 2) {
                if (planterType == 2) {
                    return memberOf[_verifier] == _planter;
                } else if (planterType == 3) {
                    return
                        memberOf[_verifier] == memberOf[_planter] ||
                        memberOf[_planter] == _verifier;
                }
            }
        }
        return false;
    }

    /** @dev check allowance to assign tree to planter {_planter}
     * @param _planter address of assignee planter
     * @return true in case of active planter or orgnization planter and false otherwise
     */
    function canAssignTree(address _planter) external view returns (bool) {
        PlanterData storage planterData = planters[_planter];

        return planterData.status == 1 || planterData.planterType == 2;
    }
}
