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
        string name,
        uint256 balance
    );

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
        // if(types[_typeId].price >= )

        
        for (uint8 i = 0; i < _count; i++) {

            string memory _name = string('types name trees.length');

            // if check for exist tree

            // else
            uint256 id = treeFactory.simpleFund(msg.sender, balance);
            
            emit TreeFunded(
                id,
                _name,
                balance
            );

        }
        
        //distribute fund
        // (bool sent, bytes memory data) = _to.call.value(msg.value)("");
        // require(sent, "Failed to send Ether");
    } 

}
