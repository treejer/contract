// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IPlanter {
    function isPlanter() external view returns (bool);

    function memberOf(address _planterAddress) external view returns (address);

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
        address payable _refferedBy,
        address _organizationAddress
    ) external;

    function organizationJoin(
        address organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 capacity,
        address payable _refferedBy
    ) external;

    function updatePlanterType(uint8 _planterType, address _organizationAddress)
        external;

    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool acceptance
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
}
