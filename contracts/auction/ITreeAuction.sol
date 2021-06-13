// SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

interface ITreeAuction {
    function isTreeAuction() external view returns (bool);

    function setTreasuryAddress(address payable _treasuryAddress) external;

    function setGenesisTreeAddress(address _address) external;

    function setGenesisTreeFundAddress(address _address) external;

    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _highestBid,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external;

    function bid(uint256 _auctionId) external payable;

    function manualWithdraw() external returns (bool);

    function auctionEnd(uint256 _auctionId) external;
}
