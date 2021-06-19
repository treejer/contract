//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../greenblock/IGBFactory.sol";
import "../tree/ITree.sol";

contract GenesisTree is Initializable, RelayRecipient {
    using SafeCastUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint16;

    bool public isGenesisTree;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IGBFactory public gbFactory;

    struct GenTree {
        address planterId;
        uint256 gbId;
        uint256 treeType;
        uint8 gbType;
        uint8 provideStatus;
        bool isExist;
        uint16 treeStatus;
        uint16 countryCode;
        uint64 plantDate;
        uint64 birthDate;
        uint64 lastUpdate;
        string treeSpecs;
    }

    struct UpdateGenTree {
        string updateSpecs;
        uint64 updateDate;
        uint64 updateStatus;
    }

    mapping(uint256 => GenTree) public genTrees;
    mapping(uint256 => UpdateGenTree) public updateGenTrees;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    modifier onlyAuction() {
        accessRestriction.ifAuction(_msgSender());
        _;
    }

    modifier validTree(uint256 _treeId) {
        require(genTrees[_treeId].isExist, "invalid tree");
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isGenesisTree = true;
        accessRestriction = candidateContract;
    }

    function setGBFactoryAddress(address _address) external onlyAdmin {
        IGBFactory candidateContract = IGBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        treeToken = candidateContract;
    }

    function addTree(uint256 _treeId, string memory _treeDescription)
        external
        onlyAdmin
    {
        require(!genTrees[_treeId].isExist, "duplicate tree");
        require(bytes(_treeDescription).length > 0, "invalid ipfs hash");

        genTrees[_treeId] = GenTree(
            address(0),
            0,
            0,
            0,
            0,
            true,
            1,
            0,
            0,
            0,
            0,
            _treeDescription
        );
    }

    function asignTreeToPlanter(
        uint256 _treeId,
        uint256 _gbId,
        address _planterId,
        uint8 _gbType
    ) external onlyAdmin validTree(_treeId) {
        require(genTrees[_treeId].treeStatus == 1, "the tree is planted");
        // (, , , bool isExistGb) = gbFactory.greenBlocks(_gbId);
        uint256 total = gbFactory.totalGB();
        require(_gbId < total, "invalid gb"); //TODO: aliad check here using gb.isExist after gb refactoring
        // require(address);

        if (_planterId != address(0)) {
            bool isInGb = false;

            for (
                uint256 index = 0;
                index < gbFactory.getGBPlantersCount(_gbId);
                index++
            ) {
                if (gbFactory.gbToPlanters(_gbId, index) == _planterId) {
                    isInGb = true;
                    break;
                }
            }

            require(isInGb, "invalid planter data");
            genTrees[_treeId].planterId = _planterId;
        }
        genTrees[_treeId].gbId = _gbId;
        genTrees[_treeId].gbType = _gbType;
    }

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external validTree(_treeId) {
        require(genTrees[_treeId].treeStatus == 1, "invalid status");
        if (genTrees[_treeId].planterId == address(0)) {
            require(_checkPlanter(_treeId, _msgSender()), "invalid access");
            genTrees[_treeId].planterId = _msgSender();
        } else {
            require(
                genTrees[_treeId].planterId == _msgSender(),
                "planter of tree can plant it"
            );
        }

        updateGenTrees[_treeId] = UpdateGenTree(_treeSpecs, now.toUint64(), 1);
        genTrees[_treeId].countryCode = _countryCode;
        genTrees[_treeId].birthDate = _birthDate;
    }

    function verifyPlant(uint256 _treeId, bool _isVerified)
        external
        validTree(_treeId)
    {
        require(
            genTrees[_treeId].treeStatus == 1 &&
                updateGenTrees[_treeId].updateStatus == 1,
            "invalid status"
        );
        require(
            genTrees[_treeId].planterId != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            accessRestriction.isAdmin(_msgSender()) ||
                _checkPlanter(_treeId, _msgSender()),
            "invalid access"
        );

        if (_isVerified) {
            genTrees[_treeId].treeSpecs = updateGenTrees[_treeId].updateSpecs;
            genTrees[_treeId].lastUpdate = updateGenTrees[_treeId].updateDate;
            genTrees[_treeId].treeStatus = 2;
            updateGenTrees[_treeId].updateStatus = 3;
        } else {
            updateGenTrees[_treeId].updateStatus = 2;
        }
    }

    function updateTree(uint256 _treeId, string memory _treeSpecs)
        external
        validTree(_treeId)
    {
        require(
            genTrees[_treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );

        require(genTrees[_treeId].treeStatus > 1, "Tree not planted");

        require(
            now >= genTrees[_treeId].lastUpdate.add(2592000),
            "Update time not reach"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        updateGenTree.updateDate = now.toUint64();
        updateGenTree.updateStatus = 1;
    }

    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        validTree(_treeId)
    {
        require(
            genTrees[_treeId].planterId != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            updateGenTrees[_treeId].updateStatus == 1,
            "update status must be pending!"
        );

        require(
            genTrees[_treeId].treeStatus > 1,
            "Tree status must be Planted"
        );

        require(
            accessRestriction.isAdmin(_msgSender()) ||
                _checkPlanter(_treeId, _msgSender()),
            "Admin or ambassador or planter can accept updates!"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        if (_isVerified) {
            GenTree storage genTree = genTrees[_treeId];

            genTree.lastUpdate = updateGenTree.updateDate;
            genTree.treeSpecs = updateGenTree.updateSpecs;
            genTree.treeStatus = genTree.treeStatus.add(1).toUint16();

            updateGenTree.updateStatus = 3;
            if (treeToken.exists(_treeId)) {
                //call genesis fund
            }
        } else {
            updateGenTree.updateStatus = 2;
        }
    }

    function checkAndSetProvideStatus(uint256 _treeId, uint8 _provideType)
        external
        onlyAuction
        returns (uint8)
    {
        uint8 nowProvideStatus = genTrees[_treeId].provideStatus;
        if (nowProvideStatus == 0) {
            genTrees[_treeId].provideStatus = _provideType;
        }
        return nowProvideStatus;
    }

    function updateOwner(uint256 _treeId, address _ownerId)
        external
        onlyAuction
    {
        genTrees[_treeId].provideStatus = 0;
        if (!treeToken.exists(_treeId)) {
            treeToken.safeMint(_ownerId, _treeId);
        } else {
            treeToken.safeTransferExtra(
                treeToken.ownerOf(_treeId),
                _ownerId,
                _treeId
            );
        }
    }

    // This function call when auction has no bider.
    function updateProvideStatus(uint256 _treeId) external onlyAuction {
        genTrees[_treeId].provideStatus = 0;
    }

    function _checkPlanter(uint256 _treeId, address _sender)
        private
        view
        returns (bool)
    {
        uint256 gbId = genTrees[_treeId].gbId;

        if (accessRestriction.isAmbassador(_sender)) {
            return gbFactory.gbToAmbassador(gbId) == _sender;
        } else {
            bool isInGB = false;

            for (
                uint256 index = 0;
                index < gbFactory.getGBPlantersCount(gbId);
                index++
            ) {
                if (gbFactory.gbToPlanters(gbId, index) == _sender) {
                    isInGB = true;
                    break;
                }
            }

            return isInGB;
        }
    }
}
