// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.6;

/** @title Auction interface */
interface IAuction {
    /**
     * @return true in case of Auction contract have been initialized
     */
    function isAuction() external view returns (bool);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @return TreeFactory contract address
     */
    function treeFactory() external view returns (address);

    /**
     * @return WethFund contract address
     */
    function wethFund() external view returns (address);

    /**
     * @return Allocation contract address
     */
    function allocation() external view returns (address);

    /**
     * @return WethToken contract address
     */
    function wethToken() external view returns (address);

    /**
     * @return RegularSale contract address
     */
    function regularSale() external view returns (address);

    /**
     *@dev return data of an auction with auction id
     *@return  treeId
     *@return bidder
     *@return startDate of auction
     *@return endDate of auction
     *@return highestBid
     *@return bidInterval
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

    /** @dev create an auction for {_treeId} with strating date of {_startDate} and ending date of
     * {_endDate} and initialPrice of {_initialPrice} and bidInterval of {_bidInterval}
     * NOTE its necessary that a fundDestributionModel has been assigned to {_treeId}
     * NOTE after create an auction for a tree provideStatus set to 1
     * NOTE for creating an auction for a tree the provideStatus of tree must be 0
     */
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external;

    /** @dev bid to auctions {_auctionId}  by user in a time beetwen start time and end time of auction
     * and return the old bidder's amount to account
     * NOTE its require that {_amount} be at least {higestBid + bidInterval }.
     * NOTE check if less than 10 minutes left to end of auction add 10 minutes to the end date of auction
     * NOTE when new bid done previous bidder refunded automatically
     * emit a {HighestBidIncreased} event
     */
    function bid(
        uint256 _auctionId,
        uint256 _amount,
        address _referrer
    ) external;

    /** @dev everyone can call this method after
     * auction end time and if auction have bidder , transfer owner of tree to bidder
     * and tree funded.
     * NOTE auction status set to end here
     * emit a {AuctionEnded} event
     */
    function endAuction(uint256 _auctionId) external;

    /**
     * @dev emitted when highestBid for auctions {auctionid} and tree {treeID} increase by {bidder}
     * with value of {amount} and {referrer} address
     */
    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount,
        address referrer
    );
    /**
     * @dev emitted when auctions {auctionId} for tree {treeId} finisehd.
     * {winner} is the final bidder of auction and {amount} is the auction's highestBid
     * and {referrer} is the address of refferer
     */

    event AuctionSettled(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount,
        address referrer
    );

    /**
     * @dev emitted when an auction created
     * {auctionId} is the number of auction
     */
    event AuctionCreated(uint256 auctionId);

    /**
     * @dev emitted when auctions {auctionId} for tree {treeId} finisehd.
     * and there is no bidder
     *
     */
    event AuctionEnded(uint256 auctionId, uint256 treeId);

    /**
     * @dev emmited when a bid take apart less than 10 minutes to end of auction
     * by {bidder}
     * {newAuctionEndTime} is old auction end time plus 10 minutes
     */
    event AuctionEndTimeIncreased(uint256 auctionId, uint256 newAuctionEndTime);
}
