// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";
import "./ITree.sol";

import "../utils/RandomNumberConsumer.sol";
import "../utils/Bits.sol";



contract TreeAttribute is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint8;
    using SafeCastUpgradeable for uint256;

    using Bits for uint256;
    using Bits for uint8;

    CountersUpgradeable.Counter private attributeId;
    bool public isAttribute;
    address randomNumberConsumer;

    IAccessRestriction public accessRestriction;
    ITree public tree;
    RandomNumberConsumer public randomNumber;

    // 1)root Type => 8types     3bits
    // 2)trunk Height =>veryTall(1/8),tall(2/8),short (2/8),medium(3/8)  3bits
    // 3)trunk diameter ⇒ thin(2/8),thick(2/8),medium(3/8) ,veryThick(1/8) 3bits
    // 4)trunk color =>OliveDrab, Maroon,firebrick,darkKhaki,BurlyWood,DarkSlateGray,... 16 colors 4bits
    // 4.5)root colors 8 colors 3bits
    // 5)trunk shape =>{twisted(1/8),conical(2/8),vShape(2/8),typical(3/8)} 3bits
    // 6)crown Type =>8types 3bits
    // 7) diameter of crown => thin(2/8),thick(2/8),medium(3/8) ,veryThick(1/8) 3bits
    // 8) height of crown =>veryTall(1/8),tall(2/8),short (2/8),medium(3/8)  3bits
    // 9)color of crown 8 colors 3green, 2 orange, 1 red, 1 violate, 1 yellow 3bits
    // 10)has fruit (112/128 nofruit,8/128 pine,3/128 orange,1/128 yellow Apple,1/128 red apple, cherry 1/128,peach 1/128, grapes 1/128) 7bits
    // 11) leafType 8 types 3 bits
    // 12)//tree age 5-50 (step five)
    // 13)seed generation coefficient 1-8 3bits

    // Mapping tree =>symbol
    // Mapping symbolExistance   uint256 => uint32
    // diametersValue=[‘Thin’,’Medium’,’Thick’,’veryThick’]
    // heightValue=[‘Short’,’Medium’,’Tall’,’veryTall’]
    // trunkShape=[‘Vshape’,’canonical’,’typical’,’twisted’]
    // fruits=[‘noFruit’,’pine’,’orange’,’yellowApple’,’redApple’,’cherry’,’peach’,’Grapes’]

    struct Attribute {
        uint256 treeId;
        bool exists;

        // uint256 rootId;
        // uint256 trunkId;
        // uint256 crownId;
        // uint256 specialSpecId;
        // uint8 rootType;
        // uint8 rootColor;
        // uint8 trunkHeight;
        // uint8 trunkDiameter;
        // uint8 trunkColor;
        // uint8 trunkShape;
        // uint8 crownType;
        // uint8 crownDiameter;
        // uint8 crownHeight;
        // uint8 crownColor;
        // uint8 hasFruit;
        // uint8 treeAge;
        // uint8 mutiplier;
    }
    struct Root {
        uint8 rootType;
        uint8 rootColor;
    }

    struct Trunk {
        uint8 trunkHeight;
        uint8 trunkDiameter;
        uint8 trunkColor;
        uint8 trunkShape;
    }

    struct Crown {
        uint8 crownType;
        uint8 crownDiameter;
        uint8 crownHeight;
        uint8 crownColor;
    }

    struct SpecialSpecification {
        uint8 hasFruit;
        uint8 treeAge;
        uint8 mutiplier;
    }

    // all mapping from treeId to specs 1 to 1
    // 1 tree can have 1 attribute, 1 root, 1 trunk, 1 crown, 1 specialSpecification
    mapping(uint256 => Attribute) public attributes;
    mapping(uint256 => Root) public roots;
    mapping(uint256 => Trunk) public trunks;
    mapping(uint256 => Crown) public crowns;
    mapping(uint256 => SpecialSpecification) public specialSpecifications;

    event Log(uint256 randNum);
    event LogByte32(bytes32 randNum);

    event AttributeAdded(uint256 attributeId, uint256 treeId);
    event AttributeUpdated(uint256 attributeId, uint256 treeId);

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }
    modifier onlyTreeOwner(uint256 _treeId) {
        require(tree.ownerOf(_treeId) == msg.sender, "Caller not tree owner");
        _;
    }

    modifier notExists(uint256 _treeId) {
        require(attributes[_treeId].exists, "attribute exists");
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isAttribute = true;
        accessRestriction = candidateContract;
    }

    // function setTreasuryAddress(address payable _treasuryAddress)
    //     external
    //     onlyAdmin
    // {
    //     treasuryAddress = _treasuryAddress;
    // }

    function setTreeAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        tree = candidateContract;
    }

    function setRandomNumberConsumerAddress(RandomNumberConsumer _address)
        external
        onlyAdmin
    {
        // RandomNumberConsumer candidateContract = RandomNumberConsumer(_address);
        // require(candidateContract.isRandomNumberConsumer());
        randomNumber = _address;
    }

    // function generateUniqueAttribute(uint256 _treeId)
    //     external
    //     ifNotPaused
    //     notExists(_treeId)
    // {

    bytes32 public requestIdG;
    uint256 public randNumG;

    uint8 public a;
    uint8 public b;
    uint8 public c;

    function generateUniqueAttribute(uint256 _treeId) external {
        // call random number
        requestIdG = randomNumber.getRandomNumber();

        emit LogByte32(requestIdG);

        // uint256 randNum = randomNumber.fulfillRandomness(requestId);
        randNumG = randomNumber.randomResult();

        
    //     struct Root {
    //     uint8 rootType;
    //     uint8 rootColor;
    // }

    //     roots[_treeId] = Root(
    //         _treeId,
    //         address(0),
    //         bytes32("started"),
    //         _startDate,
    //         _endDate,
    //         _intialPrice,
    //         _bidInterval
    //     );    



        // a = uint8( randNumG.getFirstN(3) ^ 7);
        // randNumG = randNumG.mod(8);

        // b = uint8(randNumG.getFirstN(3) ^ 7);
        // randNumG = randNumG.mod(8);


        a = uint8(randNumG.getFirstN(3));
        randNumG = randNumG.mod(8);

        b = uint8(randNumG.getFirstN(3));
        randNumG = randNumG.mod(8);

        // c = uint8(randNumG.getFirstN(3).xor(15));
        // randNumG = randNumG.and(16);


        // uint256[] memory rootType = randomNumber.expand(randNumG, 2, 0, 8);
        // a = uint8(rootType[0]);
        // b = uint8(rootType[1]);
        



        //generate attributes
        emit Log(randNumG);

        // revert("sasa");

        // trunkHeightRand
    }
}
