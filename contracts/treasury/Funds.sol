// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";

/** @title Funds Contract */

contract Funds is Initializable {
    bool public isFunds;
    bytes32 public tokenName;

    IAccessRestriction public accessRestriction;

    TotalFunds public totalFunds;

    address payable public treeResearchAddress;
    address payable public localDevelopAddress;
    address payable public rescueFundAddress;
    address payable public treejerDevelopAddress;
    address payable public reserveFundAddress1;
    address payable public reserveFundAddress2;

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
    }

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isFunds = true;
        accessRestriction = candidateContract;
    }

    function setToken(bytes32 _tokenName) external onlyAdmin {
        tokenName = _tokenName;
    }
}
