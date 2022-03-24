// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../publicForest/PublicForestFactory.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract TestPublicForestFactory is PublicForestFactory {
    function transferFromErc721(address _to,address _forest,address _nftContractAddress,uint256 _tokenId)
    external {
      IERC721(_nftContractAddress).safeTransferFrom(_forest,_to, _tokenId);   
    }

    function transferFromErc1155(address _to,address _forest,address _nftContractAddress,
    uint256 _tokenId,uint256 _amount)
    external {
      IERC1155(_nftContractAddress).safeTransferFrom(_forest,_to, _tokenId,_amount,"");   
    }

}
