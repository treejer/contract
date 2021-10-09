// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../tree/Attribute.sol";

contract TestAttribute is Attribute {
    function test(uint64 _rand) external {
        uniquenessFactorToGeneratedAttributesCount[_rand] = 1;
    }
}
