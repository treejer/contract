//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/ITreasury.sol";

/** @title RegularSell contract */
contract RegularSell is Initializable {
    uint256 public lastSoldRegularTree;
    uint256 public treePrice;
    bool public isRegularSell;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    ITreasury public treasury;

    event TreePriceUpdated(uint256 price);
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );

    modifier onlyAdmin {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress, uint256 _price)
        public
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        isRegularSell = true;
        lastSoldRegularTree = 10000;
        treePrice = _price;
        emit TreePriceUpdated(_price);
    }

    /** @dev set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev set treasury contract address
     * @param _address treasury contract address
     */
    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);

        require(candidateContract.isTreasury());

        treasury = candidateContract;
    }

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     */
    function setPrice(uint256 _price) external onlyAdmin {
        treePrice = _price;
        emit TreePriceUpdated(_price);
    }

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     */
    function requestTrees(uint256 _count) external payable {
        require(_count > 0, "invalid count");

        // require(msg.value >= treePrice.mul(_count), "invalid amount");
        require(msg.value >= treePrice * _count, "invalid amount");

        uint256 tempLastRegularSold = lastSoldRegularTree;

        uint256 transferAmount = msg.value / _count;

        for (uint256 i = 0; i < _count; i++) {
            tempLastRegularSold = treeFactory.mintRegularTrees(
                tempLastRegularSold,
                msg.sender
            );

            treasury.fundTree{value: transferAmount}(tempLastRegularSold);
        }

        lastSoldRegularTree = tempLastRegularSold;

        emit RegularTreeRequsted(_count, msg.sender, msg.value);
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     */
    function requestByTreeId(uint256 _treeId) external payable {
        require(_treeId > lastSoldRegularTree, "invalid tree");
        require(msg.value >= treePrice, "invalid amount");

        treeFactory.requestRegularTree(_treeId, msg.sender);

        treasury.fundTree{value: msg.value}(_treeId);

        emit RegularTreeRequstedById(_treeId, msg.sender, msg.value);
    }
}
