// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IGenesisTree {
    function isGenesisTree() external view returns (bool);

    function setGBFactoryAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function addTree(uint256 _treeId, string memory _treeDescription) external;

    function asignTreeToPlanter(
        uint256 _treeId,
        uint256 _gbId,
        address _planterId,
        uint8 _gbType
    ) external;

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    function verifyPlant(uint256 _treeId, bool _isVerified) external;

    function updateTree(uint256 treeId, string memory treeSpecs) external;

    function verifyUpdate(uint256 treeId, bool isVerified) external;

    function checkAndSetProvideStatus(uint256 treeId, uint8 provideType)
        external
        returns (uint8);

    function updateOwner(uint256 treeId, address ownerId) external;

    function updateProvideStatus(uint256 treeId) external;
}
