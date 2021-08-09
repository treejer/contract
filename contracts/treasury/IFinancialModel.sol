// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title IFinancialModel interfce */
interface IFinancialModel {
    function findTreeDistribution(uint256 _treeId)
        external
        returns (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        );
}
