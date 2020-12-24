// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

interface ITreeFactory {
    event PriceChanged(uint256 price);
    event TreePlanted(
        uint256 id,
        string latitude,
        string longitude,
        uint256 plantedDate
    );
    event TreeFunded(
        uint256 treeId,
        uint256 planterBalance,
        uint256 ambassadorBalance,
        uint256 totalFund,
        address owner
    );
    event PlanterBalanceWithdrawn(address planter, uint256 amount);
    event AmbassadorBalanceWithdrawn(address ambassador, uint256 amount);
    event TreejerFundWithdrawn(address to, uint256 amount, address by);
    event LocalDevelopmentFundWithdrawn(address to, uint256 amount, address by);
    event RescueFundWithdrawn(address to, uint256 amount, address by);
    event ResearchFundWithdrawn(address to, uint256 amount, address by);

    function isTreeFactory() external view returns (bool);

    function trees(uint256 _index)
        external
        view
        returns (
            string memory latitude,
            string memory longitude,
            uint256 plantedDate,
            uint256 birthDate,
            uint256 fundedDate,
            uint8 height,
            uint8 diameter
        );

    function price() external view returns (uint256);

    function notFundedTrees(uint256 _index)
        external
        view
        returns (uint256 treeId);

    function notFundedTreesLastIndex() external view returns (uint256 index);

    function notFundedTreesUsedIndex() external view returns (uint256 index);

    function notPlantedTrees(uint256 _index)
        external
        view
        returns (uint256 treeId);

    function notPlantedTreesLastIndex() external view returns (uint256 index);

    function notPlantedTreesUsedIndex() external view returns (uint256 index);

    function treeToType(uint256 treeId) external view returns (uint8 typeId);

    function treeToGB(uint256 treeId) external view returns (uint256 gbId);

    function treeToPlanter(uint256 treeId)
        external
        view
        returns (address planter);

    function planterTreeCount(address planter)
        external
        view
        returns (uint256 count);

    function planterTrees(address planter, uint256 index)
        external
        view
        returns (uint256 treeId);

    function typeTreeCount(uint256 typeId)
        external
        view
        returns (uint256 count);

    function gbTreeCount(uint256 gbId) external view returns (uint256 count);

    function gbTrees(uint256 gbId, uint256 index)
        external
        view
        returns (uint256 treeId);

    function typeTrees(uint256 typeId, uint256 index)
        external
        view
        returns (uint256 treeId);

    function treeToPlanterRemainingBalance(uint256 treeId)
        external
        view
        returns (uint256 remainingBalance);

    function treeToPlanterBalancePerSecond(uint256 treeId)
        external
        view
        returns (uint256 balancePerSecond);

    function treeToAmbassadorRemainingBalance(uint256 treeId)
        external
        view
        returns (uint256 remainingBalance);

    function treeToAmbassadorBalancePerSecond(uint256 treeId)
        external
        view
        returns (uint256 balancePerSecond);

    // 100 percentages basis points = 1 percentage
    function treejerPercentage() external view returns (uint256 percentage);

    function plantersPercentage() external view returns (uint256 percentage);

    function ambassadorsPercentage() external view returns (uint256 percentage);

    function localDevelopmentFundPercentage()
        external
        view
        returns (uint256 percentage);

    function rescueFundPercentage() external view returns (uint256 percentage);

    function researchFundPercentage()
        external
        view
        returns (uint256 percentage);

    function treejerFund() external view returns (uint256 balance);

    function plantersFund() external view returns (uint256 balance);

    function ambassadorsFund() external view returns (uint256 balance);

    function localDevelopmentFund() external view returns (uint256 balance);

    function rescueFund() external view returns (uint256 balance);

    function researchFund() external view returns (uint256 balance);

    function updateToPlanterBalanceWithdrawn(uint256 updateId)
        external
        view
        returns (bool isWithdrawn);

    function updateToAmbassadorBalanceWithdrawn(uint256 updateId)
        external
        view
        returns (bool isWithdrawn);

    function setGBFactoryAddress(address _address) external;

    function setUpdateFactoryAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function plant(
        uint8 _typeId,
        string[] calldata _stringParams,
        uint8[] calldata _uintParams
    ) external;

    function setPrice(uint256 _price) external;

    function fund(uint256 _count) external payable;

    function withdrawTreejerFund(address payable _to, uint256 _amount) external;

    function withdrawLocalDevelopmentFund(address payable _to, uint256 _amount)
        external;

    function withdrawRescueFund(address payable _to, uint256 _amount) external;

    function withdrawResearchFund(address payable _to, uint256 _amount)
        external;

    function withdrawPlanterBalance() external;

    function withdrawAmbassadorBalance() external;
}
