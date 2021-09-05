// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

/** @title TreeAttribute interfce */
interface ITreeAttribute {
    /** @return true in case of TreeAttribute contract have been initialized */
    function isTreeAttribute() external view returns (bool);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

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

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /**
     * @dev reserve a unique symbol
     * @param generatedCode unique symbol to reserve
     */
    function reserveTreeAttributes(uint32 generatedCode) external;

    /**
     * @dev free reservation of a unique symbol
     * @param generatedCode unique symbol to reserve
     */
    function freeReserveTreeAttributes(uint32 generatedCode) external;

    /**
     * @dev admin assigns symbol to specified treeId
     * @param treeId id of tree
     * @param generatedCode unique symbol code to assign
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
    function createTreeAttributes(
        uint256 treeId,
        bytes32 randTree,
        address buyer
    ) external returns (bool);

    /**
     * @dev the function Tries to Calculate the rank of buyer based on transaction statistics of
     * his/her wallet
     * @param buyer address of buyer
     * @param treejerSpent weth amount spent in treejer
     * @param walletSpent weth amount spent from wallet
     * @param treesOwned number of trees owned
     * @param walletSpentCount number of spents transactions from wallet
     * NOTE emit a {BuyerRankSet} event
     */
    function setBuyerRank(
        address buyer,
        uint256 treejerSpent,
        uint256 walletSpent,
        uint64 treesOwned,
        uint64 walletSpentCount
    ) external;

    /** @dev emitted when {rank} set for {buyer} */
    event BuyerRankSet(address buyer, uint8 rank);
    /** @dev emitted when unique tree attribute generated successfully for {treeId} */
    event TreeAttributesGenerated(uint256 treeId);
    /** @dev emitted when unique tree attribute fail to generate for {treeId} */
    event TreeAttributesNotGenerated(uint256 treeId);
}
