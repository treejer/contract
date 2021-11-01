// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

/** @title Attribute interfce */
interface IAttribute {
    /**
     * @dev emitted when unique attribute generated successfully
     * @param treeId id of tree to generate attribute for
     */
    event AttributeGenerated(uint256 treeId);

    /**
     * @dev emitted when attribute genertion failed
     * @param treeId id of tree that attribute generation failed
     */
    event AttributeGenerationFailed(uint256 treeId);

    /**
     * @dev emitted when a symbol reserved
     * @param uniquenessFactor unique symbol to reserve
     */
    event SymbolReserved(uint64 uniquenessFactor);

    /**
     * @dev emitted when reservation of a unique symbol released
     * @param uniquenessFactor unique symbol to release reservation
     */
    event ReservedSymbolReleased(uint64 uniquenessFactor);

    /** @dev set {_address} to TreeToken contract address */
    function setTreeTokenAddress(address _address) external;

    /**
     * @dev reserve a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     * NOTE emit a {SymbolReserved} event
     */
    function reserveSymbol(uint64 _uniquenessFactor) external;

    /**
     * @dev release reservation of a unique symbol by admin
     * @param _uniquenessFactor unique symbol to release reservation
     * NOTE emit a {ReservedSymbolReleased} event
     */
    function releaseReservedSymbolByAdmin(uint64 _uniquenessFactor) external;

    /**
     * @dev release reservation of a unique symbol
     * @param _uniquenessFactor unique symbol to release reservation
     * NOTE emit a {ReservedSymbolReleased} event
     */
    function releaseReservedSymbol(uint64 _uniquenessFactor) external;

    /**
     * @dev admin assigns symbol and attribute to the specified treeId
     * @param _treeId id of tree
     * @param _attributeUniquenessFactor unique attribute code to assign
     * @param _symbolUniquenessFactor unique symbol to assign
     * @param _generationType type of attribute assignement
     * NOTE emit a {AttributeGenerated} event
     */
    function setAttribute(
        uint256 _treeId,
        uint64 _attributeUniquenessFactor,
        uint64 _symbolUniquenessFactor,
        uint8 _generationType
    ) external;

    /**
     * @dev generate a random unique symbol using tree attributes 64 bit value
     * @param _treeId id of tree
     * @param _randomValue base random value
     * @param _funder address of funder
     * @param _funderRank rank of funder based on trees owned in treejer
     * @param _generationType type of attribute assignement
     * NOTE emit a {AttributeGenerated} or {AttributeGenerationFailed} event
     * @return if unique symbol generated successfully
     */
    function createSymbol(
        uint256 _treeId,
        bytes32 _randomValue,
        address _funder,
        uint8 _funderRank,
        uint8 _generationType
    ) external returns (bool);

    /**
     * @dev generate a random unique attribute using tree attributes 64 bit value
     * @param _treeId id of tree
     * NOTE emit a {AttributeGenerated} or {AttributeGenerationFailed} event
     * @return if unique attribute generated successfully
     */
    function createAttribute(uint256 _treeId) external returns (bool);

    /**
     * @dev check and generate random attributes for honorary trees
     * @param _treeId id of tree
     * @param _uniquenessFactor random to check existance
     * @return a unique random value
     */
    function manageAttributeUniquenessFactor(
        uint256 _treeId,
        uint64 _uniquenessFactor
    ) external returns (uint64);

    function initialize(address _accessRestrictionAddress) external;

    /** @return true in case of Attribute contract has been initialized */
    function isAttribute() external view returns (bool);

    /** @return total number of special tree created */
    function specialTreeCount() external view returns (uint8);

    /**
     * @dev return generation count
     * @param _attribute generated attributes
     * @return generation count
     */
    function uniquenessFactorToGeneratedAttributesCount(uint64 _attribute)
        external
        view
        returns (uint32);

    /**
     * @dev return SymbolStatus
     * @param _uniqueSymbol unique symbol
     * @return generatedCount
     * @return status
     */
    function uniquenessFactorToSymbolStatus(uint64 _uniqueSymbol)
        external
        view
        returns (uint128 generatedCount, uint128 status);

    /**
     * @dev the function tries to calculate the rank of funder based trees owned in Treejer
     * @param _funder address of funder
     */
    function getFunderRank(address _funder) external view returns (uint8);
}
