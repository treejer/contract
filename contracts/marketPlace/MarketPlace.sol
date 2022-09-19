// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./IMarketPlace.sol";
import "../treasury/IDaiFund.sol";
import "../gsn/RelayRecipient.sol";
import "../treasury/IAllocation.sol";
import "../tree/ITreeFactoryV2.sol";
import "../tree/IAttribute.sol";
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
        uint8 treeType;
        uint256 price;
        address planter;
        uint256 count;
        uint256 start;
        uint256 lastFund;
        uint256 lastPlant;
        uint8 deactive;
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

    function addModel(
        uint8 _country,
        uint8 _treeType,
        uint256 _price,
        uint256 _count
    ) external onlyPlanter {
        require(_count < 10001, "MarketPlace:invalid count");

        modelId.increment();
        uint256 _modelId = modelId.current();

        Model storage modelData = models[_modelId];

        modelData.country = _country;
        modelData.treeType = _treeType;
        modelData.count = _count;
        modelData.price = _price;
        modelData.planter = msg.sender;
        modelData.start = lastTreeAssigned;
        modelData.lastFund = lastTreeAssigned - 1;
        modelData.lastPlant = lastTreeAssigned - 1;

        lastTreeAssigned += _count;
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
        }

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
        uint256 totalCount = 0;

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

                require(success, "Attribute not generated");

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

            totalCount += _input[i].count;
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

    function updateModel(address _sender, uint256 _modelId)
        external
        override
        onlyTreejerContract
        returns (uint256)
    {
        Model storage modelData = models[_modelId];

        require(modelData.planter == _sender, "owner of model is incorrect");

        uint256 lastPlantTemp = modelData.lastPlant + 1;

        require(
            lastPlantTemp < modelData.start + modelData.count,
            "All tree planted"
        );

        modelData.lastPlant = lastPlantTemp;

        return lastPlantTemp;
    }

    function checkOwnerAndLastPlant(address _sender, uint256 _modelId)
        external
        view
        override
        onlyTreejerContract
    {
        Model storage modelData = models[_modelId];

        require(modelData.planter == _sender, "owner of model is incorrect");

        require(
            modelData.lastPlant + 1 < modelData.start + modelData.count,
            "All tree planted"
        );
    }
}
