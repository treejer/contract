//SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

/** @title RegularSell interfce */
interface IRegularSell {
    /** @return last sold regular tree */
    function lastSoldRegularTree() external view returns (uint256);

    /** @return price of tree */
    function treePrice() external view returns (uint256);

    /**
     * @return true if RegularSell contract have been initialized
     */
    function isRegularSell() external view returns (bool);

    /** @return regular planter fund amount */
    function regularPlanterFund() external view returns (uint256);

    /** @return regular referral fund amount */
    function regularReferralFund() external view returns (uint256);

    //TODO:ADD_COMMENT
    function perRegularBuys() external view returns (uint256);

    //TODO:ADD_COMMENT
    function referrerGifts(address _refferer) external view returns (uint256);

    //TODO:ADD_COMMENT
    function referrerRegularCount(address _refferer)
        external
        view
        returns (uint256);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return DaiFunds contract address */
    function daiFunds() external view returns (address);

    /** @return FinancialModel contract address */
    function financialModel() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return WethFunds contract address */
    function wethFunds() external view returns (address);

    /** @dev admin set trusted forwarder address */
    function setTrustedForwarder(address _address) external;

    /**
     * @dev data manager can update lastSoldRegularTree
     * emit a {LastSoldRegularTreeUpdated} event
     */
    function setLastSoldRegularTree(uint256 _lastSoldRegularTree) external;

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

    /** @dev admin set financialModel contract address
     * @param _address financialModel contract address
     */
    function setFinancialModelAddress(address _address) external;

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
     * NOTE emit a {TreePriceUpdated} event
     */
    function setPrice(uint256 _price) external;

    //TODO: ADD_COMMENT
    function setGiftPerRegularBuys(uint256 _count) external;

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     * @param _referrer is address of refferer
     * NOTE emit a {RegularTreeRequsted} event
     * NOTE emit {RegularMint} event for {_count} time
     */
    function requestTrees(uint256 _count, address _referrer) external;

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     * @param _referrer is address of referrer
     * NOTE emit a {RegularTreeRequstedById} event
     */
    function requestByTreeId(uint256 _treeId, address _referrer) external;

    //TODO: ADD_COMMENT
    function setRegularPlanterFund(
        uint256 _regularPlanterFund,
        uint256 _regularReferralFund
    ) external;

    //TODO: ADD_COMMENT
    function updateReferrerGiftCount(address _referrer, uint256 _count)
        external;

    //TODO: ADD_COMMENT
    function claimGifts() external;

    /** @dev emited when price of tree change */
    event TreePriceUpdated(uint256 price);

    /** @dev emited when {count} trees requsted by {buyer} with amount of {amount} */
    event RegularTreeRequsted(
        address buyer,
        address referrer,
        uint256 count,
        uint256 amount
    );

    /** @dev emitted when each Regular Tree minted by {buyer} */
    event RegularMint(address buyer, uint256 treeId, uint256 treePrice);

    /** @dev emitted when tree with id {treeId} requsted by {buyer} with amount of {amount} */
    event RegularTreeRequstedById(
        address buyer,
        address referrer,
        uint256 treeId,
        uint256 amount
    );

    /** @dev emitted when lastSoldRegularTree updated to {lastSoldRegularTree}  */
    event LastSoldRegularTreeUpdated(uint256 lastSoldRegularTree);
    //TODO: ADD_COMMENT
    event GiftPerRegularBuyUpdated();
    //TODO: ADD_COMMENT
    event RegularPlanterFundSet(
        uint256 regularPlanterFund,
        uint256 regularReferralFund
    );
    //TODO: ADD_COMMENT
    event ReferrGiftClaimed(address referrer, uint256 count, uint256 amount);
}
