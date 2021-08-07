// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";
import "./../uniswap/interfaces/Uniswap.sol";

/** @title WethFunds Contract */

contract WethFunds is Initializable {
    bool public isWethFunds;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public wethToken;
    IUniswapV2Router public uniswapRouter;

    TotalFunds public totalFunds;

    address public DaiAddress;

    address payable public treeResearchAddress;
    address payable public localDevelopAddress;
    address payable public rescueFundAddress;
    address payable public treejerDevelopAddress;
    address payable public reserveFundAddress1;
    address payable public reserveFundAddress2;

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
    }

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isWethFunds = true;
        accessRestriction = candidateContract;
    }

    function setDaiAddress(address _daiAddress) external onlyAdmin {
        DaiAddress = _daiAddress;
    }

    function setWethTokenAddress(address _wethTokenAddress) external onlyAdmin {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _wethTokenAddress
        );
        wethToken = candidateContract;
    }

    function setUniswapRouterAddress(address _uniswapRouterAddress)
        external
        onlyAdmin
    {
        IUniswapV2Router candidateContract = IUniswapV2Router(
            _uniswapRouterAddress
        );

        uniswapRouter = candidateContract;
    }

    function setPlanterFundContractAddress(address _address)
        external
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

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
    ) external {
        accessRestriction.ifIncrementalSellOrAuctionOrRegularSell(msg.sender);

        totalFunds.rescueFund += (_amount * _rescueFund) / 10000;

        totalFunds.localDevelop += (_amount * _localDevelop) / 10000;

        totalFunds.reserveFund1 += (_amount * _reserveFund1) / 10000;

        totalFunds.reserveFund2 += (_amount * _reserveFund2) / 10000;

        totalFunds.treejerDevelop += (_amount * _treejerDevelop) / 10000;

        totalFunds.treeResearch += ((_amount * _treeResearch) / 10000);

        uint256 planterFund = (_amount * _planterFund) / 10000;
        uint256 referralFund = (_amount * _referralFund) / 10000;

        _swap(_treeId, planterFund, referralFund);
    }

    function _swap(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) private {
        uint256 sumFund = _planterFund + _referralFund;

        address[] memory path;
        path = new address[](2);

        path[0] = address(wethToken);
        path[1] = DaiAddress;

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            sumFund,
            1,
            path,
            address(planterFundContract),
            block.timestamp + 15
        );

        planterFundContract.setPlanterFunds(
            _treeId,
            (_planterFund * amounts[amounts.length - 1]) / sumFund,
            (_referralFund * amounts[amounts.length - 1]) / sumFund
        );
    }
}
