// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/ITreeAttribute.sol";
import "../treasury/IPlanterFund.sol";
import "../gsn/RelayRecipient.sol";

/** @title CommunityGifts */

contract CommunityGifts is Initializable, RelayRecipient {
    /** NOTE {isCommunityGifts} set inside the initialize to {true} */
    bool public isCommunityGifts;

    /**NOTE {planterFund} is share of plater when a tree claimed or transfered to someone*/
    uint256 public planterFund;

    /**NOTE {referralFund} is share of referral when a tree claimed or transfered to someone*/

    uint256 public referralFund;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IPlanterFund public planterFundContract;
    ITreeAttribute public treeAttribute;
    IERC20Upgradeable public daiToken;

    struct GifteeData {
        uint64 expireDate;
        uint64 startDate;
        uint64 status;
    }

    mapping(address => GifteeData) giftees;

    uint64[] public symbols;
    bool[] public used;

    uint256 public claimedCount;
    uint256 public currentTree;
    uint256 public upTo;

    ////////////////////////////////////////////////
    event GifteeUpdated(address giftee);
    event TreeClaimed(uint256 treeId);
    event TreeTransfered(uint256 treeId);
    event CommunityGiftPlanterFund(uint256 planterFund, uint256 referralFund);
    event CommuintyGiftSet();

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
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

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
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
     * @dev admin set TreeAttributesAddress
     * @param _address set to the address of treeAttribute
     */

    function setTreeAttributesAddress(address _address) external onlyAdmin {
        ITreeAttribute candidateContract = ITreeAttribute(_address);
        require(candidateContract.isTreeAttribute());
        treeAttribute = candidateContract;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /**
     * @dev admin set PlanterFundAddress
     * @param _address set to the address of PlanterFund
     */

    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    function setGiftRange(
        address _adminWalletAddress,
        uint256 _startTreeId,
        uint256 _upTo
    ) external {
        bool check = treeFactory.manageSaleTypeBatch(_startTreeId, _upTo, 5);
        require(check, "trees are not available");

        currentTree = _startTreeId;
        upTo = _upTo;

        bool success = daiToken.transferFrom(
            _adminWalletAddress,
            address(planterFundContract),
            (_upTo - _startTreeId) * (planterFund + referralFund)
        );

        require(success, "unsuccessful transfer");

        emit CommuintyGiftSet();
    }

    function freeGiftRange(
        address _adminWalletAddress,
        uint256 _startTreeId,
        uint256 _upTo
    ) external {
        bool check = treeFactory.manageSaleTypeBatch(_startTreeId, _upTo, 5);
        require(check, "trees are not available");

        currentTree = _startTreeId;
        upTo = _upTo;

        bool success = daiToken.transferFrom(
            _adminWalletAddress,
            address(planterFundContract),
            (_upTo - _startTreeId) * (planterFund + referralFund)
        );

        require(success, "unsuccessful transfer");

        emit CommuintyGiftSet();
    }

    function reserveSymbol(uint64 _symbol) external onlyDataManager {
        treeAttribute.reserveSymbol(_symbol);
        symbols.push(_symbol);
        used.push(false);
    }

    function removeReservedSymbol() external onlyDataManager {
        for (uint256 i = 0; i < symbols.length; i++) {
            if (!used[i]) {
                treeAttribute.freeReserveSymbolBool(symbols[i]);
            }
        }

        delete symbols;
        delete used;
        claimedCount = 0;
    }

    function addGiftee(
        address _funder,
        uint64 _startDate,
        uint64 _expireDate
    ) external onlyDataManager {
        GifteeData storage giftee = giftees[_funder];

        giftee.expireDate = _expireDate;
        giftee.startDate = _startDate;
        giftee.status = 1;
    }

    function updateGiftee(
        address _funder,
        uint64 _startDate,
        uint64 _expireDate
    ) external onlyDataManager {
        GifteeData storage giftee = giftees[_funder];

        require(giftee.status == 1, "Status must be one");

        giftee.expireDate = _expireDate;
        giftee.startDate = _startDate;
    }

    /** @dev admin can set planter and referral funds amount
     * @param _planterFund is the planter fund amount
     * @param _referralFund is the referral fund amount
     */

    function setPrice(uint256 _planterFund, uint256 _referralFund)
        external
        onlyDataManager
    {
        planterFund = _planterFund;
        referralFund = _referralFund;

        emit CommunityGiftPlanterFund(_planterFund, _referralFund);
    }

    function claimGift() external {
        GifteeData storage giftee = giftees[_msgSender()];
        require(
            giftee.expireDate > block.timestamp &&
                giftee.startDate < block.timestamp &&
                giftee.status == 1,
            "you cant claim tree"
        );

        if (currentTree < upTo) {
            if (claimedCount < symbols.length) {
                bool flag = false;

                uint256 rand = uint256(
                    keccak256(
                        abi.encode(
                            giftee.expireDate,
                            giftee.startDate,
                            msg.data,
                            currentTree
                        )
                    )
                );

                uint256 availableCount = 0;
                uint64 generatedSymbol;

                for (uint256 i = 0; i < symbols.length; i++) {
                    uint256 symbolSec = rand % (symbols.length - claimedCount);

                    for (uint256 j = 0; j < symbols.length; j++) {
                        if (!used[j]) {
                            availableCount += 1;
                            if (availableCount == symbolSec) {
                                claimedCount += 1;
                                used[j] = true;

                                (, uint128 status) = treeAttribute.uniqueSymbol(
                                    symbols[j]
                                );

                                if (status == 1) {
                                    generatedSymbol = symbols[j];
                                    flag = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (flag) {
                        break;
                    }
                }

                uint64 generatedAttribute = treeAttribute.randAvailibity(
                    currentTree,
                    uint64(rand & type(uint64).max)
                );

                treeAttribute.setTreeAttributesByAdmin(
                    currentTree,
                    generatedAttribute,
                    generatedSymbol,
                    18
                );

                planterFundContract.updateProjectedEarnings(
                    currentTree,
                    planterFund,
                    referralFund
                );

                currentTree += 1;

                treeFactory.mintAssignedTree(currentTree, _msgSender(), 3);

                delete giftees[_msgSender()];

                emit TreeClaimed(currentTree);
            }
        }
    }
}
