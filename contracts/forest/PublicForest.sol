// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Holder.sol";

import "../tree/TreeFactory.sol";

contract PublicForest is Initializable, ContextUpgradeSafe, ERC721HolderUpgradeSafe {
    using SafeMath for uint256;

    event ContributionReceived(address from, uint256 value);
    event TreesAddedToForest(uint256 count);

    // exteranl contracts
    TreeFactory public treeFactory;

    function initialize(address _treeFactoryAddress)
        public
        initializer
    {
        TreeFactory candidateContract = TreeFactory(_treeFactoryAddress);
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
