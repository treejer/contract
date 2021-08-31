// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./v2-periphery/contracts/UniswapV2Router02.sol";

contract UniswapV2Router02New is UniswapV2Router02 {
    constructor(address _factory, address _WETH)
        public
        UniswapV2Router02(_factory, _WETH)
    {}
}
