// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

// import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import "../access/IAccessRestriction.sol";

contract Tree is ERC721URIStorageUpgradeable {
    bool public isTree;
    IAccessRestriction public accessRestriction;
    string baseURI;

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

    function setBaseURI(string calldata baseURI_) external {
        accessRestriction.ifAdmin(msg.sender);

        baseURI = baseURI_;
    }

    function setTokenURI(uint256 _tokenId, string calldata _tokenURI) external {
        //TODO: isPlanterOrAmbassedor change to isPlanter and isTreeFactory deleted
        require(
            accessRestriction.isPlanter(msg.sender) ||
                ownerOf(_tokenId) == msg.sender ||
                accessRestriction.isTreeFactory(msg.sender),
            "Caller must be planter or ambassador or owner of tree OR TreeFactory or TreeFactory!"
        );

        _setTokenURI(_tokenId, _tokenURI);
    }

    // function getOwnerTokens(address _account)
    //     public
    //     view
    //     returns (uint256[] memory)
    // {
    //     uint256 tokenCount = balanceOf(_account);

    //     if (tokenCount == 0) {
    //         return new uint256[](0);
    //     }

    //     uint256[] memory result = new uint256[](tokenCount);

    //     for (uint256 index = 0; index < tokenCount; index++) {
    //         result[index] = tokenOfOwnerByIndex(_account, index);
    //     }

    //     return result;
    // }

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
