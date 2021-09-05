// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IWethFunds.sol";
import "../treasury/IFinancialModel.sol";
import "../gsn/RelayRecipient.sol";

contract IncrementalSell is Initializable, RelayRecipient {
    /** NOTE {isIncrementalSell} set inside the initialize to {true} */
    bool public isIncrementalSell;
    uint256 public lastSold;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFunds public wethFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public wethToken;

    struct IncrementalPrice {
        uint256 startTree;
        uint256 endTree;
        uint256 initialPrice;
        uint64 increaseStep;
        uint64 increaseRatio;
    }

    /** NOTE {incrementalPrice} is struct of IncrementalPrice that store
     * startTree, endTree, initialPrice, increaseStep, increaseRatio values
     */
    IncrementalPrice public incrementalPrice;

    /** NOTE mapping of buyer address to lastBuy time */
    // mapping(address => uint256) public lastBuy;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
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

    event xx(int256 yy);

    function buyTree(uint256 _count) external ifNotPaused {
        require(_count <= 100 && _count > 0, "Count must be lt 100");

        IncrementalPrice storage incPrice = incrementalPrice;

        require(
            lastSold + _count < incPrice.endTree,
            "Not enough tree in incremental sell"
        );

        uint256 localLastSold = lastSold + 1;

        //calc tree price based on treeId
        uint256 y = (localLastSold - incPrice.startTree) /
            incPrice.increaseStep;

        //TODO:lastSold or localLastSold ???

        uint256 z = (y + 1) *
            incPrice.increaseStep +
            incPrice.startTree -
            localLastSold;

        uint256 nowPrice = incPrice.initialPrice +
            (y * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

        uint256 totalPrice = _count * nowPrice;

        int256 extra = int256(_count) - int256(z);

        emit xx(extra);

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

        for (uint256 i = 0; i < _count; i++) {
            uint256 steps = (localLastSold - incPrice.startTree) /
                incPrice.increaseStep;

            uint256 treePrice = incPrice.initialPrice +
                (steps * incPrice.initialPrice * incPrice.increaseRatio) /
                10000;

            _buy(localLastSold, treePrice);

            localLastSold += 1;
        }
        //TODO : localLastSold - 1 ????
        lastSold = localLastSold - 1;
    }

    // /**
    //  * tree price calculate based on treeId and msg.sender pay weth for it
    //  * and ownership of tree transfered to msg.sender
    //  * @param _treeId id of tree to buy
    //  * NOTE if buyer, buy another tree before 700 seconds from the
    //  * previous purchase, pays 90% of tree price and gets 10% discount
    //  * just for this tree. buying another tree give chance to buy
    //  * the next tree with 10% discount
    //  */
    // function buyTree(uint256 _treeId) external ifNotPaused {
    //     //check if _treeId is in this incrementalSell
    //     IncrementalPrice storage incPrice = incrementalPrice;

    //     require(
    //         _treeId < incPrice.endTree && _treeId >= incPrice.startTree,
    //         "tree is not in incremental sell"
    //     );

    //     //calc tree price based on treeId
    //     uint256 steps = (_treeId - incPrice.startTree) / incPrice.increaseStep;
    //     uint256 treePrice = incPrice.initialPrice +
    //         (steps * incPrice.initialPrice * incPrice.increaseRatio) /
    //         10000;

    //     uint256 amount;

    //     //checking price paid is enough for buying the treeId checking discounts
    //     if (lastBuy[_msgSender()] > block.timestamp - 700 seconds) {
    //         amount = (treePrice * 90) / 100;
    //         require(
    //             wethToken.balanceOf(_msgSender()) >= amount,
    //             "low price paid"
    //         );

    //         bool success = wethToken.transferFrom(
    //             _msgSender(),
    //             address(wethFunds),
    //             amount
    //         );
    //         require(success, "unsuccessful transfer");

    //         lastBuy[_msgSender()] = 0;
    //     } else {
    //         amount = treePrice;

    //         require(
    //             wethToken.balanceOf(_msgSender()) >= amount,
    //             "low price paid"
    //         );

    //         bool success = wethToken.transferFrom(
    //             _msgSender(),
    //             address(wethFunds),
    //             amount
    //         );
    //         require(success, "unsuccessful transfer");

    //         lastBuy[_msgSender()] = block.timestamp;
    //     }

    //     (
    //         uint16 planterFund,
    //         uint16 referralFund,
    //         uint16 treeResearch,
    //         uint16 localDevelop,
    //         uint16 rescueFund,
    //         uint16 treejerDevelop,
    //         uint16 reserveFund1,
    //         uint16 reserveFund2
    //     ) = financialModel.findTreeDistribution(_treeId);

    //     wethFunds.fundTree(
    //         _treeId,
    //         amount,
    //         planterFund,
    //         referralFund,
    //         treeResearch,
    //         localDevelop,
    //         rescueFund,
    //         treejerDevelop,
    //         reserveFund1,
    //         reserveFund2
    //     );

    //     treeFactory.updateOwner(_treeId, _msgSender(), 1);

    //     emit IncrementalTreeSold(_treeId, _msgSender(), amount);
    // }

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

    function _buy(uint256 _localLastSold, uint256 _treePrice) private {
        (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        ) = financialModel.findTreeDistribution(_localLastSold);

        wethFunds.fundTree(
            _localLastSold,
            _treePrice,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

        treeFactory.updateOwner(_localLastSold, _msgSender(), 1);

        emit IncrementalTreeSold(_localLastSold, _msgSender(), _treePrice);
    }
}
