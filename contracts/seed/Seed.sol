// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "../access/IAccessRestriction.sol";

contract Seed is ERC20Upgradeable {
    bool public isSeed;
    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isSeed = true;
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20Upgradeable.__ERC20_init("Seed", "SEED");
    }

    function mint(address _to, uint256 _amount) external {
        accessRestriction.ifSeedFactory(msg.sender);
        _mint(_to, _amount);
    }
}
