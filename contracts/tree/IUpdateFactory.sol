// SPDX-License-Identifier: MIT

pragma solidity ^0.6.9;

interface IUpdateFactory {
    event UpdateAdded(uint256 updateId, uint256 treeId, string imageHash);
    event UpdateAccepted(uint256 updateId, address byWho);

    function isUpdateFactory() external view returns (bool);

    function setTreeFactoryAddress(address _address) external;

    function setGBFactoryAddress(address _address) external;

    function acceptUpdate(uint256 _updateId) external;

    function getTreeLastUpdateId(uint256 _treeId)
        external
        view
        returns (uint256);

    function updates(uint256 _index)
        external
        view
        returns (
            uint256 treeId,
            string memory imageHash,
            uint256 updateDate,
            bool status
        );

    function treeUpdates(uint256 _updateId, uint256 _index)
        external
        view
        returns (uint256);

    function getTreeUpdates(uint256 _treeId)
        external
        view
        returns (uint256[] memory);

    function post(uint256 _treeId, string calldata _imageHash) external;
}
