// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title MarketPlace interface */
interface IMarketPlace {
    function isMarketPlace() external view returns (bool);

    function activeModelCount(address _planter) external view returns (uint256);

    function initialize(address _accessRestrictionAddress) external;

    function setDaiTokenAddress(address _address) external;

    function setDaiFundAddress(address _address) external;

    function setAllocationAddress(address _address) external;

    function setTreeFactoryAddress(address _address) external;

    function setAttributesAddress(address _address) external;

    function setPlanterFundAddress(address _address) external;

    function setRegularSaleAddress(address _address) external;

    function setPlanterAddress(address _address) external;

    function updateLastPlantedOfModel(uint256 _modelId)
        external
        returns (uint256);

    function reduceLastReservePlantedOfModel(uint256 _modelId) external;

    function updateLastReservePlantedOfModel(address _sender, uint256 _modelId)
        external;
}
