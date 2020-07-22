// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeFactory.sol";

contract UpdateFactory is TreeFactory {
    event UpdateAdded(uint256 updateId, uint256 treeId, string imageHash);
    event UpdateAccepted(uint256 updateId);

    struct Update {
        uint256 treeId;
        string imageHash;
        uint256 updateDate;
        uint8 status;
        bool minted;
    }

    Update[] public updates;
    mapping(uint256 => uint256[]) public treeUpdates;

    //@todo permission check
    // must one pending update after delete or accpet can post other update
    // update difference must check
    function post(uint256 _treeId, string calldata _imageHash) external {
        updates.push(Update(_treeId, _imageHash, now, 0, false));
        uint256 id = updates.length - 1;

        treeUpdates[_treeId].push(id);

        emit UpdateAdded(id, _treeId, _imageHash);
    }

    function acceptUpdate(uint256 _updateId) external {
        updates[_updateId].status = 1;
        emit UpdateAccepted(_updateId);
    }
}
