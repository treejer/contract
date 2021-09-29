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
    IPlanter public planter;

    uint256 public lastRegualarTreeId;
    uint256 public treeUpdateInterval;

    struct TreeData {
        address planterAddress;
        uint256 species;
        uint16 mintOrigin;
        uint16 countryCode;
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
        address planterAddress;
        string treeSpecs;
    }
    /** NOTE mapping of treeId to Tree Struct */
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
    event TreeVerified(uint256 treeId);
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

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeFactory
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
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
    function setPlanterAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);

        require(candidateContract.isPlanter());

        planter = candidateContract;
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

    /** @dev admin can set the minimum time to send next update request
     * @param _day time to next update request
     */
    function setUpdateInterval(uint256 _day) external onlyDataManager {
        treeUpdateInterval = _day * 86400;

        emit TreeUpdateIntervalChanged();
    }

    /**
     * @dev admin add tree
     * @param _treeId id of tree to add
     * @param _treeDescription tree description
     */
    function listTree(uint256 _treeId, string calldata _treeDescription)
        external
        onlyDataManager
    {
        require(trees[_treeId].treeStatus == 0, "duplicate tree");

        TreeData storage tree = trees[_treeId];

        tree.treeStatus = 2;
        tree.treeSpecs = _treeDescription;

        emit TreeListed(_treeId);
    }

    /**
     * @dev admin assign an existing tree to planter
     * @param _treeId id of tree to assign
     * @param _planterId assignee planter
     * NOTE tree must be not planted
     */
    function assignTree(uint256 _treeId, address _planterId)
        external
        onlyDataManager
    {
        TreeData storage tempTree = trees[_treeId];

        require(tempTree.treeStatus == 2, "invalid tree to assign");

        require(
            planter.canAssignTreeToPlanter(_planterId),
            "can't assign tree to planter"
        );

        tempTree.planterAddress = _planterId;

        emit TreeAssigned(_treeId);
    }

    /**
     * @dev planter with permission to plant, can plan their trees
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
    ) external {
        TreeData storage tempGenTree = trees[_treeId];

        require(tempGenTree.treeStatus == 2, "invalid tree status for plant");

        bool _canPlant = planter.plantingPermission(
            _msgSender(),
            tempGenTree.planterAddress
        );

        require(_canPlant, "planting permission denied");

        if (_msgSender() != tempGenTree.planterAddress) {
            tempGenTree.planterAddress = _msgSender();
        }

        TreeUpdate storage updateGenTree = treeUpdates[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        tempGenTree.countryCode = _countryCode;
        tempGenTree.birthDate = _birthDate;
        tempGenTree.plantDate = block.timestamp.toUint64();
        tempGenTree.treeStatus = 3;

        emit AssignedTreePlanted(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verify a plant or reject.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     */
    function verifyAssignedTree(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {
        TreeData storage tempGenTree = trees[_treeId];

        require(tempGenTree.treeStatus == 3, "invalid tree status");

        require(
            tempGenTree.planterAddress != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(tempGenTree.planterAddress, _msgSender()),
            "invalid access to verify"
        );

        TreeUpdate storage tempUpdateGenTree = treeUpdates[_treeId];

        if (_isVerified) {
            tempGenTree.treeSpecs = tempUpdateGenTree.updateSpecs;
            tempGenTree.treeStatus = 4;
            tempUpdateGenTree.updateStatus = 3;

            emit AssignedTreeVerified(_treeId);
        } else {
            tempGenTree.treeStatus = 2;
            tempUpdateGenTree.updateStatus = 2;
            planter.reducePlantCount(tempGenTree.planterAddress);

            emit AssignedTreeRejected(_treeId);
        }
    }

    /**
     * @dev planter of  tree send update request for tree
     * @param _treeId id of tree to update
     * @param _treeSpecs tree specs
     */
    function updateTree(uint256 _treeId, string memory _treeSpecs) external {
        require(
            trees[_treeId].planterAddress == _msgSender(),
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

        TreeUpdate storage updateGenTree = treeUpdates[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verifiy or reject update request for tree.
     * @param _treeId id of tree to verify update request
     * @param _isVerified true for verify and false for reject
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     */
    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {
        require(
            trees[_treeId].planterAddress != _msgSender(),
            "Planter of tree can't verify update"
        );

        require(
            treeUpdates[_treeId].updateStatus == 1,
            "update status must be pending"
        );

        require(trees[_treeId].treeStatus > 3, "Tree not planted");

        require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(trees[_treeId].planterAddress, _msgSender()),
            "invalid access to verify"
        );

        TreeUpdate storage updateGenTree = treeUpdates[_treeId];

        if (_isVerified) {
            TreeData storage tree = trees[_treeId];

            updateGenTree.updateStatus = 3;

            uint32 age = ((block.timestamp - trees[_treeId].plantDate) / 3600)
                .toUint32();

            if (age > tree.treeStatus) {
                tree.treeStatus = age;
            }

            tree.treeSpecs = updateGenTree.updateSpecs;

            if (treeToken.exists(_treeId)) {
                planterFund.fundPlanter(
                    _treeId,
                    tree.planterAddress,
                    tree.treeStatus
                );
            }

            emit TreeUpdatedVerified(_treeId);
        } else {
            updateGenTree.updateStatus = 2;

            emit TreeUpdateRejected(_treeId);
        }
    }

    /**
     * @dev check if a tree is valid to take part in an auction
     * set {_provideType} to saleType when tree is not in use
     * @return 0 if a tree ready for auction and 1 if a tree is in auction or minted before
     */
    function manageSaleType(uint256 _treeId, uint32 _provideType)
        external
        onlyTreejerContract
        validTree(_treeId)
        returns (uint32)
    {
        if (treeToken.exists(_treeId)) {
            return 1;
        }

        uint32 nowProvideStatus = trees[_treeId].saleType;

        if (nowProvideStatus == 0) {
            trees[_treeId].saleType = _provideType;
        }

        return nowProvideStatus;
    }

    /** @dev mint {_treeId} to {_ownerId} and set mintOrigin to {_mintStatus} and privdeStatus to 0  */
    function mintAssignedTree(
        uint256 _treeId,
        address _ownerId,
        uint16 _mintStatus
    ) external onlyTreejerContract {
        trees[_treeId].saleType = 0;
        trees[_treeId].mintOrigin = _mintStatus;
        treeToken.safeMint(_ownerId, _treeId);
    }

    /** @dev exit a {_treeId} from auction */
    function resetSaleType(uint256 _treeId) external onlyTreejerContract {
        trees[_treeId].saleType = 0;
    }

    /** @dev cancel all old incremental sell of trees starting from {_startTreeId} and end at {_endTreeId} */
    function resetSaleTypeBatch(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyTreejerContract
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].saleType == 2) {
                trees[i].saleType = 0;
            }
        }
    }

    /**
     * @dev set incremental and communityGifts sell for trees starting from {_startTreeId}
     * and end at {_endTreeId} by setting {_provideStatus} to saleType
     */
    function manageSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _provideStatus
    ) external onlyTreejerContract returns (bool) {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (trees[i].saleType > 0 || treeToken.exists(i)) {
                return false;
            }
        }
        for (uint256 j = _startTreeId; j < _endTreeId; j++) {
            trees[j].saleType = _provideStatus;
        }
        return true;
    }

    /**
     *
     */
    function checkMintOrigin(uint256 _treeId, address _buyer)
        external
        view
        returns (bool, bytes32)
    {
        uint16 minted = trees[_treeId].mintOrigin;

        bool flag = ((minted == 1 || minted == 2) &&
            treeToken.ownerOf(_treeId) == _buyer);

        if (flag) {
            TreeData storage tempTree = trees[_treeId];
            TreeUpdate storage tempUpdateTree = treeUpdates[_treeId];

            return (
                true,
                keccak256(
                    abi.encodePacked(
                        lastRegualarTreeId,
                        tempTree.birthDate,
                        tempTree.treeSpecs,
                        tempTree.treeStatus,
                        tempTree.planterAddress,
                        tempUpdateTree.updateSpecs
                    )
                )
            );
        }

        return (false, 0);
    }

    /**
     * @dev This function is called by planter who have planted a new tree
     * The planter enters the information of the new tree
     * Information is stored in The {tempTrees} mapping
     * And finally the tree is waiting for approval
     * @param _treeSpecs //TODO: what is _treeSpecs ??
     * @param _birthDate birthDate of the tree
     * @param _countryCode Code of the country where the tree was planted
     */
    function plantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {
        require(planter.planterCheck(_msgSender()));

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
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {trees}
     *
     * @param _regularTreeId _regularTreeId
     * @param _isVerified Tree approved or not
     */
    function verifyTree(uint256 _regularTreeId, bool _isVerified) external {
        TempTree storage regularTree = tempTrees[_regularTreeId];

        require(
            regularTree.planterAddress != _msgSender(),
            "Planter of tree can't verify update"
        );

        require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(regularTree.planterAddress, _msgSender()),
            "invalid access to verify"
        );

        require(regularTree.plantDate > 0, "regularTree not exist");

        if (_isVerified) {
            uint256 tempLastRegularPlantedTree = lastRegualarTreeId + 1;

            while (
                !(trees[tempLastRegularPlantedTree].treeStatus == 0 &&
                    trees[tempLastRegularPlantedTree].saleType == 0)
            ) {
                tempLastRegularPlantedTree = tempLastRegularPlantedTree + 1;
            }

            lastRegualarTreeId = tempLastRegularPlantedTree;

            TreeData storage tree = trees[lastRegualarTreeId];

            tree.plantDate = regularTree.plantDate;
            tree.countryCode = uint16(regularTree.countryCode);
            tree.birthDate = regularTree.birthDate;
            tree.treeSpecs = regularTree.treeSpecs;
            tree.planterAddress = regularTree.planterAddress;
            tree.treeStatus = 4;

            if (!treeToken.exists(lastRegualarTreeId)) {
                tree.saleType = 4;
            }
            emit TreeVerified(lastRegualarTreeId);
        } else {
            emit TreeRejected(_regularTreeId);
        }

        delete tempTrees[_regularTreeId];
    }

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSale contract
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     * @return The last tree sold after update
     */
    function mintTree(uint256 _lastSold, address _owner)
        external
        onlyTreejerContract
        returns (uint256)
    {
        uint256 localLastSold = _lastSold + 1;

        bool flag = (trees[localLastSold].treeStatus == 0 &&
            trees[localLastSold].saleType == 0) ||
            (trees[localLastSold].treeStatus == 4 &&
                trees[localLastSold].saleType == 4);

        while (!flag) {
            localLastSold = localLastSold + 1;

            flag =
                (trees[localLastSold].treeStatus == 0 &&
                    trees[localLastSold].saleType == 0) ||
                (trees[localLastSold].treeStatus == 4 &&
                    trees[localLastSold].saleType == 4);
        }

        trees[localLastSold].saleType = 0;

        treeToken.safeMint(_owner, localLastSold);

        return localLastSold;
    }

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSale contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _owner Owner of a new tree sold in Regular
     */
    function mintTreeById(uint256 _treeId, address _owner)
        external
        onlyTreejerContract
    {
        TreeData storage tree = trees[_treeId];

        require(
            tree.treeStatus == 4 && tree.saleType == 4,
            "tree must be planted"
        );

        tree.saleType = 0;

        treeToken.safeMint(_owner, _treeId);
    }

    /** @dev script role update {_treeSpecs} of {_treeId} */
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external
        onlyScript
    {
        trees[_treeId].treeSpecs = _treeSpecs;

        emit TreeSpecsUpdated(_treeId, _treeSpecs);
    }
}
