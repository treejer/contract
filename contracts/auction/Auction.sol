// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IAllocation.sol";
import "../treasury/IWethFund.sol";
import "../gsn/RelayRecipient.sol";
import "../regularSale/IRegularSale.sol";
import "./IAuction.sol";

/** @title Auction */

contract Auction is Initializable, RelayRecipient, IAuction {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct AuctionData {
        uint256 treeId;
        address bidder;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    CountersUpgradeable.Counter private _auctionId;

    /** NOTE {isAuction} set inside the initialize to {true} */

    bool public override isAuction;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFund public wethFund;
    IAllocation public allocation;
    IERC20Upgradeable public wethToken;
    IRegularSale public regularSale;

    /** NOTE mapping of auctionId to AuctionData struct */
    mapping(uint256 => AuctionData) public override auctions;

    /**NOTE mapping of bidder to mapping of auctionId to referral */
    mapping(address => mapping(uint256 => address)) public override referrals;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isAuction = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set TreeFactory contract address
     * @param _address set to the address of TreeFactory contract
     */
    function setTreeFactoryAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /**
     * @dev admin set Allocation contract address
     * @param _address set to the address of Allocation contract
     */

    function setAllocationAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /**
     * @dev admin set WethFund contract address
     * @param _address set to the address of WethFund contract
     */

    function setWethFundAddress(address _address) external override onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);
        require(candidateContract.isWethFund());
        wethFund = candidateContract;
    }

    /**
     * @dev admin set RegularSale contract address
     * @param _address set to the address of RegularSale contract
     */

    function setRegularSaleAddress(address _address)
        external
        override
        onlyAdmin
    {
        IRegularSale candidateContract = IRegularSale(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    /**
     * @dev admin set WethToken contract address
     * @param _address set to the address of WethToken contract
     */

    function setWethTokenAddress(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        wethToken = candidateContract;
    }

    /**
     * @dev admin put a tree with saleType of '0' in auction.
     * NOTE set saleType to '1' to that tree
     * NOTE its necessary that a allocation data has been assigned to {_treeId}
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
    ) external override ifNotPaused onlyDataManager {
        require(
            allocation.allocationExists(_treeId),
            "equivalant fund Model not exists"
        );

        uint32 saleType = treeFactory.manageSaleType(_treeId, 1);

        require(saleType == 0, "not available for auction");

        AuctionData storage auctionData = auctions[_auctionId.current()];

        auctionData.treeId = _treeId;
        auctionData.startDate = _startDate;
        auctionData.endDate = _endDate;
        auctionData.highestBid = _intialPrice;
        auctionData.bidInterval = _bidInterval;

        emit AuctionCreated(_auctionId.current());

        _auctionId.increment();
    }

    /**
     * @dev user bid for {_auctionId} in a time beetwen start time and end time
     * NOTE its require to send at least {higestBid + bidInterval } {_amount}.
     * NOTE if new bid done old bidder refund automatically.
     * NOTE if user bid 10 minutes left to auction end, auction's end time increase 10 minute
     * @param auctionId_ auctionId that user bid for it.
     */

    function bid(
        uint256 auctionId_,
        uint256 _amount,
        address _referrer
    ) external override ifNotPaused {
        AuctionData storage auctionData = auctions[auctionId_];

        require(
            block.timestamp <= auctionData.endDate,
            "auction already ended"
        );

        require(
            block.timestamp >= auctionData.startDate,
            "auction not started"
        );

        require(
            _amount >= auctionData.highestBid + auctionData.bidInterval,
            "invalid amount"
        );

        require(
            wethToken.balanceOf(_msgSender()) >= _amount,
            "insufficient balance"
        );

        bool success = wethToken.transferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        require(success, "unsuccessful transfer");

        if (
            _referrer != address(0) &&
            referrals[_msgSender()][auctionId_] == address(0)
        ) {
            referrals[_msgSender()][auctionId_] = _referrer;
        }

        address oldBidder = auctionData.bidder;
        uint256 oldBid = auctionData.highestBid;

        auctionData.highestBid = _amount;
        auctionData.bidder = _msgSender();

        emit HighestBidIncreased(
            auctionId_,
            auctionData.treeId,
            _msgSender(),
            _amount,
            _referrer
        );

        _increaseAuctionEndTime(auctionId_);

        if (oldBidder != address(0)) {
            bool successTransfer = wethToken.transfer(oldBidder, oldBid);

            require(successTransfer, "unsuccessful transfer");
        }
    }

    /** @dev end auction and mint tree to winner if auction has bidder
     * and tree funded based on allocation data for that tree
     * NOTE if winner has referrer, claimable trees of that referrer increase by 1
     * NOTE if auction does not have bidder, saleType of tree in auction reset
     * and admin can put that tree in another auction
     * @param auctionId_ id of auction to end.
     */
    function endAuction(uint256 auctionId_, uint256 _minDaiOut)
        external
        override
        ifNotPaused
    {
        AuctionData storage auctionData = auctions[auctionId_];

        require(auctionData.endDate > 0, "Auction is unavailable");

        require(
            block.timestamp >= auctionData.endDate,
            "Auction not yet ended"
        );

        if (auctionData.bidder != address(0)) {
            bool success = wethToken.transfer(
                address(wethFund),
                auctionData.highestBid
            );

            require(success, "unsuccessful transfer");

            _mintTree(auctionId_, _minDaiOut);

            treeFactory.mintAssignedTree(
                auctionData.treeId,
                auctionData.bidder
            );

            address referrerOfWinner = referrals[auctionData.bidder][
                auctionId_
            ];

            if (referrerOfWinner != address(0)) {
                regularSale.updateReferrerClaimableTreesWeth(
                    referrerOfWinner,
                    1
                );
            }

            emit AuctionSettled(
                auctionId_,
                auctionData.treeId,
                auctionData.bidder,
                auctionData.highestBid,
                referrerOfWinner
            );
        } else {
            treeFactory.resetSaleType(auctionData.treeId);
            emit AuctionEnded(auctionId_, auctionData.treeId);
        }

        delete auctions[auctionId_];
    }

    /** @dev if user bids less than 10 minutes left to the end of auction,
     * aution end time increase 10 minutes
     * @param auctionId_ id of auction to increase end time.
     */
    function _increaseAuctionEndTime(uint256 auctionId_) private {
        if (auctions[auctionId_].endDate - block.timestamp <= 600) {
            auctions[auctionId_].endDate += 600;
            emit AuctionEndTimeIncreased(
                auctionId_,
                auctions[auctionId_].endDate
            );
        }
    }

    function _mintTree(uint256 auctionId_, uint256 _minDaiOut) private {
        AuctionData storage auctionData = auctions[auctionId_];

        (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        ) = allocation.findAllocationData(auctionData.treeId);

        wethFund.fundTree(
            _minDaiOut,
            auctionData.treeId,
            auctionData.highestBid,
            planterShare,
            ambassadorShare,
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
        );
    }
}
