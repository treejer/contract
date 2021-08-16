// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

interface IIncrementalSell {
    /**
     * @return true if isIncrementalSell contract have been initialized
     */
    function isIncrementalSell() external view returns (bool);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return WethFunds contract address */
    function wethFunds() external view returns (address);

    /** @return FinancialModel contract address */
    function financialModel() external view returns (address);

    /** @return WethToken contract address */
    function wethToken() external view returns (address);

    /**
     * @dev return incrementalPrice struct data
     * @return startTree
     * @return endTree
     * @return initialPrice
     * @return increaseStep
     * @return increaseRatio
     */
    function incrementalPrice()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint64,
            uint64
        );

    /** @return lastBuy time of tree purchase for {_buyer} */
    function lastBuy(address _buyer) external view returns (uint256);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set {_address} to WethFunds contract address */
    function setWethFundsAddress(address _address) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _address) external;

    /** @dev set {_address} to FinancialModel contract address */
    function setFinancialModelAddress(address _address) external;

    /**
     * @dev admin set a range from {startTree} to {startTree + treeCount}
     * for incremental selles for tree
     * @param startTree starting treeId
     * @param initialPrice initialPrice of trees
     * @param treeCount number of tree in incremental sell
     * @param steps step to increase tree price
     * @param incrementRate increment price rate
     * emit an {IncrementalSellUpdated} event
     */
    function addTreeSells(
        uint256 startTree,
        uint256 initialPrice,
        uint64 treeCount,
        uint64 steps,
        uint64 incrementRate
    ) external;

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param treeCount number of trees added at the end of the incremental sell
     * tree range
     * emit an {IncrementalSellUpdated} event
     */
    function updateIncrementalEnd(uint256 treeCount) external;

    /**
     * tree price calculate based on treeId and msg.sender pay weth for it
     * and ownership of tree transfered to msg.sender
     * @param treeId id of tree to buy
     * NOTE if buyer, buy another tree before 700 seconds from the
     * previous purchase, pays 90% of tree price and gets 10% discount
     * just for this tree. buying another tree give chance to buy
     * the next tree with 10% discount
     * NOTE emit an {IncrementalTreeSold} event
     */
    function buyTree(uint256 treeId) external;

    /**
     * @dev emitted when a tree with id {treeId} purchased by {buyer} with amount {amount}
     * @param treeId purchased tree id
     * @param buyer buyer of tree
     * @param amount amount of purchase
     */
    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
    /**
     * @dev emitted when incremental tree sell added or updated
     */
    event IncrementalSellUpdated();
}
