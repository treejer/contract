// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IPlanter {
    function isPlanter() external view returns (bool);

    function memberOf(address _planterAddress) external view returns (address);

    function refferedBy(address _planterAddress)
        external
        view
        returns (address);

    function organizationRules(
        address _organizationAddress,
        address _planterAddress
    ) external view returns (uint256);

    function planters(address _planterAddress)
        external
        view
        returns (
            uint8,
            uint8,
            uint16,
            uint32,
            uint32,
            uint32,
            uint64,
            uint64
        );

    function planterJoin(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _refferedBy,
        address _organizationAddress
    ) external;

    function organizationJoin(
        address _organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _capacity,
        address _refferedBy
    ) external;

    function updatePlanterType(uint8 _planterType, address _organizationAddress)
        external;

    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool _acceptance
    ) external;

    function updateCapacity(address _planterAddress, uint32 _capacity) external;

    function plantingPermission(
        address _planterAddress,
        address _assignedPlanterAddress
    ) external returns (bool);

    function updateOrganizationPlanterPayment(
        address _planterAddress,
        uint256 _planterAutomaticPaymentPortion
    ) external;

    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        );

    function reducePlantCount(address _planterAddress) external;

    function planterCheck(address _planterAddress) external returns (bool);

    function canVerify(address _planterAddress, address _verifier)
        external
        view
        returns (bool);

    function canAssignTreeToPlanter(address _planterAddress)
        external
        view
        returns (bool);

    event PlanterJoin(address planterId);
    event OrganizationJoin(address organizationId);
    event PlanterUpdated(address planterId);
    event AcceptedByOrganization(address planterId);
    event RejectedByOrganization(address planterId);
    event PortionUpdated(address planterId);
}
