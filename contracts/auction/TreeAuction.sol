// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";

contract TreeAuction is Initializable {
    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    address payable treasuryAddress;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint32;
    using SafeCastUpgradeable for uint256;
    CountersUpgradeable.Counter private auctionId;
    struct Auction {
        uint256 treeId;
        address payable bider;
        bytes32 status;
        uint64 startDate;
        uint64 endDate;
        uint64 highestBid;
        uint32 initialPrice;
        uint32 bidInterval;
    }

    //
    mapping(uint256 => Auction) auctios;
    mapping(address => uint64) pendingWithdraw;

    IAccessRestriction public accessRestriction;

    // IGenesisTree public genesisTree;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function createBid(
        uint256 _treeId,
        address payable _bider,
        bytes32 _status,
        uint64 _startDate,
        uint64 _endDate,
        uint64 _highestBid,
        uint32 _intialPrice,
        uint32 _bidInterval
    ) external {
        accessRestriction.ifAdmin(msg.sender);
        auctionId.increment();
        // uint256 treeStatus = genesisTree.setStatus(treeId);
        uint256 treeStatus = 5; //:TODO aliad010 fix here when genisis tree done
        require(treeStatus < 10, "the tree is on other provide");

        auctios[auctionId.current()] = Auction(
            _treeId,
            _bider,
            _status,
            _startDate,
            _endDate,
            _highestBid,
            _intialPrice,
            _bidInterval
        );
    }

    function bid(uint256 _auctionId) external payable {
        Auction storage _memAauction = auctios[_auctionId];
        require(
            msg.value >=
                _memAauction.bidInterval.toUint64() + _memAauction.highestBid
        );
        bool ok = true;
        require(ok);
        address payable olderBidder = _memAauction.bider;
        uint256 oldBid = _memAauction.highestBid;
        _memAauction.highestBid = msg.value.toUint64();
        _memAauction.bider = msg.sender;
        emit HighestBidIncreased(msg.sender, msg.value);
        withdraw(_auctionId, oldBid, olderBidder);
    }

    function withdraw(
        uint256 _auctionId,
        uint256 _bid,
        address payable _bidder
    ) private {}
}
