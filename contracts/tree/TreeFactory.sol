pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/contracts/token/ERC1155/ERC1155.sol";

contract TreeFactory is ERC1155 {

    struct Tree {
        string name;
        uint latitude;
        uint longitude;
        string plantedDate;
        string birthDate;
        uint8 height;
        uint8 diameter;
        uint price;
        string status;
    }

    Tree[] public trees;

    //    mapping (uint => mapping(uint8 => address)) public treeToRelation;

    mapping(uint => uint8) public treeToType;
    mapping(uint => address) public treeToOwner;
    mapping(uint => address) public treeToPlanter;
    mapping(uint => address) public treeToConserver;
    mapping(uint => address) public treeToVerifier;
    mapping(address => uint) ownerTreeCount;
    mapping(address => uint) planterTreeCount;
    mapping(address => uint) conserverTreeCount;
    mapping(address => uint) verifierTreeCount;
    mapping(uint => uint) typeTreeCount;

    //
    //
    //    mapping (uint256 => TreeDoc) Trees;
    //
    //    function mintTree(
    //    uint256 treeId,
    //    address clientId,
    //    string memory createdDate,
    //    string memory lastUpdate,
    //    string memory procedure,
    //    string memory status,
    //    string memory planter,
    //    string memory conserver,
    //    string memory ranger) public onlyOwner returns (uint256) {
    //      TreeDoc storage _tree = Trees[treeId];
    //      _tree.clientId = clientId;
    //      _tree.createdDate = createdDate;
    //      _tree.lastUpdate = lastUpdate;
    //      _tree.procedure = procedure;
    //      _tree.status = status;
    //      _tree.planter = planter;
    //      _tree.conserver = conserver;
    //      _tree.ranger = ranger;
    //
    //      _mint(clientId, treeId);
    //    }
    //
    //    function setTreeType(
    //      uint256 treeId,
    //      string memory typeName,
    //      string memory scientificName,
    //      uint256 price,
    //      string memory geolocation,
    //      string memory region,
    //      string memory drive,
    //      uint256 age,
    //      uint256 O2RatePerDay) public onlyOwner {
    //        TreeDoc storage _tree = Trees[treeId];
    //        _tree.treeType.typeName = typeName;
    //        _tree.treeType.scientificName = scientificName;
    //        _tree.treeType.price = price;
    //        _tree.treeType.geolocation = geolocation;
    //        _tree.treeType.region = region;
    //        _tree.treeType.drive = drive;
    //        _tree.treeType.age = age;
    //        _tree.treeType.O2RatePerDay = O2RatePerDay;
    //      }
    //
    //    function getType(uint256 treeId) public view returns (
    //      string memory typeName,
    //      string memory scientificName,
    //      uint256 price,
    //      string memory geolocation,
    //      string memory region,
    //      string memory drive,
    //      uint256 age,
    //      uint256 O2RatePerDay) {
    //        TreeType memory _tree = Trees[treeId].treeType;
    //        return (
    //          _tree.typeName,
    //          _tree.scientificName,
    //          _tree.price,
    //          _tree.geolocation,
    //          _tree.region,
    //          _tree.drive,
    //          _tree.age,
    //          _tree.O2RatePerDay);
    //    }
    //
    //    function getTreeDoc(uint256 treeId) public view returns (
    //      address clientId,
    //      string memory createdDate,
    //      string memory lastUpdate,
    //      string memory procedure,
    //      string memory status,
    //      string memory planter,
    //      string memory conserver,
    //      string memory ranger) {
    //        TreeDoc memory _tree = Trees[treeId];
    //        return (
    //          _tree.clientId,
    //          _tree.createdDate,
    //          _tree.lastUpdate,
    //          _tree.procedure,
    //          _tree.status,
    //          _tree.planter,
    //          _tree.conserver,
    //          _tree.ranger
    //        );
    //    }
}