// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/AccessRestriction.sol";
import "../tree/TreeFactory.sol";

contract Seed is ERC20UpgradeSafe {
    bool public isSeed;
    AccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isSeed = true;
        AccessRestriction candidateContract =
            AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20UpgradeSafe.__ERC20_init("Seed", "SEED");
    }

    function mint(address _to, uint256 _amount) external {
        accessRestriction.ifSeedFactory(msg.sender);
        _mint(_to, _amount);
    }
}
