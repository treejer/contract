// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeSale.sol";
import "./TreeFactory.sol";
import "../greenblock/GBFactory.sol";
import "../access/AccessRestriction.sol";

contract Fund is AccessRestriction {
    event TreeBought(
        uint256 saleId,
        uint256 treeId,
        uint256 price,
        address newOwner
    );


    event TreeFunded(
        uint256 treeId,
        uint256 balance,
        address owner
    );

    uint public lastFundedTreeIndex;

    TreeFactory public treeFactory;
    TreeSale public treeSale;
    GBFactory public gbFactory;


    uint constant treejerPercentage = 25;
    uint constant planterPercentage = 40;
    uint constant ambassadorPercentage = 5;
    uint constant localDevelopmentFundPercentage = 15;
    uint constant rescueFundPercentage = 10;
    uint constant researchFundPercentage = 5;

    uint8 constant treejerIndex = 0;
    uint8 constant planterIndex = 1;
    uint8 constant ambassadorIndex = 2;
    uint8 constant localDevelopmentFundIndex = 3;
    uint8 constant rescueFundIndex = 4;
    uint8 constant researchFundIndex = 5;

    uint[6] public balances;


    constructor(TreeFactory _treeFactoryAddress, TreeSale _treeSaleAddress) public {
        treeFactory = _treeFactoryAddress;
        treeSale = _treeSaleAddress;
    }

    function setGBAddress(address _address) external onlyAdmin {
        GBFactory candidateContract = GBFactory(_address);

        require(candidateContract.isGBFactory());

        // Set the new contract address
        gbFactory = candidateContract;
    }



    function fund(uint _count) external payable {

        uint balance = msg.value / _count;

        //@todo check for treePrice
        require(balance >= treeFactory.getPrice(), "Balance is not sufficient");

        
        for (uint8 i = 0; i < _count; i++) {
            
            uint256 id = 0;
            uint treeBalance = _calculateBalance(planterPercentage, balance);
            bool hasAmbasador = false;

            if(treeFactory.notFundedTreesExists() == true) {

                id = treeFactory.getLastNotFundedTreeId();
                uint gbId = treeFactory.getTreeGB(id);
                address gbAmbassador = gbFactory.getGBAmbassador(gbId);
                
                if(gbAmbassador != address(0)){
                    hasAmbasador = true;
                    treeBalance = treeBalance + _calculateBalance(ambassadorPercentage, balance);
                }

                id = treeFactory.fundPlantedTress(msg.sender, treeBalance);
            } else {

                id = treeFactory.simpleFund(msg.sender, treeBalance);
            }

            _updateBalances(balance, hasAmbasador);
            
            emit TreeFunded(id, treeBalance, msg.sender);
        }
        
        //distribute fund
        // (bool sent, bytes memory data) = _to.call.value(msg.value)("");
        // require(sent, "Failed to send Ether");
    } 
    
    function _calculateBalance(uint _percentage, uint256 _balance) private pure returns(uint256) {
        return _balance * _percentage / 100;
    } 

    function _updateBalances(uint _balance, bool _hasAmbasador) private {

        uint localDevelopmentFundBalance = _calculateBalance(localDevelopmentFundPercentage, _balance);
        uint ambassadorBalance = _calculateBalance(ambassadorPercentage, _balance);
        if(_hasAmbasador == false) {
            ambassadorBalance = 0;
            localDevelopmentFundBalance = localDevelopmentFundBalance + ambassadorBalance;
        }

        balances = [
            balances[0] + _calculateBalance(treejerPercentage, _balance),
            balances[1] + _calculateBalance(planterPercentage, _balance),
            balances[2] + ambassadorBalance,
            balances[3] + localDevelopmentFundBalance,
            balances[4] + _calculateBalance(rescueFundPercentage, _balance),
            balances[5] + _calculateBalance(researchFundPercentage, _balance)
        ];
    }

    function getBalances() external view returns(uint256[6] memory) {
        return balances;
    }

    // function withdraw(type name)  {
        
    // }

}
