// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipientV2.sol";
import "../tree/ITree.sol";
import "../treasury/IPlanterFund.sol";
import "../planter/IPlanterV2.sol";
import "./ITreeFactoryV2.sol";

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

/** @title TreeFactory Contract */
contract TreeFactoryV2 is Initializable, RelayRecipientV2, ITreeFactoryV2 {
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

    //------- data for v2

    bytes32 public constant PLANT_ASSIGN_TREE_TYPE_HASH =
        keccak256(
            "plantAssignTree(uint256 nonce,uint256 treeId,string treeSpecs,uint64 birthDate,uint16 countryCode)"
        );

    bytes32 public constant PLANT_TREE_TYPE_HASH =
        keccak256(
            "plantTree(uint256 nonce,string treeSpecs,uint64 birthDate,uint16 countryCode)"
        );

    bytes32 public constant VERIFY_UPDATE_TYPE_HASH =
        keccak256("updateTree(uint256 nonce,uint256 treeId,string treeSpecs)");

    mapping(address => uint256) public plantersNonce; // =======> address planter => nonce

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has verifier role */
    modifier onlyVerifier() {
        accessRestriction.ifVerifier(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier to check msg.sender has script role */
    modifier onlyScript() {
        accessRestriction.ifScript(msg.sender);
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
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

    /// @inheritdoc ITreeFactoryV2
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

    function setData(uint8 _selector, address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        if (_selector == 0) {
            IPlanterFund candidateContract = IPlanterFund(_address);

            require(candidateContract.isPlanterFund());

            planterFund = candidateContract;
        } else if (_selector == 1) {
            IPlanterV2 candidateContract = IPlanterV2(_address);

            require(candidateContract.isPlanter());

            planterContract = candidateContract;
        } else if (_selector == 2) {
            ITree candidateContract = ITree(_address);

            require(candidateContract.isTree());

            treeToken = candidateContract;
        }
    }

    /// @inheritdoc ITreeFactoryV2
    function setUpdateInterval(uint256 _seconds)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        treeUpdateInterval = _seconds;

        emit TreeUpdateIntervalChanged();
    }

    /// @inheritdoc ITreeFactoryV2
    function listTree(uint256 _treeId, string calldata _treeSpecs)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        _setTreeListingData(_treeId, _treeSpecs);
    }

    /// @inheritdoc ITreeFactoryV2
    function listTreeBatch(
        uint256[] calldata _treeIds,
        string[] calldata _treeSpecs
    ) external override ifNotPaused onlyDataManager {
        require(_treeIds.length == _treeSpecs.length, "invalid inputs");

        for (uint256 i = 0; i < _treeIds.length; i++) {
            _setTreeListingData(_treeIds[i], _treeSpecs[i]);
        }
    }

    function _setTreeListingData(uint256 _treeId, string calldata _treeSpecs)
        private
    {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 0, "Duplicate tree");

        treeData.treeStatus = 2;
        treeData.treeSpecs = _treeSpecs;

        emit TreeListed(_treeId);
    }

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
    function assignTree(uint256 _treeId, address _planter)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        _setAssignTreeData(_treeId, _planter);
    }

    /// @inheritdoc ITreeFactoryV2
    function assignTreeBatch(
        uint256[] calldata _treeIds,
        address[] calldata _planters
    ) external override ifNotPaused onlyDataManager {
        require(_treeIds.length == _planters.length, "invalid inputs");

        for (uint256 i = 0; i < _treeIds.length; i++) {
            _setAssignTreeData(_treeIds[i], _planters[i]);
        }
    }

    function _setAssignTreeData(uint256 _treeId, address _planter) private {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "Invalid tree");

        require(planterContract.canAssignTree(_planter), "Not allowed planter");

        treeData.planter = _planter;

        emit TreeAssigned(_treeId);
    }

    function verifyAssignedTreeBatchWithSignature(
        VerifyAssignedTreeSignature[] calldata _newAssignTree
    ) external ifNotPaused onlyVerifier {
        bytes32 domainSeparator = _buildDomainSeparator();

        unchecked {
            for (uint256 i = 0; i < _newAssignTree.length; i++) {
                VerifyAssignedTreeSignature
                    memory verifyAssignedTreeData = _newAssignTree[i];

                uint256 planterNonce = plantersNonce[
                    verifyAssignedTreeData.planter
                ];

                for (
                    uint256 j = 0;
                    j < verifyAssignedTreeData.data.length;
                    j++
                ) {
                    PlantAssignedTreeSignature
                        memory plantAssignedTreeData = verifyAssignedTreeData
                            .data[j];

                    _checkSigner(
                        domainSeparator,
                        keccak256(
                            abi.encode(
                                PLANT_ASSIGN_TREE_TYPE_HASH,
                                plantAssignedTreeData.nonce,
                                plantAssignedTreeData.treeId,
                                keccak256(
                                    bytes(plantAssignedTreeData.treeSpecs)
                                ),
                                plantAssignedTreeData.birthDate,
                                plantAssignedTreeData.countryCode
                            )
                        ),
                        verifyAssignedTreeData.planter,
                        plantAssignedTreeData.v,
                        plantAssignedTreeData.r,
                        plantAssignedTreeData.s
                    );

                    require(
                        planterNonce < plantAssignedTreeData.nonce,
                        "planter nonce is incorrect"
                    );

                    planterNonce = plantAssignedTreeData.nonce;

                    //-------------------------->update tree data

                    _setVerifyAssignedTreeData(
                        plantAssignedTreeData.treeId,
                        verifyAssignedTreeData.planter,
                        plantAssignedTreeData.treeSpecs,
                        plantAssignedTreeData.birthDate,
                        plantAssignedTreeData.countryCode
                    );
                }
                plantersNonce[verifyAssignedTreeData.planter] = planterNonce;
            }
        }
    }

    function verifyAssignedTreeWithSignature(
        uint256 nonce,
        address _planter,
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external ifNotPaused onlyVerifier {
        require(plantersNonce[_planter] < nonce, "planter nonce is incorrect");

        _checkSigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    PLANT_ASSIGN_TREE_TYPE_HASH,
                    nonce,
                    _treeId,
                    keccak256(bytes(_treeSpecs)),
                    _birthDate,
                    _countryCode
                )
            ),
            _planter,
            _v,
            _r,
            _s
        );

        _setVerifyAssignedTreeData(
            _treeId,
            _planter,
            _treeSpecs,
            _birthDate,
            _countryCode
        );

        plantersNonce[_planter] = nonce;
    }

    function _setVerifyAssignedTreeData(
        uint256 _treeId,
        address _planter,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) private {
        //-------------------------->update tree data

        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "Invalid tree status");

        //----------> check can plant
        require(
            planterContract.manageAssignedTreePermission(
                _planter,
                treeData.planter
            ),
            "Permission denied"
        );

        if (_planter != treeData.planter) {
            treeData.planter = _planter;
        }

        treeData.countryCode = _countryCode;
        treeData.birthDate = _birthDate;
        treeData.plantDate = block.timestamp.toUint64();
        treeData.treeStatus = 4;

        treeData.treeSpecs = _treeSpecs;
    }

    function _setVerifyUpdateData(
        uint256 _treeId,
        address _planter,
        string memory _treeSpecs
    ) private {
        TreeData storage treeData = trees[_treeId];

        require(treeData.planter == _planter, "Not owned tree");

        require(treeData.treeStatus > 3, "Tree not planted");

        require(
            block.timestamp >=
                treeData.plantDate +
                    ((treeData.treeStatus * 3600) + treeUpdateInterval),
            "Early update"
        );

        uint32 age = ((block.timestamp - treeData.plantDate) / 3600).toUint32();

        if (age > treeData.treeStatus) {
            treeData.treeStatus = age;
        }

        treeData.treeSpecs = _treeSpecs;

        if (treeToken.exists(_treeId)) {
            planterFund.updatePlanterTotalClaimed(
                _treeId,
                treeData.planter,
                treeData.treeStatus
            );
        }

        emit TreeUpdatedVerified(_treeId);
    }

    function verifyUpdateBatchWithSignature(
        VerifyUpdateData[] calldata _verifyUpdateData
    ) external override ifNotPaused onlyVerifier {
        bytes32 domainSeparator = _buildDomainSeparator();
        unchecked {
            for (uint256 i = 0; i < _verifyUpdateData.length; i++) {
                VerifyUpdateData memory verifyUpdateData = _verifyUpdateData[i];

                uint256 planterNonce = plantersNonce[verifyUpdateData.planter];

                for (
                    uint256 j = 0;
                    j < verifyUpdateData.updateData.length;
                    j++
                ) {
                    UpdateSignature memory updateData = verifyUpdateData
                        .updateData[j];

                    require(
                        planterNonce < updateData.nonce,
                        "planter nonce is incorrect"
                    );

                    planterNonce = updateData.nonce;

                    _checkSigner(
                        domainSeparator,
                        keccak256(
                            abi.encode(
                                VERIFY_UPDATE_TYPE_HASH,
                                updateData.nonce,
                                updateData.treeId,
                                keccak256(bytes(updateData.treeSpecs))
                            )
                        ),
                        verifyUpdateData.planter,
                        updateData.v,
                        updateData.r,
                        updateData.s
                    );

                    _setVerifyUpdateData(
                        updateData.treeId,
                        verifyUpdateData.planter,
                        updateData.treeSpecs
                    );
                }

                plantersNonce[verifyUpdateData.planter] = planterNonce;
            }
        }
    }

    function verifyUpdateWithSignature(
        address _planter,
        uint256 _nonce,
        uint256 _treeId,
        string memory _treeSpecs,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external ifNotPaused onlyVerifier {
        require(plantersNonce[_planter] < _nonce, "planter nonce is incorrect");

        _checkSigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    VERIFY_UPDATE_TYPE_HASH,
                    _nonce,
                    _treeId,
                    keccak256(bytes(_treeSpecs))
                )
            ),
            _planter,
            _v,
            _r,
            _s
        );

        _setVerifyUpdateData(_treeId, _planter, _treeSpecs);

        plantersNonce[_planter] = _nonce;
    }

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
    function mintAssignedTree(uint256 _treeId, address _funder)
        external
        override
        onlyTreejerContract
    {
        trees[_treeId].saleType = 0;
        treeToken.mint(_funder, _treeId);
    }

    /// @inheritdoc ITreeFactoryV2
    function resetSaleType(uint256 _treeId)
        external
        override
        onlyTreejerContract
    {
        trees[_treeId].saleType = 0;
    }

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
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

    function verifyTreeBatchWithSignature(
        VerifyTreeSignature[] calldata _newTree
    ) external ifNotPaused onlyVerifier {
        uint256 tempLastRegularTreeId = lastRegualarTreeId + 1;

        bytes32 domainSeparator = _buildDomainSeparator();

        unchecked {
            for (uint256 i = 0; i < _newTree.length; i++) {
                VerifyTreeSignature memory verifyTreeSignature = _newTree[i];

                require(
                    planterContract.manageTreePermissionBatch(
                        verifyTreeSignature.planter,
                        verifyTreeSignature.data.length.toUint32()
                    )
                );

                uint256 planterNonce = plantersNonce[
                    verifyTreeSignature.planter
                ];

                for (uint256 j = 0; j < verifyTreeSignature.data.length; j++) {
                    PlantTreeSignature
                        memory plantTreeData = verifyTreeSignature.data[j];

                    require(
                        planterNonce < plantTreeData.nonce,
                        "planter nonce is incorrect"
                    );

                    planterNonce = plantTreeData.nonce;

                    _checkSigner(
                        domainSeparator,
                        keccak256(
                            abi.encode(
                                PLANT_TREE_TYPE_HASH,
                                plantTreeData.nonce,
                                plantTreeData.treeSpecs,
                                plantTreeData.birthDate,
                                plantTreeData.countryCode
                            )
                        ),
                        verifyTreeSignature.planter,
                        plantTreeData.v,
                        plantTreeData.r,
                        plantTreeData.s
                    );

                    tempLastRegularTreeId = _verifyTreeData(
                        tempLastRegularTreeId,
                        plantTreeData.countryCode,
                        plantTreeData.birthDate,
                        plantTreeData.treeSpecs,
                        verifyTreeSignature.planter
                    );

                    tempLastRegularTreeId += 1;
                }

                plantersNonce[verifyTreeSignature.planter] = planterNonce;
            }
        }

        lastRegualarTreeId = tempLastRegularTreeId;
    }

    function _verifyTreeData(
        uint256 _tempLastRegularTreeId,
        uint16 _countryCode,
        uint64 _birthDate,
        string memory _treeSpecs,
        address _planter
    ) private returns (uint256) {
        uint256 tempLastRegularTreeId = _tempLastRegularTreeId;
        while (
            !(trees[tempLastRegularTreeId].treeStatus == 0 &&
                trees[tempLastRegularTreeId].saleType == 0)
        ) {
            tempLastRegularTreeId = tempLastRegularTreeId + 1;
        }

        TreeData storage treeData = trees[tempLastRegularTreeId];

        treeData.plantDate = block.timestamp.toUint64();
        treeData.countryCode = uint16(_countryCode);
        treeData.birthDate = _birthDate;
        treeData.treeSpecs = _treeSpecs;
        treeData.planter = _planter;
        treeData.treeStatus = 4;

        if (!treeToken.exists(tempLastRegularTreeId)) {
            treeData.saleType = 4;
        }

        return tempLastRegularTreeId;
    }

    function verifyTreeWithSignature(
        uint256 nonce,
        address _planter,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external ifNotPaused onlyVerifier {
        require(planterContract.manageTreePermission(_planter));

        require(plantersNonce[_planter] < nonce, "planter nonce is incorrect");
        bytes32 domainSeparator = _buildDomainSeparator();

        _checkSigner(
            domainSeparator,
            keccak256(
                abi.encode(
                    PLANT_TREE_TYPE_HASH,
                    nonce,
                    _treeSpecs,
                    _birthDate,
                    _countryCode
                )
            ),
            _planter,
            _v,
            _r,
            _s
        );

        //-------------------------->update tree data

        lastRegualarTreeId = _verifyTreeData(
            lastRegualarTreeId + 1,
            _countryCode,
            _birthDate,
            _treeSpecs,
            _planter
        );

        plantersNonce[_planter] = nonce;
        // tempLastRegularTreeId += 1;//extra

        // lastRegualarTreeId = tempLastRegularTreeId;//extra
    }

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
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

    /// @inheritdoc ITreeFactoryV2
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

    function _toTypedDataHash(bytes32 domainSeperator, bytes32 structHash)
        private
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked("\x19\x01", domainSeperator, structHash)
            );
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("Treejer Protocol")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(this)
                )
            );
    }

    function _checkSigner(
        bytes32 _domainSeparator,
        bytes32 _hashStruct,
        address _planter,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) private pure {
        bytes32 hash = _toTypedDataHash(_domainSeparator, _hashStruct);

        address signer = ecrecover(hash, _v, _r, _s);

        require(signer == _planter, "MyFunction: invalid signature");
    }
}
