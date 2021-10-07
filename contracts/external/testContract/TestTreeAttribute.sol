// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../tree/TreeAttribute.sol";

contract TestTreeAttribute is TreeAttribute {
    function test(uint64 _rand) external {
        generatedAttributes[_rand] = 1;
    }
}
