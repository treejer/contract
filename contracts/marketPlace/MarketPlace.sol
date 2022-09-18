// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./IMarketPlace.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/** @title MarketPlace Contract */
contract MarketPlace is IMarketPlace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bool public override isMarketPlace;

    CountersUpgradeable.Counter public modelId;
    CountersUpgradeable.Counter public modelMetaDataId;

    struct Model {
        uint8 country;
        uint8 treeType;
        uint256 price;
    }

    struct ModelMetaData {
        address planter;
        uint256 modelId;
        uint256 count;
        uint256 start; //⇒ remove
        uint256 lastFund;
        uint256 lastPlant;
        bool deactivate;
    }

    mapping(uint256 => Model) public models; // modelId shows the number of our models

    //⇒ modelId should start from number 1

    mapping(uint256 => ModelMetaData) public idToModelMetaData;

    //⇒ modelMetaDataId should start from number 1

    uint256 public lastTreeAssigned;

    IAccessRestriction public accessRestriction;

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
        _;
    }

    function updateModel(address _sender, uint256 _modelMetaDataId)
        external
        override
        onlyTreejerContract
        returns (uint256)
    {
        ModelMetaData storage modelMetaData = idToModelMetaData[
            _modelMetaDataId
        ];

        require(
            modelMetaData.planter == _sender,
            "owner of modelMetaData is incorrect"
        );

        uint256 lastPlantTemp = modelMetaData.lastPlant + 1;

        require(
            lastPlantTemp < modelMetaData.start + modelMetaData.count,
            "All tree planted"
        );

        modelMetaData.lastPlant = lastPlantTemp;

        return lastPlantTemp;
    }

    function checkOwnerAndLastPlant(address _sender, uint256 _modelMetaDataId)
        external
        view
    {
        ModelMetaData storage modelMetaData = idToModelMetaData[
            _modelMetaDataId
        ];

        require(
            modelMetaData.planter == _sender,
            "owner of modelMetaData is incorrect"
        );

        require(
            modelMetaData.lastPlant + 1 <
                modelMetaData.start + modelMetaData.count,
            "All tree planted"
        );
    }
}
