// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";
import "./interfaces/IUniswapV2Router02New.sol";

/** @title WethFund Contract */

contract WethFund is Initializable {
    /** NOTE {isWethFund} set inside the initialize to {true} */
    bool public isWethFund;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public wethToken;
    IUniswapV2Router02New public uniswapRouter;

    /** NOTE Dai contract address */
    address public daiAddress;

    uint256 public totalDaiDebtToPlanterContract;

    /** NOTE {totalBalances} keep total share of
     * research, localDevelopment,insurance,treasury,reserve1
     * and reserve2
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

    event DaiDebtToPlanterContractPaid(
        uint256 wethMaxUse,
        uint256 daiAmount,
        uint256 wethAmount
    );

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

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /** NOTE modifier to check msg.sender has script role */
    modifier onlyScript() {
        accessRestriction.ifScript(msg.sender);
        _;
    }

    /**
     * @dev initialize AccessRestriction contract and set true for isWethFund
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

        isWethFund = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set Dai contract address
     * @param _daiAddress set to the address of Dai contract
     */
    function setDaiAddress(address _daiAddress)
        external
        onlyAdmin
        validAddress(_daiAddress)
    {
        daiAddress = _daiAddress;
    }

    /**
     * @dev admin set WethToken contract address
     * @param _wethTokenAddress set to the address of WethToken contract
     */
    function setWethTokenAddress(address _wethTokenAddress)
        external
        onlyAdmin
        validAddress(_wethTokenAddress)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _wethTokenAddress
        );
        wethToken = candidateContract;
    }

    /**
     * @dev admin set UniswapRouter contract address
     * @param _uniswapRouterAddress set to the address of UniswapRouter contract
     */
    function setUniswapRouterAddress(address _uniswapRouterAddress)
        external
        onlyAdmin
        validAddress(_uniswapRouterAddress)
    {
        IUniswapV2Router02New candidateContract = IUniswapV2Router02New(
            _uniswapRouterAddress
        );

        uniswapRouter = candidateContract;
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
     * NOTE sum of planter and ambassador amount first swap to dai and
     * then transfer to the PlanterFund contract and update projected earnings
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
        totalBalances.research += (_amount * _researchShare) / 10000;

        totalBalances.localDevelopment +=
            (_amount * _localDevelopmentShare) /
            10000;

        totalBalances.insurance += (_amount * _insuranceShare) / 10000;

        totalBalances.treasury += (_amount * _treasuryShare) / 10000;

        totalBalances.reserve1 += (_amount * _reserve1Share) / 10000;

        totalBalances.reserve2 += (_amount * _reserve2Share) / 10000;

        _swapPlanterShare(_treeId, _amount, _planterShare, _ambassadorShare);
    }

    /**
     * @dev update totalBalances based on input amounts.
     * NOTE sum of planter and ambassador amount first swap to dai and then
     * transfer to the PlanterFund
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
    ) external onlyTreejerContract returns (uint256) {
        totalBalances.research += _totalResearch;

        totalBalances.localDevelopment += _totalLocalDevelopment;

        totalBalances.insurance += _totalInsurance;

        totalBalances.treasury += _totalTreasury;

        totalBalances.reserve1 += _totalReserve1;

        totalBalances.reserve2 += _totalReserve2;

        uint256 sumAmount = _totalPlanterAmount + _totalAmbassadorAmount;

        uint256 daiAmount = sumAmount > 0
            ? _swapExactTokensForTokens(sumAmount)
            : 0;

        emit TreeFundedBatch();

        return daiAmount;
    }

    /**
     * @dev admin pay daiDebtToPlanterContract.
     * @param _wethMaxUse maximum amount of weth can use
     * @param _daiAmountToSwap amount of dai that must swap
     */
    function payDaiDebtToPlanterContract(
        uint256 _wethMaxUse,
        uint256 _daiAmountToSwap
    ) external ifNotPaused onlyScript {
        require(_wethMaxUse <= totalBalances.treasury, "Liquidity not enough");

        require(
            _daiAmountToSwap > 0 &&
                _daiAmountToSwap <= totalDaiDebtToPlanterContract,
            "totalDaiDebtToPlanterContract invalid"
        );

        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = daiAddress;

        bool success = wethToken.approve(address(uniswapRouter), _wethMaxUse);

        require(success, "unsuccessful approve");

        uint256[] memory amounts = uniswapRouter.swapTokensForExactTokens(
            _daiAmountToSwap,
            _wethMaxUse,
            path,
            address(planterFundContract),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );

        emit DaiDebtToPlanterContractPaid(
            _wethMaxUse,
            _daiAmountToSwap,
            amounts[0]
        );

        totalDaiDebtToPlanterContract -= _daiAmountToSwap;
        totalBalances.treasury -= amounts[0];
    }

    /**
     * @dev update totalDaiDebtToPlanterContract amount
     * @param _amount is amount add to totalDaiDebtToPlanterContract
     */
    function updateDaiDebtToPlanterContract(uint256 _amount)
        external
        onlyTreejerContract
    {
        totalDaiDebtToPlanterContract += _amount;
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

        bool success = wethToken.transfer(researchAddress, _amount);

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

        bool success = wethToken.transfer(localDevelopmentAddress, _amount);

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

        bool success = wethToken.transfer(insuranceAddress, _amount);

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

        bool success = wethToken.transfer(treasuryAddress, _amount);

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

        bool success = wethToken.transfer(reserve1Address, _amount);

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

        bool success = wethToken.transfer(reserve2Address, _amount);

        require(success, "unsuccessful transfer");

        emit Reserve2BalanceWithdrew(_amount, reserve2Address, _reason);
    }

    /** @dev calculate planter and ambassador dai amount and transfer it to
     * PlanterFund contract and update projected earnings
     * @param _treeId id of tree to updateProjectedEarnings for
     * @param _amount total amount
     * @param _planterShare planter share
     * @param _ambassadorShare ambassador share
     */
    function _swapPlanterShare(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterShare,
        uint16 _ambassadorShare
    ) private {
        uint256 planterAmount = (_amount * _planterShare) / 10000;
        uint256 ambassadorAmount = (_amount * _ambassadorShare) / 10000;

        uint256 sumAmount = planterAmount + ambassadorAmount;
        uint16 sumShare = _planterShare + _ambassadorShare;

        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = daiAddress;

        uint256 daiAmount = sumAmount > 0
            ? _swapExactTokensForTokens(sumAmount)
            : 0;

        planterFundContract.updateProjectedEarnings(
            _treeId,
            (_planterShare * daiAmount) / sumShare,
            (_ambassadorShare * daiAmount) / sumShare
        );

        emit TreeFunded(_treeId, _amount, planterAmount + ambassadorAmount);
    }

    /**
     * @dev swap weth token to dai token
     * @param _amount is amount of weth token to swap
     * @return amount of dai
     */
    function _swapExactTokensForTokens(uint256 _amount)
        private
        returns (uint256 amount)
    {
        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = daiAddress;

        bool success = wethToken.approve(address(uniswapRouter), _amount);

        require(success, "unsuccessful approve");

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(planterFundContract),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );

        return amounts[1];
    }
}
