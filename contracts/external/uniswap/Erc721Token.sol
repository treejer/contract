// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract Erc721Token is ERC721 {
   

   constructor (string memory name_, string memory symbol_)ERC721(name_, symbol_) {}

    function safeMint(address _to, uint256 _tokenId)
        external
    {
        _safeMint(_to, _tokenId);
    }
}
