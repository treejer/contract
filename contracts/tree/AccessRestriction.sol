pragma solidity >=0.4.21 <0.7.0;

contract AccessRestriction {

    address public owner = msg.sender;

    modifier onlyOwner(address _account)
    {
        require(msg.sender == _account, "Sender not authorized, Only owner of tree authorized!");
        _;
    }


}