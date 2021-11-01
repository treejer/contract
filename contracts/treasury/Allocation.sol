// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "./IAllocation.sol";

/** @title Allocation Contract */

contract Allocation is Initializable, IAllocation {
    using CountersUpgradeable for CountersUpgradeable.Counter;

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

    CountersUpgradeable.Counter private _allocationCount;

    /** NOTE {isAllocation} set inside the initialize to {true} */
    bool public override isAllocation;
    /** NOTE maximum index assigned */
    uint256 public override maxAssignedIndex;

    IAccessRestriction public accessRestriction;

    /**array of strating tree with specific allocation  */
    AllocationToTree[] public override allocationToTrees;

    /** NOTE mapping of allocationDataId to AllocationData*/
    mapping(uint256 => AllocationData) public override allocations;

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isAllocation
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        override
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
     * @dev admin add a model for allocation data that sum of the
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
    ) external override ifNotPaused onlyDataManager {
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

        allocations[_allocationCount.current()] = AllocationData(
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

        emit AllocationDataAdded(_allocationCount.current());

        _allocationCount.increment();
    }

    /**
     * @dev admin assign a allocation data to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign alloction to
     * @param _endTreeId ending tree id to assign alloction to
     * @param _allocationDataId allocation data id to assign
     */
    function assignAllocationToTree(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _allocationDataId
    ) external override ifNotPaused onlyDataManager {
        require(
            allocations[_allocationDataId].exists > 0,
            "Allocation model not found"
        );

        AllocationToTree[] memory tempAllocationToTree = allocationToTrees;

        delete allocationToTrees;

        uint256 flag = 0;

        for (uint256 i = 0; i < tempAllocationToTree.length; i++) {
            if (tempAllocationToTree[i].startingTreeId < _startTreeId) {
                allocationToTrees.push(tempAllocationToTree[i]);
            } else {
                if (flag == 0) {
                    allocationToTrees.push(
                        AllocationToTree(_startTreeId, _allocationDataId)
                    );
                    flag = 1;
                }
                if (flag == 1) {
                    if (_endTreeId == 0 && _startTreeId != 0) {
                        flag = 5;
                        break;
                    }
                    if (
                        i > 0 &&
                        _endTreeId + 1 < tempAllocationToTree[i].startingTreeId
                    ) {
                        allocationToTrees.push(
                            AllocationToTree(
                                _endTreeId + 1,
                                tempAllocationToTree[i - 1].allocationDataId
                            )
                        );
                        flag = 2;
                    }
                }
                if (flag == 2) {
                    allocationToTrees.push(tempAllocationToTree[i]);
                }
            }
        }

        if (flag == 0) {
            allocationToTrees.push(
                AllocationToTree(_startTreeId, _allocationDataId)
            );
            if (_endTreeId == 0 && _startTreeId != 0) {
                flag = 5;
            } else {
                flag = 1;
            }
        }

        if (flag == 5) {
            maxAssignedIndex = type(uint256).max;
        }

        if (flag == 1) {
            if (maxAssignedIndex < _endTreeId) {
                maxAssignedIndex = _endTreeId;
            } else if (tempAllocationToTree.length > 0) {
                allocationToTrees.push(
                    AllocationToTree(
                        _endTreeId + 1,
                        tempAllocationToTree[tempAllocationToTree.length - 1]
                            .allocationDataId
                    )
                );
            }
        }

        emit AllocationToTreeAssigned(allocationToTrees.length);
    }

    /**
     * @dev check if there is allocation data for {_treeId} or not
     * @param _treeId id of a tree to check if there is a allocation data
     * @return true if allocation data exists for {_treeId} and false otherwise
     */

    function exists(uint256 _treeId) external view override returns (bool) {
        if (allocationToTrees.length == 0) {
            return false;
        }

        return _treeId >= allocationToTrees[0].startingTreeId;
    }

    /**
     * @dev return allocation data
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
        override
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
        AllocationData storage allocationData;

        for (uint256 i = 0; i < allocationToTrees.length; i++) {
            if (allocationToTrees[i].startingTreeId > _treeId) {
                require(i > 0, "invalid fund model");

                allocationData = allocations[
                    allocationToTrees[i - 1].allocationDataId
                ];

                return (
                    allocationData.planterShare,
                    allocationData.ambassadorShare,
                    allocationData.researchShare,
                    allocationData.localDevelopmentShare,
                    allocationData.insuranceShare,
                    allocationData.treasuryShare,
                    allocationData.reserve1Share,
                    allocationData.reserve2Share
                );
            }
        }

        require(allocationToTrees.length > 0, "invalid fund model");

        allocationData = allocations[
            allocationToTrees[allocationToTrees.length - 1].allocationDataId
        ];

        return (
            allocationData.planterShare,
            allocationData.ambassadorShare,
            allocationData.researchShare,
            allocationData.localDevelopmentShare,
            allocationData.insuranceShare,
            allocationData.treasuryShare,
            allocationData.reserve1Share,
            allocationData.reserve2Share
        );
    }
}
