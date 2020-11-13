// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

import "../tree/TreeFactory.sol";

contract PublicForest is Initializable, ContextUpgradeSafe {
    using SafeMath for uint256;

    event ContributionReceived(address from, uint256 value);
    event TreesAddedToForest(uint256 count);
    event Log(uint256 b);

    string name;
    struct Contributor {
        address who;
    }
    Contributor[] public contributors;
    mapping(address => uint256) public contributorFund;

    // exteranl contracts
    TreeFactory public treeFactory;

    function initialize(address _treeFactoryAddress, string calldata _name)
        public
        initializer
    {
        TreeFactory candidateContract = TreeFactory(_treeFactoryAddress);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;

        name = _name;
    }

    function totalContributors() external view returns (uint256) {
        return contributors.length;
    }

    fallback() external payable {
        //do something
        require(msg.value > 0, "Contribution must bigger than zero");

        contributors.push(Contributor(msg.sender));
        contributorFund[msg.sender] = contributorFund[msg.sender] + msg.value;

        emit ContributionReceived(msg.sender, msg.value);

        // get balance of contract
        // uint256 balance = address(this).balance.add(msg.value);
        uint256 balance = address(this).balance;

        uint treePrice = 20000000000000000;

        // if it reach the treePrice fund a tree
        if (balance >= treePrice) {
            uint256 count = balance.div(treePrice);

            if (count > 0) {
                // treeFactory.fund.value(count.mul(treeFactory.price()))(count);
                treeFactory.fund{value: count.mul(treeFactory.price())}(count);
                // treeFactory.fund{value: 42, gas: 23}(count);

                emit TreesAddedToForest(count);
            }
        }
    }
}
