// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../marketPlace/MarketPlace.sol";

contract TestMarketPlace is MarketPlace {


function setLastFunded(uint _modelId,uint _value) external {
models[_modelId].lastFund=_value;


}
function setLastPlanted(uint _modelId,uint _value) external {
models[_modelId].lastPlant=_value;


}

}
