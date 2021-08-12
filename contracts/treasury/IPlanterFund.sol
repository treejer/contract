// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title PlanterFund interfce */
interface IPlanterFund {
    /**
     * @dev return if PlanterFund contract initialize
     * @return true in case of PlanterFund contract have been initialized
     */
    function isPlanterFund() external view returns (bool);

    function accessRestriction() external view returns (address);

    function planterContract() external view returns (address);

    function daiToken() external view returns (address);

    /**
     * @dev return totalFunds struct data containing {plnaterFund} {referralFund}
     * {localDevelop}
     */
    function totalFunds()
        external
        view
        returns (
            uint256 planterFund,
            uint256 referralFund,
            uint256 localDevelop
        );

    function planterFunds(uint256 _treeId) external view returns (uint256);

    function referralFunds(uint256 _treeId) external view returns (uint256);

    function plantersPaid(uint256 _treeId) external view returns (uint256);

    function balances(address _planterAddress) external view returns (uint256);

    function setTrustedForwarder(address _address) external;

    function setPlanterContractAddress(address _address) external;

    function setDaiTokenAddress(address _address) external;

    function setPlanterFunds(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) external;

    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external;

    function withdrawPlanterBalance(uint256 _amount) external;

    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);
    event PlanterFundSet(
        uint256 treeId,
        uint256 planterAmount,
        uint256 referralAmount
    );
}
