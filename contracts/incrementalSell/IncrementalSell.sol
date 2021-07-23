// // SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";
import "../treasury/ITreasury.sol";
import "../tree/ITreeAttribute.sol";

contract IncrementalSell is Initializable {
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint64;
    using SafeCastUpgradeable for uint256;

    address payable treasuryAddress;
    IAccessRestriction public accessRestriction;
    IGenesisTree public genesisTree;
    ITreasury public treasury;
    bool public isIncrementalSell;
    ITreeAttribute public treeAttribute;
    
    struct IncrementalPrice{
        uint256 startTree;
        uint256 endTree;
        uint256 initialPrice;
        uint64  increaseStep;
        uint64  increaseRatio;
    }

    IncrementalPrice public  incrementalPrice;
    
    mapping(address => uint256) public lastBuy;

    event TreeSold(
        uint256 treeId,
        address buyer,
        uint256 amount
    );

    
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isIncrementalSell = true;
        accessRestriction = candidateContract;
    }


    function setGenesisTreeAddress(address _address) external onlyAdmin {
        IGenesisTree candidateContract = IGenesisTree(_address);
        require(candidateContract.isGenesisTree());
        genesisTree = candidateContract;
    }

    function setTreasuryAddress(address _address) external onlyAdmin {
        ITreasury candidateContract = ITreasury(_address);
        require(candidateContract.isTreasury());
        treasury = candidateContract;
    }

    function setTreeAttributeAddress(address _address) external onlyAdmin {
        ITreeAttribute candidateContract = ITreeAttribute(_address);
        require(candidateContract.isTreeAttribute());
        treeAttribute = candidateContract;
    }


    function addTreeSells(uint256 startTree,uint256 initialPrice,uint64 treeCount,uint64 steps,uint64 incrementRate) external onlyAdmin{
        require(treeCount>0,"assign at least one tree");
        require(startTree>100,"trees are under Auction");
        require(steps>0,"incremental period should be positive");
        require(
            treasury.distributionModelExistance(startTree),
            "equivalant fund Model not exists"
        );
        if (incrementalPrice.increaseStep>0){
            genesisTree.bulkRevert(incrementalPrice.startTree,incrementalPrice.endTree);
        }
                
        bool success=genesisTree.bulkAvailability(startTree,startTree.add(treeCount));
        require(success,"trees are not available for sell");
        
        incrementalPrice=IncrementalPrice( startTree, startTree+treeCount, initialPrice , steps ,incrementRate );

    }
    function buyTree(uint256 treeId) external payable ifNotPaused{
        //check if treeId is in this incrementalSell
        require(treeId<incrementalPrice.endTree && treeId>=incrementalPrice.startTree,"tree is not in incremental sell");
        
        address payable buyer=msg.sender;
        uint256 amount=msg.value;
        bytes4 sigTr=msg.sig;
        //calc tree price based on treeId
        uint256 steps= (treeId-incrementalPrice.startTree)/incrementalPrice.increaseStep;
        uint256 treePrice=incrementalPrice.initialPrice+(steps.mul(incrementalPrice.initialPrice).mul(incrementalPrice.increaseRatio))/10000;
        
        //checking price paid is enough for buying the treeId checking discounts
        if(lastBuy[buyer]>block.timestamp-700* 1 seconds){
            require(amount>=treePrice.mul(90).div(100),"low price paid");
            lastBuy[buyer]=0;
        }
        else{
            require(amount>=treePrice,"low price paid");
            lastBuy[buyer]=block.timestamp;
        }
       
        genesisTree.updateOwner(treeId, buyer);
        treasury.fundTree{value: amount}(treeId);
        emit TreeSold(treeId,buyer,amount);
        uint16 count=1;
        bool flag=true;
        while(count<2000){
            flag=treeAttribute.createTreeAttributes(buyer,treeId,amount,keccak256(abi.encodePacked(sigTr,count)));
            if (flag){
                count=3000;
            }
            else{
                count+=1;
            }
        }
        
    }
}