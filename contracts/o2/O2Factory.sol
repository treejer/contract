// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/IUpdateFactory.sol";
import "../tree/ITreeType.sol";
import "./IO2.sol";
import "../tree/ITree.sol";

contract O2Factory is Initializable {
    using SafeMath for uint256;

    event O2Minted(address owner, uint256 totalO2);

    ITree public treeToken;
    IO2 public o2Token;
    ITreeType public treeType;
    ITreeFactory public treeFactory;
    IUpdateFactory public updateFactory;
    IAccessRestriction public accessRestriction;

    mapping(uint256 => bool) public updateMinted;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setTreeTokenAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        treeToken = candidateContract;
    }

    function setO2TokenAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        IO2 candidateContract = IO2(_address);
        require(candidateContract.isO2());
        o2Token = candidateContract;
    }

    function setTreeTypeAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITreeType candidateContract = ITreeType(_address);
        require(candidateContract.isTreeType());
        treeType = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function setUpdateFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        IUpdateFactory candidateContract = IUpdateFactory(_address);
        require(candidateContract.isUpdateFactory());
        updateFactory = candidateContract;
    }

    function mint() external {
        uint256 ownerTreesCount = treeToken.balanceOf(msg.sender);

        require(ownerTreesCount > 0, "Owner tree count is zero");

        uint256 mintableO2 = 0;

        for (uint256 i = 0; i < ownerTreesCount; i++) {
            uint256 treeId = treeToken.tokenOfOwnerByIndex(msg.sender, i);
            uint256[] memory treeUpdates = updateFactory.getTreeUpdates(treeId);
            uint256 totalSeconds = 0;

            if (treeUpdates.length == 0) {
                continue;
            }

            if (
                updateMinted[updateFactory.getTreeLastUpdateId(treeId)] == true
            ) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j.sub(1)];

                (, , uint256 jUpdateDate, bool jUpdateStatus) =
                    updateFactory.updates(jUpdateId);

                if (jUpdateStatus != true) {
                    continue;
                }

                if (updateMinted[jUpdateId] == true) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j.sub(2)];

                    (, , uint256 jMUpdateDate, bool jMUpdateStatus) =
                        updateFactory.updates(jMinusUpdateId);

                    if (jMUpdateStatus != true) {
                        continue;
                    }

                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(jMUpdateDate)
                    );
                } else {
                    (, , uint256 plantedDate, , , , ) =
                        treeFactory.trees(treeId);

                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(plantedDate)
                    );
                }

                updateMinted[jUpdateId] = true;
            }

            (, , uint256 o2Formula, ) =
                treeType.types(treeFactory.treeToType(treeId));

            mintableO2 = mintableO2.add(o2Formula.mul(totalSeconds));
        }

        require(mintableO2 > 0, "MintableO2 is zero");

        o2Token.mint(msg.sender, mintableO2);

        emit O2Minted(msg.sender, mintableO2);
    }
}
