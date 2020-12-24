// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/IAccessRestriction.sol";
import "./ITreeFactory.sol";
import "../greenblock/IGBFactory.sol";

contract UpdateFactory is Initializable {
    using SafeMath for uint256;

    event UpdateAdded(uint256 updateId, uint256 treeId, string imageHash);
    event UpdateAccepted(uint256 updateId, address byWho);

    struct Update {
        uint256 treeId;
        string imageHash;
        uint256 updateDate;
        bool status;
    }

    // @dev Sanity check that allows us to ensure that we are pointing to the
    //  right contract in our setUpdateFactoryAddress() call.
    bool public isUpdateFactory;

    Update[] public updates;
    mapping(uint256 => uint256[]) public treeUpdates;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IGBFactory public gbFactory;

    function initialize(address _accessRestrictionAddress) public initializer {
        isUpdateFactory = true;
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function setGBFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        IGBFactory candidateContract = IGBFactory(_address);
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
                updates[
                    treeUpdates[_treeId][treeUpdates[_treeId].length.sub(1)]
                ]
                    .status == true,
                "Last update not accepted, please wait until it accepted and after that send new update"
            );
        }

        updates.push(Update(_treeId, _imageHash, block.timestamp, false));
        uint256 id = updates.length.sub(1);

        treeUpdates[_treeId].push(id);

        emit UpdateAdded(id, _treeId, _imageHash);
    }

    function acceptUpdate(uint256 _updateId) external {
        require(
            accessRestriction.isAdmin(msg.sender) ||
                accessRestriction.isPlanterOrAmbassador(msg.sender),
            "Admin or ambassador or planter can accept updates!"
        );

        require(
            updates[_updateId].status == false,
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
                    uint256 index = 0;
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

        updates[_updateId].status = true;
        emit UpdateAccepted(_updateId, msg.sender);
    }

    function getTreeUpdates(uint256 _treeId)
        public
        view
        returns (uint256[] memory)
    {
        return treeUpdates[_treeId];
    }

    function getTreeLastUpdateId(uint256 _treeId)
        public
        view
        returns (uint256)
    {
        return treeUpdates[_treeId][treeUpdates[_treeId].length.sub(1)];
    }
}
