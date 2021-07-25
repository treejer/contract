// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";
import "../treasury/ITreasury.sol";

/** @title Tree Auction */

contract TreeAuction is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeCastUpgradeable for uint256;

    CountersUpgradeable.Counter private auctionId;

    /** NOTE {isTreeAuction} set inside the initialize to {true} */

    bool public isTreeAuction;

    IAccessRestriction public accessRestriction;
    IGenesisTree public genesisTree;
    ITreasury public treasury;

    struct Auction {
        uint256 treeId;
        address payable bidder;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    /** NOTE mapping of auctionId to Auction struct */
    mapping(uint256 => Auction) public auctions;

    /** NOTE mapping of address to amount */
    mapping(address => uint256) public pendingWithdraw;

    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount
    );
    event AuctionEndTimeIncreased(
        uint256 auctionId,
        uint256 newAuctionEndTime,
        address bidder
    );

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isTreeAuction = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set GenesisTreeAddress
     * @param _address set to the address of genesisTree
     */

    function setGenesisTreeAddress(address _address) external onlyAdmin {
        IGenesisTree candidateContract = IGenesisTree(_address);
        require(candidateContract.isGenesisTree());
        genesisTree = candidateContract;
    }

    /**
     * @dev admin set TreasuryAddress
     * @param _address set to the address of treasury
     */

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);
        require(candidateContract.isTreasury());
        treasury = candidateContract;
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
    ) external ifNotPaused onlyAdmin {
        require(
            treasury.distributionModelExistance(_treeId),
            "equivalant fund Model not exists"
        );

        uint32 provideStatus = genesisTree.availability(_treeId, 1);

        require(provideStatus == 0, "not available for auction");

        Auction storage auction = auctions[auctionId.current()];

        auction.treeId = _treeId;
        auction.startDate = _startDate;
        auction.endDate = _endDate;
        auction.highestBid = _intialPrice;
        auction.bidInterval = _bidInterval;

        auctionId.increment();
    }

    /**
     * @dev bid to {auctions[_auctionId]} by user in a time beetwen start time and end time
     * its require to send at least {higestBid + bidInterval } value.
     * @param _auctionId auctionId that user bid for it.
     */

    function bid(uint256 _auctionId) external payable ifNotPaused {
        Auction storage _storageAuction = auctions[_auctionId];

        require(now <= _storageAuction.endDate, "auction already ended");
        require(now >= _storageAuction.startDate, "auction not started");
        require(
            msg.value >=
                _storageAuction.highestBid.add(_storageAuction.bidInterval),
            "invalid amount"
        );

        address payable oldBidder = _storageAuction.bidder;
        uint256 oldBid = _storageAuction.highestBid;

        _storageAuction.highestBid = msg.value;
        _storageAuction.bidder = msg.sender;

        emit HighestBidIncreased(
            _auctionId,
            _storageAuction.treeId,
            msg.sender,
            msg.value
        );

        _increaseAuctionEndTime(_auctionId);
        _withdraw(oldBid, oldBidder);
    }

    /** @dev users can manually withdraw if its balance is more than 0.
     * @return true in case of successfull withdraw and false otherwise.
     */

    function manualWithdraw() external ifNotPaused returns (bool) {
        uint256 amount = pendingWithdraw[msg.sender];

        require(amount > 0, "User balance is not enough");

        pendingWithdraw[msg.sender] = 0;

        if (!msg.sender.send(amount)) {
            pendingWithdraw[msg.sender] = amount;
            return false;
        }

        return true;
    }

    /** @dev everyone can call this method  including the winner of auction after
     * auction end time and if auction have bidder transfer owner of tree to bidder and fund tree.
     * @param _auctionId id of auction that want to finish.
     */
    function endAuction(uint256 _auctionId) external ifNotPaused {
        Auction storage auction = auctions[_auctionId];

        require(auction.endDate > 0, "Auction is unavailable");

        require(now >= auction.endDate, "Auction not yet ended");

        if (auction.bidder != address(0)) {
            genesisTree.updateOwner(auction.treeId, auction.bidder);

            treasury.fundTree{value: auction.highestBid}(auction.treeId);

            emit AuctionEnded(
                _auctionId,
                auction.treeId,
                auction.bidder,
                auction.highestBid
            );
        } else {
            genesisTree.updateAvailability(auction.treeId);
        }

        delete auctions[_auctionId];
    }

    /** @dev if latest bid is less than 10 minutes to the end of auctionEndTime:
     * we will increase auctionEndTime 600 seconds
     * @param _auctionId id of auction that increase end time of it.
     */
    function _increaseAuctionEndTime(uint256 _auctionId) private {
        if (auctions[_auctionId].endDate.sub(now).toUint64() <= 600) {
            auctions[_auctionId].endDate = auctions[_auctionId]
            .endDate
            .add(600)
            .toUint64();

            emit AuctionEndTimeIncreased(
                _auctionId,
                auctions[_auctionId].endDate,
                msg.sender
            );
        }
    }

    /** @dev when new bid take apart we charge the previous bidder as
     * much as paid before using this function
     */

    function _withdraw(uint256 _oldBid, address payable _oldBidder) private {
        if (_oldBidder != address(0)) {
            uint32 size;

            assembly {
                size := extcodesize(_oldBidder)
            }

            if (size > 0) {
                pendingWithdraw[_oldBidder] = pendingWithdraw[_oldBidder].add(
                    _oldBid
                );
            } else if (!_oldBidder.send(_oldBid)) {
                pendingWithdraw[_oldBidder] = pendingWithdraw[_oldBidder].add(
                    _oldBid
                );
            }
        }
    }
}
