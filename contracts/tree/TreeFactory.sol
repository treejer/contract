//SPDX-License-Identifier: MIT

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

    CountersUpgradeable.Counter private regularTreeId;

    /** NOTE {isTreeFactory} set inside the initialize to {true} */
    bool public isTreeFactory;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IPlanterFund public planterFund;
    IPlanter public planter;

    uint256 public lastRegularPlantedTree;
    uint256 public updateInterval;

    struct TreeStruct {
        address planterId;
        uint256 treeType;
        uint16 mintStatus;
        uint16 countryCode;
        uint32 provideStatus;
        uint64 treeStatus;
        uint64 plantDate;
        uint64 birthDate;
        string treeSpecs;
    }

    struct UpdateTree {
        string updateSpecs;
        uint64 updateStatus;
    }

    struct RegularTree {
        uint64 birthDate;
        uint64 plantDate;
        uint64 countryCode;
        uint64 otherData;
        address planterAddress;
        string treeSpecs;
    }
    /** NOTE mapping of treeId to Tree Struct */
    mapping(uint256 => TreeStruct) public treeData;
    /** NOTE mapping of treeId to UpdateTree struct */
    mapping(uint256 => UpdateTree) public updateTrees;
    /** NOTE mapping of treeId to RegularTree struct */
    mapping(uint256 => RegularTree) public regularTrees;

    event TreeAdded(uint256 treeId);
    event TreeAssigned(uint256 treeId);
    event TreePlanted(uint256 treeId);
    event PlantVerified(uint256 treeId);
    event PlantRejected(uint256 treeId);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId);
    event UpdateRejected(uint256 treeId);
    event RegularTreePlanted(uint256 treeId);
    event RegularPlantVerified(uint256 treeId);
    event RegularPlantRejected(uint256 treeId);
    event UpdateIntervalSet();
    event TreeSpecsUpdate(uint256 treeId);

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

    /** NOTE modifier to check msg.sender has buyer rank role */
    modifier onlyBuyerRank() {
        accessRestriction.ifBuyerRank(_msgSender());
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check treeId to be valid tree */
    modifier validTree(uint256 _treeId) {
        require(treeData[_treeId].treeStatus > 0, "invalid tree");
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
     * NOTE set lastRegularPlantedTree to 10000
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
        lastRegularPlantedTree = 10000;
        updateInterval = 604800;
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
        updateInterval = _day * 86400;

        emit UpdateIntervalSet();
    }

    /**
     * @dev admin add tree
     * @param _treeId id of tree to add
     * @param _treeDescription tree description
     */
    function addTree(uint256 _treeId, string calldata _treeDescription)
        external
        onlyDataManager
    {
        require(treeData[_treeId].treeStatus == 0, "duplicate tree");

        TreeStruct storage tree = treeData[_treeId];

        tree.treeStatus = 2;
        tree.treeSpecs = _treeDescription;

        emit TreeAdded(_treeId);
    }

    /**
     * @dev admin assign an existing tree to planter
     * @param _treeId id of tree to assign
     * @param _planterId assignee planter
     * NOTE tree must be not planted
     */
    function assignTreeToPlanter(uint256 _treeId, address _planterId)
        external
        onlyDataManager
    {
        TreeStruct storage tempTree = treeData[_treeId];

        require(tempTree.treeStatus == 2, "invalid tree to assign");

        require(
            planter.canAssignTreeToPlanter(_planterId),
            "can't assign tree to planter"
        );

        tempTree.planterId = _planterId;

        emit TreeAssigned(_treeId);
    }

    /**
     * @dev planter with permission to plant, can plan their trees
     * @param _treeId id of tree to plant
     * @param _treeSpecs tree specs
     * @param _birthDate birth date of tree
     * @param _countryCode country code of tree
     */
    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {
        TreeStruct storage tempGenTree = treeData[_treeId];

        require(tempGenTree.treeStatus == 2, "invalid tree status for plant");

        bool _canPlant = planter.plantingPermission(
            _msgSender(),
            tempGenTree.planterId
        );

        require(_canPlant, "planting permission denied");

        if (_msgSender() != tempGenTree.planterId) {
            tempGenTree.planterId = _msgSender();
        }

        UpdateTree storage updateGenTree = updateTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        tempGenTree.countryCode = _countryCode;
        tempGenTree.birthDate = _birthDate;
        tempGenTree.plantDate = block.timestamp.toUint64();
        tempGenTree.treeStatus = 3;

        emit TreePlanted(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verify a plant or reject.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     */
    function verifyPlant(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {
        TreeStruct storage tempGenTree = treeData[_treeId];

        require(tempGenTree.treeStatus == 3, "invalid tree status");

        require(
            tempGenTree.planterId != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(tempGenTree.planterId, _msgSender()),
            "invalid access to verify"
        );

        UpdateTree storage tempUpdateGenTree = updateTrees[_treeId];

        if (_isVerified) {
            tempGenTree.treeSpecs = tempUpdateGenTree.updateSpecs;
            tempGenTree.treeStatus = 4;
            tempUpdateGenTree.updateStatus = 3;

            emit PlantVerified(_treeId);
        } else {
            tempGenTree.treeStatus = 2;
            tempUpdateGenTree.updateStatus = 2;
            planter.reducePlantCount(tempGenTree.planterId);

            emit PlantRejected(_treeId);
        }
    }

    /**
     * @dev planter of  tree send update request for tree
     * @param _treeId id of tree to update
     * @param _treeSpecs tree specs
     */
    function updateTree(uint256 _treeId, string memory _treeSpecs) external {
        require(
            treeData[_treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );

        require(treeData[_treeId].treeStatus > 3, "Tree not planted");

        require(
            updateTrees[_treeId].updateStatus != 1,
            "update tree status is pending"
        );

        require(
            block.timestamp >=
                treeData[_treeId].plantDate +
                    ((treeData[_treeId].treeStatus * 3600) + updateInterval),
            "Update time not reach"
        );

        UpdateTree storage updateGenTree = updateTrees[_treeId];

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
            treeData[_treeId].planterId != _msgSender(),
            "Planter of tree can't verify update"
        );

        require(
            updateTrees[_treeId].updateStatus == 1,
            "update status must be pending"
        );

        require(treeData[_treeId].treeStatus > 3, "Tree not planted");

        require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(treeData[_treeId].planterId, _msgSender()),
            "invalid access to verify"
        );

        UpdateTree storage updateGenTree = updateTrees[_treeId];

        if (_isVerified) {
            TreeStruct storage tree = treeData[_treeId];

            updateGenTree.updateStatus = 3;

            uint32 age = ((block.timestamp - treeData[_treeId].plantDate) /
                3600).toUint32();

            if (age > tree.treeStatus) {
                tree.treeStatus = age;
            }

            tree.treeSpecs = updateGenTree.updateSpecs;

            if (treeToken.exists(_treeId)) {
                planterFund.fundPlanter(
                    _treeId,
                    tree.planterId,
                    tree.treeStatus
                );
            }

            emit UpdateVerified(_treeId);
        } else {
            updateGenTree.updateStatus = 2;

            emit UpdateRejected(_treeId);
        }
    }

    /**
     * @dev check if a tree is valid to take part in an auction
     * set {_provideType} to provideStatus when tree is not in use
     * @return 0 if a tree ready for auction and 1 if a tree is in auction or minted before
     */
    function availability(uint256 _treeId, uint32 _provideType)
        external
        onlyTreejerContract
        validTree(_treeId)
        returns (uint32)
    {
        if (treeToken.exists(_treeId)) {
            return 1;
        }

        uint32 nowProvideStatus = treeData[_treeId].provideStatus;

        if (nowProvideStatus == 0) {
            treeData[_treeId].provideStatus = _provideType;
        }

        return nowProvideStatus;
    }

    /** @dev mint {_treeId} to {_ownerId} and set mintStatus to {_mintStatus} and privdeStatus to 0  */
    function updateOwner(
        uint256 _treeId,
        address _ownerId,
        uint16 _mintStatus
    ) external onlyTreejerContract {
        treeData[_treeId].provideStatus = 0;
        treeData[_treeId].mintStatus = _mintStatus;
        treeToken.safeMint(_ownerId, _treeId);
    }

    /** @dev exit a {_treeId} from auction */
    function updateAvailability(uint256 _treeId) external onlyTreejerContract {
        treeData[_treeId].provideStatus = 0;
    }

    /** @dev cancel all old incremental sell of trees starting from {_startTreeId} and end at {_endTreeId} */
    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyTreejerContract
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (treeData[i].provideStatus == 2) {
                treeData[i].provideStatus = 0;
            }
        }
    }

    /**
     * @dev set incremental and communityGifts sell for trees starting from {_startTreeId}
     * and end at {_endTreeId} by setting {_provideStatus} to provideStatus
     */
    function manageProvideStatus(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _provideStatus
    ) external onlyTreejerContract returns (bool) {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (treeData[i].provideStatus > 0) {
                return false;
            }
        }
        for (uint256 j = _startTreeId; j < _endTreeId; j++) {
            treeData[j].provideStatus = _provideStatus;
        }
        return true;
    }

    /**
     *
     */
    function checkMintStatus(uint256 _treeId, address _buyer)
        external
        view
        returns (bool, bytes32)
    {
        uint16 minted = treeData[_treeId].mintStatus;

        bool flag = ((minted == 1 || minted == 2) &&
            treeToken.ownerOf(_treeId) == _buyer);

        if (flag) {
            TreeStruct storage tempTree = treeData[_treeId];
            UpdateTree storage tempUpdateTree = updateTrees[_treeId];

            return (
                true,
                keccak256(
                    abi.encodePacked(
                        lastRegularPlantedTree,
                        tempTree.birthDate,
                        tempTree.treeSpecs,
                        tempTree.treeStatus,
                        tempTree.planterId,
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
     * Information is stored in The {regularTrees} mapping
     * And finally the tree is waiting for approval
     * @param _treeSpecs //TODO: what is _treeSpecs ??
     * @param _birthDate birthDate of the tree
     * @param _countryCode Code of the country where the tree was planted
     */
    function regularPlantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {
        require(planter.planterCheck(_msgSender()));

        regularTrees[regularTreeId.current()] = RegularTree(
            _birthDate,
            block.timestamp.toUint64(),
            _countryCode,
            0,
            _msgSender(),
            _treeSpecs
        );

        emit RegularTreePlanted(regularTreeId.current());

        regularTreeId.increment();
    }

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {treeData}
     *
     * @param _regularTreeId _regularTreeId
     * @param _isVerified Tree approved or not
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool _isVerified)
        external
    {
        RegularTree storage regularTree = regularTrees[_regularTreeId];

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
            uint256 tempLastRegularPlantedTree = lastRegularPlantedTree + 1;

            while (
                !(treeData[tempLastRegularPlantedTree].treeStatus == 0 &&
                    treeData[tempLastRegularPlantedTree].provideStatus == 0)
            ) {
                tempLastRegularPlantedTree = tempLastRegularPlantedTree + 1;
            }

            lastRegularPlantedTree = tempLastRegularPlantedTree;

            TreeStruct storage tree = treeData[lastRegularPlantedTree];

            tree.plantDate = regularTree.plantDate;
            tree.countryCode = uint16(regularTree.countryCode);
            tree.birthDate = regularTree.birthDate;
            tree.treeSpecs = regularTree.treeSpecs;
            tree.planterId = regularTree.planterAddress;
            tree.treeStatus = 4;

            if (!treeToken.exists(lastRegularPlantedTree)) {
                tree.provideStatus = 4;
            }
            emit RegularPlantVerified(lastRegularPlantedTree);
        } else {
            emit RegularPlantRejected(_regularTreeId);
        }

        delete regularTrees[_regularTreeId];
    }

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSell contract
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     * @return The last tree sold after update
     */
    function mintRegularTrees(uint256 _lastSold, address _owner)
        external
        onlyTreejerContract
        returns (uint256)
    {
        uint256 localLastSold = _lastSold + 1;

        bool flag = (treeData[localLastSold].treeStatus == 0 &&
            treeData[localLastSold].provideStatus == 0) ||
            (treeData[localLastSold].treeStatus == 4 &&
                treeData[localLastSold].provideStatus == 4);

        while (!flag) {
            localLastSold = localLastSold + 1;

            flag =
                (treeData[localLastSold].treeStatus == 0 &&
                    treeData[localLastSold].provideStatus == 0) ||
                (treeData[localLastSold].treeStatus == 4 &&
                    treeData[localLastSold].provideStatus == 4);
        }

        treeData[localLastSold].provideStatus = 0;

        treeToken.safeMint(_owner, localLastSold);

        return localLastSold;
    }

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSell contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _owner Owner of a new tree sold in Regular
     */
    function requestRegularTree(uint256 _treeId, address _owner)
        external
        onlyTreejerContract
    {
        TreeStruct storage tree = treeData[_treeId];

        require(
            tree.treeStatus == 4 && tree.provideStatus == 4,
            "tree must be planted"
        );

        tree.provideStatus = 0;

        treeToken.safeMint(_owner, _treeId);
    }

    /** @dev script role update {_treeSpecs} of {_treeId} */
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external
        onlyBuyerRank
    {
        treeData[_treeId].treeSpecs = _treeSpecs;

        emit TreeSpecsUpdate(_treeId);
    }
}
