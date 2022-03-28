// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ITreeBoxV2 {
    function initialize(address _token) external;

    // function setTrustedForwarder(address _address) external;

    function create(address[] calldata _recievers, uint256[] calldata treeIds)
        external;

    function claim(address _reciever) external;

    function withdraw(address[] calldata _recievers) external;

    function pause() external;

    function unpause() external;

    function isTreeBox() external view returns (bool);

    function boxes(address _publicKey)
        external
        view
        returns (address sender, uint256 treeId);
}
