// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

import "../gsn/RelayRecipient.sol";
import "./ITreeBox.sol";
import "../access/IAccessRestriction.sol";
import "./../tree/ITree.sol";

contract TreeBox is
    Initializable,
    RelayRecipient,
    IERC721ReceiverUpgradeable,
    ITreeBox
{
    struct Box {
        address sender;
        string ipfsHash;
        uint256[] treeIds;
    }

    bool public override isTreeBox;

    ITree public treeToken;
    IAccessRestriction public accessRestriction;

    //NOTE mapping of recipient to Box
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
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);

        treeToken = ITree(_token);

        isTreeBox = true;

        require(accessRestriction.isAccessRestriction());
        require(treeToken.isTree());
    }

    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function create(Input[] calldata _input) external override ifNotPaused {
        for (uint256 i = 0; i < _input.length; i++) {
            require(
                boxes[_input[i].recipient].sender == address(0) ||
                    boxes[_input[i].recipient].sender == _msgSender(),
                "recipient exists"
            );

            boxes[_input[i].recipient].sender = _msgSender();
            boxes[_input[i].recipient].ipfsHash = _input[i].ipfsHash;

            emit Created(_msgSender(), _input[i].recipient);

            for (uint256 j = 0; j < _input[i].treeIds.length; j++) {
                boxes[_input[i].recipient].treeIds.push(_input[i].treeIds[j]);

                treeToken.transferFrom(
                    _msgSender(),
                    address(this),
                    _input[i].treeIds[j]
                );
            }
        }
    }

    function claim(address _recipient) external override ifNotPaused {
        require(
            boxes[_msgSender()].sender != address(0),
            "recipient not exists"
        );

        require(_recipient != _msgSender(), "recipient is msg.sender");

        uint256[] memory treeIds = boxes[_msgSender()].treeIds;

        emit Claimed(_msgSender(), _recipient, treeIds);

        delete boxes[_msgSender()];

        for (uint256 i = 0; i < treeIds.length; i++) {
            treeToken.safeTransferFrom(address(this), _recipient, treeIds[i]);
        }
    }

    function withdraw(address[] calldata _recipients)
        external
        override
        ifNotPaused
    {
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(
                boxes[_recipients[i]].sender == _msgSender(),
                "invalid recipients"
            );
        }

        for (uint256 i = 0; i < _recipients.length; i++) {
            // uint256[] memory treeIds = boxes[_msgSender()].treeIds;
            uint256[] memory treeIds = boxes[_recipients[i]].treeIds;

            delete boxes[_msgSender()];

            emit Withdrew(_msgSender(), _recipients[i], treeIds);

            for (uint256 j = 0; j < treeIds.length; j++) {
                treeToken.safeTransferFrom(
                    address(this),
                    _msgSender(),
                    treeIds[j]
                );
            }
        }
    }

    function getReceiverTreeByIndex(address _recipient, uint256 _index)
        external
        view
        override
        returns (uint256)
    {
        return boxes[_recipient].treeIds[_index];
    }

    function getReceiverTreesLength(address _recipient)
        external
        view
        override
        returns (uint256)
    {
        return boxes[_recipient].treeIds.length;
    }
}
