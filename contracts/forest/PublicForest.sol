// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";

import "../tree/ITreeFactory.sol";

contract PublicForest is Initializable, ERC721HolderUpgradeable {
    using SafeMathUpgradeable for uint256;

    event ContributionReceived(address from, uint256 value);
    event TreesAddedToForest(uint256 count);

    // exteranl contracts
    ITreeFactory public treeFactory;

    function initialize(address _treeFactoryAddress) public initializer {
        ITreeFactory candidateContract = ITreeFactory(_treeFactoryAddress);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    receive() external payable {
        emit ContributionReceived(msg.sender, msg.value);
    }

    function donate() external payable {
        //do something
        require(msg.value > 0, "Contribution must bigger than zero");

        emit ContributionReceived(msg.sender, msg.value);

        this.fundTree();
    }

    function fundTree() external {
        // get balance of contract
        uint256 balance = address(this).balance;

        uint256 treePrice = treeFactory.price();

        // if it reach the treePrice fund a tree
        if (balance >= treePrice) {
            uint256 count = balance.div(treePrice);

            if (count > 0) {
                treeFactory.fund{value: count.mul(treePrice)}(count);
                // treeFactory.fund{value: 42, gas: 23}(count);

                emit TreesAddedToForest(count);
            }
        }
    }
}
