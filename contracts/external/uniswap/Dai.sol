// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "./../../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Dai is ERC20 {
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

    function burnAcc(address _address, uint256 _amount) external {
        _burn(_address, _amount);
    }
}
