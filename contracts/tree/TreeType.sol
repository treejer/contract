pragma solidity >=0.4.21 <0.7.0;

import "openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

contract TreeType {

    using SafeMath for uint256;
    using Address for address;

    event NewType(uint typeId, string name, string scientificName, string O2Formula);

    struct Type {
        string name;
        string scientificName;
        string O2Formula;
    }

    Type[] public types;

    //@todo permission must check
    function create(string calldata _name, string calldata _scientificName, string calldata _O2Formula) external
    {
        uint id = types.push(Type(_name, _scientificName, _O2Formula)) - 1;
        emit NewType(id, _name, _scientificName, _O2Formula);
    }

    function get(uint _typeId) external view returns (string memory, string memory, string memory){
        return (types[_typeId].name, types[_typeId].scientificName, types[_typeId].O2Formula);
    }

    function count() external view returns (uint) {
        return types.length;
    }
}