// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./IMarketPlace.sol";
import "../treasury/IDaiFund.sol";
import "../gsn/RelayRecipient.sol";
import "../treasury/IAllocation.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/** @title MarketPlace Contract */
contract MarketPlace is Initializable, RelayRecipient, IMarketPlace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bool public override isMarketPlace;

    IAccessRestriction public accessRestriction;
    IERC20Upgradeable public daiToken;
    IDaiFund public daiFund;
    IAllocation public allocation;

    CountersUpgradeable.Counter public modelId;
    CountersUpgradeable.Counter public modelMetaDataId;

    struct Input {
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

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has planter role */
    modifier onlyPlanter() {
        accessRestriction.ifPlanter(_msgSender());
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
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

    /// @inheritdoc IMarketPlace
    function setDaiTokenAddress(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setDaiFundAddress(address _address) external override onlyAdmin {
        IDaiFund candidateContract = IDaiFund(_address);

        require(candidateContract.isDaiFund());

        daiFund = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setAllocationAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
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
        for (uint256 i = 0; i < _input.length; i++) {
            require(
                idToModelMetaData[_input[i].modelMetaDataId].lastFund +
                    _input[i].count <
                    idToModelMetaData[_input[i].modelMetaDataId].start +
                        idToModelMetaData[_input[i].modelMetaDataId].count,
                "MarketPlace:Invalid count."
            );

            totalPrice +=
                models[idToModelMetaData[_input[i].modelMetaDataId].modelId]
                    .price *
                _input[i].count;
        }

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "MarketPlace:Insufficient balance."
        );

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            totalPrice
        );
        require(success, "MarketPlace:Unsuccessful transfer.");
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
        override
        onlyTreejerContract
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
