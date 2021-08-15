// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
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

    struct CommunityGift {
        uint32 symbol;
        bool claimed;
        bool exist;
    }

    /** NOTE mapping of giftee address to CommunityGift struct */
    mapping(address => CommunityGift) public communityGifts;

    /**NOTE {claimedCount} is total number of cliamed or transfered trees */
    uint256 public claimedCount;
    /**NOTE {expireDate} is the maximum time that giftee can claim tree */
    uint256 public expireDate;
    /**NOTE {giftCount} is total number of trees that are gifted to someone */
    uint256 public giftCount;

    event GifteeUpdated(address giftee);
    event TreeClaimed(uint256 treeId);
    event TreeTransfered(uint256 treeId);

    /** NOTE modifier for check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }
    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
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
    ) public initializer {
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

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
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
     * @param _startTreeId stating tree id for gifts range
     * @param _endTreeId ending tree id for gifts range
     */
    function setGiftsRange(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyAdmin
    {
        bool check = treeFactory.manageProvideStatus(
            _startTreeId,
            _endTreeId,
            5
        );
        require(check, "not available tree exist");
    }

    /** @dev admin assign an unique symbol to a giftee
     * @param _giftee address of giftee
     * @param _symbol unique symbol assigned to a giftee
     */
    function updateGiftees(address _giftee, uint32 _symbol) external onlyAdmin {
        CommunityGift storage communityGift = communityGifts[_giftee];

        require(!communityGift.claimed, "Claimed before");
        require(giftCount < 90, "max giftCount reached");

        if (!communityGift.exist) {
            giftCount += 1;
            communityGift.exist = true;
        } else {
            treeAttribute.freeReserveTreeAttributes(communityGift.symbol);
        }

        communityGift.symbol = _symbol;

        treeAttribute.reserveTreeAttributes(_symbol);

        emit GifteeUpdated(_giftee);
    }

    /** @dev giftee can claim assigned tree before communityGift expireDate
     * and ownership of tree transfered to giftee
     * NOTE giftees that claim their gift soon get low tree id
     * NOTE planter and referral share transfer to planterFund contract
     */
    function claimTree() external {
        CommunityGift storage communityGift = communityGifts[_msgSender()];

        require(block.timestamp <= expireDate, "CommunityGift ended");
        require(communityGifts[_msgSender()].exist, "User not exist");
        require(!communityGifts[_msgSender()].claimed, "Claimed before");

        uint256 treeId = 11 + claimedCount;

        claimedCount += 1;

        communityGift.claimed = true;

        treeAttribute.setTreeAttributesByAdmin(treeId, communityGift.symbol);

        planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

        treeFactory.updateOwner(treeId, _msgSender(), 3);

        emit TreeClaimed(treeId);
    }

    /** @dev admin can set the maximun time that giftees can claim their gift
     * @param _expireDate is the maximum time to claim tree
     *
     */
    function setExpireDate(uint256 _expireDate) external onlyAdmin {
        expireDate = _expireDate;
    }

    /** @dev if giftee did not claim gift admin can transfer reserved symbol to
     * another giftee
     * @param _giftee is the address of new giftee to transfer gift
     * @param _symbol is the reserved symbol is transfering to new giftee
     * NOTE ownership of tree transfer to giftee
     * NOTE planter and referral share transfer to planterFund contract
     */

    function transferTree(address _giftee, uint32 _symbol) external onlyAdmin {
        require(
            block.timestamp > expireDate,
            "CommunityGift Time not yet ended"
        );

        require(claimedCount < 89, "claimedCount not true");

        require(
            treeAttribute.reservedAttributes(_symbol) == 1,
            "Symbol not reserved"
        );

        uint256 treeId = 11 + claimedCount;

        claimedCount += 1;

        treeAttribute.setTreeAttributesByAdmin(treeId, _symbol);

        planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

        treeFactory.updateOwner(treeId, _giftee, 3);

        emit TreeTransfered(treeId);
    }

    /** @dev admin can set planter and referral share
     * @param _planterFund is the share of planter
     * @param _referralFund is the share of referral
     */

    function setPrice(uint256 _planterFund, uint256 _referralFund)
        external
        onlyAdmin
    {
        planterFund = _planterFund;
        referralFund = _referralFund;
    }
}
