// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title WethFunds interfce */
interface IWethFunds {
    /**
     * @dev return if WethFunds contract initialize
     * @return true in case of WethFunds contract have been initialized
     */
    function isWethFunds() external view returns (bool);

    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external;
}
