// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";

contract TreeAuction is Initializable {
    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(
        uint256 aucionId,
        uint256 treeId,
        address winner,
        uint256 amount
    );
    event AuctionEndTimeIncreased(
        uint256 auctionId,
        uint256 newAuctionEndTime,
        address bidder
    );

    address payable treasuryAddress;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeCastUpgradeable for uint256;

    CountersUpgradeable.Counter private auctionId;

    struct Auction {
        uint256 treeId;
        address payable bider;
        bytes32 status;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 initialPrice;
        uint256 bidInterval;
    }

    mapping(uint256 => Auction) auctios;
    mapping(address => uint256) pendingWithdraw;

    IAccessRestriction public accessRestriction;

    // IGenesisTree public genesisTree;
    // IGenesisTreeFund public genesisTreeFund;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setTreasuryAddress(address payable _treasuryAddress) external {
        accessRestriction.ifAdmin(msg.sender);
        treasuryAddress = _treasuryAddress;
    }

    function setGenesisTreeAddress(address _address) external {
        // accessRestriction.ifAdmin(msg.sender);
        // IGenesisTree candidateContract = IGenesisTree(_address);
        // require(candidateContract.isGenesisTree());
        // genesisTree = candidateContract;
    }

    function setGenesisTreeFundAddress(address _address) external {
        // accessRestriction.ifAdmin(msg.sender);
        // IGenesisTreeFund candidateContract = IGenesisTreeFund(_address);
        // require(candidateContract.isGenesisTreeFund());
        // genesisTreeFund = candidateContract;
    }

    function createAuction(
        uint256 _treeId,
        address payable _bider,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _highestBid,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external {
        accessRestriction.ifAdmin(msg.sender);
        auctionId.increment();
        // uint256 treeStatus = genesisTree.setStatus(treeId);
        uint256 treeStatus = 5; //TODO: aliad010 fix here when genisis tree done
        require(treeStatus < 10, "the tree is on other provide");

        auctios[auctionId.current()] = Auction(
            _treeId,
            _bider,
            bytes32("started"),
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
            msg.value >= _memAauction.initialPrice,
            "must be more than initail value"
        );
        require(
            msg.value >= _memAauction.bidInterval.add(_memAauction.highestBid)
        );
        require(now <= _memAauction.endDate, "Auction already ended.");
        require(now > _memAauction.startDate, "Auction not started.");

        address payable olderBidder = _memAauction.bider;
        uint256 oldBid = _memAauction.highestBid;
        _memAauction.highestBid = msg.value;
        _memAauction.bider = msg.sender;
        emit HighestBidIncreased(msg.sender, msg.value);
        increaseAuctionEndTime(_auctionId);
        _withdraw(oldBid, olderBidder);
    }

    function increaseAuctionEndTime(uint256 _auctionId) internal {
        // if latest bid is less than 10 minutes to the end of auctionEndTime:
        // we will increase auctionEndTime 600 seconds
        if (auctios[_auctionId].endDate.sub(block.timestamp).toUint64() > 600) {
            return;
        }

        auctios[_auctionId].endDate = auctios[_auctionId]
            .endDate
            .add(600)
            .toUint64();

        emit AuctionEndTimeIncreased(
            _auctionId,
            auctios[_auctionId].endDate,
            msg.sender
        );
    }

    function _withdraw(uint256 oldbid, address payable oldbidder) private {
        uint32 size;
        assembly {
            size := extcodesize(oldbidder)
        }
        if (size > 0) {
            pendingWithdraw[oldbidder] = pendingWithdraw[oldbidder].add(oldbid);
        } else if (!oldbidder.send(oldbid)) {
            pendingWithdraw[oldbidder] = pendingWithdraw[oldbidder].add(oldbid);
        }
    }

    function manualWithdraw() external returns (bool) {
        uint256 amount = pendingWithdraw[msg.sender];

        if (amount > 0) {
            pendingWithdraw[msg.sender] = 0;

            if (!msg.sender.send(amount)) {
                pendingWithdraw[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function auctionEnd(uint256 _auctionId) external {
        accessRestriction.ifAdmin(msg.sender);

        Auction storage localAuction = auctios[_auctionId];

        require(now >= localAuction.endDate, "Auction not yet ended.");
        require(
            keccak256(abi.encodePacked((localAuction.status))) ==
                keccak256(abi.encodePacked((bytes32("end")))),
            "auctionEnd has already been called."
        );
        require(localAuction.bider != address(0), "No refer to auction");

        // genesisTree.updateOwner(localAuction.treeId,localAuction.bider);
        // genesisTreeFund.update(localAuction.treeId,localAuction.highestBid);

        localAuction.status = bytes32("end");

        emit AuctionEnded(
            _auctionId,
            localAuction.treeId,
            localAuction.bider,
            localAuction.highestBid
        );

        treasuryAddress.transfer(localAuction.highestBid);
    }
}
