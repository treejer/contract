// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IAllocation.sol";
import "../treasury/IWethFund.sol";
import "../regularSale/IRegularSale.sol";
import "./IAuction.sol";

/** @title Auction */

contract Auction is Initializable, IAuction {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct AuctionData {
        uint256 treeId;
        address bidder;
        uint64 startDate;
        uint64 endDate;
        uint64 bidInterval;
        uint256 highestBid;
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
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc IAuction
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

    /// @inheritdoc IAuction
    function setTreeFactoryAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /// @inheritdoc IAuction
    function setAllocationAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /// @inheritdoc IAuction
    function setWethFundAddress(address _address) external override onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);
        require(candidateContract.isWethFund());
        wethFund = candidateContract;
    }

    /// @inheritdoc IAuction
    function setRegularSaleAddress(address _address)
        external
        override
        onlyAdmin
    {
        IRegularSale candidateContract = IRegularSale(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    /// @inheritdoc IAuction
    function setWethTokenAddress(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        wethToken = candidateContract;
    }

    /// @inheritdoc IAuction
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint64 _bidInterval
    ) external override ifNotPaused onlyDataManager {
        require(allocation.allocationExists(_treeId), "Allocation not exists");

        require(
            0 < _bidInterval && _bidInterval < 10001,
            "Invalid bidInterval"
        );

        uint32 saleType = treeFactory.manageSaleType(_treeId, 1);

        require(saleType == 0, "Not available");

        AuctionData storage auctionData = auctions[_auctionId.current()];

        auctionData.treeId = _treeId;
        auctionData.startDate = _startDate;
        auctionData.endDate = _endDate;
        auctionData.highestBid = _intialPrice;
        auctionData.bidInterval = _bidInterval;

        emit AuctionCreated(_auctionId.current());

        _auctionId.increment();
    }

    /// @inheritdoc IAuction
    function bid(
        uint256 auctionId_,
        uint256 _amount,
        address _referrer
    ) external override ifNotPaused {
        require(msg.sender != _referrer, "Invalid referrer");

        AuctionData storage auctionData = auctions[auctionId_];

        require(block.timestamp <= auctionData.endDate, "Auction ended");

        require(
            block.timestamp >= auctionData.startDate,
            "Auction not started"
        );

        uint256 priceJump = (auctionData.bidInterval * auctionData.highestBid) /
            10000;

        require(
            _amount >=
                auctionData.highestBid +
                    (priceJump > 0.1 ether ? priceJump : 0.1 ether),
            "Invalid amount"
        );

        require(
            wethToken.balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );

        bool success = wethToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        require(success, "Unsuccessful transfer");

        if (
            _referrer != address(0) &&
            referrals[msg.sender][auctionId_] == address(0)
        ) {
            referrals[msg.sender][auctionId_] = _referrer;
        }

        address oldBidder = auctionData.bidder;
        uint256 oldBid = auctionData.highestBid;

        auctionData.highestBid = _amount;
        auctionData.bidder = msg.sender;

        emit HighestBidIncreased(
            auctionId_,
            auctionData.treeId,
            msg.sender,
            _amount,
            _referrer
        );

        _increaseAuctionEndTime(auctionId_);

        if (oldBidder != address(0)) {
            bool successTransfer = wethToken.transfer(oldBidder, oldBid);

            require(successTransfer, "Unsuccessful transfer");
        }
    }

    /// @inheritdoc IAuction
    function endAuction(uint256 auctionId_, uint256 _minDaiOut)
        external
        override
        ifNotPaused
    {
        AuctionData storage auctionData = auctions[auctionId_];

        require(auctionData.endDate > 0, "Auction unavailable");

        require(block.timestamp >= auctionData.endDate, "Auction not ended");

        if (auctionData.bidder != address(0)) {
            bool success = wethToken.transfer(
                address(wethFund),
                auctionData.highestBid
            );

            require(success, "Unsuccessful transfer");

            _mintTree(auctionId_, _minDaiOut);

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
            auctionData.treeId,
            auctionData.highestBid,
            _minDaiOut,
            planterShare,
            ambassadorShare,
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
        );

        treeFactory.mintAssignedTree(auctionData.treeId, auctionData.bidder);
    }
}
