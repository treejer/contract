// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/ITree.sol";
import "./ISeed.sol";

contract SeedFactory is Initializable {
    using SafeMathUpgradeable for uint256;

    event SeedMinted(address owner, uint256 totalSeed);
    event SeedGeneratedPerSecondChanged(uint256 seedGeneratedPerSecond);

    ISeed public seedToken;
    ITree public treeToken;

    ITreeFactory public treeFactory;
    IAccessRestriction public accessRestriction;

    uint256 public seedGeneratedPerSecond;

    mapping(uint256 => uint256) public treesLastMintedDate;

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setSeedTokenAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ISeed candidateContract = ISeed(_address);
        require(candidateContract.isSeed());
        seedToken = candidateContract;
    }

    function setTreeTokenAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        treeToken = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        ITreeFactory candidateContract = ITreeFactory(_address);
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
        uint256 ownerTreesCount = treeToken.balanceOf(_owner);

        if (ownerTreesCount == 0) {
            return 0;
        }
        uint256 totalSeconds = 0;

        for (uint256 i = 0; i < ownerTreesCount; i++) {
            uint256 treeId = treeToken.tokenOfOwnerByIndex(_owner, i);

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
        uint256 ownerTreesCount = treeToken.balanceOf(msg.sender);

        require(ownerTreesCount > 0, "Owner tree count is zero");

        uint256 totalSeconds = 0;

        for (uint256 i = 0; i < ownerTreesCount; i++) {
            uint256 treeId = treeToken.tokenOfOwnerByIndex(msg.sender, i);
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

        seedToken.mint(msg.sender, mintableSeed);

        emit SeedMinted(msg.sender, mintableSeed);
    }
}
