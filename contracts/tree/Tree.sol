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

    /** NOTE modifier for check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
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
    ) public initializer {
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
    function safeMint(address _to, uint256 _tokenId) external {
        require(
            accessRestriction.isTreeFactory(msg.sender),
            "Caller must be TreeFactory"
        );
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
}
