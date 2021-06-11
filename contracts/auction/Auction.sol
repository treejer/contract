// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

contract Auction {
    address payable treasuryAddress;
    struct auction {
      uint256 auctionId; 
      uint256 treeId; 
      address bider; 
      bytes32 status;
      uint64 startDate; 
      uint64 endDate; 
      uint64 initialPrice;
      uint64 highestBid; 
      uint64 bidInterval; 
}








}
