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

    /// @inheritdoc ITree
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

    /// @inheritdoc ITree
    function setBaseURI(string calldata baseURI_) external override onlyAdmin {
        baseURI = baseURI_;
    }

    /// @inheritdoc ITree
    function mint(address _to, uint256 _tokenId)
        external
        override
        onlyTreejerContract
    {
        _mint(_to, _tokenId);
    }

    /// @inheritdoc ITree
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
            for (uint256 i = 0; i < 4; i++) {
                attribute[i] = uint8(_uniquenessFactor & 255);

                _uniquenessFactor >>= 8;
            }

            symbols[_tokenId] = Symbol(
                attribute[0],
                attribute[1],
                attribute[2],
                attribute[3],
                _generationType
            );
        }
    }

    /// @inheritdoc ITree
    function exists(uint256 _tokenId) external view override returns (bool) {
        return _exists(_tokenId);
    }

    /// @inheritdoc ITree
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
