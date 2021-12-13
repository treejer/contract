// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./../../external/gsn/forwarder/IForwarder.sol";
import "./../../external/gsn/BasePaymaster.sol";

interface ITestWhitelistPaymaster {
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external;

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external;
}
