// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

pragma abicoder v2;

import "../access/IAccessRestriction.sol";

import "../treeBox/ITreeBox.sol";

import "@opengsn/contracts/src/BasePaymaster.sol";

import "./IWhitelistPaymaster.sol";

contract WhitelistPaymasterTreeBoxV3 is BasePaymaster {
    ITreeBox public treeBox;

    constructor(address _treeBox) {
        treeBox = ITreeBox(_treeBox);
        require(treeBox.isTreeBox());
    }

    function _preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
        internal
        virtual
        override
        returns (bytes memory context, bool revertOnRecipientRevert)
    {
        (relayRequest, signature, approvalData, maxPossibleGas);

        _verifyForwarder(relayRequest);

        (relayRequest, signature, approvalData, maxPossibleGas);

        bytes4 sig = GsnUtils.getMethodSig(relayRequest.request.data);

        require(sig == treeBox.claim.selector, "calling wrong method");

        (address sender, ) = treeBox.boxes(relayRequest.request.from);

        require(sender != address(0), "user is not valid");

        return ("", false);
    }

    function _postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) internal virtual override {
        (context, success, gasUseWithoutPost, relayData);
    }

    function versionPaymaster()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "3.0.0";
    }
}
