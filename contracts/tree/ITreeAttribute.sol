// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

/** @title TreeAttribute interfce */
interface ITreeAttribute {
    /** @return true in case of TreeAttribute contract have been initialized */
    function isTreeAttribute() external view returns (bool);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return rank of buyer address */
    function rankOf(address _buyer) external view returns (uint8);

    /** return Attributes data of {_treeId}
     * @return treeType
     * @return groundType
     * @return trunkColor
     * @return crownColor
     * @return groundColor
     * @return specialEffects
     * @return universalCode
     * @return exists
     */
    function treeAttributes(uint256 _treeId)
        external
        view
        returns (
            uint32,
            uint32,
            uint32,
            uint32,
            uint32,
            uint32,
            uint32,
            uint32
        );

    /** @return number of generations of a unique symbol */
    function generatedAttributes(uint32 attributeId)
        external
        view
        returns (uint32);

    /** @return reserved status of a unique symbol */
    function reservedAttributes(uint32 attributeId)
        external
        view
        returns (uint8);

    /**
     * @dev reserve a unique symbol
     * @param _generatedSymbol unique symbol to reserve
     * NOTE emit a {SymbolReserved} event
     */
    function reserveSymbol(uint64 _generatedSymbol) external;

    /**
     * @dev free reservation of a unique symbol
     * @param _generatedSymbol unique symbol to reserve
     * NOTE emit a {ReservedSymbolFreed} event
     */
    function freeReserveSymbol(uint64 _generatedSymbol) external;

    /**
     * @dev admin assigns symbol to specified treeId
     * @param treeId id of tree
     * @param generatedCode unique symbol code to assign
     * NOTE emit a {SymbolSetByAdmin} event
     */
    function setTreeAttributesByAdmin(uint256 treeId, uint32 generatedCode)
        external;

    /**
     * @dev generate a 256 bits random number as a base for tree attributes and slice it
     * in 28 bits parts
     * @param treeId id of tree
     * @return if unique tree attribute generated successfully
     * NOTE emit a {TreeAttributesGenerated} or {TreeAttributesNotGenerated} event
     */
    function createTreeAttributes(uint256 treeId) external returns (bool);

    function createTreeSymbol(
        uint256 treeId,
        bytes32 randTree,
        address buyer,
        uint8 funderRank,
        uint8 generationType
    ) external returns (bool);

    /**
     * @dev the function Tries to Calculate the rank of funder
     * @param _funder address of funder
     * NOTE emit a {getFunderRank} event
     */
    function getFunderRank(address _funder) external view returns (uint8);

    function calcRandSymbol(
        address buyer,
        uint256 treeId,
        uint64 rand,
        uint8 generationType
    ) external returns (bool);

    /** @dev emitted when unique tree attribute generated successfully for {treeId} */
    event TreeAttributesGenerated(uint256 treeId);
    /** @dev emitted when unique tree attribute fail to generate for {treeId} */
    event TreeAttributesNotGenerated(uint256 treeId);
    /** @dev emitted when a unique symbol reserved */
    event SymbolReserved(uint32 generatedCode);
    /** @dev emitted when reservation of a unique symbol freed */
    event ReservedSymbolFreed(uint32 generatedCode);
    /** @dev emitted when admin assings a symbol to {treeId} */
    event SymbolSetByAdmin(uint256 treeId);
}
