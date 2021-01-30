// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../tree/ITreeFactory.sol";

contract PublicForest is Initializable, ERC721HolderUpgradeable {
    using SafeMathUpgradeable for uint256;

    event ContributionReceived(address from, uint256 value);
    event TreesAddedToForest(uint256 count);

    uint256 constant MAX_UINT = 2**256 - 1;

    // exteranl contracts
    ITreeFactory public treeFactory;
    IERC20 public daiToken;

    function initialize(address _treeFactoryAddress, address _daiTokenAddress)
        public
        initializer
    {
        ITreeFactory candidateContract = ITreeFactory(_treeFactoryAddress);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;

        daiToken = IERC20(_daiTokenAddress);
        daiToken.approve(address(treeFactory), MAX_UINT);
    }

    receive() external payable {
        emit ContributionReceived(msg.sender, msg.value);
    }

    function donate(uint256 _amount) external payable {
        require(_amount > 0, "Contribution must bigger than zero");

        //do something
        require(
            daiToken.balanceOf(msg.sender) >= _amount,
            "Balance is not sufficient"
        );

        bool success =
            daiToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "Transfer From sender failed");

        emit ContributionReceived(msg.sender, _amount);

        fundTree();
    }

    function fundTree() public {
        // get balance of contract
        uint256 balance = daiToken.balanceOf(address(this));

        uint256 treePrice = treeFactory.price();

        // if it reach the treePrice fund a tree
        if (balance >= treePrice) {
            uint256 count = balance.div(treePrice);

            if (count > 0) {
                treeFactory.fund(count);
                // treeFactory.fund{value: count.mul(treePrice)}(count);
                // treeFactory.fund{value: 42, gas: 23}(count);
                emit TreesAddedToForest(count);
            }
        }
    }
}
