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

    IGBFactory public gbFactory;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
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
        uint256 _gb,
        address payable _planterId,
        uint8 _gbType
    ) external onlyAdmin validTree(_treeId) {
        require(genTrees[_treeId].treeStatus == 1, "the tree is planted");
        require(gbFactory.greenBlocks(_gb).isExist, "invalid gb");

        if (address(_planterId) != address(0)) {
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
        }
        genTrees[_treeId].gbId = _gb;
        genTrees[_treeId].planterId = _planterId;
        genTrees[_treeId].gbType = _gbType;
    }

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external validTree(_treeId) {
        if (genTrees[_treeId].planterId == address(0)) {
            uint256 tempGbId = genTrees[_treeId].gbId;
            if (accessRestriction.isAmbassador(_msgSender())) {
                require(
                    gbFactory.gbToAmbassador(_gbId) == _msgSender(),
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
                        isInGB = true;
                    }
                }
                require(
                    isInGB == true,
                    "only one of planters of that greenBlock can accept update!"
                );
            }
        } else {
            accessRestriction.ifPlanterOrAmbassador(_msgSender());
            require(genTrees[_treeId].planterId == _msgSender());
        }

        require(genTrees[_treeId].treeStatus == 1, "invalid status");
        updateGenTrees[_treeId] = UpdateGenTree(_treeSpecs, block.timestamp, 1);
        genTrees[_treeId].countryCode = _countryCode;
        genTrees[_treeId].birthDate = _birthDate;
    }

    function verifyPlant(uint256 _treeId, uint256 isVerified)
        external
        validTree(_treeId)
    {
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
        if (accessRestriction.isAdmin(_msgSender()) != true) {
            require(
                genTrees[_treeId].planterId != _msgSender(),
                "planter cant verify his tree"
            );
            uint256 tempGbId = genTrees[_treeId].gbId;
            if (accessRestriction.isAmbassador(_msgSender())) {
                require(
                    gbFactory.gbToAmbassador(_gbId) == _msgSender(),
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
                        isInGB = true;
                    }
                }
                require(
                    isInGB == true,
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

    //
    function verifyUpdate(uint256 treeId, uint256 isVerified) external {
        require(
            accessRestriction.isAdmin(_msgSender()) ||
                accessRestriction.isPlanterOrAmbassador(_msgSender()),
            "Admin or ambassador or planter can accept updates!"
        );

        require(
            updateGenTrees[treeId].updateStatus == 1,
            "update status must be pending!"
        );

        require(
            updateGenTrees[treeId].updateStatus == 1,
            "update status must be pending!"
        );

        require(genTrees[treeId].treeStatus > 1, "tree status must be Planted");

        if (accessRestriction.isAdmin(_msgSender()) != true) {
            require(
                genTrees[treeId].planterId != _msgSender(),
                "Planter of tree can't accept update"
            );

            uint256 gbId = genTrees[treeId].gbId;

            if (accessRestriction.isAmbassador(_msgSender())) {
                require(
                    gbFactory.gbToAmbassador(gbId) == _msgSender(),
                    "only ambassador of that greenBlock can accept update!"
                );
            } else {
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

                require(
                    isInGB == true,
                    "only one of planters of that greenBlock can accept update!"
                );
            }
        }

        if (isVerified == 1) {
            genTrees[treeId].lastUpdate = updateGenTrees[treeId].updateDate;
            genTrees[treeId].treeSpecs = updateGenTrees[treeId].updateSpecs;
            genTrees[treeId].treeStatus += 1;
            updateGenTrees[treeId].updateStatus = 3;
            //ownerType moshakhas nist
        } else {
            updateGenTrees[treeId].updateStatus = 2;
        }
    }

    function checkAndSetProvideStatus(uint256 treeId, uint16 provideType)
        external
        returns (uint16)
    {
        uint16 nowProvideStatus = genTrees[treeId].provideStatus;
        if (nowProvideStatus == 0) {
            genTrees[treeId].provideStatus = provideType;
        }
        return nowProvideStatus;
    }

    function updateOwner(uint256 treeId, address ownerId) external {
        genTrees[treeId].provideStatus = 0;
    }
}
