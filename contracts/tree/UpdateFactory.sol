// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;


import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../access/AccessRestriction.sol";
import "./TreeFactory.sol";

contract UpdateFactory is Initializable {
    event UpdateAdded(uint256 updateId, uint256 treeId, string imageHash);
    event UpdateAccepted(uint256 updateId);

    struct Update {
        uint256 treeId;
        string imageHash;
        uint256 updateDate;
        uint8 status;
        bool minted;
    }

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isUpdateFactory;

    Update[] public updates;
    mapping(uint256 => uint256[]) public treeUpdates;

    mapping(uint256 => bool) public updateToPlanterBalanceWithdrawn;
    mapping(uint256 => bool) public updateToAmbassadorBalanceWithdrawn;

    AccessRestriction public accessRestriction;
    TreeFactory public treeFactory;


    function initialize(address _accessRestrictionAddress) public initializer {
        isUpdateFactory = true;
        AccessRestriction candidateContract = AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    //@todo permission check
    // update difference must check
    function post(uint256 _treeId, string calldata _imageHash) external {
        
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanter(msg.sender);

        require(treeFactory.treeToPlanter(_treeId) == msg.sender, "Only Planter of tree can send update");

        if(treeUpdates[_treeId].length > 0) {
            require(updates[treeUpdates[_treeId][treeUpdates[_treeId].length - 1]].status == 1,
            "Last update not accepeted, please wait until it accpeted and after that send new update"); 
        }

        updates.push(Update(_treeId, _imageHash, block.timestamp, 0, false));
        uint256 id = updates.length - 1;

        treeUpdates[_treeId].push(id);

        emit UpdateAdded(id, _treeId, _imageHash);
    }

    function acceptUpdate(uint256 _updateId) external {
        accessRestriction.ifAdmin(msg.sender);

        updates[_updateId].status = 1;
        emit UpdateAccepted(_updateId);
    }

    function getTreeUpdates(uint _treeId) public view returns (uint256[] memory) {
        return treeUpdates[_treeId];
    }

    function getUpdateDate(uint256 _id) public view returns (uint256) {
        return updates[_id].updateDate;
    }

    function getTreeId(uint256 _id) public view returns (uint256) {
        return updates[_id].treeId;
    }

    function getImageHash(uint256 _id) public view returns (string memory) {
        return updates[_id].imageHash;
    }

    function getStatus(uint256 _id) public view returns (uint8) {
        return updates[_id].status;
    }

    function isMinted(uint256 _id) public view returns (bool) {
        return updates[_id].minted;
    }

    function isTreeLastUpdateMinted(uint256 _treeId) public view returns (bool) {
        return updates[treeUpdates[_treeId][treeUpdates[_treeId].length - 1]].minted;
    }

    //@todo permission must check only owner of tree can change the minted
    function setMinted(uint256 _id, bool _minted) public {
        updates[_id].minted = _minted;
    }

    function isTreeLastUpdatePlanterBalanceWithdrawn(uint256 _treeId) public view returns (bool) {
        return updateToPlanterBalanceWithdrawn[treeUpdates[_treeId][treeUpdates[_treeId].length - 1]];
    }

    function isPlanterBalanceWithdrawn(uint256 _id) public view returns (bool) {
        return updateToPlanterBalanceWithdrawn[_id];
    }

    function setPlanterBalanceWithdrawn(uint256 _id) public {
        updateToPlanterBalanceWithdrawn[_id] = true;
    }

    function isTreeLastUpdateAmbassadorBalanceWithdrawn(uint256 _treeId) public view returns (bool) {
        return updateToAmbassadorBalanceWithdrawn[treeUpdates[_treeId][treeUpdates[_treeId].length - 1]];
    }

    function isAmbassadorBalanceWithdrawn(uint256 _id) public view returns (bool) {
        return updateToAmbassadorBalanceWithdrawn[_id];
    }

    function setAmbassadorBalanceWithdrawn(uint256 _id) public {
        updateToAmbassadorBalanceWithdrawn[_id] = true;
    }
    
    // function getUpdate(uint _id) public view returns (uint256[] memory) {
    //     return treeUpdates[_id];
    // }


}
