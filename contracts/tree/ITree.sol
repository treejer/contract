// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface ITree is IERC721Upgradeable {
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

    function exists(uint256 tokenId) external view returns (bool);
}
