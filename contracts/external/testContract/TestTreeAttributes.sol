// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
import "./../../tree/TreeAttribute.sol";

contract TestTreeAttributes is TreeAttribute {
    function test(uint256 treeId) external {
        treeAttributes[treeId].exists = 0;
    }
}
