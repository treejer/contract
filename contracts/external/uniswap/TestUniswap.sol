// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "./interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestUniswap {
    IUniswapV2Router02 public uniswapRouter;

    constructor(address _uniswapRouterAddress) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);
    }

    function addLiquidity(
        address token1,
        address token2,
        uint256 token1Amount,
        uint256 token2Amount
    ) external {
        IERC20(token1).approve(address(uniswapRouter), token1Amount);
        IERC20(token2).approve(address(uniswapRouter), token2Amount);

        uniswapRouter.addLiquidity(
            token1,
            token2,
            token1Amount,
            token2Amount,
            1,
            1,
            address(this),
            block.timestamp + 15
        );
    }
}
