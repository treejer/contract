// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface ITreasuryManager {
    function setGbFundAddress(address payable _address) external;

    function setTreeResearchAddress(address payable _address) external;

    function setLocalDevelopAddress(address payable _address) external;

    function setRescueFundAddress(address payable _address) external;

    function setTreejerDevelopAddress(address payable _address) external;

    function setOtherFund1Address(address payable _address) external;

    function setOtherFund2Address(address payable _address) external;

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

    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external;

    function fundTree(uint256 _treeId) external payable;

    function fundPlanter(
        uint256 _treeId,
        address payable _planterId,
        uint16 _treeStatus
    ) external;

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool);

    function withdrawGb(uint256 _amount, string memory _reason) external;

    function withdrawTreeResearch(uint256 _amount, string memory _reason)
        external;

    function withdrawLocalDevelop(uint256 _amount, string memory _reason)
        external;

    function withdrawRescueFund(uint256 _amount, string memory _reason)
        external;

    function withdrawTreejerDevelop(uint256 _amount, string memory _reason)
        external;

    function withdrawOtherFund1(uint256 _amount, string memory _reason)
        external;

    function withdrawOtherFund2(uint256 _amount, string memory _reason)
        external;

    function withdrawPlanterBalance(uint256 _amount) external;

    function assignModels(uint256 _index)
        external
        view
        returns (uint256 startingTreeId, uint256 distributionModelId);

    function totalFunds()
        external
        view
        returns (
            uint256 planterFund,
            uint256 gbFund,
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
}
