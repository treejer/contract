// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";

contract TreasuryManager is Initializable {
    bool public isTreasuryManager;
    AssignModel[] public assignModels;
    uint256 public maxAssignedIndex;
    IAccessRestriction public accessRestriction;

    struct FundDistribution {
        uint16 planterFund;
        uint16 gbFund;
        uint16 treeResearch;
        uint16 localDevelop;
        uint16 rescueFund;
        uint16 treejerDevelop;
        uint16 OtherFund1;
        uint16 otherFund2;
    }

    struct TotalFunds {
        uint256 planterFund;
        uint256 gbFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 otherFund1;
        uint256 otherFund2;
    }

    struct AssignModel {
        uint256 startingTreeId;
        uint256 distributionModelId;
    }

    mapping(uint256 => FundDistribution) public fundDistributions;
    mapping(uint256 => uint256) public planterFunds;
    mapping(uint256 => uint256) public plantersPaid;
    mapping(address => uint256) public balances;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isTreasuryManager = true;
        accessRestriction = candidateContract;
    }

    function addFundDistributionModel() external onlyAdmin {}

    function assignTreeFundDistributionModel() external onlyAdmin {}

    function fundTree() external {}

    function _findTreeDistributionModelId() private {}

    function fundPlanter() external {}

    function withdrawTreejerDevelop() external {}
}
