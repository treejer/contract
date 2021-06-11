// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

import "../access/IAccessRestriction.sol";

contract TreeAuction is Initializable {


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

//
mapping(address=>Auction) auctios;
mapping(address=>uint64) pendingWithdraw;

IAccessRestriction public accessRestriction;

// IGenesisTree public genesisTree;


function initialize(address _accessRestrictionAddress) public initializer {
  IAccessRestriction candidateContract =
  IAccessRestriction(_accessRestrictionAddress);
  require(candidateContract.isAccessRestriction());
  accessRestriction = candidateContract;
}

}
