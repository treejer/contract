// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./../../regularSale/RegularSale.sol";

contract TestRegularSale is RegularSale {
    function updateRegularReferrerGift(address _referrer, uint256 _count)
        external
    {
        referrerClaimableTreesDai[_referrer] += _count;
    }

    function updateReferrerClaimableTreesWeth2(
        address _referrer,
        uint256 _count
    ) external {
        referrerClaimableTreesWeth[_referrer] += _count;
    }
}
