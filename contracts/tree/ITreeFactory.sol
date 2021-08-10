// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

interface ITreeFactory {
    function isTreeFactory() external view returns (bool);

    function lastRegularPlantedTree() external view returns (uint256);

    function treeData(uint256 _treeId)
        external
        view
        returns (
            address,
            uint256,
            uint16,
            uint16,
            uint32,
            uint64,
            uint64,
            uint64,
            string memory
        );

    function updateTrees(uint256 _treeId)
        external
        view
        returns (string memory, uint64);

    function regularTrees(uint256 _regularTreeId)
        external
        view
        returns (
            uint64,
            uint64,
            uint64,
            uint64,
            address,
            string memory
        );

    function setPlanterFundAddress(address _address) external;

    function setPlanterAddress(address _address) external;

    function setTreeTokenAddress(address _address) external;

    function addTree(uint256 _treeId, string calldata _treeDescription)
        external;

    function assignTreeToPlanter(uint256 _treeId, address _planterId) external;

    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    function verifyPlant(uint256 _treeId, bool _isVerified) external;

    function updateTree(uint256 _treeId, string memory _treeSpecs) external;

    function verifyUpdate(uint256 _treeId, bool _isVerified) external;

    function availability(uint256 _treeId, uint32 _provideType)
        external
        returns (uint32);

    function updateOwner(uint256 _treeId, address _ownerId) external;

    function updateOwnerIncremental(uint256 _treeId, address _ownerId) external;

    function updateAvailability(uint256 _treeId) external;

    function bulkAvailability(uint256 _startTreeId, uint256 _endTreeId)
        external
        returns (bool);

    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId) external;

    function checkMintStatus(uint256 _treeId, address _buyer)
        external
        view
        returns (bool);

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
     * After calling this function, if the tree is approved the tree information will be transferred to the {treeData}
     *
     * @param _regularTreeId _regularTreeId
     * @param _isVerified Tree approved or not
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool _isVerified)
        external;

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSell contract
     *
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     *
     *
     * @return The last tree sold after update
     */
    function mintRegularTrees(uint256 _lastSold, address _owner)
        external
        returns (uint256);

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSell contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _owner Owner of a new tree sold in Regular
     */
    function requestRegularTree(uint256 _treeId, address _owner) external;

    function setGiftsRange(uint256 _startTreeId, uint256 _endTreeId)
        external
        returns (bool);

    function updateOwnerCommunityGifts(uint256 _treeId, address _ownerId)
        external;

    event TreeAdded(uint256 treeId);
    event TreeAssigned(uint256 treeId);
    event TreePlanted(uint256 treeId);
    event PlantVerified(uint256 treeId);
    event PlantRejected(uint256 treeId);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId);
    event UpdateRejected(uint256 treeId);
    event RegularTreePlanted(uint256 treeId);
    event RegularPlantVerified(uint256 treeId);
    event RegularPlantRejected(uint256 treeId);
}
