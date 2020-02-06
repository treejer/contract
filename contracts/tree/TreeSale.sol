pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeFactory.sol";

contract TreeSale is TreeFactory {
    event TreeAddedToSalesList(uint256 id, uint256 treeId, uint256 price);
    event TreeRemovedFromSalesList(uint256 treeId);

    struct SalesList {
        uint256 treeId;
        uint256 price;
    }

    SalesList[] public salesLists;
    uint256[] public salesArray;

    function addToSalesList(uint256 _treeId, uint256 _price)
        external
        onlyOwner(treeToOwner[_treeId])
    {
        uint256 id = salesLists.push(SalesList(_treeId, _price)) - 1;
        salesArray.push(id);

        emit TreeAddedToSalesList(id, _treeId, _price);
    }

    function salesListCount() external view returns (uint256) {
        return salesLists.length;
    }

    function allSalesList() external view returns (uint256[] memory) {
        return salesArray;
    }

    function removeFromSalesList(uint256 _saleId) external {
        require(_saleId <= salesLists.length, "Sale id not exists!");

        for (uint256 i = _saleId; i < salesLists.length - 1; i++) {
            salesLists[i] = salesLists[i + 1];
        }

        salesLists.length--;

        emit TreeRemovedFromSalesList(_saleId);
    }

    function getSaleData(uint256 _saleId)
        external
        view
        returns (uint256 id, uint256 price)
    {
        require(_saleId <= salesLists.length, "Sale id not exists!");

        return (salesLists[_saleId].treeId, salesLists[_saleId].price);
    }

}
