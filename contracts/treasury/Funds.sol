// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";

/** @title Funds Contract */

contract Funds is Initializable {
    bool public isFunds;
    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isFunds = true;
        accessRestriction = candidateContract;
    }
}
