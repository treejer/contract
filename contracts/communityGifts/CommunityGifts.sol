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

    struct CommunityGift {
        uint32 symbol;
        bool claimed;
        bool exist;
    }

    /** NOTE mapping of giftee address to CommunityGift struct */
    mapping(address => CommunityGift) public communityGifts;

    /**NOTE {expireDate} is the maximum time that giftee can claim tree */
    uint256 public expireDate;

    /**NOTE {giftCount} is total number of trees that are gifted to someone */
    uint256 public giftCount;

    /**NOTE maximum amount of gift trees*/
    uint256 public maxGiftCount;
    /**NOTE id of tree to claim */
    uint256 public toClaim;
    /**NOTE maximum id of trees can be claimed up to it */
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
     * @dev initialize accessRestriction contract and set true for isCommunityGifts
     * set expire date and planterFund and referralFund initial value
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _expireDate initial expire date
     * @param _planterFund initial planter fund
     * @param _referralFund initial referral fund
     */
    function initialize(
        address _accessRestrictionAddress,
        uint256 _expireDate,
        uint256 _planterFund,
        uint256 _referralFund
    ) external initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isCommunityGifts = true;
        accessRestriction = candidateContract;

        expireDate = _expireDate;
        planterFund = _planterFund;
        referralFund = _referralFund;
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

    /** @dev admin set the gift range from {_startTreeId} to {_endTreeId}
     * with planter fund amount {_planterFund} and referral fund amount {_referralFund}
     * NOTE community gift ends at {_expireDate} and giftees can claim gifts until {_expireDate}
     * NOTE when a community gift set {_adminWalletAddress} transfer total value of trees
     * calculated based on planter and referral funds and number of gifted trees to
     * planterFund contract
     * @param _startTreeId stating tree id for gifts range
     * @param _endTreeId ending tree id for gifts range
     * @param _planterFund planter fund amount
     * @param _referralFund referral fund amount
     * @param _expireDate expire date of community gift
     * @param _adminWalletAddress address of the admin wallet
     */
    function setGiftsRange(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _planterFund,
        uint256 _referralFund,
        uint64 _expireDate,
        address _adminWalletAddress
    ) external onlyDataManager {
        require(_endTreeId > _startTreeId, "invalid range");

        bool check = treeFactory.manageSaleTypeBatch(
            _startTreeId,
            _endTreeId,
            5
        );

        require(check, "trees are not available");

        planterFund = _planterFund;
        referralFund = _referralFund;
        expireDate = _expireDate;
        maxGiftCount = _endTreeId - _startTreeId;
        toClaim = _startTreeId;
        upTo = _endTreeId;

        bool success = daiToken.transferFrom(
            _adminWalletAddress,
            address(planterFundContract),
            maxGiftCount * (planterFund + referralFund)
        );

        require(success, "unsuccessful transfer");

        emit CommuintyGiftSet();
    }

    /** @dev admin assign an unique symbol to a giftee
     * @param _giftee address of giftee
     * @param _symbol unique symbol assigned to a giftee
     */
    function updateGiftees(address _giftee, uint32 _symbol)
        external
        onlyDataManager
    {
        CommunityGift storage communityGift = communityGifts[_giftee];

        require(!communityGift.claimed, "Claimed before");

        if (!communityGift.exist) {
            require(giftCount < maxGiftCount, "max giftCount reached");
            giftCount += 1;
            communityGift.exist = true;
        } else {
            treeAttribute.freeReserveTreeAttributes(communityGift.symbol);
        }

        treeAttribute.reserveTreeAttributes(_symbol);

        communityGift.symbol = _symbol;

        emit GifteeUpdated(_giftee);
    }

    /** @dev giftee can claim assigned tree before communityGift expireDate
     * and ownership of tree transfered to giftee
     * NOTE giftees that claim their gift soon get low tree id
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     */
    function claimTree() external {
        CommunityGift storage communityGift = communityGifts[_msgSender()];

        require(block.timestamp <= expireDate, "CommunityGift ended");
        require(communityGifts[_msgSender()].exist, "User not exist");
        require(!communityGifts[_msgSender()].claimed, "Claimed before");

        uint256 treeId = toClaim;
        toClaim += 1;

        communityGift.claimed = true;

        treeAttribute.setTreeAttributesByAdmin(treeId, communityGift.symbol);

        planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

        treeFactory.mintAssignedTree(treeId, _msgSender(), 3);

        emit TreeClaimed(treeId);
    }

    /** @dev admin can set the maximum time that giftees can claim their gift before
     * expire date of community gift reach
     * @param _expireDate is the maximum time to claim tree
     */
    function setExpireDate(uint256 _expireDate) external onlyDataManager {
        require(block.timestamp < expireDate, "can not update expire date");
        expireDate = _expireDate;

        emit CommuintyGiftSet();
    }

    /** @dev if giftee did not claim gift, admin can transfer reserved symbol to
     * a giftee
     * @param _giftee is the address of giftee to transfer gift
     * @param _symbol is the reserved symbol is transfering to giftee
     * NOTE ownership of tree transfer to giftee
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     */

    function transferTree(address _giftee, uint32 _symbol)
        external
        ifNotPaused
        onlyDataManager
    {
        require(
            block.timestamp > expireDate,
            "CommunityGift Time not yet ended"
        );

        require(toClaim < upTo, "tree is not for community gift");

        uint256 treeId = toClaim;

        toClaim += 1;

        treeAttribute.setTreeAttributesByAdmin(treeId, _symbol);

        planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

        treeFactory.mintAssignedTree(treeId, _giftee, 3);

        emit TreeTransfered(treeId);
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
}
