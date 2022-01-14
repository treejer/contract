// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/IAccessRestriction.sol";
import "../planter/IPlanter.sol";
import "../gsn/RelayRecipient.sol";

import "./IPlanterFund.sol";

/** @title PlanterFund Contract */

contract PlanterFund is Initializable, RelayRecipient, IPlanterFund {
    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 noAmbsassador;
    }

    /** NOTE {isPlanterFund} set inside the initialize to {true} */
    bool public override isPlanterFund;

    /** NOTE minimum withdrawable amount */
    uint256 public override minWithdrawable;

    /** NOTE outgoing address */
    address public override outgoingAddress;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;
    IERC20Upgradeable public daiToken;

    /** NOTE totalBalances keep total share of
     * planter, ambassador, noAmbsassador
     */
    TotalBalances public override totalBalances;

    /** NOTE mapping of treeId to planterProjectedEarning*/
    mapping(uint256 => uint256) public override treeToPlanterProjectedEarning;

    /** NOTE mapping of treeId to ambassadorProjectedEarning*/
    mapping(uint256 => uint256)
        public
        override treeToAmbassadorProjectedEarning;

    /** NOTE mpping of treeId to treeToPlanterTotalClaimed balance*/
    mapping(uint256 => uint256) public override treeToPlanterTotalClaimed;

    /** NOTE mapping of planter address to planter balance*/
    mapping(address => uint256) public override balances;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(_msgSender());
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc IPlanterFund
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isPlanterFund = true;
        minWithdrawable = .5 ether;
        accessRestriction = candidateContract;
    }

    /// @inheritdoc IPlanterFund
    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /// @inheritdoc IPlanterFund
    function setPlanterContractAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanter candidateContract = IPlanter(_address);
        require(candidateContract.isPlanter());
        planterContract = candidateContract;
    }

    /// @inheritdoc IPlanterFund
    function setDaiTokenAddress(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /// @inheritdoc IPlanterFund
    function setOutgoingAddress(address payable _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        outgoingAddress = _address;
    }

    /// @inheritdoc IPlanterFund
    function updateWithdrawableAmount(uint256 _amount)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        minWithdrawable = _amount;

        emit MinWithdrawableAmountUpdated();
    }

    /// @inheritdoc IPlanterFund
    function updateProjectedEarnings(
        uint256 _treeId,
        uint256 _planterAmount,
        uint256 _ambassadorAmount
    ) external override onlyTreejerContract {
        treeToPlanterProjectedEarning[_treeId] = _planterAmount;
        treeToAmbassadorProjectedEarning[_treeId] = _ambassadorAmount;

        totalBalances.planter += _planterAmount;
        totalBalances.ambassador += _ambassadorAmount;

        emit ProjectedEarningUpdated(
            _treeId,
            _planterAmount,
            _ambassadorAmount
        );
    }

    /// @inheritdoc IPlanterFund
    function updatePlanterTotalClaimed(
        uint256 _treeId,
        address _planter,
        uint64 _treeStatus
    ) external override onlyTreejerContract {
        require(
            treeToPlanterProjectedEarning[_treeId] > 0,
            "Projected earning zero"
        );

        (
            bool exists,
            address organizationAddress,
            address ambassadorAddress,
            uint256 share
        ) = planterContract.getOrganizationMemberData(_planter);

        if (exists) {
            uint256 totalPayableAmountToPlanter;

            if (_treeStatus > 25920) {
                //25920 = 30 * 24 * 36

                totalPayableAmountToPlanter =
                    treeToPlanterProjectedEarning[_treeId] -
                    treeToPlanterTotalClaimed[_treeId];
            } else {
                totalPayableAmountToPlanter =
                    ((treeToPlanterProjectedEarning[_treeId] * _treeStatus) /
                        25920) -
                    treeToPlanterTotalClaimed[_treeId];
            }

            if (totalPayableAmountToPlanter > 0) {
                uint256 totalPayableAmountToAmbassador = (treeToAmbassadorProjectedEarning[
                        _treeId
                    ] * totalPayableAmountToPlanter) /
                        treeToPlanterProjectedEarning[_treeId];

                //referral calculation section

                totalBalances.ambassador -= totalPayableAmountToAmbassador;

                if (ambassadorAddress == address(0)) {
                    totalBalances
                        .noAmbsassador += totalPayableAmountToAmbassador;
                } else {
                    balances[
                        ambassadorAddress
                    ] += totalPayableAmountToAmbassador;
                }

                totalBalances.planter -= totalPayableAmountToPlanter;

                balances[organizationAddress] +=
                    (totalPayableAmountToPlanter * (10000 - share)) /
                    10000;

                //planter calculation section

                treeToPlanterTotalClaimed[
                    _treeId
                ] += totalPayableAmountToPlanter;

                balances[_planter] +=
                    (totalPayableAmountToPlanter * share) /
                    10000;

                emit PlanterTotalClaimedUpdated(
                    _treeId,
                    _planter,
                    totalPayableAmountToPlanter,
                    ambassadorAddress
                );
            }
        }
    }

    /// @inheritdoc IPlanterFund
    function withdrawBalance(uint256 _amount) external override ifNotPaused {
        require(
            _amount <= balances[_msgSender()] && _amount >= minWithdrawable,
            "Invalid amount"
        );

        balances[_msgSender()] -= _amount;

        bool success = daiToken.transfer(_msgSender(), _amount);

        require(success, "Unsuccessful transfer");

        emit BalanceWithdrew(_amount, _msgSender());
    }

    /// @inheritdoc IPlanterFund
    function withdrawNoAmbsassadorBalance(
        uint256 _amount,
        string calldata _reason
    ) external override onlyAdmin validAddress(outgoingAddress) {
        require(
            _amount <= totalBalances.noAmbsassador && _amount > 0,
            "Invalid amount"
        );

        totalBalances.noAmbsassador -= _amount;

        bool success = daiToken.transfer(outgoingAddress, _amount);

        require(success, "Unsuccessful transfer");

        emit NoAmbsassadorBalanceWithdrew(_amount, outgoingAddress, _reason);
    }

    //TODO:remove
    function withdrawContractBalance(address _wallet)
        external
        override
        onlyAdmin
        validAddress(_wallet)
    {
        bool success = daiToken.transfer(
            _wallet,
            daiToken.balanceOf(address(this))
        );
        require(success);
    }
}
