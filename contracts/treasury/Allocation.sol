// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";

pragma abicoder v2;

/** @title Allocation Contract */

contract Allocation is Initializable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private allocationCount;

    uint256 constant MAX_UINT256 = type(uint256).max;

    /** NOTE {isAllocation} set inside the initialize to {true} */
    bool public isAllocation;

    uint256 public maxAssignedIndex;

    IAccessRestriction public accessRestriction;

    struct AllocationData {
        uint16 planterShare;
        uint16 ambassadorShare;
        uint16 researchShare;
        uint16 localDevelopmentShare;
        uint16 insuranceShare;
        uint16 treasuryShare;
        uint16 reserve1Share;
        uint16 reserve2Share;
        uint16 exists;
    }

    struct AllocationToTree {
        uint256 startingTreeId;
        uint256 allocationDataId;
    }

    AllocationToTree[] public allocationToTrees;

    /** NOTE mapping of allocationDataId to AllocationData*/
    mapping(uint256 => AllocationData) public allocations;

    event AllocationDataAdded(uint256 allocationDataId);

    event AllocationToTreeAssigned(uint256 allocationToTreesLength);

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isAllocation
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isAllocation = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin add a model for funding distribution that sum of the
     * inputs must be 10000
     * @param _planterShare planter share
     * @param _ambassadorShare ambassador share
     * @param _researchShare  research share
     * @param _localDevelopmentShare local development share
     * @param _insuranceShare insurance share
     * @param _treasuryShare _treasuryshare
     * @param _reserve1Share reserve1 share
     * @param _reserve2Share reserve2 share
     */
    function addAllocationData(
        uint16 _planterShare,
        uint16 _ambassadorShare,
        uint16 _researchShare,
        uint16 _localDevelopmentShare,
        uint16 _insuranceShare,
        uint16 _treasuryShare,
        uint16 _reserve1Share,
        uint16 _reserve2Share
    ) external onlyDataManager {
        require(
            _planterShare +
                _ambassadorShare +
                _researchShare +
                _localDevelopmentShare +
                _insuranceShare +
                _treasuryShare +
                _reserve1Share +
                _reserve2Share ==
                10000,
            "sum must be 10000"
        );

        allocations[allocationCount.current()] = AllocationData(
            _planterShare,
            _ambassadorShare,
            _researchShare,
            _localDevelopmentShare,
            _insuranceShare,
            _treasuryShare,
            _reserve1Share,
            _reserve2Share,
            1
        );

        emit AllocationDataAdded(allocationCount.current());

        allocationCount.increment();
    }

    /**
     * @dev admin assign a funding distribution model to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _allocationDataId distribution model id to assign
     */
    function assignAllocationToTree(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _allocationDataId
    ) external onlyDataManager {
        require(
            allocations[_allocationDataId].exists > 0,
            "Distribution model not found"
        );

        AllocationToTree[] memory localAllocationToTree = allocationToTrees;

        delete allocationToTrees;

        uint256 checkFlag = 0;

        for (uint256 i = 0; i < localAllocationToTree.length; i++) {
            if (localAllocationToTree[i].startingTreeId < _startTreeId) {
                allocationToTrees.push(localAllocationToTree[i]);
            } else {
                if (checkFlag == 0) {
                    allocationToTrees.push(
                        AllocationToTree(_startTreeId, _allocationDataId)
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
                        _endTreeId + 1 < localAllocationToTree[i].startingTreeId
                    ) {
                        allocationToTrees.push(
                            AllocationToTree(
                                _endTreeId + 1,
                                localAllocationToTree[i - 1].allocationDataId
                            )
                        );
                        checkFlag = 2;
                    }
                }
                if (checkFlag == 2) {
                    allocationToTrees.push(localAllocationToTree[i]);
                }
            }
        }

        if (checkFlag == 0) {
            allocationToTrees.push(
                AllocationToTree(_startTreeId, _allocationDataId)
            );
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
            } else if (localAllocationToTree.length > 0) {
                allocationToTrees.push(
                    AllocationToTree(
                        _endTreeId + 1,
                        localAllocationToTree[localAllocationToTree.length - 1]
                            .allocationDataId
                    )
                );
            }
        }

        emit AllocationToTreeAssigned(allocationToTrees.length);
    }

    /**
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */

    function exists(uint256 _treeId) external view returns (bool) {
        if (allocationToTrees.length == 0) {
            return false;
        }

        return _treeId >= allocationToTrees[0].startingTreeId;
    }

    /**
     * @dev return allocation data of {_treeId}
     * @param _treeId id of tree to find allocation data
     * @return planterShare
     * @return ambassadorShare
     * @return researchShare
     * @return localDevelopmentShare
     * @return insuranceShare
     * @return treasuryShare
     * @return reserve1Share
     * @return reserve2Share
     */
    function findAllocationData(uint256 _treeId)
        external
        view
        returns (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        )
    {
        AllocationData storage allocation;

        for (uint256 i = 0; i < allocationToTrees.length; i++) {
            if (allocationToTrees[i].startingTreeId > _treeId) {
                require(i > 0, "invalid fund model");

                allocation = allocations[
                    allocationToTrees[i - 1].allocationDataId
                ];

                return (
                    allocation.planterShare,
                    allocation.ambassadorShare,
                    allocation.researchShare,
                    allocation.localDevelopmentShare,
                    allocation.insuranceShare,
                    allocation.treasuryShare,
                    allocation.reserve1Share,
                    allocation.reserve2Share
                );
            }
        }

        require(allocationToTrees.length > 0, "invalid fund model");

        allocation = allocations[
            allocationToTrees[allocationToTrees.length - 1].allocationDataId
        ];

        return (
            allocation.planterShare,
            allocation.ambassadorShare,
            allocation.researchShare,
            allocation.localDevelopmentShare,
            allocation.insuranceShare,
            allocation.treasuryShare,
            allocation.reserve1Share,
            allocation.reserve2Share
        );
    }
}
