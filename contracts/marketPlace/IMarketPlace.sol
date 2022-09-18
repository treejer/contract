// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title MarketPlace interface */
interface IMarketPlace {
    function isMarketPlace() external view returns (bool);

    function updateModel(address _sender, uint256 _modelMetaDataId)
        external
        returns (uint256);

    function checkOwnerAndLastPlant(address _sender, uint256 _modelMetaDataId)
        external;
}
