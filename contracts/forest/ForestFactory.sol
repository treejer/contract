// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "./PublicForest.sol";

contract ForestFactory is Initializable {
    event PublicForestCreated(address forestAddress);

    address[] public forests;

    ITreeFactory public treeFactory;
    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
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

    function createPublicForest() external {
        accessRestriction.ifAdmin(msg.sender);

        PublicForest newForest = new PublicForest();
        newForest.initialize(address(treeFactory));

        forests.push(address(newForest));

        emit PublicForestCreated(address(newForest));
    }
}
