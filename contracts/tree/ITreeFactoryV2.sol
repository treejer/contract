// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title TreeFactory interfce */
interface ITreeFactoryV2 {
    struct PlantAssignedTreeSignature {
        uint256 nonce;
        uint256 treeId;
        string treeSpecs;
        uint64 birthDate;
        uint16 countryCode;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct VerifyAssignedTreeSignature {
        address planter;
        PlantAssignedTreeSignature[] data;
    }

    struct PlantTreeSignature {
        uint256 nonce;
        string treeSpecs;
        uint64 birthDate;
        uint16 countryCode;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct VerifyTreeSignature {
        address planter;
        PlantTreeSignature[] data;
    }

    struct UpdateSignature {
        uint256 nonce;
        uint256 treeId;
        string treeSpecs;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    struct VerifyUpdateData {
        address planter;
        UpdateSignature[] updateData;
    }

    /**
     * @dev emitted when a tree list
     * @param treeId id of tree to list
     */
    event TreeListed(uint256 treeId);

    /**
     * @dev emitted when a tree assigned to planter
     * @param treeId id of tree to assign
     */
    event TreeAssigned(uint256 treeId);

    /**
     * @dev emitted when  assigned tree planted
     * @param treeId id of tree that planted
     */
    event AssignedTreePlanted(uint256 treeId);

    /**
     * @dev emitted when planting of assigned tree verified
     * @param treeId id of tree that verified
     */
    event AssignedTreeVerified(uint256 treeId);

    /**
     * @dev emitted when planting of assigned tree rejected
     * @param treeId id of tree that rejected
     */
    event AssignedTreeRejected(uint256 treeId);

    /**
     * @dev emitted when planter send update request to tree
     * @param treeId id of tree that update request sent for
     */
    event TreeUpdated(uint256 treeId);

    /**
     * @dev emitted when update request for tree verified
     * @param treeId id of tree that update request verified
     */
    event TreeUpdatedVerified(uint256 treeId);

    /**
     * @dev emitted when update request for tree rejected
     * @param treeId id of tree that update request rejected
     */
    event TreeUpdateRejected(uint256 treeId);

    /**
     * @dev emitted when regular tree planted
     * @param treeId id of regular tree id that planted
     */
    event TreePlanted(uint256 treeId);

    /**
     * @dev emitted when planting for regular tree verified
     * @param treeId id of tree that verified
     * @param tempTreeId id of tempTree
     */
    event TreeVerified(uint256 treeId, uint256 tempTreeId);

    /**
     * @dev emitted when planting for regular tree rejected
     * @param treeId id of tree that rejected
     */
    event TreeRejected(uint256 treeId);

    /** @dev emitted when new treeUpdateInterval set */
    event TreeUpdateIntervalChanged();

    /**
     * @dev emitted when treeSpecs of tree updated
     * @param treeId id of tree to update treeSpecs
     */
    event TreeSpecsUpdated(uint256 treeId, string treeSpecs);

    event LastRegualarTreeIdUpdated(uint256 lastRegualarTreeId);

    event TreeStatusBatchReset();

    function setContractAddresses(uint8 _selector, address _address) external;

    /** @dev admin set the minimum time to send next update request
     * NOTE emit an {TreeUpdateIntervalChanged} event
     * @param _seconds time to next update request
     */
    function setUpdateInterval(uint256 _seconds) external;

    /**
     * @dev admin list tree
     * NOTE emited a {TreeListed} event
     * @param _treeId id of tree to list
     * @param _treeSpecs tree specs
     */
    function listTree(uint256 _treeId, string calldata _treeSpecs) external;

    function listTreeBatch(
        uint256[] calldata _treeIds,
        string[] calldata _treeSpecs
    ) external;

    function resetTreeStatusBatch(uint256 _startTreeId, uint256 _endTreeId)
        external;

    /**
     * @dev admin assign an existing tree to planter
     * NOTE tree must be not planted
     * NOTE emited a {TreeAssigned} event
     * @param _treeId id of tree to assign
     * @param _planter assignee planter
     */
    function assignTree(uint256 _treeId, address _planter) external;

    function assignTreeBatch(
        uint256[] calldata _treeIds,
        address[] calldata _planters
    ) external;

    /**
     * @dev check if a tree is free to take part in sale and set {_saleType}
     * to saleType of tree when tree is not in use
     * @param _treeId id of tree to check
     * @param _saleType saleType for tree
     * @return 0 if a tree ready for a sale and 1 if a tree is in use or minted before
     */
    function manageSaleType(uint256 _treeId, uint32 _saleType)
        external
        returns (uint32);

    /**
     * @dev mint a tree to funder and set saleType to 0
     * @param _treeId id of tree to mint
     * @param _funder address of funder to mint tree for
     */
    function mintAssignedTree(uint256 _treeId, address _funder) external;

    /**
     * @dev reset saleType value of tree
     * @param _treeId id of tree to reset saleType value
     */
    function resetSaleType(uint256 _treeId) external;

    /**
     * @dev reset saleType of trees in range of {_startTreeId} and {_endTreeId}
     * with saleType value of {_saleType}
     * @param _startTreeId starting tree id to reset saleType
     * @param _endTreeId ending tree id to reset saleType
     * @param _saleType saleType value of trees
     */
    function resetSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _saleType
    ) external;

    /**
     * @dev set {_saleType} to saleType of trees in range {_startTreeId} and {_endTreeId}
     * @param _startTreeId starting tree id to set saleType value
     * @param _endTreeId _ending tree id to set saleType value
     * @param _saleType saleType value
     * @return true if all trees saleType value successfully set and false otherwise
     */
    function manageSaleTypeBatch(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _saleType
    ) external returns (bool);

    function updateLastRegualarTreeId(uint256 _lastRegualarTreeId) external;

    /**
     * @dev mint a tree to funder of tree
     * @param _lastFundedTreeId The last tree funded in the regular sale
     * @param _funder funder of a new tree sold in Regular
     * @return the last tree funded after update
     */
    function mintTree(uint256 _lastFundedTreeId, address _funder)
        external
        returns (uint256);

    /**
     * @dev mint an already planted tree with id to funder
     * @param _treeId tree id to mint
     * @param _funder address of funder
     */
    function mintTreeById(uint256 _treeId, address _funder) external;

    /**
     * @dev script role update treeSpecs
     * NOTE emit a {TreeSpecsUpdated} event
     * @param _treeId id of tree to update treeSpecs
     * @param _treeSpecs new tree specs
     */
    function updateTreeSpecs(uint64 _treeId, string calldata _treeSpecs)
        external;

    function verifyUpdateBatchWithSignature(
        VerifyUpdateData[] calldata _verifyUpdateData
    ) external;

    // function verifyUpdateWithSignature(
    //     address _planter,
    //     UpdateSignature calldata _updateData
    // ) external;

    /**
     * @dev initialize AccessRestriction contract,lastRegualarTreeId,treeUpdateInterval
     * and set true for isTreeFactory
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) external;

    /** @return true in case of TreeFactory contract has been initialized */
    function isTreeFactory() external view returns (bool);

    /** @return lastRegularTreeId */
    function lastRegualarTreeId() external view returns (uint256);

    /** @return minimum time to send next update request */
    function treeUpdateInterval() external view returns (uint256);

    /** return Tree data
     * @param _treeId  id of tree to get data
     * @return planter
     * @return species
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
            uint32,
            uint32,
            uint64,
            uint64,
            uint64,
            string memory
        );

    /** return TreeUpdate data
     8 @param _treeId id of tree to get data
     * @return updateSpecs
     * @return updateStatus
     */
    function treeUpdates(uint256 _treeId)
        external
        view
        returns (string memory, uint64);

    /** return TempTree data
     * @param _tempTreeId id of tempTree to get data
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
}
