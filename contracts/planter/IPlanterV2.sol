// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPlanterV2 {
    /** @dev emitted when a planter join with address {planter} */
    event PlanterJoined(address planter);

    /** @dev emitted when an organization join with address {organization} */
    event OrganizationJoined(address organization);

    /** @dev emitted when a planters data updated (supplyCap , planterType) */
    event PlanterUpdated(address planter);

    /**
     * @dev emitted when a planter with address {planter} is
     * accepted by organization
     */
    event AcceptedByOrganization(address planter);

    /**
     * @dev emitted when a planter with address {planter} is
     * rejected by organization
     */
    event RejectedByOrganization(address planter);

    /** @dev emited when a planter with address {planter} payment portion updated */
    event OrganizationMemberShareUpdated(address planter);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /**
     * @dev based on {_planterType} a planter can join as individual planter or
     * member of an organization
     * NOTE member of organization planter status set to pendding and wait to be
     * accepted by organization.
     * NOTE emit a {PlanterJoined} event
     * @param _planterType type of planter: 1 for individual and 3 for member of organization
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _invitedBy address of referrer
     * @param _organization address of organization to be member of
     */
    function join(
        uint8 _planterType,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) external;

    /**
     * @dev admin add a individual planter or
     * member of an organization planter based on {_planterType}
     * NOTE member of organization planter status set to active and no need for
     * accepting by organization
     * NOTE emit a {PlanterJoined} event
     * @param _planter address of planter
     * @param _planterType type of planter: 1 for individual and 3 for member of organization
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _invitedBy address of referrer
     * @param _organization address of organization to be member of
     */
    function joinByAdmin(
        address _planter,
        uint8 _planterType,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) external;

    /**
     * @dev admin add a planter as organization (planterType 2) so planterType 3
     * can be member of these planters.
     * NOTE emit a {OrganizationJoined} event
     * @param _organization address of organization planter
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _supplyCap planting supplyCap of organization planter
     * @param _invitedBy address of referrer
     */

    function joinOrganization(
        address _organization,
        int64 _longitude,
        int64 _latitude,
        uint16 _countryCode,
        uint32 _supplyCap,
        address _invitedBy
    ) external;

    /**
     * @dev planter with planterType 1 , 3 can update their planterType
     * NOTE planterType 3 (member of organization) can change to
     * planterType 1 (individual planter) with input value {_planterType}
     * of 1 and zeroAddress as {_organization}
     * or choose other organization to be member of with
     * input value {_planterType} of 3 and {_organization}.
     * NOTE planterType 1 can only change to planterType 3 with input value
     * {_planter} of 3 and {_organization}
     * if planter planterType 3 choose another oraganization or planter with
     * planterType 1 change it's planterType to 3,they must be accepted by the
     * organization to be an active planter
     * NOTE emit a {PlanterUpdated} event
     * @param _planterType type of planter
     * @param _organization address of organization
     */
    function updatePlanterType(uint8 _planterType, address _organization)
        external;

    /**
     * @dev organization can accept planter to be it's member or reject
     * NOTE emit a {AcceptedByOrganization} or {RejectedByOrganization} event
     * @param _planter address of planter
     * @param _acceptance accept or reject
     */
    function acceptPlanterByOrganization(address _planter, bool _acceptance)
        external;

    /**
     * @dev admin update supplyCap of planter
     * NOTE emit a {PlanterUpdated} event
     * @param _planter address of planter to update supplyCap
     * @param _supplyCap supplyCap that set to planter supplyCap
     */
    function updateSupplyCap(address _planter, uint32 _supplyCap) external;

    /**
     * @dev return if a planter can plant a tree and increase planter plantedCount 1 time.
     * @param _planter address of planter who want to plant tree
     * @param _assignedPlanterAddress address of planter that tree assigned to
     * @return if a planter can plant a tree or not
     */
    function manageAssignedTreePermission(
        address _planter,
        address _assignedPlanterAddress
    ) external returns (bool);

    /**
     * @dev oragnization can update the share of its members
     * NOTE emit a {OrganizationMemberShareUpdated} event
     * @param _planter address of planter
     * @param _organizationMemberShareAmount member share value
     */
    function updateOrganizationMemberShare(
        address _planter,
        uint256 _organizationMemberShareAmount
    ) external;

    /**
     * @dev when planting of {_planter} rejected, plantedCount of {_planter}
     * must reduce by 1 and if planter status is full, set it to active.
     * @param _planter address of planter
     */
    function reducePlantedCount(address _planter) external;

    /**
     * @dev check that planter {_planter} can plant regular tree
     * NOTE if plantedCount reach to supplyCap status of planter
     * set to full (value of full is '2')
     * @param _planter address of planter
     * @return true in case of planter status is active (value of active is '1')
     */
    function manageTreePermission(address _planter) external returns (bool);

    function manageTreePermissionBatch(address _planter, uint32 _count)
        external
        returns (bool);

    /**
     * @dev initialize AccessRestriction contract and set true for isPlanter
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true in case of Planter contract has been initialized
     */
    function isPlanter() external view returns (bool);

    /**
     * @dev return planter data
     * @param _planter planter address to get data
     * @return planterType
     * @return status
     * @return countryCode
     * @return score
     * @return supplyCap
     * @return plantedCount
     * @return longitude
     * @return latitude
     */
    function planters(address _planter)
        external
        view
        returns (
            uint8 planterType,
            uint8 status,
            uint16 countryCode,
            uint32 score,
            uint32 supplyCap,
            uint32 plantedCount,
            int64 longitude,
            int64 latitude
        );

    /** @return referrer address of {_planter} */
    function invitedBy(address _planter) external view returns (address);

    /** @return organization address of {_planter} */
    function memberOf(address _planter) external view returns (address);

    /** @return share of {_planter} in {_organization} */
    function organizationMemberShare(address _organization, address _planter)
        external
        view
        returns (uint256);

    /**
     * @dev return organization member data
     * @param _planter address of organization member planter to get data
     * @return true in case of valid planter
     * @return address of organization that {_planter} is member of it.
     * @return address of referrer
     * @return share of {_plnater}
     */
    function getOrganizationMemberData(address _planter)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        );

    /**
     * @dev check allowance to assign tree to planter
     * @param _planter address of assignee planter
     * @return true in case of active planter or orgnization planter and false otherwise
     */
    function canAssignTree(address _planter) external view returns (bool);
}
