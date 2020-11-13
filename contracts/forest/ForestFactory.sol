// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

import "../access/AccessRestriction.sol";
import "../tree/TreeFactory.sol";
import "./PublicForest.sol";


contract ForestFactory is Initializable, ContextUpgradeSafe {

    event PublicForestCreated(address forestAddress, string name);

    address[] public forests;


    TreeFactory public treeFactory;
    AccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        
        AccessRestriction candidateContract = AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function createPublicForest(string calldata _name) external {
        accessRestriction.ifAdmin(msg.sender);

        PublicForest newForest = new PublicForest();
        newForest.initialize(address(treeFactory), _name);

        forests.push(address(newForest));

        emit PublicForestCreated(address(newForest), _name);
    }

}
