// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./ITreeBox.sol";
import "./../tree/ITree.sol";

contract TreeBox is AccessControlUpgradeable, PausableUpgradeable, ITreeBox {
    bool public override isTreeBox;
    ITree public treeToken;
    bytes32 public constant TREEBOX_SCRIPT = keccak256("TREEBOX_SCRIPT");
    mapping(address => uint256) public override ownerToCount;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller not admin");
        _;
    }

    modifier ifNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    modifier onlyTreeBoxScript() {
        require(isTreeBoxScipt(msg.sender), "Caller not TreeBox script");
        _;
    }

    function initialize(address _token, address _admin)
        external
        override
        initializer
    {
        AccessControlUpgradeable.__AccessControl_init();
        PausableUpgradeable.__Pausable_init();

        ITree candidateContractTree = ITree(_token);

        if (!hasRole(DEFAULT_ADMIN_ROLE, _admin)) {
            _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        }

        treeToken = candidateContractTree;

        require(candidateContractTree.isTree());
    }

    function claim(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override ifNotPaused onlyTreeBoxScript {
        ownerToCount[_from] -= 1;
        treeToken.safeTransferFrom(_from, _to, _tokenId);
    }

    function updateCount(uint256 _amount) external override ifNotPaused {
        ownerToCount[msg.sender] += _amount;
    }

    function pause() external override onlyAdmin {
        _pause();
    }

    function unpause() external override onlyAdmin {
        _unpause();
    }

    function isTreeBoxScipt(address _address)
        public
        view
        override
        returns (bool)
    {
        return hasRole(TREEBOX_SCRIPT, _address);
    }
}
