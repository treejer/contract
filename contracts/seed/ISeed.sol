// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ISeed is IERC20Upgradeable {

    function isSeed() external view returns(bool);

    function mint(address _to, uint256 _amount) external;

}