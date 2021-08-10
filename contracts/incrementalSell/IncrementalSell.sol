// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/ITreasury.sol";
import "../treasury/IWethFunds.sol";
import "../treasury/IFinancialModel.sol";

contract IncrementalSell is Initializable {
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

    IncrementalPrice public incrementalPrice;

    mapping(address => uint256) public lastBuy;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
    event IncrementalSellUpdated();

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isIncrementalSell = true;
        accessRestriction = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /** @dev set wethFunds contract address
     * @param _address wethFunds contract address
     */
    function setWethFundsAddress(address _address) external onlyAdmin {
        IWethFunds candidateContract = IWethFunds(_address);

        require(candidateContract.isWethFunds());

        wethFunds = candidateContract;
    }

    /** @dev set wethToken contract address
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

    function addTreeSells(
        uint256 startTree,
        uint256 initialPrice,
        uint64 treeCount,
        uint64 steps,
        uint64 incrementRate
    ) external onlyAdmin {
        require(treeCount > 0, "assign at least one tree");
        require(startTree > 100, "trees are under Auction");
        require(steps > 0, "incremental period should be positive");
        require(
            financialModel.distributionModelExistance(startTree),
            "equivalant fund Model not exists"
        );
        IncrementalPrice storage incrPrice = incrementalPrice;

        if (incrPrice.increaseStep > 0) {
            treeFactory.bulkRevert(incrPrice.startTree, incrPrice.endTree);
        }

        require(
            treeFactory.bulkAvailability(startTree, startTree + treeCount),
            "trees are not available for sell"
        );

        incrPrice.startTree = startTree;
        incrPrice.endTree = startTree + treeCount;
        incrPrice.initialPrice = initialPrice;
        incrPrice.increaseStep = steps;
        incrPrice.increaseRatio = incrementRate;

        emit IncrementalSellUpdated();
    }

    function updateIncrementalEnd(uint256 treeCount) external onlyAdmin {
        IncrementalPrice storage incrPrice = incrementalPrice;
        require(
            incrPrice.increaseStep > 0,
            "incremental period should be positive"
        );
        require(
            treeFactory.bulkAvailability(
                incrPrice.endTree,
                incrPrice.endTree + treeCount
            ),
            "trees are not available for sell"
        );
        incrPrice.endTree = incrPrice.endTree + treeCount;

        emit IncrementalSellUpdated();
    }

    function buyTree(uint256 treeId) external payable ifNotPaused {
        //check if treeId is in this incrementalSell
        IncrementalPrice storage incPrice = incrementalPrice;

        require(
            treeId < incPrice.endTree && treeId >= incPrice.startTree,
            "tree is not in incremental sell"
        );

        //calc tree price based on treeId
        uint256 steps = (treeId - incPrice.startTree) / incPrice.increaseStep;
        uint256 treePrice = incPrice.initialPrice +
            (steps * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

        uint256 amount;

        //checking price paid is enough for buying the treeId checking discounts
        if (lastBuy[msg.sender] > block.timestamp - 700 seconds) {
            require(
                wethToken.balanceOf(msg.sender) >= (treePrice * 90) / 100,
                "low price paid"
            );

            amount = (treePrice * 90) / 100;

            wethToken.transferFrom(msg.sender, address(wethFunds), amount);

            lastBuy[msg.sender] = 0;
        } else {
            require(
                wethToken.balanceOf(msg.sender) >= treePrice,
                "low price paid"
            );

            amount = treePrice;

            wethToken.transferFrom(msg.sender, address(wethFunds), amount);

            lastBuy[msg.sender] = block.timestamp;
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
        ) = financialModel.findTreeDistribution(treeId);

        wethFunds.fundTree(
            treeId,
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

        treeFactory.updateOwner(treeId, msg.sender, 1);

        emit IncrementalTreeSold(treeId, msg.sender, amount);
    }
}
