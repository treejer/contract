// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title PlanterFund interfce */
interface IPlanterFund {
    /**
     * @return true in case of PlanterFund contract have been initialized
     */
    function isPlanterFund() external view returns (bool);

    /** @return minimum amount to withdraw */
    function withdrawThreshold() external view returns (uint256);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @return Planter contract address
     */
    function planterContract() external view returns (address);

    /**
     * @return DaiToken contract address
     */
    function daiToken() external view returns (address);

    /**
     * @dev return totalFunds struct data
     * @return planterFund share
     * @return referralFund share
     * @return localDevelop share
     */
    function totalFunds()
        external
        view
        returns (
            uint256 planterFund,
            uint256 referralFund,
            uint256 localDevelop
        );

    /**
     * @return planterFunds of {_treeId}
     */
    function planterFunds(uint256 _treeId) external view returns (uint256);

    /**
     * @return referralFunds of {_treeId}
     */
    function referralFunds(uint256 _treeId) external view returns (uint256);

    /**
     * @return plantersPaid of {_treeId}
     */
    function plantersPaid(uint256 _treeId) external view returns (uint256);

    /**
     * @return balance of {_planterAddress}
     */
    function balances(address _planterAddress) external view returns (uint256);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to Planter contract address */
    function setPlanterContractAddress(address _address) external;

    /** @dev set {_address} to DaiToken contract address */
    function setDaiTokenAddress(address _address) external;

    /** @dev admin can set the minimum amount to withdraw
     * @param _amount is withdraw treshold
     */
    function setWithdrawThreshold(uint256 _amount) external;

    /**
     * @dev set planterFunds and refferalFunds of a tree with id {_treeId}
     * and add {_planterFund} to planterFund part of totalFunds and add
     * {_referralFund} to referralFund part of totalFunds
     * NOTE emit a {PlanterFundSet} event
     */
    function setPlanterFunds(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) external;

    /**
     * @dev based on the {_treeStatus} planter charged in every tree update verifying
     * @param _treeId id of a tree to fund
     * @param _planterId  address of planter to fund
     * @param _treeStatus status of tree
     * NOTE emit a {PlanterFunded} event
     */
    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external;

    /**
     * @dev planter withdraw {_amount} from planter's balances in case of
     * valid {_amount} and daiToken transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     * NOTE emit a {PlanterBalanceWithdrawn} event
     */
    function withdrawPlanterBalance(uint256 _amount) external;

    /**
     * @dev emitted when a planter {planterId} funded {amount} for tree
     * with id {treeId}
     */
    event PlanterFunded(
        uint256 treeId,
        address planterId,
        uint256 amount,
        address referral
    );

    /**
     * @dev emitted when a planter by address {account} withdraw {amount}
     * from balance
     */
    event PlanterBalanceWithdrawn(uint256 amount, address account);

    /**
     * @dev emitted when planterFund set for tree with id {treeId} with 
     planter amount {planterAmount} and referral amount {referralAmount}
     */
    event PlanterFundSet(
        uint256 treeId,
        uint256 planterAmount,
        uint256 referralAmount
    );

    //TODO:ADD_COMMENT
    event WithdrawThresholdSet();
}
