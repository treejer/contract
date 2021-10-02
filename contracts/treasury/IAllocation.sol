// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title Allocation interfce */
interface IAllocation {
    /**
     * @return true in case of Allocation contract have been initialized
     */
    function isAllocation() external view returns (bool);

    /**
     * @return maxAssignedIndex
     */
    function maxAssignedIndex() external view returns (uint256);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /** return allocationToTrees data for index {_index} of allocationToTrees
     * array for example from startingId of allocationToTrees[0] to startingId of
     * allocationToTrees[1] belong to allocationDataId of allocationToTrees[0]
     * @return startingTreeId is starting tree with model allocationDataId
     * @return allocationDataId for index {_index} of allocationToTrees array
     */
    function allocationToTrees(uint256 _index)
        external
        returns (uint256 startingTreeId, uint256 allocationDataId);

    /** return allocations data based on _allocationDataId
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
     * @dev admin add allocation data that sum of the
     * inputs must be 10000
     * @param _planterShare planter share
     * @param _ambassadorShare ambassador share
     * @param _researchShare research share
     * @param _localDevelopmentShare local development share
     * @param _insuranceShare insurance share
     * @param _treasuryShare treasury share
     * @param _reserve1Share reserve1 share
     * @param _reserve2Share reserve2 share
     * NOTE emit a {AllocationDataAdded} event
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
     * @dev admin assgign a funding allocation data to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign allocation to
     * @param _endTreeId ending tree id to assign allocation to
     * @param _allocationDataId allocation data id to assign
     * NOTE emit a {AllocationToTreeAssigned} event
     */
    function assignAllocationToTree(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _allocationDataId
    ) external;

    /**
     * @dev check if there is allocation data for {_treeId} or not
     * @param _treeId id of a tree to check if there is a allocationData
     * @return true in case of allocationData existance for {_treeId} and false otherwise
     */
    function exists(uint256 _treeId) external view returns (bool);

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
     * @dev emitted when a AllocationData added with {allocationDataId}
     */

    event AllocationDataAdded(uint256 allocationDataId);

    /**
     * @dev emitted when AllocationData assigned to a range of tree
     */

    event AllocationToTreeAssigned(uint256 allocationToTreesLength);
}
