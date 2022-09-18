// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title MarketPlace interface */
interface IMarketPlace {
    function isMarketPlace() external view returns (bool);

    function initialize(address _accessRestrictionAddress) external;

    function setDaiTokenAddress(address _address) external;

    function setDaiFundAddress(address _address) external;

    function setAllocationAddress(address _address) external;

    function updateModel(address _sender, uint256 _modelMetaDataId)
        external
        returns (uint256);

    function checkOwnerAndLastPlant(address _sender, uint256 _modelMetaDataId)
        external;
}
