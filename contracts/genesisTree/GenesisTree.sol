//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

contract GenesisTree is Initializable, RelayRecipient {
    bool public isGenesisTree;
    IAccessRestriction public accessRestriction;
    using SafeCastUpgradeable for uint256;

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
            0,
            0,
            0,
            0,
            0,
            _treeDescription
        );
    }

    function asignTreeToPlanter() external onlyAdmin {}

    function plantTree() external {}

    function verifyPlant() external {}

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
