// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

contract FakeToken {
    function transfer(address _address, uint256 _amount)
        external
        returns (bool)
    {
        return false;
    }

    function approve(address _address, uint256 _amount)
        external
        returns (bool)
    {
        return false;
    }

    function balanceOf(address _address) external returns (uint256) {
        return type(uint256).max;
    }

    function transferFrom(
        address _address,
        address _address2,
        uint256 _amount
    ) external returns (bool) {
        return false;
    }
}
