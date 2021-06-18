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
    bool public isGenesisTree;
    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IGBFactory public gbFactory;

    using SafeCastUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint16;

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
    mapping(uint256 => GenTree) genTrees;
    mapping(uint256 => UpdateGenTree) updateGenTrees;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    modifier onlyAuction() {
        accessRestriction.ifAuction(_msgSender());
        _;
    }

    modifier onlyTreePlanter(uint256 treeId) {
        require(
            genTrees[treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );
        _;
    }

    modifier validTree(uint256 _treeId) {
        require(genTrees[_treeId].isExist, "invalid tree");
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

    function setTreeTokenAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());

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
        (, , , bool isExistGb) = gbFactory.greenBlocks(_gbId);
        require(isExistGb, "invalid gb");

        if (address(_planterId) != address(0)) {
            bool isInGb = false;

            for (
                uint256 index = 0;
                index < gbFactory.getGBPlantersCount(_gbId);
                index++
            ) {
                if (gbFactory.gbToPlanters(_gbId, index) == _msgSender()) {
                    isInGb = true;
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
            accessRestriction.ifPlanterOrAmbassador(_msgSender());
            uint256 tempGbId = genTrees[_treeId].gbId;
            if (accessRestriction.isAmbassador(_msgSender())) {
                require(
                    gbFactory.gbToAmbassador(tempGbId) == _msgSender(),
                    "ambassador of gb can verify"
                );
            } else {
                bool isInGb = false;
                for (
                    uint256 index = 0;
                    index < gbFactory.getGBPlantersCount(tempGbId);
                    index++
                ) {
                    if (
                        gbFactory.gbToPlanters(tempGbId, index) == _msgSender()
                    ) {
                        isInGb = true;
                    }
                }
                require(
                    isInGb,
                    "only one of planters of that greenBlock can accept update!"
                );
            }
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

    function verifyPlant(uint256 _treeId, uint256 isVerified)
        external
        validTree(_treeId)
    {
        require(
            accessRestriction.isAdmin(_msgSender()) ||
                accessRestriction.isPlanter(_msgSender()),
            "invalid access"
        );
        require(
            genTrees[_treeId].treeStatus == 1 &&
                updateGenTrees[_treeId].updateStatus == 1,
            "invalid status"
        );
        if (accessRestriction.isAdmin(_msgSender()) != true) {
            require(
                genTrees[_treeId].planterId != _msgSender(),
                "planter cant verify his tree"
            );
            uint256 tempGbId = genTrees[_treeId].gbId;
            if (accessRestriction.isAmbassador(_msgSender())) {
                require(
                    gbFactory.gbToAmbassador(tempGbId) == _msgSender(),
                    "ambassador of gb can verify"
                );
            } else {
                bool isInGb = false;
                for (
                    uint256 index = 0;
                    index < gbFactory.getGBPlantersCount(tempGbId);
                    index++
                ) {
                    if (
                        gbFactory.gbToPlanters(tempGbId, index) == _msgSender()
                    ) {
                        isInGb = true;
                    }
                }
                require(
                    isInGb == true,
                    "only one of planters of that greenBlock can accept update!"
                );
            }
        }
        if (isVerified == 1) {
            genTrees[_treeId].treeSpecs = updateGenTrees[_treeId].updateSpecs;
            genTrees[_treeId].lastUpdate = updateGenTrees[_treeId].updateDate;
            genTrees[_treeId].treeStatus = 2;
            updateGenTrees[_treeId].updateStatus = 3;
        } else {
            updateGenTrees[_treeId].updateStatus = 2;
        }
    }

    function updateTree(uint256 treeId, string memory treeSpecs)
        external
        onlyTreePlanter(treeId)
    {
        require(genTrees[treeId].treeStatus > 1, "Tree not planted");

        require(
            now >= genTrees[treeId].lastUpdate.add(2592000),
            "Update time not reach"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[treeId];

        updateGenTree.updateSpecs = treeSpecs;
        updateGenTree.updateDate = now.toUint64();
        updateGenTree.updateStatus = 1;
    }

    function verifyUpdate(uint256 treeId, uint256 isVerified) external {
        require(
            genTrees[treeId].planterId != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            updateGenTrees[treeId].updateStatus == 1,
            "update status must be pending!"
        );

        require(genTrees[treeId].treeStatus > 1, "Tree status must be Planted");

        require(
            accessRestriction.isAdmin(_msgSender()) ||
                _checkPlanter(treeId, _msgSender()),
            "Admin or ambassador or planter can accept updates!"
        );

        if (isVerified == 1) {
            genTrees[treeId].lastUpdate = updateGenTrees[treeId].updateDate;
            genTrees[treeId].treeSpecs = updateGenTrees[treeId].updateSpecs;
            genTrees[treeId].treeStatus = genTrees[treeId]
                .treeStatus
                .add(1)
                .toUint16();
            updateGenTrees[treeId].updateStatus = 3;
            //ownerType moshakhas nist
        } else {
            updateGenTrees[treeId].updateStatus = 2;
        }
    }

    function checkAndSetProvideStatus(uint256 treeId, uint8 provideType)
        external
        onlyAuction
        returns (uint8)
    {
        uint8 nowProvideStatus = genTrees[treeId].provideStatus;
        if (nowProvideStatus == 0) {
            genTrees[treeId].provideStatus = provideType;
        }
        return nowProvideStatus;
    }

    function updateOwner(uint256 treeId, address ownerId) external onlyAuction {
        genTrees[treeId].provideStatus = 0;
        if (!treeToken.exists(treeId)) {
            treeToken.safeMint(ownerId, treeId);
        } else {
            treeToken.safeTransferExtra(
                treeToken.ownerOf(treeId),
                ownerId,
                treeId
            );
        }
    }

    function _checkPlanter(uint256 treeId, address sender)
        private
        view
        returns (bool)
    {
        uint256 gbId = genTrees[treeId].gbId;

        if (accessRestriction.isAmbassador(sender)) {
            return gbFactory.gbToAmbassador(gbId) == sender;
        } else {
            bool isInGB = false;

            for (
                uint256 index = 0;
                index < gbFactory.getGBPlantersCount(gbId);
                index++
            ) {
                if (gbFactory.gbToPlanters(gbId, index) == sender) {
                    isInGB = true;
                    break;
                }
            }

            return isInGB;
        }
    }
}
