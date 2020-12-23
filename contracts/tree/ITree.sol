// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface ITree is IERC721 {
    function isTree() external view returns (bool);

    //only TreeFactory
    function safeTransferExtra(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    //only TreeFactory
    function safeMint(address _to, uint256 _tokenId) external;

    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);

    function getOwnerTokens(address _account)
        external
        view
        returns (uint256[] memory);

    function setTokenURI(uint256 _tokenId, string memory _tokenURI) external;
}
