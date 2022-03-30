// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ITreeBox {
    event Created(address sender, address recipient);
    event Claimed(address claimer, address recipient, uint256[] treeIds);
    event Withdrew(address sender, address recipient, uint256[] treeIds);

    struct Input {
        address recipient;
        string ipfsHash;
        uint256[] treeIds;
    }

    function initialize(address _token, address _accessRestrictionAddress)
        external;

    function setTrustedForwarder(address _address) external;

    function create(Input[] calldata _input) external;

    function withdraw(address[] calldata _recipients) external;

    function isTreeBox() external view returns (bool);

    function claim(address _recipient) external;

    function getRecipientTreeByIndex(address _recipient, uint256 _index)
        external
        view
        returns (uint256);

    function getRecipientTreesLength(address _recipient)
        external
        view
        returns (uint256);

    function boxes(address _recipient)
        external
        view
        returns (address sender, string memory ipfsHash);
}
