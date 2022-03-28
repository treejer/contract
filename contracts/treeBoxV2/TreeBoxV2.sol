// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../gsn/RelayRecipient.sol";
import "./ITreeBoxV2.sol";
import "./../tree/ITree.sol";

contract TreeBoxV2 is OwnableUpgradeable, PausableUpgradeable, ITreeBoxV2 {
    struct Box {
        address sender;
        uint256 treeId;
    }

    bool public override isTreeBox;
    ITree public treeToken;

    mapping(address => Box) public override boxes;

    modifier ifNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    function initialize(address _token) external override initializer {
        OwnableUpgradeable.__Ownable_init();
        PausableUpgradeable.__Pausable_init();

        isTreeBox = true;

        ITree candidateContract = ITree(_token);

        treeToken = candidateContract;

        require(candidateContract.isTree());
    }

    // function _msgSender()
    //     internal
    //     view
    //     virtual
    //     override
    //     returns (address payable ret)
    // {}

    // function setTrustedForwarder(address _address)
    //     external
    //     override
    //     onlyOwner
    //     validAddress(_address)
    // {
    //     trustedForwarder = _address;
    // }

    function create(address[] calldata _recievers, uint256[] calldata _treeIds)
        external
        override
        ifNotPaused
    {
        require(_recievers.length == _treeIds.length, "Invalid input");

        for (uint256 i = 0; i < _recievers.length; i++) {
            require(
                boxes[_recievers[i]].sender == address(0),
                "public key is exists"
            );

            boxes[_recievers[i]].sender = _msgSender();
            boxes[_recievers[i]].treeId = _treeIds[i];

            treeToken.transferFrom(_msgSender(), address(this), _treeIds[i]);
        }
    }

    function claim(address _reciever) external override ifNotPaused {
        require(_reciever != _msgSender(), "can't transfer to msg.sender");

        require(
            boxes[_msgSender()].sender != address(0),
            "public key is not exists"
        );

        uint256 treeId = boxes[_msgSender()].treeId;

        delete boxes[_msgSender()];

        treeToken.safeTransferFrom(address(this), _reciever, treeId);
    }

    function withdraw(address[] calldata _recievers)
        external
        override
        ifNotPaused
    {
        for (uint256 i = 0; i < _recievers.length; i++) {
            if (boxes[_recievers[i]].sender == _msgSender()) {
                uint256 treeId = boxes[_msgSender()].treeId;

                delete boxes[_msgSender()];

                treeToken.safeTransferFrom(address(this), _msgSender(), treeId);
            }
        }
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }
}
