// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;

import "../access/IAccessRestriction.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract TreeType is Initializable {
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

    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isTreeType = true;
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function create(
        string calldata _name,
        string calldata _scientificName,
        uint256 _O2Formula,
        uint256 _price
    ) external {
        accessRestriction.ifAdmin(msg.sender);

        types.push(Type(_name, _scientificName, _O2Formula, _price));
        uint256 id = types.length - 1;

        emit NewType(id, _name, _scientificName, _O2Formula, _price);
    }

    function total() external view returns (uint256) {
        return types.length;
    }
}
