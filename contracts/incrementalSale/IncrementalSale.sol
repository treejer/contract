// // SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IWethFund.sol";
import "../treasury/IAllocation.sol";
import "../treasury/IPlanterFund.sol";
import "../tree/ITreeAttribute.sol";
import "../regularSale/IRegularSale.sol";
import "../gsn/RelayRecipient.sol";

contract IncrementalSale is Initializable, RelayRecipient {
    /** NOTE {isIncrementalSale} set inside the initialize to {true} */
    bool public isIncrementalSale;
    uint256 public lastSold;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFund public wethFund;
    IAllocation public allocation;
    ITreeAttribute public treeAttribute;
    IPlanterFund public planterFundContract;
    IRegularSale public regularSale;
    IERC20Upgradeable public wethToken;

    struct IncrementalSaleData {
        uint256 startTreeId;
        uint256 endTreeId;
        uint256 initialPrice;
        uint64 increments;
        uint64 priceJump;
    }

    struct FundDistribution {
        uint256 planterFund;
        uint256 referralFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
        address buyer;
    }

    /** NOTE {incrementalSaleData} is struct of IncrementalSaleData that store
     * startTreeId, endTreeId, initialPrice, increments, priceJump values
     */
    IncrementalSaleData public incrementalSaleData;

    /** NOTE mapping of buyer address to lastBuy time */
    // mapping(address => uint256) public lastBuy;

    event TreeFunded(
        address funder,
        address referrer,
        uint256 startTreeId,
        uint256 count
    );
    event IncrementalSaleUpdated();
    event IncrementalSaleDataUpdated();

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
     * @dev initialize accessRestriction contract and set true for isIncrementalSale
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
        isIncrementalSale = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set PlanterFundAddress
     * @param _address set to the address of PlanterFund
     */

    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    function setRegularSaleAddress(address _address) external onlyAdmin {
        IRegularSale candidateContract = IRegularSale(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    /** @dev admin set TreeFactory contract address
     * @param _address TreeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /** @dev admin set wethFund contract address
     * @param _address wethFund contract address
     */
    function setWethFundAddress(address _address) external onlyAdmin {
        IWethFund candidateContract = IWethFund(_address);

        require(candidateContract.isWethFund());

        wethFund = candidateContract;
    }

    /** @dev admin set wethToken contract address
     * @param _address wethToken contract address
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
     * @dev admin set Allocation address
     * @param _address set to the address of Allocation
     */
    function setAllocationAddress(address _address) external onlyAdmin {
        IAllocation candidateContract = IAllocation(_address);
        require(candidateContract.isAllocation());
        allocation = candidateContract;
    }

    /**
     * @dev admin set TreeAttributesAddress
     * @param _address set to the address of treeAttribute
     */

    function setTreeAttributesAddress(address _address) external onlyAdmin {
        ITreeAttribute candidateContract = ITreeAttribute(_address);
        require(candidateContract.isTreeAttribute());
        treeAttribute = candidateContract;
    }

    //TODO: ADD_COMMENT
    function removeIncrementalSale(uint256 _count) external onlyDataManager {
        IncrementalSaleData storage incrPrice = incrementalSaleData;

        uint256 newStartTree = incrPrice.startTreeId + _count;

        require(
            incrPrice.increments > 0 && newStartTree <= incrPrice.endTreeId,
            "IncrementalSale not exist or count must be lt endTree"
        );

        treeFactory.resetSaleTypeBatch(incrPrice.startTreeId, newStartTree);

        incrPrice.startTreeId = newStartTree;
        lastSold = newStartTree - 1;

        emit IncrementalSaleUpdated();
    }

    /**
     * @dev admin set a range from {startTreeId} to {startTreeId + treeCount}
     * for incremental selles for tree
     * @param _startTree starting treeId
     * @param _initialPrice initialPrice of trees
     * @param _treeCount number of tree in incremental sell
     * @param _steps step to increase tree price
     * @param _increaseRatio increment price rate
     */

    function createIncrementalSale(
        uint256 _startTree,
        uint256 _initialPrice,
        uint64 _treeCount,
        uint64 _steps,
        uint64 _increaseRatio
    ) external onlyDataManager {
        require(_treeCount > 0, "assign at least one tree");
        require(_startTree > 100, "trees are under Auction");
        require(_steps > 0, "incremental period should be positive");
        require(
            allocation.exists(_startTree),
            "equivalant fund Model not exists"
        );

        IncrementalSaleData storage incrPrice = incrementalSaleData;

        if (incrPrice.increments > 0) {
            treeFactory.resetSaleTypeBatch(
                incrPrice.startTreeId,
                incrPrice.endTreeId
            );
        }

        require(
            treeFactory.manageSaleTypeBatch(
                _startTree,
                _startTree + _treeCount,
                2
            ),
            "trees are not available for sell"
        );

        incrPrice.startTreeId = _startTree;
        incrPrice.endTreeId = _startTree + _treeCount;
        incrPrice.initialPrice = _initialPrice;
        incrPrice.increments = _steps;
        incrPrice.priceJump = _increaseRatio;

        lastSold = _startTree - 1;

        emit IncrementalSaleUpdated();
    }

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param _treeCount number of trees added at the end of the incremental sell
     * tree range
     */
    function updateEndTreeId(uint256 _treeCount) external onlyDataManager {
        IncrementalSaleData storage incrPrice = incrementalSaleData;
        require(
            incrPrice.increments > 0,
            "incremental period should be positive"
        );
        require(
            treeFactory.manageSaleTypeBatch(
                incrPrice.endTreeId,
                incrPrice.endTreeId + _treeCount,
                2
            ),
            "trees are not available for sell"
        );
        incrPrice.endTreeId = incrPrice.endTreeId + _treeCount;

        emit IncrementalSaleUpdated();
    }

    //TODO:ADD_COMMENTS
    function fundTree(uint256 _count, address _referrer) external ifNotPaused {
        require(_count < 101 && _count > 0, "Count must be lt 100");

        IncrementalSaleData storage incPrice = incrementalSaleData;

        require(
            lastSold + _count < incPrice.endTreeId,
            "Not enough tree in incremental sell"
        );

        uint256 treeId = lastSold + 1;

        uint256 y = (treeId - incPrice.startTreeId) / incPrice.increments;

        uint256 z = (y + 1) *
            incPrice.increments +
            incPrice.startTreeId -
            treeId;

        uint256 nowPrice = incPrice.initialPrice +
            (y * incPrice.initialPrice * incPrice.priceJump) /
            10000;

        uint256 totalPrice = _count * nowPrice;

        int256 extra = int256(_count) - int256(z);

        while (extra > 0) {
            totalPrice +=
                (uint256(extra) * incPrice.initialPrice * incPrice.priceJump) /
                10000;
            extra -= int64(incPrice.increments);
        }

        //transfer totalPrice to wethFund
        require(
            wethToken.balanceOf(_msgSender()) >= totalPrice,
            "low price paid"
        );

        bool success = wethToken.transferFrom(
            _msgSender(),
            address(wethFund),
            totalPrice
        );

        require(success, "unsuccessful transfer");

        treeId = _setAllocation(
            treeId,
            _count,
            _msgSender(),
            _referrer,
            totalPrice
        );

        lastSold = treeId - 1;

        emit TreeFunded(_msgSender(), _referrer, treeId - _count, _count);
    }

    //TODO:ADD_COMMENTS
    function revealAttributes(uint256 _startTree, uint256 _count) external {
        uint256 treeId = _startTree;
        for (uint256 i = 0; i < _count; i++) {
            treeId = _startTree + i;

            (bool ms, bytes32 randTree) = treeFactory.checkMintOrigin(
                treeId,
                _msgSender()
            );

            require(ms, "no need to tree attributes");

            treeAttribute.createTreeAttributes(treeId, randTree, _msgSender());
        }
    }

    /** @dev admin can update incrementalSaleData
     * @param _initialPrice initialPrice of trees
     * @param _increaseStep step to increase tree price
     * @param _increaseRatio increment price rate
     */
    function updateIncrementalSaleData(
        uint256 _initialPrice,
        uint64 _increaseStep,
        uint64 _increaseRatio
    ) external onlyDataManager {
        require(_increaseStep > 0, "incremental period should be positive");

        IncrementalSaleData storage incrPrice = incrementalSaleData;

        incrPrice.initialPrice = _initialPrice;
        incrPrice.increments = _increaseStep;
        incrPrice.priceJump = _increaseRatio;

        emit IncrementalSaleDataUpdated();
    }

    function _setAllocation(
        uint256 _startTreeId,
        uint256 _count,
        address _buyer,
        address _referrer,
        uint256 _totalPrice
    ) private returns (uint256) {
        IncrementalSaleData storage incPrice = incrementalSaleData;

        FundDistribution memory totalFunds;

        uint256 treeId = _startTreeId;

        totalFunds.buyer = _buyer;

        for (uint256 i = 0; i < _count; i++) {
            uint256 steps = (treeId - incPrice.startTreeId) /
                incPrice.increments;

            uint256 treePrice = incPrice.initialPrice +
                (steps * incPrice.initialPrice * incPrice.priceJump) /
                10000;

            (
                uint16 planterShare,
                uint16 ambassadorShare,
                uint16 researchShare,
                uint16 localDevelopmentShare,
                uint16 insuranceShare,
                uint16 treasuryShare,
                uint16 reserve1Share,
                uint16 reserve2Share
            ) = allocation.findAllocationData(treeId);

            totalFunds.planterFund += (treePrice * planterShare) / 10000;
            totalFunds.referralFund += (treePrice * ambassadorShare) / 10000;
            totalFunds.treeResearch += (treePrice * researchShare) / 10000;
            totalFunds.localDevelop +=
                (treePrice * localDevelopmentShare) /
                10000;
            totalFunds.rescueFund += (treePrice * insuranceShare) / 10000;
            totalFunds.treejerDevelop += (treePrice * treasuryShare) / 10000;
            totalFunds.reserveFund1 += (treePrice * reserve1Share) / 10000;
            totalFunds.reserveFund2 += (treePrice * reserve2Share) / 10000;

            treeFactory.mintAssignedTree(treeId, totalFunds.buyer, 1);

            treeId += 1;
        }

        uint256 daiAmount = wethFund.fundTreeBatch(
            totalFunds.planterFund,
            totalFunds.referralFund,
            totalFunds.treeResearch,
            totalFunds.localDevelop,
            totalFunds.rescueFund,
            totalFunds.treejerDevelop,
            totalFunds.reserveFund1,
            totalFunds.reserveFund2
        );

        _setPlanterAllocation(
            _startTreeId,
            _count,
            daiAmount,
            totalFunds.planterFund,
            totalFunds.referralFund,
            _totalPrice
        );

        if (_referrer != address(0)) {
            regularSale.updateReferrerClaimableTreesWeth(_referrer, _count);
        }

        return treeId;
    }

    function _setPlanterAllocation(
        uint256 _startTreeId,
        uint256 _count,
        uint256 _daiAmount,
        uint256 _planterFund,
        uint256 _referralFund,
        uint256 _totalPrice
    ) private {
        uint256 planterDai = (_daiAmount * _planterFund) /
            (_planterFund + _referralFund);

        uint256 referralDai = (_daiAmount * _referralFund) /
            (_planterFund + _referralFund);

        IncrementalSaleData storage incPrice = incrementalSaleData;

        uint256 treeId = _startTreeId;

        for (uint256 i = 0; i < _count; i++) {
            uint256 steps = (treeId - incPrice.startTreeId) /
                incPrice.increments;

            uint256 treePrice = incPrice.initialPrice +
                (steps * incPrice.initialPrice * incPrice.priceJump) /
                10000;

            planterFundContract.updateProjectedEarnings(
                treeId,
                (planterDai * treePrice) / _totalPrice,
                (referralDai * treePrice) / _totalPrice
            );

            treeId += 1;
        }
    }
}
