//SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";
import "../treasury/ITreasury.sol";

contract RegularSell is Initializable {
    using SafeMathUpgradeable for uint256;

    uint256 public lastSoldRegularTree;
    uint256 public treePrice;

    bool public isRegularSell;
    IAccessRestriction public accessRestriction;
    IGenesisTree public treeFactory;
    IERC20 public daiToken;
    ITreasury public treasury;

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
    }

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        IGenesisTree candidateContract = IGenesisTree(_address);

        require(candidateContract.isGenesisTree());

        treeFactory = candidateContract;
    }

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);

        require(candidateContract.isTreasury());

        treasury = candidateContract;
    }

    function setDaiTokenAddress(address _address) external onlyAdmin {
        IERC20 candidateContract = IERC20(_address);

        daiToken = candidateContract;
    }

    function setPrice(uint256 _price) external onlyAdmin {
        treePrice = _price;
    }

    function requestTrees(uint256 _count) external payable {
        require(_count > 0, "invalid count");

        require(msg.value >= treePrice.mul(_count), "invalid amount");

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
    }

    function requestByTreeId(uint256 _treeId) external payable {
        require(_treeId > lastSoldRegularTree, "invalid tree");
        require(msg.value >= treePrice, "invalid amount");

        treeFactory.requestRegularTree(_treeId, msg.sender);

        treasury.fundTree{value: msg.value}(_treeId);
    }
}
