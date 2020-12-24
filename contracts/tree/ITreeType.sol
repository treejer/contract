// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface ITreeType {
    event NewType(
        uint256 typeId,
        string name,
        string scientificName,
        uint256 O2Formula,
        uint256 price
    );

    function isTreeType() external view returns (bool);

    function types(uint256 _index)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256
        );

    function create(
        string calldata _name,
        string calldata _scientificName,
        uint256 _O2Formula,
        uint256 _price
    ) external;
}
