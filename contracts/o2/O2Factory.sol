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

    //@todo permission must check
    function mint() external {

        require(ownerTreeCount[msg.sender] > 0, "Owner tree count is zero");

        uint256 mintableO2 = 0;
        // calculate mintable o2
        for (uint256 i = 0; i < ownerTreeCount[msg.sender]; i++) {

            uint256 treeId = ownerTrees[msg.sender][i];
            uint256 totalSeconds = 0;

            if (treeUpdates[treeId].length == 0) {
                continue;
            }

            if(updates[treeUpdates[treeId][treeUpdates[treeId].length - 1]].minted == true) {
                continue;
            }

            
            for (uint256 j = treeUpdates[treeId].length; j > 0; j--) {

                if (updates[treeUpdates[treeId][j - 1]].status != 1) {
                    continue;
                }

                if(updates[treeUpdates[treeId][j - 1]].minted == true) {
                    continue;
                }
                
                if (j > 1) {
                    
                    if (updates[treeUpdates[treeId][j - 2]].status != 1) {
                        continue;
                    }

                    totalSeconds = totalSeconds + updates[treeUpdates[treeId][j - 1]].updateDate - updates[treeUpdates[treeId][j - 2]].updateDate;
                } else {
                    totalSeconds = totalSeconds + updates[treeUpdates[treeId][j - 1]].updateDate - trees[treeId].plantedDate;
                }

                updates[treeUpdates[treeId][j - 1]].minted = true;

            }

            mintableO2 = mintableO2 + types[treeToType[treeId]].O2Formula * totalSeconds;
        }

                //            emit ConsoleLog(mintableO2);
                // return;

        // min them all
        require(mintableO2 > 0, "MintableO2 is zero");

        _mint(msg.sender, mintableO2);

        emit O2Minted(msg.sender, mintableO2);
    }
}
