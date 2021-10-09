// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../access/IAccessRestriction.sol";

/** @title Tree Contract */
contract Tree is ERC721Upgradeable {
    /** NOTE {isTree} set inside the initialize to {true} */
    bool public isTree;

    IAccessRestriction public accessRestriction;
    string private baseURI;

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
        uint8 effect;
        uint8 coefficient;
        uint8 generationType;
    }

    mapping(uint256 => Attribute) public attributes;
    mapping(uint256 => Symbol) public symbols;

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
     * @dev initialize accessRestriction contract and set true for isTree
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param baseURI_ initial baseURI
     */
    function initialize(
        address _accessRestrictionAddress,
        string calldata baseURI_
    ) external initializer {
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
     * @dev admin set baseURI
     * @param baseURI_ baseURI value
     */
    function setBaseURI(string calldata baseURI_) external onlyAdmin {
        baseURI = baseURI_;
    }

    /**
     * @dev mint {_tokenId} to {_to}
     * NOTE must call by TreeFactory
     */
    function safeMint(address _to, uint256 _tokenId)
        external
        onlyTreejerContract
    {
        _safeMint(_to, _tokenId);
    }

    /**
     * @dev check that _tokenId exist or not
     * @param _tokenId id of token to check existance
     * @return true if {_tokenId} exist
     */
    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    /** @return return baseURI */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setAttributes(
        uint256 _tokenId,
        uint256 _uniquenessFactor,
        uint8 _generationType
    ) external onlyTreejerContract {
        uint8[] memory results = new uint8[](8);
        uint8 x;
        for (uint256 i = 0; i < 8; i++) {
            x = uint8(_uniquenessFactor & 255);
            results[i] = x;
            _uniquenessFactor = _uniquenessFactor / 256;
        }
        attributes[_tokenId] = Attribute(
            results[0],
            results[1],
            results[2],
            results[3],
            results[4],
            results[5],
            results[6],
            results[7],
            _generationType
        );
        if (_generationType > 15) {
            for (uint256 i = 0; i < 5; i++) {
                x = uint8(_uniquenessFactor & 255);
                results[i] = x;
                _uniquenessFactor = _uniquenessFactor / 256;
            }
            symbols[_tokenId] = Symbol(
                results[0],
                results[1],
                results[2],
                results[3],
                results[4],
                _generationType
            );
        }
    }

    function attributeExists(uint256 _tokenId)
        external
        view
        onlyTreejerContract
        returns (bool)
    {
        return attributes[_tokenId].generationType > 0;
    }
}
