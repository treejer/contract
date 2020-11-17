// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

import "../access/AccessRestriction.sol";
import "../tree/TreeFactory.sol";


contract O1Factory is ERC20UpgradeSafe {

    event O1Minted(address owner, uint256 totalO1);
    event O1GeneratedPerSecondChanged(uint256 o1GeneratedPerSecond);

    TreeFactory public treeFactory;
    AccessRestriction public accessRestriction;

    uint256 public o1GeneratedPerSecond;

    mapping(uint256 => uint256) public treesLastMintedDate;

    function initialize(address _accessRestrictionAddress) public initializer {
        
        AccessRestriction candidateContract = AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        ERC20UpgradeSafe.__ERC20_init(
            "OxygenBeta",
            "O1"
        );
    }


    function setTreeFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        TreeFactory candidateContract = TreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }


    function setO1GeneratedPerSecond(uint256 _o1GeneratedPerSecond) external {
        accessRestriction.ifAdmin(msg.sender);

        o1GeneratedPerSecond = _o1GeneratedPerSecond;

        emit O1GeneratedPerSecondChanged(_o1GeneratedPerSecond);
    }

    function calculateMintableO1(address _owner) external view returns(uint256)
    {
        uint256 ownerTreesCount = treeFactory.ownerTreesCount(_owner);

        if(ownerTreesCount == 0) {
            return 0;
        }
        uint256 totalSeconds = 0;

        for (
            uint256 i = 0;
            i < ownerTreesCount;
            i++
        ) {
            uint256 treeId = treeFactory.tokenOfOwnerByIndex(_owner, i);

            (,,,,,uint256 treeFundedDate,,) = treeFactory.trees(treeId);
            if(treeFundedDate == 0) {
                continue;
            }

            if(treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds + (block.timestamp - treesLastMintedDate[treeId]);
            } else {
                totalSeconds = totalSeconds + (block.timestamp - treeFundedDate);
            }
        }

        if(totalSeconds == 0) {
            return 0;
        }

        return (o1GeneratedPerSecond * totalSeconds);
    }

    function calculateTreeGeneratedO1(uint _treeId) external view returns(uint256) {
        
        (,,,,,uint256 treeFundedDate,,) = treeFactory.trees(_treeId);

        if(treeFundedDate == 0) {
            return 0;
        }

        return o1GeneratedPerSecond * (block.timestamp - treeFundedDate);
    }
    

    //@todo permission must check
    function mint() external  {

        uint256 ownerTreesCount = treeFactory.ownerTreesCount(msg.sender);

        require(
            ownerTreesCount > 0,
            "Owner tree count is zero"
        );

        uint256 totalSeconds = 0;

        for (
            uint256 i = 0;
            i < ownerTreesCount;
            i++
        ) {
            uint256 treeId = treeFactory.tokenOfOwnerByIndex(msg.sender, i);
            (,,,,,uint256 treeFundedDate,,) = treeFactory.trees(treeId);
            if(treeFundedDate == 0) {
                continue;
            }

            if(treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds + (block.timestamp - treesLastMintedDate[treeId]);
            } else {
                totalSeconds = totalSeconds + (block.timestamp - treeFundedDate);
            }

            treesLastMintedDate[treeId] = block.timestamp;
        }

        require(totalSeconds > 0, "Total Seconds are zero");


        // uint256 mintableO1 = o1GeneratedPerSecond * totalSeconds * (10 ** 18);
        uint256 mintableO1 = o1GeneratedPerSecond * totalSeconds;

        require(mintableO1 > 0, "MintableO1 is zero");

        _mint(msg.sender, mintableO1);

        emit O1Minted(msg.sender, mintableO1);
    }
}
