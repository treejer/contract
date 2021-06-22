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
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint16;

    CountersUpgradeable.Counter private fundDistributionCount;
    bool public isTreasuryManager;
    AssignModel[] public assignModels;
    uint256 public maxAssignedIndex;
    IAccessRestriction public accessRestriction;

    address payable gbFundAddress;
    address payable treeResearchAddress;
    address payable localDevelopAddress;
    address payable rescueFundAddress;
    address payable treejerDevelopAddress;
    address payable otherFundAddress1;
    address payable otherFundAddress2;

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

    TotalFunds public totalFunds = TotalFunds(0, 0, 0, 0, 0, 0, 0, 0);

    event Event1(string description);
    event TreejerWithdraw(string title, uint256 amount, string reason);

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }
    modifier onlyAuction() {
        accessRestriction.ifAuction(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        isTreasuryManager = true;
        accessRestriction = candidateContract;
    }

    function setGbFundAddress(address payable _address) external onlyAdmin {
        gbFundAddress = _address;
    }

    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
    {
        treeResearchAddress = _address;
    }

    function setLocalDevelopAddress(address payable _address)
        external
        onlyAdmin
    {
        localDevelopAddress = _address;
    }

    function setRescueFundAddress(address payable _address) external onlyAdmin {
        rescueFundAddress = _address;
    }

    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
    {
        treejerDevelopAddress = _address;
    }

    function setOtherFund1(address payable _address) external onlyAdmin {
        otherFundAddress1 = _address;
    }

    function setOtherFund2(address payable _address) external onlyAdmin {
        otherFundAddress2 = _address;
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

    function fundTree(uint256 _treeId, uint256 _amount) external {
        require(accessRestriction.isAuction(msg.sender));
        FundDistribution memory dm =
            fundDistributions[
                assignModels[_findTreeDistributionModelId(_treeId)]
                    .distributionModelId
            ];
        planterFunds[_treeId] = _amount.mul(dm.planterFund).div(1000);
        totalFunds.gbFund = totalFunds.gbFund.add(
            _amount.mul(dm.gbFund).div(1000)
        );
        totalFunds.localDevelop = totalFunds.localDevelop.add(
            _amount.mul(dm.localDevelop).div(1000)
        );
        totalFunds.otherFund1 = totalFunds.otherFund1.add(
            _amount.mul(dm.OtherFund1).div(1000)
        );
        totalFunds.otherFund2 = totalFunds.otherFund2.add(
            _amount.mul(dm.otherFund2).div(1000)
        );
        totalFunds.planterFund = totalFunds.planterFund.add(
            _amount.mul(dm.planterFund).div(1000)
        );
        totalFunds.rescueFund = totalFunds.rescueFund.add(
            _amount.mul(dm.rescueFund).div(1000)
        );
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(
            _amount.mul(dm.treejerDevelop).div(1000)
        );
        totalFunds.treeResearch = totalFunds.treeResearch.add(
            _amount.mul(dm.treeResearch).div(1000)
        );
    }

    function _findTreeDistributionModelId(uint256 _treeId)
        private
        returns (uint256)
    {
        uint256 i = 0;
        for (i; i < assignModels.length; i++) {
            if (assignModels[i].startingTreeId > _treeId) {
                require(i.sub(1) >= 0, "invalid fund model");
                return i.sub(1);
            }
        }
        if (_treeId > maxAssignedIndex) {
            emit Event1("there is no assigned values for this treeId");
        }
        return i;
    }

    function fundPlanter(
        uint256 _treeId,
        address payable _planterId,
        uint16 _treeStatus
    ) external {
        accessRestriction.ifGenesisTree(msg.sender);
        require(planterFunds[_treeId] > 0, "planter fund not exist");
        uint256 totalPayablePlanter;
        if (_treeStatus > 25920) {
            //25920 = 30 * 24 * 36
            totalPayablePlanter = planterFunds[_treeId].sub(
                plantersPaid[_treeId]
            );
        } else {
            totalPayablePlanter = planterFunds[_treeId]
                .mul(_treeStatus)
                .div(25920)
                .sub(plantersPaid[_treeId]);
        }
        if (totalPayablePlanter > 0) {
            plantersPaid[_treeId] = plantersPaid[_treeId].add(
                totalPayablePlanter
            );
            balances[_planterId] = balances[_planterId].add(
                totalPayablePlanter
            );
            totalFunds.planterFund = totalFunds.planterFund.sub(
                totalPayablePlanter
            );
        }
    }

    function withdrawTreejerDevelop(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (!treejerDevelopAddress.send(_amount)) {
            emit TreejerWithdraw("treejerDevelop withdraw", _amount, _reason);
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawPlanterBalance(uint256 _amount) external {
        accessRestriction.ifPlanter(msg.sender);
        require(_amount <= balances[msg.sender], "insufficient balance");
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        if (!msg.sender.send(_amount)) {
            balances[msg.sender] = balances[msg.sender].add(_amount);
        }
    }

    function _add(uint16 a, uint16 b) private pure returns (uint16) {
        uint16 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}
