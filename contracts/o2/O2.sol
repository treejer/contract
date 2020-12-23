// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/IAccessRestriction.sol";

contract O2 is ERC20UpgradeSafe {
    bool public isO2;
    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isO2 = true;
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20UpgradeSafe.__ERC20_init("Oxygen", "O2");
    }

    function mint(address _to, uint256 _amount) external {
        accessRestriction.ifO2Factory(msg.sender);
        _mint(_to, _amount);
    }
}
