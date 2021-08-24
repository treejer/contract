// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title TreeFactory interfce */
interface ITreeFactory {
    /** @return true in case of TreeFactory contract have been initialized */
    function isTreeFactory() external view returns (bool);

    /** @return AccessRestriction contract address */
    function accessRestriction() external view returns (address);

    /** @return TreeToken contract address */
    function treeToken() external view returns (address);

    /** @return PlanterFund contract address */
    function planterFund() external view returns (address);

    /** @return Planter contract address */
    function planter() external view returns (address);

    /** @return lastRegularPlantedTree */
    function lastRegularPlantedTree() external view returns (uint256);

    /** @return minimum time to send next update request */
    function updateInterval() external view returns (uint256);

    /** return TreeStruct data  of {_treeId}
     * @return planterId
     * @return treeType
     * @return mintStatus
     * @return countryCode
     * @return provideStatus
     * @return treeStatus
     * @return plantDate
     * @return birthDate
     * @return treeSpecs
     */
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

    /** return UpdateTree data  of {_treeId}
     * @return updateSpecs
     * @return updateStatus
     */
    function updateTrees(uint256 _treeId)
        external
        view
        returns (string memory, uint64);

    /** return RegularTree data  of {_treeId}
     * @return birthDate
     * @return plantDate
     * @return countryCode
     * @return otherData
     * @return planterAddress
     * @return treeSpecs
     */
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

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /** @dev set {_address} to PlanterFund contract address */
    function setPlanterFundAddress(address _address) external;

    /** @dev set {_address} to Planter contract address */
    function setPlanterAddress(address _address) external;

    /** @dev set {_address} to TreeToken contract address */
    function setTreeTokenAddress(address _address) external;

    /** @dev admin can set the minimum time to send next update request
     * @param _day time to next update request
     */
    function setUpdateInterval(uint256 _day) external;

    /**
     * @dev admin add tree
     * @param _treeId id of tree to add
     * @param _treeDescription tree description
     * NOTE emited a {TreeAdded} event
     */
    function addTree(uint256 _treeId, string calldata _treeDescription)
        external;

    /**
     * @dev admin assign an existing tree to planter
     * @param _treeId id of tree to assign
     * @param _planterId assignee planter
     * NOTE tree must be not planted
     * NOTE emited a {TreeAssigned} event
     */
    function assignTreeToPlanter(uint256 _treeId, address _planterId) external;

    /**
     * @dev planter with permission to plant, can plan their tree
     * @param _treeId id of tree to plant
     * @param _treeSpecs tree specs
     * @param _birthDate birth date of tree
     * @param _countryCode country code of tree
     * NOTE emited a {TreePlanted} event
     */
    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    /**
     * @dev admin or allowed verifier can verify a plant or reject.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     * NOTE emited a {PlantVerified} or {PlantRejected} event
     */
    function verifyPlant(uint256 _treeId, bool _isVerified) external;

    /**
     * @dev planter of  tree send update request for tree
     * @param _treeId id of tree to update
     * @param _treeSpecs tree specs
     * NOTE emited a {TreeUpdated} event
     */
    function updateTree(uint256 _treeId, string memory _treeSpecs) external;

    /**
     * @dev admin or allowed verifier can verifiy or reject update request for tree.
     * @param _treeId id of tree to verify update request
     * @param _isVerified true for verify and false for reject
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     * NOTE emited a {UpdateVerified} or {UpdateRejected} event
     */
    function verifyUpdate(uint256 _treeId, bool _isVerified) external;

    /**
     * @dev check if a tree is valid to take part in an auction
     * set {_provideType} to provideStatus when tree is not in use
     * @return 0 if a tree ready for auction and 1 if a tree is in auction or minted before
     */
    function availability(uint256 _treeId, uint32 _provideType)
        external
        returns (uint32);

    /** @dev mint {_treeId} to {_ownerId} and set mintStatus to {_mintStatus} and privdeStatus to 0  */
    function updateOwner(
        uint256 _treeId,
        address _ownerId,
        uint16 _mintStatus
    ) external;

    /** @dev exit a {_treeId} from auction */
    function updateAvailability(uint256 _treeId) external;

    /** @dev cancel all old incremental sell of trees starting from {_startTreeId} and end at {_endTreeId} */
    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId) external;

    /**
     * @dev set incremental and communityGifts sell for trees starting from {_startTreeId}
     * and end at {_endTreeId} by setting {_provideStatus} to provideStatus
     */
    function manageProvideStatus(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _provideStatus
    ) external returns (bool);

    function checkMintStatus(uint256 _treeId, address _buyer)
        external
        view
        returns (bool, bytes32);

    /**
     * @dev This function is called by planter who have planted a new tree
     * The planter enters the information of the new tree
     * Information is stored in The {regularTrees} mapping
     * And finally the tree is waiting for approval
     * @param _treeSpecs //TODO: what is _treeSpecs ??
     * @param _birthDate birthDate of the tree
     * @param _countryCode Code of the country where the tree was planted
     * NOTE emited a {RegularTreePlanted} event
     */
    function regularPlantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {treeData}
     * @param _regularTreeId _regularTreeId
     * @param _isVerified Tree approved or not
     * NOTE emited a {RegularPlantVerified} or {RegularPlantRejected} event
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool _isVerified)
        external;

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSell contract
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
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

    /** @dev emitted when tree with id {treeId} added */
    event TreeAdded(uint256 treeId);

    /** @dev emitted when tree with id {treeId} assigned to planter */
    event TreeAssigned(uint256 treeId);

    /** @dev emitted when tree with id {treeId} planted */
    event TreePlanted(uint256 treeId);

    /** @dev emitted when planting of tree with id {treeId} verified */
    event PlantVerified(uint256 treeId);

    /** @dev emitted when planting of tree with id {treeId} rejected */
    event PlantRejected(uint256 treeId);

    /** @dev emitted when planter send update request to tree with id {treeId} */
    event TreeUpdated(uint256 treeId);

    /** @dev emitted when update request for tree with id {treeId} veirified */
    event UpdateVerified(uint256 treeId);

    /** @dev emitted when update request for tree with id {treeId} rejected */
    event UpdateRejected(uint256 treeId);

    /** @dev emitted when regular tree with id {treeId} planted */
    event RegularTreePlanted(uint256 treeId);

    /** @dev emitted when planting for regular tree with id {treeId} veirified */
    event RegularPlantVerified(uint256 treeId);

    /** @dev emitted when planting for regular tree with id {treeId} rejected */
    event RegularPlantRejected(uint256 treeId);
}
