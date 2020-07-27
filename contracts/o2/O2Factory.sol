// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../tree/TreeFactory.sol";
import "../tree/UpdateFactory.sol";
import "../tree/TreeType.sol";

contract O2Factory is ERC20 {
    TreeType public treeType;
    TreeFactory public treeFactory;
    UpdateFactory public updateFactory;

    constructor(
        TreeType _typeAddress,
        TreeFactory _treeFactoryAddress,
        UpdateFactory _updateFactoryAddress
    ) public ERC20("Oxygen", "O2") {
        treeType = _typeAddress;
        treeFactory = _treeFactoryAddress;
        updateFactory = _updateFactoryAddress;
        _mint(msg.sender, 0);
    }

    event O2Minted(address owner, uint256 totalO2);

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
                    totalSeconds =
                        totalSeconds +
                        updateFactory.getUpdateDate(jUpdateId) -
                        treeFactory.getPlantedDate(treeId);
                }

                updateFactory.setMinted(jUpdateId, true);
            }

            uint256 o2Formula = treeType.getO2Formula(
                treeFactory.getTypeId(treeId)
            );

            mintableO2 = mintableO2 + o2Formula * totalSeconds;
        }

        require(mintableO2 > 0, "MintableO2 is zero");

        _mint(msg.sender, mintableO2);

        emit O2Minted(msg.sender, mintableO2);
    }
}
