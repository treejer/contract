// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

pragma abicoder v2;

import "./../external/gsn/forwarder/IForwarder.sol";
import "./../external/gsn/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

import "./IWhitelistPaymaster.sol";

import "../treeBox/ITreeBox.sol";

contract WhitelistPaymasterTreeBox is BasePaymaster {
    ITreeBox public treeBox;

    constructor(address _treeBox) {
        treeBox = ITreeBox(_treeBox);
        require(treeBox.isTreeBox());
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
        external
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

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        (context, success, gasUseWithoutPost, relayData);
    }

    function versionPaymaster()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "2.2.0+treejer.whitelist.ipaymaster";
    }
}
