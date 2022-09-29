// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./IMarketPlace.sol";
import "../treasury/IDaiFund.sol";
import "../gsn/RelayRecipient.sol";
import "../treasury/IAllocation.sol";
import "../tree/ITreeFactoryV2.sol";
import "../tree/IAttribute.sol";
import "../planter/IPlanterV2.sol";
import "../treasury/IPlanterFund.sol";
import "../regularSale/IRegularSaleV2.sol";
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
    ITreeFactoryV2 public treeFactory;
    IAttribute public attribute;
    IPlanterFund public planterFundContract;
    IRegularSaleV2 public regularSale;
    IPlanterV2 public planter;

    CountersUpgradeable.Counter public modelId;

    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 research;
        uint256 localDevelopment;
        uint256 insurance;
        uint256 treasury;
        uint256 reserve1;
        uint256 reserve2;
    }

    struct Input {
        uint256 modelId;
        uint256 count;
    }

    struct Model {
        uint8 country;
        uint8 species;
        uint8 deactive;
        address planter;
        uint256 price;
        uint256 count;
        uint256 start;
        uint256 lastFund;
        uint256 lastPlant;
        uint256 lastReservePlant;
    }

    //⇒ modelId should start from number 1

    mapping(uint256 => Model) public models;

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
        lastTreeAssigned = 1000000001;

        accessRestriction = candidateContract;

        isMarketPlace = true;
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

    /// @inheritdoc IMarketPlace
    function setTreeFactoryAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreeFactoryV2 candidateContract = ITreeFactoryV2(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setAttributesAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setPlanterFundAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFundContract = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setRegularSaleAddress(address _address)
        external
        override
        onlyAdmin
    {
        IRegularSaleV2 candidateContract = IRegularSaleV2(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    /// @inheritdoc IMarketPlace
    function setPlanterAddress(address _address) external override onlyAdmin {
        IPlanterV2 candidateContract = IPlanterV2(_address);
        require(candidateContract.isPlanter());
        planter = candidateContract;
    }

    function addModel(
        uint8 _country,
        uint8 _species,
        uint256 _price,
        uint256 _count
    ) external {
        (uint8 planterType, , , , , , , ) = planter.planters(msg.sender);

        require(
            planterType == 1 || planterType == 2,
            "MarketPlace:Invalid Planter."
        );

        require(_count > 0 && _count < 10001, "MarketPlace:Invalid count.");

        modelId.increment();
        uint256 _modelId = modelId.current();

        Model storage modelData = models[_modelId];

        modelData.country = _country;
        modelData.species = _species;
        modelData.count = _count;
        modelData.price = _price;
        modelData.planter = msg.sender;
        modelData.start = lastTreeAssigned;
        modelData.lastFund = lastTreeAssigned - 1;
        modelData.lastPlant = lastTreeAssigned - 1;
        modelData.lastReservePlant = lastTreeAssigned - 1;

        lastTreeAssigned += _count;
    }

    function updateModelData(
        uint256 _modelId,
        uint8 _species,
        uint8 _country
    ) external {
        Model storage modelData = models[_modelId];

        require(modelData.planter == msg.sender, "MarketPlace:Access Denied.");

        require(
            modelData.lastFund == modelData.lastPlant &&
                modelData.lastPlant == modelData.start - 1,
            "MarketPlace:Tree Planted or Funded."
        );

        modelData.country = _country;
        modelData.species = _species;
    }

    function updatePrice(uint256 _modelId, uint256 _price) external {
        Model storage modelData = models[_modelId];

        require(modelData.planter == msg.sender, "MarketPlace:Access Denied.");

        modelData.price = _price;
    }

    function deactiveModel(uint256 _modelId) external {
        Model storage modelData = models[_modelId];
        require(modelData.planter == msg.sender, "MarketPlace:Access Denied.");
        modelData.deactive = 1;
    }

    function deleteModel(uint256 _modelId) external {
        Model storage model = models[_modelId];

        require(model.planter == msg.sender, "MarketPlace:Access Denied");

        require(
            model.lastFund == model.lastPlant &&
                model.lastPlant == model.start - 1,
            "MarketPlace:Tree Planted or Funded"
        );

        if (_modelId == modelId.current()) {
            modelId.decrement();
            lastTreeAssigned -= model.count;
        }

        delete models[_modelId];
    }

    function fundTree(
        Input[] memory _input,
        address _referrer,
        address _recipient
    ) external {
        address recipient = _recipient == address(0)
            ? _msgSender()
            : _recipient;

        require(recipient != _referrer, "MarketPlace:Invalid referrer.");

        uint256 totalPrice = 0;
        uint256 totalCount = 0;
        bool success = false;

        Model storage modelData;

        for (uint256 i = 0; i < _input.length; i++) {
            modelData = models[_input[i].modelId];

            require(
                modelData.lastFund + _input[i].count <
                    modelData.start + modelData.count &&
                    modelData.deactive == 0,
                "MarketPlace:Invalid count."
            );

            totalPrice += modelData.price * _input[i].count;
            totalCount += _input[i].count;
        }

        require(totalCount < 101, "MarketPlace:total count exceeded 100.");

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "MarketPlace:Insufficient balance."
        );

        success = daiToken.transferFrom(
            _msgSender(),
            address(daiFund),
            totalPrice
        );
        require(success, "MarketPlace:Unsuccessful transfer.");

        TotalBalances memory totalBalances;

        for (uint256 i = 0; i < _input.length; i++) {
            modelData = models[_input[i].modelId];
            uint256 tempTreeId = modelData.lastFund;

            uint256 treePrice = modelData.price;

            treeFactory.mintTreeMarketPlace(
                tempTreeId + 1,
                _input[i].count,
                recipient
            );

            for (uint256 j = 1; j <= _input[i].count; j++) {
                success = attribute.createAttribute(tempTreeId + j, 1);

                require(success, "MarketPlace:Attribute not generated.");

                (
                    uint16 planterShare,
                    uint16 ambassadorShare,
                    uint16 researchShare,
                    uint16 localDevelopmentShare,
                    uint16 insuranceShare,
                    uint16 treasuryShare,
                    uint16 reserve1Share,
                    uint16 reserve2Share
                ) = allocation.findAllocationData(tempTreeId + j);

                totalBalances.planter += (treePrice * planterShare) / 10000;
                totalBalances.ambassador +=
                    (treePrice * ambassadorShare) /
                    10000;
                totalBalances.research += (treePrice * researchShare) / 10000;
                totalBalances.localDevelopment +=
                    (treePrice * localDevelopmentShare) /
                    10000;
                totalBalances.insurance += (treePrice * insuranceShare) / 10000;
                totalBalances.treasury += (treePrice * treasuryShare) / 10000;
                totalBalances.reserve1 += (treePrice * reserve1Share) / 10000;
                totalBalances.reserve2 += (treePrice * reserve2Share) / 10000;

                planterFundContract.updateProjectedEarnings(
                    tempTreeId + j,
                    (treePrice * planterShare) / 10000,
                    (treePrice * ambassadorShare) / 10000
                );
            }

            modelData.lastFund += _input[i].count;
        }

        daiFund.fundTreeBatch(
            totalBalances.planter,
            totalBalances.ambassador,
            totalBalances.research,
            totalBalances.localDevelopment,
            totalBalances.insurance,
            totalBalances.treasury,
            totalBalances.reserve1,
            totalBalances.reserve2
        );

        if (_referrer != address(0)) {
            regularSale.updateReferrerClaimableTreesDai(_referrer, totalCount);
        }
    }

    function updateLastReservePlantedOfModel(address _sender, uint256 _modelId)
        external
        override
        onlyTreejerContract
    {
        require(
            _modelId > 0 && _modelId <= modelId.current(),
            "modelId is incorrect"
        );

        Model storage modelData = models[_modelId];

        bool canPlant = planter.manageMarketPlaceTreePermission(
            _sender,
            modelData.planter
        );

        require(canPlant, "MarketPlace:Permission denied.");

        uint256 lastReservePlantTemp = modelData.lastReservePlant + 1;

        require(
            lastReservePlantTemp < modelData.start + modelData.count,
            "MarketPlace:All tree planted."
        );

        modelData.lastReservePlant = lastReservePlantTemp;
    }

    function reduceLastReservePlantedOfModel(uint256 _modelId)
        external
        override
        onlyTreejerContract
    {
        models[_modelId].lastReservePlant -= 1;
    }

    function updateLastPlantedOfModel(uint256 _modelId)
        external
        override
        onlyTreejerContract
        returns (uint256)
    {
        Model storage modelData = models[_modelId];

        uint256 lastPlantTemp = modelData.lastPlant + 1;

        modelData.lastPlant = lastPlantTemp;

        return lastPlantTemp;
    }
}
