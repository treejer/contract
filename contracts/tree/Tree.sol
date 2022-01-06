// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./ITree.sol";

/** @title Tree Contract */
contract Tree is ERC721Upgradeable, ITree {
    struct Attribute {
        uint8 attribute1;
        uint8 attribute2;
        uint8 attribute3;
        uint8 attribute4;
        uint8 attribute5;
        uint8 attribute6;
        uint8 attribute7;
        uint8 attribute8;
        uint8 generationType;
    }
    struct Symbol {
        uint8 shape;
        uint8 trunkColor;
        uint8 crownColor;
        uint8 coefficient;
        uint8 generationType;
    }

    /** NOTE {isTree} set inside the initialize to {true} */
    bool public override isTree;

    IAccessRestriction public accessRestriction;

    string public override baseURI;

    /** NOTE mapping of tokenId to attributes */
    mapping(uint256 => Attribute) public override attributes;
    /** NOTE mapping of tokenId to symbols */
    mapping(uint256 => Symbol) public override symbols;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
        _;
    }

    /**
     * @dev initialize AccessRestriction contract and set true for isTree
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     * @param baseURI_ initial baseURI
     */
    function initialize(
        address _accessRestrictionAddress,
        string calldata baseURI_
    ) external override initializer {
        isTree = true;

        __ERC721_init("Tree", "TREE");

        baseURI = baseURI_;

        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set _baseURI
     * @param baseURI_ baseURI value
     */
    function setBaseURI(string calldata baseURI_) external override onlyAdmin {
        baseURI = baseURI_;
    }

    /**
     * @dev mint {_tokenId} to {_to}
     */
    function mint(address _to, uint256 _tokenId)
        external
        override
        onlyTreejerContract
    {
        _mint(_to, _tokenId);
    }

    /**
     * @dev set attribute and symbol for a tokenId based on {_uniquenessFactor}
     * NOTE symbol set when {_generationType} is more than 15 (for HonoraryTree and IncremetalSale)
     * @param _tokenId id of token
     * @param _uniquenessFactor uniqueness factor
     * @param _generationType type of generation
     */
    function setAttributes(
        uint256 _tokenId,
        uint256 _uniquenessFactor,
        uint8 _generationType
    ) external override onlyTreejerContract {
        uint8[] memory attribute = new uint8[](8);

        for (uint256 i = 0; i < 8; i++) {
            attribute[i] = uint8(_uniquenessFactor & 255);
            _uniquenessFactor >>= 8;
        }

        attributes[_tokenId] = Attribute(
            attribute[0],
            attribute[1],
            attribute[2],
            attribute[3],
            attribute[4],
            attribute[5],
            attribute[6],
            attribute[7],
            _generationType
        );

        if (_generationType > 15) {
            //TODO:chagne 5==>4(effect removed)
            for (uint256 i = 0; i < 4; i++) {
                attribute[i] = uint8(_uniquenessFactor & 255);

                _uniquenessFactor >>= 8;
            }

            //TODO:remove effect
            symbols[_tokenId] = Symbol(
                attribute[0],
                attribute[1],
                attribute[2],
                attribute[3],
                _generationType
            );
        }
    }

    /**
     * @dev check that _tokenId exist or not
     * @param _tokenId id of token to check existance
     * @return true if {_tokenId} exist
     */
    function exists(uint256 _tokenId) external view override returns (bool) {
        return _exists(_tokenId);
    }

    /**
     * @dev check attribute existance for a tokenId
     * @param _tokenId id of token
     * @return true if attributes exist for {_tokenId}
     */
    function attributeExists(uint256 _tokenId)
        external
        view
        override
        onlyTreejerContract
        returns (bool)
    {
        return attributes[_tokenId].generationType > 0;
    }

    /** @return return baseURI */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
