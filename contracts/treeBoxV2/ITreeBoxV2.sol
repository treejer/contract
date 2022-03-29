// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ITreeBoxV2 {
    struct Input {
        address reciever;
        uint256[] treeIds;
    }

    struct Box {
        address sender;
        uint256[] treeIds;
    }

    function initialize(address _token, address _accessRestrictionAddress)
        external;

    function setTrustedForwarder(address _address) external;

    function create(Input[] calldata _input) external;

    function withdraw(address[] calldata _recievers) external;

    function isTreeBox() external view returns (bool);

    function claim(address _reciever) external;

    function boxes(address _publicKey) external view returns (address sender);
}
