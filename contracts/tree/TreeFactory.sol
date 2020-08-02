// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../access/AccessRestriction.sol";
import "./TreeType.sol";


contract TreeFactory is ERC721, AccessRestriction {

    constructor() ERC721("Tree", "TREE") public {
    }

    event PriceChanged(uint256 price);

    event TreePlanted(
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
        uint256 fundedDate;
        uint8 height;
        uint8 diameter;
        uint256 balance;
    }

    Tree[] public trees;

    uint256 public price;

    mapping(uint => uint) public notFundedTrees;
    uint256 notFundedTreesLastIndex;
    uint256 notFundedTreesUsedIndex;

    mapping(uint => uint) public notPlantedTrees;
    uint256 notPlantedTreesLastIndex;
    uint256 notPlantedTreesUsedIndex;


    mapping(uint256 => uint8) public treeToType;
    mapping(uint256 => uint256) public treeToGB;
    mapping(uint256 => address) public treeToPlanter;
    mapping(uint256 => address) public treeToConserver;
    mapping(uint256 => address) public treeToVerifier;
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
    ) external onlyPlanter whenNotPaused {

        uint256 id = 0;

        if(this.notPlantedTreesExists() == true) {
            id = notPlantedTrees[notPlantedTreesUsedIndex];
            notPlantedTreesUsedIndex++;

            trees[id].name = _stringParams[0];
            trees[id].latitude = _stringParams[1];
            trees[id].longitude = _stringParams[2];
            trees[id].plantedDate = now;
            trees[id].birthDate = now;
            trees[id].height = _uintParams[0];
            trees[id].diameter = _uintParams[1];

            delete notPlantedTrees[notPlantedTreesUsedIndex - 1];

        } else {


            trees.push(
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
            );
            id = trees.length - 1;

            notFundedTrees[notFundedTreesLastIndex] = id;
            notFundedTreesLastIndex++;
            _mint(msg.sender, id);
        }

        typeTreeCount[_typeId]++;

        treeToGB[id] = _gbId;
        gbTreeCount[_gbId]++;

        emit TreePlanted(
            id,
            _stringParams[0],
            _stringParams[1],
            _stringParams[2]
        );
    }

    function simpleFund(
        address _account,
        uint256 _balance
    ) public returns(uint256) {
        string memory name = string('types name trees.length');


        trees.push(
            Tree(
                name,
                '',
                '',
                0,
                0,
                now,
                0,
                0,
                _balance
            )
        );
        uint256 id = trees.length - 1;


        notPlantedTrees[notPlantedTreesLastIndex] = id;
        notPlantedTreesLastIndex++;

        _mint(_account, id);

        return id;

    }

    function fundPlantedTress(address _account, uint256 _balance) public returns(uint256) {

        require(this.notFundedTreesExists(), "There is not funded trees");

        uint treeId = notFundedTrees[notFundedTreesUsedIndex];
        notFundedTreesUsedIndex++;

        trees[treeId].balance = _balance;
        trees[treeId].fundedDate = now;

        _transfer(ownerOf(treeId), _account, treeId);

        delete notFundedTrees[notFundedTreesUsedIndex - 1];

        return treeId;
    }

    function notFundedTreesExists() public view returns(bool) {
        return notFundedTreesLastIndex > notFundedTreesUsedIndex;
    }

    function notPlantedTreesExists() public view returns(bool) {
        return notPlantedTreesLastIndex > notPlantedTreesUsedIndex;
    }

    function ownerTreesCount(address _account) public view returns (uint256) {
        return balanceOf(_account);
    }

    function treeOwner(uint256 _treeId) public view returns (address) {
        return ownerOf(_treeId);
    }

    function getOwnerTrees(address _account) public view returns (uint256[] memory) {

        uint256 tokenCount = balanceOf(_account);

        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        }

        uint256[] memory result = new uint256[](tokenCount);

        for (uint256 index = 0; index < tokenCount; index++) {
            result[index] = tokenOfOwnerByIndex(_account, index);
        }

        return result;
    }

    function getTypeId(uint256 _treeId) public view returns (uint256) {
        return treeToType[_treeId];
    }

    function getPlantedDate(uint256 _id) public view returns (uint256) {
        return trees[_id].plantedDate;
    }

    function getFundedDate(uint256 _id) public view returns (uint256) {
        return trees[_id].fundedDate;
    }

    function setPrice(uint256 _price) external onlyAdmin {
        price = _price;
        emit PriceChanged(_price);
    }

    function getPrice() external view returns(uint256) {
        return price;
    }

    function getTree(uint256 _treeId) external view returns(
        string memory name,
        string memory latitude,
        string memory longitude,
        uint256 plantedDate,
        uint256 birthDate,
        uint256 fundedDate,
        uint8 height,
        uint8 diameter,
        uint256 balance,
        address owner
    ) {
        require(_exists(_treeId), "ERC721: nonexistent token");

        name = trees[_treeId].name;
        latitude = trees[_treeId].latitude;
        longitude = trees[_treeId].longitude;
        plantedDate = trees[_treeId].plantedDate;
        birthDate = trees[_treeId].birthDate;
        fundedDate = trees[_treeId].fundedDate;
        height = trees[_treeId].height;
        diameter = trees[_treeId].diameter;
        balance = trees[_treeId].balance;
        owner = ownerOf(_treeId);
    }
}
