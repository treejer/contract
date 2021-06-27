// // SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";

contract IncrementalSell is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeCastUpgradeable for uint256;

    CountersUpgradeable.Counter private offerId;
    bool public isIncrementalSell;

    address payable treasuryAddress;
    IAccessRestriction public accessRestriction;
    IGenesisTree public genesisTree;
    // IGenesisTreeFund public genesisTreeFund;

    struct Offer {
        uint256 initialPrice;
        uint256 incrementalPrice;
        uint256 fromTreeId;
        uint256 increasePriceCount;
        uint256 maxCount;
        uint256 latestTreeSold;
        uint16 status;
    }

    mapping(uint256 => Offer) public offers;

    mapping(address => uint64) public offersExpireDate; //@todo check this maping name

    event OfferAdded(uint256 offerId);

    event IncrementalTreeSold(
        uint256 offerId,
        uint256 currentPrice,
        uint256 treeId,
        address buyer,
        uint256 amount
    );
    event OfferFulfilled(uint256 offerId);

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
        isIncrementalSell = true;
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

    uint256 initialPrice;
    uint256 incrementalPrice;
    uint256 fromTreeId;
    uint256 increasePriceCount;
    uint256 maxCount;
    uint256 latestTreeSold;
    uint16 status;

    function addOffer(
        uint256 _initialPrice,
        uint256 _incrementalPrice,
        uint256 _fromTreeId,
        uint256 _increasePriceCount,
        uint256 _maxCount
    ) external ifNotPaused onlyAdmin {
        require(
            _initialPrice > 0 &&
                _incrementalPrice > 0 &&
                _fromTreeId >= 0 &&
                _increasePriceCount > 0 &&
                _maxCount > 0,
            "all params must have value"
        );

        uint256 endId = _maxCount + _fromTreeId;
        for (uint256 i = _fromTreeId; i <= endId; i++) {
            uint16 provideStatus = genesisTree.checkAndSetProvideStatus(i, 2); //@todo check provide status
            require(provideStatus == 0, "one of trees is on other provide");
        }

        offers[offerId.current()] = Offer(
            _initialPrice,
            _incrementalPrice,
            _fromTreeId,
            _increasePriceCount,
            _maxCount,
            _fromTreeId, // latest tree sold same as fromTreeId
            0
        );

        emit OfferAdded(offerId.current());

        offerId.increment();
    }

    function buy(uint256 _offerId) external payable ifNotPaused {
        Offer storage _storageOffer = offers[_offerId];

        require(
            _storageOffer.status == 0 && _storageOffer.maxCount > 0,
            "offer not runing"
        );

        uint256 currentPrice = _currentPrice(_offerId);
        require(msg.value >= currentPrice, "invalid amount");

        // increase latetsoldtree
        _storageOffer.latestTreeSold = _storageOffer.latestTreeSold.add(1);

        //transfer value to treasury
        treasuryAddress.transfer(currentPrice);




        //@todo mint tree or update owner

        _checkEndAndChangeStatus(_offerId);

        //@todo generate symbol



        emit IncrementalTreeSold(
            _offerId,
            currentPrice,
            _storageOffer.latestTreeSold,
            msg.sender,
            msg.value
        );
    }

    //@todo are we need somthing like this?
    function stopOfferAndRemoveRmainedTreesFromProvide(uint256 _offerId)
        external
        ifNotPaused
        onlyAdmin
    {}

    function currentPrice(uint256 _offerId) external view returns (uint256) {
        return _currentPrice(_offerId);
    }

    function _currentPrice(uint256 _offerId) internal view returns (uint256) {
        Offer storage _storageOffer = offers[_offerId];

        uint256 soldCount =
            _storageOffer.latestTreeSold - _storageOffer.fromTreeId;
        if (soldCount == 0 || soldCount < _storageOffer.increasePriceCount) {
            return _storageOffer.initialPrice;
        }

        return
            _storageOffer.initialPrice.add(
                soldCount.div(_storageOffer.increasePriceCount).mul(
                    _storageOffer.incrementalPrice
                )
            );
    }

    function _checkEndAndChangeStatus(uint256 _offerId) internal {
        Offer storage _storageOffer = offers[_offerId];

        if (
            _storageOffer.latestTreeSold.sub(_storageOffer.fromTreeId) >=
            _storageOffer.maxCount
        ) {
            _storageOffer.status = 2;
            emit OfferFulfilled(_offerId);
        }
    }
}
