// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "../gsn/RelayRecipient.sol";
import "./ITreeBoxV2.sol";
import "../access/IAccessRestriction.sol";
import "./../tree/ITree.sol";

contract TreeBoxV2 is Initializable, RelayRecipient, ITreeBoxV2 {
    bool public override isTreeBox;

    ITree public treeToken;
    IAccessRestriction public accessRestriction;

    mapping(address => Box) public override boxes;

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    function initialize(address _token, address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        isTreeBox = true;

        ITree candidateContractTree = ITree(_token);

        treeToken = candidateContractTree;

        require(candidateContract.isAccessRestriction());
        require(candidateContractTree.isTree());
    }

    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    function create(Input[] calldata _input) external override ifNotPaused {
        for (uint256 i = 0; i < _input.length; i++) {
            require(
                boxes[_input[i].reciever].sender == address(0) ||
                    boxes[_input[i].reciever].sender == _msgSender(),
                "public key is exists"
            );

            boxes[_input[i].reciever].sender = _msgSender();

            for (uint256 j = 0; j < _input[i].treeIds.length; j++) {
                boxes[_input[i].reciever].treeIds.push(_input[i].treeIds[j]);

                treeToken.transferFrom(
                    _msgSender(),
                    address(this),
                    _input[i].treeIds[j]
                );
            }
        }
    }

    function claim(address _reciever) external override ifNotPaused {
        require(_reciever != _msgSender(), "can't transfer to msg.sender");

        require(
            boxes[_msgSender()].sender != address(0),
            "public key is not exists"
        );

        uint256[] memory treeIds = boxes[_msgSender()].treeIds;

        delete boxes[_msgSender()];

        for (uint256 i = 0; i < treeIds.length; i++) {
            treeToken.safeTransferFrom(address(this), _reciever, treeIds[i]);
        }
    }

    function withdraw(address[] calldata _recievers)
        external
        override
        ifNotPaused
    {
        for (uint256 i = 0; i < _recievers.length; i++) {
            if (boxes[_recievers[i]].sender == _msgSender()) {
                uint256[] memory treeIds = boxes[_msgSender()].treeIds;
                delete boxes[_msgSender()];

                for (uint256 j = 0; j < treeIds.length; j++) {
                    treeToken.safeTransferFrom(
                        address(this),
                        _msgSender(),
                        treeIds[j]
                    );
                }
            }
        }
    }
}
