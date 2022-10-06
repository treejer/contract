// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title MarketPlace interface */
interface IMarketPlace {
    struct Input {
        uint256 modelId;
        uint256 count;
    }

    event ModelAdded(
        uint8 country,
        uint8 species,
        uint256 price,
        uint256 count,
        address creator,
        uint256 start,
        uint256 lastFund,
        uint256 lastPlant,
        uint256 lastReservePlant
    );

    event ModelDataUpdated(uint256 modelId, uint8 species, uint8 country);

    event PriceUpdated(uint256 modelId, uint256 price);

    event ModelDeactivated(uint256 modelId, uint256 status);

    event ModelDeleted(uint256 modelId);

    event TreeFunded(
        Input[] models,
        address funder,
        address recipient,
        address referrer,
        uint256 count,
        uint256 amount
    );

    event MarketPlaceMint(
        address recipient,
        uint256 modelId,
        uint256 start,
        uint256 count,
        uint256 price
    );

    event LastReservePlantedOfModelUpdated(
        uint256 modelId,
        address planter,
        uint256 lastReservePlant
    );
    event LastReservePlantedOfModelReduced(
        uint256 modelId,
        uint256 lastReservePlant
    );
    event LastPlantedOfModelUpdated(uint256 modelId, uint256 lastPlant);

    event SaleModelFinished(uint256 modelId);

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

    function finishSaleModel(uint256 _modelId) external;

    function reduceLastReservePlantedOfModel(uint256 _modelId) external;

    function updateLastReservePlantedOfModel(address _sender, uint256 _modelId)
        external;
}
