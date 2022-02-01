// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

contract TestRelayRecipient {
    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return true;
    }
}
