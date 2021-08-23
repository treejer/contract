// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;
pragma abicoder v2;

import "./../external/gsn/forwarder/IForwarder.sol";
import "./../external/gsn/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

contract WhitelistPaymaster is BasePaymaster {
    mapping(address => bool) public funderTargetWhitelist;
    mapping(address => bool) public planterTargetWhitelist;

    //related contracts
    IAccessRestriction public accessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    constructor(address _accessRestrictionAddress) {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function addPlanterWhitelistTarget(address target) external onlyAdmin {
        planterTargetWhitelist[target] = true;
    }

    function removePlanterWhitelistTarget(address target) external onlyAdmin {
        require(
            planterTargetWhitelist[target],
            "Target not exists in planterTargetWhitelist"
        );

        planterTargetWhitelist[target] = false;
    }

    function addFunderWhitelistTarget(address target) external onlyAdmin {
        funderTargetWhitelist[target] = true;
    }

    function removeFunderWhitelistTarget(address target) external onlyAdmin {
        require(
            funderTargetWhitelist[target],
            "Target not exists in funderTargetWhitelist"
        );

        funderTargetWhitelist[target] = false;
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

        if (planterTargetWhitelist[relayRequest.request.to]) {
            accessRestriction.ifPlanter(relayRequest.request.from);
            return ("", false);
        }

        require(
            funderTargetWhitelist[relayRequest.request.to],
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
