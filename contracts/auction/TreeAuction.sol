// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

contract TreeAuction {
    address payable treasuryAddress;
    struct Auction {
        uint256 auctionId;
        uint256 treeId;
        address bider;
        bytes32 status;
        uint64 startDate;
        uint64 endDate;
        uint64 highestBid;
        uint32 initialPrice;
        uint32 bidInterval;
    }

    mapping(address => Auction) auctios;
    mapping(address => uint64) pendingWithdraw;
}
