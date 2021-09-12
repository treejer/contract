// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IFinancialModel.sol";
import "../treasury/IWethFunds.sol";
import "../gsn/RelayRecipient.sol";
import "../regularSell/IRegularSell.sol";

/** @title Tree Auction */

contract TreeAuction is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private auctionId;

    /** NOTE {isTreeAuction} set inside the initialize to {true} */

    bool public isTreeAuction;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFunds public wethFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public wethToken;
    IRegularSell public regularSell;

    struct Auction {
        uint256 treeId;
        address bidder;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    /** NOTE mapping of auctionId to Auction struct */
    mapping(uint256 => Auction) public auctions;

    /**NOTE mapping of bidder to mapping of auctionId to referral */
    mapping(address => mapping(uint256 => address)) public referrals;

    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount,
        address referrer
    );
    event AuctionSettled(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount,
        address referrer
    );
    event AuctionCreated(uint256 auctionId);
    event AuctionEnded(uint256 auctionId, uint256 treeId);
    event AuctionEndTimeIncreased(uint256 auctionId, uint256 newAuctionEndTime);

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

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isTreeAuction = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /**
     * @dev admin set FinancialModel
     * @param _address set to the address of financialModel
     */

    function setFinancialModelAddress(address _address) external onlyAdmin {
        IFinancialModel candidateContract = IFinancialModel(_address);
        require(candidateContract.isFinancialModel());
        financialModel = candidateContract;
    }

    /**
     * @dev admin set WethFunds
     * @param _address set to the address of wethFunds
     */

    function setWethFundsAddress(address _address) external onlyAdmin {
        IWethFunds candidateContract = IWethFunds(_address);
        require(candidateContract.isWethFunds());
        wethFunds = candidateContract;
    }

    /**
     * @dev admin set RegularSell
     * @param _address set to the address of regularSell
     */

    function setRegularSellAddress(address _address) external onlyAdmin {
        IRegularSell candidateContract = IRegularSell(_address);
        require(candidateContract.isRegularSell());
        regularSell = candidateContract;
    }

    /**
     * @dev admin set WethToken
     * @param _address set to the address of wethToken
     */

    function setWethTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        wethToken = candidateContract;
    }

    /**
     * @dev admin create auction to a tree with provideStatus of '0' and push that auction
     * to {auctions[auctionId]} and increament auctionId by 1.
     * NOTE its necessary that a fundDestributionModel has been assigned to {_treeId}
     * @param _treeId treeId that auction create for
     * @param _startDate strat time of auction
     * @param _endDate end time of auction
     * @param _intialPrice initial price of auction
     * @param _bidInterval bid interval for auction . if it set to 10 for example and the last bid is 100.new bidder can bid for 110
     */
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external ifNotPaused onlyDataManager {
        require(
            financialModel.distributionModelExistance(_treeId),
            "equivalant fund Model not exists"
        );

        uint32 provideStatus = treeFactory.availability(_treeId, 1);

        require(provideStatus == 0, "not available for auction");

        Auction storage auction = auctions[auctionId.current()];

        auction.treeId = _treeId;
        auction.startDate = _startDate;
        auction.endDate = _endDate;
        auction.highestBid = _intialPrice;
        auction.bidInterval = _bidInterval;

        emit AuctionCreated(auctionId.current());

        auctionId.increment();
    }

    /**
     * @dev bid to {auctions[_auctionId]} by user in a time beetwen start time and end time
     * its require to send at least {higestBid + bidInterval } {_amount}.
     * if new bid done old bidder refund automatically.
     * @param _auctionId auctionId that user bid for it.
     */

    function bid(
        uint256 _auctionId,
        uint256 _amount,
        address _referrer
    ) external ifNotPaused {
        Auction storage _storageAuction = auctions[_auctionId];

        require(
            block.timestamp <= _storageAuction.endDate,
            "auction already ended"
        );

        require(
            block.timestamp >= _storageAuction.startDate,
            "auction not started"
        );

        require(
            _amount >= _storageAuction.highestBid + _storageAuction.bidInterval,
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
            referrals[_msgSender()][_auctionId] == address(0)
        ) {
            referrals[_msgSender()][_auctionId] = _referrer;
        }

        address oldBidder = _storageAuction.bidder;
        uint256 oldBid = _storageAuction.highestBid;

        _storageAuction.highestBid = _amount;
        _storageAuction.bidder = _msgSender();

        emit HighestBidIncreased(
            _auctionId,
            _storageAuction.treeId,
            _msgSender(),
            _amount,
            _referrer
        );

        _increaseAuctionEndTime(_auctionId);

        if (oldBidder != address(0)) {
            bool successTransfer = wethToken.transfer(oldBidder, oldBid);

            require(successTransfer, "unsuccessful transfer");
        }
    }

    /** @dev everyone can call this method  including the winner of auction after
     * auction end time and if auction have bidder transfer owner of tree to bidder
     * and tree funded.
     * @param _auctionId id of auction that want to finish.
     */
    function endAuction(uint256 _auctionId) external ifNotPaused {
        Auction storage auction = auctions[_auctionId];

        require(auction.endDate > 0, "Auction is unavailable");

        require(block.timestamp >= auction.endDate, "Auction not yet ended");

        if (auction.bidder != address(0)) {
            bool success = wethToken.transfer(
                address(wethFunds),
                auction.highestBid
            );

            require(success, "unsuccessful transfer");

            (
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = financialModel.findTreeDistribution(auction.treeId);

            wethFunds.fundTree(
                auction.treeId,
                auction.highestBid,
                planterFund,
                referralFund,
                treeResearch,
                localDevelop,
                rescueFund,
                treejerDevelop,
                reserveFund1,
                reserveFund2
            );

            treeFactory.updateOwner(auction.treeId, auction.bidder, 2);

            address _tempReferrer = referrals[auction.bidder][_auctionId];

            if (_tempReferrer != address(0)) {
                regularSell.updateReferrerGiftCount(_tempReferrer, 1);
            }

            emit AuctionSettled(
                _auctionId,
                auction.treeId,
                auction.bidder,
                auction.highestBid,
                _tempReferrer
            );
        } else {
            treeFactory.updateAvailability(auction.treeId);
            emit AuctionEnded(_auctionId, auction.treeId);
        }

        delete auctions[_auctionId];
    }

    /** @dev if latest bid is less than 10 minutes to the end of auctionEndTime:
     * we will increase auctionEndTime 600 seconds
     * @param _auctionId id of auction that increase end time of it.
     */
    function _increaseAuctionEndTime(uint256 _auctionId) private {
        if (auctions[_auctionId].endDate - block.timestamp <= 600) {
            auctions[_auctionId].endDate += 600;
            emit AuctionEndTimeIncreased(
                _auctionId,
                auctions[_auctionId].endDate
            );
        }
    }
}
