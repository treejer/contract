// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title RelayRecipientV2 contract  */

contract RelayRecipientV2 {
    /*
     * Forwarder singleton we accept calls from
     */
    address public trustedForwarder;
}
