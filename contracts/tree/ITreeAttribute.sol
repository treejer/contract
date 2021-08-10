// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface ITreeAttribute {
    function setTreeFactoryAddress(address _address) external;

    function isTreeAttribute() external view returns (bool);

    function reservedAttributes(uint32) external view returns (uint8);

    function createTreeAttributes(uint256 treeId, uint256 paidAmount)
        external
        returns (bool);

    function setBuyerRank(
        address buyer,
        uint256 treejerSpent,
        uint256 walletSpent,
        uint64 treesOwned,
        uint64 walletSpentCount
    ) external;

    function setTreeAttributesByAdmin(uint256 treeId, uint32 generatedCode)
        external;

    function reserveTreeAttributes(uint32 generatedCode) external;

    function freeReserveTreeAttributes(uint32 generatedCode) external;

    function rankOf(address _buyer) external view returns (uint8);

    event BuyerRankSet(address buyer, uint8 rank);
    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);
}