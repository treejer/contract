// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;

/** @title RegularSell interfce */
interface IRegularSell {
    /** @return last sold regular tree */
    function lastFundedTreeId() external view returns (uint256);

    /** @return price of tree */
    function price() external view returns (uint256);

    /**
     * @return true if RegularSell contract have been initialized
     */
    function isRegularSell() external view returns (bool);

    /** @return regular planter fund amount */
    function referralTreePaymentToPlanter() external view returns (uint256);

    /** @return regular referral fund amount */
    function referralTreePaymentToAmbassador() external view returns (uint256);

    //TODO:ADD_COMMENT
    function ReferralTriggerCount() external view returns (uint256);

    //TODO:ADD_COMMENT
    function referrerClaimableTreesWeth(address _refferer)
        external
        view
        returns (uint256);

    //TODO:ADD_COMMENT
    function referrerClaimableTreesDai(address _refferer)
        external
        view
        returns (uint256);

    //TODO:ADD_COMMENT
    function referrerCount(address _refferer) external view returns (uint256);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return DaiFunds contract address */
    function daiFunds() external view returns (address);

    /** @return Allocation contract address */
    function allocation() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return WethFunds contract address */
    function wethFunds() external view returns (address);

    /** @dev admin set trusted forwarder address */
    function setTrustedForwarder(address _address) external;

    /**
     * @dev data manager can update lastFundedTreeId
     * emit a {LastFundedTreeIdUpdated} event
     */
    function updateLastFundedTreeId(uint256 _lastFundedTreeId) external;

    /** @dev admin set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external;

    /** @dev admin set daiFunds contract address
     * @param _address daiFunds contract address
     */

    function setDaiFundsAddress(address _address) external;

    /** @dev admin set daiToken address
     * @param _address  daiToken  address
     */
    function setDaiTokenAddress(address _address) external;

    /** @dev admin set Allocation contract address
     * @param _address Allocation contract address
     */
    function setAllocationAddress(address _address) external;

    /** @dev admin set planterFund contract address
     * @param _address planterFund contract address
     */
    function setPlanterFundAddress(address _address) external;

    /** @dev admin set wethFunds contract address
     * @param _address wethFunds contract address
     */
    function setWethFundsAddress(address _address) external;

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     * NOTE emit a {PriceUpdated} event
     */
    function updatePrice(uint256 _price) external;

    //TODO: ADD_COMMENT
    function updateReferralTriggerCount(uint256 _count) external;

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * price }
     * @param _count is the number of trees requested by user
     * @param _referrer is address of refferer
     * NOTE emit a {TreeFunded} event
     * NOTE emit {RegularMint} event for {_count} time
     */
    function fundTree(uint256 _count, address _referrer) external;

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {price} and the {_treeId} must be more than {lastFundedTreeId} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     * @param _referrer is address of referrer
     * NOTE emit a {TreeFundedById} event
     */
    function fundTreeById(uint256 _treeId, address _referrer) external;

    //TODO: ADD_COMMENT
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external;

    //TODO: ADD_COMMENT
    function updateReferrerClaimableTreesWeth(address _referrer, uint256 _count)
        external;

    //TODO: ADD_COMMENT
    function claimReferralReward() external;

    /** @dev emited when price of tree change */
    event PriceUpdated(uint256 price);

    /** @dev emited when {count} trees requsted by {buyer} with amount of {amount} */
    event TreeFunded(
        address buyer,
        address referrer,
        uint256 count,
        uint256 amount
    );

    /** @dev emitted when each Regular Tree minted by {buyer} */
    event RegularMint(address buyer, uint256 treeId, uint256 price);

    /** @dev emitted when tree with id {treeId} requsted by {buyer} with amount of {amount} */
    event TreeFundedById(
        address buyer,
        address referrer,
        uint256 treeId,
        uint256 amount
    );

    /** @dev emitted when lastFundedTreeId updated to {lastFundedTreeId}  */
    event LastFundedTreeIdUpdated(uint256 lastFundedTreeId);
    //TODO: ADD_COMMENT
    event ReferralTriggerCountUpdated();
    //TODO: ADD_COMMENT
    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );
    //TODO: ADD_COMMENT
    event ReferralRewardClaimed(
        address referrer,
        uint256 count,
        uint256 amount
    );
}
