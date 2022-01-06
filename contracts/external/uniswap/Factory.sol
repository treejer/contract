// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./v2-core/contracts/UniswapV2Factory.sol";

contract Factory is UniswapV2Factory {
    constructor(address _feeToSetter) public UniswapV2Factory(_feeToSetter) {}
}
