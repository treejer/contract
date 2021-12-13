pragma solidity ^0.8.6;
import "./../../../planter/Planter.sol";

contract PlanterEchidnaTest {
    address internal trustedForwarder;
    struct PlanterData {
        uint8 planterType;
        uint8 status;
        uint16 countryCode;
        uint32 score;
        uint32 supplyCap;
        uint32 plantedCount;
        uint64 longitude;
        uint64 latitude;
    }

    /** NOTE {isPlanter} set inside the initialize to {true} */
    bool internal isPlanter;

    IAccessRestriction internal accessRestriction =
        IAccessRestriction(0x871DD7C2B4b25E1Aa18728e9D5f2Af4C4e431f5c);

    /** NOTE mapping of planter address to PlanterData */
    mapping(address => PlanterData) internal planters;

    /** NOTE mapping of planter address to address of invitedBy */
    mapping(address => address) internal invitedBy;

    /** NOTE mapping of planter address to organization address that planter is member of it */
    mapping(address => address) internal memberOf;

    /** NOTE mapping of organization address to mapping of planter address to portionValue */
    mapping(address => mapping(address => uint256))
        internal organizationMemberShare;

    bytes32 internal constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 internal constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");
    bytes32 internal constant DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;
    Planter internal planterContract = new Planter();

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    function check_join_planter(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _invitedBy,
        address _organization
    ) public {
        accessRestriction.grantRole(PLANTER_ROLE, msg.sender);

        if (_invitedBy != address(0)) {
            accessRestriction.grantRole(PLANTER_ROLE, _invitedBy);
        }

        uint256 tempPlanterType = _planterType % 2 == 0 ? 1 : 3;

        if (_organization != address(0) && tempPlanterType == 3) {
            accessRestriction.grantRole(PLANTER_ROLE, _organization);
            accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

            (bool success1, bytes memory data1) = address(planterContract)
                .delegatecall(
                    abi.encodeWithSignature(
                        "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                        _organization,
                        0,
                        0,
                        0,
                        100,
                        address(0)
                    )
                );
            accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

            require(success1, "organization join problem");
        }

        (bool success2, bytes memory data2) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "join(uint8,uint64,uint64,uint16,address,address)",
                    tempPlanterType,
                    _longitude,
                    _latitude,
                    _countryCode,
                    _invitedBy,
                    _organization
                )
            );
        //TODO: GET_REVERT_MESSAGE
        // if (!success2) {
        //     // Next 5 lines from https://ethereum.stackexchange.com/a/83577
        //     if (data2.length < 68) revert();
        //     assembly {
        //         data2 := add(data2, 0x04)
        //     }

        // access to returned message abi.decode(data2, (string));
        // }

        require(success2, "planter join problem");

        PlanterData storage _planterData = planters[msg.sender];

        assert(_planterData.supplyCap == 100);
        assert(_planterData.countryCode == _countryCode);
        assert(_planterData.latitude == _latitude);
        assert(_planterData.longitude == _longitude);
        assert(_planterData.plantedCount == 0);
        assert(_planterData.score == 0);
        assert(invitedBy[msg.sender] == _invitedBy);

        if (tempPlanterType == 1) {
            assert(_planterData.status == 1);
            assert(_planterData.planterType == 1);
        } else if (tempPlanterType == 3) {
            PlanterData storage orgData = planters[_organization];

            assert(orgData.planterType == 2);

            assert(_planterData.status == 0);
            assert(_planterData.planterType == 3);

            assert(memberOf[msg.sender] == _organization);
        }
    }

    function check_join_orgnization(
        address _organization,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _supplyCap,
        address _invitedBy
    ) public {
        if (_invitedBy != address(0)) {
            accessRestriction.grantRole(PLANTER_ROLE, _invitedBy);
        }

        if (_organization != address(0)) {
            accessRestriction.grantRole(PLANTER_ROLE, _organization);
        }
        
        accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

        (bool success1, bytes memory data1) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                    _organization,
                    _longitude,
                    _latitude,
                    _countryCode,
                    _supplyCap,
                    _invitedBy
                )
            );
        accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

        require(success1, "organization join problem");

        PlanterData storage _planterData = planters[_organization];

        assert(_planterData.planterType == 2);
        assert(_planterData.status == 1);
        assert(_planterData.countryCode == _countryCode);
        assert(_planterData.supplyCap == _supplyCap);
        assert(_planterData.longitude == _longitude);
        assert(_planterData.latitude == _latitude);
        assert(_planterData.plantedCount == 0);
        assert(_planterData.score == 0);
        assert(invitedBy[_organization] == _invitedBy);
    }

    ////////////////////////////////////////////////////////////////////////////////////

    function check_update_planter_type(
        uint256 _planterType,
        address _organization1,
        address _organization2
    ) public {
        accessRestriction.grantRole(PLANTER_ROLE, msg.sender);

        uint256 tempPlanterType = _planterType % 2 == 0 ? 1 : 3;

        if (_organization1 != address(0) && tempPlanterType == 3) {
            accessRestriction.grantRole(PLANTER_ROLE, _organization1);

            accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

            (bool success1, bytes memory data1) = address(planterContract)
                .delegatecall(
                    abi.encodeWithSignature(
                        "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                        _organization1,
                        0,
                        0,
                        0,
                        100,
                        address(0)
                    )
                );
            accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

            require(success1, "organization join problem");
        }

        (bool success2, bytes memory data2) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "join(uint8,uint64,uint64,uint16,address,address)",
                    tempPlanterType,
                    0,
                    0,
                    0,
                    0,
                    _organization1
                )
            );

        require(success2, "planter join problem");

        uint256 newPlanterType = _planterType % 10 > 4 ? 3 : 1;

        if (_organization2 != address(0) && newPlanterType == 3) {
            accessRestriction.grantRole(PLANTER_ROLE, _organization2);

            accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

            (bool success4, bytes memory data4) = address(planterContract)
                .delegatecall(
                    abi.encodeWithSignature(
                        "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                        _organization2,
                        0,
                        0,
                        0,
                        100,
                        address(0)
                    )
                );
            accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

            require(success4, "organization join problem");
        }

        (bool success3, bytes memory data3) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "updatePlanterType(uint8,address)",
                    newPlanterType,
                    _organization2
                )
            );

        require(success3, "update planter type is not ok");

        PlanterData storage _planterData = planters[msg.sender];

        if (newPlanterType == 1) {
            assert(_planterData.status == 1);
            assert(memberOf[msg.sender] == address(0));
        } else {
            assert(_planterData.status == 0);
            assert(memberOf[msg.sender] == _organization2);
        }
    }

    function check_accept_planter_by_organization(
        address _planter,
        bool _acceptance,
        address _otherOrg,
        uint256 _value
    ) public {
        accessRestriction.grantRole(PLANTER_ROLE, msg.sender);

        accessRestriction.grantRole(PLANTER_ROLE, _planter);

        accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

        (bool success1, bytes memory data1) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                    msg.sender,
                    0,
                    0,
                    0,
                    100,
                    address(0)
                )
            );

        accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

        require(success1, "organization join problem");

        PlanterData storage _tempPlanter = planters[_planter];

        if (_planter != address(0)) {
            _tempPlanter.planterType = 3;
            _tempPlanter.status == 0;

            memberOf[_planter] = _value % 100 == 0 ||
                _otherOrg == msg.sender ||
                _otherOrg == address(0)
                ? msg.sender
                : _otherOrg;
        }

        (bool success2, bytes memory data2) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "acceptPlanterByOrganization(address,bool)",
                    _planter,
                    _acceptance
                )
            );

        require(success2, "planter accept problem");

        assert(_tempPlanter.status == 1);

        if (_acceptance == false) {
            assert(_tempPlanter.planterType == 1);
            assert(memberOf[_planter] == address(0));
        }
    }

    function check_update_supply_cap(uint32 _supplyCap) public {
        accessRestriction.grantRole(PLANTER_ROLE, msg.sender);

        // accessRestriction.grantRole(PLANTER_ROLE, _planter);
        accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

        (bool success1, bytes memory data1) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "join(uint8,uint64,uint64,uint16,address,address)",
                    1,
                    0,
                    0,
                    0,
                    address(0),
                    address(0)
                )
            );

        require(success1, "planter join problem");

        PlanterData storage _planterData = planters[msg.sender];
        uint8 tempStatus = uint8((_supplyCap % 3) + 1);

        _planterData.status = tempStatus;

        assert(_planterData.supplyCap == 100);
        (bool success2, bytes memory data2) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "updateSupplyCap(address,uint32)",
                    msg.sender,
                    _supplyCap
                )
            );

        require(success2, "can't update supply cap");

        assert(_planterData.supplyCap == _supplyCap);
        if (tempStatus == 2) {
            assert(_planterData.status == 1);
        } else {
            assert(_planterData.status == tempStatus);
        }
    }

    function check_update_organization_member_share(
        address _planter,
        uint256 _share
    ) public {
        accessRestriction.grantRole(PLANTER_ROLE, msg.sender);

        accessRestriction.grantRole(PLANTER_ROLE, _planter);

        accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

        (bool success1, bytes memory data1) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "joinOrganization(address,uint64,uint64,uint16,uint32,address)",
                    msg.sender,
                    0,
                    0,
                    0,
                    100,
                    address(0)
                )
            );

        accessRestriction.revokeRole(DATA_MANAGER_ROLE, msg.sender);

        require(success1, "organization join problem");

        PlanterData storage _tempPlanter = planters[_planter];

        if (_planter != address(0)) {
            _tempPlanter.status = 1;
            memberOf[_planter] = msg.sender;
            _tempPlanter.planterType = 3;
        }

        uint256 shareValue = _share % 11003;

        (bool success2, bytes memory data2) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "updateOrganizationMemberShare(address,uint256)",
                    _planter,
                    shareValue
                )
            );

        require(success2);

        assert(organizationMemberShare[msg.sender][_planter] == shareValue);
    }

    function check_reduce_planted_count(address _planter, uint32 _value)
        public
    {
        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, msg.sender);
        PlanterData storage planterData = planters[_planter];

        uint32 plantedCount = _value % 100;
        uint8 status = uint8(_value % 3) + 1;

        if (_planter != address(0)) {
            planterData.planterType = 2;
            planterData.plantedCount = plantedCount;
            planterData.status = status;
        }

        (bool success, bytes memory data) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature("reducePlantedCount(address)", _planter)
            );

        require(success);

        assert(planterData.plantedCount == plantedCount - 1);

        if (status == 2) {
            assert(planterData.status == 1);
        } else {
            assert(planterData.status == status);
        }
    }

    function check_manage_tree_premision(address _planter, uint256 _value)
        public
    {
        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, msg.sender);
        uint8 status = uint8(_value % 2) + 1;
        uint32 plantedCount = uint32(_value % 3) + 1;
        PlanterData storage planterData = planters[_planter];

        if (_planter != address(0)) {
            planterData.planterType = 1;
            planterData.supplyCap = 4;
            planterData.status = status;
            planterData.plantedCount = plantedCount;
        }

        (bool success, bytes memory data) = address(planterContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "manageTreePermission(address)",
                    _planter
                )
            );

        require(success);

        if (status == 1) {
            assert(planterData.plantedCount == plantedCount + 1);
            if (plantedCount == 3) {
                assert(planterData.status == 2);
            } else {
                assert(planterData.status == 1);
            }
        } else {
            assert(planterData.plantedCount == plantedCount);
            assert(planterData.status == status);
        }
    }

    function check_manage_assigned_tree_permission(
        address _planter,
        address _assignedPlanterAddress,
        address _organization1,
        uint256 _planterTypeValue,
        uint256 _value
    ) public {
        bool toSetValue = _planter != address(0) &&
            _assignedPlanterAddress != address(0) &&
            _organization1 != address(0);
        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, msg.sender);

        uint8 status = _value % 100 == 50 ? 2 : 1;
        uint32 plantedCount = uint32(_value % 100) + 1;
        uint8 planterType = uint8(_planterTypeValue % 3) + 1;
        PlanterData storage planterData = planters[_planter];

        if (toSetValue) {
            planterData.status = status;
            planterData.supplyCap = 100;
            planterData.plantedCount = plantedCount;
            planterData.planterType = planterType;
        }
        bool check = true;

        if (planterType < 3) {
            address finalAssignee = _value % 10 < 9 ||
                _planter == _assignedPlanterAddress
                ? _planter
                : _assignedPlanterAddress;

            check = _planter == finalAssignee;

            (bool success, bytes memory data) = address(planterContract)
                .delegatecall(
                    abi.encodeWithSignature(
                        "manageAssignedTreePermission(address,address)",
                        _planter,
                        finalAssignee
                    )
                );
        } else {
            if (_value % 10000 < 5000 || _planter == _assignedPlanterAddress) {
                (bool success, bytes memory data) = address(planterContract)
                    .delegatecall(
                        abi.encodeWithSignature(
                            "manageAssignedTreePermission(address,address)",
                            _planter,
                            _planter
                        )
                    );
            } else {
                bool isMemberOfOrg = _value % 10000 < 9000 ||
                    _assignedPlanterAddress == _organization1;

                check = isMemberOfOrg;

                memberOf[_planter] = isMemberOfOrg
                    ? _assignedPlanterAddress
                    : _organization1;
                (bool success, bytes memory data) = address(planterContract)
                    .delegatecall(
                        abi.encodeWithSignature(
                            "manageAssignedTreePermission(address,address)",
                            _planter,
                            _assignedPlanterAddress
                        )
                    );
            }
        }
        if (toSetValue) {
            if (plantedCount < 100 && check && status == 1) {
                assert(planterData.plantedCount == plantedCount + 1);
                if (plantedCount == 99) {
                    assert(planterData.status == 2);
                } else {
                    assert(planterData.status == 1);
                }
            } else {
                assert(planterData.plantedCount == plantedCount);
                assert(planterData.status == status);
            }
        }
    }
}
