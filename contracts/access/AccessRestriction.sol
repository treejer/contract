// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/** @title AccessRestriction */

contract AccessRestriction is AccessControlUpgradeable, PausableUpgradeable {
    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AUCTION_ROLE = keccak256("AUCTION_ROLE");
    bytes32 public constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");
    bytes32 public constant TREE_FACTORY_ROLE = keccak256("TREE_FACTORY_ROLE");
    bytes32 public constant COMMUNITY_GIFTS_ROLE =
        keccak256("COMMUNITY_GIFTS_ROLE");
    bytes32 public constant REGULAR_SELL_ROLE = keccak256("REGULAR_SELL_ROLE");
    bytes32 public constant FUNDS_ROLE = keccak256("FUNDS_ROLE");
    bytes32 public constant INCREMENTAL_SELL_ROLE =
        keccak256("INCREMENTAL_SELL_ROLE");

    /** NOTE {isAccessRestriction} set inside the initialize to {true} */
    bool public isAccessRestriction;

    /**
     * @dev initialize accessRestriction contract and set true for {isAccessRestriction}
     * @param _deployer address of the deployer that DEFAULT_ADMIN_ROLE set to it
     */
    function initialize(address _deployer) public initializer {
        AccessControlUpgradeable.__AccessControl_init();
        PausableUpgradeable.__Pausable_init();

        isAccessRestriction = true;

        if (hasRole(DEFAULT_ADMIN_ROLE, _deployer) == false) {
            _setupRole(DEFAULT_ADMIN_ROLE, _deployer);
        }
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");
        _;
    }

    /**
     * @dev check if given address is planter
     * @param _address input address to check if planter or not
     */
    function ifPlanter(address _address) public view {
        require(isPlanter(_address), "Caller is not a planter");
    }

    function isPlanter(address _address) public view returns (bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

    /**
     * @dev check if given address is admin
     * @param _address input address to check if admin or not
     */
    function ifAdmin(address _address) public view {
        require(isAdmin(_address), "Caller is not admin");
    }

    function isAdmin(address _address) public view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    function ifNotPaused() public view {
        require(!paused(), "Pausable: paused");
    }

    function ifPaused() public view {
        require(paused(), "Pausable: not paused");
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @dev check if given address is auction
     * @param _address input address to check if auction or not
     */

    function ifTreejerContract(address _address) public view {
        require(isTreejerContract(_address), "caller is not treejer contract");
    }

    function isTreejerContract(address _address) public view returns (bool) {
        return hasRole(TREEJER_CONTRACT_ROLE, _address);
    }

    function ifAuction(address _address) public view {
        require(isAuction(_address), "Caller is not Auction");
    }

    function isAuction(address _address) public view returns (bool) {
        return hasRole(AUCTION_ROLE, _address);
    }

    /**
     * @dev check if given address is incrementalSell
     * @param _address input address to check if incrementalSell or not
     */
    function ifIncrementalSell(address _address) public view {
        require(isIncrementalSell(_address), "Caller is not IncrementalSell");
    }

    /**
     * @dev check if given address is incrementalSell or auction
     * @param _address input address to check if incrementalSell or auction or not
     */

    function ifIncrementalSellOrAuction(address _address) public view {
        require(
            isIncrementalSell(_address) || isAuction(_address),
            "not IncrementalSell or Auction"
        );
    }

    function isIncrementalSell(address _address) public view returns (bool) {
        return hasRole(INCREMENTAL_SELL_ROLE, _address);
    }

    /**
     * @dev check if given address is tree factory
     * @param _address input address to check if tree factory or not
     */
    function ifTreeFactory(address _address) public view {
        require(isTreeFactory(_address), "Caller is not TreeFactory");
    }

    function isTreeFactory(address _address) public view returns (bool) {
        return hasRole(TREE_FACTORY_ROLE, _address);
    }

    /**
     * @dev check if given address is regularSell
     * @param _address input address to check if regularSell or not
     */
    function ifRegularSell(address _address) public view {
        require(isRegularSell(_address), "Caller is not RegularSell");
    }

    function isRegularSell(address _address) public view returns (bool) {
        return hasRole(REGULAR_SELL_ROLE, _address);
    }

    /**
     * @dev check if given address is funds
     * @param _address input address to check if funds or not
     */
    function ifFunds(address _address) public view {
        require(isFunds(_address), "Caller is not Funds");
    }

    function isFunds(address _address) public view returns (bool) {
        return hasRole(FUNDS_ROLE, _address);
    }

    /**
     * @dev check if given address is communityGifts
     * @param _address input address to check if communityGifts or not
     */
    function ifCommunityGifts(address _address) public view {
        require(isCommunityGifts(_address), "Caller is not CommunityGifts");
    }

    function isCommunityGifts(address _address) public view returns (bool) {
        return hasRole(COMMUNITY_GIFTS_ROLE, _address);
    }

    /**
     * @dev check if given address is admin or communityGifts
     * @param _address input address to check if admin or communityGifts or not
     */
    function ifAdminOrCommunityGifts(address _address) public view {
        require(
            isAdmin(_address) || isCommunityGifts(_address),
            "not Admin or CommunityGifts"
        );
    }

    /**
     * @dev check if given address is auction or communityGifts
     * @param _address input address to check if auction or communityGifts or not
     */
    function ifAuctionOrCommunityGifts(address _address) public view {
        require(
            isAuction(_address) || isCommunityGifts(_address),
            "not Auction or CommunityGifts"
        );
    }

    /**
     * @dev check if given address is funds or communityGifts
     * @param _address input address to check if funds or communityGifts or not
     */
    function ifFundsOrCommunityGifts(address _address) public view {
        require(
            isFunds(_address) || isCommunityGifts(_address),
            "not funds or community gifts"
        );
    }

    /**
     * @dev check if given address is incrementalSell or auction or CommunityGifts
     * @param _address input address to check if incrementalSell or auction or CommunityGifts
     */
    function ifIncrementalSellOrAuctionOrCommunityGifts(address _address)
        public
        view
    {
        require(
            isIncrementalSell(_address) ||
                isAuction(_address) ||
                isCommunityGifts(_address),
            "not auction or community gifts or incrementalSell"
        );
    }

    /**
     * @dev check if given address is incremental or communityGifts
     * @param _address input address to check if incremental or communityGifts
     */
    function ifIncrementalOrCommunityGifts(address _address) public view {
        require(
            isIncrementalSell(_address) || isCommunityGifts(_address),
            "not community gifts or incrementalSell"
        );
    }
}
