// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

contract RelayRecipient is BaseRelayRecipient {
    function versionRecipient() external view override returns (string memory) {
        return "2.0.0";
    }
}
