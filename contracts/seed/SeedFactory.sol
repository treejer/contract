// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/AccessRestriction.sol";
import "../tree/TreeFactory.sol";

contract SeedFactory is ERC20UpgradeSafe {
    using SafeMath for uint256;

    event SeedMinted(address owner, uint256 totalSeed);
    event SeedGeneratedPerSecondChanged(uint256 seedGeneratedPerSecond);

    TreeFactory public treeFactory;
    AccessRestriction public accessRestriction;

    uint256 public seedGeneratedPerSecond;

    mapping(uint256 => uint256) public treesLastMintedDate;

    function initialize(address _accessRestrictionAddress) public initializer {
        AccessRestriction candidateContract = AccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20UpgradeSafe.__ERC20_init("Seed", "SEED");
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function setSeedGeneratedPerSecond(uint256 _seedGeneratedPerSecond)
        external
    {
        accessRestriction.ifAdmin(msg.sender);

        seedGeneratedPerSecond = _seedGeneratedPerSecond;

        emit SeedGeneratedPerSecondChanged(_seedGeneratedPerSecond);
    }

    function calculateMintableSeed(address _owner)
        external
        view
        returns (uint256)
    {
        uint256 ownerTreesCount = treeFactory.ownerTreesCount(_owner);

        if (ownerTreesCount == 0) {
            return 0;
        }
        uint256 totalSeconds = 0;

        for (uint256 i = 0; i < ownerTreesCount; i++) {
            uint256 treeId = treeFactory.tokenOfOwnerByIndex(_owner, i);

            (, , , , uint256 treeFundedDate, , ) = treeFactory.trees(treeId);
            if (treeFundedDate == 0) {
                continue;
            }

            if (treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds.add(
                    block.timestamp.sub(treesLastMintedDate[treeId])
                );
            } else {
                totalSeconds = totalSeconds.add(
                    block.timestamp.sub(treeFundedDate)
                );
            }
        }

        if (totalSeconds == 0) {
            return 0;
        }

        return (seedGeneratedPerSecond.mul(totalSeconds));
    }

    function calculateTreeGeneratedSeed(uint256 _treeId)
        external
        view
        returns (uint256)
    {
        (, , , , uint256 treeFundedDate, , ) = treeFactory.trees(_treeId);

        if (treeFundedDate == 0) {
            return 0;
        }

        return seedGeneratedPerSecond.mul(block.timestamp.sub(treeFundedDate));
    }

    function mint() external {
        uint256 ownerTreesCount = treeFactory.ownerTreesCount(msg.sender);

        require(ownerTreesCount > 0, "Owner tree count is zero");

        uint256 totalSeconds = 0;

        for (uint256 i = 0; i < ownerTreesCount; i++) {
            uint256 treeId = treeFactory.tokenOfOwnerByIndex(msg.sender, i);
            (, , , , uint256 treeFundedDate, , ) = treeFactory.trees(treeId);
            if (treeFundedDate == 0) {
                continue;
            }

            if (treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds.add(
                    block.timestamp.sub(treesLastMintedDate[treeId])
                );
            } else {
                totalSeconds = totalSeconds.add(
                    block.timestamp.sub(treeFundedDate)
                );
            }

            treesLastMintedDate[treeId] = block.timestamp;
        }

        require(totalSeconds > 0, "Total Seconds are zero");

        uint256 mintableSeed = seedGeneratedPerSecond.mul(totalSeconds);

        require(mintableSeed > 0, "MintableSeed is zero");

        _mint(msg.sender, mintableSeed);

        emit SeedMinted(msg.sender, mintableSeed);
    }
}
