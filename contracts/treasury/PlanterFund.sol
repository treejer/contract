// SPDX-License-Identifier: MIT

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
    uint256 public withdrawThreshold;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;
    IERC20Upgradeable public daiToken;

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 localDevelop;
    }

    /** NOTE {totalFunds} is struct of TotalFund that keep total share of
     * planterFund, referralFund, localDevelop
     */
    TotalFunds public totalFunds;

    /** NOTE mapping of treeId to planterFunds*/
    mapping(uint256 => uint256) public planterFunds;

    /** NOTE mapping of treeId to referralFunds*/
    mapping(uint256 => uint256) public referralFunds;

    /** NOTE  mpping of treeId to planterPaid balance*/
    mapping(uint256 => uint256) public plantersPaid;

    /** NOTE mapping of planter address to planter balance*/
    mapping(address => uint256) public balances;

    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);
    event PlanterFundSet(
        uint256 treeId,
        uint256 planterAmount,
        uint256 referralAmount
    );

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
        withdrawThreshold = .5 ether;
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
     * @param _amount is withdraw treshold
     */
    function setWithdrawThreshold(uint256 _amount) external onlyDataManager {
        withdrawThreshold = _amount;
    }

    /**
     * @dev set planterFunds and refferalFunds of a tree with id {_treeId}
     * and add {_planterFund} to planterFund part of totalFunds and add
     * {_referralFund} to referralFund part of totalFunds
     */
    function setPlanterFunds(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) external onlyTreejerContract {
        planterFunds[_treeId] = _planterFund;
        referralFunds[_treeId] = _referralFund;

        totalFunds.planterFund += _planterFund;
        totalFunds.referralFund += _referralFund;

        emit PlanterFundSet(_treeId, _planterFund, _referralFund);
    }

    /**
     * @dev based on the {_treeStatus} planter charged in every tree update verifying
     * @param _treeId id of a tree to fund
     * @param _planterId  address of planter to fund
     * @param _treeStatus status of tree
     */

    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external onlyTreejerContract {
        require(planterFunds[_treeId] > 0, "planter fund not exist");

        (
            bool getBool,
            address gottenOrganizationAddress,
            address gottenReferralAddress,
            uint256 gottenPortion
        ) = planterContract.getPlanterPaymentPortion(_planterId);

        if (getBool) {
            uint256 totalPayablePlanter;

            if (_treeStatus > 25920) {
                //25920 = 30 * 24 * 36

                totalPayablePlanter =
                    planterFunds[_treeId] -
                    plantersPaid[_treeId];
            } else {
                totalPayablePlanter =
                    ((planterFunds[_treeId] * _treeStatus) / 25920) -
                    plantersPaid[_treeId];
            }

            if (totalPayablePlanter > 0) {
                uint256 totalPayableRefferal = (referralFunds[_treeId] *
                    totalPayablePlanter) / planterFunds[_treeId];

                //referral calculation section

                totalFunds.referralFund -= totalPayableRefferal;

                if (gottenReferralAddress == address(0)) {
                    totalFunds.localDevelop += totalPayableRefferal;
                } else {
                    balances[gottenReferralAddress] += totalPayableRefferal;
                }

                totalFunds.planterFund -= totalPayablePlanter;

                //Organization calculation section
                uint256 fullPortion = 10000;

                balances[gottenOrganizationAddress] +=
                    (totalPayablePlanter * (fullPortion - gottenPortion)) /
                    fullPortion;

                //planter calculation section

                plantersPaid[_treeId] += totalPayablePlanter;

                balances[_planterId] +=
                    (totalPayablePlanter * gottenPortion) /
                    fullPortion;

                emit PlanterFunded(_treeId, _planterId, totalPayablePlanter);
            }
        }
    }

    /**
     * @dev planter withdraw {_amount} from planter's balances in case of
     * valid {_amount} and daiToken transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     */
    function withdrawPlanterBalance(uint256 _amount) external ifNotPaused {
        require(
            _amount <= balances[_msgSender()] && _amount >= withdrawThreshold,
            "insufficient amount"
        );

        balances[_msgSender()] -= _amount;

        bool success = daiToken.transfer(_msgSender(), _amount);

        require(success, "unsuccessful transfer");

        emit PlanterBalanceWithdrawn(_amount, _msgSender());
    }
}
