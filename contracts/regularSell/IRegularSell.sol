//SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

/** @title RegularSell interfce */
interface IRegularSell {
    /**
     * @return true if RegularSell contract have been initialized
     */
    function isRegularSell() external view returns (bool);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return DaiFunds contract address */
    function daiFunds() external view returns (address);

    /** @return FinancialModel contract address */
    function financialModel() external view returns (address);

    /** @return WethFunds contract address */
    function wethFunds() external view returns (address);

    /** @return DaiToken contract address */
    function daiToken() external view returns (address);

    /** @return last sold regular tree */
    function lastSoldRegularTree() external view returns (uint256);

    /** @return price of tree */
    function treePrice() external view returns (uint256);

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

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     * NOTE emit a {TreePriceUpdated} event
     */
    function setPrice(uint256 _price) external;

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     * NOTE emit a {RegularTreeRequsted} event
     * NOTE emit {RegularMint} event for {_count} time
     */
    function requestTrees(uint256 _count) external;

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     * NOTE emit a {RegularTreeRequstedById} event
     */
    function requestByTreeId(uint256 _treeId) external;

    function mintReferralTree(uint256 _count, address _referrer) external;

    function setRegularPlanterFund(
        uint256 _regularPlanterFund,
        uint256 _regularReferralFund
    ) external;

    function updateReferrerGiftCount(address _referrer, uint256 _count)
        external;

    function claimGifts() external;

    /** @dev emited when price of tree change */
    event TreePriceUpdated(uint256 price);

    /** @dev emited when {count} trees requsted by {buyer} with amount of {amount} */
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);

    /** @dev emitted when each Regular Tree minted by {buyer} */
    event RegularMint(address buyer, uint256 treeId);

    /** @dev emitted when tree with id {treeId} requsted by {buyer} with amount of {amount} */
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );

    /** @dev emitted when lastSoldRegularTree updated to {lastSoldRegularTree}  */
    event LastSoldRegularTreeUpdated(uint256 lastSoldRegularTree);
}
