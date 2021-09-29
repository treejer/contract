// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";
import "./interfaces/IUniswapV2Router02New.sol";

/** @title WethFunds Contract */

contract WethFunds is Initializable {
    /** NOTE {isWethFunds} set inside the initialize to {true} */
    bool public isWethFunds;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public wethToken;
    IUniswapV2Router02New public uniswapRouter;

    /** NOTE daiToken address */
    address public daiAddress;

    //TODO:ADD_COMMENT
    uint256 public totalDaiToPlanterSwap;

    /** NOTE {totalFunds} is struct of TotalFund that keep total share of
     * treeResearch, localDevelop,rescueFund,treejerDeveop,reserveFund1
     * and reserveFund2
     */
    TotalFunds public totalFunds;

    address public treeResearchAddress;
    address public localDevelopAddress;
    address public rescueFundAddress;
    address public treejerDevelopAddress;
    address public reserveFundAddress1;
    address public reserveFundAddress2;

    struct TotalFunds {
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
    }

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
    event ReserveBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );
    event ReserveBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );
    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    event IncrementalFunded();

    event SwapToPlanterFund(
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

    /** NOTE modifier for check if function is not paused*/
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
     * @dev initialize accessRestriction contract and set true for isWethFunds
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

        isWethFunds = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set DaiToken address
     * @param _daiAddress set to the address of DaiToken
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
     * @dev admin set treeResearch  address to fund
     * @param _address tree research address
     */
    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        treeResearchAddress = _address;
    }

    /**
     * @dev admin set localDevelop  address to fund
     * @param _address local develop address
     */
    function setLocalDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        localDevelopAddress = _address;
    }

    /**
     * @dev admin set rescue address to fund
     * @param _address rescue fund address
     */
    function setRescueFundAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        rescueFundAddress = _address;
    }

    /**
     * @dev admin set treejerDevelop  address to fund
     * @param _address treejer develop address
     */
    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        treejerDevelopAddress = _address;
    }

    /**
     * @dev admin set reserveFund1  address to fund
     * @param _address reserveFund1 address
     */
    function setReserveFund1Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        reserveFundAddress1 = _address;
    }

    /**
     * @dev admin set reserveFund2  address to fund
     * @param _address reserveFund2 address
     */
    function setReserveFund2Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        reserveFundAddress2 = _address;
    }

    /**
     * @dev fund a tree by IncrementalSale or Auction contract and based on distribution
     * model of tree, shares divide beetwen (planter, referral, treeResearch,
     * localDevelop, rescueFund, treejerDevelop, reserveFund1 and reserveFund2)
     * and added to the totalFunds of each part,
     * @param _treeId id of a tree to fund
     * NOTE planterFund and referralFund share first swap to daiToken and then
     * transfer to PlanterFund contract and add to totalFund section there
     */
    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external onlyTreejerContract {
        totalFunds.treeResearch += (_amount * _treeResearch) / 10000;

        totalFunds.localDevelop += (_amount * _localDevelop) / 10000;

        totalFunds.rescueFund += (_amount * _rescueFund) / 10000;

        totalFunds.treejerDevelop += (_amount * _treejerDevelop) / 10000;

        totalFunds.reserveFund1 += (_amount * _reserveFund1) / 10000;

        totalFunds.reserveFund2 += (_amount * _reserveFund2) / 10000;

        _swap(_treeId, _amount, _planterFund, _referralFund);
    }

    /**
     * @dev admin withdraw {_amount} from treeResearch totalFund in case of
     * valid {_amount}  and wethToken transfer to {treeResearchAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreeResearch(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treeResearchAddress)
    {
        require(
            _amount <= totalFunds.treeResearch && _amount > 0,
            "insufficient amount"
        );

        totalFunds.treeResearch -= _amount;

        bool success = wethToken.transfer(treeResearchAddress, _amount);

        require(success, "unsuccessful transfer");

        emit TreeResearchBalanceWithdrawn(
            _amount,
            treeResearchAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from localDevelop totalFund in case of
     * valid {_amount} and wethToken transfer to {localDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawLocalDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(localDevelopAddress)
    {
        require(
            _amount <= totalFunds.localDevelop && _amount > 0,
            "insufficient amount"
        );

        totalFunds.localDevelop -= _amount;

        bool success = wethToken.transfer(localDevelopAddress, _amount);

        require(success, "unsuccessful transfer");

        emit LocalDevelopBalanceWithdrawn(
            _amount,
            localDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from rescueFund totalFund in case of
     * valid {_amount} and wethToken transfer to {rescueFundAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawRescueFund(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(rescueFundAddress)
    {
        require(
            _amount <= totalFunds.rescueFund && _amount > 0,
            "insufficient amount"
        );

        totalFunds.rescueFund -= _amount;

        bool success = wethToken.transfer(rescueFundAddress, _amount);

        require(success, "unsuccessful transfer");

        emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from treejerDevelop totalFund in case of
     * valid {_amount} and wethToken transfer to {treejerDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreejerDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treejerDevelopAddress)
    {
        require(
            _amount <= totalFunds.treejerDevelop && _amount > 0,
            "insufficient amount"
        );

        totalFunds.treejerDevelop -= _amount;

        bool success = wethToken.transfer(treejerDevelopAddress, _amount);

        require(success, "unsuccessful transfer");

        emit TreejerDevelopBalanceWithdrawn(
            _amount,
            treejerDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund1 totalFund in case of
     * valid {_amount} and wethToken transfer to {reserveFundAddress1}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund1(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress1)
    {
        require(
            _amount <= totalFunds.reserveFund1 && _amount > 0,
            "insufficient amount"
        );

        totalFunds.reserveFund1 -= _amount;

        bool success = wethToken.transfer(reserveFundAddress1, _amount);

        require(success, "unsuccessful transfer");

        emit ReserveBalanceWithdrawn1(_amount, reserveFundAddress1, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund2 totalFund in case of
     * valid {_amount} and wethToken transfer to {reserveFundAddress2}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund2(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress2)
    {
        require(
            _amount <= totalFunds.reserveFund2 && _amount > 0,
            "insufficient amount"
        );

        totalFunds.reserveFund2 -= _amount;

        bool success = wethToken.transfer(reserveFundAddress2, _amount);

        require(success, "unsuccessful transfer");

        emit ReserveBalanceWithdrawn2(_amount, reserveFundAddress2, _reason);
    }

    function incrementalFund(
        uint256 _totalPlanterFund,
        uint256 _totalReferralFund,
        uint256 _totalTreeResearch,
        uint256 _totalLocalDevelop,
        uint256 _totalRescueFund,
        uint256 _totalTreejerDevelop,
        uint256 _totalReserveFund1,
        uint256 _totalReserveFund2
    ) external onlyTreejerContract returns (uint256) {
        totalFunds.treeResearch += _totalTreeResearch;

        totalFunds.localDevelop += _totalLocalDevelop;

        totalFunds.rescueFund += _totalRescueFund;

        totalFunds.treejerDevelop += _totalTreejerDevelop;

        totalFunds.reserveFund1 += _totalReserveFund1;

        totalFunds.reserveFund2 += _totalReserveFund2;

        uint256 sumFund = _totalPlanterFund + _totalReferralFund;

        uint256 amount = sumFund > 0 ? _swapExactTokensForTokens(sumFund) : 0;

        emit IncrementalFunded();

        return amount;
    }

    //TODO: ADD_COMMENT
    function swapDaiToPlanters(uint256 _wethMaxUse, uint256 _totalDaiSwap)
        external
        onlyScript
    {
        require(
            _wethMaxUse <= totalFunds.treejerDevelop,
            "Liquidity not enough"
        );

        require(
            _totalDaiSwap > 0 && _totalDaiSwap <= totalDaiToPlanterSwap,
            "totalDaiToPlanterSwap invalid"
        );

        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = daiAddress;

        bool success = wethToken.approve(address(uniswapRouter), _wethMaxUse);

        require(success, "unsuccessful approve");

        uint256[] memory amounts = uniswapRouter.swapTokensForExactTokens(
            _totalDaiSwap,
            _wethMaxUse,
            path,
            address(planterFundContract),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );

        emit SwapToPlanterFund(_wethMaxUse, _totalDaiSwap, amounts[0]);

        totalDaiToPlanterSwap -= _totalDaiSwap;
        totalFunds.treejerDevelop -= amounts[0];
    }

    //TODO: ADD_COMMENT
    function updateDaiSwap(uint256 _amount) external onlyTreejerContract {
        totalDaiToPlanterSwap += _amount;
    }

    /** @dev private function to swap {_amount} wethToken to daiToken
     * @param _treeId id of tree that funded
     * @param _amount amount to swap
     * @param _planterFund planter share
     * @param _referralFund referral share
     */
    function _swap(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund
    ) private {
        uint256 planterFund = (_amount * _planterFund) / 10000;
        uint256 referralFund = (_amount * _referralFund) / 10000;

        uint256 sumFund = planterFund + referralFund;
        uint16 sumPercent = _planterFund + _referralFund;

        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = daiAddress;

        uint256 amount = sumFund > 0 ? _swapExactTokensForTokens(sumFund) : 0;

        planterFundContract.setPlanterFunds(
            _treeId,
            (_planterFund * amount) / sumPercent,
            (_referralFund * amount) / sumPercent
        );

        emit TreeFunded(_treeId, _amount, planterFund + referralFund);
    }

    //TODO: ADD_COMMENT
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
