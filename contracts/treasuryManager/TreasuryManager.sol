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
    uint256 constant MAX_UINT256 = 2**256 - 1;

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

    event DistributionModelOfTreeNotExist(string description);
    event FundDistributionModelAssigned(
        uint256 startingTreeId,
        uint256 endingTreeId,
        uint256 distributionModelId
    );
    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);
    event GbBalanceWithdrawn(uint256 amount, address account, string reason);
    event TreeResearchBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event LocalDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event RescueBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event TreejerDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event OtherBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );
    event OtherBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );

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
                _otherFund2,
                _add(
                    _otherFund1,
                    _add(
                        _treejerDevelop,
                        _add(
                            _rescueFund,
                            _add(
                                _localDevelop,
                                _add(_treeResearch, _add(_planter, _referral))
                            )
                        )
                    )
                )
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

    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external onlyAdmin {
        require(
            fundDistributions[_distributionModelId].planterFund > 0,
            "Distribution model not found"
        );

        AssignModel[] storage localAssigns = assignModels;

        delete assignModels;

        uint256 checkFlag = 0;

        for (uint256 i = 0; i < localAssigns.length; i++) {
            if (localAssigns[i].startingTreeId < _startTreeId) {
                assignModels.push(localAssigns[i]);
            } else {
                if (checkFlag == 0) {
                    assignModels.push(
                        AssignModel(_startTreeId, _distributionModelId)
                    );
                    checkFlag = 1;
                }
                if (checkFlag == 1) {
                    if (_endTreeId == 0 && _startTreeId != 0) {
                        checkFlag = 5;
                        break;
                    }
                    if (
                        i > 0 &&
                        _endTreeId.add(1) < localAssigns[i].startingTreeId
                    ) {
                        assignModels.push(
                            AssignModel(
                                _endTreeId.add(1),
                                localAssigns[i.sub(1)].distributionModelId
                            )
                        );
                        checkFlag = 2;
                    }
                }
                if (checkFlag == 2) {
                    assignModels.push(localAssigns[i]);
                }
            }
        }

        if (checkFlag == 5) {
            maxAssignedIndex = MAX_UINT256;
        } else if (checkFlag == 0) {
            assignModels.push(AssignModel(_startTreeId, _distributionModelId));
            checkFlag = 1;
        }

        if (checkFlag == 1) {
            if (maxAssignedIndex < _endTreeId) {
                maxAssignedIndex = _endTreeId;
            } else {
                assignModels.push(
                    AssignModel(
                        _endTreeId.add(1),
                        localAssigns[localAssigns.length.sub(1)]
                            .distributionModelId
                    )
                );
            }
        }

        emit FundDistributionModelAssigned(
            _startTreeId,
            _endTreeId,
            _distributionModelId
        );
    }

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
            emit PlanterFunded(_treeId, _planterId, totalPayablePlanter);
        }
    }

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool)
    {
        accessRestriction.ifAuction(msg.sender);
        return
            _treeId >= assignModels[0].startingTreeId &&
            _treeId <= maxAssignedIndex;
    } //check in add auction

    function withdrawGb(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (gbFundAddress.send(_amount)) {
            emit GbBalanceWithdrawn(_amount, gbFundAddress, _reason);
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawTreeResearch(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (treeResearchAddress.send(_amount)) {
            emit TreeResearchBalanceWithdrawn(
                _amount,
                treeResearchAddress,
                _reason
            );
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawLocalDevelop(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (localDevelopAddress.send(_amount)) {
            emit LocalDevelopBalanceWithdrawn(
                _amount,
                localDevelopAddress,
                _reason
            );
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawRescueFund(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (rescueFundAddress.send(_amount)) {
            emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawTreejerDevelop(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (treejerDevelopAddress.send(_amount)) {
            emit TreejerDevelopBalanceWithdrawn(
                _amount,
                treejerDevelopAddress,
                _reason
            );
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawOtherFund1(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (otherFundAddress1.send(_amount)) {
            emit OtherBalanceWithdrawn1(_amount, otherFundAddress1, _reason);
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawOtherFund2(uint256 _amount, string memory _reason)
        external
        onlyAdmin
    {
        require(_amount <= totalFunds.treejerDevelop, "insufficient amount");
        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);
        if (otherFundAddress2.send(_amount)) {
            emit OtherBalanceWithdrawn2(_amount, otherFundAddress2, _reason);
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawPlanterBalance(uint256 _amount) external {
        accessRestriction.ifPlanter(msg.sender);
        require(_amount <= balances[msg.sender], "insufficient amount");
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        if (!msg.sender.send(_amount)) {
            balances[msg.sender] = balances[msg.sender].add(_amount);
        } else {
            emit PlanterBalanceWithdrawn(_amount, msg.sender);
        }
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
            emit DistributionModelOfTreeNotExist(
                "there is no assigned values for this treeId"
            );
        }
        return i;
    }

    function _add(uint16 a, uint16 b) private pure returns (uint16) {
        uint16 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}
