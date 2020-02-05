pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeFactory.sol";

contract TreeSale is TreeFactory {
    event TreeAddedToSalesList(uint256 id, uint256 treeId, uint256 price);

    struct SalesList {
        uint256 treeId;
        uint256 price;
    }

    SalesList[] public salesLists;

    function addToSalesList(uint256 _treeId, uint256 _price)
        external
        onlyOwner(treeToOwner[_treeId])
    {
        uint256 id = salesLists.push(SalesList(_treeId, _price)) - 1;

        emit TreeAddedToSalesList(id, _treeId, _price);
    }
}
