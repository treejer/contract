// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

interface IIncrementalSale {
    /**
     * @return true if IncrementalSale contract have been initialized
     */
    function isIncrementalSale() external view returns (bool);

    //TODO: ADD_COMMENT
    function lastSold() external view returns (uint256);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeFactory contract address */
    function treeFactory() external view returns (address);

    /** @return WethFunds contract address */
    function wethFunds() external view returns (address);

    /** @return FinancialModel contract address */
    function financialModel() external view returns (address);

    /** @return TreeAttribute contract address */
    function treeAttribute() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFundContract() external view returns (address);

    /** @return RegularSell contract address */
    function regularSell() external view returns (address);

    /** @return WethToken contract address */
    function wethToken() external view returns (address);

    /**
     * @dev return incrementalSaleData struct data
     * @return startTreeId
     * @return endTreeId
     * @return initialPrice
     * @return increments
     * @return priceJump
     */
    function incrementalSaleData()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint64,
            uint64
        );

    //TODO: SHOULD_REMOVE
    /** @return lastBuy time of tree purchase for {_buyer} */
    function lastBuy(address _buyer) external view returns (uint256);

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev set {_address} to RegularSell contract address */
    function setRegularSellAddress(address _address) external;

    /** @dev set {_address} to TreeFactory  contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set {_address} to WethFunds contract address */
    function setWethFundsAddress(address _address) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _address) external;

    /** @dev set {_address} to FinancialModel contract address */
    function setFinancialModelAddress(address _address) external;

    /** @dev set {_address} to TreeAttributes contract address */
    function setTreeAttributesAddress(address _address) external;

    /**
     * @dev admin set a range from {startTreeId} to {startTreeId + treeCount}
     * for incremental selles for tree
     * @param _startTree starting treeId
     * @param _initialPrice initialPrice of trees
     * @param _treeCount number of tree in incremental sell
     * @param _steps step to increase tree price
     * @param _incrementRate increment price rate
     * emit an {IncrementalSaleUpdated} event
     */
    function createIncrementalSale(
        uint256 _startTree,
        uint256 _initialPrice,
        uint64 _treeCount,
        uint64 _steps,
        uint64 _incrementRate
    ) external;

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param treeCount number of trees added at the end of the incremental sell
     * tree range
     * emit an {IncrementalSaleUpdated} event
     */
    function updateEndTreeId(uint256 treeCount) external;

    //TODO:CHECK_COMMENT
    /**
     * tree price calculate based on treeId and msg.sender pay weth for it
     * and ownership of tree transfered to msg.sender
     * @param _count id of tree to buy
     * NOTE if buyer, buy another tree before 700 seconds from the
     * previous purchase, pays 90% of tree price and gets 10% discount
     * just for this tree. buying another tree give chance to buy
     * the next tree with 10% discount
     * NOTE emit an {TreeFunded} event
     */
    function fundTree(uint256 _count, address _referrer) external;

    //TODO:ADD_COMMENTS
    function revealAttributes(uint256 _startTree, uint256 _count) external;

    //TODO:ADD_COMMENT
    function removeIncrementalSale(uint256 _count) external;

    /** @dev admin can update incrementalSaleData
     * @param _initialPrice initialPrice of trees
     * @param _increaseStep step to increase tree price
     * @param _increaseRatio increment price rate
     * NOTE emit a {IncrementalSaleDataUpdated} event
     */
    function updateIncrementalSaleData(
        uint256 _initialPrice,
        uint64 _increaseStep,
        uint64 _increaseRatio
    ) external;

    /**
     * @dev emitted when {count} tree starting from id {strtTreeId} purchased by {funder}
     * with referral {referrer}
     * @param funder address of funder
     * @param referrer address of referrer
     * @param startTreeId starting tree id
     * @param count count of funded trees
     */

    event TreeFunded(
        address funder,
        address referrer,
        uint256 startTreeId,
        uint256 count
    );

    /**
     * @dev emitted when incremental tree sell added or updated
     */
    event IncrementalSaleUpdated();

    /** @dev emiited when incremental rates updated */
    event IncrementalSaleDataUpdated();
}
