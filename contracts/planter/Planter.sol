// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "./IPlanter.sol";

/** @title Planter contract */
contract Planter is Initializable, RelayRecipient, IPlanter {
    using SafeCastUpgradeable for uint256;

    struct PlanterData {
        uint8 planterType;
        uint8 status;
        uint16 countryCode;
        uint32 score;
        uint32 supplyCap;
        uint32 plantedCount;
        int64 longitude;
        int64 latitude;
    }

    /** NOTE {isPlanter} set inside the initialize to {true} */
    bool public override isPlanter;

    IAccessRestriction public accessRestriction;

    /** NOTE mapping of planter address to PlanterData */
    mapping(address => PlanterData) public override planters;

    /** NOTE mapping of planter address to address of invitedBy */
    mapping(address => address) public override invitedBy;

    /** NOTE mapping of planter address to organization address that planter is member of it */
    mapping(address => address) public override memberOf;

    /** NOTE mapping of organization address to mapping of planter address to portionValue */
    mapping(address => mapping(address => uint256))
        public
        override organizationMemberShare;

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

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check _planter is exist*/
    modifier existPlanter(address _planter) {
        require(planters[_planter].planterType > 0, "Planter not exist");
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /** NOTE modifier for check msg.sender planterType is organization*/
    modifier onlyOrganization() {
        require(
            planters[_msgSender()].planterType == 2,
            "Planter not organization"
        );
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /// @inheritdoc IPlanter
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPlanter = true;
        accessRestriction = candidateContract;
    }

    /// @inheritdoc IPlanter
    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /// @inheritdoc IPlanter
    function join(
        uint8 _planterType,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) external override ifNotPaused {
        require(
            accessRestriction.isPlanter(_msgSender()) &&
                planters[_msgSender()].planterType == 0,
            "Exist or not planter"
        );

        require(
            _planterType == 1 || _planterType == 3,
            "Invalid planterType"
        );

        if (_planterType == 3) {
            require(
                planters[_organization].planterType == 2,
                "Invalid organization"
            );
        }

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _msgSender() &&
                    accessRestriction.isPlanter(_invitedBy),
                "Invalid invitedBy"
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

    /// @inheritdoc IPlanter
    function joinByAdmin(
        address _planter,
        uint8 _planterType,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) external override ifNotPaused onlyDataManager {
        require(
            accessRestriction.isPlanter(_planter) &&
                planters[_planter].planterType == 0,
            "Exist or not planter"
        );

        require(
            _planterType == 1 || _planterType == 3,
            "Invalid planterType"
        );

        if (_planterType == 3) {
            require(
                planters[_organization].planterType == 2,
                "Invalid organization"
            );

            memberOf[_planter] = _organization;
        }

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _planter &&
                    accessRestriction.isPlanter(_invitedBy),
                "Invalid invitedBy"
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

    /// @inheritdoc IPlanter
    function joinOrganization(
        address _organization,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        uint32 _supplyCap,
        address _invitedBy
    ) external override ifNotPaused onlyDataManager {
        require(
            planters[_organization].planterType == 0 &&
                accessRestriction.isPlanter(_organization),
            "Exist or not planter"
        );

        if (_invitedBy != address(0)) {
            require(
                _invitedBy != _msgSender() &&
                    accessRestriction.isPlanter(_invitedBy),
                "Invalid invitedBy"
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

    /// @inheritdoc IPlanter
    function updatePlanterType(uint8 _planterType, address _organization)
        external
        override
        ifNotPaused
        existPlanter(_msgSender())
    {
        require(
            _planterType == 1 || _planterType == 3,
            "Invalid planterType"
        );

        PlanterData storage planterData = planters[_msgSender()];

        require(
            planterData.status == 0 || planterData.status == 1,
            "Invalid planter status"
        );

        require(planterData.planterType != 2, "Caller is organization");

        if (_planterType == 3) {
            require(
                planters[_organization].planterType == 2,
                "Invalid organization"
            );

            memberOf[_msgSender()] = _organization;

            planterData.status = 0;
        } else {
            require(
                planterData.planterType == 3,
                "Planter type same"
            );

            memberOf[_msgSender()] = address(0);

            if (planterData.status == 0) {
                planterData.status = 1;
            }
        }

        planterData.planterType = _planterType;

        emit PlanterUpdated(_msgSender());
    }

    /// @inheritdoc IPlanter
    function acceptPlanterByOrganization(address _planter, bool _acceptance)
        external
        override
        ifNotPaused
        onlyOrganization
    {
        require(
            memberOf[_planter] == _msgSender() &&
                planters[_planter].status == 0,
            "Request not exists"
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

    /// @inheritdoc IPlanter
    function updateSupplyCap(address _planter, uint32 _supplyCap)
        external
        override
        ifNotPaused
        onlyDataManager
        existPlanter(_planter)
    {
        PlanterData storage planterData = planters[_planter];
        require(_supplyCap > planterData.plantedCount, "Invalid supplyCap");
        planterData.supplyCap = _supplyCap;
        if (planterData.status == 2) {
            planterData.status = 1;
        }
        emit PlanterUpdated(_planter);
    }

    /// @inheritdoc IPlanter
    function manageAssignedTreePermission(
        address _planter,
        address _assignedPlanterAddress
    ) external override onlyTreejerContract returns (bool) {
        PlanterData storage planterData = planters[_planter];
        if (planterData.planterType > 0) {
            if (
                planterData.status == 1 &&
                (_planter == _assignedPlanterAddress ||
                    (planterData.planterType == 3 &&
                        memberOf[_planter] == _assignedPlanterAddress))
            ) {
                planterData.plantedCount += 1;

                if (planterData.plantedCount >= planterData.supplyCap) {
                    planterData.status = 2;
                }
                return true;
            }
        }

        return false;
    }

    /// @inheritdoc IPlanter
    function updateOrganizationMemberShare(
        address _planter,
        uint256 _organizationMemberShareAmount
    ) external override ifNotPaused onlyOrganization {
        require(planters[_planter].status > 0, "Invalid planter status");
        require(memberOf[_planter] == _msgSender(), "Not memberOf");
        require(
            _organizationMemberShareAmount < 10001,
            "Invalid share"
        );

        organizationMemberShare[_msgSender()][
            _planter
        ] = _organizationMemberShareAmount;

        emit OrganizationMemberShareUpdated(_planter);
    }

    /// @inheritdoc IPlanter
    function reducePlantedCount(address _planter)
        external
        override
        existPlanter(_planter)
        onlyTreejerContract
    {
        PlanterData storage planterData = planters[_planter];

        planterData.plantedCount -= 1;

        if (planterData.status == 2) {
            planterData.status = 1;
        }
    }

    /// @inheritdoc IPlanter
    function manageTreePermission(address _planter)
        external
        override
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

    /// @inheritdoc IPlanter
    function getOrganizationMemberData(address _planter)
        external
        view
        override
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

    /// @inheritdoc IPlanter
    function canAssignTree(address _planter)
        external
        view
        override
        returns (bool)
    {
        PlanterData storage planterData = planters[_planter];

        return planterData.status == 1 || planterData.planterType == 2;
    }
}
