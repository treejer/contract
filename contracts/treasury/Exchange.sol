// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";

/** @title Exchange Contract */

contract Exchange is Initializable {
    bool public isExchange;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;

    mapping(bytes32 => address) symbolContracts; // symbol => contractAddress
    mapping(address => bytes32) contractSymbol; // contractAddress => symbol

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isExchange = true;
        accessRestriction = candidateContract;
    }

    function setPlanterFundContractAddress(address _address)
        external
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    function setSymbolContracts(bytes32 _tokenSymbol, address _contractAddress)
        external
        onlyAdmin
    {
        symbolContracts[_tokenSymbol] = _contractAddress;
        contractSymbol[_contractAddress] = _tokenSymbol;
    }
}
