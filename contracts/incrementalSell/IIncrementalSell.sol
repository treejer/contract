// SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

interface IIncrementalSell {
    function isIncrementalSell() external view returns (bool);

    function incrementalPrice()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint64,
            uint64
        );

    function lastBuy(address _buyer) external view returns (uint256);

    function setTreasuryAddress(address payable _treasuryAddress) external;

    function setGenesisTreeAddress(address _address) external;

    function setTreeAttributeAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function buyTree(uint256 treeId) external payable;

    function addTreeSells(
        uint256 startTree,
        uint256 initialPrice,
        uint64 treeCount,
        uint64 steps,
        uint64 incrementRate
    ) external;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
}
