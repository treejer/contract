// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";

contract TreeAuction is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeCastUpgradeable for uint256;

    CountersUpgradeable.Counter private auctionId;
    bool public isTreeAuction;

    address payable treasuryAddress;
    IAccessRestriction public accessRestriction;
    IGenesisTree public genesisTree;
    // IGenesisTreeFund public genesisTreeFund;

    struct Auction {
        uint256 treeId;
        address payable bider;
        bytes32 status;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    mapping(uint256 => Auction) public auctions;
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

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isTreeAuction = true;
        accessRestriction = candidateContract;
    }

    function setTreasuryAddress(address payable _treasuryAddress)
        external
        onlyAdmin
    {
        treasuryAddress = _treasuryAddress;
    }

    function setGenesisTreeAddress(address _address) external onlyAdmin {
        IGenesisTree candidateContract = IGenesisTree(_address);
        require(candidateContract.isGenesisTree());
        genesisTree = candidateContract;
    }

    function setGenesisTreeFundAddress(address _address) external onlyAdmin {
        // IGenesisTreeFund candidateContract = IGenesisTreeFund(_address);
        // require(candidateContract.isGenesisTreeFund());
        // genesisTreeFund = candidateContract;
    }

    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external ifNotPaused onlyAdmin {
        auctionId.increment();
        // uint256 provideStatus = genesisTree.setStatus(treeId);
        uint256 provideStatus = 0; //TODO: aliad010 fix here when genisis tree done
        require(provideStatus == 0, "the tree is on other provide");

        auctions[auctionId.current()] = Auction(
            _treeId,
            address(0),
            bytes32("started"),
            _startDate,
            _endDate,
            _intialPrice,
            _bidInterval
        );
    }

    function bid(uint256 _auctionId) external payable ifNotPaused {
        Auction storage _storageAuction = auctions[_auctionId];
        require(now <= _storageAuction.endDate, "auction already ended");
        require(now >= _storageAuction.startDate, "auction not started");
        require(
            msg.value >=
                _storageAuction.highestBid.add(_storageAuction.bidInterval),
            "invalid amount"
        );

        address payable oldBidder = _storageAuction.bider;
        uint256 oldBid = _storageAuction.highestBid;
        _storageAuction.highestBid = msg.value;
        _storageAuction.bider = msg.sender;
        emit HighestBidIncreased(
            _auctionId,
            _storageAuction.treeId,
            msg.sender,
            msg.value
        );
        _increaseAuctionEndTime(_auctionId);
        _withdraw(oldBid, oldBidder);
    }

    function _increaseAuctionEndTime(uint256 _auctionId) private {
        // if latest bid is less than 10 minutes to the end of auctionEndTime:
        // we will increase auctionEndTime 600 seconds
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

    function endAuction(uint256 _auctionId) external ifNotPaused {
        Auction storage auction = auctions[_auctionId];

        require(now >= auction.endDate, "Auction not yet ended");

        require(
            keccak256(abi.encodePacked((auction.status))) !=
                keccak256(abi.encodePacked((bytes32("ended")))),
            "endAuction has already been called"
        );

        auction.status = bytes32("ended");

        if (auction.bider != address(0)) {
            genesisTree.updateOwner(auction.treeId, auction.bider);
            // genesisTreeFund.update(auction.treeId,auction.highestBid);

            emit AuctionEnded(
                _auctionId,
                auction.treeId,
                auction.bider,
                auction.highestBid
            );

            treasuryAddress.transfer(auction.highestBid);
        } else {
            genesisTree.updateProvideStatus(auction.treeId);
        }
    }
}
