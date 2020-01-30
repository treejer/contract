pragma solidity >=0.4.21 <0.7.0;
//pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/contracts/utils/Address.sol";

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

    function get(uint _treeId) external view returns(string memory, string memory, string memory){
        return (types[_treeId].name, types[_treeId].scientificName, types[_treeId].O2Formula);
    }

    function count() external view returns(uint) {
        return types.length;
    }
}