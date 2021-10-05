// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../tree/Tree.sol";

contract TestTree is Tree {
    function test(uint256 _treeId) external {
        treeAttributes[_treeId].generationType = 0;
    }
}
