// SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

interface IIncrementalSell {
    event OfferAdded(uint256 offerId);

    event IncrementalTreeSold(
        uint256 offerId,
        uint256 currentPrice,
        uint256 treeId,
        address buyer,
        uint256 amount
    );
    event OfferFulfilled(uint256 offerId);

    function setTreasuryAddress(address payable _treasuryAddress) external;

    function setGenesisTreeAddress(address _address) external;

    function setGenesisTreeFundAddress(address _address) external;

    function addOffer(
        uint256 _initialPrice,
        uint256 _incrementalPrice,
        uint256 _fromTreeId,
        uint256 _increasePriceCount,
        uint256 _maxCount
    ) external;

    function buy(uint256 _offerId) external payable;

    function stopOfferAndRemoveRmainedTreesFromProvide(uint256 _offerId)
        external;

    function currentPrice(uint256 _offerId) external view returns (uint256);
}
