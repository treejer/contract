// SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

interface ITreeAttribute {
    function setTreeFactoryAddress(address _address) external;

    function isTreeAttribute() external view returns (bool);

    function createTreeAttributes(
        address buyer,
        uint256 treeId,
        uint256 paidAmount
    ) external returns (bool);

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

    event BuyerRankSet(address buyer, uint8 rank);
    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);
}
