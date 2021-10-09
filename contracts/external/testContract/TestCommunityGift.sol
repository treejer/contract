// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../communityGifts/CommunityGifts.sol";

contract TestCommunityGifts is CommunityGifts {
    function updateUsed(uint256 _index) external {
        used[_index] = true;
    }

    function updateClaimedCount(uint256 _count) external {
        claimedCount = _count;
    }

    function testClaimGiftFor(uint256 rand) external {
        bool flag = false;

        uint64 generatedSymbol;
        uint256 diffrence;
        uint256 symbolSec;
        uint256 availableCount;

        for (uint256 i = 0; i < symbols.length; i++) {
            diffrence = symbols.length - claimedCount;
            symbolSec = diffrence > 0 ? rand % diffrence : 0;
            availableCount = 0;

            for (uint256 j = 0; j < symbols.length; j++) {
                if (!used[j]) {
                    if (availableCount == symbolSec) {
                        claimedCount += 1;
                        used[j] = true;

                        (, uint128 status) = attribute
                            .uniquenessFactorToSymbolStatus(symbols[j]);

                        if (status == 1) {
                            generatedSymbol = symbols[j];
                            flag = true;
                        }

                        break;
                    }
                    availableCount += 1;
                }
            }
            if (flag) {
                break;
            }
        }
    }
}
