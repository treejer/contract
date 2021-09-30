// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title PlanterFund interfce */
interface IPlanterFund {
    /**
     * @return true in case of PlanterFund contract have been initialized
     */
    function isPlanterFund() external view returns (bool);

    /** @return minimum amount to withdraw */
    function minWithdrawable() external view returns (uint256);

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
     * @dev return totalBalances struct data
     * @return planter total balance
     * @return ambassador total balance
     * @return localDevelopment total balance
     */
    function totalBalances()
        external
        view
        returns (
            uint256 planter,
            uint256 ambassador,
            uint256 localDevelopment
        );

    /**
     * @return treeToPlanterProjectedEarning of {_treeId}
     */
    function treeToPlanterProjectedEarning(uint256 _treeId)
        external
        view
        returns (uint256);

    /**
     * @return treeToAmbassadorProjectedEarning of {_treeId}
     */
    function treeToAmbassadorProjectedEarning(uint256 _treeId)
        external
        view
        returns (uint256);

    /**
     * @return treeToPlanterTotalClaimed of {_treeId}
     */
    function treeToPlanterTotalClaimed(uint256 _treeId)
        external
        view
        returns (uint256);

    /**
     * @return balance of {_planter}
     */
    function balances(address _planter) external view returns (uint256);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to Planter contract address */
    function setPlanterContractAddress(address _address) external;

    /** @dev set {_address} to DaiToken contract address */
    function setDaiTokenAddress(address _address) external;

    /** @dev admin can set the minimum amount to withdraw
     * @param _amount is min withdrawable amount
     */
    function updateWithdrawableAmount(uint256 _amount) external;

    /**
     * @dev set treeToPlanterProjectedEarning and treeToAmbassadorProjectedEarning
     * of a tree with id {_treeId} and add {_planterAmount} to plante part of
     * totalBalances and add {_ambassadorAmount} to _ambassador part of totalBalances
     * NOTE emit a {ProjectedEarningUpdated} event
     */
    function updateProjectedEarnings(
        uint256 _treeId,
        uint256 _planterAmount,
        uint256 _ambassadorAmount
    ) external;

    /**
     * @dev based on the {_treeStatus} planter charged in every tree update verifying
     * @param _treeId id of a tree to fund
     * @param _planter address of planter to fund
     * @param _treeStatus status of tree
     * NOTE emit a {PlanterTotalClaimedUpdated} event
     */
    function updatePlanterTotalClaimed(
        uint256 _treeId,
        address _planter,
        uint64 _treeStatus
    ) external;

    /**
     * @dev planter withdraw {_amount} from planter's balances in case of
     * valid {_amount} and daiToken transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     * NOTE emit a {BalanceWithdrew} event
     */
    function withdrawBalance(uint256 _amount) external;

    /**
     * @dev emitted when a {planter} funded {amount} for tree
     * with id {treeId} and with address of {ambassador}
     */
    event PlanterTotalClaimedUpdated(
        uint256 treeId,
        address planter,
        uint256 amount,
        address ambassador
    );

    /**
     * @dev emitted when a planter by address {account} withdraw {amount}
     * from balance
     */
    event BalanceWithdrew(uint256 amount, address account);

    /**
     * @dev emitted when ProjectedEarning set for tree with id {treeId} with 
     planter amount {planterAmount} and ambassador amount {ambassadorAmount}
     */
    event ProjectedEarningUpdated(
        uint256 treeId,
        uint256 planterAmount,
        uint256 ambassadorAmount
    );

    //TODO:ADD_COMMENT
    event MinWithdrawableAmountUpdated();
}
