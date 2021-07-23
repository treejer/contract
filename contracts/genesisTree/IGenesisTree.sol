// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IGenesisTree {
    function isGenesisTree() external view returns (bool);

    function setGBFactoryAddress(address _address) external;

    function setTreasuryAddress(address _address) external;

    function setPlanterAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function addTree(uint256 _treeId, string calldata _treeDescription)
        external;

    function asignTreeToPlanter(uint256 _treeId, address _planterId) external;

    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    function verifyPlant(uint256 _treeId, bool _isVerified) external;

    function updateTree(uint256 treeId, string calldata treeSpecs) external;

    function verifyUpdate(uint256 treeId, bool isVerified) external;

    function availability(uint256 treeId, uint32 provideType)
        external
        returns (uint32);

    function updateOwner(uint256 treeId, address ownerId) external;

    function updateAvailability(uint256 treeId) external;

    function bulkAvailability(uint256 _startTreeId, uint256 _endTreeId)
        external
        returns (bool);

    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId) external;

    // function updateTreefromOffer(
    //     uint256 _treeId,
    //     string memory _specsCid,
    //     address _owner
    // ) external;

    /**
     * @dev This function is called by planter who have planted a new tree
     * The planter enters the information of the new tree
     * Information is stored in The {regularTrees} mapping
     * And finally the tree is waiting for approval
     *
     *
     * @param _treeSpecs //TODO: what is _treeSpecs ??
     * @param _birthDate birthDate of the tree
     * @param _countryCode Code of the country where the tree was planted
     */
    function regularPlantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {genTrees}
     *
     * @param _regularTreeId _regularTreeId
     * @param isVerified Tree approved or not
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool isVerified)
        external;

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSell contract
     *
     * @param lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     *
     *
     * @return The last tree sold after update
     */
    function mintRegularTrees(uint256 lastSold, address _owner)
        external
        returns (uint256);

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSell contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _owner Owner of a new tree sold in Regular
     */
    function requestRegularTree(uint256 _treeId, address _owner) external;

    event TreePlanted(uint256 treeId, address planter);
    event PlantVerified(uint256 treeId, uint256 updateStatus);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId, uint64 updateStatus);
}
