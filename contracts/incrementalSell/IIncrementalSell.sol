// SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

interface IIncrementalSell {
    function setTreasuryAddress(address payable _treasuryAddress) external;

    function setGenesisTreeAddress(address _address) external;

    function setTreeAttributeAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function buyTree(uint256 treeId) external payable;

    function addTreeSells(uint256 startTree,uint256 initialPrice,uint64 treeCount,uint64 steps,uint64 incrementRate)
        external;
}