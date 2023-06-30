// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title TreeFactory interfce */
interface ITreeFactoryV3 {
    struct PlantAssignedTreeData {
        uint256 nonce;
        uint256 treeId;
        string treeSpecs;
        uint64 birthDate;
        uint16 countryCode;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct VerifyAssignedTreeData {
        address planter;
        PlantAssignedTreeData[] data;
    }

    struct PlantTreeData {
        uint256 nonce;
        string treeSpecs;
        uint64 birthDate;
        uint16 countryCode;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct VerifyTreeData {
        address planter;
        PlantTreeData[] data;
    }

    struct UpdateData {
        uint256 nonce;
        uint256 treeId;
        string treeSpecs;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    struct VerifyUpdateData {
        address planter;
        UpdateData[] updateData;
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
     * @dev emitted when planting of assigned tree verified
     * @param treeId id of tree that verified
     */
    event AssignedTreeVerifiedWithSign(uint256 treeId);

    /**
     * @dev emitted when update request for tree verified
     * @param treeId id of tree that update request verified
     */
    event TreeUpdatedVerifiedWithSign(uint256 treeId);

    /**
     * @dev emitted when planting for regular tree verified
     * @param planter address of planter
     * @param nonce planter nonce
     */
    event TreeVerifiedWithSign(uint256 treeId,address planter, uint256 nonce);

    /** @dev emitted when new treeUpdateInterval set */
    event TreeUpdateIntervalChanged();

    /**
     * @dev emitted when treeSpecs of tree updated
     * @param treeId id of tree to update treeSpecs
     */
    event TreeSpecsUpdated(uint256 treeId, string treeSpecs);

    /**
     * @dev emitted when lastRegualarTreeId updated
     * @param lastRegualarTreeId new value for lastRegualarTreeId
     */
    event LastRegualarTreeIdUpdated(uint256 lastRegualarTreeId);

    /**
     * @dev emitted when treeStatus reset
     */
    event TreeStatusBatchReset();

    /** @dev admin set new address for given contract
     * @param _selector contract selector
     * @param _address new address for contract
     */
    function setContractAddresses(uint8 _selector, address _address) external;

    /** @dev admin set the minimum time to send next update request
     * NOTE emit an {TreeUpdateIntervalChanged} event
     * @param _seconds time to next update request
     */
    function setUpdateInterval(uint256 _seconds) external;

    /**
     * @dev admin list tree
     * NOTE emit a {TreeListed} event
     * @param _treeId id of tree to list
     * @param _treeSpecs tree specs
     */
    function listTree(uint256 _treeId, string calldata _treeSpecs) external;

    /**
     * @dev admin list batch of trees
     * NOTE emit {TreeListed} event
     * @param _treeIds list of tree ids
     * @param _treeSpecs list of tree specs
     */
    function listTreeBatch(
        uint256[] calldata _treeIds,
        string[] calldata _treeSpecs
    ) external;

    /**
     * @dev admin reset treeStatus of a given range to 0
     * NOTE emit {TreeStatusBatchReset} event
     * @param _startTreeId start treeId
     * @param _endTreeId end treeId
     */
    function resetTreeStatusBatch(
        uint256 _startTreeId,
        uint256 _endTreeId
    ) external;

    /**
     * @dev admin assign an existing tree to planter
     * NOTE tree must be not planted
     * NOTE emit a {TreeAssigned} event
     * @param _treeId id of tree to assign
     * @param _planter assignee planter
     */
    function assignTree(uint256 _treeId, address _planter) external;

    /**
     * @dev admin assign batch of existing trees to planters
     * NOTE tree must be not planted
     * NOTE emit a {TreeAssigned} event
     * @param _treeIds id of trees to assign
     * @param _planters assignee planters
     */
    function assignTreeBatch(
        uint256[] calldata _treeIds,
        address[] calldata _planters
    ) external;

    /**
     * @dev allowed verifier can verify batch of plant for assigned trees using signature.
     * @param _verifyAssignedTreeData array of verifyAssignedTree data including signature{v,r,s} and planting data
     */
    function verifyAssignedTreeBatch(
        VerifyAssignedTreeData[] calldata _verifyAssignedTreeData
    ) external;

    /**
     * @dev allowed verifier can verify plant for assigned tree using signature.
     * @param _nonce nonce value that signature created with
     * @param _planter address of planter
     * @param _treeId id of tree to verify
     * @param _treeSpecs treeSpecs data
     * @param _birthDate birthDate of tree
     * @param _countryCode countryCode of tree
     * @param _v signature data
     * @param _r signature data
     * @param _s signature data
     */
    function verifyAssignedTree(
        uint256 _nonce,
        address _planter,
        uint256 _treeId,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    /**
     * @dev allowed verifier can verify batch of updates for trees using signature.
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     * @param _verifyUpdateData array of verifyAssignedTree data including signature{v,r,s} and planting data
     */
    function verifyUpdateBatch(
        VerifyUpdateData[] calldata _verifyUpdateData
    ) external;

    /**
     * @dev allowed verifier can verify update for a tree using signature.
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     * @param _nonce nonce value that signature created with
     * @param _planter address of planter
     * @param _treeId id of tree to verify update
     * @param _treeSpecs treeSpecs data
     * @param _v signature data
     * @param _r signature data
     * @param _s signature data
     */
    function verifyUpdate(
        uint256 _nonce,
        address _planter,
        uint256 _treeId,
        string memory _treeSpecs,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    /**
     * @dev check if a tree is free to take part in sale and set {_saleType}
     * to saleType of tree when tree is not in use
     * @param _treeId id of tree to check
     * @param _saleType saleType for tree
     * @return 0 if a tree ready for a sale and 1 if a tree is in use or minted before
     */
    function manageSaleType(
        uint256 _treeId,
        uint32 _saleType
    ) external returns (uint32);

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

    /**
     * @dev admin set new value for lastRegualarTreeId
     * NOTE emit a {LastRegualarTreeIdUpdated} event
     * @param _lastRegualarTreeId new value of lastRegualarTreeId
     */
    function updateLastRegualarTreeId(uint256 _lastRegualarTreeId) external;

    /**
     * @dev allowed verifier can verify batch of plants for regular trees using signature.
     * @param _verifyTreeData array of verifyTree data including signature{v,r,s} and planting data
     */
    function verifyTreeBatch(
        VerifyTreeData[] calldata _verifyTreeData
    ) external;

    /**
     * @dev allowed verifier can verify plant for regular tree using signature.
     * @param _nonce nonce value that signature created with
     * @param _planter address of planter
     * @param _treeSpecs treeSpecs data
     * @param _birthDate birthDate of tree
     * @param _countryCode countryCode of tree
     * @param _v signature data
     * @param _r signature data
     * @param _s signature data
     */

    function verifyTree(
        uint256 _nonce,
        address _planter,
        string memory _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    /**
     * @dev mint a tree to funder of tree
     * @param _lastFundedTreeId The last tree funded in the regular sale
     * @param _funder funder of a new tree sold in Regular
     * @return the last tree funded after update
     */
    function mintTree(
        uint256 _lastFundedTreeId,
        address _funder
    ) external returns (uint256);

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
    function updateTreeSpecs(
        uint64 _treeId,
        string calldata _treeSpecs
    ) external;

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
    function trees(
        uint256 _treeId
    )
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
     * @param _treeId id of tree to get data
     * @return updateSpecs
     * @return updateStatus
     */
    function treeUpdates(
        uint256 _treeId
    ) external view returns (string memory, uint64);

    /** return TempTree data
     * @param _tempTreeId id of tempTree to get data
     * @return birthDate
     * @return plantDate
     * @return countryCode
     * @return otherData
     * @return planter
     * @return treeSpecs
     */
    function tempTrees(
        uint256 _tempTreeId
    )
        external
        view
        returns (uint64, uint64, uint64, uint64, address, string memory);

    /** return planters nonce
     * @param _planter address of planter
     * @return nonce
     */
    function plantersNonce(
        address _planter
    ) external view returns (uint256 nonce);
}
