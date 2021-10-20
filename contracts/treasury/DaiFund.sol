// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";

/** @title DaiFund Contract */
contract DaiFund is Initializable {
    /** NOTE {isDaiFund} set inside the initialize to {true} */
    bool public isDaiFund;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public daiToken;

    /** NOTE {totalBalances} keep total share of research, localDevelopment,
     * insurance,treejerDeveop,reserve1 and reserve2
     */
    TotalBalances public totalBalances;

    address public researchAddress;
    address public localDevelopmentAddress;
    address public insuranceAddress;
    address public treasuryAddress;
    address public reserve1Address;
    address public reserve2Address;

    struct TotalBalances {
        uint256 research;
        uint256 localDevelopment;
        uint256 insurance;
        uint256 treasury;
        uint256 reserve1;
        uint256 reserve2;
    }

    event ResearchBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    event LocalDevelopmentBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    event InsuranceBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    event TreasuryBalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    event Reserve1BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );
    event Reserve2BalanceWithdrew(
        uint256 amount,
        address account,
        string reason
    );

    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    event TreeFundedBatch();

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
        _;
    }
    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize AccessRestriction contract and set true for isDaiFund
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isDaiFund = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set DaiToken contract address
     * @param _daiTokenAddress set to the address of DaiToken contract
     */
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        onlyAdmin
        validAddress(_daiTokenAddress)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
        daiToken = candidateContract;
    }

    /**
     * @dev admin set PlanterFund contract address
     * @param _address set to the address of PlanterFund contract
     */
    function setPlanterFundContractAddress(address _address)
        external
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    /**
     * @dev admin set research address to fund
     * @param _address research address
     */
    function setResearchAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        researchAddress = _address;
    }

    /**
     * @dev admin set localDevelopment address to fund
     * @param _address localDevelopment address
     */
    function setLocalDevelopmentAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        localDevelopmentAddress = _address;
    }

    /**
     * @dev admin set insurance address to fund
     * @param _address insurance address
     */
    function setInsuranceAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        insuranceAddress = _address;
    }

    /**
     * @dev admin set treasury address to fund
     * @param _address treasury address
     */
    function setTreasuryAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        treasuryAddress = _address;
    }

    /**
     * @dev admin set reserve1 address to fund
     * @param _address reserve1 address
     */
    function setReserve1Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        reserve1Address = _address;
    }

    /**
     * @dev admin set reserve2 address to fund
     * @param _address reserve2 address
     */
    function setReserve2Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        reserve2Address = _address;
    }

    /**
     * @dev update totalBalances based on share amounts.
     * NOTE sum of planter and ambassador amount transfer to the PlanterFund
     * contract and update projected earnings
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
    ) external onlyTreejerContract {
        totalBalances.insurance += (_amount * _insuranceShare) / 10000;

        totalBalances.localDevelopment +=
            (_amount * _localDevelopmentShare) /
            10000;

        totalBalances.reserve1 += (_amount * _reserve1Share) / 10000;

        totalBalances.reserve2 += (_amount * _reserve2Share) / 10000;

        totalBalances.treasury += (_amount * _treasuryShare) / 10000;

        totalBalances.research += (_amount * _researchShare) / 10000;

        uint256 planterAmount = (_amount * _planterShare) / 10000;
        uint256 ambassadorAmount = (_amount * _ambassadorShare) / 10000;

        bool success = daiToken.transfer(
            address(planterFundContract),
            planterAmount + ambassadorAmount
        );

        require(success, "unsuccessful transfer");

        planterFundContract.updateProjectedEarnings(
            _treeId,
            planterAmount,
            ambassadorAmount
        );

        emit TreeFunded(_treeId, _amount, planterAmount + ambassadorAmount);
    }

    /**
     * @dev update totalBalances based on input amounts.
     * NOTE sum of planter and ambassador amount transfer to the PlanterFund
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
    ) external onlyTreejerContract {
        totalBalances.research += _totalResearch;

        totalBalances.localDevelopment += _totalLocalDevelopment;

        totalBalances.insurance += _totalInsurance;

        totalBalances.treasury += _totalTreasury;

        totalBalances.reserve1 += _totalReserve1;

        totalBalances.reserve2 += _totalReserve2;

        bool success = daiToken.transfer(
            address(planterFundContract),
            _totalPlanterAmount + _totalAmbassadorAmount
        );

        require(success, "unsuccessful transfer");

        emit TreeFundedBatch();
    }

    /**
     * @dev transfer dai from treasury in totalBalances to PlanterFund contract when
     * referrer want to claim reward
     * @param _amount amount to transfer
     */
    function transferReferrerDai(uint256 _amount) external onlyTreejerContract {
        require(totalBalances.treasury >= _amount, "Liquidity not enough");

        totalBalances.treasury -= _amount;

        bool success = daiToken.transfer(address(planterFundContract), _amount);

        require(success, "unsuccessful transfer");
    }

    /**
     * @dev admin withdraw from research totalBalance
     * NOTE amount transfer to researchAddress
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawResearchBalance(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(researchAddress)
    {
        require(
            _amount <= totalBalances.research && _amount > 0,
            "insufficient amount"
        );

        totalBalances.research -= _amount;

        bool success = daiToken.transfer(researchAddress, _amount);

        require(success, "unsuccessful transfer");

        emit ResearchBalanceWithdrew(_amount, researchAddress, _reason);
    }

    /**
     * @dev admin withdraw from localDevelopment totalBalances
     * NOTE amount transfer to localDevelopmentAddress
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawLocalDevelopmentBalance(
        uint256 _amount,
        string calldata _reason
    ) external ifNotPaused onlyAdmin validAddress(localDevelopmentAddress) {
        require(
            _amount <= totalBalances.localDevelopment && _amount > 0,
            "insufficient amount"
        );

        totalBalances.localDevelopment -= _amount;

        bool success = daiToken.transfer(localDevelopmentAddress, _amount);

        require(success, "unsuccessful transfer");

        emit LocalDevelopmentBalanceWithdrew(
            _amount,
            localDevelopmentAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw from insurance totalBalances
     * NOTE amount transfer to insuranceAddress
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawInsuranceBalance(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(insuranceAddress)
    {
        require(
            _amount <= totalBalances.insurance && _amount > 0,
            "insufficient amount"
        );

        totalBalances.insurance -= _amount;

        bool success = daiToken.transfer(insuranceAddress, _amount);

        require(success, "unsuccessful transfer");

        emit InsuranceBalanceWithdrew(_amount, insuranceAddress, _reason);
    }

    /**
     * @dev admin withdraw from treasury totalBalances
     * NOTE amount transfer to treasuryAddress
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreasuryBalance(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treasuryAddress)
    {
        require(
            _amount <= totalBalances.treasury && _amount > 0,
            "insufficient amount"
        );

        totalBalances.treasury -= _amount;

        bool success = daiToken.transfer(treasuryAddress, _amount);

        require(success, "unsuccessful transfer");

        emit TreasuryBalanceWithdrew(_amount, treasuryAddress, _reason);
    }

    /**
     * @dev admin withdraw from reserve1 totalBalances
     * NOTE amount transfer to reserve1Address
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserve1Balance(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserve1Address)
    {
        require(
            _amount <= totalBalances.reserve1 && _amount > 0,
            "insufficient amount"
        );

        totalBalances.reserve1 -= _amount;

        bool success = daiToken.transfer(reserve1Address, _amount);

        require(success, "unsuccessful transfer");

        emit Reserve1BalanceWithdrew(_amount, reserve1Address, _reason);
    }

    /**
     * @dev admin withdraw from reserve2 totalBalances
     * NOTE amount transfer to reserve2Address
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserve2Balance(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserve2Address)
    {
        require(
            _amount <= totalBalances.reserve2 && _amount > 0,
            "insufficient amount"
        );

        totalBalances.reserve2 -= _amount;

        bool success = daiToken.transfer(reserve2Address, _amount);

        require(success, "unsuccessful transfer");

        emit Reserve2BalanceWithdrew(_amount, reserve2Address, _reason);
    }
}
