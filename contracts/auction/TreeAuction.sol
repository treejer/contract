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

function _withdraw(uint64 auctionId, uint64 oldbid, address payable oldbidder) private {
    uint32 size; 
    assembly { 
    size := extcodesize(_addr)
    }
    if(size>0)
    {
      pendingWithdraw[oldbidder] += oldbid;
    }else if (!oldbidder.transfer(amount)) {
      pendingWithdraw[oldbidder] += oldbid;    
    }

} 

function manualWithdraw() external returns (bool) {
  uint64 amount = pendingWithdraw[msg.sender];

  if (amount > 0) {
      pendingWithdraw[msg.sender] = 0;

      if (!msg.sender.transfer(amount)) {
          pendingWithdraw[msg.sender] = amount;
          return false;
      }
  }
  return true;
}

function auctionEnd(uint64 auctionId) external {

  accessRestriction.ifAdmin(msg.sender);


  Auction memory localAuction = auctios[auctionId];

  require(now >= localAuction.endDate, "Auction not yet ended.");
  require(keccak256(abi.encodePacked((localAuction.status))) == keccak256(abi.encodePacked((bytes32("end")))), "auctionEnd has already been called.");
  require(localAuction.bider != address(0),"No refer to auction");

  genesisTree.updateOwner(localAuction.treeId,localAuction.bider);
  genesisTreeFund.update(localAuction.treeId,localAuction.highestBid);

  auctios[auctionId]= bytes32("end");

  treasuryAddress.transfer(localAuction.highestBid);

}



}
