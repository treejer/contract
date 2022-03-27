// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ITreeBox {
    function initialize(address _token, address _admin) external;

    function claim(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function updateCount(uint256 _amount) external;

    function pause() external;

    function unpause() external;

    function isTreeBox() external view returns (bool);

    function isTreeBoxScipt(address _address) external view returns (bool);

    function ownerToCount(address _owner) external view returns (uint256);
}
