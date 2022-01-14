// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title DaiFund interfce */
interface IDaiFund {
    /**
     * @dev emitted when admin withdraw research balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event ResearchBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    /**
     * @dev emitted when admin withdraw localDevelopment balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event LocalDevelopmentBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    /**
     * @dev emitted when admin withdraw insurance balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event InsuranceBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    /**
     * @dev emitted when admin withdraw treasury balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event TreasuryBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    /**
     * @dev emitted when admin withdraw reserve1 balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event Reserve1BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw reserve2 balance
     * @param amount amount to withdraw
     * @param account address of destination account
     * @param reason reason of withdraw
     */
    event Reserve2BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when a tree funded
     * @param treeId id of tree that is funded
     * @param amount total amount
     * @param planterPart sum of planter amount and ambassador amount
     */
    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    /**
     * @dev emitted when trees are fund in batches
     */
    event TreeFundedBatch();

    /** @dev set {_address} to DaiToken contract address */
    function setDaiTokenAddress(address _daiTokenAddress) external;

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
     * @dev update totalBalances based on share amounts.
     * NOTE sum of planter and ambassador amount transfer to the PlanterFund
     * contract and update projected earnings
     * NOTE emit a {TreeFunded} event
     * @param _treeId id of a tree to fund
     * @param _amount total amount
     * @param _planterShare planter share
     * @param _ambassadorShare ambassador share
     * @param _researchShare research share
     * @param _localDevelopmentShare localDevelopment share
     * @param _insuranceShare insurance share
     * @param _treasuryShare treasury share
     * @param _reserve1Share reserve1 share
     * @param _reserve2Share reserve2 share
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

    /**
     * @dev update totalBalances based on input amounts.
     * NOTE sum of planter and ambassador amount transfer to the PlanterFund
     * NOTE emit a {TreeFundedBatch} event
     * @param _totalPlanterAmount total planter amount
     * @param _totalAmbassadorAmount total ambassador amount
     * @param _totalResearch total research amount
     * @param _totalLocalDevelopment total localDevelopment amount
     * @param _totalInsurance total insurance amount
     * @param _totalTreasury total treasury amount
     * @param _totalReserve1 total reserve1 amount
     * @param _totalReserve2 total reserve2 amount
     */
    function fundTreeBatch(
        uint256 _totalPlanterAmount,
        uint256 _totalAmbassadorAmount,
        uint256 _totalResearch,
        uint256 _totalLocalDevelopment,
        uint256 _totalInsurance,
        uint256 _totalTreasury,
        uint256 _totalReserve1,
        uint256 _totalReserve2
    ) external;

    /**
     * @dev transfer dai from treasury in totalBalances to PlanterFund contract when
     * referrer want to claim reward
     * @param _amount amount to transfer
     */
    function transferReferrerDai(uint256 _amount) external;

    /**
     * @dev admin withdraw from research totalBalance
     * NOTE amount transfer to researchAddress
     * NOTE emit a {ResearchBalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawResearchBalance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev admin withdraw from localDevelopment totalBalances
     * NOTE amount transfer to localDevelopmentAddress
     * NOTE emit a {LocalDevelopmentBalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawLocalDevelopmentBalance(
        uint256 _amount,
        string calldata _reason
    ) external;

    /**
     * @dev admin withdraw from insurance totalBalances
     * NOTE amount transfer to insuranceAddress
     * NOTE emit a {InsuranceBalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawInsuranceBalance(uint256 _amount, string calldata _reason)
        external;

    //TODO:remove
    function withdrawContractBalance(address _wallet) external;

    /**
     * @dev admin withdraw from treasury totalBalances
     * NOTE amount transfer to treasuryAddress
     * NOTE emit a {TreasuryBalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreasuryBalance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev admin withdraw from reserve1 totalBalances
     * NOTE amount transfer to reserve1Address
     * NOTE emit a {Reserve1BalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserve1Balance(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev admin withdraw from reserve2 totalBalances
     * NOTE amount transfer to reserve2Address
     * NOTE emit a {Reserve2BalanceWithdrew} event
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserve2Balance(uint256 _amount, string calldata _reason)
        external;

    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true in case of DaiFund contract has been initialized
     */
    function isDaiFund() external view returns (bool);

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
}
