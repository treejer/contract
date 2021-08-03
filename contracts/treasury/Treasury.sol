// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../planter/IPlanter.sol";
import "../gsn/RelayRecipient.sol";

/** @title Treasury Contract */

contract Treasury is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private fundDistributionCount;

    uint256 constant MAX_UINT256 = 2**256 - 1;
    bool public isTreasury;
    uint256 public maxAssignedIndex;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;

    TotalFunds public totalFunds;

    address payable public treeResearchAddress;
    address payable public localDevelopAddress;
    address payable public rescueFundAddress;
    address payable public treejerDevelopAddress;
    address payable public reserveFundAddress1;
    address payable public reserveFundAddress2;

    struct FundDistribution {
        uint16 planterFund;
        uint16 referralFund;
        uint16 treeResearch;
        uint16 localDevelop;
        uint16 rescueFund;
        uint16 treejerDevelop;
        uint16 reserveFund1;
        uint16 reserveFund2;
        uint16 exists;
    }

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

    struct AssignModel {
        uint256 startingTreeId;
        uint256 distributionModelId;
    }

    AssignModel[] public assignModels;

    mapping(uint256 => FundDistribution) public fundDistributions;
    mapping(uint256 => uint256) public planterFunds;
    mapping(uint256 => uint256) public referralFunds;
    mapping(uint256 => uint256) public plantersPaid;
    mapping(address => uint256) public balances;

    event DistributionModelAdded(uint256 modelId);
    event TreeFunded(uint256 treeId, uint256 amount, uint256 modelId);
    event DistributionModelOfTreeNotExist(string description);
    event FundDistributionModelAssigned(
        uint256 startingTreeId,
        uint256 endingTreeId,
        uint256 distributionModelId
    );
    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);

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
        accessRestriction.ifAdmin(_msgSender());
        _;
    }
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }
    modifier onlyAuction() {
        accessRestriction.ifAuction(_msgSender());
        _;
    }
    modifier onlyTreeFactory() {
        accessRestriction.ifTreeFactory(_msgSender());
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

        isTreasury = true;
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

    /**
     * @dev admin set treeResearch  address to fund
     * @param _address tree research address
     */
    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
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
    {
        localDevelopAddress = _address;
    }

    /**
     * @dev admin set rescue address to fund
     * @param _address rescue fund address
     */
    function setRescueFundAddress(address payable _address) external onlyAdmin {
        rescueFundAddress = _address;
    }

    /**
     * @dev admin set treejerDevelop  address to fund
     * @param _address treejer develop address
     */
    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
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
    {
        reserveFundAddress2 = _address;
    }

    /**
     * @dev admin add a model for funding distribution that sum of the inputs must be 10000
     * @param _planter planter share
     * @param _referral referral share
     * @param _treeResearch tree research share
     * @param _localDevelop local develop share
     * @param _rescueFund rescue share
     * @param _treejerDevelop treejer develop share
     * @param _reserveFund1 other fund1 share
     * @param _reserveFund2 other fund2 share
     */
    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external onlyAdmin {
        uint16 totalSum = _add(
            _rescueFund,
            _add(_localDevelop, _add(_treeResearch, _add(_planter, _referral)))
        );

        require(
            _add(
                _reserveFund2,
                _add(_reserveFund1, _add(_treejerDevelop, totalSum))
            ) == 10000,
            "sum must be 10000"
        );

        fundDistributions[fundDistributionCount.current()] = FundDistribution(
            _planter,
            _referral,
            _treeResearch,
            _localDevelop,
            _rescueFund,
            _treejerDevelop,
            _reserveFund1,
            _reserveFund2,
            1
        );

        emit DistributionModelAdded(fundDistributionCount.current());

        fundDistributionCount.increment();
    }

    /**
     * @dev admin assgign a funding distribution model to trees start from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _distributionModelId distribution model id to assign
     */
    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external onlyAdmin {
        require(
            fundDistributions[_distributionModelId].exists > 0,
            "Distribution model not found"
        );

        AssignModel[] memory localAssigns = assignModels;

        delete assignModels;

        uint256 checkFlag = 0;

        for (uint256 i = 0; i < localAssigns.length; i++) {
            if (localAssigns[i].startingTreeId < _startTreeId) {
                assignModels.push(localAssigns[i]);
            } else {
                if (checkFlag == 0) {
                    assignModels.push(
                        AssignModel(_startTreeId, _distributionModelId)
                    );
                    checkFlag = 1;
                }
                if (checkFlag == 1) {
                    if (_endTreeId == 0 && _startTreeId != 0) {
                        checkFlag = 5;
                        break;
                    }
                    if (
                        i > 0 && _endTreeId + 1 < localAssigns[i].startingTreeId
                    ) {
                        assignModels.push(
                            AssignModel(
                                _endTreeId + 1,
                                localAssigns[i - 1].distributionModelId
                            )
                        );
                        checkFlag = 2;
                    }
                }
                if (checkFlag == 2) {
                    assignModels.push(localAssigns[i]);
                }
            }
        }

        if (checkFlag == 0) {
            assignModels.push(AssignModel(_startTreeId, _distributionModelId));
            if (_endTreeId == 0 && _startTreeId != 0) {
                checkFlag = 5;
            } else {
                checkFlag = 1;
            }
        }

        if (checkFlag == 5) {
            maxAssignedIndex = MAX_UINT256;
        }

        if (checkFlag == 1) {
            if (maxAssignedIndex < _endTreeId) {
                maxAssignedIndex = _endTreeId;
            } else if (localAssigns.length > 0) {
                assignModels.push(
                    AssignModel(
                        _endTreeId + 1,
                        localAssigns[localAssigns.length - 1]
                            .distributionModelId
                    )
                );
            }
        }

        emit FundDistributionModelAssigned(
            _startTreeId,
            _endTreeId,
            _distributionModelId
        );
    }

    /**
     * @dev fund a tree by Auction or RegularSell contracts and based on distribution
     * model of tree shares divide beetwen community
     * @param _treeId id of a tree to fund
     */
    function fundTree(uint256 _treeId) external payable {
        accessRestriction.ifIncrementalSellOrAuctionOrRegularSell(_msgSender());

        uint256 _modelId = assignModels[_findTreeDistributionModelId(_treeId)]
            .distributionModelId;

        FundDistribution memory dm = fundDistributions[_modelId];

        planterFunds[_treeId] = (msg.value * dm.planterFund) / 10000;

        referralFunds[_treeId] = (msg.value * dm.referralFund) / 10000;

        totalFunds.referralFund += (msg.value * dm.referralFund) / 10000;

        totalFunds.localDevelop += (msg.value * dm.localDevelop) / 10000;

        totalFunds.reserveFund1 += (msg.value * dm.reserveFund1) / 10000;

        totalFunds.reserveFund2 += (msg.value * dm.reserveFund2) / 10000;

        totalFunds.planterFund += (msg.value * dm.planterFund) / 10000;
        totalFunds.rescueFund += (msg.value * dm.rescueFund) / 10000;

        totalFunds.treejerDevelop += (msg.value * dm.treejerDevelop) / 10000;

        totalFunds.treeResearch += ((msg.value * dm.treeResearch) / 10000);

        emit TreeFunded(_treeId, msg.value, _modelId);
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
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool)
    {
        if (assignModels.length == 0) {
            return false;
        }

        return _treeId >= assignModels[0].startingTreeId;
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

        if (treeResearchAddress.send(_amount)) {
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

        if (localDevelopAddress.send(_amount)) {
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

        if (rescueFundAddress.send(_amount)) {
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

        if (treejerDevelopAddress.send(_amount)) {
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

        if (reserveFundAddress1.send(_amount)) {
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

        if (reserveFundAddress2.send(_amount)) {
            emit OtherBalanceWithdrawn2(_amount, reserveFundAddress2, _reason);
        } else {
            totalFunds.reserveFund2 += _amount;
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

        if (payable(_msgSender()).send(_amount)) {
            emit PlanterBalanceWithdrawn(_amount, _msgSender());
        } else {
            balances[_msgSender()] += _amount;
        }
    }

    /**
     * @dev private function to find index of assignModels to {_treeId}
     * @param _treeId id of tree to find assignModels of it
     */
    function _findTreeDistributionModelId(uint256 _treeId)
        private
        returns (uint256)
    {
        uint256 i = 0;

        for (i; i < assignModels.length; i++) {
            if (assignModels[i].startingTreeId > _treeId) {
                require(i > 0, "invalid fund model");
                return i - 1;
            }
        }

        if (_treeId > maxAssignedIndex) {
            emit DistributionModelOfTreeNotExist(
                "there is no assigned values for this treeId"
            );
        }
        require(i > 0, "invalid fund model");
        return i - 1;
    }

    /**
     * @dev privte function to calculate sum of two number safely
     * @param a input 1
     * @param b input 2
     * @return sum of inputs thar is uint256
     */

    function _add(uint16 a, uint16 b) private pure returns (uint16) {
        uint16 c = a + b;

        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}
