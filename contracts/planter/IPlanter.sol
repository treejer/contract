// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IPlanter {
    function isPlanter() external view returns (bool);

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

    function plantingPermision(address _planterAddress) external;

    function updateOrganizationPlanterPayment(
        address _planterAddress,
        uint256 _planterAutomaticPaymentPortion
    ) external;

    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        returns (
            address,
            address,
            uint256
        );
}
