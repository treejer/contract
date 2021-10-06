// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../tree/Tree.sol";

contract TestTree2 {
    mapping(address => uint256) public test;

    function rank1(address _funder) external {
        test[_funder] = 501;
    }

    function rank2(address _funder) external {
        test[_funder] = 2001;
    }

    function rank3(address _funder) external {
        test[_funder] = 10001;
    }

    function balanceOf(address _funder) external view returns (uint256) {
        return test[_funder];
    }
}
