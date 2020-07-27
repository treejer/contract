// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../access/AccessRestriction.sol";


contract GBFactory is AccessRestriction {
    event NewGBAdded(uint256 id, string title);
    event GBActivated(uint256 id);
    event PlanterJoinedGB(uint256 id, address planter);

    enum GBStatus { Pending, Active }

    //@todo must change coordinates
    struct GB {
        string title;
        string coordinates;
        GBStatus status;
    }

    GB[] public greenBlocks;
    uint8 maxGBPlantersCount = 5;

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
    ) external planterOrAmbassador whenNotPaused {

        greenBlocks.push(GB(_title, _coordinates, GBStatus.Pending));
        uint256 id = greenBlocks.length - 1;

        for (uint8 i = 0; i < _planters.length; i++) {
            if(hasRole(PLANTER_ROLE, _planters[i])) {
                gbToPlanters[id].push(_planters[i]);
            }
        }

        gbToAmbassador[id] = _ambassador;
        ambassadorGBCount[_ambassador]++;

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
            GBStatus
        )
    {
        return (
            greenBlocks[_gbId].title,
            greenBlocks[_gbId].coordinates,
            greenBlocks[_gbId].status
        );
    }

    function activate(uint256 _gbId) external onlyAdmin {
        require(greenBlocks[_gbId].status != GBStatus.Active, "GB already active!");

        greenBlocks[_gbId].status = GBStatus.Active;

        emit GBActivated(_gbId);
    }

    function joinGB(uint256 _gbId, address planter) external whenNotPaused onlyPlanter {
        require(gbToPlanters[_gbId].length < maxGBPlantersCount, "Planter of this GB is reached maximum");

        gbToPlanters[_gbId].push(planter);

        emit PlanterJoinedGB(_gbId, planter);
    }

    //@todo premission must check only ambassedor or planters or admin
    // function updateGB(uint256 _gbId) public external {

    // }
}
