// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Dai is ERC20 {
    constructor(uint256 initialSupply) public ERC20("Dai", "DAI") {
        _mint(msg.sender, initialSupply);
    }
}