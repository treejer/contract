// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../communityGifts2/CommunityGifts.sol";

contract TestCommunityGifts is CommunityGifts {
    function updateUsed(uint256 _index) external {
        used[_index] = true;
    }

    function updateClaimedCount(uint256 _count) external {
        claimedCount = _count;
    }
}
