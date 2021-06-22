// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";

contract TreasuryManager is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeMathUpgradeable for uint16;

    CountersUpgradeable.Counter private fundDistributionCount;
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

    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _otherFund1,
        uint16 _otherFund2
    ) external onlyAdmin {
        require(
            _add(
                _add(
                    _add(
                        _add(
                            _add(
                                _add(_add(_planter, _referral), _treeResearch),
                                _localDevelop
                            ),
                            _rescueFund
                        ),
                        _treejerDevelop
                    ),
                    _otherFund1
                ),
                _otherFund2
            ) == 10000,
            "sum must be 10000"
        );

        fundDistributions[fundDistributionCount.current()] = FundDistribution(
            _planter,
            _referral,
            _treeResearch,
            _localDevelop,
            _rescueFund,
            _treejerDevelop,
            _otherFund1,
            _otherFund2
        );

        fundDistributionCount.increment();
    }

    function assignTreeFundDistributionModel() external onlyAdmin {}

    function fundTree() external {}

    function _findTreeDistributionModelId() private {}

    function fundPlanter() external {}

    function withdrawTreejerDevelop() external {}

    function _add(uint16 a, uint16 b) private pure returns (uint16) {
        uint16 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}
