//SPDX-License-Identifier: MIT
pragma solidity ^0.6.9;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../access/IAccessRestriction.sol";
import "../genesisTree/IGenesisTree.sol";

contract RegularSell is Initializable {
    using SafeMathUpgradeable for uint256;

    uint256 lastSoldRegularTree = 10000;
    uint256 treePrice;

    bool public isRegularSell;
    IAccessRestriction public accessRestriction;
    IGenesisTree public treeFactory;
    IERC20 public daiToken;

    modifier onlyAdmin {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isRegularSell = true;
        accessRestriction = candidateContract;
    }

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        IGenesisTree candidateContract = IGenesisTree(_address);

        require(candidateContract.isGenesisTree());

        treeFactory = candidateContract;
    }

    function setDaiTokenAddress(address _address) external onlyAdmin {
        IERC20 candidateContract = IERC20(_address);

        daiToken = candidateContract;
    }

    function setPrice(uint256 _price) external onlyAdmin {
        treePrice = _price;
    }

    function RequestTrees(uint256 _count) external payable {
        require(
            daiToken.balanceOf(msg.sender) >= treePrice.mul(_count),
            "invalid mount"
        );

        uint256 tempLastRegularSold = lastSoldRegularTree;
        for (uint256 i = 0; i < _count; i++) {
            // tempLastRegularSold = treeFactory.mintRegularTrees(
            //     tempLastRegularSold,
            //     msg.sender
            // );// uncomment here after develop
            //call treasry
        }
        lastSoldRegularTree = tempLastRegularSold;
    }

    function requestByTreeId(uint256 _treeId) external payable {
        require(_treeId > lastSoldRegularTree, "invlid tree");
        require(daiToken.balanceOf(msg.sender) >= treePrice, "invalid amount");

        // treeFactory.requestRegularTree(_treeId, msg.sender);// un comment here after develop
        //treasury call here;
    }
}
