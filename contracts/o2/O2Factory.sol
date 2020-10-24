// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

import "../access/AccessRestriction.sol";
import "../tree/TreeFactory.sol";
import "../tree/UpdateFactory.sol";
import "../tree/TreeType.sol";

contract O2Factory is ERC20UpgradeSafe {

    event O2Minted(address owner, uint256 totalO2);

    TreeType public treeType;
    TreeFactory public treeFactory;
    UpdateFactory public updateFactory;
    AccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        AccessRestriction candidateContract = AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20UpgradeSafe.__ERC20_init(
            "Oxygen",
            "O2"
        );
    }

    function setTreeTypeAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeType candidateContract = TreeType(_address);
        require(candidateContract.isTreeType());
        treeType = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }


    function setUpdateFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        UpdateFactory candidateContract = UpdateFactory(_address);
        require(candidateContract.isUpdateFactory());
        updateFactory = candidateContract;
    }


    //@todo permission must check
    function mint() external  {

        uint256 ownerTreesCount = treeFactory.ownerTreesCount(msg.sender);

        require(
            ownerTreesCount > 0,
            "Owner tree count is zero"
        );

        uint256 mintableO2 = 0;

        for (
            uint256 i = 0;
            i < ownerTreesCount;
            i++
        ) {
            uint256 treeId = treeFactory.tokenOfOwnerByIndex(msg.sender, i);
            uint256[] memory treeUpdates = updateFactory.getTreeUpdates(treeId);
            uint256 totalSeconds = 0;

            if (treeUpdates.length == 0) {
                continue;
            }

            if (updateFactory.isTreeLastUpdateMinted(treeId) == true) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j - 1];

                if (updateFactory.getStatus(jUpdateId) != 1) {
                    continue;
                }

                if (updateFactory.isMinted(jUpdateId) == true) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j - 2];

                    if (updateFactory.getStatus(jMinusUpdateId) != 1) {
                        continue;
                    }

                    totalSeconds =
                        totalSeconds +
                        updateFactory.getUpdateDate(jUpdateId) -
                        updateFactory.getUpdateDate(jMinusUpdateId);
                } else {
                    (,,,uint256 plantedDate,,,,) = treeFactory.trees(treeId);

                    totalSeconds =
                        totalSeconds +
                        updateFactory.getUpdateDate(jUpdateId) -
                        plantedDate;
                }

                updateFactory.setMinted(jUpdateId, true);
            }

            uint256 o2Formula = treeType.getO2Formula(
                treeFactory.treeToType(treeId)
            );

            mintableO2 = mintableO2 + o2Formula * totalSeconds;
        }

        require(mintableO2 > 0, "MintableO2 is zero");

        _mint(msg.sender, mintableO2);

        emit O2Minted(msg.sender, mintableO2);
    }
}
