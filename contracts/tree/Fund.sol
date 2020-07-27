// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeSale.sol";
import "./TreeFactory.sol";

contract Fund {
    event TreeBought(
        uint256 saleId,
        uint256 treeId,
        uint256 price,
        address newOwner
    );


    event TreeFunded(
        uint256 treeId,
        uint256 balance
    );

    event C(bool id);

    uint public lastFundedTreeIndex;

    TreeFactory public treeFactory;
    TreeSale public treeSale;


    constructor(TreeFactory _treeFactoryAddress, TreeSale _treeSaleAddress) public {
        treeFactory = _treeFactoryAddress;
        treeSale = _treeSaleAddress;
    }


    function fund(uint _count) external payable {

        // require(types[_typeId].price > 0);
        

        uint balance = msg.value / _count;

        //@todo check for treePrice
        require(balance >= treeFactory.getPrice(), "Balance is not sufficient");

        
        for (uint8 i = 0; i < _count; i++) {
            
            uint256 id = 0;

            emit C(treeFactory.isThereNotFundedTrees());
            // if check for exist tree
            if(treeFactory.isThereNotFundedTrees() == true) {
                id = treeFactory.fundPlantedTress(msg.sender, balance);
            } else {
                id = treeFactory.simpleFund(msg.sender, balance);
            }
            
            emit TreeFunded(id, balance);
        }
        
        //distribute fund
        // (bool sent, bytes memory data) = _to.call.value(msg.value)("");
        // require(sent, "Failed to send Ether");
    } 

}
