// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IO2 is IERC20Upgradeable {

    function isO2() external view returns(bool);

    function mint(address _to, uint256 _amount) external;

}