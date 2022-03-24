// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract Erc1155Token is ERC1155 {
   

   constructor ()ERC1155("") {}

    function safeMint(address _to, uint256 _tokenId,uint256 _amount)
        external
    {
        _mint(_to, _tokenId,_amount,"");
    }
}
