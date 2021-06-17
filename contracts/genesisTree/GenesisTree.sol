// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";

contract GenesisTree is Initializable {
    bool public isGenesisTree;
    IAccessRestriction public accessRestriction;
    struct GenTree {
        address planterId;
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
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function addTree() external onlyAdmin {}

    function asignTreeToPlanter() external onlyAdmin {}

    function plantTree() external {}

    function verifyPlant() external {}

    function updateTree() external {}

    function verifyUpdate() external {}

    function checkAndSetProvideStatus() external {}

    function updateOwner() external {}
}
