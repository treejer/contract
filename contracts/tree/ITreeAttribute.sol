// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface ITreeAttribute {
    function isTreeAttribute() external view returns (bool);

    function accessRestriction() external view returns (address);

    function treeFactory() external view returns (address);

    function rankOf(address _buyer) external view returns (uint8);

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

    function generatedAttributes(uint32 attributeId)
        external
        view
        returns (uint32);

    function reservedAttributes(uint32 attributeId)
        external
        view
        returns (uint8);

    function setTreeFactoryAddress(address _address) external;

    function reserveTreeAttributes(uint32 generatedCode) external;

    function freeReserveTreeAttributes(uint32 generatedCode) external;

    function setTreeAttributesByAdmin(uint256 treeId, uint32 generatedCode)
        external;

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

    event BuyerRankSet(address buyer, uint8 rank);
    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);
}
