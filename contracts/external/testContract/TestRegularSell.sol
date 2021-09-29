// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
import "./../../regularSell/RegularSell.sol";

contract TestRegularSell is RegularSell {
    function updateRegularReferrerGift(address _referrer, uint256 _count)
        external
    {
        referrerClaimableTreesDai[_referrer] += _count;
    }
}
