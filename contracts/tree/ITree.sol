// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface ITree is IERC721Upgradeable {
    function isTree() external view returns (bool);

    function accessRestriction() external view returns (address);

    function setBaseURI(string calldata baseURI_) external;

    function safeMint(address _to, uint256 _tokenId) external;

    function exists(uint256 _tokenId) external view returns (bool);
}
