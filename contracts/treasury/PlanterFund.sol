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
    bool public isPlanterFund;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;
    IERC20Upgradeable public daiToken;

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 localDevelop;
    }

    TotalFunds public totalFunds;

    mapping(uint256 => uint256) public planterFunds;
    mapping(uint256 => uint256) public referralFunds;
    mapping(uint256 => uint256) public plantersPaid;
    mapping(address => uint256) public balances;

    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);
    event PlanterFundSet(
        uint256 treeId,
        uint256 planterAmount,
        uint256 referralAmount
    );

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    modifier onlyTreeFactory() {
        accessRestriction.ifTreeFactory(_msgSender());
        _;
    }

    modifier onlyFundsOrCommunityGifts() {
        accessRestriction.ifFundsOrCommunityGifts(_msgSender());
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isPlanterFund = true;
        accessRestriction = candidateContract;
    }

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set planter contract address
     * @param _address set to the address of planter contract
     */
    function setPlanterContractAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);
        require(candidateContract.isPlanter());
        planterContract = candidateContract;
    }

    function setDaiTokenAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    function setPlanterFunds(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) external onlyFundsOrCommunityGifts {
        planterFunds[_treeId] = _planterFund;
        referralFunds[_treeId] = _referralFund;

        totalFunds.planterFund += _planterFund;
        totalFunds.referralFund += _referralFund;

        emit PlanterFundSet(_treeId, _planterFund, _referralFund);
    }

    /**
     * @dev based on the treeStatus planter charged in every tree update verifying
     *
     * @param _treeId id of a tree to fund
     * @param _planterId  address of planter to fund
     * @param _treeStatus status of tree
     */

    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external onlyTreeFactory {
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
     * @dev planter withdraw {_amount} from planter's balances in case of valid {_amount}
     * and money transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     */
    function withdrawPlanterBalance(uint256 _amount) external ifNotPaused {
        require(
            _amount <= balances[_msgSender()] && _amount > 0,
            "insufficient amount"
        );

        balances[_msgSender()] -= _amount;

        daiToken.transfer(_msgSender(), _amount);

        emit PlanterBalanceWithdrawn(_amount, _msgSender());
    }
}
