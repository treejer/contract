// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniSwapMini {
    IERC20 public daiToken;
    IERC20 public wethToken;

    address public daiAddress;
    address public wethAddress;

    uint256 public daiToEther = 2000;

    constructor(address _daiAddress, address _wethAddress) {
        daiToken = IERC20(_daiAddress);
        wethToken = IERC20(_wethAddress);

        wethAddress = _wethAddress;
        daiAddress = _daiAddress;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        uint256[] memory out;
        out = new uint256[](2);

        out = getAmountsOut(amountIn, path);

        require(
            out[1] >= amountOutMin,
            "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
        );

        bool success = wethToken.transferFrom(
            msg.sender,
            address(this),
            amountIn
        );

        require(success, "unsuccessful transfer");

        bool success2 = daiToken.transfer(address(to), amountIn * daiToEther);

        require(success2, "unsuccessful transfer");

        uint256[] memory amount;
        amount = new uint256[](2);

        amount[0] = amountIn;
        amount[1] = amountIn * daiToEther;

        return amount;
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        bool success = wethToken.transferFrom(
            msg.sender,
            address(this),
            amountOut / daiToEther
        );

        require(success, "unsuccessful transfer");

        bool success2 = daiToken.transfer(address(to), amountOut);

        require(success2, "unsuccessful transfer");

        uint256[] memory amount;
        amount = new uint256[](2);

        amount[0] = amountOut / daiToEther;
        amount[1] = amountOut;

        return amount;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        uint256[] memory amount;
        amount = new uint256[](2);

        amount[0] = amountIn;
        amount[1] = amountIn * daiToEther;

        return amount;
    }

    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        uint256[] memory amount;
        amount = new uint256[](2);

        amount[0] = amountOut / daiToEther;
        amount[1] = amountOut;
        return amount;
    }
}
