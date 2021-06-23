// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface ITreasuryManager {
    function assignModels(uint256 _index)
        external
        view
        returns (uint256 startingTreeId, uint256 distributionModelId);

    function totalFunds()
        external
        view
        returns (
            uint256 planterFund,
            uint256 gbFund,
            uint256 treeResearch,
            uint256 localDevelop,
            uint256 rescueFund,
            uint256 treejerDevelop,
            uint256 otherFund1,
            uint256 otherFund2
        );
}
