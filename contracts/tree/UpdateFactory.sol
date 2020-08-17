// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../access/AccessRestriction.sol";
import "./TreeFactory.sol";

contract UpdateFactory is AccessRestriction  {
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
    //  right auction in our setUpdateFactoryAddress() call.
    bool public isUpdateFactory = true;

    Update[] public updates;
    mapping(uint256 => uint256[]) public treeUpdates;

    mapping(uint256 => bool) public updateToPlanterBalanceWithdrawn;
    mapping(uint256 => bool) public updateToAmbassadorBalanceWithdrawn;

    //@todo permission check
    // must one pending update after delete or accpet can post other update
    // update difference must check
    // only planter of the tree can send update
    function post(uint256 _treeId, string calldata _imageHash) external onlyPlanter {
        updates.push(Update(_treeId, _imageHash, now, 0, false));
        uint256 id = updates.length - 1;

        treeUpdates[_treeId].push(id);

        emit UpdateAdded(id, _treeId, _imageHash);
    }

    function acceptUpdate(uint256 _updateId) external onlyAdmin {
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
    
    // function getUpdate(uint _id) public view returns (uint256[] memory) {
    //     return treeUpdates[_id];
    // }


}
