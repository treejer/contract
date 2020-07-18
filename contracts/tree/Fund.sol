pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeSale.sol";

contract Fund is TreeSale {
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

    function buy(uint256 _saleId) external payable {
        require(
            msg.value >= salesLists[_saleId].price,
            "Price less than tree price"
        );
        
        address previosOwner = treeToOwner[salesLists[_saleId].treeId];
        ownerTreeCount[previosOwner]--;

        treeToOwner[salesLists[_saleId].treeId] = msg.sender;
        ownerTreeCount[msg.sender]++;

        trees[salesLists[_saleId].treeId].balance = msg.value;

        //distribute fund
        // (bool sent, bytes memory data) = _to.call.value(msg.value)("");
        // require(sent, "Failed to send Ether");

        emit TreeBought(
            _saleId,
            salesLists[_saleId].treeId,
            salesLists[_saleId].price,
            msg.sender
        );

        removeFromSalesList(_saleId);
    }


    function fund(uint8 _typeId, uint _count) external payable {

        // require(types[_typeId].price > 0);
        

        uint balance = msg.value / _count;

        //@todo check for treePrice
        // if(types[_typeId].price >= )

        
        for (uint8 i = 0; i < _count; i++) {

            string memory _name = string('types name trees.length');

            // if check for exist tree


            // else
            uint256 id = trees.push(
            Tree(
                _name,
                '',
                '',
                0,
                0,
                now,
                0,
                0,
                balance
                )
            ) - 1;
            
            treeToType[id] = _typeId;
            typeTreeCount[_typeId]++;

            treeToOwner[id] = msg.sender;
            ownerTreeCount[msg.sender]++;

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
