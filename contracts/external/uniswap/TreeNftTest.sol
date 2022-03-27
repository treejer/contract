// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract TreeNftTest is ERC721 {
   
   bool public isTree = true;

   constructor ()ERC721("Treejer Trees", "TREE") {}

    function safeMint(address _to, uint256 _tokenId)
        external
    {
        _safeMint(_to, _tokenId);
    }
}
