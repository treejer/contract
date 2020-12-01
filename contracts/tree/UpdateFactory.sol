// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/AccessRestriction.sol";
import "./TreeFactory.sol";
import "../greenblock/GBFactory.sol";

contract UpdateFactory is Initializable, ContextUpgradeSafe {
    using SafeMath for uint256;

    event UpdateAdded(uint256 updateId, uint256 treeId, string imageHash);
    event UpdateAccepted(uint256 updateId, address byWho);

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
    GBFactory public gbFactory;

    function initialize(address _accessRestrictionAddress) public initializer {
        isUpdateFactory = true;
        AccessRestriction candidateContract = AccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function setGBFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        GBFactory candidateContract = GBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    // update difference must check
    function post(uint256 _treeId, string calldata _imageHash) external {
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanter(msg.sender);

        require(
            treeFactory.treeToPlanter(_treeId) == msg.sender,
            "Only Planter of tree can send update"
        );

        if (treeUpdates[_treeId].length > 0) {
            require(
                updates[treeUpdates[_treeId][treeUpdates[_treeId].length.sub(
                    1
                )]]
                    .status == 1,
                "Last update not accepeted, please wait until it accpeted and after that send new update"
            );
        }

        updates.push(Update(_treeId, _imageHash, block.timestamp, 0, false));
        uint256 id = updates.length.sub(1);

        treeUpdates[_treeId].push(id);

        emit UpdateAdded(id, _treeId, _imageHash);
    }

    function acceptUpdate(uint256 _updateId) external {
        require(
            accessRestriction.isAdmin(msg.sender) ||
                accessRestriction.isAmbassador(msg.sender) ||
                accessRestriction.isPlanter(msg.sender),
            "Admin or ambassador or planter can accept updates!"
        );

        require(
            updates[_updateId].status == 0,
            "update status must be pending!"
        );

        if (accessRestriction.isAdmin(msg.sender) != true) {
            uint256 treeId = updates[_updateId].treeId;

            require(
                treeFactory.treeToPlanter(treeId) != msg.sender,
                "Planter of tree can't accept update"
            );

            uint256 gbId = treeFactory.treeToGB(treeId);

            if (accessRestriction.isAmbassador(msg.sender)) {
                require(
                    gbFactory.gbToAmbassador(gbId) == msg.sender,
                    "only ambassador of that greenBlock can accept update!"
                );
            } else {
                bool isInGB = false;

                for (
                    uint index = 0;
                    index < gbFactory.getGBPlantersCount(gbId);
                    index++
                ) {
                    if (gbFactory.gbToPlanters(gbId, index) == msg.sender) {
                        isInGB = true;
                    }
                }

                require(
                    isInGB == true,
                    "only one of planters of that greenBlock can accept update!"
                );
            }
        }

        updates[_updateId].status = 1;
        emit UpdateAccepted(_updateId, msg.sender);
    }

    function getTreeUpdates(uint256 _treeId)
        public
        view
        returns (uint256[] memory)
    {
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

    function isTreeLastUpdateMinted(uint256 _treeId)
        public
        view
        returns (bool)
    {
        return
            updates[treeUpdates[_treeId][treeUpdates[_treeId].length.sub(1)]]
                .minted;
    }

    function setMinted(uint256 _id, bool _minted) external {
        // todo must fix this
        // require(
        //     treeFactory.ownerOf(_id) == msg.sender,
        //     "Only owner of tree can change the minted"
        // );
        updates[_id].minted = _minted;
    }

    function isTreeLastUpdatePlanterBalanceWithdrawn(uint256 _treeId)
        public
        view
        returns (bool)
    {
        return
            updateToPlanterBalanceWithdrawn[treeUpdates[_treeId][treeUpdates[_treeId]
                .length - 1]];
    }

    function isPlanterBalanceWithdrawn(uint256 _id) public view returns (bool) {
        return updateToPlanterBalanceWithdrawn[_id];
    }

    function setPlanterBalanceWithdrawn(uint256 _id) public {
        updateToPlanterBalanceWithdrawn[_id] = true;
    }

    function isTreeLastUpdateAmbassadorBalanceWithdrawn(uint256 _treeId)
        public
        view
        returns (bool)
    {
        return
            updateToAmbassadorBalanceWithdrawn[treeUpdates[_treeId][treeUpdates[_treeId]
                .length
                .sub(1)]];
    }

    function isAmbassadorBalanceWithdrawn(uint256 _id)
        public
        view
        returns (bool)
    {
        return updateToAmbassadorBalanceWithdrawn[_id];
    }

    function setAmbassadorBalanceWithdrawn(uint256 _id) public {
        updateToAmbassadorBalanceWithdrawn[_id] = true;
    }
}
