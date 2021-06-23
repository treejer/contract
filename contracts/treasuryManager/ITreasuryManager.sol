// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface ITreasuryManager {
    function assignModels(uint256 _index)
        external
        view
        returns (uint256 startingTreeId, uint256 distributionModelId);
}
