// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;

import "./../external/gsn/BaseRelayRecipient.sol";

/** @title RelayRecipient contract  */
contract RelayRecipient is BaseRelayRecipient {
    /** @dev return version recipient */
    function versionRecipient() external pure override returns (string memory) {
        return "2.2.0+treejer.irelayrecipient";
    }
}
