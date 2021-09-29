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

    /** NOTE {totalBalances} is struct of TotalFund that keep total share of
     * research, localDevelopment,insurance,treejerDeveop,reserve1
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
    event RescueBalanceWithdrew(uint256 amount, address account, string reason);
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
     * @dev initialize accessRestriction contract and set true for isDaiFund
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
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
     * @dev admin set DaiToken address
     * @param _daiTokenAddress set to the address of DaiToken
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
     * @dev admin set PlanterFund address
     * @param _address set to the address of PlanterFund
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
     * @param _address tree research address
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
     * @param _address local develop address
     */
    function setLocalDevelopmentAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        localDevelopmentAddress = _address;
    }

    /**
     * @dev admin set rescue address to fund
     * @param _address rescue fund address
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
     * @param _address treejer develop address
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
     * @dev fund a tree by RegularSale contract and based on distribution
     * model of tree, shares divide beetwen (planter, referral, research,
     * localDevelopment, insurance, treasury, reserve1 and reserve2)
     * and added to the totalBalances of each part,
     * @param _treeId id of a tree to fund
     * NOTE planterShare and ambassadorShare share transfer to PlanterFund contract
     * and add to totalFund section there
     */
    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterShare,
        uint16 _ambassadorShare,
        uint16 _research,
        uint16 _localDevelopment,
        uint16 _insurance,
        uint16 _treasury,
        uint16 _reserve1,
        uint16 _reserve2
    ) external onlyTreejerContract {
        totalBalances.insurance += (_amount * _insurance) / 10000;

        totalBalances.localDevelopment += (_amount * _localDevelopment) / 10000;

        totalBalances.reserve1 += (_amount * _reserve1) / 10000;

        totalBalances.reserve2 += (_amount * _reserve2) / 10000;

        totalBalances.treasury += (_amount * _treasury) / 10000;

        totalBalances.research += (_amount * _research) / 10000;

        uint256 planterShare = (_amount * _planterShare) / 10000;
        uint256 ambassadorShare = (_amount * _ambassadorShare) / 10000;

        bool success = daiToken.transfer(
            address(planterFundContract),
            planterShare + ambassadorShare
        );

        require(success, "unsuccessful transfer");

        planterFundContract.updateProjectedEarnings(
            _treeId,
            planterShare,
            ambassadorShare
        );

        emit TreeFunded(_treeId, _amount, planterShare + ambassadorShare);
    }

    //TODO : ADD_COMMENT
    function fundTreeBatch(
        uint256 _totalPlanterShare,
        uint256 _totalAmbassadorShare,
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
            _totalPlanterShare + _totalAmbassadorShare
        );

        require(success, "unsuccessful transfer");

        emit TreeFundedBatch();
    }

    //TODO:ADD_COMMENTS
    function transferReferrerDai(uint256 _amount) external onlyTreejerContract {
        require(totalBalances.treasury >= _amount, "Liquidity not enough");

        totalBalances.treasury -= _amount;

        bool success = daiToken.transfer(address(planterFundContract), _amount);

        require(success, "unsuccessful transfer");
    }

    /**
     * @dev admin withdraw {_amount} from research totalFund in case of
     * valid {_amount}  and daiToken transfer to {researchAddress}
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
     * @dev admin withdraw {_amount} from localDevelopment totalFund in case of
     * valid {_amount} and daiToken transfer to {localDevelopmentAddress}
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
     * @dev admin withdraw {_amount} from insurance totalFund in case of
     * valid {_amount} and daiToken transfer to {insuranceAddress}
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

        emit RescueBalanceWithdrew(_amount, insuranceAddress, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from treasury totalFund in case of
     * valid {_amount} and daiToken transfer to {treasuryAddress}
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
     * @dev admin withdraw {_amount} from reserve1 totalFund in case of
     * valid {_amount} and daiToken transfer to {reserve1Address}
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
     * @dev admin withdraw {_amount} from reserve2 totalFund in case of
     * valid {_amount} and daiToken transfer to {reserve2Address}
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
