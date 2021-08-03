// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/ITreasury.sol";

contract IncrementalSell is Initializable {
    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    ITreasury public treasury;
    bool public isIncrementalSell;

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

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);
        require(candidateContract.isTreasury());
        treasury = candidateContract;
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
            treasury.distributionModelExistance(startTree),
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
        IncrementalPrice memory incPrice = incrementalPrice;
        require(
            treeId < incPrice.endTree && treeId >= incPrice.startTree,
            "tree is not in incremental sell"
        );

        address buyer = msg.sender;
        uint256 amount = msg.value;
        //calc tree price based on treeId
        uint256 steps = (treeId - incPrice.startTree) / incPrice.increaseStep;
        uint256 treePrice = incPrice.initialPrice +
            (steps * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

        //checking price paid is enough for buying the treeId checking discounts
        if (lastBuy[buyer] > block.timestamp - 700 seconds) {
            require(amount >= (treePrice * 90) / 100, "low price paid");
            lastBuy[buyer] = 0;
        } else {
            require(amount >= treePrice, "low price paid");
            lastBuy[buyer] = block.timestamp;
        }

        treasury.fundTree{value: amount}(treeId);
        treeFactory.updateOwnerIncremental(treeId, buyer);

        emit IncrementalTreeSold(treeId, buyer, amount);
    }
}
