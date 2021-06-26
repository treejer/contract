//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../greenblock/IGBFactory.sol";
import "../tree/ITree.sol";
import "../treasury/ITreasury.sol";

contract GenesisTree is Initializable, RelayRecipient {
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint32;
    using SafeMathUpgradeable for uint16;

    bool public isGenesisTree;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IGBFactory public gbFactory;
    ITreasury public treasury;

    struct GenTree {
        address payable planterId;
        uint256 gbId;
        uint256 treeType;
        // bool isExist;
        uint8 gbType;
        uint8 provideStatus; //uint16
        uint16 countryCode;
        uint32 treeStatus; //uint16
        uint64 plantDate;
        uint64 birthDate;
        // uint64 lastUpdate;
        string treeSpecs;
    }

    struct UpdateGenTree {
        string updateSpecs;
        // uint64 updateDate;
        uint64 updateStatus;
    }

    mapping(uint256 => GenTree) public genTrees;
    mapping(uint256 => UpdateGenTree) public updateGenTrees;

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

    modifier validTree(uint256 _treeId) {
        require(genTrees[_treeId].treeStatus > 0, "invalid tree");
        _;
    }

    modifier validIpfs(string memory _ipfs) {
        require(bytes(_ipfs).length > 0, "invalid ipfs hash");
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isGenesisTree = true;
        accessRestriction = candidateContract;
    }

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    function setGBFactoryAddress(address _address) external onlyAdmin {
        IGBFactory candidateContract = IGBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    function setTreasuryddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);
        require(candidateContract.isTreasury());
        treasury = candidateContract;
    }

    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        treeToken = candidateContract;
    }

    function addTree(uint256 _treeId, string memory _treeDescription)
        external
        onlyAdmin
        validIpfs(_treeDescription)
    {
        require(genTrees[_treeId].treeStatus == 0, "duplicate tree");

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
            _treeDescription
        );
    }

    function asignTreeToPlanter(
        uint256 _treeId,
        uint256 _gbId,
        address payable _planterId,
        uint8 _gbType
    ) external onlyAdmin validTree(_treeId) {
        require(genTrees[_treeId].treeStatus == 1, "the tree is planted");

        uint256 total = gbFactory.totalGB();

        require(_gbId < total, "invalid gb");

        if (_planterId != address(0)) {
            require(
                _checkPlanterIsInGb(_gbId, _planterId),
                "invalid planter data"
            );
        }

        GenTree storage tempGenTree = genTrees[_treeId];

        tempGenTree.planterId = _planterId;
        tempGenTree.gbId = _gbId;
        tempGenTree.gbType = _gbType;
    }

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external validTree(_treeId) validIpfs(_treeSpecs) {
        require(
            genTrees[_treeId].treeStatus == 1,
            "invalid tree status for plant"
        );

        GenTree storage tempGenTree = genTrees[_treeId];

        if (tempGenTree.planterId == address(0)) {
            require(
                _checkPlanterIsInGb(tempGenTree.gbId, _msgSender()),
                "planter in gb can plant tree"
            );

            tempGenTree.planterId = _msgSender();
        } else {
            require(
                tempGenTree.planterId == _msgSender(),
                "planter of tree can plant it"
            );
        }

        // updateGenTrees[_treeId] = UpdateGenTree(_treeSpecs, now.toUint64(), 1);
        updateGenTrees[_treeId] = UpdateGenTree(_treeSpecs, 1);

        tempGenTree.countryCode = _countryCode;
        tempGenTree.birthDate = _birthDate;
        tempGenTree.plantDate = now.toUint64();

        emit TreePlanted(_treeId, tempGenTree.planterId);
    }

    function verifyPlant(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
        validTree(_treeId)
    {
        require(genTrees[_treeId].treeStatus == 1, "invalid tree status");

        require(
            updateGenTrees[_treeId].updateStatus == 1,
            "invalid update status"
        );

        require(
            genTrees[_treeId].planterId != _msgSender(),
            "Planter of tree can't accept update"
        );

        require(
            accessRestriction.isAdmin(_msgSender()) ||
                _checkPlanterOrAmbassador(_treeId, _msgSender()),
            "ambassador or planter can verify plant"
        );

        UpdateGenTree storage tempUpdateGenTree = updateGenTrees[_treeId];

        if (_isVerified) {
            GenTree storage tempGenTree = genTrees[_treeId];

            tempGenTree.treeSpecs = tempUpdateGenTree.updateSpecs;
            // tempGenTree.lastUpdate = tempUpdateGenTree.updateDate;
            tempGenTree.treeStatus = 2;

            tempUpdateGenTree.updateStatus = 3;
        } else {
            tempUpdateGenTree.updateStatus = 2;
        }

        emit PlantVerified(_treeId, tempUpdateGenTree.updateStatus);
    }

    function updateTree(uint256 _treeId, string memory _treeSpecs)
        external
        validTree(_treeId)
        validIpfs(_treeSpecs)
    {
        require(
            genTrees[_treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );
        require(genTrees[_treeId].treeStatus > 1, "Tree not planted");
        require(
            now >=
                genTrees[_treeId].plantDate.add(
                    genTrees[_treeId].treeStatus.mul(3600).add(86400)
                ) &&
                updateGenTrees[_treeId].updateStatus != 1,
            "Update time not reach"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        updateGenTree.updateSpecs = _treeSpecs;
        // updateGenTree.updateDate = now.toUint64();
        updateGenTree.updateStatus = 1;

        emit TreeUpdated(_treeId);
    }

    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
        validTree(_treeId)
    {
        require(
            genTrees[_treeId].planterId != _msgSender(),
            "Planter of tree can't verify update"
        );
        require(
            updateGenTrees[_treeId].updateStatus == 1,
            "update status must be pending"
        );
        require(genTrees[_treeId].treeStatus > 1, "Tree not planted");
        require(
            accessRestriction.isAdmin(_msgSender()) ||
                _checkPlanterOrAmbassador(_treeId, _msgSender()),
            "Admin or ambassador or planter can accept updates"
        );

        UpdateGenTree storage updateGenTree = updateGenTrees[_treeId];

        if (_isVerified) {
            GenTree storage genTree = genTrees[_treeId];

            // genTree.lastUpdate = updateGenTree.updateDate;
            updateGenTree.updateStatus = 3;
            uint32 age = now
            .sub(genTrees[_treeId].plantDate)
            .div(3600)
            .toUint32();
            if (age > genTree.treeStatus) {
                genTree.treeStatus = age;
            }
            genTree.treeSpecs = updateGenTree.updateSpecs;
            // genTree.treeStatus = genTree.treeStatus.add(1).toUint16();

            //call genesis fund
            treasury.fundPlanter(
                _treeId,
                genTree.planterId,
                genTree.treeStatus
            );
        } else {
            updateGenTree.updateStatus = 2;
        }

        emit UpdateVerified(_treeId, updateGenTree.updateStatus);
    }

    function checkAndSetProvideStatus(uint256 _treeId, uint8 _provideType)
        external
        onlyAuction
        validTree(_treeId)
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

        treeToken.safeMint(_ownerId, _treeId);
    }

    function updateProvideStatus(uint256 _treeId) external onlyAuction {
        genTrees[_treeId].provideStatus = 0;
    }

    function _checkPlanterIsInGb(uint256 _gbId, address _planterId)
        private
        view
        returns (bool)
    {
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
        return isInGb;
    }

    function _checkPlanterOrAmbassador(uint256 _treeId, address _sender)
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
