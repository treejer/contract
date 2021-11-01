// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
/** @title Tree interface */
interface ITree is IERC721Upgradeable {
    function initialize(
        address _accessRestrictionAddress,
        string calldata baseURI_
    ) external;

    /** @dev admin set {baseURI_} to baseURI */
    function setBaseURI(string calldata baseURI_) external;

    /**
     * @dev mint {_tokenId} to {_to}
     */
    function safeMint(address _to, uint256 _tokenId) external;

    /**
     * @dev set attribute and symbol for a tokenId based on {_uniquenessFactor}
     * NOTE symbol set when {_generationType} is more than 15 (for HonoraryTree and IncremetalSale)
     * @param _tokenId id of token
     * @param _uniquenessFactor uniqueness factor
     * @param _generationType type of generation
     */
    function setAttributes(
        uint256 _tokenId,
        uint256 _uniquenessFactor,
        uint8 _generationType
    ) external;

    /**
     * @dev check attribute existance for a tokenId
     * @param _tokenId id of token
     * @return true if attributes exist for {_tokenId}
     */
    function attributeExists(uint256 _tokenId) external returns (bool);

    /**
     * @return true in case of Tree contract have been initialized
     */
    function isTree() external view returns (bool);

    function baseURI() external view returns (string memory);

    /**
     * @dev return attribute data
     * @param _tokenId id of token to get data
     * @return attribute1
     * @return attribute2
     * @return attribute3
     * @return attribute4
     * @return attribute5
     * @return attribute6
     * @return attribute7
     * @return attribute8
     * @return generationType
     */
    function attributes(uint256 _tokenId)
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

    /**
     * @dev return symbol data
     * @param _tokenId id of token to get data
     * @return shape
     * @return trunkColor
     * @return crownColor
     * @return effect
     * @return coefficient
     * @return generationType
     */
    function symbols(uint256 _tokenId)
        external
        view
        returns (
            uint8 shape,
            uint8 trunkColor,
            uint8 crownColor,
            uint8 effect,
            uint8 coefficient,
            uint8 generationType
        );

    /**
     * @dev check that _tokenId exist or not
     * @param _tokenId id of token to check existance
     * @return true if {_tokenId} exist
     */
    function exists(uint256 _tokenId) external view returns (bool);
}
