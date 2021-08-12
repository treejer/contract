// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

interface IIncrementalSell {
    function isIncrementalSell() external view returns (bool);

    function accessRestriction() external view returns (address);

    function treeFactory() external view returns (address);

    function wethFunds() external view returns (address);

    function financialModel() external view returns (address);

    function wethToken() external view returns (address);

    function incrementalPrice()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint64,
            uint64
        );

    function lastBuy(address _buyer) external view returns (uint256);

    function setTrustedForwarder(address _address) external;

    function setTreeFactoryAddress(address _address) external;

    function setWethFundsAddress(address _address) external;

    function setWethTokenAddress(address _address) external;

    function setFinancialModelAddress(address _address) external;

    function addTreeSells(
        uint256 startTree,
        uint256 initialPrice,
        uint64 treeCount,
        uint64 steps,
        uint64 incrementRate
    ) external;

    function updateIncrementalEnd(uint256 treeCount) external;

    function buyTree(uint256 treeId) external;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
    event IncrementalSellUpdated();
}
