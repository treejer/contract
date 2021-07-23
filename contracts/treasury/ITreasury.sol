// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

/**
 * @title Treasury interfce
 */
interface ITreasury {
    /**
     * @dev return if Treasury contract initialze
     * @return true in case of Treasury contract have been initialized
     */
    function isTreasury() external view returns (bool);

    /**
     * @dev set {_address} to treeResearchAddress
     */
    function setTreeResearchAddress(address payable _address) external;

    /**
     * @dev set {_address} to localDevelopAddress
     */
    function setLocalDevelopAddress(address payable _address) external;

    /**
     * @dev set {_address} to rescueFundAddress
     */
    function setRescueFundAddress(address payable _address) external;

    /**
     * @dev set {_address} to treejerDevelopAddress
     */
    function setTreejerDevelopAddress(address payable _address) external;

    /**
     * @dev set {_address} to otherFundAddress1
     */
    function setOtherFund1Address(address payable _address) external;

    /**
     * @dev set {_address} to otherFundAddress2
     */
    function setOtherFund2Address(address payable _address) external;

    /**
     * @dev add a distributionModel based on input arguments that sum of them are 10000
     */
    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _otherFund1,
        uint16 _otherFund2
    ) external;

    /**
     * @dev assing {_distributionModelId} fundDistributionModel to trees strating from
     * {_startTreeId} and ending at {_endTreeId} and emit a
     * {FundDistributionModelAssigned} event
     */
    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external;

    /**
     * @dev calculate shares based on fundDistributionModel of tree and add to related totalFunds
     * NOTE must call by Auctiion or RegularSell
     */
    function fundTree(uint256 _treeId) external payable;

    /**
     * @dev  based on the treeStatus planter charged in every tree update verifying
     * NOTE must call by GenesisTree
     */
    function fundPlanter(
        uint256 _treeId,
        address payable _planterId,
        uint64 _treeStatus
    ) external;

    /**
     * @dev check if there is a distribution model for a tree or not
     * @return true in case of distribution model existance for a tree
     */
    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool);

    /**
     * @dev trnasfer {_amount} from treeResearch in {totalFunds} to treeResearchAddress
     */
    function withdrawTreeResearch(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from localDevelop in {totalFunds} to localDevelopAddress
     */
    function withdrawLocalDevelop(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from rescueFund in {totalFunds} to rescueFundAddress
     */
    function withdrawRescueFund(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from treejerDevelop in {totalFunds} to treejerDevelopAddress
     */
    function withdrawTreejerDevelop(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from otherFund1 in {totalFunds} to otherFundAddress1
     */
    function withdrawOtherFund1(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from otherFund2 in {totalFunds} to otherFundAddress2
     */
    function withdrawOtherFund2(uint256 _amount, string memory _reason)
        external;

    /**
     * @dev trnasfer {_amount} from  planters balances to caller's address
     */
    function withdrawPlanterBalance(uint256 _amount) external;

    /**
     * @dev returns assignModels data containing {stratingTreeId} and {distributionModelId}
     * in index {_index}
     */
    function assignModels(uint256 _index)
        external
        view
        returns (uint256 startingTreeId, uint256 distributionModelId);

    /**
     * @dev return totalFunds struct data containing {plnaterFund} {referralFund}
     * {treeResearch} {localDevelop} {rescueFund} {treejerDevelop} {otherFund1}
     * {otherFund2}
     */
    function totalFunds()
        external
        view
        returns (
            uint256 planterFund,
            uint256 referralFund,
            uint256 treeResearch,
            uint256 localDevelop,
            uint256 rescueFund,
            uint256 treejerDevelop,
            uint256 otherFund1,
            uint256 otherFund2
        );

    event DistributionModelOfTreeNotExist(string description);

    event FundDistributionModelAssigned(
        uint256 startingTreeId,
        uint256 endingTreeId,
        uint256 distributionModelId
    );

    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);

    event PlanterBalanceWithdrawn(uint256 amount, address account);

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
}
