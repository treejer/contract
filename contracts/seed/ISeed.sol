// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

interface ISeed is IERC20 {

    function isSeed() external view returns(bool);

    function mint(address _to, uint256 _amount) external;

}