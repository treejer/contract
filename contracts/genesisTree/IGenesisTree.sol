// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IGenesisTree {
    function isGenesisTree() external view returns (bool);

    function setGBFactoryAddress(address _address) external;

    function setTreasuryAddress(address _address) external;

    function setPlanterAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function addTree(uint256 _treeId, string memory _treeDescription) external;

    function asignTreeToPlanter(uint256 _treeId, address _planterId) external;

    function plantTree(
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    function verifyPlant(uint256 _treeId, bool _isVerified) external;

    function updateTree(uint256 treeId, string memory treeSpecs) external;

    function verifyUpdate(uint256 treeId, bool isVerified) external;

    function availability(uint256 treeId, uint32 provideType)
        external
        returns (uint32);

    function updateOwner(uint256 treeId, address ownerId) external;

    function updateAvailability(uint256 treeId) external;

    // function updateTreefromOffer(
    //     uint256 _treeId,
    //     string memory _specsCid,
    //     address _owner
    // ) external;

    function verifyRegularPlant(uint256 _regularTreeId, bool isVerified)
        external;

    function mintRegularTrees(uint256 lastSold, address _owner)
        external
        returns (uint256);

    function requestRegularTree(uint256 _treeId, address _owner) external;

    event TreePlanted(uint256 treeId, address planter);
    event PlantVerified(uint256 treeId, uint256 updateStatus);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId, uint64 updateStatus);
}
