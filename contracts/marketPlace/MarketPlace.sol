// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./IMarketPlace.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/** @title MarketPlace Contract */
contract MarketPlace is Initializable, IMarketPlace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bool public override isMarketPlace;

    IAccessRestriction public accessRestriction;

    CountersUpgradeable.Counter public modelId;
    CountersUpgradeable.Counter public modelMetaDataId;

    struct Input {
        uint256 modelId;
        uint256 modelMetaDataId;
        uint256 count;
    }

    struct Model {
        uint8 country;
        uint8 treeType;
        uint256 price;
    }

    struct ModelMetaData {
        address planter;
        uint256 modelId;
        uint256 count;
        uint256 start;
        uint256 lastFund;
        uint256 lastPlant;
        bool deactivate;
    }

    mapping(uint256 => Model) public models; // modelId shows the number of our models

    //⇒ modelId should start from number 1

    mapping(uint256 => ModelMetaData) public idToModelMetaData;

    //⇒ modelMetaDataId should start from number 1

    uint256 public lastTreeAssigned;

    /** NOTE modifier to check msg.sender has planter role */
    modifier onlyPlanter() {
        accessRestriction.ifPlanter(msg.sender);
        _;
    }

    /// @inheritdoc IMarketPlace
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        modelId.increment();
        accessRestriction = candidateContract;
    }

    function addModel(
        uint256 _modelId,
        uint8 _country,
        uint8 _treeType,
        uint256 _price,
        uint256 _count
    ) external onlyPlanter {
        require(_count < 10000, "MarketPlace:invalid count");

        if (_modelId > 0) {
            ModelMetaData storage modelMetaData = idToModelMetaData[_modelId];

            modelMetaData.count = _count;
            modelMetaData.modelId = _modelId;
            modelMetaData.planter = msg.sender;
            modelMetaData.start = lastTreeAssigned;
            modelMetaData.lastFund = lastTreeAssigned - 1;
            modelMetaData.lastPlant = lastTreeAssigned - 1;
        } else {
            Model storage modelData = models[modelId.current()];

            modelData.country = _country;
            modelData.price = _price;
            modelData.treeType = _treeType;

            ModelMetaData storage modelMetaData = idToModelMetaData[
                modelMetaDataId.current()
            ];

            modelMetaData.count = _count;
            modelMetaData.modelId = modelId.current();
            modelMetaData.planter = msg.sender;
            modelMetaData.start = lastTreeAssigned;
            modelMetaData.lastFund = lastTreeAssigned - 1;
            modelMetaData.lastPlant = lastTreeAssigned - 1;

            lastTreeAssigned += _count;
        }
    }

    function fundTree(
        Input[] memory _input,
        address _referrer,
        address _recipient
    ) external {
        uint256 totalPrice;
        for (uint256 i = 0; i < _input.length; i++) {}
    }

    function updateModel() external {}
}
