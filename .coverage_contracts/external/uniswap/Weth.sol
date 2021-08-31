// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Weth is ERC20 {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        _mint(msg.sender, 10000 * (10**18));
    }

    function getApprove(address _address) external {
        approve(_address, 10000 * (10**18));
    }

    function setMint(address _address, uint256 _amount) external {
        _mint(_address, _amount);
    }
}
