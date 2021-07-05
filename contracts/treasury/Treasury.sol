// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../planter/IPlanter.sol";
import "../gsn/RelayRecipient.sol";

contract Treasury is Initializable, RelayRecipient {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeMathUpgradeable for uint256;

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
    address payable public otherFundAddress1;
    address payable public otherFundAddress2;

    struct FundDistribution {
        uint16 planterFund;
        uint16 referralFund;
        uint16 treeResearch;
        uint16 localDevelop;
        uint16 rescueFund;
        uint16 treejerDevelop;
        uint16 otherFund1;
        uint16 otherFund2;
    }

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 otherFund1;
        uint256 otherFund2;
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
    modifier onlyGenesisTree() {
        accessRestriction.ifGenesisTree(_msgSender());
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

        totalFunds = TotalFunds(0, 0, 0, 0, 0, 0, 0, 0);
    }

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    function setPlanterContractAddress(address _address) external onlyAdmin {
        IPlanter candidateContract = IPlanter(_address);
        require(candidateContract.isPlanter());
        planterContract = candidateContract;
    }

    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
    {
        treeResearchAddress = _address;
    }

    function setLocalDevelopAddress(address payable _address)
        external
        onlyAdmin
    {
        localDevelopAddress = _address;
    }

    function setRescueFundAddress(address payable _address) external onlyAdmin {
        rescueFundAddress = _address;
    }

    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
    {
        treejerDevelopAddress = _address;
    }

    function setOtherFund1Address(address payable _address) external onlyAdmin {
        otherFundAddress1 = _address;
    }

    function setOtherFund2Address(address payable _address) external onlyAdmin {
        otherFundAddress2 = _address;
    }

    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _otherFund1,
        uint16 _otherFund2
    ) external onlyAdmin {
        uint16 totalSum = _add(
            _rescueFund,
            _add(_localDevelop, _add(_treeResearch, _add(_planter, _referral)))
        );

        require(
            _add(
                _otherFund2,
                _add(_otherFund1, _add(_treejerDevelop, totalSum))
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
            _otherFund1,
            _otherFund2
        );

        fundDistributionCount.increment();
    }

    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external onlyAdmin {
        require(
            fundDistributions[_distributionModelId].planterFund > 0,
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
                        i > 0 &&
                        _endTreeId.add(1) < localAssigns[i].startingTreeId
                    ) {
                        assignModels.push(
                            AssignModel(
                                _endTreeId.add(1),
                                localAssigns[i.sub(1)].distributionModelId
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
                        _endTreeId.add(1),
                        localAssigns[localAssigns.length.sub(1)]
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

    function fundTree(uint256 _treeId) external payable {
        require(
            accessRestriction.isAuction(_msgSender()),
            "only auction can access"
        );

        FundDistribution memory dm = fundDistributions[
            assignModels[_findTreeDistributionModelId(_treeId)]
            .distributionModelId
        ];

        planterFunds[_treeId] = msg.value.mul(dm.planterFund).div(10000);

        referralFunds[_treeId] = msg.value.mul(dm.referralFund).div(10000);

        totalFunds.referralFund = totalFunds.referralFund.add(
            msg.value.mul(dm.referralFund).div(10000)
        );

        totalFunds.localDevelop = totalFunds.localDevelop.add(
            msg.value.mul(dm.localDevelop).div(10000)
        );

        totalFunds.otherFund1 = totalFunds.otherFund1.add(
            msg.value.mul(dm.otherFund1).div(10000)
        );

        totalFunds.otherFund2 = totalFunds.otherFund2.add(
            msg.value.mul(dm.otherFund2).div(10000)
        );

        totalFunds.planterFund = totalFunds.planterFund.add(
            msg.value.mul(dm.planterFund).div(10000)
        );

        totalFunds.rescueFund = totalFunds.rescueFund.add(
            msg.value.mul(dm.rescueFund).div(10000)
        );

        totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(
            msg.value.mul(dm.treejerDevelop).div(10000)
        );

        totalFunds.treeResearch = totalFunds.treeResearch.add(
            msg.value.mul(dm.treeResearch).div(10000)
        );
    }

    function fundPlanter(
        uint256 _treeId,
        address payable _planterId,
        uint64 _treeStatus
    ) external onlyGenesisTree {
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
                totalPayablePlanter = planterFunds[_treeId].sub(
                    plantersPaid[_treeId]
                );
            } else {
                totalPayablePlanter = planterFunds[_treeId]
                .mul(_treeStatus)
                .div(25920)
                .sub(plantersPaid[_treeId]);
            }

            if (totalPayablePlanter > 0) {
                uint256 totalPayableRefferal = referralFunds[_treeId]
                .mul(totalPayablePlanter)
                .div(planterFunds[_treeId]);

                //referral calculation section
                totalFunds.referralFund = totalFunds.referralFund.sub(
                    totalPayableRefferal
                );

                if (gottenReferralAddress == address(0)) {
                    totalFunds.localDevelop = totalFunds.localDevelop.add(
                        totalPayableRefferal
                    );
                } else {
                    balances[gottenReferralAddress] = balances[
                        gottenReferralAddress
                    ]
                    .add(totalPayableRefferal);
                }

                totalFunds.planterFund = totalFunds.planterFund.sub(
                    totalPayablePlanter
                );

                //Organization calculation section
                uint256 fullPortion = 10000;
                balances[gottenOrganizationAddress] = balances[
                    gottenOrganizationAddress
                ]
                .add(totalPayablePlanter.mul(fullPortion.sub(gottenPortion)));

                //planter calculation section
                plantersPaid[_treeId] = plantersPaid[_treeId].add(
                    totalPayablePlanter
                );

                balances[_planterId] = balances[_planterId].add(
                    totalPayablePlanter.mul(gottenPortion)
                );

                emit PlanterFunded(_treeId, _planterId, totalPayablePlanter);
            }
        }
    }

    function distributionModelExistance(uint256 _treeId)
        external
        view
        onlyAuction
        returns (bool)
    {
        if (assignModels.length == 0) {
            return false;
        }

        return
            _treeId >= assignModels[0].startingTreeId &&
            _treeId <= maxAssignedIndex;
    }

    // function withdrawGb(uint256 _amount, string memory _reason)
    //     external
    //     ifNotPaused
    //     onlyAdmin
    //     validAddress(gbFundAddress)
    // {
    //     require(
    //         _amount <= totalFunds.gbFund && _amount > 0,
    //         "insufficient amount"
    //     );

    //     totalFunds.gbFund = totalFunds.gbFund.sub(_amount);

    //     if (gbFundAddress.send(_amount)) {
    //         emit GbBalanceWithdrawn(_amount, gbFundAddress, _reason);
    //     } else {
    //         totalFunds.gbFund = totalFunds.gbFund.add(_amount);
    //     }
    // }

    function withdrawTreeResearch(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treeResearchAddress)
    {
        require(
            _amount <= totalFunds.treeResearch && _amount > 0,
            "insufficient amount"
        );

        totalFunds.treeResearch = totalFunds.treeResearch.sub(_amount);

        if (treeResearchAddress.send(_amount)) {
            emit TreeResearchBalanceWithdrawn(
                _amount,
                treeResearchAddress,
                _reason
            );
        } else {
            totalFunds.treeResearch = totalFunds.treeResearch.add(_amount);
        }
    }

    function withdrawLocalDevelop(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(localDevelopAddress)
    {
        require(
            _amount <= totalFunds.localDevelop && _amount > 0,
            "insufficient amount"
        );

        totalFunds.localDevelop = totalFunds.localDevelop.sub(_amount);

        if (localDevelopAddress.send(_amount)) {
            emit LocalDevelopBalanceWithdrawn(
                _amount,
                localDevelopAddress,
                _reason
            );
        } else {
            totalFunds.localDevelop = totalFunds.localDevelop.add(_amount);
        }
    }

    function withdrawRescueFund(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(rescueFundAddress)
    {
        require(
            _amount <= totalFunds.rescueFund && _amount > 0,
            "insufficient amount"
        );

        totalFunds.rescueFund = totalFunds.rescueFund.sub(_amount);

        if (rescueFundAddress.send(_amount)) {
            emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
        } else {
            totalFunds.rescueFund = totalFunds.rescueFund.add(_amount);
        }
    }

    function withdrawTreejerDevelop(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treejerDevelopAddress)
    {
        require(
            _amount <= totalFunds.treejerDevelop && _amount > 0,
            "insufficient amount"
        );

        totalFunds.treejerDevelop = totalFunds.treejerDevelop.sub(_amount);

        if (treejerDevelopAddress.send(_amount)) {
            emit TreejerDevelopBalanceWithdrawn(
                _amount,
                treejerDevelopAddress,
                _reason
            );
        } else {
            totalFunds.treejerDevelop = totalFunds.treejerDevelop.add(_amount);
        }
    }

    function withdrawOtherFund1(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(otherFundAddress1)
    {
        require(
            _amount <= totalFunds.otherFund1 && _amount > 0,
            "insufficient amount"
        );

        totalFunds.otherFund1 = totalFunds.otherFund1.sub(_amount);

        if (otherFundAddress1.send(_amount)) {
            emit OtherBalanceWithdrawn1(_amount, otherFundAddress1, _reason);
        } else {
            totalFunds.otherFund1 = totalFunds.otherFund1.add(_amount);
        }
    }

    function withdrawOtherFund2(uint256 _amount, string memory _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(otherFundAddress2)
    {
        require(
            _amount <= totalFunds.otherFund2 && _amount > 0,
            "insufficient amount"
        );

        totalFunds.otherFund2 = totalFunds.otherFund2.sub(_amount);

        if (otherFundAddress2.send(_amount)) {
            emit OtherBalanceWithdrawn2(_amount, otherFundAddress2, _reason);
        } else {
            totalFunds.otherFund2 = totalFunds.otherFund2.add(_amount);
        }
    }

    function withdrawPlanterBalance(uint256 _amount) external ifNotPaused {
        require(
            _amount <= balances[_msgSender()] && _amount > 0,
            "insufficient amount"
        );

        balances[_msgSender()] = balances[_msgSender()].sub(_amount);

        if (_msgSender().send(_amount)) {
            emit PlanterBalanceWithdrawn(_amount, _msgSender());
        } else {
            balances[_msgSender()] = balances[_msgSender()].add(_amount);
        }
    }

    function _findTreeDistributionModelId(uint256 _treeId)
        private
        returns (uint256)
    {
        uint256 i = 0;

        for (i; i < assignModels.length; i++) {
            if (assignModels[i].startingTreeId > _treeId) {
                return i.sub(1, "invalid fund model");
            }
        }

        if (_treeId > maxAssignedIndex) {
            emit DistributionModelOfTreeNotExist(
                "there is no assigned values for this treeId"
            );
        }

        return i.sub(1, "invalid fund model");
    }

    function _add(uint16 a, uint16 b) private pure returns (uint16) {
        uint16 c = a + b;

        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}
