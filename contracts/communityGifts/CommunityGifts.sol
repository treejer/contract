// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/ITreeAttribute.sol";
import "../treasury/ITreasury.sol";

/** @title CommunityGifts */

contract CommunityGifts is Initializable {
    /** NOTE {isCommunityGifts} set inside the initialize to {true} */

    bool public isCommunityGifts;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    ITreasury public treasury;
    ITreeAttribute public treeAttribute;

    struct CommunityGift {
        uint32 symbol;
        bool claimed;
        bool exist;
    }

    /** NOTE mapping of funder address to CommunityGift struct */
    mapping(address => CommunityGift) public communityGifts;

    uint256 claimedCount;
    uint256 expireDate;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress, uint256 _expireDate)
        public
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isCommunityGifts = true;
        accessRestriction = candidateContract;

        expireDate = _expireDate;
    }

    /**
     * @dev admin set TreeFactoryAddress
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
     * @dev admin set TreasuryAddress
     * @param _address set to the address of treasury
     */

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);
        require(candidateContract.isTreasury());
        treasury = candidateContract;
    }

    function updateGiftees(address _giftee, uint32 _symbol) external onlyAdmin {
        require(!communityGifts[_giftee].claimed, "Claimed before");
        communityGifts[_giftee].symbol = _symbol;
        treeAttribute.reserveTreeAttributes(_symbol);
    }

    function claimTree() external {
        CommunityGift storage communityGift = communityGifts[msg.sender];

        require(block.timestamp < expireDate, "CommunityGift ended");
        require(communityGifts[msg.sender].exist, "User not exist");
        require(!communityGifts[msg.sender].claimed, "claimed before");

        uint256 treeId = 11 + claimedCount;

        claimedCount += 1;

        communityGift.claimed = true;

        treeAttribute.setTreeAttributesByAdmin(treeId, communityGift.symbol);
        treeFactory.updateOwner(treeId, msg.sender);
    }

    function setExpireDate(uint256 _expireDate) external onlyAdmin {
        expireDate = _expireDate;
    }

    //TODO:_symbol is true???

    function transferTree(address _giftee, uint32 _symbol) external onlyAdmin {
        require(claimedCount < 89, "claimedCount not true");

        uint256 treeId = 11 + claimedCount;

        claimedCount += 1;

        treeAttribute.setTreeAttributesByAdmin(treeId, _symbol);
        treeFactory.updateOwner(treeId, _giftee);
    }
}
