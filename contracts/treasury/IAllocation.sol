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

    /** return assignModel data for index {_index} of assingModel array
     * for example from startingId of allocationToTrees[0] to startingId of
     * allocationToTrees[1] belong to distributionModelId of assingModels[0]
     * @return startingTreeId is starting tree with model distributionModelId
     * @return distributionModelId for index {_index} of assignModel array
     */
    function allocationToTrees(uint256 _index)
        external
        returns (uint256 startingTreeId, uint256 distributionModelId);

    /** return allocations data based on _distributionModelId
     * @return planterShare
     * @return ambassadorShare
     * @return researchShare
     * @return localDevelopmentShare
     * @return insuranceShare
     * @return treasuryShare
     * @return reserve1Share
     * @return reserve2Share
     * @return exists is true when there is a allocations for _distributionModelId
     */
    function allocations(uint256 _distributionModelId)
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
     * @dev admin add a model for funding distribution that sum of the
     * inputs must be 10000
     * @param _planter planter share
     * @param _referral referral share
     * @param _treeResearch tree research share
     * @param _localDevelop local develop share
     * @param _rescueFund rescue share
     * @param _treejerDevelop treejer develop share
     * @param _reserveFund1 reserve fund1 share
     * @param _reserveFund2 reserve fund2 share
     * NOTE emit a {AllocationDataAdded} event
     */
    function addAllocationData(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external;

    /**
     * @dev admin assgign a funding distribution model to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _distributionModelId distribution model id to assign
     * NOTE emit a {AllocationToTreeAssigned} event
     */
    function assignAllocationToTree(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external;

    /**
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */
    function exists(uint256 _treeId) external view returns (bool);

    /**
     * @dev return fundDistribution data of {_treeId}
     * @param _treeId id of tree to find fundDistribution data
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
     * @dev emitted when a Distribution model added with {modelId}
     */

    event AllocationDataAdded(uint256 allocationDataId);

    /**
     * @dev emitted when FundDistributionModel assigned to a range of tree
     */

    event AllocationToTreeAssigned(uint256 allocationToTreesLength);
}
