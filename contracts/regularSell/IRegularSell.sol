//SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IRegularSell {
    function isRegularSell() external view returns (bool);

    function lastSoldRegularTree() external view returns (uint256);

    function treePrice() external view returns (uint256);

    function setTreeFactoryAddress(address _address) external;

    function setTreasuryAddress(address _address) external;

    function setPrice(uint256 _price) external;

    function requestTrees(uint256 _count) external payable;

    function requestByTreeId(uint256 _treeId) external payable;

    event TreePriceUpdated(uint256 price);
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );
}
