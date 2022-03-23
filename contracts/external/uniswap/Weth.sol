// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Weth is ERC20 {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        _mint(msg.sender, 10000 * (10**18));
    }

    event  Deposit(address indexed dst, uint wad);

    function getApprove(address _address) external {
        approve(_address, 10000 * (10**18));
    }

    function setMint(address _address, uint256 _amount) external {
        _mint(_address, _amount);
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function setApprove(
        address _sender,
        address _spender,
        uint256 _amount
    ) external {
        _approve(_sender, _spender, _amount);
    }

    function resetAcc(address _address) external {
        uint256 amount = balanceOf(_address);
        _burn(_address, amount);
    }
}
