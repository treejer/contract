// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
/** @title Tree interface */
interface ITree is IERC721Upgradeable {
    /**
     * @return true in case of Tree contract have been initialized
     */
    function isTree() external view returns (bool);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /** @dev amin set {baseURI_} to baseURI */
    function setBaseURI(string calldata baseURI_) external;

    /**
     * @dev mint {_tokenId} to {_to}
     * NOTE must call by TreeFactory
     */
    function safeMint(address _to, uint256 _tokenId) external;

    /**
     * @dev check existance of {_tokenId}
     * @param _tokenId id of token to check existance
     * @return true if {_tokenId} exist
     */
    function exists(uint256 _tokenId) external view returns (bool);
}
