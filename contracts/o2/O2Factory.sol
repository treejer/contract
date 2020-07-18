pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

import "../tree/UpdateFactory.sol";

contract O2Factory is UpdateFactory, ERC20, ERC20Detailed, ERC20Mintable {
    constructor() public ERC20Detailed("Oxygen", "O2", 18) {
        _mint(msg.sender, 0);
    }

    event O2Minted(address owner, uint256 totalO2);


        event ConsoleLog(uint256 updateDate);


    mapping(uint256 => uint256) treeLastmintedO2Update;

    //@todo permission must check
    function mint() external {
        // get sender trees




        require(ownerTreeCount[msg.sender] > 0, "Owner tree count is zero");



        uint256 mintableO2 = 0;
        // calculate mintable o2
        for (uint256 i = 0; i < ownerTreeCount[msg.sender]; i++) {

            uint256 treeId = ownerTrees[msg.sender][i];
            uint256 totalDays = 0;

            if (treeUpdates[treeId].length == 0) {
                continue;
            }
            
            if ( treeLastmintedO2Update[treeId] != 0 &&  treeLastmintedO2Update[treeId] == treeUpdates[treeId][treeUpdates[treeId].length - 1]) {
                continue;
            }

            uint256 treeLastmintedO2UpdateLocal = 0;
            for (uint256 j = treeUpdates[treeId].length; j > 0; j--) {

                

                if (treeLastmintedO2Update[treeId] != 0 && treeLastmintedO2Update[treeId] == treeUpdates[treeId][j - 1]) {
                    continue;
                }
                

                if (updates[treeUpdates[treeId][j - 1]].status != 1) {
                    continue;
                }

                

                // more than one update -> for n & n-1 difference
                if (j > 1) {
                    if(updates[treeUpdates[treeId][j - 2]].updateDate <= 0) {
                        continue;
                    }

                    if (updates[treeUpdates[treeId][j - 2]].status != 1) {
                        continue;
                    }

                    totalDays = totalDays + updates[treeUpdates[treeId][j - 1]].updateDate - updates[treeUpdates[treeId][ j - 2]].updateDate;
                } else {
                    totalDays = totalDays + updates[treeUpdates[treeId][j - 1]].updateDate - trees[treeId].plantedDate;
                }

                if (j > treeLastmintedO2UpdateLocal) {
                    treeLastmintedO2UpdateLocal = j - 1;
                }

                mintableO2 = mintableO2 + types[treeToType[treeId]].O2Formula * totalDays;

            }

            if (totalDays > 0) {
                treeLastmintedO2Update[treeId] = treeLastmintedO2UpdateLocal;
            }
        }


        // min them all
        require(mintableO2 > 0, "MintableO2 is zero");

        _mint(msg.sender, mintableO2);

        emit O2Minted(msg.sender, mintableO2);
    }
}
