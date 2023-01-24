// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../tree/ITree.sol";
import "../treasury/IPlanterFund.sol";
import "../planter/IPlanterV2.sol";
import "./ITreeFactory.sol";

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

/** @title TreeFactory Contract */
contract TreeFactoryV2 is Initializable, RelayRecipient, ITreeFactory {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;

    struct TreeData {
        address planter;
        uint256 species;
        uint32 countryCode;
        uint32 saleType;
        uint64 treeStatus;
        uint64 plantDate;
        uint64 birthDate;
        string treeSpecs;
    }

    struct TreeUpdate {
        string updateSpecs;
        uint64 updateStatus;
    }

    struct TempTree {
        uint64 birthDate;
        uint64 plantDate;
        uint64 countryCode;
        uint64 otherData;
        address planter;
        string treeSpecs;
    }

    CountersUpgradeable.Counter private _pendingRegularTreeId;

    /** NOTE {isTreeFactory} set inside the initialize to {true} */
    bool public override isTreeFactory;
    uint256 public override lastRegualarTreeId;
    uint256 public override treeUpdateInterval;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IPlanterFund public planterFund;
    IPlanterV2 public planterContract;

    /** NOTE mapping of treeId to TreeData Struct */
    mapping(uint256 => TreeData) public override trees;
    /** NOTE mapping of treeId to TreeUpdate struct */
    mapping(uint256 => TreeUpdate) public override treeUpdates;
    /** NOTE mapping of treeId to TempTree struct */
    mapping(uint256 => TempTree) public override tempTrees;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has verifier role */
    modifier onlyVerifier() {
        accessRestriction.ifVerifier(_msgSender());
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier to check msg.sender has script role */
    modifier onlyScript() {
        accessRestriction.ifScript(_msgSender());
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check tree has not pending update */
    modifier notHavePendingUpdate(uint256 _treeId) {
        require(
            treeUpdates[_treeId].updateStatus != 1,
            "Pending update exists"
        );
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc ITreeFactory
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isTreeFactory = true;
        accessRestriction = candidateContract;
        lastRegualarTreeId = 10000;
        treeUpdateInterval = 604800;
    }

    /// @inheritdoc ITreeFactory
    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /// @inheritdoc ITreeFactory
    function setPlanterFundAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFund = candidateContract;
    }

    /// @inheritdoc ITreeFactory
    function setPlanterContractAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterV2 candidateContract = IPlanterV2(_address);

        require(candidateContract.isPlanter());

        planterContract = candidateContract;
    }

    /// @inheritdoc ITreeFactory
    function setTreeTokenAddress(address _address) external override onlyAdmin {
        ITree candidateContract = ITree(_address);

        require(candidateContract.isTree());

        treeToken = candidateContract;
    }

    /// @inheritdoc ITreeFactory
    function setUpdateInterval(uint256 _seconds)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        treeUpdateInterval = _seconds;

        emit TreeUpdateIntervalChanged();
    }

    /// @inheritdoc ITreeFactory
    function listTree(uint256 _treeId, string calldata _treeSpecs)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        require(trees[_treeId].treeStatus == 0, "Duplicate tree");

        TreeData storage treeData = trees[_treeId];

        treeData.treeStatus = 2;
        treeData.treeSpecs = _treeSpecs;

        emit TreeListed(_treeId);
    }

    function resetTreeStatusBatch(uint256 _startTreeId, uint256 _endTreeId)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].treeStatus == 2) {
                trees[i].treeStatus = 0;
            }
        }

        emit TreeStatusBatchReset();
    }

    /// @inheritdoc ITreeFactory
    function assignTree(uint256 _treeId, address _planter)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "Invalid tree");

        require(planterContract.canAssignTree(_planter), "Not allowed planter");

        treeData.planter = _planter;

        emit TreeAssigned(_treeId);
    }

    /// @inheritdoc ITreeFactory
    function plantAssignedTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external override ifNotPaused {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "Invalid tree status");

        bool canPlant = planterContract.manageAssignedTreePermission(
            _msgSender(),
            treeData.planter
        );

        require(canPlant, "Permission denied");

        if (_msgSender() != treeData.planter) {
            treeData.planter = _msgSender();
        }

        TreeUpdate storage treeUpdateData = treeUpdates[_treeId];

        treeUpdateData.updateSpecs = _treeSpecs;
        treeUpdateData.updateStatus = 1;

        treeData.countryCode = _countryCode;
        treeData.birthDate = _birthDate;
        treeData.plantDate = block.timestamp.toUint64();
        treeData.treeStatus = 3;

        emit AssignedTreePlanted(_treeId);
    }

    /// @inheritdoc ITreeFactory
    function verifyAssignedTree(uint256 _treeId, bool _isVerified)
        external
        override
        ifNotPaused
        onlyVerifier
    {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 3, "Invalid tree status");

        TreeUpdate storage treeUpdateData = treeUpdates[_treeId];

        if (_isVerified) {
            treeData.treeSpecs = treeUpdateData.updateSpecs;
            treeData.treeStatus = 4;
            treeUpdateData.updateStatus = 3;

            emit AssignedTreeVerified(_treeId);
        } else {
            treeData.treeStatus = 2;
            treeUpdateData.updateStatus = 2;
            planterContract.reducePlantedCount(treeData.planter);

            emit AssignedTreeRejected(_treeId);
        }
    }

    //ssssssssssss

    struct DataSign1 {
        uint256 _treeId;
        string _treeSpecs;
        uint64 _birthDate;
        uint16 _countryCode;
        bytes signature;
    }

    struct VeriftTreeData1 {
        address planter;
        DataSign1[] data;
    }

    function verifyAssignedTreeSignatureBatch(
        VeriftTreeData1[] calldata _newAssignTree
    ) external {
        bytes32 eip712DomainHash = _buildDomainSeparator();

        unchecked {
            for (uint256 i = 0; i < _newAssignTree.length; i++) {
                for (uint256 j = 0; j < _newAssignTree[i].data.length; j++) {
                    DataSign1 memory dataSign = _newAssignTree[i].data[j];

                    bytes32 hashStruct = keccak256(
                        abi.encode(
                            keccak256(
                                "plantTree(string sender,uint64 _birthDate,uint16 _countryCode)"
                            ),
                            dataSign._treeSpecs,
                            dataSign._birthDate,
                            dataSign._countryCode
                        )
                    );

                    bytes32 hash = ECDSAUpgradeable.toTypedDataHash(
                        eip712DomainHash,
                        hashStruct
                    );

                    address signer = ECDSAUpgradeable.recover(
                        hash,
                        dataSign.signature
                    );

                    require(
                        signer == _newAssignTree[i].planter,
                        "MyFunction: invalid signature"
                    );

                    //-------------------------->update tree data

                    TreeData storage treeData = trees[dataSign._treeId];

                    require(treeData.treeStatus == 2, "Invalid tree status");

                    bool canPlant = planterContract
                        .manageAssignedTreePermission(signer, treeData.planter);

                    require(canPlant, "Permission denied");

                    if (signer != treeData.planter) {
                        treeData.planter = signer;
                    }

                    TreeUpdate storage treeUpdateData = treeUpdates[
                        dataSign._treeId
                    ];

                    treeData.countryCode = dataSign._countryCode;
                    treeData.birthDate = dataSign._birthDate;
                    treeData.plantDate = block.timestamp.toUint64();
                    treeData.treeStatus = 4;

                    treeData.treeSpecs = dataSign._treeSpecs;
                }
            }
        }
    }

    /// @inheritdoc ITreeFactory
    function updateTree(uint256 _treeId, string memory _treeSpecs)
        external
        override
        ifNotPaused
    {
        require(trees[_treeId].planter == _msgSender(), "Not owned tree");

        require(trees[_treeId].treeStatus > 3, "Tree not planted");

        require(treeUpdates[_treeId].updateStatus != 1, "Pending update");

        require(
            block.timestamp >=
                trees[_treeId].plantDate +
                    ((trees[_treeId].treeStatus * 3600) + treeUpdateInterval),
            "Early update"
        );

        TreeUpdate storage treeUpdateData = treeUpdates[_treeId];

        treeUpdateData.updateSpecs = _treeSpecs;
        treeUpdateData.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

    /// @inheritdoc ITreeFactory
    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        override
        ifNotPaused
        onlyVerifier
    {
        require(treeUpdates[_treeId].updateStatus == 1, "Not pending update");

        require(trees[_treeId].treeStatus > 3, "Tree not planted");

        TreeUpdate storage treeUpdateData = treeUpdates[_treeId];

        if (_isVerified) {
            TreeData storage treeData = trees[_treeId];

            treeUpdateData.updateStatus = 3;

            uint32 age = ((block.timestamp - treeData.plantDate) / 3600)
                .toUint32();

            if (age > treeData.treeStatus) {
                treeData.treeStatus = age;
            }

            treeData.treeSpecs = treeUpdateData.updateSpecs;

            if (treeToken.exists(_treeId)) {
                planterFund.updatePlanterTotalClaimed(
                    _treeId,
                    treeData.planter,
                    treeData.treeStatus
                );
            }

            emit TreeUpdatedVerified(_treeId);
        } else {
            treeUpdateData.updateStatus = 2;

            emit TreeUpdateRejected(_treeId);
        }
    }

    /// @inheritdoc ITreeFactory
    function manageSaleType(uint256 _treeId, uint32 _saleType)
        external
        override
        onlyTreejerContract
        returns (uint32)
    {
        if (treeToken.exists(_treeId)) {
            return 1;
        }

        TreeData storage treeData = trees[_treeId];

        uint32 currentSaleType = treeData.saleType;

        if (currentSaleType == 0) {
            treeData.saleType = _saleType;
            if (treeData.treeStatus == 0) {
                treeData.treeStatus = 2;
            }
        }

        return currentSaleType;
    }

    /// @inheritdoc ITreeFactory
    function mintAssignedTree(uint256 _treeId, address _funder)
        external
        override
        onlyTreejerContract
    {
        trees[_treeId].saleType = 0;
        treeToken.mint(_funder, _treeId);
    }

    /// @inheritdoc ITreeFactory
    function resetSaleType(uint256 _treeId)
        external
        override
        onlyTreejerContract
    {
        trees[_treeId].saleType = 0;
    }

    /// @inheritdoc ITreeFactory
    function resetSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _saleType
    ) external override onlyTreejerContract {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            TreeData storage treeData = trees[i];

            if (treeData.saleType == _saleType) {
                treeData.saleType = 0;

                if (treeData.treeStatus == 2) {
                    treeData.planter = address(0);
                }
            }
        }
    }

    /// @inheritdoc ITreeFactory
    function manageSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _saleType
    ) external override onlyTreejerContract returns (bool) {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].saleType > 0 || treeToken.exists(i)) {
                return false;
            }
        }
        for (uint256 j = _startTreeId; j < _endTreeId; j++) {
            TreeData storage treeData = trees[j];

            treeData.saleType = _saleType;

            if (treeData.treeStatus == 0) {
                treeData.treeStatus = 2;
            }
        }
        return true;
    }

    struct DataSign {
        string _treeSpecs;
        uint64 _birthDate;
        uint16 _countryCode;
        bytes signature;
    }

    struct VeriftTreeData {
        address planter;
        DataSign[] data;
    }

    /// @inheritdoc ITreeFactory
    function plantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external override ifNotPaused {
        require(planterContract.manageTreePermission(_msgSender()));

        tempTrees[_pendingRegularTreeId.current()] = TempTree(
            _birthDate,
            block.timestamp.toUint64(),
            _countryCode,
            0,
            _msgSender(),
            _treeSpecs
        );

        emit TreePlanted(_pendingRegularTreeId.current());

        _pendingRegularTreeId.increment();
    }

    /// @inheritdoc ITreeFactory
    function updateLastRegualarTreeId(uint256 _lastRegualarTreeId)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        require(
            _lastRegualarTreeId > lastRegualarTreeId,
            "Invalid lastRegualarTreeId"
        );

        lastRegualarTreeId = _lastRegualarTreeId;

        emit LastRegualarTreeIdUpdated(_lastRegualarTreeId);
    }

    /// @inheritdoc ITreeFactory
    function verifyTree(uint256 _tempTreeId, bool _isVerified)
        external
        override
        ifNotPaused
        onlyVerifier
    {
        TempTree storage tempTreeData = tempTrees[_tempTreeId];

        require(tempTreeData.plantDate > 0, "Regular Tree not exists");

        if (_isVerified) {
            uint256 tempLastRegularTreeId = lastRegualarTreeId + 1;

            while (
                !(trees[tempLastRegularTreeId].treeStatus == 0 &&
                    trees[tempLastRegularTreeId].saleType == 0)
            ) {
                tempLastRegularTreeId = tempLastRegularTreeId + 1;
            }

            lastRegualarTreeId = tempLastRegularTreeId;

            TreeData storage treeData = trees[lastRegualarTreeId];

            treeData.plantDate = tempTreeData.plantDate;
            treeData.countryCode = uint16(tempTreeData.countryCode);
            treeData.birthDate = tempTreeData.birthDate;
            treeData.treeSpecs = tempTreeData.treeSpecs;
            treeData.planter = tempTreeData.planter;
            treeData.treeStatus = 4;

            if (!treeToken.exists(lastRegualarTreeId)) {
                treeData.saleType = 4;
            }
            emit TreeVerified(lastRegualarTreeId, _tempTreeId);
        } else {
            emit TreeRejected(_tempTreeId);
        }

        delete tempTrees[_tempTreeId];
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("plantTree_treejer")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(this)
                )
            );
    }

    function verifyTreeSignatureBatch(VeriftTreeData[] calldata _newTree)
        external
        ifNotPaused
        onlyVerifier
    {
        bytes32 eip712DomainHash = _buildDomainSeparator();

        unchecked {
            for (uint256 i = 0; i < _newTree.length; i++) {
                require(
                    planterContract.manageTreePermission(_newTree[i].planter) //(_newTree[i].planter,_newTree[i].data.length)
                );

                for (uint256 j = 0; j < _newTree[i].data.length; j++) {
                    DataSign memory dataSign = _newTree[i].data[j];

                    bytes32 hashStruct = keccak256(
                        abi.encode(
                            keccak256(
                                "plantTree(string sender,uint64 _birthDate,uint16 _countryCode)"
                            ),
                            dataSign._treeSpecs,
                            dataSign._birthDate,
                            dataSign._countryCode
                        )
                    );

                    bytes32 hash = ECDSAUpgradeable.toTypedDataHash(
                        eip712DomainHash,
                        hashStruct
                    );

                    address signer = ECDSAUpgradeable.recover(
                        hash,
                        dataSign.signature
                    );

                    require(
                        signer == _newTree[i].planter,
                        "MyFunction: invalid signature"
                    );

                    //-------------------------->update tree data

                    uint256 tempLastRegularTreeId = lastRegualarTreeId + 1;

                    while (
                        !(trees[tempLastRegularTreeId].treeStatus == 0 &&
                            trees[tempLastRegularTreeId].saleType == 0)
                    ) {
                        tempLastRegularTreeId = tempLastRegularTreeId + 1;
                    }

                    lastRegualarTreeId = tempLastRegularTreeId;

                    TreeData storage treeData = trees[lastRegualarTreeId];

                    treeData.plantDate = block.timestamp.toUint64();
                    treeData.countryCode = uint16(dataSign._countryCode);
                    treeData.birthDate = dataSign._birthDate;
                    treeData.treeSpecs = dataSign._treeSpecs;
                    treeData.planter = signer;
                    treeData.treeStatus = 4;

                    if (!treeToken.exists(lastRegualarTreeId)) {
                        treeData.saleType = 4;
                    }
                }
            }
        }
    }

    /// @inheritdoc ITreeFactory
    function mintTree(uint256 _lastFundedTreeId, address _funder)
        external
        override
        onlyTreejerContract
        returns (uint256)
    {
        uint256 tempLastFundedTreeId = _lastFundedTreeId + 1;

        bool flag = (trees[tempLastFundedTreeId].treeStatus == 0 &&
            trees[tempLastFundedTreeId].saleType == 0) ||
            (trees[tempLastFundedTreeId].treeStatus > 3 &&
                trees[tempLastFundedTreeId].saleType == 4);

        while (!flag) {
            tempLastFundedTreeId = tempLastFundedTreeId + 1;

            flag =
                (trees[tempLastFundedTreeId].treeStatus == 0 &&
                    trees[tempLastFundedTreeId].saleType == 0) ||
                (trees[tempLastFundedTreeId].treeStatus > 3 &&
                    trees[tempLastFundedTreeId].saleType == 4);
        }

        trees[tempLastFundedTreeId].saleType = 0;

        treeToken.mint(_funder, tempLastFundedTreeId);

        return tempLastFundedTreeId;
    }

    /// @inheritdoc ITreeFactory
    function mintTreeById(uint256 _treeId, address _funder)
        external
        override
        onlyTreejerContract
    {
        TreeData storage treeData = trees[_treeId];

        require(
            treeData.treeStatus > 3 && treeData.saleType == 4,
            "Tree not planted"
        );

        treeData.saleType = 0;

        treeToken.mint(_funder, _treeId);
    }

    /// @inheritdoc ITreeFactory
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external
        override
        ifNotPaused
        onlyScript
        notHavePendingUpdate(_treeId)
    {
        trees[_treeId].treeSpecs = _treeSpecs;

        emit TreeSpecsUpdated(_treeId, _treeSpecs);
    }
}
