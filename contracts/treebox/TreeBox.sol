// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../access/IAccessRestriction.sol";
import "./ITreeBox.sol";
import "./../tree/ITree.sol";

contract TreeBox is ITreeBox {
    bool public override isTreeBox;
    IAccessRestriction public accessRestriction;
    ITree public treeToken;

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    constructor(address _accessRestrictionAddress, address _token) {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());

        ITree candidateContractTree = ITree(_token);
        require(candidateContractTree.isTree());

        accessRestriction = candidateContract;
        treeToken = candidateContractTree;
    }

    function claim(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override ifNotPaused onlyDataManager {
        require(_from != address(0) && _to != address(0), "Invalid address");

        treeToken.safeTransferFrom(_from, _to, _tokenId);
    }
}
