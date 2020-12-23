// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../access/IAccessRestriction.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

contract GBFactory is Initializable, ContextUpgradeSafe {
    event NewGBAdded(uint256 id, string title);
    event GBActivated(uint256 id);
    event PlanterJoinedGB(uint256 id, address planter);

    bool public isGBFactory;

    //@todo must change coordinates
    struct GB {
        string title;
        string coordinates;
        bool status;
    }

    GB[] public greenBlocks;
    uint8 constant maxGBPlantersCount = 5;

    mapping(uint256 => address[]) public gbToPlanters;
    mapping(address => uint256) public planterGB;

    mapping(uint256 => address) public gbToAmbassador;
    mapping(address => uint256) public ambassadorGBCount;
    mapping(address => uint256[]) public ambassadorGBs;

    IAccessRestriction public accessRestriction;

    function initialize(address _accessRestrictionAddress) public initializer {
        isGBFactory = true;
        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        //create a green block, so we can check for zero green block means not assigned
        greenBlocks.push(GB("WORLD", "ALL", true));
    }

    function create(
        string calldata _title,
        string calldata _coordinates,
        address _ambassador,
        address[] calldata _planters
    ) external {
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanterOrAmbassador(msg.sender);

        greenBlocks.push(GB(_title, _coordinates, false));
        uint256 id = greenBlocks.length - 1;

        for (uint8 i = 0; i < _planters.length; i++) {
            if (accessRestriction.isPlanter(_planters[i])) {
                gbToPlanters[id].push(_planters[i]);
                planterGB[_planters[i]] = id;
            }
        }

        gbToAmbassador[id] = _ambassador;
        ambassadorGBCount[_ambassador]++;
        ambassadorGBs[_ambassador].push(id);

        emit NewGBAdded(id, _title);
    }

    function getGBPlantersCount(uint256 _gbId) external view returns (uint256) {
        return gbToPlanters[_gbId].length;
    }

    function getAmbassadorGBs(address _ambassador)
        external
        view
        returns (uint256[] memory)
    {
        return ambassadorGBs[_ambassador];
    }

    function activate(uint256 _gbId) external {
        accessRestriction.ifAdmin(msg.sender);

        require(
            greenBlocks[_gbId].status != true,
            "GB already active!"
        );

        greenBlocks[_gbId].status = true;

        emit GBActivated(_gbId);
    }

    function joinGB(uint256 _gbId) external {
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanter(msg.sender);

        require(
            gbToPlanters[_gbId].length < maxGBPlantersCount,
            "Planter of this GB is reached maximum"
        );
        require(_gbId > 0, "You can't join for zero gb");

        require(planterGB[msg.sender] == 0, "Joined before!");

        gbToPlanters[_gbId].push(msg.sender);
        planterGB[msg.sender] = _gbId;

        emit PlanterJoinedGB(_gbId, msg.sender);
    }

    function totalGB() external view returns (uint256) {
        return greenBlocks.length;
    }

    //@todo premission must check only ambassedor or planters or admin
    // function updateGB(uint256 _gbId) public external {

    // }
}
