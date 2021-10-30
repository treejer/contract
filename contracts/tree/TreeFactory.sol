// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../tree/ITree.sol";
import "../treasury/IPlanterFund.sol";
import "../planter/IPlanter.sol";

/** @title TreeFactory Contract */
contract TreeFactory is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;

    CountersUpgradeable.Counter private pendingRegularTreeId;

    /** NOTE {isTreeFactory} set inside the initialize to {true} */
    bool public isTreeFactory;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IPlanterFund public planterFund;
    IPlanter public planterContract;

    uint256 public lastRegualarTreeId;
    uint256 public treeUpdateInterval;

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
    /** NOTE mapping of treeId to TreeData Struct */
    mapping(uint256 => TreeData) public trees;
    /** NOTE mapping of treeId to TreeUpdate struct */
    mapping(uint256 => TreeUpdate) public treeUpdates;
    /** NOTE mapping of treeId to TempTree struct */
    mapping(uint256 => TempTree) public tempTrees;

    event TreeListed(uint256 treeId);
    event TreeAssigned(uint256 treeId);
    event AssignedTreePlanted(uint256 treeId);
    event AssignedTreeVerified(uint256 treeId);
    event AssignedTreeRejected(uint256 treeId);
    event TreeUpdated(uint256 treeId);
    event TreeUpdatedVerified(uint256 treeId);
    event TreeUpdateRejected(uint256 treeId);
    event TreePlanted(uint256 treeId);
    event TreeVerified(uint256 treeId, uint256 tempTreeId);
    event TreeRejected(uint256 treeId);
    event TreeUpdateIntervalChanged();
    event TreeSpecsUpdated(uint256 treeId, string treeSpecs);

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

    /** NOTE modifier for check treeId to be valid tree */
    modifier validTree(uint256 _treeId) {
        require(trees[_treeId].treeStatus > 0, "invalid tree");
        _;
    }

    /** NOTE modifier for check tree has not pending update */
    modifier notHavePendingUpdate(uint256 _treeId) {
        require(
            treeUpdates[_treeId].updateStatus != 1,
            "tree has pending update"
        );
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize AccessRestriction contract and set true for isTreeFactory
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     * NOTE set lastRegualarTreeId to 10000
     */
    function initialize(address _accessRestrictionAddress)
        external
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

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set PlanterFund contract address
     * @param _address set to the address of PlanterFund contract
     */
    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);

        require(candidateContract.isPlanterFund());

        planterFund = candidateContract;
    }

    /**
     * @dev admin set Planter contract address
     * @param _address set to the address of Planter contract
     */
    function setPlanterContractAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);

        require(candidateContract.isPlanter());

        planterContract = candidateContract;
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _address set to the address of TreeToken contract
     */
    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);

        require(candidateContract.isTree());

        treeToken = candidateContract;
    }

    /** @dev admin set the minimum time to send next update request
     * @param _seconds time to next update request
     */
    function setUpdateInterval(uint256 _seconds)
        external
        ifNotPaused
        onlyDataManager
    {
        treeUpdateInterval = _seconds;

        emit TreeUpdateIntervalChanged();
    }

    /**
     * @dev admin list tree
     * @param _treeId id of tree to list
     * @param _treeSpecs tree specs
     */
    function listTree(uint256 _treeId, string calldata _treeSpecs)
        external
        ifNotPaused
        onlyDataManager
    {
        require(trees[_treeId].treeStatus == 0, "duplicate tree");

        TreeData storage treeData = trees[_treeId];

        treeData.treeStatus = 2;
        treeData.treeSpecs = _treeSpecs;

        emit TreeListed(_treeId);
    }

    /**
     * @dev admin assign an existing tree to planter
     * NOTE tree must be not planted
     * @param _treeId id of tree to assign
     * @param _planter assignee planter
     */
    function assignTree(uint256 _treeId, address _planter)
        external
        ifNotPaused
        onlyDataManager
    {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "invalid tree to assign");

        require(
            planterContract.canAssignTree(_planter),
            "can't assign tree to planter"
        );

        treeData.planter = _planter;

        emit TreeAssigned(_treeId);
    }

    /**
     * @dev planter with permission to plant, can plant its assigned tree
     * @param _treeId id of tree to plant
     * @param _treeSpecs tree specs
     * @param _birthDate birth date of tree
     * @param _countryCode country code of tree
     */
    function plantAssignedTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external ifNotPaused {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 2, "invalid tree status for plant");

        bool canPlant = planterContract.manageAssignedTreePermission(
            _msgSender(),
            treeData.planter
        );

        require(canPlant, "planting permission denied");

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

    /**
     * @dev admin or allowed verifier can verify or reject plant for assigned tree.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     */
    function verifyAssignedTree(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
        onlyVerifier
    {
        TreeData storage treeData = trees[_treeId];

        require(treeData.treeStatus == 3, "invalid tree status");

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

    /**
     * @dev planter of tree send update request for tree
     * @param _treeId id of tree to update
     * @param _treeSpecs tree specs
     */
    function updateTree(uint256 _treeId, string memory _treeSpecs)
        external
        ifNotPaused
    {
        require(
            trees[_treeId].planter == _msgSender(),
            "Only Planter of tree can send update"
        );

        require(trees[_treeId].treeStatus > 3, "Tree not planted");

        require(
            treeUpdates[_treeId].updateStatus != 1,
            "update tree status is pending"
        );

        require(
            block.timestamp >=
                trees[_treeId].plantDate +
                    ((trees[_treeId].treeStatus * 3600) + treeUpdateInterval),
            "Update time not reach"
        );

        TreeUpdate storage treeUpdateData = treeUpdates[_treeId];

        treeUpdateData.updateSpecs = _treeSpecs;
        treeUpdateData.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verifiy or reject update request for tree.
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     * @param _treeId id of tree to verify update request
     * @param _isVerified true for verify and false for reject
     */
    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
        onlyVerifier
    {
        require(
            treeUpdates[_treeId].updateStatus == 1,
            "update status must be pending"
        );

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

    /**
     * @dev check if a tree is free to take part in sale and set {_saleType}
     * to saleType of tree when tree is not in use
     * @param _treeId id of tree to check
     * @param _saleType saleType for tree
     * @return 0 if a tree ready for a sale and 1 if a tree is in use or minted before
     */
    function manageSaleType(uint256 _treeId, uint32 _saleType)
        external
        onlyTreejerContract
        validTree(_treeId)
        returns (uint32)
    {
        if (treeToken.exists(_treeId)) {
            return 1;
        }

        uint32 currentSaleType = trees[_treeId].saleType;

        if (currentSaleType == 0) {
            trees[_treeId].saleType = _saleType;
        }

        return currentSaleType;
    }

    /**
     * @dev mint a tree to funder and set saleType to 0
     * @param _treeId id of tree to mint
     * @param _funder address of funder to mint tree for
     */
    function mintAssignedTree(uint256 _treeId, address _funder)
        external
        onlyTreejerContract
    {
        trees[_treeId].saleType = 0;
        treeToken.safeMint(_funder, _treeId);
    }

    /**
     * @dev reset saleType value of tree
     * @param _treeId id of tree to reset saleType value
     */
    function resetSaleType(uint256 _treeId) external onlyTreejerContract {
        trees[_treeId].saleType = 0;
    }

    /**
     * @dev reset saleType of trees in range of {_startTreeId} and {_endTreeId}
     * with saleType value of {_saleType}
     * @param _startTreeId starting tree id to reset saleType
     * @param _endTreeId ending tree id to reset saleType
     * @param _saleType saleType value of trees
     */
    function resetSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _saleType
    ) external onlyTreejerContract {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].saleType == _saleType) {
                trees[i].saleType = 0;
            }
        }
    }

    /**
     * @dev set {_saleType} to saleType of trees in range {_startTreeId} and {_endTreeId}
     * @param _startTreeId starting tree id to set saleType value
     * @param _endTreeId _ending tree id to set saleType value
     * @param _saleType saleType value
     * @return true if all trees saleType value successfully set and false otherwise
     */
    function manageSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _saleType
    ) external onlyTreejerContract returns (bool) {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].saleType > 0 || treeToken.exists(i)) {
                return false;
            }
        }
        for (uint256 j = _startTreeId; j < _endTreeId; j++) {
            trees[j].saleType = _saleType;
        }
        return true;
    }

    /**
     * @dev planter plant a tree
     * @param _treeSpecs tree specs
     * @param _birthDate birthDate of the tree
     * @param _countryCode country code of tree
     */
    function plantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external ifNotPaused {
        require(planterContract.manageTreePermission(_msgSender()));

        tempTrees[pendingRegularTreeId.current()] = TempTree(
            _birthDate,
            block.timestamp.toUint64(),
            _countryCode,
            0,
            _msgSender(),
            _treeSpecs
        );

        emit TreePlanted(pendingRegularTreeId.current());

        pendingRegularTreeId.increment();
    }

    /**
     * @dev admin or allowed verifier can verify or rejects the pending trees
     * @param _tempTreeId tempTreeId to verify
     * @param _isVerified true for verify and false for reject
     */
    function verifyTree(uint256 _tempTreeId, bool _isVerified)
        external
        ifNotPaused
        onlyVerifier
    {
        TempTree storage tempTreeData = tempTrees[_tempTreeId];

        require(tempTreeData.plantDate > 0, "regularTree not exist");

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

    /**
     * @dev mint a tree to funder of tree
     * @param _lastFundedTreeId The last tree funded in the regular sale
     * @param _funder funder of a new tree sold in Regular
     * @return the last tree funded after update
     */
    function mintTree(uint256 _lastFundedTreeId, address _funder)
        external
        onlyTreejerContract
        returns (uint256)
    {
        uint256 tempLastFundedTreeId = _lastFundedTreeId + 1;

        bool flag = (trees[tempLastFundedTreeId].treeStatus == 0 &&
            trees[tempLastFundedTreeId].saleType == 0) ||
            (trees[tempLastFundedTreeId].treeStatus == 4 &&
                trees[tempLastFundedTreeId].saleType == 4);

        while (!flag) {
            tempLastFundedTreeId = tempLastFundedTreeId + 1;

            flag =
                (trees[tempLastFundedTreeId].treeStatus == 0 &&
                    trees[tempLastFundedTreeId].saleType == 0) ||
                (trees[tempLastFundedTreeId].treeStatus == 4 &&
                    trees[tempLastFundedTreeId].saleType == 4);
        }

        trees[tempLastFundedTreeId].saleType = 0;

        treeToken.safeMint(_funder, tempLastFundedTreeId);

        return tempLastFundedTreeId;
    }

    /**
     * @dev mint an already planted tree with id to funder
     * @param _treeId tree id to mint
     * @param _funder address of funder
     */
    function mintTreeById(uint256 _treeId, address _funder)
        external
        onlyTreejerContract
    {
        TreeData storage treeData = trees[_treeId];

        require(
            treeData.treeStatus == 4 && treeData.saleType == 4,
            "tree must be planted"
        );

        treeData.saleType = 0;

        treeToken.safeMint(_funder, _treeId);
    }

    /**
     * @dev script role update treeSpecs
     * @param _treeId id of tree to update treeSpecs
     * @param _treeSpecs new tree specs
     */
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external
        ifNotPaused
        onlyScript
        notHavePendingUpdate(_treeId)
    {
        trees[_treeId].treeSpecs = _treeSpecs;

        emit TreeSpecsUpdated(_treeId, _treeSpecs);
    }
}
