// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

/** @title Auction interface */
interface IAuction {
    /**
     * @dev emitted when admin create an auction
     * @param auctionId  is id of auction
     */
    event AuctionCreated(uint256 auctionId);

    /**
     * @dev emitted when new bid done for auction
     * @param auctionId id of auction that bid done for
     * @param treeId id of tree in auction
     * @param bidder address of bidder
     * @param amount bid amount
     * @param referrer referrer address of bidder
     */
    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount,
        address referrer
    );

    /**
     * @dev emmited when user bids less than 10 minutes left to the end of auction
     * @param auctionId id of auction to increase end time
     * @param newAuctionEndTime new value of auction end time
     */
    event AuctionEndTimeIncreased(uint256 auctionId, uint256 newAuctionEndTime);

    /**
     * @dev emitted when auction ended and there is winner
     * @param auctionId id of auction that end
     * @param treeId id of tree in auction
     * @param winner address of winner
     * @param amount highest bid amount
     * @param referrer referrer address of winner
     */

    event AuctionSettled(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount,
        address referrer
    );

    /**
     * @dev emitted when auction end and there is no bidder.
     * @param auctionId id of auction that end
     * @param treeId id of tree in auction
     */
    event AuctionEnded(uint256 auctionId, uint256 treeId);

    /** @dev set {_address} to trustedForwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to TreeFactory contract address */
    function setTreeFactoryAddress(address _address) external;

    /** @dev set {_address} to Allocation contract address */
    function setAllocationAddress(address _address) external;

    /** @dev set {_address} to WethFund contract address */
    function setWethFundAddress(address _address) external;

    /** @dev set {_address} to RegularSale contract address */
    function setRegularSaleAddress(address _address) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _address) external;

    /**
     * @dev admin put a tree with saleType of '0' in auction.
     * NOTE set saleType to '1' to that tree
     * NOTE its necessary that a allocation data has been assigned to {_treeId}
     * NOTE emit an {AuctionCreated} event
     * @param _treeId treeId that auction create for
     * @param _startDate strat time of auction
     * @param _endDate end time of auction
     * @param _intialPrice initial price of auction
     * @param _bidInterval bid interval for auction.if it set to 10 for example and the last bid is 100.new bidder can bid at least for 110
     */
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external;

    /**
     * @dev user bid for {_auctionId} in a time beetwen start time and end time
     * NOTE its require to send at least {higestBid + bidInterval } {_amount}.
     * NOTE if new bid done old bidder refund automatically.
     * NOTE if user bid 10 minutes left to auction end, auction's end time increase 10 minute
     * NOTE emit a {HighestBidIncreased} event
     * NOTE emit an {AuctionEndTimeIncreased} if user bids less than 10 minutes left to auction end
     * @param _auctionId auctionId that user bid for it.
     */
    function bid(
        uint256 _auctionId,
        uint256 _amount,
        address _referrer
    ) external;

    /** @dev end auction and mint tree to winner if auction has bidder
     * and tree funded based on allocation data for that tree
     * NOTE if winner has referrer, claimable trees of that referrer increase by 1
     * NOTE if auction does not have bidder, saleType of tree in auction reset
     * and admin can put that tree in another auction
     * NOTE emit an {AuctionSettled} event if auction has bidder
     * NOTE emit an {AuctionEnded} event if auction does not have bidder
     * @param _auctionId id of auction to end.
     */
    function endAuction(uint256 _auctionId, uint256 _minDaiout) external;

    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true if Auction contract has been initialized
     */
    function isAuction() external view returns (bool);

    /**
     * @dev return data of an auction with {_auctionId}
     * @param _auctionId id of auction to get data
     * @return treeId
     * @return bidder
     * @return startDate of auction
     * @return endDate of auction
     * @return highestBid
     * @return bidInterval
     */
    function auctions(uint256 _auctionId)
        external
        view
        returns (
            uint256,
            address,
            uint64,
            uint64,
            uint256,
            uint256
        );

    /**
     * @dev return referrer address of {_bidder} in auction with id {_auctionId}
     * @param _bidder id of bidder
     * @param _auctionId id of auction
     * @return address of referrer
     */
    function referrals(address _bidder, uint256 _auctionId)
        external
        view
        returns (address);
}
