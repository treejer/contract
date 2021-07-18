//SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";

contract RegularSell is Initializable {
    uint256 lastSoldRegularTree;
    uint256 treePrice;

    bool public isRegularSell;
    IAccessRestriction public accessRestriction;

    modifier onlyAdmin {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isRegularSell = true;
        accessRestriction = candidateContract;
    }

    function setPrice(uint256 _price) external onlyAdmin {
        treePrice = _price;
    }
}
