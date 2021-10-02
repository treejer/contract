// SPDX-License-Identifier: GPL-3.0

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
    function planterContract() external view returns (address);

    /** @return lastRegularTreeId */
    function lastRegualarTreeId() external view returns (uint256);

    /** @return minimum time to send next update request */
    function treeUpdateInterval() external view returns (uint256);

    /** return Tree data of {_treeId}
     * @return planter
     * @return species
     * @return mintOrigin
     * @return countryCode
     * @return saleType
     * @return treeStatus
     * @return plantDate
     * @return birthDate
     * @return treeSpecs
     */
    function trees(uint256 _treeId)
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

    /** return TreeUpdate data  of {_treeId}
     * @return updateSpecs
     * @return updateStatus
     */
    function treeUpdates(uint256 _treeId)
        external
        view
        returns (string memory, uint64);

    /** return TempTree data  of {_treeId}
     * @return birthDate
     * @return plantDate
     * @return countryCode
     * @return otherData
     * @return planter
     * @return treeSpecs
     */
    function tempTrees(uint256 _tempTreeId)
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
    function setPlanterContractAddress(address _address) external;

    /** @dev set {_address} to TreeToken contract address */
    function setTreeTokenAddress(address _address) external;

    /** @dev admin can set the minimum time to send next update request
     * @param _day time to next update request
     * NOTE emit an {TreeUpdateIntervalChanged} event
     */
    function setUpdateInterval(uint256 _day) external;

    /**
     * @dev admin add tree
     * @param _treeId id of tree to add
     * @param _treeSpecs tree specs
     * NOTE emited a {TreeListed} event
     */
    function listTree(uint256 _treeId, string calldata _treeSpecs) external;

    /**
     * @dev admin assign an existing tree to planter
     * @param _treeId id of tree to assign
     * @param _planter assignee planter
     * NOTE tree must be not planted
     * NOTE emited a {TreeAssigned} event
     */
    function assignTree(uint256 _treeId, address _planter) external;

    /**
     * @dev planter with permission to plant, can plan their tree
     * @param _treeId id of tree to plant
     * @param _treeSpecs tree specs
     * @param _birthDate birth date of tree
     * @param _countryCode country code of tree
     * NOTE emited a {AssignedTreePlanted} event
     */
    function plantAssignedTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    /**
     * @dev admin or allowed verifier can verify a plant or reject.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     * NOTE emited a {AssignedTreeVerified} or {AssignedTreeRejected} event
     */
    function verifyAssignedTree(uint256 _treeId, bool _isVerified) external;

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
     * NOTE emited a {TreeUpdatedVerified} or {TreeUpdateRejected} event
     */
    function verifyUpdate(uint256 _treeId, bool _isVerified) external;

    /**
     * @dev check if a tree is valid to take part in an auction
     * set {_saleType} to saleType when tree is not in use
     * @return 0 if a tree ready for auction and 1 if a tree is in auction or minted before
     */
    function manageSaleType(uint256 _treeId, uint32 _saleType)
        external
        returns (uint32);

    /** @dev mint {_treeId} to {_funder} and set mintOrigin to {_mintOrigin} and privdeStatus to 0  */
    function mintAssignedTree(
        uint256 _treeId,
        address _funder,
        uint16 _mintOrigin
    ) external;

    /** @dev exit a {_treeId} from auction */
    function resetSaleType(uint256 _treeId) external;

    /** @dev cancel all old incremental sell of trees starting from {_startTreeId} and end at {_endTreeId} */
    function resetSaleTypeBatch(uint256 _startTreeId, uint256 _endTreeId)
        external;

    /**
     * @dev set incremental and communityGifts sell for trees starting from {_startTreeId}
     * and end at {_endTreeId} by setting {_saleType} to saleType
     */
    function manageSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _saleType
    ) external returns (bool);

    function checkMintOrigin(uint256 _treeId, address _funder)
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
     * NOTE emited a {TreePlanted} event
     */
    function plantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external;

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {trees}
     * @param _tempTreeId _tempTreeId
     * @param _isVerified Tree approved or not
     * NOTE emited a {TreeVerified} or {TreeRejected} event
     */
    function verifyTree(uint256 _tempTreeId, bool _isVerified) external;

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSale contract
     * @param _lastFundedTreeId The last tree sold in the regular
     * @param _funder funder of a new tree sold in Regular
     * @return The last tree sold after update
     */
    function mintTree(uint256 _lastFundedTreeId, address _funder)
        external
        returns (uint256);

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSale contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _funder funder of a new tree sold in Regular
     */
    function mintTreeById(uint256 _treeId, address _funder) external;

    /**
     * @dev script role update {_treeSpecs} of {_treeId}
     * NOTE emit a {TreeSpecsUpdated} event
     */
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external;

    /** @dev emitted when tree with id {treeId} added */
    event TreeListed(uint256 treeId);

    /** @dev emitted when tree with id {treeId} assigned to planter */
    event TreeAssigned(uint256 treeId);

    /** @dev emitted when tree with id {treeId} planted */
    event AssignedTreePlanted(uint256 treeId);

    /** @dev emitted when planting of tree with id {treeId} verified */
    event AssignedTreeVerified(uint256 treeId);

    /** @dev emitted when planting of tree with id {treeId} rejected */
    event AssignedTreeRejected(uint256 treeId);

    /** @dev emitted when planter send update request to tree with id {treeId} */
    event TreeUpdated(uint256 treeId);

    /** @dev emitted when update request for tree with id {treeId} veirified */
    event TreeUpdatedVerified(uint256 treeId);

    /** @dev emitted when update request for tree with id {treeId} rejected */
    event TreeUpdateRejected(uint256 treeId);

    /** @dev emitted when regular tree with id {treeId} planted */
    event TreePlanted(uint256 treeId);

    /** @dev emitted when planting for regular tree with id {treeId} veirified */
    event TreeVerified(uint256 treeId);

    /** @dev emitted when planting for regular tree with id {treeId} rejected */
    event TreeRejected(uint256 treeId);

    /** @dev emitted when new treeUpdateInterval set */
    event TreeUpdateIntervalChanged();

    /** @dev emitted when treeSpecs of {treeId} updated */
    event TreeSpecsUpdated(uint256 treeId);
}
