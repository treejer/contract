// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

/** @title PlanterFund interfce */
interface IPlanterFund {
    /**
     * @dev return if PlanterFund contract initialize
     * @return true in case of PlanterFund contract have been initialized
     */
    function isPlanterFund() external view returns (bool);

    function setPlanterContractAddress(address _address) external;

    function setPlanterFunds(
        uint256 _treeId,
        uint256 _referralFund,
        uint256 _planterFund
    ) external;

    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external;

    function withdrawPlanterBalance(uint256 _amount) external;
}