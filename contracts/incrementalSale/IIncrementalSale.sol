// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

interface IIncrementalSale {
    /**
     * @dev emitted when trees funded
     * @param funder address of funder
     * @param recipient address of recipient
     * @param referrer address of referrer
     * @param startTreeId starting tree id
     * @param count count of funded trees
     */

    event TreeFunded(
        address funder,
        address recipient,
        address referrer,
        uint256 startTreeId,
        uint256 count
    );

    /**
     * @dev emitted when incremental sale created or removed or incremetal sale end tree id updated
     */
    event IncrementalSaleUpdated();

    /** @dev emitted when incremental sale data updated */
    event IncrementalSaleDataUpdated();

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev set {_address} to RegularSale contract address */
    function setRegularSaleAddress(address _address) external;

    /** @dev set {_address} to TreeFactory  contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set {_address} to WethFund contract address */
    function setWethFundAddress(address _address) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _address) external;

    /** @dev set {_address} to Allocation contract address */
    function setAllocationAddress(address _address) external;

    /** @dev set {_address} to Attributes contract address */
    function setAttributesAddress(address _address) external;

    /**
     * @dev admin set a tree range from {startTreeId} to {startTreeId + treeCount}
     * for incremental sales
     * NOTE emit an {IncrementalSaleUpdated} event
     * @param _startTreeId starting treeId
     * @param _initialPrice initialPrice of trees
     * @param _treeCount number of tree in incremental sell
     * @param _increments number of trees after which the price increases
     * @param _priceJump price jump
     */
    function createIncrementalSale(
        uint256 _startTreeId,
        uint256 _initialPrice,
        uint64 _treeCount,
        uint64 _increments,
        uint64 _priceJump
    ) external;

    /**
     * @dev remove some trees from incremental sale and reset saleType of that trees
     * NOTE {_count} trees removed from first of the incremetalSale tree range
     * NOTE emit an {IncrementalSaleUpdated} event
     * @param _count is number of trees to remove
     */
    function removeIncrementalSale(uint256 _count) external;

    /**
     * @dev admin update endTreeId of incrementalSale tree range
     * NOTE  emit an {IncrementalSaleUpdated} event
     * @param _treeCount number of trees added at the end of the incrementalSale
     * tree range
     */
    function updateEndTreeId(uint256 _treeCount) external;

    /**
     * @dev fund {_count} tree
     * NOTE if {_recipient} address exist tree minted to the {_recipient}
     * and mint to the function caller otherwise
     * NOTE function caller pay for the price of trees
     * NOTE total price calculated based on the incrementalSaleData
     * NOTE based on the allocation data for tree totalBalances and PlanterFund
     * contract balance updated
     * NOTE generate unique symbols for trees
     * NOTE emit an {TreeFunded} event
     * @param _count number of trees to fund
     * @param _referrer address of referrer
     * @param _recipient address of recipient
     */
    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient,
        uint256 minDaiOut
    ) external;

    /** @dev admin update incrementalSaleData
     * NOTE emit a {IncrementalSaleDataUpdated} event
     * @param _initialPrice initialPrice of trees
     * @param _increments number of trees after which the price increases
     * @param _priceJump price jump
     */
    function updateIncrementalSaleData(
        uint256 _initialPrice,
        uint64 _increments,
        uint64 _priceJump
    ) external;

    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true if IncrementalSale contract have been initialized
     */
    function isIncrementalSale() external view returns (bool);

    /**
     * @return last tree id sold in incremetal sale
     */
    function lastSold() external view returns (uint256);

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
}
