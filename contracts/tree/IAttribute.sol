// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

/** @title Attribute interfce */
interface IAttribute {
    /** @dev emitted when unique attribute generated successfully for {treeId} */
    event AttributeGenerated(uint256 treeId);
    /** @dev emitted when unique attribute fail to generate for {treeId} */
    event AttributeGenerationFailed(uint256 treeId);
    /** @dev emitted when a unique symbol reserved */
    event SymbolReserved(uint64 uniquenessFactor);
    /** @dev emitted when reservation of a unique symbol freed */
    event ReservedSymbolReleased(uint64 uniquenessFactor);

    function setTreeTokenAddress(address _address) external;

    /**
     * @dev reserve a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     * NOTE emit a {SymbolReserved} event
     */
    function reserveSymbol(uint64 _uniquenessFactor) external;

    /**
     * @dev free reservation of a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     * NOTE emit a {ReservedSymbolReleased} event
     */
    function releaseReservedSymbolByAdmin(uint64 _uniquenessFactor) external;

    function releaseReservedSymbol(uint64 _uniquenessFactor) external;

    /**
     * @dev admin assigns symbol to specified treeId
     * @param _treeId id of tree
     * @param _attributeUniquenessFactor unique symbol code to assign
     * NOTE emit a {AttributeGenerated} event
     */
    function setAttribute(
        uint256 _treeId,
        uint64 _attributeUniquenessFactor,
        uint64 _symbolUniquenessFactor,
        uint8 _generationType
    ) external;

    function createSymbol(
        uint256 treeId,
        bytes32 randTree,
        address buyer,
        uint8 funderRank,
        uint8 generationType
    ) external returns (bool);

    /**
     * @dev generate a 256 bits random number as a base for attributes and slice it
     * in 28 bits parts
     * @param _treeId id of tree
     * @return if unique attribute generated successfully
     * NOTE emit a {AttributeGenerated} or {AttributeGenerationFailed} event
     */
    function createAttribute(uint256 _treeId) external returns (bool);

    function manageAttributeUniquenessFactor(
        uint256 _treeId,
        uint64 _uniquenessFactor
    ) external returns (uint64);

    function initialize(address _accessRestrictionAddress) external;

    /** @return true in case of Attribute contract have been initialized */
    function isAttribute() external view returns (bool);

    function specialTreeCount() external view returns (uint8);

    function uniquenessFactorToGeneratedAttributesCount(uint64 _attribute)
        external
        view
        returns (uint32);

    function uniquenessFactorToSymbolStatus(uint64 _uniqueSymbol)
        external
        view
        returns (uint128 generatedCount, uint128 status);

    /**
     * @dev the function Tries to Calculate the rank of funder
     * @param _funder address of funder
     * NOTE emit a {getFunderRank} event
     */
    function getFunderRank(address _funder) external view returns (uint8);
}
