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

    function treeAttributes(uint256 tokenId)
        external
        view
        returns (
            uint8 attribute1,
            uint8 attribute2,
            uint8 attribute3,
            uint8 attribute4,
            uint8 attribute5,
            uint8 attribute6,
            uint8 attribute7,
            uint8 attribute8,
            uint8 generationType
        );

    function treeSymbols(uint256 tokenId)
        external
        view
        returns (
            uint8 treeShape,
            uint8 trunkColor,
            uint8 crownColor,
            uint8 effects,
            uint8 coefficient,
            uint8 exists,
            uint8 hasSymbol,
            uint8 generationType
        );

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

    function setTreeAttributes(
        uint256 _tokenId,
        uint256 _generatedCode,
        uint8 _generationType
    ) external;
}
