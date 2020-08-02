// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../tree/TreeFactory.sol";
import "../access/AccessRestriction.sol";


contract O1Factory is ERC20, AccessRestriction {

    event O1Minted(address owner, uint256 totalO1);
    event O1GeneratedPerSecondChanged(uint256 o1GeneratedPerSecond);
    event ConsoleLog(uint date);

    TreeFactory public treeFactory;


    uint256 public o1GeneratedPerSecond;

    mapping(uint256 => uint256) public treesLastMintedDate;


    constructor(
        TreeFactory _treeFactoryAddress
    ) public ERC20("OxygenBeta", "O1") {
        treeFactory = _treeFactoryAddress;
        // _mint(msg.sender, 0);
    }



    function setO1GeneratedPerSecond(uint256 _o1GeneratedPerSecond) external onlyAdmin {
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
            uint256 treeFundedDate = treeFactory.getFundedDate(treeId);
            if(treeFundedDate == 0) {
                continue;
            }

            if(treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds + (now - treesLastMintedDate[treeId]);
            } else {
                totalSeconds = totalSeconds + (now - treeFundedDate);
            }
        }

        if(totalSeconds == 0) {
            return 0;
        }

        return (o1GeneratedPerSecond * totalSeconds);
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
            uint256 treeFundedDate = treeFactory.getFundedDate(treeId);
            if(treeFundedDate == 0) {
                continue;
            }

            if(treesLastMintedDate[treeId] > 0) {
                totalSeconds = totalSeconds + (now - treesLastMintedDate[treeId]);
            } else {
                totalSeconds = totalSeconds + (now - treeFactory.getFundedDate(treeId));
            }

            treesLastMintedDate[treeId] = now;
        }

        require(totalSeconds > 0, "Total Seconds are zero");


        // uint256 mintableO1 = o1GeneratedPerSecond * totalSeconds * (10 ** 18);
        uint256 mintableO1 = o1GeneratedPerSecond * totalSeconds;

        require(mintableO1 > 0, "MintableO1 is zero");

        _mint(msg.sender, mintableO1);

        emit O1Minted(msg.sender, mintableO1);
    }
}
