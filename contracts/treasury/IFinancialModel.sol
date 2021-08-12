// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title FinancialModel interfce */
interface IFinancialModel {
    /**
     * @dev return if FinancialModel contract initialize
     * @return true in case of FinancialModel contract have been initialized
     */
    function isFinancialModel() external view returns (bool);

    function maxAssignedIndex() external view returns (uint256);

    function accessRestriction() external view returns (address);

    function assignModels(uint256 _index)
        external
        returns (uint256 startingTreeId, uint256 distributionModelId);

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

    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external;

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool);

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

    function getFindDistributionModelId(uint256 _treeId)
        external
        view
        returns (uint256);

    event DistributionModelAdded(uint256 modelId);

    event FundDistributionModelAssigned(uint256 assignModelsLength);
}
