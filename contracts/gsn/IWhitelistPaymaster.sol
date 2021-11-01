// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IWhitelistPaymaster {
    function addPlanterWhitelistTarget(address _target) external;

    function removePlanterWhitelistTarget(address _target) external;

    function addFunderWhitelistTarget(address _target) external;

    function removeFunderWhitelistTarget(address _target) external;

    function funderTargetWhitelist(address _target)
        external
        view
        returns (bool);

    function planterTargetWhitelist(address _target)
        external
        view
        returns (bool);
}
