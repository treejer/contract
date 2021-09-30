// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/IAccessRestriction.sol";
import "../planter/IPlanter.sol";
import "../gsn/RelayRecipient.sol";

/** @title PlanterFund Contract */

contract PlanterFund is Initializable, RelayRecipient {
    /** NOTE {isPlanterFund} set inside the initialize to {true} */
    bool public isPlanterFund;
    uint256 public minWithdrawable;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;
    IERC20Upgradeable public daiToken;

    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 localDevelopment;
    }

    /** NOTE {totalBalances} is struct of TotalBalances that keep total share of
     * planter, ambassador, localDevelopment
     */
    TotalBalances public totalBalances;

    /** NOTE mapping of treeId to planterProjectedEarning*/
    mapping(uint256 => uint256) public treeToPlanterProjectedEarning;

    /** NOTE mapping of treeId to ambassadorProjectedEarning*/
    mapping(uint256 => uint256) public treeToAmbassadorProjectedEarning;

    /** NOTE  mpping of treeId to treeToPlanterTotalClaimed balance*/
    mapping(uint256 => uint256) public treeToPlanterTotalClaimed;

    /** NOTE mapping of planter address to planter balance*/
    mapping(address => uint256) public balances;

    event PlanterTotalClaimedUpdated(
        uint256 treeId,
        address planter,
        uint256 amount,
        address ambassador
    );
    event BalanceWithdrew(uint256 amount, address account);
    event ProjectedEarningUpdated(
        uint256 treeId,
        uint256 planterAmount,
        uint256 ambassadorAmount
    );

    event MinWithdrawableAmountUpdated();

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

    /** NOTE modifier for check if function is not paused*/
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
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isPlanterFund
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

        isPlanterFund = true;
        minWithdrawable = .5 ether;
        accessRestriction = candidateContract;
    }

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set Planter contract address
     * @param _address set to the address of Planter contract
     */
    function setPlanterContractAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);
        require(candidateContract.isPlanter());
        planterContract = candidateContract;
    }

    /**
     * @dev admin set DaiToken contract address
     * @param _address set to the address of DaiToken contract
     */
    function setDaiTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /** @dev admin can set the minimum amount to withdraw
     * @param _amount is min withdrawable amount
     */
    function updateWithdrawableAmount(uint256 _amount)
        external
        onlyDataManager
    {
        minWithdrawable = _amount;

        emit MinWithdrawableAmountUpdated();
    }

    /**
     * @dev set treeToPlanterProjectedEarning and treeToAmbassadorProjectedEarning
     * of a tree with id {_treeId} and add {_planterAmount} to plante part of
     * totalBalances and add {_ambassadorAmount} to _ambassador part of totalBalances
     */
    function updateProjectedEarnings(
        uint256 _treeId,
        uint256 _planterAmount,
        uint256 _ambassadorAmount
    ) external onlyTreejerContract {
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

    /**
     * @dev based on the {_treeStatus} planter charged in every tree update verifying
     * @param _treeId id of a tree to fund
     * @param _planter  address of planter to fund
     * @param _treeStatus status of tree
     */

    function updatePlanterTotalClaimed(
        uint256 _treeId,
        address _planter,
        uint64 _treeStatus
    ) external onlyTreejerContract {
        require(
            treeToPlanterProjectedEarning[_treeId] > 0,
            "planter fund not exist"
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
                        .localDevelopment += totalPayableAmountToAmbassador;
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

    /**
     * @dev planter withdraw {_amount} from planter's balances in case of
     * valid {_amount} and daiToken transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     */
    function withdrawBalance(uint256 _amount) external ifNotPaused {
        require(
            _amount <= balances[_msgSender()] && _amount >= minWithdrawable,
            "insufficient amount"
        );

        balances[_msgSender()] -= _amount;

        bool success = daiToken.transfer(_msgSender(), _amount);

        require(success, "unsuccessful transfer");

        emit BalanceWithdrew(_amount, _msgSender());
    }
}
