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
    address public daiTokenAddress;

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

    function setDaiTokenAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);
        daiTokenAddress = _address;
    }

    function createPublicForest() external {
        accessRestriction.ifAdmin(msg.sender);

        PublicForest newForest = new PublicForest();
        newForest.initialize(address(treeFactory), daiTokenAddress);

        forests.push(address(newForest));

        emit PublicForestCreated(address(newForest));
    }
}
