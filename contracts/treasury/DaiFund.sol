// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";
import "./IDaiFund.sol";

/** @title DaiFund Contract */
contract DaiFund is Initializable, IDaiFund {
    struct TotalBalances {
        uint256 research;
        uint256 localDevelopment;
        uint256 insurance;
        uint256 treasury;
        uint256 reserve1;
        uint256 reserve2;
    }

    /** NOTE {isDaiFund} set inside the initialize to {true} */
    bool public override isDaiFund;

    /** NOTE {totalBalances} keep total share of research, localDevelopment,
     * insurance,treejerDeveop,reserve1 and reserve2
     */
    TotalBalances public override totalBalances;

    address public override researchAddress;
    address public override localDevelopmentAddress;
    address public override insuranceAddress;
    address public override treasuryAddress;
    address public override reserve1Address;
    address public override reserve2Address;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public daiToken;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
        _;
    }
    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc IDaiFund
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isDaiFund = true;
        accessRestriction = candidateContract;
    }

    /// @inheritdoc IDaiFund
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        override
        onlyAdmin
        validAddress(_daiTokenAddress)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
        daiToken = candidateContract;
    }

    /// @inheritdoc IDaiFund
    function setPlanterFundContractAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    /// @inheritdoc IDaiFund
    function setResearchAddress(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        researchAddress = _address;
    }

    /// @inheritdoc IDaiFund
    function setLocalDevelopmentAddress(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        localDevelopmentAddress = _address;
    }

    /// @inheritdoc IDaiFund
    function setInsuranceAddress(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        insuranceAddress = _address;
    }

    /// @inheritdoc IDaiFund
    function setTreasuryAddress(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        treasuryAddress = _address;
    }

    /// @inheritdoc IDaiFund
    function setReserve1Address(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        reserve1Address = _address;
    }

    /// @inheritdoc IDaiFund
    function setReserve2Address(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        reserve2Address = _address;
    }

    /// @inheritdoc IDaiFund
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
    ) external override onlyTreejerContract {
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

        require(success, "Unsuccessful transfer");

        planterFundContract.updateProjectedEarnings(
            _treeId,
            planterAmount,
            ambassadorAmount
        );

        emit TreeFunded(_treeId, _amount, planterAmount + ambassadorAmount);
    }

    /// @inheritdoc IDaiFund
    function fundTreeBatch(
        uint256 _totalPlanterAmount,
        uint256 _totalAmbassadorAmount,
        uint256 _totalResearch,
        uint256 _totalLocalDevelopment,
        uint256 _totalInsurance,
        uint256 _totalTreasury,
        uint256 _totalReserve1,
        uint256 _totalReserve2
    ) external override onlyTreejerContract {
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

        require(success, "Unsuccessful transfer");

        emit TreeFundedBatch();
    }

    /// @inheritdoc IDaiFund
    function transferReferrerDai(uint256 _amount)
        external
        override
        onlyTreejerContract
    {
        require(totalBalances.treasury >= _amount, "Insufficient Liquidity");

        totalBalances.treasury -= _amount;

        bool success = daiToken.transfer(address(planterFundContract), _amount);

        require(success, "Unsuccessful transfer");
    }

    /// @inheritdoc IDaiFund
    function withdrawResearchBalance(uint256 _amount, string calldata _reason)
        external
        override
        onlyAdmin
        validAddress(researchAddress)
    {
        require(
            _amount <= totalBalances.research && _amount > 0,
            "Invalid amount"
        );

        totalBalances.research -= _amount;

        bool success = daiToken.transfer(researchAddress, _amount);

        require(success, "Unsuccessful transfer");

        emit ResearchBalanceWithdrew(_amount, researchAddress, _reason);
    }

    /// @inheritdoc IDaiFund
    function withdrawLocalDevelopmentBalance(
        uint256 _amount,
        string calldata _reason
    ) external override onlyAdmin validAddress(localDevelopmentAddress) {
        require(
            _amount <= totalBalances.localDevelopment && _amount > 0,
            "Invalid amount"
        );

        totalBalances.localDevelopment -= _amount;

        bool success = daiToken.transfer(localDevelopmentAddress, _amount);

        require(success, "Unsuccessful transfer");

        emit LocalDevelopmentBalanceWithdrew(
            _amount,
            localDevelopmentAddress,
            _reason
        );
    }

    /// @inheritdoc IDaiFund
    function withdrawInsuranceBalance(uint256 _amount, string calldata _reason)
        external
        override
        onlyAdmin
        validAddress(insuranceAddress)
    {
        require(
            _amount <= totalBalances.insurance && _amount > 0,
            "Invalid amount"
        );

        totalBalances.insurance -= _amount;

        bool success = daiToken.transfer(insuranceAddress, _amount);

        require(success, "Unsuccessful transfer");

        emit InsuranceBalanceWithdrew(_amount, insuranceAddress, _reason);
    }

    /// @inheritdoc IDaiFund
    function withdrawTreasuryBalance(uint256 _amount, string calldata _reason)
        external
        override
        onlyAdmin
        validAddress(treasuryAddress)
    {
        require(
            _amount <= totalBalances.treasury && _amount > 0,
            "Invalid amount"
        );

        totalBalances.treasury -= _amount;

        bool success = daiToken.transfer(treasuryAddress, _amount);

        require(success, "Unsuccessful transfer");

        emit TreasuryBalanceWithdrew(_amount, treasuryAddress, _reason);
    }

    /// @inheritdoc IDaiFund
    function withdrawReserve1Balance(uint256 _amount, string calldata _reason)
        external
        override
        onlyAdmin
        validAddress(reserve1Address)
    {
        require(
            _amount <= totalBalances.reserve1 && _amount > 0,
            "Invalid amount"
        );

        totalBalances.reserve1 -= _amount;

        bool success = daiToken.transfer(reserve1Address, _amount);

        require(success, "Unsuccessful transfer");

        emit Reserve1BalanceWithdrew(_amount, reserve1Address, _reason);
    }

    /// @inheritdoc IDaiFund
    function withdrawReserve2Balance(uint256 _amount, string calldata _reason)
        external
        override
        onlyAdmin
        validAddress(reserve2Address)
    {
        require(
            _amount <= totalBalances.reserve2 && _amount > 0,
            "Invalid amount"
        );

        totalBalances.reserve2 -= _amount;

        bool success = daiToken.transfer(reserve2Address, _amount);

        require(success, "Unsuccessful transfer");

        emit Reserve2BalanceWithdrew(_amount, reserve2Address, _reason);
    }
}
