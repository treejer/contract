// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract AccessRestriction is AccessControlUpgradeable, PausableUpgradeable {
    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant AUCTION_ROLE = keccak256("AUCTION_ROLE");
    bytes32 public constant TREE_FACTORY_ROLE = keccak256("TREE_FACTORY_ROLE");
    bytes32 public constant COMMUNITY_GIFTS_ROLE =
        keccak256("COMMUNITY_GIFTS_ROLE");
    bytes32 public constant REGULAR_SELL_ROLE = keccak256("REGULAR_SELL_ROLE");
    bytes32 public constant FUNDS_ROLE = keccak256("FUNDS_ROLE");
    bytes32 public constant INCREMENTAL_SELL_ROLE =
        keccak256("INCREMENTAL_SELL_ROLE");

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isAccessRestriction;

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

    function ifPlanter(address _address) public view {
        require(isPlanter(_address), "Caller is not a planter");
    }

    function isPlanter(address _address) public view returns (bool) {
        return hasRole(PLANTER_ROLE, _address);
    }

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

    function ifAuction(address _address) public view {
        require(isAuction(_address), "Caller is not Auction");
    }

    function isAuction(address _address) public view returns (bool) {
        return hasRole(AUCTION_ROLE, _address);
    }

    function ifIncrementalSell(address _address) public view {
        require(isIncrementalSell(_address), "Caller is not IncrementalSell");
    }

    function ifIncrementalSellOrAuction(address _address) public view {
        require(
            isIncrementalSell(_address) || isAuction(_address),
            "not IncrementalSell or Auction"
        );
    }

    function isIncrementalSell(address _address) public view returns (bool) {
        return hasRole(INCREMENTAL_SELL_ROLE, _address);
    }

    function ifTreeFactory(address _address) public view {
        require(isTreeFactory(_address), "Caller is not TreeFactory");
    }

    function isTreeFactory(address _address) public view returns (bool) {
        return hasRole(TREE_FACTORY_ROLE, _address);
    }

    function ifRegularSell(address _address) public view {
        require(isRegularSell(_address), "Caller is not RegularSell");
    }

    function isRegularSell(address _address) public view returns (bool) {
        return hasRole(REGULAR_SELL_ROLE, _address);
    }

    function ifFunds(address _address) public view {
        require(isFunds(_address), "Caller is not Funds");
    }

    function isFunds(address _address) public view returns (bool) {
        return hasRole(FUNDS_ROLE, _address);
    }

    function ifCommunityGifts(address _address) public view {
        require(isCommunityGifts(_address), "Caller is not CommunityGifts");
    }

    function isCommunityGifts(address _address) public view returns (bool) {
        return hasRole(COMMUNITY_GIFTS_ROLE, _address);
    }

    function ifAdminOrCommunityGifts(address _address) public view {
        require(
            isAdmin(_address) || isCommunityGifts(_address),
            "not Admin or CommunityGifts"
        );
    }

    function ifAuctionOrCommunityGifts(address _address) public view {
        require(
            isAuction(_address) || isCommunityGifts(_address),
            "not Auction or CommunityGifts"
        );
    }

    function ifFundsOrCommunityGifts(address _address) public view {
        require(
            isFunds(_address) || isCommunityGifts(_address),
            "not funds or community gifts"
        );
    }

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

    function ifIncrementalOrCommunityGifts(address _address) public view {
        require(
            isIncrementalSell(_address) || isCommunityGifts(_address),
            "not community gifts or incrementalSell"
        );
    }
}
