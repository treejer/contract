// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IAllocation.sol";
import "../treasury/IWethFund.sol";
import "../gsn/RelayRecipient.sol";
import "../regularSale/IRegularSale.sol";

/** @title Auction */

contract Auction is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private auctionId;

    /** NOTE {isAuction} set inside the initialize to {true} */

    bool public isAuction;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFund public wethFund;
    IAllocation public allocation;
    IERC20Upgradeable public wethToken;
    IRegularSale public regularSale;

    struct AuctionData {
        uint256 treeId;
        address bidder;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    /** NOTE mapping of auctionId to AuctionData struct */
    mapping(uint256 => AuctionData) public auctions;

    /**NOTE mapping of bidder to mapping of auctionId to referral */
    mapping(address => mapping(uint256 => address)) public referrals;

    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount,
        address referrer
    );
    event AuctionSettled(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount,
        address referrer
    );
    event AuctionCreated(uint256 auctionId);
    event AuctionEnded(uint256 auctionId, uint256 treeId);
    event AuctionEndTimeIncreased(uint256 auctionId, uint256 newAuctionEndTime);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isAuction = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /**
     * @dev admin set Allocation
     * @param _address set to the address of Allocation
     */

    function setAllocationAddress(address _address) external onlyAdmin {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /**
     * @dev admin set WethFund
     * @param _address set to the address of wethFund
     */

    function setWethFundAddress(address _address) external onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);
        require(candidateContract.isWethFund());
        wethFund = candidateContract;
    }

    /**
     * @dev admin set RegularSale
     * @param _address set to the address of regularSale
     */

    function setRegularSaleAddress(address _address) external onlyAdmin {
        IRegularSale candidateContract = IRegularSale(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    /**
     * @dev admin set WethToken
     * @param _address set to the address of wethToken
     */

    function setWethTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        wethToken = candidateContract;
    }

    /**
     * @dev admin create auction to a tree with saleType of '0' and push that auction
     * to {auctions[auctionId]} and increament auctionId by 1.
     * NOTE its necessary that a fundDestributionModel has been assigned to {_treeId}
     * @param _treeId treeId that auction create for
     * @param _startDate strat time of auction
     * @param _endDate end time of auction
     * @param _intialPrice initial price of auction
     * @param _bidInterval bid interval for auction . if it set to 10 for example and the last bid is 100.new bidder can bid for 110
     */
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external ifNotPaused onlyDataManager {
        require(allocation.exists(_treeId), "equivalant fund Model not exists");

        uint32 saleType = treeFactory.manageSaleType(_treeId, 1);

        require(saleType == 0, "not available for auction");

        AuctionData storage auctionData = auctions[auctionId.current()];

        auctionData.treeId = _treeId;
        auctionData.startDate = _startDate;
        auctionData.endDate = _endDate;
        auctionData.highestBid = _intialPrice;
        auctionData.bidInterval = _bidInterval;

        emit AuctionCreated(auctionId.current());

        auctionId.increment();
    }

    /**
     * @dev bid to {auctions[_auctionId]} by user in a time beetwen start time and end time
     * its require to send at least {higestBid + bidInterval } {_amount}.
     * if new bid done old bidder refund automatically.
     * @param _auctionId auctionId that user bid for it.
     */

    function bid(
        uint256 _auctionId,
        uint256 _amount,
        address _referrer
    ) external ifNotPaused {
        AuctionData storage auctionData = auctions[_auctionId];

        require(
            block.timestamp <= auctionData.endDate,
            "auction already ended"
        );

        require(
            block.timestamp >= auctionData.startDate,
            "auction not started"
        );

        require(
            _amount >= auctionData.highestBid + auctionData.bidInterval,
            "invalid amount"
        );

        require(
            wethToken.balanceOf(_msgSender()) >= _amount,
            "insufficient balance"
        );

        bool success = wethToken.transferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        require(success, "unsuccessful transfer");

        if (
            _referrer != address(0) &&
            referrals[_msgSender()][_auctionId] == address(0)
        ) {
            referrals[_msgSender()][_auctionId] = _referrer;
        }

        address oldBidder = auctionData.bidder;
        uint256 oldBid = auctionData.highestBid;

        auctionData.highestBid = _amount;
        auctionData.bidder = _msgSender();

        emit HighestBidIncreased(
            _auctionId,
            auctionData.treeId,
            _msgSender(),
            _amount,
            _referrer
        );

        _increaseAuctionEndTime(_auctionId);

        if (oldBidder != address(0)) {
            bool successTransfer = wethToken.transfer(oldBidder, oldBid);

            require(successTransfer, "unsuccessful transfer");
        }
    }

    /** @dev everyone can call this method  including the winner of auction after
     * auction end time and if auction have bidder transfer owner of tree to bidder
     * and tree funded.
     * @param _auctionId id of auction that want to finish.
     */
    function endAuction(uint256 _auctionId) external ifNotPaused {
        AuctionData storage auctionData = auctions[_auctionId];

        require(auctionData.endDate > 0, "Auction is unavailable");

        require(
            block.timestamp >= auctionData.endDate,
            "Auction not yet ended"
        );

        if (auctionData.bidder != address(0)) {
            bool success = wethToken.transfer(
                address(wethFund),
                auctionData.highestBid
            );

            require(success, "unsuccessful transfer");

            (
                uint16 planterShare,
                uint16 ambassadorShare,
                uint16 researchShare,
                uint16 localDevelopmentShare,
                uint16 insuranceShare,
                uint16 treasuryShare,
                uint16 reserve1Share,
                uint16 reserve2Share
            ) = allocation.findAllocationData(auctionData.treeId);

            wethFund.fundTree(
                auctionData.treeId,
                auctionData.highestBid,
                planterShare,
                ambassadorShare,
                researchShare,
                localDevelopmentShare,
                insuranceShare,
                treasuryShare,
                reserve1Share,
                reserve2Share
            );

            treeFactory.mintAssignedTree(
                auctionData.treeId,
                auctionData.bidder,
                2
            );

            address referrerOfWinner = referrals[auctionData.bidder][
                _auctionId
            ];

            if (referrerOfWinner != address(0)) {
                regularSale.updateReferrerClaimableTreesWeth(
                    referrerOfWinner,
                    1
                );
            }

            emit AuctionSettled(
                _auctionId,
                auctionData.treeId,
                auctionData.bidder,
                auctionData.highestBid,
                referrerOfWinner
            );
        } else {
            treeFactory.resetSaleType(auctionData.treeId);
            emit AuctionEnded(_auctionId, auctionData.treeId);
        }

        delete auctions[_auctionId];
    }

    /** @dev if latest bid is less than 10 minutes to the end of auctionEndTime:
     * we will increase auctionEndTime 600 seconds
     * @param _auctionId id of auction that increase end time of it.
     */
    function _increaseAuctionEndTime(uint256 _auctionId) private {
        if (auctions[_auctionId].endDate - block.timestamp <= 600) {
            auctions[_auctionId].endDate += 600;
            emit AuctionEndTimeIncreased(
                _auctionId,
                auctions[_auctionId].endDate
            );
        }
    }
}
