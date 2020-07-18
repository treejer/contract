pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "../../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

import "./AccessRestriction.sol";
import "./TreeType.sol";


contract TreeFactory is TreeType, AccessRestriction {
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
        uint256 plantedDate;
        uint256 birthDate;
        uint fundedDate;
        uint8 height;
        uint8 diameter;
        uint256 balance;
    }

    Tree[] public trees;

    mapping(uint256 => uint8) public treeToType;
    mapping(uint256 => uint256) public treeToGB;
    mapping(uint256 => address) public treeToOwner;
    mapping(uint256 => address) public treeToPlanter;
    mapping(uint256 => address) public treeToConserver;
    mapping(uint256 => address) public treeToVerifier;
    mapping(address => uint256[]) public ownerTrees;
    mapping(address => uint256) ownerTreeCount;
    mapping(address => uint256) planterTreeCount;
    mapping(address => uint256) conserverTreeCount;
    mapping(address => uint256) verifierTreeCount;
    mapping(uint256 => uint256) typeTreeCount;
    mapping(uint256 => uint256) gbTreeCount;




    //@todo permission must check
    function add(
        uint8 _typeId,
        uint256 _gbId,
        string[] calldata _stringParams,
        uint8[] calldata _uintParams
    ) external {
        uint256 id = trees.push(
            Tree(
                _stringParams[0],
                _stringParams[1],
                _stringParams[2],
                now,
                now,
                0,
                _uintParams[0],
                _uintParams[1],
                0
            )
        ) -
            1;

        treeToType[id] = _typeId;
        typeTreeCount[_typeId]++;

        treeToGB[id] = _gbId;
        gbTreeCount[_gbId]++;

        treeToOwner[id] = msg.sender;
        ownerTreeCount[msg.sender]++;
        ownerTrees[msg.sender].push(id);

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

}
