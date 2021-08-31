// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0xaee2daae(bytes32 c__0xaee2daae) pure {}


/** @title FinancialModel interfce */
interface IFinancialModel {
    /**
     * @return true in case of FinancialModel contract have been initialized
     */
    function isFinancialModel() external view returns (bool);

    /**
     * @return maxAssignedIndex
     */
    function maxAssignedIndex() external view returns (uint256);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /** return assignModel data for index {_index} of assingModel array
     * for example from startingId of assignModels[0] to startingId of
     * assignModels[1] belong to distributionModelId of assingModels[0]
     * @return startingTreeId is starting tree with model distributionModelId
     * @return distributionModelId for index {_index} of assignModel array
     */
    function assignModels(uint256 _index)
        external
        returns (uint256 startingTreeId, uint256 distributionModelId);

    /** return fundDistributions data based on _distributionModelId
     * @return planterFund share
     * @return referralFund share
     * @return treeResearch share
     * @return localDevelop share
     * @return rescueFund share
     * @return treejerDevelop share
     * @return reserveFund1 share
     * @return reserveFund2 share
     * @return exists is true when there is a fundDistributions for _distributionModelId
     */
    function fundDistributions(uint256 _distributionModelId)
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
            uint16 reserveFund2,
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
     * NOTE emit a {DistributionModelAdded} event
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
    ) external;

    /**
     * @dev admin assgign a funding distribution model to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _distributionModelId distribution model id to assign
     * NOTE emit a {FundDistributionModelAssigned} event
     */
    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external;

    /**
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */
    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool);

    /**
     * @dev return fundDistribution data of {_treeId}
     * @param _treeId id of tree to find fundDistribution data
     * @return planterFund share
     * @return referralFund share
     * @return treeResearch share
     * @return localDevelop share
     * @return rescueFund share
     * @return treejerDevelop share
     * @return reserveFund1 share
     * @return reserveFund2 share
     */
    function findTreeDistribution(uint256 _treeId)
        external
        returns (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        );

    /**
     * @dev return fundDistribution id of {_treeId}
     * @param _treeId id of tree to find fundDistribution id of it.
     * @return id of fundDistiubution
     */
    function getFindDistributionModelId(uint256 _treeId)
        external
        view
        returns (uint256);

    /**
     * @dev emitted when a Distribution model added with {modelId}
     */

    event DistributionModelAdded(uint256 modelId);

    /**
     * @dev emitted when FundDistributionModel assigned to a range of tree
     */

    event FundDistributionModelAssigned(uint256 assignModelsLength);
}
