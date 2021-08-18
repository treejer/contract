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
    mapping(address => uint256) public lastBuy;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
    event IncrementalSellUpdated();
    event IncrementalRatesUpdated();

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isIncrementalSell
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) public initializer {
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
    function setTrustedForwarder(address _address) external onlyAdmin {
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
    function setWethTokenAddress(address _address) external onlyAdmin {
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
    ) external onlyAdmin {
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

        emit IncrementalSellUpdated();
    }

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param _treeCount number of trees added at the end of the incremental sell
     * tree range
     */
    function updateIncrementalEnd(uint256 _treeCount) external onlyAdmin {
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

    /**
     * tree price calculate based on treeId and msg.sender pay weth for it
     * and ownership of tree transfered to msg.sender
     * @param _treeId id of tree to buy
     * NOTE if buyer, buy another tree before 700 seconds from the
     * previous purchase, pays 90% of tree price and gets 10% discount
     * just for this tree. buying another tree give chance to buy
     * the next tree with 10% discount
     */
    function buyTree(uint256 _treeId) external ifNotPaused {
        //check if _treeId is in this incrementalSell
        IncrementalPrice storage incPrice = incrementalPrice;

        require(
            _treeId < incPrice.endTree && _treeId >= incPrice.startTree,
            "tree is not in incremental sell"
        );

        //calc tree price based on treeId
        uint256 steps = (_treeId - incPrice.startTree) / incPrice.increaseStep;
        uint256 treePrice = incPrice.initialPrice +
            (steps * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

        uint256 amount;

        //checking price paid is enough for buying the treeId checking discounts
        if (lastBuy[_msgSender()] > block.timestamp - 700 seconds) {
            amount = (treePrice * 90) / 100;
            require(
                wethToken.balanceOf(_msgSender()) >= amount,
                "low price paid"
            );

            wethToken.transferFrom(_msgSender(), address(wethFunds), amount);

            lastBuy[_msgSender()] = 0;
        } else {
            amount = treePrice;

            require(
                wethToken.balanceOf(_msgSender()) >= amount,
                "low price paid"
            );

            wethToken.transferFrom(_msgSender(), address(wethFunds), amount);

            lastBuy[_msgSender()] = block.timestamp;
        }

        (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        ) = financialModel.findTreeDistribution(_treeId);

        wethFunds.fundTree(
            _treeId,
            amount,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

        treeFactory.updateOwner(_treeId, _msgSender(), 1);

        emit IncrementalTreeSold(_treeId, _msgSender(), amount);
    }

    //TODO: COMMENT_ADD
    function updateIncrementalRates(
        uint256 _initialPrice,
        uint64 _increaseStep,
        uint64 _increaseRatio
    ) external onlyAdmin {
        require(_increaseStep > 0, "incremental period should be positive");

        IncrementalPrice storage incrPrice = incrementalPrice;

        incrPrice.initialPrice = _initialPrice;
        incrPrice.increaseStep = _increaseStep;
        incrPrice.increaseRatio = _increaseRatio;

        emit IncrementalRatesUpdated();
    }
}
