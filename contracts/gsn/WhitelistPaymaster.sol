// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

pragma abicoder v2;

import "./../external/gsn/forwarder/IForwarder.sol";
import "./../external/gsn/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

import "./IWhitelistPaymaster.sol";

contract WhitelistPaymaster is BasePaymaster, IWhitelistPaymaster {
    mapping(address => bool) public override funderTargetWhitelist;
    mapping(address => bool) public override planterTargetWhitelist;

    //related contracts
    IAccessRestriction public accessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    constructor(address _accessRestrictionAddress) {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function addPlanterWhitelistTarget(address _target)
        external
        override
        onlyAdmin
        validAddress(_target)
    {
        planterTargetWhitelist[_target] = true;
    }

    function removePlanterWhitelistTarget(address _target)
        external
        override
        onlyAdmin
    {
        require(planterTargetWhitelist[_target], "Target not exists");

        planterTargetWhitelist[_target] = false;
    }

    function addFunderWhitelistTarget(address _target)
        external
        override
        onlyAdmin
        validAddress(_target)
    {
        funderTargetWhitelist[_target] = true;
    }

    function removeFunderWhitelistTarget(address _target)
        external
        override
        onlyAdmin
    {
        require(funderTargetWhitelist[_target], "Target not exists");

        funderTargetWhitelist[_target] = false;
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
            "Target not exists"
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        returns (bool)
    {
        return interfaceId == type(IPaymaster).interfaceId;
    }
}
