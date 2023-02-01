// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../planter/PlanterV2.sol";

contract TestPlanter is PlanterV2 {
    function setPlanterStatus(address _planter, uint8 _status) external {
        planters[_planter].status = _status;
    }
}
