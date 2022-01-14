// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title Allocation interfce */
interface IAllocation {
    /**
     * @dev emitted when a AllocationData added
     * @param allocationDataId id of allocationData
     */

    event AllocationDataAdded(uint256 allocationDataId);

    /**
     * @dev emitted when AllocationData assigned to a range of tree
     * @param allocationToTreesLength length of allocationToTrees
     */

    event AllocationToTreeAssigned(uint256 allocationToTreesLength);

    /** return allocationToTrees data (strating tree with specific allocation)
     * for example from startingId of allocationToTrees[0] to startingId of
     * allocationToTrees[1] belong to allocationDataId of allocationToTrees[0]
     * @param _index index of array to get data
     * @return startingTreeId is starting tree with allocationDataId
     * @return allocationDataId for index
     */
    function allocationToTrees(uint256 _index)
        external
        returns (uint256 startingTreeId, uint256 allocationDataId);

    /**
     * @dev admin add a model for allocation data that sum of the
     * inputs must be 10000
     * NOTE emit a {AllocationDataAdded} event
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
    ) external;

    /**
     * @dev admin assign a allocation data to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * NOTE emit a {AllocationToTreeAssigned} event
     * @param _startTreeId strating tree id to assign alloction to
     * @param _endTreeId ending tree id to assign alloction to
     * @param _allocationDataId allocation data id to assign
     */
    function assignAllocationToTree(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _allocationDataId
    ) external;

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
        returns (
            uint16 planterShare,
            uint16 ambassadorShare,
            uint16 researchShare,
            uint16 localDevelopmentShare,
            uint16 insuranceShare,
            uint16 treasuryShare,
            uint16 reserve1Share,
            uint16 reserve2Share
        );

    /**
     * @dev initialize AccessRestriction contract and set true for isAllocation
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true in case of Allocation contract has been initialized
     */
    function isAllocation() external view returns (bool);

    /**
     * @return maxAssignedIndex
     */
    function maxAssignedIndex() external view returns (uint256);

    /** return allocations data
     * @param _allocationDataId id of allocation to get data
     * @return planterShare
     * @return ambassadorShare
     * @return researchShare
     * @return localDevelopmentShare
     * @return insuranceShare
     * @return treasuryShare
     * @return reserve1Share
     * @return reserve2Share
     * @return exists is true when there is a allocations for _allocationDataId
     */
    function allocations(uint256 _allocationDataId)
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
            uint16 reserve2Share,
            uint16 exists
        );

    /**
     * @dev check if there is allocation data for {_treeId} or not
     * @param _treeId id of a tree to check if there is a allocation data
     * @return true if allocation data exists for {_treeId} and false otherwise
     */
    function allocationExists(uint256 _treeId) external view returns (bool);
}
