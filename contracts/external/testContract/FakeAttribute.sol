// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

contract FakeAttribute {
    bool public isAttribute = true;

    function createAttribute(uint256 _tokenId, uint8 _generationType)
        external
        returns (bool)
    {
        return false;
    }

    function createSymbol(
        uint256 _treeId,
        bytes32 _randomValue,
        address _funder,
        uint8 _funderRank,
        uint8 _generationType
    ) external returns (bool) {
        return false;
    }

    function getFunderRank(address _funder) external returns (uint8) {
        return 0;
    }
}
