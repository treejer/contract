// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

library Bits {
    function and(uint256 a, uint256 b) internal pure returns (uint256) {
        return a & b;
    }

    function or(uint256 a, uint256 b) internal pure returns (uint256) {
        return a | b;
    }

    function xor(uint256 a, uint256 b) internal pure returns (uint256) {
        return a ^ b;
    }

    function negate(uint256 a) internal pure returns (uint256) {
        return a ^ allOnes();
    }

    function shiftLeft(uint256 a, uint8 n) internal pure returns (uint256) {
        uint256 shifted = uint8(a) * 2**n;
        return uint256(shifted);
    }

    function shiftRight(uint256 a, uint8 n) internal pure returns (uint256) {
        uint256 shifted = uint8(a) / 2**n;
        return uint256(shifted);
    }

    function getFirstN(uint256 a, uint8 n) internal pure returns (uint256) {
        uint256 nOnes = uint256(2**n - 1);
        uint256 mask = shiftLeft(nOnes, 8 - n); // Total 8 bits
        return a & mask;
    }

    function getLastN(uint256 a, uint8 n) internal pure returns (uint256) {
        uint8 lastN = uint8(a) % 2**n;
        return uint256(lastN);
    }

    // Sets all bits to 1
    function allOnes() internal pure returns (uint256) {
        return uint256(-1); // 0 - 1, since data type is unsigned, this results in all 1s.
    }

    // Get bit value at position
    function getBit(uint256 a, uint8 n) internal pure returns (bool) {
        return a & shiftLeft(0x01, n) != 0;
    }

    // Set bit value at position
    function setBit(uint256 a, uint8 n) internal pure returns (uint256) {
        return a | shiftLeft(0x01, n);
    }

    // Set the bit into state "false"
    function clearBit(uint256 a, uint8 n) internal pure returns (uint256) {
        uint256 mask = negate(shiftLeft(0x01, n));
        return a & mask;
    }
}
