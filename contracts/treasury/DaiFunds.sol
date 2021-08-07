// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";

/** @title DaiFunds Contract */

contract DaiFunds is Initializable {
    bool public isDaiFunds;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public daiToken;

    TotalFunds public totalFunds;

    address payable public treeResearchAddress;
    address payable public localDevelopAddress;
    address payable public rescueFundAddress;
    address payable public treejerDevelopAddress;
    address payable public reserveFundAddress1;
    address payable public reserveFundAddress2;

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

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isDaiFunds = true;
        accessRestriction = candidateContract;
    }

    function setDaiTokenAddress(address _daiTokenAddress) external onlyAdmin {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
        daiToken = candidateContract;
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

        daiToken.transfer(
            address(planterFundContract),
            planterFund + referralFund
        );

        planterFundContract.setPlanterFunds(_treeId, planterFund, referralFund);
    }

    /**
     * @dev admin withdraw {_amount} from treeResearch totalFund in case of valid {_amount}
     * and money transfer to {treeResearchAddress}
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

        if (daiToken.transfer(treeResearchAddress, _amount)) {
            emit TreeResearchBalanceWithdrawn(
                _amount,
                treeResearchAddress,
                _reason
            );
        } else {
            totalFunds.treeResearch += _amount;
        }
    }

    /**
     * @dev admin withdraw {_amount} from localDevelop totalFund in case of valid {_amount}
     * and money transfer to {localDevelopAddress}
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

        if (daiToken.transfer(localDevelopAddress, _amount)) {
            emit LocalDevelopBalanceWithdrawn(
                _amount,
                localDevelopAddress,
                _reason
            );
        } else {
            totalFunds.localDevelop += _amount;
        }
    }

    /**
     * @dev admin withdraw {_amount} from rescueFund totalFund in case of valid {_amount}
     * and money transfer to {rescueFundAddress}
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

        if (daiToken.transfer(rescueFundAddress, _amount)) {
            emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
        } else {
            totalFunds.rescueFund += _amount;
        }
    }

    /**
     * @dev admin withdraw {_amount} from treejerDevelop totalFund in case of valid {_amount}
     * and money transfer to {treejerDevelopAddress}
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

        if (daiToken.transfer(treejerDevelopAddress, _amount)) {
            emit TreejerDevelopBalanceWithdrawn(
                _amount,
                treejerDevelopAddress,
                _reason
            );
        } else {
            totalFunds.treejerDevelop += _amount;
        }
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund1 totalFund in case of valid {_amount}
     * and money transfer to {reserveFundAddress1}
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

        if (daiToken.transfer(reserveFundAddress1, _amount)) {
            emit OtherBalanceWithdrawn1(_amount, reserveFundAddress1, _reason);
        } else {
            totalFunds.reserveFund1 += _amount;
        }
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund2 totalFund in case of valid {_amount}
     * and money transfer to {reserveFundAddress2}
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

        if (daiToken.transfer(reserveFundAddress2, _amount)) {
            emit OtherBalanceWithdrawn2(_amount, reserveFundAddress2, _reason);
        } else {
            totalFunds.reserveFund2 += _amount;
        }
    }
}
