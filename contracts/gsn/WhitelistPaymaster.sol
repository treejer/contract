// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;
pragma abicoder v2;

import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@opengsn/contracts/src/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

contract WhitelistPaymaster is BasePaymaster {
    mapping(address => bool) public targetWhitelist;

    //related contracts
    IAccessRestriction public accessRestriction;

    constructor(address _accessRestrictionAddress) {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setWhitelistTarget(address target) external {
        accessRestriction.ifAdmin(msg.sender);

        targetWhitelist[target] = true;
    }

    function setPaymasterVersion(address target) external {
        accessRestriction.ifAdmin(msg.sender);

        targetWhitelist[target] = true;
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

        accessRestriction.ifPlanter(relayRequest.request.from);

        require(
            targetWhitelist[relayRequest.request.to],
            "target not whitelisted"
        );

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

    //withdraw
}
