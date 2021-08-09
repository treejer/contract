// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "./interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestUniswap {
    IUniswapV2Router02 public uniswapRouter;

    IERC20 public daiToken;
    IERC20 public wethToken;

    address public daiAddress;
    address public wethAddress;

    constructor(
        address _uniswapRouterAddress,
        address _daiAddress,
        address _wethAddress
    ) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouterAddress);

        daiToken = IERC20(_daiAddress);
        wethToken = IERC20(_wethAddress);

        wethAddress = _wethAddress;
        daiAddress = _daiAddress;
    }

    function addLiquidity() external {
        // daiToken.transferFrom(msg.sender, address(this), 10000 * (10**18));
        // wethToken.transferFrom(msg.sender, address(this), 5 * (10**18));

        daiToken.approve(address(uniswapRouter), 250000000 * (10**18));
        wethToken.approve(address(uniswapRouter), 125000 * (10**18));

        uniswapRouter.addLiquidity(
            daiAddress,
            wethAddress,
            250000000 * (10**18),
            125000 * (10**18),
            1,
            1,
            address(this),
            block.timestamp + 15
        );
    }
}
