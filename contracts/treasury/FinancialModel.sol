// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";

pragma abicoder v2;

/** @title FinancialModel Contract */

contract FinancialModel is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private fundDistributionCount;

    uint256 constant MAX_UINT256 = type(uint256).max;
    bool public isFinancialModel;
    uint256 public maxAssignedIndex;

    IAccessRestriction public accessRestriction;

    struct FundDistribution {
        uint16 planterFund;
        uint16 referralFund;
        uint16 treeResearch;
        uint16 localDevelop;
        uint16 rescueFund;
        uint16 treejerDevelop;
        uint16 reserveFund1;
        uint16 reserveFund2;
        uint16 exists;
    }

    struct AssignModel {
        uint256 startingTreeId;
        uint256 distributionModelId;
    }

    AssignModel[] public assignModels;

    mapping(uint256 => FundDistribution) public fundDistributions;

    event DistributionModelAdded(uint256 modelId);

    event FundDistributionModelAssigned(uint256 assignModelsLength);

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isFinancialModel = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin add a model for funding distribution that sum of the inputs must be 10000
     * @param _planter planter share
     * @param _referral referral share
     * @param _treeResearch tree research share
     * @param _localDevelop local develop share
     * @param _rescueFund rescue share
     * @param _treejerDevelop treejer develop share
     * @param _reserveFund1 other fund1 share
     * @param _reserveFund2 other fund2 share
     */
    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external onlyAdmin {
        require(
            _planter +
                _referral +
                _treeResearch +
                _localDevelop +
                _rescueFund +
                _treejerDevelop +
                _reserveFund1 +
                _reserveFund2 ==
                10000,
            "sum must be 10000"
        );

        fundDistributions[fundDistributionCount.current()] = FundDistribution(
            _planter,
            _referral,
            _treeResearch,
            _localDevelop,
            _rescueFund,
            _treejerDevelop,
            _reserveFund1,
            _reserveFund2,
            1
        );

        emit DistributionModelAdded(fundDistributionCount.current());

        fundDistributionCount.increment();
    }

    /**
     * @dev admin assgign a funding distribution model to trees start from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _distributionModelId distribution model id to assign
     */
    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external onlyAdmin {
        require(
            fundDistributions[_distributionModelId].exists > 0,
            "Distribution model not found"
        );

        AssignModel[] memory localAssigns = assignModels;

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
                        i > 0 && _endTreeId + 1 < localAssigns[i].startingTreeId
                    ) {
                        assignModels.push(
                            AssignModel(
                                _endTreeId + 1,
                                localAssigns[i - 1].distributionModelId
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

        if (checkFlag == 0) {
            assignModels.push(AssignModel(_startTreeId, _distributionModelId));
            if (_endTreeId == 0 && _startTreeId != 0) {
                checkFlag = 5;
            } else {
                checkFlag = 1;
            }
        }

        if (checkFlag == 5) {
            maxAssignedIndex = MAX_UINT256;
        }

        if (checkFlag == 1) {
            if (maxAssignedIndex < _endTreeId) {
                maxAssignedIndex = _endTreeId;
            } else if (localAssigns.length > 0) {
                assignModels.push(
                    AssignModel(
                        _endTreeId + 1,
                        localAssigns[localAssigns.length - 1]
                            .distributionModelId
                    )
                );
            }
        }

        emit FundDistributionModelAssigned(assignModels.length);
    }

    /**
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool)
    {
        if (assignModels.length == 0) {
            return false;
        }

        return _treeId >= assignModels[0].startingTreeId;
    }

    /**
     * @dev private function to find index of assignModels to {_treeId}
     * @param _treeId id of tree to find assignModels of it
     */
    function findTreeDistribution(uint256 _treeId)
        external
        view
        returns (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        )
    {
        uint256 i = 0;

        FundDistribution storage fundDistribution;

        for (i; i < assignModels.length; i++) {
            if (assignModels[i].startingTreeId > _treeId) {
                require(i > 0, "invalid fund model");

                fundDistribution = fundDistributions[
                    assignModels[i - 1].distributionModelId
                ];

                return (
                    fundDistribution.planterFund,
                    fundDistribution.referralFund,
                    fundDistribution.treeResearch,
                    fundDistribution.localDevelop,
                    fundDistribution.rescueFund,
                    fundDistribution.treejerDevelop,
                    fundDistribution.reserveFund1,
                    fundDistribution.reserveFund2
                );
            }
        }

        require(i > 0, "invalid fund model");

        fundDistribution = fundDistributions[
            assignModels[i - 1].distributionModelId
        ];

        return (
            fundDistribution.planterFund,
            fundDistribution.referralFund,
            fundDistribution.treeResearch,
            fundDistribution.localDevelop,
            fundDistribution.rescueFund,
            fundDistribution.treejerDevelop,
            fundDistribution.reserveFund1,
            fundDistribution.reserveFund2
        );
    }
}
