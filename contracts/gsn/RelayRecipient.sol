// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;

import "./externalFile/BaseRelayRecipient.sol";

contract RelayRecipient is BaseRelayRecipient {
    function versionRecipient() external pure override returns (string memory) {
        return "2.2.0+treejer.irelayrecipient";
    }
}
