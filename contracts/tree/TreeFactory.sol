//SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../tree/ITree.sol";
import "../treasury/ITreasury.sol";
import "../planter/IPlanter.sol";

contract TreeFactory is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;

    CountersUpgradeable.Counter private regularTreeId;

    bool public isTreeFactory;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    ITreasury public treasury;
    IPlanter public planter;

    uint256 public lastRegularPlantedTree;

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

    mapping(uint256 => TreeStruct) public treeData; //tree id to TreeStruct struct
    mapping(uint256 => UpdateTree) public updateTrees; //tree id to UpdateTree struct
    mapping(uint256 => RegularTree) public regularTrees; //tree id to RegularTree struct

    event TreePlanted(uint256 treeId);
    event PlantVerified(uint256 treeId);
    event PlantRejected(uint256 treeId);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId);
    event UpdateRejected(uint256 treeId);
    event RegularTreePlanted(uint256 treeId);
    event RegularPlantVerified(uint256 treeId);
    event RegularPlantRejected(uint256 treeId);

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    modifier onlyAuction() {
        accessRestriction.ifAuction(_msgSender());
        _;
    }

    modifier onlyIncremental() {
        accessRestriction.ifIncrementalSell(_msgSender());
        _;
    }

    modifier onlyIncrementalSellOrAuction {
        accessRestriction.ifIncrementalSellOrAuction(_msgSender());
        _;
    }
    modifier validTree(uint256 _treeId) {
        require(treeData[_treeId].treeStatus > 0, "invalid tree");
        _;
    }

    modifier onlyRegularSellContract() {
        accessRestriction.ifRegularSell(_msgSender());
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isTreeFactory = true;
        accessRestriction = candidateContract;
        lastRegularPlantedTree = 10000;
    }

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);

        require(candidateContract.isTreasury());

        treasury = candidateContract;
    }

    function setPlanterAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);

        require(candidateContract.isPlanter());

        planter = candidateContract;
    }

    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);

        require(candidateContract.isTree());

        treeToken = candidateContract;
    }

    function addTree(uint256 _treeId, string calldata _treeDescription)
        external
        onlyAdmin
    {
        require(treeData[_treeId].treeStatus == 0, "duplicate tree");

        TreeStruct storage tree = treeData[_treeId];

        tree.treeStatus = 2;
        tree.treeSpecs = _treeDescription;
    }

    function assignTreeToPlanter(uint256 _treeId, address _planterId)
        external
        onlyAdmin
    {
        TreeStruct storage tempTree = treeData[_treeId];

        require(tempTree.treeStatus == 2, "invalid tree to assign");

        require(
            planter.canAssignTreeToPlanter(_planterId),
            "can't assign tree to planter"
        );

        tempTree.planterId = _planterId;
    }

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
            accessRestriction.isAdmin(_msgSender()) ||
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
                    ((treeData[_treeId].treeStatus * 3600) + 86400),
            "Update time not reach"
        );

        UpdateTree storage updateGenTree = updateTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

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
            accessRestriction.isAdmin(_msgSender()) ||
                planter.canVerify(treeData[_treeId].planterId, _msgSender()),
            "invalid access to verify"
        );

        UpdateTree storage updateGenTree = updateTrees[_treeId];

        if (_isVerified) {
            TreeStruct storage tree = treeData[_treeId];

            updateGenTree.updateStatus = 3;

            uint32 age = ((block.timestamp - treeData[_treeId].plantDate) /
                3600)
            .toUint32();

            if (age > tree.treeStatus) {
                tree.treeStatus = age;
            }

            tree.treeSpecs = updateGenTree.updateSpecs;

            if (treeToken.exists(_treeId)) {
                treasury.fundPlanter(_treeId, tree.planterId, tree.treeStatus);
            }

            emit UpdateVerified(_treeId);
        } else {
            updateGenTree.updateStatus = 2;

            emit UpdateRejected(_treeId);
        }
    }

    function availability(uint256 _treeId, uint32 _provideType)
        external
        onlyAuction
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

    function updateOwnerIncremental(uint256 _treeId, address _ownerId)
        external
        onlyIncremental
    {
        treeData[_treeId].provideStatus = 0;
        treeData[_treeId].mintStatus = 1;
        treeToken.safeMint(_ownerId, _treeId);
    }

    function updateOwner(uint256 _treeId, address _ownerId)
        external
        onlyAuction
    {
        treeData[_treeId].provideStatus = 0;
        treeData[_treeId].mintStatus = 2;
        treeToken.safeMint(_ownerId, _treeId);
    }

    function updateAvailability(uint256 _treeId) external onlyAuction {
        treeData[_treeId].provideStatus = 0;
    }

    //cancel all old incremental sell of trees
    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyIncremental
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (treeData[i].provideStatus == 2) {
                treeData[i].provideStatus = 0;
            }
        }
    }

    //set incremental sell for trees
    function bulkAvailability(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyIncremental
        returns (bool)
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (treeData[i].provideStatus > 0) {
                return false;
            }
        }
        for (uint256 j = _startTreeId; j < _endTreeId; j++) {
            treeData[j].provideStatus = 2;
        }
        return true;
    }

    function checkMintStatus(uint256 _treeId, address _buyer)
        external
        view
        returns (bool)
    {
        uint16 minted = treeData[_treeId].mintStatus;
        return ((minted == 1 || minted == 2) &&
            treeToken.ownerOf(_treeId) == _buyer);
    }

    // function updateTreefromOffer(
    //     uint256 _treeId,
    //     string memory _specsCid,
    //     address _owner
    // ) external onlyAuction {
    //     treeData[_treeId].provideStatus = 0;

    //     treeData[_treeId].treeSpecs = _specsCid;

    //     treeToken.safeMint(_owner, _treeId);
    // }

    /**
     * @dev This function is called by planter who have planted a new tree
     * The planter enters the information of the new tree
     * Information is stored in The {regularTrees} mapping
     * And finally the tree is waiting for approval
     *
     *
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
            accessRestriction.isAdmin(_msgSender()) ||
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
     *
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     *
     *
     * @return The last tree sold after update
     */
    function mintRegularTrees(uint256 _lastSold, address _owner)
        external
        onlyRegularSellContract
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
        onlyRegularSellContract
    {
        TreeStruct storage tree = treeData[_treeId];

        require(
            tree.treeStatus == 4 && tree.provideStatus == 4,
            "tree must be planted"
        );

        tree.provideStatus = 0;

        treeToken.safeMint(_owner, _treeId);
    }
}
