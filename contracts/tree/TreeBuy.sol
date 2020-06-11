pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeSale.sol";

contract TreeBuy is TreeSale {
    event TreeBought(
        uint256 saleId,
        uint256 treeId,
        uint256 price,
        address newOwner
    );

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

}
