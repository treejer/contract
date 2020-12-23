// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721.sol";

import "../access/IAccessRestriction.sol";

contract Tree is ERC721UpgradeSafe {

    bool public isTree;
    IAccessRestriction public accessRestriction;


    function initialize(
        address _accessRestrictionAddress,
        string calldata _baseURI
    ) public initializer {
        isTree = true;

        __ERC721_init("Tree", "TREE");
        _setBaseURI(_baseURI);

        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

    }

    function setBaseURI(string memory _baseURI) external {
        accessRestriction.ifAdmin(msg.sender);

        _setBaseURI(_baseURI);
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenURI) external {
        require(
            accessRestriction.isPlanterOrAmbassador(msg.sender) ||
                ownerOf(_tokenId) == msg.sender || 
                accessRestriction.isTreeFactory(msg.sender),
            "Caller must be planter or ambassador or owner of tree OR TreeFactory!"
        );

        _setTokenURI(_tokenId, _tokenURI);
    }

    function getOwnerTokens(address _account)
        public
        view
        returns (uint256[] memory)
    {
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

    function safeTransferExtra(address _from, address _to, uint256 _tokenId) external {

        accessRestriction.ifTreeFactory(msg.sender);
        _safeTransfer(_from, _to, _tokenId, "");
    }

    function safeMint(address _to, uint256 _tokenId) external {

        accessRestriction.ifTreeFactory(msg.sender);
        _safeMint(_to, _tokenId);
    }

}
