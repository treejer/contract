// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPlanter {
    /**
     * @return true in case of Planter contract have been initialized
     */
    function isPlanter() external view returns (bool);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @dev return planter data of {_planterAddress}
     * @return _type
     * @return status
     * @return countryCode
     * @return score
     * @return supplyCap
     * @return plantedCount
     * @return longitude
     * @return latitude
     */
    function planters(address _planterAddress)
        external
        view
        returns (
            uint8 _type,
            uint8 status,
            uint16 countryCode,
            uint32 score,
            uint32 supplyCap,
            uint32 plantedCount,
            uint64 longitude,
            uint64 latitude
        );

    /** @return referral address of {_planterAddress} */
    function invitedBy(address _planterAddress) external view returns (address);

    /** @return organization address of {_planterAddress} */
    function memberOf(address _planterAddress) external view returns (address);

    /** @return payment portion of {_planterAddress} in {_organizationAddress} */
    function organizationMemberShare(
        address _organizationAddress,
        address _planterAddress
    ) external view returns (uint256);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /**
     * @dev based on {_type} a planter can join as individual planter or
     * member of an organization
     * @param _type 1 for individual and 3 for member organization
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _invitedBy address of referral
     * @param _organizationAddress address of organization to be member of
     * NOTE if join as a member of an organization, when that organization
     * accept planter, planter status set to active
     * NOTE emit a {PlanterJoined} event
     */
    function join(
        uint8 _type,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organizationAddress
    ) external;

    //TODO: ADD_COMMENT
    function joinByAdmin(
        address _planterAddress,
        uint8 _type,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organizationAddress
    ) external;

    /**
     * @dev admin add a plater as organization (type 2) so type 3
     * can be member of these planters.
     * @param _organizationAddress address of organization planter
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _supplyCap plant supplyCap of organization planter
     * @param _invitedBy address of referral
     * NOTE emit a {OrganizationJoined} event
     */
    function joinOrganization(
        address _organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _supplyCap,
        address _invitedBy
    ) external;

    /**
     * @dev planter with type 1 , 3 can update their type using this
     * function.
     * type 3 (member of organization) can change to
     * type 1 (individual planter) with input value {_type}
     * of 1 and zeroAddress as {_organizationAddress}
     * or choose other organization to be member of with
     * input value {_type} of 3 and {_organizationAddress}.
     * type 1 can only change to type 3 with input value
     * {_planterAddress} of 3 and {_organizationAddress}
     * if planter type 3 choose another oraganization
     * or type 1 chage to type 3, they must be accepted by the
     * organization to be an active planter
     * NOTE emit a {PlanterUpdated} event
     */
    function updatePlanterType(uint8 _type, address _organizationAddress)
        external;

    /** @dev organization can accept planter to be it's member or reject
     * @param _planterAddress address of planter
     * @param _acceptance accept or reject
     * NOTE emit a {AcceptedByOrganization} or {RejectedByOrganization} event
     */
    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool _acceptance
    ) external;

    /** @dev admin update supplyCap of planter {_planterAddress}
     * @param _planterAddress address of planter to update supplyCap
     * @param _supplyCap supplyCap that set to planter supplyCap
     * NOTE emit a {PlanterUpdated} event
     */
    function updateSupplyCap(address _planterAddress, uint32 _supplyCap)
        external;

    /** @dev return if a planter can plant a tree and increase planter plantedCount 1 time.
     * @param _planterAddress address of planter who want to plant tree
     * @param _assignedPlanterAddress address of planter that tree assigned to
     * @return if a planter can plant a tree or not
     */
    function manageAssignedTreePermission(
        address _planterAddress,
        address _assignedPlanterAddress
    ) external returns (bool);

    /** @dev oragnization can update planterPayment rules of it's members
     * @param _planterAddress address of planter
     * @param _planterAutomaticPaymentPortion payment portion value
     * NOTE only organization (type = 2) can call this function
     * NOTE emit a {OrganizationMemberShareUpdated} event
     */
    function updateOrganizationMemberShare(
        address _planterAddress,
        uint256 _planterAutomaticPaymentPortion
    ) external;

    /** @dev return planter paymentPortion for an accepted organizationPlanter
     * @param _planterAddress address of planter to get payment portion
     * @return {true} as first param in valid planter case and seccond param is
     * address of organization that {_planterAddress} is member of it.
     * and third param is address of referral and the last one is portion value
     */
    function getOrganizationMemberData(address _planterAddress)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        );

    /** @dev when tree plant of {_planterAddress} rejected plantedCount of {_planterAddress}
     * must reduce 1 time and if planter status is full supplyCap {2} update it to active {1}
     * @param _planterAddress address of planter
     * NOTE only treeFactory contract can call this function
     */
    function reducePlantedCount(address _planterAddress) external;

    /** @dev check that planter {_planterAddress} can plant regular tree
     * @param _planterAddress address of planter
     * NOTE treeFactory contract can call this function
     * NOTE change status to full supplyCap if plantedCount be equal with
     * planter supplyCap after increase plantedCount by 1
     * @return true in case of planter status is active {1}
     */
    function manageTreePermission(address _planterAddress)
        external
        returns (bool);

    /** @dev check that {_verifier} can verify plant or update requests of {_planterAddress}
     * @param _planterAddress address of planter
     * @param _verifier address of verifier
     * @return true in case of {_verifier} can verify {_planterAddress} and false otherwise
     */
    function canVerify(address _planterAddress, address _verifier)
        external
        view
        returns (bool);

    /** @dev check allowance to assign tree to planter {_planterAddress}
     * @param _planterAddress address of assignee planter
     * @return true in case of active planter or orgnization planter and false otherwise
     */
    function canAssignTree(address _planterAddress)
        external
        view
        returns (bool);

    /** @dev emitted when a planter join with address {planter} */
    event PlanterJoined(address planter);

    /** @dev emitted when an organization join with address {organizationId} */
    event OrganizationJoined(address organizationId);

    /** @dev emitted when a planters data updated (supplyCap , type) */
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
}
