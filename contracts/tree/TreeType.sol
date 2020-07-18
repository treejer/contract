pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../node_modules/openzeppelin-solidity/contracts/utils/Address.sol";
import "../../node_modules/openzeppelin-solidity/contracts/token/ERC1155/ERC1155.sol";

contract TreeType {
    using SafeMath for uint256;
    using Address for address;

    event NewType(
        uint256 typeId,
        string name,
        string scientificName,
        uint256 O2Formula,
        uint256 price
    );

    struct Type {
        string name;
        string scientificName;
        uint256 O2Formula;
        uint256 price;
    }

    Type[] public types;

    //@todo permission must check
    function create(
        string calldata _name,
        string calldata _scientificName,
        uint _O2Formula,
        uint _price
    ) external {
        uint256 id = types.push(Type(_name, _scientificName, _O2Formula, _price)) - 1;
        emit NewType(id, _name, _scientificName, _O2Formula, _price);
    }

    function get(uint256 _typeId)
        external
        view
        returns (string memory, string memory, uint256, uint256)
    {
        return (
            types[_typeId].name,
            types[_typeId].scientificName,
            types[_typeId].O2Formula,
            types[_typeId].price
        );
    }

    function count() external view returns (uint256) {
        return types.length;
    }
}
