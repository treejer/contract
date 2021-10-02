// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title WethFund interfce */
interface IWethFund {
    /**
     * @return true in case of WethFund contract have been initialized
     */
    function isWethFund() external view returns (bool);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @return PlanterFund contract address
     */
    function planterFundContract() external view returns (address);

    /**
     * @return WethToken contract address
     */
    function wethToken() external view returns (address);

    /**
     * @return UniswapRouter contract address
     */
    function uniswapRouter() external view returns (address);

    /**
     * @return DaiToken address
     */
    function daiAddress() external view returns (address);

    //TODO:ADD_COMMENT
    function totalDaiDebtToPlanterContract() external view returns (uint256);

    /**
     * @dev return totalBalances struct data
     * @return research share
     * @return localDevelopment share
     * @return insurance share
     * @return treasury share
     * @return reserve1 share
     * @return reserve2 share
     */
    function totalBalances()
        external
        view
        returns (
            uint256 research,
            uint256 localDevelopment,
            uint256 insurance,
            uint256 treasury,
            uint256 reserve1,
            uint256 reserve2
        );

    /**
     * @return research address
     */
    function researchAddress() external view returns (address);

    /**
     * @return localDevelopment address
     */
    function localDevelopmentAddress() external view returns (address);

    /**
     * @return insurance address
     */
    function insuranceAddress() external view returns (address);

    /**
     * @return treasury address
     */
    function treasuryAddress() external view returns (address);

    /**
     * @return reserve1 address
     */
    function reserve1Address() external view returns (address);

    /**
     * @return reserve2 address
     */
    function reserve2Address() external view returns (address);

    /** @dev set {_address} to DaiToken address */
    function setDaiAddress(address _daiAddress) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _wethTokenAddress) external;

    /** @dev set {_address} to UniswapRouter contract address */
    function setUniswapRouterAddress(address _uniswapRouterAddress) external;

    /** @dev set {_address} to PlanterFund contract address */
    function setPlanterFundContractAddress(address _address) external;

    /**
     * @dev set {_address} to researchAddress
     */
    function setResearchAddress(address payable _address) external;

    /**
     * @dev set {_address} to localDevelopmentAddress
     */
    function setLocalDevelopmentAddress(address payable _address) external;

    /**
     * @dev set {_address} to insuranceAddress
     */
    function setInsuranceAddress(address payable _address) external;

    /**
     * @dev set {_address} to treasuryAddress
     */
    function setTreasuryAddress(address payable _address) external;

    /**
     * @dev set {_address} to reserve1Address
     */
    function setReserve1Address(address payable _address) external;

    /**
     * @dev set {_address} to reserve2Address
     */
    function setReserve2Address(address payable _address) external;

    /**
     * @dev fund a tree by IncrementalSale or Auction contract and based on allocation
     * data of tree, shares divide beetwen (planter, ambassador, research,
     * localDevelopment, insurance, treasury, reserve1 and reserve2)
     * and added to the totalBalances of each part,
     * @param _treeId id of a tree to fund
     * NOTE planter and ambassador share first swap to daiToken and then
     * transfer to PlanterFund contract and add to totalBalances section there
     * NOTE emit a {TreeFunded} event
     */
    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterShare,
        uint16 _ambassadorShare,
        uint16 _researchShare,
        uint16 _localDevelopmentShare,
        uint16 _insuranceShare,
        uint16 _treasuryShare,
        uint16 _reserve1Share,
        uint16 _reserve2Share
    ) external;

    //TODO: ADD_COMMENT
    function fundTreeBatch(
        uint256 _totalPlanterAmount,
        uint256 _totalAmbassadorAmount,
        uint256 _totalResearch,
        uint256 _totalLocalDevelopment,
        uint256 _totalInsurance,
        uint256 _totalTreasury,
        uint256 _totalReserve1,
        uint256 _totalReserve2
    ) external returns (uint256);

    //TODO: ADD_COMMENT
    function payDaiDebtToPlanterContract(
        uint256 _wethMaxUse,
        uint256 _daiAmountToSwap
    ) external;

    //TODO: ADD_COMMENT
    function updateDaiDebtToPlanterContract(uint256 _amount) external;

    /**
     * @dev trnasfer {_amount} from research in {totalBalances} to researchAddress
     * NOTE emit a {ResearchBalanceWithdrew} event
     */
    function withdrawResearchBalance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from localDevelopment in {totalBalances} to localDevelopmentAddress
     * NOTE emit a {LocalDevelopmentBalanceWithdrew} event
     */
    function withdrawLocalDevelopmentBalance(
        uint256 _amount,
        string calldata _reason
    ) external;

    /**
     * @dev trnasfer {_amount} from insurance in {totalBalances} to insuranceAddress
     * NOTE emit a {InsuranceBalanceWithdrew} event
     */
    function withdrawInsuranceBalance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from treasury in {totalBalances} to treasuryAddress
     * NOTE emit a {TreasuryBalanceWithdrew} event
     */
    function withdrawTreasuryBalance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserve1 in {totalBalances} to reserve1Address
     * NOTE emit a {Reserve1BalanceWithdrew} event
     */
    function withdrawReserve1Balance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserve2 in {totalBalances} to reserve2Address
     * NOTE emit a {Reserve2BalanceWithdrew} event
     */
    function withdrawReserve2Balance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev emitted when admin withdraw  research balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event ResearchBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw local development balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event LocalDevelopmentBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw insurance balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event InsuranceBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw treasury balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event TreasuryBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw reserve1 balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event Reserve1BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw reserve2 balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event Reserve2BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when a tree funded with total amount of {amount} and with
     * planter share of {planterShare}
     * {treeId} is id of tree that is funded
     */
    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    //TODO:ADD_COMMENT
    event TreeFundedBatch();

    //TODO:ADD_COMMENT
    event DaiDebtToPlanterContractPaid(
        uint256 wethMaxUse,
        uint256 daiAmount,
        uint256 wethAmount
    );
}
