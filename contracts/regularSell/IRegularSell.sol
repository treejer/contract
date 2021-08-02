//SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

/** @title RegularSell interfce */
interface IRegularSell {
    /** @dev return if RegularSell contract initialize
     * @return true if RegularSell contract have been initialized
     */
    function isRegularSell() external view returns (bool);

    /** @dev return last sold regular tree
     * @return last sold regular tree
     */
    function lastSoldRegularTree() external view returns (uint256);

    /** @dev return price of the tree
     * @return price of tree
     */
    function treePrice() external view returns (uint256);

    /** @dev set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set treasury contract address
     * @param _address treasury contract address
     */
    function setTreasuryAddress(address _address) external;

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     * NOTE emit a {TreePriceUpdated} event
     */
    function setPrice(uint256 _price) external;

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     * NOTE emit a {RegularTreeRequsted} event
    
     */
    function requestTrees(uint256 _count) external payable;

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     * NOTE emit a {RegularTreeRequstedById} event
     */
    function requestByTreeId(uint256 _treeId) external payable;

    /** @dev emited when price of tree change */
    event TreePriceUpdated(uint256 price);

    /** @dev emited when {count} trees requsted by {buyer} with amount of {amount} */
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);

    /** @dev emitted when tree with id {treeId} requsted by {buyer} with amount of {amount} */
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );
    /** @dev emitted when each Regular Tree minted by {buyer} */
    event RegularMint(address buyer, uint256 treeId);
}
