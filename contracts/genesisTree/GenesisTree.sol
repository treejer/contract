//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../greenblock/IGBFactory.sol";

contract GenesisTree is Initializable, RelayRecipient {
    bool public isGenesisTree;
    IAccessRestriction public accessRestriction;
    using SafeCastUpgradeable for uint256;
    IGBFactory public gbFactory;

    struct GenTree {
        address payable planterId;
        uint256 gbId;
        uint256 treeType;
        uint8 gbType;
        uint8 ownershipStatus;
        uint16 provideStatus;
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
    mapping(uint256 => GenTree) genTrees;
    mapping(uint256 => UpdateGenTree) updateGenTrees;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isGenesisTree = true;
        accessRestriction = candidateContract;
    }

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    function setGBFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());
        IGBFactory candidateContract = IGBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    function addTree(uint256 _treeId, string memory _treeDescription)
        external
        onlyAdmin
    {
        require(
            bytes(genTrees[_treeId].treeSpecs).length == 0,
            "duplicate tree"
        );
        require(bytes(_treeDescription).length > 0, "invalid ipfs hash");
        genTrees[_treeId] = GenTree(
            address(0),
            0,
            0,
            0,
            0,
            0,
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
        uint256 _gb,
        address payable _planterId,
        uint8 _gbType
    ) external onlyAdmin {
        require(bytes(genTrees[_treeId].treeSpecs).length > 0, "invalid tree");
        require(genTrees[_treeId].treeStatus == 1, "the tree is planted");
        //TODO:aliad010 check green block if
        if (
            gbFactory.greenBlocks(_gb).isExist &&
            address(_planterId) != address(0)
        ) {
            bool isInGB = false;

            for (
                uint256 index = 0;
                index < gbFactory.getGBPlantersCount(gbId);
                index++
            ) {
                if (gbFactory.gbToPlanters(gbId, index) == _msgSender()) {
                    isInGB = true;
                }
            }

            require(isInGB == true, "invalid planter data");
            genTrees[_treeId].gbId = _gb;
            genTrees[_treeId].planterId = _planterId;
            genTrees[_treeId].gbType = _gbType;
        }
    }

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {
        //TODO:aliad010 check who to call
        require(genTrees[_treeId].treeStatus == 1, "invalid status");
        // updateGenTrees[_treeId] = UpdateGenTree(_treeSpecs,block.timestamp,1);TODO:  aliad010 cast
        genTrees[_treeId].countryCode = _countryCode;
        genTrees[_treeId].birthDate = _birthDate;
    }

    function verifyPlant(uint256 _treeId, uint256 isVerified) external {
        require(
            accessRestriction.ifAdmin(_msgSender()) ||
                accessRestriction.ifPlanter(_msgSender()),
            "invalid access"
        );
        require(
            genTrees[_treeId].treeStatus == 1 &&
                updateGenTrees[_treeId].updateStatus == 1,
            "invalid status"
        );
        if (isVerified == 1) {
            genTrees[_treeId].treeSpecs = updateGenTrees[_treeId].updateSpecs;
            genTrees[_treeId].lastUpdate = updateGenTrees[_treeId].updateDate;
            genTrees[_treeId].treeStatus = 2;
            updateGenTrees[_treeId].updateStatus = 3;
        } else {
            updateGenTrees[_treeId].updateStatus = 2;
        }
    }

    function updateTree(uint256 treeId, string memory treeSpecs) external {
        require(
            genTrees[treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );

        require(genTrees[treeId].treeStatus > 1, "tree not planted");

        require(
            now >= genTrees[treeId].lastUpdate + 2592000,
            "update time not reach"
        );

        //TODO: Set updateTree
        updateGenTrees[treeId].updateSpecs = treeSpecs;
        updateGenTrees[treeId].updateDate = now.toUint64();
        updateGenTrees[treeId].updateStatus = 1;
    }

    function verifyUpdate() external {}

    function checkAndSetProvideStatus() external {}

    function updateOwner() external {}
}
