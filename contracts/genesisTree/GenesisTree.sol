//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../tree/ITree.sol";
import "../treasury/ITreasury.sol";
import "../planter/IPlanter.sol";

contract GenesisTree is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint32;
    using SafeMathUpgradeable for uint16;

    CountersUpgradeable.Counter private regularTreeId;

    bool public isGenesisTree;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    ITreasury public treasury;
    IPlanter public planter;

    uint256 public lastRegularPlantedTree;

    struct GenTree {
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

    struct UpdateGenTree {
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

    mapping(uint256 => GenTree) public genTrees; //tree id to GenesisTree struct
    mapping(uint256 => UpdateGenTree) public updateGenTrees; //tree id to UpdateGenesisTree struct
    mapping(uint256 => RegularTree) public regularTrees; //tree id to RegularTree struct

    event TreePlanted(uint256 treeId, address planter);
    event PlantVerified(uint256 treeId, uint256 updateStatus);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId, uint64 updateStatus);

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
        require(genTrees[_treeId].treeStatus > 0, "invalid tree");
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

        isGenesisTree = true;
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
        require(genTrees[_treeId].treeStatus == 0, "duplicate tree");

        GenTree storage genTree = genTrees[_treeId];

        genTree.treeStatus = 2;
        genTree.treeSpecs = _treeDescription;
    }

    function assignTreeToPlanter(uint256 _treeId, address _planterId)
        external
        onlyAdmin
    {
        GenTree storage tempTree = genTrees[_treeId];

        require(tempTree.treeStatus == 2, "invalid tree to assign");

        // require(_planterId != address(0), "invalid planter address");
        require(
            planter.canAssignTreeToPlanter(_planterId),
            "can't assign tree to planter"
        );

        // (uint8 _planterType, , , , , , , ) = planter.planters(_planterId);

        // require(_planterType > 0, "planter not exist");

        tempTree.planterId = _planterId;
    }

    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {
        GenTree storage tempGenTree = genTrees[_treeId];

        require(tempGenTree.treeStatus == 2, "invalid tree status for plant");

        bool _canPlant = planter.plantingPermission(
            _msgSender(),
            tempGenTree.planterId
        );

        require(_canPlant, "planting permission denied");

        if (_msgSender() != tempGenTree.planterId) {
            tempGenTree.planterId = _msgSender();
        }

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        tempGenTree.countryCode = _countryCode;
        tempGenTree.birthDate = _birthDate;
        tempGenTree.plantDate = now.toUint64();
        tempGenTree.treeStatus = 3;

        emit TreePlanted(_treeId, tempGenTree.planterId);
    }

    function verifyPlant(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {
        GenTree storage tempGenTree = genTrees[_treeId];

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

        UpdateGenTree storage tempUpdateGenTree = updateGenTrees[_treeId];

        if (_isVerified) {
            tempGenTree.treeSpecs = tempUpdateGenTree.updateSpecs;
            tempGenTree.treeStatus = 4;
            tempUpdateGenTree.updateStatus = 3;
        } else {
            tempGenTree.treeStatus = 2;
            tempUpdateGenTree.updateStatus = 2;
            planter.reducePlantCount(tempGenTree.planterId);
        }

        emit PlantVerified(_treeId, tempUpdateGenTree.updateStatus);
    }

    function updateTree(uint256 _treeId, string memory _treeSpecs) external {
        require(
            genTrees[_treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );

        require(genTrees[_treeId].treeStatus > 3, "Tree not planted");

        require(
            updateGenTrees[_treeId].updateStatus != 1,
            "update genesis tree status is pending"
        );

        require(
            now >=
                genTrees[_treeId].plantDate.add(
                    genTrees[_treeId].treeStatus.mul(3600).add(86400)
                ),
            "Update time not reach"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {
        require(
            genTrees[_treeId].planterId != _msgSender(),
            "Planter of tree can't verify update"
        );

        require(
            updateGenTrees[_treeId].updateStatus == 1,
            "update status must be pending"
        );

        require(genTrees[_treeId].treeStatus > 3, "Tree not planted");

        require(
            accessRestriction.isAdmin(_msgSender()) ||
                planter.canVerify(genTrees[_treeId].planterId, _msgSender()),
            "invalid access to verify"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        if (_isVerified) {
            GenTree storage genTree = genTrees[_treeId];

            updateGenTree.updateStatus = 3;
            uint32 age = now
            .sub(genTrees[_treeId].plantDate)
            .div(3600)
            .toUint32();
            if (age > genTree.treeStatus) {
                genTree.treeStatus = age;
            }

            genTree.treeSpecs = updateGenTree.updateSpecs;

            if (treeToken.exists(_treeId)) {
                treasury.fundPlanter(
                    _treeId,
                    genTree.planterId,
                    genTree.treeStatus
                );
            }
        } else {
            updateGenTree.updateStatus = 2;
        }

        emit UpdateVerified(_treeId, updateGenTree.updateStatus);
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

        uint32 nowProvideStatus = genTrees[_treeId].provideStatus;

        if (nowProvideStatus == 0) {
            genTrees[_treeId].provideStatus = _provideType;
        }

        return nowProvideStatus;
    }

    function updateOwnerIncremental(uint256 _treeId, address _ownerId)
        external
        onlyIncremental
    {
        genTrees[_treeId].provideStatus = 0;
        genTrees[_treeId].mintStatus=1;
        treeToken.safeMint(_ownerId, _treeId);

    }
     function updateOwner(uint256 _treeId, address _ownerId)
        external
        onlyAuction
    {
        genTrees[_treeId].provideStatus = 0;
        genTrees[_treeId].mintStatus=2;
        treeToken.safeMint(_ownerId, _treeId);

    }

    function updateAvailability(uint256 _treeId) external onlyAuction {
        genTrees[_treeId].provideStatus = 0;
    }

    //cancel all old incremental sell of trees
    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyIncremental
    {
        for (uint256 i = _startTreeId; i < _endTreeId; i++) {
            if (genTrees[i].provideStatus == 2) {
                genTrees[i].provideStatus = 0;
            }
        }
    }

    //set incremental sell for trees
    function bulkAvailability(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyIncremental
        returns (bool)
    {
        uint256 i;
        for (i = _startTreeId; i < _endTreeId; i++) {
            if (genTrees[i].provideStatus > 0) {
                return false;
            }
        }
        for (i = _startTreeId; i < _endTreeId; i++) {
            genTrees[i].provideStatus = 2;
        }
        return true;
    }
    function checkMintStatus(uint256 _treeId) external view returns(bool) {
        uint16 minted =genTrees[_treeId].mintStatus;
        return (minted==1 || minted==2);
    }

    // function updateTreefromOffer(
    //     uint256 _treeId,
    //     string memory _specsCid,
    //     address _owner
    // ) external onlyAuction {
    //     genTrees[_treeId].provideStatus = 0;

    //     genTrees[_treeId].treeSpecs = _specsCid;

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
            now.toUint64(),
            _countryCode,
            0,
            _msgSender(),
            _treeSpecs
        );

        regularTreeId.increment();
    }

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {genTrees}
     *
     * @param _regularTreeId _regularTreeId
     * @param isVerified Tree approved or not
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool isVerified)
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

        if (isVerified) {
            uint256 tempLastRegularPlantedTree = lastRegularPlantedTree.add(1);

            while (
                !(genTrees[tempLastRegularPlantedTree].treeStatus == 0 &&
                    genTrees[tempLastRegularPlantedTree].provideStatus == 0)
            ) {
                tempLastRegularPlantedTree = tempLastRegularPlantedTree.add(1);
            }

            lastRegularPlantedTree = tempLastRegularPlantedTree;

            GenTree storage genTree = genTrees[lastRegularPlantedTree];

            genTree.plantDate = regularTree.plantDate;
            genTree.countryCode = uint16(regularTree.countryCode);
            genTree.birthDate = regularTree.birthDate;
            genTree.treeSpecs = regularTree.treeSpecs;
            genTree.planterId = regularTree.planterAddress;
            genTree.treeStatus = 4;

            if (!treeToken.exists(lastRegularPlantedTree)) {
                genTree.provideStatus = 4;
            }
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
        uint256 localLastSold = _lastSold.add(1);

        bool flag = (genTrees[localLastSold].treeStatus == 0 &&
            genTrees[localLastSold].provideStatus == 0) ||
            (genTrees[localLastSold].treeStatus == 4 &&
                genTrees[localLastSold].provideStatus == 4);

        while (!flag) {
            localLastSold = localLastSold.add(1);

            flag =
                (genTrees[localLastSold].treeStatus == 0 &&
                    genTrees[localLastSold].provideStatus == 0) ||
                (genTrees[localLastSold].treeStatus == 4 &&
                    genTrees[localLastSold].provideStatus == 4);
        }

        genTrees[localLastSold].provideStatus = 0;

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
        GenTree storage genTree = genTrees[_treeId];

        require(
            genTree.treeStatus == 4 && genTree.provideStatus == 4,
            "tree must be planted"
        );

        genTree.provideStatus = 0;

        treeToken.safeMint(_owner, _treeId);
    }
}
