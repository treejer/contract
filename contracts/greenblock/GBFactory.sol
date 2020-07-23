// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../access/AccessRestriction.sol";


contract GBFactory is AccessRestriction {
    event NewGBAdded(uint256 id, string title);

    //@todo must change coordinates
    struct GB {
        string title;
        string coordinates;
        uint256 status;
    }

    GB[] public greenBlocks;

    mapping(uint256 => address[]) public gbToVerifiers;
    mapping(uint256 => address[]) public gbToPlanters;
    mapping(uint256 => address) public gbToAmbassador;
    mapping(address => uint256) ambassadorGBCount;
    mapping(address => uint256) verifiersGBCount;

    //@todo permission must check
    function add(
        string calldata _title,
        string calldata _coordinates,
        address _ambassador,
        address[] calldata _planters
    ) external planterOrAmbassador {
        greenBlocks.push(GB(_title, _coordinates, 0));
        uint256 id = greenBlocks.length - 1;

        // require(id == uint256(uint256(id)));

        for (uint8 i = 0; i < _planters.length; i++) {
            gbToPlanters[id].push(_planters[i]);
        }

        gbToAmbassador[id] = _ambassador;
        ambassadorGBCount[_ambassador]++;

        //_transfer();

        emit NewGBAdded(id, _title);
    }

    function getAmbassadorGBCount() public view returns (uint256) {
        return ambassadorGBCount[msg.sender];
    }

    function getGBAmbassador(uint256 _gbId) public view returns (address) {
        return gbToAmbassador[_gbId];
    }

    function getGB(uint256 _gbId)
        public
        view
        returns (
            string memory,
            string memory,
            uint256
        )
    {
        return (
            greenBlocks[_gbId].title,
            greenBlocks[_gbId].coordinates,
            greenBlocks[_gbId].status
        );
    }

    //@todo premission must check only ambassedor or planters or admin
    // function updateGB(uint256 _gbId) public external {

    // }
}
