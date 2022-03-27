// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../treeBox/TreeBox.sol";

contract TestTreeBox is TreeBox {
    function set(address _admin) external {
        if (!hasRole(DEFAULT_ADMIN_ROLE, _admin)) {
            _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        }
    }
}
