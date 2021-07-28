// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../access/IAccessRestriction.sol";

contract Tree is ERC721Upgradeable {
    bool public isTree;
    IAccessRestriction public accessRestriction;
    string private baseURI;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

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

    function setBaseURI(string calldata baseURI_) external onlyAdmin {
        baseURI = baseURI_;
    }

    function safeMint(address _to, uint256 _tokenId) external {
        require(
            accessRestriction.isTreeFactory(msg.sender),
            "Caller must be TreeFactory"
        );
        _safeMint(_to, _tokenId);
    }

    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
