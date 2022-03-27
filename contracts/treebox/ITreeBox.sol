// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ITreeBox {
    function claim(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function isTreeBox() external view returns (bool);
}
