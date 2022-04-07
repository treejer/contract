// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title TreeBox interface */
interface ITreeBox {
    struct Input {
        address recipient;
        string ipfsHash;
        uint256[] treeIds;
    }

    /**
     * @dev emitted when tree box created
     * @param sender address of sender
     * @param recipient address of recipient
     */
    event Created(address sender, address recipient);

    /**
     * @dev emitted when tree box claimed
     * @param claimer address of claimer
     * @param recipient address of recipient
     * @param treeIds id of trees claimed by claimer
     */
    event Claimed(address claimer, address recipient, uint256[] treeIds);

    /**
     * @dev emitted when tree box withdrew
     * @param sender address of sender
     * @param recipient address of recipient
     * @param treeIds id of trees withdrew by sender
     */
    event Withdrew(address sender, address recipient, uint256[] treeIds);

    /**
     * @dev initialize AccessRestriction and TreeToken contract and set true
     * for isTreeBox
     * @param _token address of TreeToken contract
     * @param _accessRestrictionAddress address of AccessRestriction contract
     */
    function initialize(address _token, address _accessRestrictionAddress)
        external;

    /** @dev set {_address} to trusted forwarder */
    function setTrustedForwarder(address _address) external;

    /**
     * @dev msg.sender create treeBoxes for a list of recipients
     * NOTE emit a {Created} event
     * @param _input is an array of Input struct which contains address of
     * recipient, treeIds for that recipient and ipfsHash for that recipient
     */
    function create(Input[] calldata _input) external;

    /**
     * @dev msg.sender claimed trees to the given address
     * NOTE emit a {Claimed} event
     * @param _recipient address of recipient to claim trees for
     */
    function claim(address _recipient) external;

    /**
     * @dev sender of treeBoxes can withdrew unclaimed trees given to recipient
     * NOTE emit a {Withdrew} event
     * @param _recipients array of recipient's addresses to withdrew their trees
     */
    function withdraw(address[] calldata _recipients) external;

    /** @return treeId of a {_recipient} at {_index} in his/her box */
    function getRecipientTreeByIndex(address _recipient, uint256 _index)
        external
        view
        returns (uint256);

    /** @return treeCount for a {_recipient} in his/her box */
    function getRecipientTreesLength(address _recipient)
        external
        view
        returns (uint256);

    /** @return true if TreeBox contract have been initialized */
    function isTreeBox() external view returns (bool);

    /**
     * @return sender of box for {_recipient}
     * @return ipfsHash of box for {_recipient} */
    function boxes(address _recipient)
        external
        view
        returns (address sender, string memory ipfsHash);
}
