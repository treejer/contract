// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;
pragma abicoder v2;

import "./../external/gsn/forwarder/IForwarder.sol";
import "./../external/gsn/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

/** @title WhitelistPaymaster contract */
contract WhitelistPaymaster is BasePaymaster {
    /** NOTE mapping of funderTargetWhitelist addressses to if gsn supported */
    mapping(address => bool) public funderTargetWhitelist;
    /** NOTE mapping of planterTargetWhitelist addressses to if gsn supported */
    mapping(address => bool) public planterTargetWhitelist;

    //related contracts
    IAccessRestriction public accessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    constructor(address _accessRestrictionAddress) {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    /** @dev admin add a valid address to planterTargetWhitelist */
    function addPlanterWhitelistTarget(address _target)
        external
        onlyAdmin
        validAddress(_target)
    {
        planterTargetWhitelist[_target] = true;
    }

    /** @dev admin remove an address from planterTargetWhitelist */
    function removePlanterWhitelistTarget(address _target) external onlyAdmin {
        require(
            planterTargetWhitelist[_target],
            "Target not exists in white list"
        );

        planterTargetWhitelist[_target] = false;
    }

    /** @dev admin add a valid address to funderTargetWhitelist */
    function addFunderWhitelistTarget(address _target)
        external
        onlyAdmin
        validAddress(_target)
    {
        funderTargetWhitelist[_target] = true;
    }

    /** @dev admin remove a address from funderTargetWhitelist */
    function removeFunderWhitelistTarget(address _target) external onlyAdmin {
        require(
            funderTargetWhitelist[_target],
            "Target not exists in white list"
        );

        funderTargetWhitelist[_target] = false;
    }

    /** @dev check that we support gas of a function called by a user */
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
        _verifyForwarder(relayRequest);

        (relayRequest, signature, approvalData, maxPossibleGas);

        if (planterTargetWhitelist[relayRequest.request.to]) {
            accessRestriction.ifPlanter(relayRequest.request.from);

            return ("", false);
        }

        require(
            funderTargetWhitelist[relayRequest.request.to],
            "Target not exists in white list"
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

    /** @dev return version paymaster */
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
