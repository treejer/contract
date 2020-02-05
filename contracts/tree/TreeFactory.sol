pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;
import "../../node_modules/openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";

contract TreeFactory {
    event NewTreeAdded(
        uint256 id,
        string name,
        string latitude,
        string longitude
    );

    struct Tree {
        string name;
        string latitude;
        string longitude;
        string plantedDate;
        string birthDate;
        uint8 height;
        uint8 diameter;
    }

    Tree[] public trees;

    //    mapping (uint => mapping(uint8 => address)) public treeToRelation;

    mapping(uint256 => uint8) public treeToType;
    mapping(uint256 => address) public treeToOwner;
    mapping(uint256 => address) public treeToPlanter;
    mapping(uint256 => address) public treeToConserver;
    mapping(uint256 => address) public treeToVerifier;
    mapping(address => uint256) ownerTreeCount;
    mapping(address => uint256) planterTreeCount;
    mapping(address => uint256) conserverTreeCount;
    mapping(address => uint256) verifierTreeCount;
    mapping(uint256 => uint256) typeTreeCount;

    //    //@todo permission must check
    //    function create(string calldata _typeId, string calldata _name, string calldata _latitude,
    //        string calldata _longitude, string calldata _plantedDate, string calldata _birthDate, string calldata _height,
    //        string calldata _diameter, string calldata _price, string calldata _status) external
    //    {
    //        //        uint id = types.push(Type(_name, _scientificName, _O2Formula)) - 1;
    //        //        emit NewType(id, _name, _scientificName, _O2Formula);
    //    }

    //@todo permission must check
    function add(
        uint8 _typeId,
        string[] calldata _stringParams,
        uint8[] calldata _uintParams
    ) external {
        uint256 id = trees.push(
            Tree(
                _stringParams[0],
                _stringParams[1],
                _stringParams[2],
                _stringParams[3],
                _stringParams[4],
                _uintParams[0],
                _uintParams[1]
            )
        ) -
            1;

        treeToType[id] = _typeId;
        typeTreeCount[_typeId]++;

        treeToOwner[id] = msg.sender;
        ownerTreeCount[msg.sender]++;

        emit NewTreeAdded(
            id,
            _stringParams[0],
            _stringParams[1],
            _stringParams[2]
        );
    }

    function ownerTreesCount() public view returns (uint256) {
        return ownerTreeCount[msg.sender];
    }

    function treeOwner(uint256 _treeId) public view returns (address) {
        return treeToOwner[_treeId];
    }

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
