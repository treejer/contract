// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IWethFunds.sol";
import "../treasury/IFinancialModel.sol";
import "../treasury/IPlanterFund.sol";
import "../tree/ITreeAttribute.sol";
import "../regularSell/IRegularSell.sol";
import "../gsn/RelayRecipient.sol";

contract IncrementalSell is Initializable, RelayRecipient {
    /** NOTE {isIncrementalSell} set inside the initialize to {true} */
    bool public isIncrementalSell;
    uint256 public lastSold;

    uint256 public regularPlanterFund;
    uint256 public regularReferralFund;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFunds public wethFunds;
    IFinancialModel public financialModel;
    ITreeAttribute public treeAttribute;
    IPlanterFund public planterFundContract;
    IRegularSell public regularSell;
    IERC20Upgradeable public wethToken;

    struct IncrementalPrice {
        uint256 startTree;
        uint256 endTree;
        uint256 initialPrice;
        uint64 increaseStep;
        uint64 increaseRatio;
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

    /** NOTE {incrementalPrice} is struct of IncrementalPrice that store
     * startTree, endTree, initialPrice, increaseStep, increaseRatio values
     */
    IncrementalPrice public incrementalPrice;

    /** NOTE mapping of buyer address to lastBuy time */
    // mapping(address => uint256) public lastBuy;

    event IncrementalTreeSold(address buyer, uint256 startId, uint256 count);
    event IncrementalSellUpdated();
    event IncrementalRatesUpdated();

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
     * @dev initialize accessRestriction contract and set true for isIncrementalSell
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
        isIncrementalSell = true;
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

    function setRegularSellAddress(address _address) external onlyAdmin {
        IRegularSell candidateContract = IRegularSell(_address);
        require(candidateContract.isRegularSell());
        regularSell = candidateContract;
    }

    /** @dev admin set TreeFactory contract address
     * @param _address TreeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /** @dev admin set wethFunds contract address
     * @param _address wethFunds contract address
     */
    function setWethFundsAddress(address _address) external onlyAdmin {
        IWethFunds candidateContract = IWethFunds(_address);

        require(candidateContract.isWethFunds());

        wethFunds = candidateContract;
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
     * @dev admin set FinancialModelAddress
     * @param _address set to the address of financialModel
     */
    function setFinancialModelAddress(address _address) external onlyAdmin {
        IFinancialModel candidateContract = IFinancialModel(_address);
        require(candidateContract.isFinancialModel());
        financialModel = candidateContract;
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
    function freeIncrementalSell(uint256 _count) external onlyDataManager {
        IncrementalPrice storage incrPrice = incrementalPrice;

        uint256 newStartTree = incrPrice.startTree + _count;

        require(
            incrPrice.increaseStep > 0 && newStartTree <= incrPrice.endTree,
            "IncrementalSell not exist or count must be lt endTree"
        );

        treeFactory.bulkRevert(incrPrice.startTree, newStartTree);

        incrPrice.startTree = newStartTree;
        lastSold = newStartTree - 1;
    }

    /**
     * @dev admin set a range from {startTree} to {startTree + treeCount}
     * for incremental selles for tree
     * @param _startTree starting treeId
     * @param _initialPrice initialPrice of trees
     * @param _treeCount number of tree in incremental sell
     * @param _steps step to increase tree price
     * @param _increaseRatio increment price rate
     */

    function addTreeSells(
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
            financialModel.distributionModelExistance(_startTree),
            "equivalant fund Model not exists"
        );

        IncrementalPrice storage incrPrice = incrementalPrice;

        if (incrPrice.increaseStep > 0) {
            treeFactory.bulkRevert(incrPrice.startTree, incrPrice.endTree);
        }

        require(
            treeFactory.manageProvideStatus(
                _startTree,
                _startTree + _treeCount,
                2
            ),
            "trees are not available for sell"
        );

        incrPrice.startTree = _startTree;
        incrPrice.endTree = _startTree + _treeCount;
        incrPrice.initialPrice = _initialPrice;
        incrPrice.increaseStep = _steps;
        incrPrice.increaseRatio = _increaseRatio;

        lastSold = _startTree - 1;

        emit IncrementalSellUpdated();
    }

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param _treeCount number of trees added at the end of the incremental sell
     * tree range
     */
    function updateIncrementalEnd(uint256 _treeCount) external onlyDataManager {
        IncrementalPrice storage incrPrice = incrementalPrice;
        require(
            incrPrice.increaseStep > 0,
            "incremental period should be positive"
        );
        require(
            treeFactory.manageProvideStatus(
                incrPrice.endTree,
                incrPrice.endTree + _treeCount,
                2
            ),
            "trees are not available for sell"
        );
        incrPrice.endTree = incrPrice.endTree + _treeCount;

        emit IncrementalSellUpdated();
    }

    //TODO:ADD_COMMENTS
    function buyTree(uint256 _count, address _referrer) external ifNotPaused {
        require(_count < 101 && _count > 0, "Count must be lt 100");

        IncrementalPrice storage incPrice = incrementalPrice;

        require(
            lastSold + _count < incPrice.endTree,
            "Not enough tree in incremental sell"
        );

        uint256 treeId = lastSold + 1;

        uint256 y = (treeId - incPrice.startTree) / incPrice.increaseStep;

        uint256 z = (y + 1) *
            incPrice.increaseStep +
            incPrice.startTree -
            treeId;

        uint256 nowPrice = incPrice.initialPrice +
            (y * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

        uint256 totalPrice = _count * nowPrice;

        int256 extra = int256(_count) - int256(z);

        while (extra > 0) {
            totalPrice +=
                (uint256(extra) *
                    incPrice.initialPrice *
                    incPrice.increaseRatio) /
                10000;
            extra -= int64(incPrice.increaseStep);
        }

        //transfer totalPrice to wethFunds
        require(
            wethToken.balanceOf(_msgSender()) >= totalPrice,
            "low price paid"
        );

        bool success = wethToken.transferFrom(
            _msgSender(),
            address(wethFunds),
            totalPrice
        );

        require(success, "unsuccessful transfer");

        treeId = _calcTotal(
            treeId,
            _count,
            _msgSender(),
            _referrer,
            totalPrice
        );

        lastSold = treeId - 1;

        emit IncrementalTreeSold(_msgSender(), treeId - _count, _count);
    }

    //TODO:ADD_COMMENTS
    function claimTreeAttributes(uint256 _startTree, uint256 _count) external {
        uint256 treeId = _startTree;
        for (uint256 i = 0; i < _count; i++) {
            treeId = _startTree + i;

            (bool ms, bytes32 randTree) = treeFactory.checkMintStatus(
                treeId,
                _msgSender()
            );

            require(ms, "no need to tree attributes");

            treeAttribute.createTreeAttributes(treeId, randTree, _msgSender());
        }
    }

    /** @dev admin can update incrementalPrice
     * @param _initialPrice initialPrice of trees
     * @param _increaseStep step to increase tree price
     * @param _increaseRatio increment price rate
     */
    function updateIncrementalRates(
        uint256 _initialPrice,
        uint64 _increaseStep,
        uint64 _increaseRatio
    ) external onlyDataManager {
        require(_increaseStep > 0, "incremental period should be positive");

        IncrementalPrice storage incrPrice = incrementalPrice;

        incrPrice.initialPrice = _initialPrice;
        incrPrice.increaseStep = _increaseStep;
        incrPrice.increaseRatio = _increaseRatio;

        emit IncrementalRatesUpdated();
    }

    function _calcTotal(
        uint256 _startTreeId,
        uint256 _count,
        address _buyer,
        address _referrer,
        uint256 _totalPrice
    ) private returns (uint256) {
        IncrementalPrice storage incPrice = incrementalPrice;

        FundDistribution memory totalFunds;

        uint256 treeId = _startTreeId;

        totalFunds.buyer = _buyer;

        for (uint256 i = 0; i < _count; i++) {
            uint256 steps = (treeId - incPrice.startTree) /
                incPrice.increaseStep;

            uint256 treePrice = incPrice.initialPrice +
                (steps * incPrice.initialPrice * incPrice.increaseRatio) /
                10000;

            (
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = financialModel.findTreeDistribution(treeId);

            totalFunds.planterFund += (treePrice * planterFund) / 10000;
            totalFunds.referralFund += (treePrice * referralFund) / 10000;
            totalFunds.treeResearch += (treePrice * treeResearch) / 10000;
            totalFunds.localDevelop += (treePrice * localDevelop) / 10000;
            totalFunds.rescueFund += (treePrice * rescueFund) / 10000;
            totalFunds.treejerDevelop += (treePrice * treejerDevelop) / 10000;
            totalFunds.reserveFund1 += (treePrice * reserveFund1) / 10000;
            totalFunds.reserveFund2 += (treePrice * reserveFund2) / 10000;

            treeFactory.updateOwner(treeId, totalFunds.buyer, 1);

            treeId += 1;
        }

        uint256 daiAmount = wethFunds.incrementalFund(
            totalFunds.planterFund,
            totalFunds.referralFund,
            totalFunds.treeResearch,
            totalFunds.localDevelop,
            totalFunds.rescueFund,
            totalFunds.treejerDevelop,
            totalFunds.reserveFund1,
            totalFunds.reserveFund2
        );

        _func3(
            _startTreeId,
            _count,
            daiAmount,
            totalFunds.planterFund,
            totalFunds.referralFund,
            _totalPrice
        );

        if (_referrer != address(0)) {
            wethFunds.buyerReferrerFund(
                _count * (regularPlanterFund + regularReferralFund)
            );

            regularSell.mintReferralTree(
                _count,
                _referrer,
                regularPlanterFund,
                regularReferralFund
            );
        }

        return treeId;
    }

    function _func3(
        uint256 _startTreeId,
        uint256 _count,
        uint256 _daiAmount,
        uint256 _planterFund,
        uint256 _referralFund,
        uint256 _totalPrice
    ) private {
        uint256 planterDai = (_daiAmount * (_planterFund)) /
            (_planterFund + _referralFund);

        uint256 referralDai = (_daiAmount * (_referralFund)) /
            (_planterFund + _referralFund);

        IncrementalPrice storage incPrice = incrementalPrice;

        uint256 treeId = _startTreeId;

        for (uint256 i = 0; i < _count; i++) {
            uint256 steps = (treeId - incPrice.startTree) /
                incPrice.increaseStep;

            uint256 treePrice = incPrice.initialPrice +
                (steps * incPrice.initialPrice * incPrice.increaseRatio) /
                10000;

            planterFundContract.setPlanterFunds(
                treeId,
                (planterDai * treePrice) / _totalPrice,
                (referralDai * treePrice) / _totalPrice
            );

            treeId += 1;
        }
    }

    function setRegularPlanterFund(
        uint256 _regularPlanterFund,
        uint256 _regularReferralFund
    ) external onlyDataManager {
        regularPlanterFund = _regularPlanterFund;
        regularReferralFund = _regularReferralFund;
    }
}
