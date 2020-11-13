// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../access/AccessRestriction.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";


contract TreeType is Initializable, ContextUpgradeSafe {
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

    bool public isTreeType;

    Type[] public types;

    AccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isTreeType = true;
        AccessRestriction candidateContract = AccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    //@todo permission must check
    function create(
        string calldata _name,
        string calldata _scientificName,
        uint _O2Formula,
        uint _price
    ) external {
        accessRestriction.ifAdmin(msg.sender);


        types.push(Type(_name, _scientificName, _O2Formula, _price));
        uint256 id = types.length - 1;
        
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

    function getO2Formula(uint256 _typeId) public view returns(uint256) {
        return types[_typeId].O2Formula;
    }

    function count() external view returns (uint256) {
        return types.length;
    }
}
