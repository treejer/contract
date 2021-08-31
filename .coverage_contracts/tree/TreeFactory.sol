//SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x5d7db028(bytes32 c__0x5d7db028) pure {}


import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";
import "../tree/ITree.sol";
import "../treasury/IPlanterFund.sol";
import "../planter/IPlanter.sol";

/** @title TreeFactory Contract */
contract TreeFactory is Initializable, RelayRecipient {
function c_0xa8261ccb(bytes32 c__0xa8261ccb) public pure {}

    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeCastUpgradeable for uint256;
    using SafeCastUpgradeable for uint32;

    CountersUpgradeable.Counter private regularTreeId;

    /** NOTE {isTreeFactory} set inside the initialize to {true} */
    bool public isTreeFactory;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;
    IPlanterFund public planterFund;
    IPlanter public planter;

    uint256 public lastRegularPlantedTree;
    uint256 public updateInterval;

    struct TreeStruct {
        address planterId;
        uint256 treeType;
        uint16 mintStatus;
        uint16 countryCode;
        uint32 provideStatus;
        uint64 treeStatus;
        uint64 plantDate;
        uint64 birthDate;
        string treeSpecs;
    }

    struct UpdateTree {
        string updateSpecs;
        uint64 updateStatus;
    }

    struct RegularTree {
        uint64 birthDate;
        uint64 plantDate;
        uint64 countryCode;
        uint64 otherData;
        address planterAddress;
        string treeSpecs;
    }
    /** NOTE mapping of treeId to Tree Struct */
    mapping(uint256 => TreeStruct) public treeData;
    /** NOTE mapping of treeId to UpdateTree struct */
    mapping(uint256 => UpdateTree) public updateTrees;
    /** NOTE mapping of treeId to RegularTree struct */
    mapping(uint256 => RegularTree) public regularTrees;

    event TreeAdded(uint256 treeId);
    event TreeAssigned(uint256 treeId);
    event TreePlanted(uint256 treeId);
    event PlantVerified(uint256 treeId);
    event PlantRejected(uint256 treeId);
    event TreeUpdated(uint256 treeId);
    event UpdateVerified(uint256 treeId);
    event UpdateRejected(uint256 treeId);
    event RegularTreePlanted(uint256 treeId);
    event RegularPlantVerified(uint256 treeId);
    event RegularPlantRejected(uint256 treeId);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0xa8261ccb(0xd6c0c1363f1795f37bec98688187e6531a789ba4cc940828aa920e9d0fa5f80e); /* function */ 

c_0xa8261ccb(0xc8f1679a7912dbca4e1b75a798437447342ebb8c4975f79a9b1b318fce9d59e2); /* line */ 
        c_0xa8261ccb(0x5e8b3f48bf8fb7a409ca2a585746f0f0bdce96491c9949d35be629e60ab1a279); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0xa8261ccb(0xed7ec0384b29efdd133f475b63cfd82418bda8e0f4ba42b2613ffe3f31ad3a4e); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0xa8261ccb(0x41e8853bf03625cf03125579a560fab2486a2598d787020107d6325dd434ccd1); /* function */ 

c_0xa8261ccb(0xc6052ab6f3b47e0eb0a563359e14f8f3ba3f37e410d6bc03f180e9cdbe5f25db); /* line */ 
        c_0xa8261ccb(0xc51d4f3c07cee668a999f01e2150bec63c9f0364ab18de7425d20411207a9c91); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0xa8261ccb(0x37a2bf9c5f1e8b43458be8512de0fdbe83098b7d28e413c933adfa9acd6d5184); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0xa8261ccb(0x2eb1ac072a384cb35e38c02dc88aa0a7f16e72633e72c7cf782489db597de973); /* function */ 

c_0xa8261ccb(0xdef07b00e0a4d6d7cbd594f612ffc366ad45c0f5dca589c5c3e85cb0cbe15578); /* line */ 
        c_0xa8261ccb(0xec4f32be4e6653c4171e24897adafc6a368cb8f324a9f8eed164bb2423fb4e3e); /* statement */ 
accessRestriction.ifNotPaused();
c_0xa8261ccb(0x0bc74c655b5a1a419962f1d876cd21e2c814490949ae84da6dc603a9c7dea2eb); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {c_0xa8261ccb(0xc41b20c65646b228896187c8f42bf2beb70d644f955ade59d0d47af0585219a7); /* function */ 

c_0xa8261ccb(0x477b0ee47e89e12a2bf9c67a3f83793659dfb623ce5bf777315e2b4e4e5fb348); /* line */ 
        c_0xa8261ccb(0xc96cadfda2a9df2785408744864ab3d7ce3e4f89cf8361dcb0e7bec473c14b29); /* statement */ 
accessRestriction.ifTreejerContract(_msgSender());
c_0xa8261ccb(0x4139aa0f4593b03b6cb5097d7cfbe951c547784a0bfd9b19aff8830c40105331); /* line */ 
        _;
    }

    /** NOTE modifier for check treeId to be valid tree */
    modifier validTree(uint256 _treeId) {c_0xa8261ccb(0x02cb0c0f284a6cde9ef1d3edf023fb8a15698eca7b0139c81246106ae35470a7); /* function */ 

c_0xa8261ccb(0xebbe4c4c61b9cd64b9bd408d3b19ae65db2824644f4ae65571e87c13bf26d462); /* line */ 
        c_0xa8261ccb(0x71b13c1a2cd52b64ef47f4f23e21ea4885ce2747e94cc5ada0fd920cb2b99c55); /* requirePre */ 
c_0xa8261ccb(0xc2ed16d79add0a89fee8bcd7686204b3d4375b973b3e0bc7f39ac29e246712d7); /* statement */ 
require(treeData[_treeId].treeStatus > 0, "invalid tree");c_0xa8261ccb(0xc50981ab429c5c6377fe1bbd43a98a343c8ab39081efd5e503be761e2e7b9d48); /* requirePost */ 

c_0xa8261ccb(0x99921b8e10ad0e85a0de3eeaeba190d065e56b6365d5d5edeabed43dc3e3d620); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0xa8261ccb(0x197dcfb38b4a7f00d60887dc315f843042e52346cc63bb556a0cdcdfb1be8eaf); /* function */ 

c_0xa8261ccb(0x4074f8e6e79cfe84cff2979f8e8eab21c07134cb092a93b99c6a264d46f822ca); /* line */ 
        c_0xa8261ccb(0xe6d373d81bbb5d654160c1c68e16073e0a03810ba5a8a37d4830bffedbc07a25); /* requirePre */ 
c_0xa8261ccb(0x23fe3a818d45f5a29b5abbf8b2b8a33c0fed6c1682ab80664cea2b12d854b978); /* statement */ 
require(_address != address(0), "invalid address");c_0xa8261ccb(0xa418e39d1646c6bbaa30dabe5873016d9d241ceae6d8a31a79f15e1d2ddcc871); /* requirePost */ 

c_0xa8261ccb(0x905ebbc79a9f5c5bbb003af311e099399cfd3cf3175b5cbb1dbd8037f49d4dc2); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeFactory
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * NOTE set lastRegularPlantedTree to 10000
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0xa8261ccb(0x8fa445079e554666305182d0b498884c54cd1af1ce8e1dece5e10d437794378d); /* function */ 

c_0xa8261ccb(0xb816c8b509fd6bca504d659ac2ce85b78cbfebb640a63671dbc260148d5c926e); /* line */ 
        c_0xa8261ccb(0xc714fb0ccddade7281e73803bf60ab3fbd5af2db9c59263f929d7a7a8c1d454d); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0xa8261ccb(0xdb9cfb645f7c795182493e19246480b0a7880ee810de461e380d63ae50262b3b); /* line */ 
        c_0xa8261ccb(0x1525d4351aaee66d27949405e70e3a6f52e3cde2bc8427175b6b0d285e4d7577); /* requirePre */ 
c_0xa8261ccb(0x71294aa65e4a2731ffc22baba98af852988dc1950ab6be7b59bf8a13b3de1381); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xa8261ccb(0xcac9ef2824532c81cd28c21ab03cbdaddfaf76f22a6c26650d9542cc6e808977); /* requirePost */ 


c_0xa8261ccb(0x17a6cea7947f48a33569951697bfec76fef13300f822b2c90b316b15befa04e8); /* line */ 
        c_0xa8261ccb(0x791bf48121c9991d329be6b3c3fb9c99c7a0d41eea315693ae17a8327abfcbba); /* statement */ 
isTreeFactory = true;
c_0xa8261ccb(0x621896939ff21ff8438a7ffc89ba67b397bba3f4940e9066511c977cf6530528); /* line */ 
        c_0xa8261ccb(0x82ec97e040781d50e812bd0251130e508370f2809796b9d65a9f52391accb50c); /* statement */ 
accessRestriction = candidateContract;
c_0xa8261ccb(0x5dc0d7f6bf25839c0ead47c1305f790431c87dcf211f9d617b55cfad78c4be86); /* line */ 
        c_0xa8261ccb(0x4a7fc657cc9714299e40c63473ad0dfa7e5d0a69008371934728c09220905387); /* statement */ 
lastRegularPlantedTree = 10000;
c_0xa8261ccb(0xb06cd39d139c504b9404a016b5bcccce2b8f42b40a5befb4e7efb896b27dd768); /* line */ 
        c_0xa8261ccb(0x5da60a29476bd9a96dd21ce8e30e3b4da343062509cc90bbb22ff7198858950d); /* statement */ 
updateInterval = 604800;
    }

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xa8261ccb(0x9593ba150c8f8b74e6b093a65b4b4f0f337615915bf62d9577f710069d3ff59d); /* function */ 

c_0xa8261ccb(0xea4fdbf3185c4841c4afc333c2e74d2c3ad96933e297e93483d521039c82d7c1); /* line */ 
        c_0xa8261ccb(0xd5864e0ed39d0a0b6726663c359c7cd7e120d2b7d1c42634f839542161c1bfb3); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev admin set PlanterFund contract address
     * @param _address set to the address of PlanterFund contract
     */
    function setPlanterFundAddress(address _address) external onlyAdmin {c_0xa8261ccb(0x031f09e243850cb0d0f95a78887cd4a9f173195144ef6c00391e417236464c0f); /* function */ 

c_0xa8261ccb(0x96b3105fdfedfb59211021a6a332caff15217002c8c5672c6a066c84c3bf0d3c); /* line */ 
        c_0xa8261ccb(0x897ed9d579777377ebb8b5ef66e860435cde8481ca698bddb88a9d7d1a9f9709); /* statement */ 
IPlanterFund candidateContract = IPlanterFund(_address);

c_0xa8261ccb(0xa0c49fa98e472c32d33a0311920f0c6b9c4533f2ab8acd15f55e165e007aeb49); /* line */ 
        c_0xa8261ccb(0x8accc84dd68208aa64a6c625c8b91507969bc8b353f69c6e44f1dff61f658c54); /* requirePre */ 
c_0xa8261ccb(0x473518e18f7ec497406fc7ac938643e29159885273f83e5db1d759140c68f182); /* statement */ 
require(candidateContract.isPlanterFund());c_0xa8261ccb(0xd35b154ca5a164e793beb5e52206caf5edb3b49b00e58e7e50b63589483a89dc); /* requirePost */ 


c_0xa8261ccb(0x851385d21b005ae5f0bc27c78192036227c425771b84e8fb53724b210b64b617); /* line */ 
        c_0xa8261ccb(0xd63cd14b49dc3990f6f7582188fb518ccd09dd3f3947cc9046b4e07c085177b9); /* statement */ 
planterFund = candidateContract;
    }

    /**
     * @dev admin set Planter contract address
     * @param _address set to the address of Planter contract
     */
    function setPlanterAddress(address _address) external onlyAdmin {c_0xa8261ccb(0x5fbb31e6303764c46f3c3e3534b45864dd79be486ed5bd6daa75a76896be3056); /* function */ 

c_0xa8261ccb(0x923331aa1e0f5b54e1c8ff7f4f579c62d5e2b05669c629bf95bb426a5d322787); /* line */ 
        c_0xa8261ccb(0x3b70972d12fdeaff1d5768bc9ec31368a6fcdb01a992a39b9ec0dc6f9ebc4a1a); /* statement */ 
IPlanter candidateContract = IPlanter(_address);

c_0xa8261ccb(0x685a69e6a9aaa7898197deca458cfdda2b0c0255ff299052d09aa5152d7dbd0e); /* line */ 
        c_0xa8261ccb(0x4878399f75e69a67449847280f48a084f595f18447612c0f420d9fa2558ec170); /* requirePre */ 
c_0xa8261ccb(0xd81c768b40f03e7f21573d89581efb302cc05741632d3a63d8469a1208463d6d); /* statement */ 
require(candidateContract.isPlanter());c_0xa8261ccb(0xa44abe49c2bfd65967824a4ecf55386db5054d2b747466936cd0d2f5f67ac866); /* requirePost */ 


c_0xa8261ccb(0x207df380091ff5de15380c00a7bb4f33ecf92108f6ee4e20c4d6aefc9657565a); /* line */ 
        c_0xa8261ccb(0x3325a6392607b9f493ac39c07510630c6615f1cf65ab9c96e5c1a1a92f47ae41); /* statement */ 
planter = candidateContract;
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _address set to the address of TreeToken contract
     */
    function setTreeTokenAddress(address _address) external onlyAdmin {c_0xa8261ccb(0x1e3a3b4ac52f2df12411320674636ad30f56a911b2accacd7c6199f3b9c04a54); /* function */ 

c_0xa8261ccb(0x30f391bf7a3752f25a3ddc8dc74e9cb62874f799edc8877eea27318bf1b326d6); /* line */ 
        c_0xa8261ccb(0x4c1781bb298fca02bae3e47777016a0d7c0ca83e8fea3cdd5effea070113efd1); /* statement */ 
ITree candidateContract = ITree(_address);

c_0xa8261ccb(0x6588f0189c58daf3e5e917001df573319413b07c9f7e2511e806785d09769edd); /* line */ 
        c_0xa8261ccb(0x1dd6fb7e190ca4a2bd46bdd02ffb8540fc75a74fa15de468bf0fa9b99b843aaf); /* requirePre */ 
c_0xa8261ccb(0x0e72aeda8cc906e988acf1720dc82e209052c068228c48c99756b73e41f099a6); /* statement */ 
require(candidateContract.isTree());c_0xa8261ccb(0xe407c0c6d2a71d55c9469d111a3afdce8488bcdb86e8f8d7601e5addfbe79147); /* requirePost */ 


c_0xa8261ccb(0xaddda2d11d8885d1cc005febc9f6229867bc6f950a4d86a3eb160e18a4d9f36c); /* line */ 
        c_0xa8261ccb(0x3d205a8ab11d909f973c717f6c4366e0b56fee699c885ca667ae2cf5d4c6e8de); /* statement */ 
treeToken = candidateContract;
    }

    /** @dev admin can set the minimum time to send next update request
     * @param _day time to next update request
     */
    function setUpdateInterval(uint256 _day) external onlyDataManager {c_0xa8261ccb(0x05456227642e66ff107d062c448b1ecd721b041e728a95941fd1f8f8e3fffc05); /* function */ 

c_0xa8261ccb(0x447f8f894b0edd16fb82ab546e8085daa23404b59caf838c8dd88a9e28ed86b7); /* line */ 
        c_0xa8261ccb(0x192dffeb7fb22b8cf1c888945d7454cfec520a05c08ef6e055ae5c7a3746b96f); /* statement */ 
updateInterval = _day * 86400;
    }

    /**
     * @dev admin add tree
     * @param _treeId id of tree to add
     * @param _treeDescription tree description
     */
    function addTree(uint256 _treeId, string calldata _treeDescription)
        external
        onlyDataManager
    {c_0xa8261ccb(0x7143973640d181da9877b0f6124e7fac726cdb66bd6f9dd8370c365236dec0ad); /* function */ 

c_0xa8261ccb(0xd5c91e0ed52baafd9af4f6e7aabadc83c6571bd5e468a8b11f5171b9f1177656); /* line */ 
        c_0xa8261ccb(0x86b1d668418db39d4e60c9d60dde32d5761880dbfdafa0a94ed1a5c7f5d84990); /* requirePre */ 
c_0xa8261ccb(0x5b1eb1846799c12a2244e62b672236a33a8408fece1a387a59c6cb65dc0fffc8); /* statement */ 
require(treeData[_treeId].treeStatus == 0, "duplicate tree");c_0xa8261ccb(0x0c7bcd151ddc236cf9dd86d9a86c23a7acc75bfe7d1e1ba1feac1d364d4c0cc4); /* requirePost */ 


c_0xa8261ccb(0x5343429fe5e1e16abb53d8ee7ab13158fabfb40c300b8b6933a3a694add0f7f0); /* line */ 
        c_0xa8261ccb(0xf11cb4bc9aacabb83c53d3a048bad6e3c018f42262a8a78c6e9221e65575f565); /* statement */ 
TreeStruct storage tree = treeData[_treeId];

c_0xa8261ccb(0xda50875691d727ad174b439594d0d10e4d07999da11d119616309f17e235fcdb); /* line */ 
        c_0xa8261ccb(0x5efb0b2b8d2f85ddfdc010c4d546d1359bd3b60a83510f94633339d2c6f7114c); /* statement */ 
tree.treeStatus = 2;
c_0xa8261ccb(0xed0bf88424ed8c392276ea008f630f4066d07963de16bb5cce202909a6529d09); /* line */ 
        c_0xa8261ccb(0x69ada66d0ff4fc85c4866aac92a2a65645208e9d4f66f3147cf2efa1186bb40a); /* statement */ 
tree.treeSpecs = _treeDescription;

c_0xa8261ccb(0x573d9fd9e52822db892fe33a7560bc02d3945934404b66d078aee46349ff67d6); /* line */ 
        c_0xa8261ccb(0xfa6feac4ffa3fed4788d1b5161663fbe352a905c4af808b87db05e69057c4041); /* statement */ 
emit TreeAdded(_treeId);
    }

    /**
     * @dev admin assign an existing tree to planter
     * @param _treeId id of tree to assign
     * @param _planterId assignee planter
     * NOTE tree must be not planted
     */
    function assignTreeToPlanter(uint256 _treeId, address _planterId)
        external
        onlyDataManager
    {c_0xa8261ccb(0x60494fc2f680e29a61e7056c553e4af3bc327d4dca9b6c4be4d2f9b2e7c6bf56); /* function */ 

c_0xa8261ccb(0x51d55f977c731c35188df6bd66a34e691f2b5f3dbf522aa59411c18d3ce6eed2); /* line */ 
        c_0xa8261ccb(0xde9a5817742c99536817b3a1adea07bba5f64873a87b371c2955b5fa177d56d5); /* statement */ 
TreeStruct storage tempTree = treeData[_treeId];

c_0xa8261ccb(0xe677ce3a4f8d1b52959b088f0255484f10c93f2a88c78f0af82a6fc28a2f0471); /* line */ 
        c_0xa8261ccb(0x5fe98b7765bc4e8cf71a99740dd6445cdf7f2b3691c59ff70dac58dc585b3c1a); /* requirePre */ 
c_0xa8261ccb(0x2a693714890c648f3d0eee97e638055771250356b5ea8ddb23b9fa171b7b72c7); /* statement */ 
require(tempTree.treeStatus == 2, "invalid tree to assign");c_0xa8261ccb(0xbb1c3109093db6acb6e5193a216a04bebd4d1a35ed666eeaa08ccb4de63a9948); /* requirePost */ 


c_0xa8261ccb(0x6fef4aa1e63f8a3e1952066d4c390f762d74b69081dbd28a0631b784964999c8); /* line */ 
        c_0xa8261ccb(0x82b4ca99f20bbc2230b53f1a5279e5bd9f999349fb4b04b101bf2b7e494e4111); /* requirePre */ 
c_0xa8261ccb(0x6263851602d0f96f2a75d8226cf7a87b9910effd52d8622ee8fdbaf0baf96f9e); /* statement */ 
require(
            planter.canAssignTreeToPlanter(_planterId),
            "can't assign tree to planter"
        );c_0xa8261ccb(0x51319be868bdd9a56b67e3e16d42c15c93cf29917b2a006bda3c683dad73671a); /* requirePost */ 


c_0xa8261ccb(0x27028008cc858f0d8b87d36d92aa0de7bad5876fd195b577cf3cd1ec523c77ac); /* line */ 
        c_0xa8261ccb(0x1c02e654eafb45c9d1daf689a93f8b011c48526a4b196a1ec24a451cb626cc41); /* statement */ 
tempTree.planterId = _planterId;

c_0xa8261ccb(0x62d159994c6f5948f244121bf50049839cae42ac4b1adf3a69872bb898ab130f); /* line */ 
        c_0xa8261ccb(0xfa0b41095fe5f9626788faa9aa75d5633024d6b93044f8240f49db85bdc591cd); /* statement */ 
emit TreeAssigned(_treeId);
    }

    /**
     * @dev planter with permission to plant, can plan their trees
     * @param _treeId id of tree to plant
     * @param _treeSpecs tree specs
     * @param _birthDate birth date of tree
     * @param _countryCode country code of tree
     */
    function plantTree(
        uint256 _treeId,
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {c_0xa8261ccb(0x7d7bbd0b7b56a74e1692d58545e2b91577e3a94dadb399b44db9c6ec52609e02); /* function */ 

c_0xa8261ccb(0x1e66f9837dc66fb82b46ca20a0a4cbaad42f79bc5d050027f28a8f058bd09f29); /* line */ 
        c_0xa8261ccb(0x40244c740d7cbdb433a15f1b2254efaa6d66d9b0edee94b597d582567a95158b); /* statement */ 
TreeStruct storage tempGenTree = treeData[_treeId];

c_0xa8261ccb(0xebc9fe9d8315495eb8deba92cf03b819bcee6b10aa7bab141f68748350272452); /* line */ 
        c_0xa8261ccb(0xfdeff33cf4a397580f7317ff3843d2014b16d675fccb54ea144220780ed6fbc4); /* requirePre */ 
c_0xa8261ccb(0x6209f45fb291940329f2387e57358e51d1141398a2d31783c12b5baf8355725a); /* statement */ 
require(tempGenTree.treeStatus == 2, "invalid tree status for plant");c_0xa8261ccb(0x3e7b16b0c933feb37d73b5cd388fd6d8bb4d7a8ec01c28f02a2628f0dde809ce); /* requirePost */ 


c_0xa8261ccb(0x89475e6c6078186993e8016775878ae3456c78721a5d5a7349a750407889f8c5); /* line */ 
        c_0xa8261ccb(0x5b15682438dc0aa1c93afc63c48d10f3e9dd4e8d1c108ae6eb704bd2b9c240e9); /* statement */ 
bool _canPlant = planter.plantingPermission(
            _msgSender(),
            tempGenTree.planterId
        );

c_0xa8261ccb(0x4b11327184a04ba4639973430a122ed527f5171ad4f7111dbee7037d1e0cab65); /* line */ 
        c_0xa8261ccb(0x1e4fc3aec7ba518d7ad18b353dcbbc3c74efc4526b32e07caa939339e7c0f21a); /* requirePre */ 
c_0xa8261ccb(0x392cc18a05bf4c1a9f0374272975fa7b856d570dfa942dec62849c895c7ea06c); /* statement */ 
require(_canPlant, "planting permission denied");c_0xa8261ccb(0xe2c9063f60366014720c0127f706ef588f707117d3bf7bdd09bc74462a55d31d); /* requirePost */ 


c_0xa8261ccb(0x40d30cb34cbb2febff13cc3f95eb4bf2b453ba8c2fe4cffdeefa035f58eab0d9); /* line */ 
        c_0xa8261ccb(0xb781d6c33026b56d94af6a9b588805f9962127a5e4d05f2948810c68a159247b); /* statement */ 
if (_msgSender() != tempGenTree.planterId) {c_0xa8261ccb(0x1c89c47b1fd34454748cdc0dc8446d60fd04624721d3f4b80cd5410844eb2d3b); /* branch */ 

c_0xa8261ccb(0x1e291ffed23b871213bf2929b8bc2d3953fc8c4f70bd516337fd121a8a2b50bb); /* line */ 
            c_0xa8261ccb(0x317eb21d4dce276531a80c88e1b6a3b7eaf7a50f1d3fdec890630c243d79067e); /* statement */ 
tempGenTree.planterId = _msgSender();
        }else { c_0xa8261ccb(0x2444cbce4cae18e6da6808f03f3fb563ece431bd32e00d341bd2f0a04a80c18b); /* branch */ 
}

c_0xa8261ccb(0x36db4be1790b8aa465e6bc5baf0c985cddb8d044dfac655f9f92740f3ce0c07c); /* line */ 
        c_0xa8261ccb(0xe81708ccaaacc75ec008286845b2d21b01c2aba11b4f7aa7f0bb55f53158e236); /* statement */ 
UpdateTree storage updateGenTree = updateTrees[_treeId];

c_0xa8261ccb(0xee8887d30432194035c0c631a61dba58897aaff7f19ede0a85c58eb1fc302404); /* line */ 
        c_0xa8261ccb(0x24e901ea211f86d1a88f0b1e51878a77450b4670ce72f9a46df4e48255278867); /* statement */ 
updateGenTree.updateSpecs = _treeSpecs;
c_0xa8261ccb(0x1f327d4575913d2f865b55126e8504f2bc40b2815801b32938bf1ed9ac471d40); /* line */ 
        c_0xa8261ccb(0x5c33c6fbdca5b59a28bd9e690f770a32066983195f0fadf4606a3c6a0633d425); /* statement */ 
updateGenTree.updateStatus = 1;

c_0xa8261ccb(0x18dc2af4e1cf2c5324813046156bb6aa793d244550707a562def8f4d7c5bee1b); /* line */ 
        c_0xa8261ccb(0xab8bff8f02f72fc60954a430ad46a9a15a802abcb5b79d394722edb137a30595); /* statement */ 
tempGenTree.countryCode = _countryCode;
c_0xa8261ccb(0x4b223f5dc500313d9b469a6d01c52819a0e903458cd30a4e825bbf3fdf1c0256); /* line */ 
        c_0xa8261ccb(0xb239aa6a143e7b5760b1d651e1e3b2be304a3d1193b23f50104e6f5115069287); /* statement */ 
tempGenTree.birthDate = _birthDate;
c_0xa8261ccb(0x9877457585d83597a537949105834a5eb3a6583f30e010abb557f7e8dc003cb3); /* line */ 
        c_0xa8261ccb(0xdb3eae9a9ea519edfaa46a0ba73a2a5e81da1389855d2d61e8c8992c94300f0f); /* statement */ 
tempGenTree.plantDate = block.timestamp.toUint64();
c_0xa8261ccb(0x5fcc6cd09a4512a03c60ddb94f5fe19f03eb875b958c0a061107063ae099ea0a); /* line */ 
        c_0xa8261ccb(0x6cff129e9dc5e888907d1de113f9fbdaef53638fd93de849f85685ede9b188b3); /* statement */ 
tempGenTree.treeStatus = 3;

c_0xa8261ccb(0xc1804b44a3f49dd750ee4a792bcb9f4bee9836e2dc3b6dfd46e247b77bd6b5e1); /* line */ 
        c_0xa8261ccb(0x40f2fdd810f3b58cabeaf3b3c33fe4b2ed5434390f1d4e5ce626d2da467980c5); /* statement */ 
emit TreePlanted(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verify a plant or reject.
     * @param _treeId id of tree to verifiy
     * @param _isVerified true for verify and false for reject
     */
    function verifyPlant(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {c_0xa8261ccb(0x0a347a5cf78ddaffa5b58dc09e5232ee09091d0af440db966c170d30216bfe8f); /* function */ 

c_0xa8261ccb(0x15d909fde5ce0ea5010f311399d4d00dfb74b3dc192712ce1e8c83eb3b8d4777); /* line */ 
        c_0xa8261ccb(0xb8f92b9c60093e0f65e6a8081cdf85e557435515efa64129b7312e11ee24a198); /* statement */ 
TreeStruct storage tempGenTree = treeData[_treeId];

c_0xa8261ccb(0xe2ce86a8c081e932e8f9f53c156ca23c5a1b49110b41831e40173860828bb5f4); /* line */ 
        c_0xa8261ccb(0x087c24bdf4d26082204396ef713be67cab085f52d34733ed05ad546303dd2016); /* requirePre */ 
c_0xa8261ccb(0x3a37518dbe0a7832c4b36e159224dd5bacfc67500e4d5c9b3815b8a120fa3dc7); /* statement */ 
require(tempGenTree.treeStatus == 3, "invalid tree status");c_0xa8261ccb(0xd78b93a69996ca18ac0f64c7638b93b5c8be7d68867c59e3acd086c1bb77cfdf); /* requirePost */ 


c_0xa8261ccb(0x6fc5c2de1aa8507d3bbf7fe2655a6bcd513abf5c147c8593598e523f6ff04391); /* line */ 
        c_0xa8261ccb(0xace91d958ced13ff4260f2ab2c7badddbe92e85441d9c6f5401c3c12021a99e9); /* requirePre */ 
c_0xa8261ccb(0xad277ac39a710daf5ef8eeb11a94eaf9215a5c0e7a95d9ac88a3e6601bbbfc5a); /* statement */ 
require(
            tempGenTree.planterId != _msgSender(),
            "Planter of tree can't accept update"
        );c_0xa8261ccb(0x8631a565f601855f2ca1adb169e2e6ab93d42df432a4d3936399c9971dc4490c); /* requirePost */ 


c_0xa8261ccb(0xb51ce268a40148b96b10d962b3166720c8d0075e3e96964515364a34ed376f20); /* line */ 
        c_0xa8261ccb(0x349e0eabe058dd679ad7b4398ab521919e1da338a05d8ff536a1229a0f4c74e6); /* requirePre */ 
c_0xa8261ccb(0x4f57645b56f84126588c59ac59f4ace2f9eaa97e3c6315fcf5da6b033c6d8808); /* statement */ 
require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(tempGenTree.planterId, _msgSender()),
            "invalid access to verify"
        );c_0xa8261ccb(0x45f119b2dd76a3b0afcf9a2db890a12645afdafaffb5b43d0b3a49fbac8015c2); /* requirePost */ 


c_0xa8261ccb(0x5b6c45975f23d49a6b85a8d7a22175cf8ab8671c73d6bb14c8881080643c1df1); /* line */ 
        c_0xa8261ccb(0xc8db83428c74ee2415c701e110f2cd217833b682ae01255f65f73b4e79cdb247); /* statement */ 
UpdateTree storage tempUpdateGenTree = updateTrees[_treeId];

c_0xa8261ccb(0x623316b25263b78abf38e5d073f48bd00419e93a25f5848eda190f367166eaad); /* line */ 
        c_0xa8261ccb(0xa00e5ca3f06aba73ef0940a1747e4804407555d36f3028e2c32a23edd696c5ef); /* statement */ 
if (_isVerified) {c_0xa8261ccb(0xedb47d7c16b02c5566bc451a98c2935192862f2a650e22dbfa0d288233597852); /* branch */ 

c_0xa8261ccb(0x608e26cdd643a44a70955bfdd2af2973ad67df01d4ef25938e572d7701e69e81); /* line */ 
            c_0xa8261ccb(0x6aab7043d8b189ed3dc4f13bf700bc36ecf131a22cd3ec7fcc1f39042152091f); /* statement */ 
tempGenTree.treeSpecs = tempUpdateGenTree.updateSpecs;
c_0xa8261ccb(0x470d8859ce20c6204bef89b632616fc3eff96273378fd82ed4ba689ec6e4fbec); /* line */ 
            c_0xa8261ccb(0xab65e6adc544eb54e9dd4d14d1eeb558be0a9b05968cbe83f243c738d8082f23); /* statement */ 
tempGenTree.treeStatus = 4;
c_0xa8261ccb(0xaeb39fa0bf66be411c8a43ba398035171d9dfea940046906c67a40bef92a43f9); /* line */ 
            c_0xa8261ccb(0x14f7eaaa81897f3dbd83ae42f32a04abdb4340f193a652edb83e8581a991b134); /* statement */ 
tempUpdateGenTree.updateStatus = 3;

c_0xa8261ccb(0xc0c692d107d6e3861e2e595f5dc513f1577b3e7e727225395adc91a1a0c4d89a); /* line */ 
            c_0xa8261ccb(0xb3045dd474b16289eb095916a6acbca59b7176209801cd67a71e10d759915596); /* statement */ 
emit PlantVerified(_treeId);
        } else {c_0xa8261ccb(0x63eac8938184043f89fde0baed1e3463f97e3a446d228ae3d914bd3b1a0d26c8); /* branch */ 

c_0xa8261ccb(0x9b3720d2085236309dc79fcdc361d8813d2082a2ede11cbf85ac8bf7ba656231); /* line */ 
            c_0xa8261ccb(0x33191dfe0a81130dad059ca7d60d043d9e5af48cf3bfcafd61aba2e1e7ab3eeb); /* statement */ 
tempGenTree.treeStatus = 2;
c_0xa8261ccb(0xc29fc097f3af7a6f9d84f033109629c40726f536e12aba8751bd9906447061ed); /* line */ 
            c_0xa8261ccb(0x482a13770a9ee8c85e2f163179e554ab03abc1f0a60ec6b6b637eb782515501e); /* statement */ 
tempUpdateGenTree.updateStatus = 2;
c_0xa8261ccb(0xadb5281f2211c83f426ab2b80292d376a746b0164c810145e352029b1a72cad7); /* line */ 
            c_0xa8261ccb(0xf3a26bcfe1678fa9fa3eef2a91cd4765f391521818b2843e36085049e78480b5); /* statement */ 
planter.reducePlantCount(tempGenTree.planterId);

c_0xa8261ccb(0xdee0ceba47dfe74515494ffa3e3fee436648aa139206d2e3d0100006160a5481); /* line */ 
            c_0xa8261ccb(0x592f3889df71a924836c9affe2e7ebf79e6f2d904243db5777c6a8d9e51c4d24); /* statement */ 
emit PlantRejected(_treeId);
        }
    }

    /**
     * @dev planter of  tree send update request for tree
     * @param _treeId id of tree to update
     * @param _treeSpecs tree specs
     */
    function updateTree(uint256 _treeId, string memory _treeSpecs) external {c_0xa8261ccb(0x7b8b85211149f0b554e8ad293bd1d1be9d8c8e550c789f7149bf5322c89c0e96); /* function */ 

c_0xa8261ccb(0xc5cbfdccea6f7cd0797b76aa7fb129100829117d8fc7fd7a6be2a866c326fd3a); /* line */ 
        c_0xa8261ccb(0x7addebace6309c9b5061d43c229992326371e45a53391603c7ab832f3d8858e8); /* requirePre */ 
c_0xa8261ccb(0x0d542a49210960273d8785444cc7e7720db8090b70b422995dce9b9350fdb1bf); /* statement */ 
require(
            treeData[_treeId].planterId == _msgSender(),
            "Only Planter of tree can send update"
        );c_0xa8261ccb(0x4c1cf355337538ae1404b5c40c9c7781f235efe05cf13c1e05456be84036877c); /* requirePost */ 


c_0xa8261ccb(0x63b8d8bd5435c411d8eb0ae9ce6c94886a9d0cd352e72abe27888396a6c07c0d); /* line */ 
        c_0xa8261ccb(0xd3433d1428b7d1579aaf73f5d1a0acdbbb1a5ba72a46c32935014c20f6820634); /* requirePre */ 
c_0xa8261ccb(0x5524d612212c46bd9b616c89279ca54c42bcec1d5afa225feb48731aac3b18a1); /* statement */ 
require(treeData[_treeId].treeStatus > 3, "Tree not planted");c_0xa8261ccb(0xa3945ea0369a58f3c539a172bf9211212b79a0f7948239a56f1e7365148d4c1c); /* requirePost */ 


c_0xa8261ccb(0x66b08d00fd2246e8b37f686e315358611321d6ed9bb08c22ecfe440a08863b30); /* line */ 
        c_0xa8261ccb(0x102801495b790269d2f453872dbd487e3a4a4cedfe445b3b7ae8ed72f8cda280); /* requirePre */ 
c_0xa8261ccb(0xf0c39c1f6cb2302ae1b5e1aac55fe5a4e13c6caba18717312dc9526a5ac9219d); /* statement */ 
require(
            updateTrees[_treeId].updateStatus != 1,
            "update tree status is pending"
        );c_0xa8261ccb(0xecc88b317d0c7be1663372833d3f5cf83d0989392f4b76b8f6c1b0b1366ce817); /* requirePost */ 


c_0xa8261ccb(0xadbbf947d6b9a9f28a5466b948ef3f28321f8a9c3115b15a9ff4618903ea8741); /* line */ 
        c_0xa8261ccb(0x1b965702b9e50c763e7205af5a3e5dc7855e58cc56e4a995b006150d68b27282); /* requirePre */ 
c_0xa8261ccb(0x2a7978f3d2105b16f20262c778e16a78e06da72c9335ba9960f51211543e890c); /* statement */ 
require(
            block.timestamp >=
                treeData[_treeId].plantDate +
                    ((treeData[_treeId].treeStatus * 3600) + updateInterval),
            "Update time not reach"
        );c_0xa8261ccb(0xbc38e14114180109eb2c7a358b6b556604d4d8b5fe86d96cd18d5ea85cf646e5); /* requirePost */ 


c_0xa8261ccb(0x06052899f2bf0ad1865b4012bf1c8a43e49e41e09c88620217db6eff98f4a907); /* line */ 
        c_0xa8261ccb(0x0abe2d61b99d978812d213f9afb16d4f340767d6bdbcd1ab501a822bd7e75865); /* statement */ 
UpdateTree storage updateGenTree = updateTrees[_treeId];

c_0xa8261ccb(0xfb0d2adad52fe634295cf22237ae27c0dac411a9d7dc2016dd027df71fae1b14); /* line */ 
        c_0xa8261ccb(0xb537ba9fd91b857bb18c71236b38eaa4f9e31113772a5d4b2357d7596d9e98d0); /* statement */ 
updateGenTree.updateSpecs = _treeSpecs;
c_0xa8261ccb(0xca8b6632e7d81f4fba84b38a79a3598575a71537c445aea02ee4a90e19cc9ef7); /* line */ 
        c_0xa8261ccb(0x3b336a9d85d769da58b96b4a7a99289b8c5f84853468b1a9089c07d6cd7c934c); /* statement */ 
updateGenTree.updateStatus = 1;

c_0xa8261ccb(0xce61532e120e38668ffdfe0d8c639ac78d11810025b63d457c3e5cdf65a01b12); /* line */ 
        c_0xa8261ccb(0x1138fa746349c21f413902d47bcc22aee7f8cae27bd54ed9b66a572fc177ad62); /* statement */ 
emit TreeUpdated(_treeId);
    }

    /**
     * @dev admin or allowed verifier can verifiy or reject update request for tree.
     * @param _treeId id of tree to verify update request
     * @param _isVerified true for verify and false for reject
     * NOTE based on the current time of verifing and plant date, age of tree
     * calculated and set as the treeStatus
     * NOTE if a token exist for that tree (minted before) planter of tree funded
     * based on calculated tree status
     */
    function verifyUpdate(uint256 _treeId, bool _isVerified)
        external
        ifNotPaused
    {c_0xa8261ccb(0x7d461afd39d09b1740990187630681f888d8fe32ddb3552267bd8ea3ee9f030f); /* function */ 

c_0xa8261ccb(0x8ab9819c8aa5eb5664cc9d08b04eb0fd91902e468aee18ca8389437c8de4ae39); /* line */ 
        c_0xa8261ccb(0x2a195b8db06fbb9c8ab6e9c57560990ba57ec2306d1a00d021b25a6b74fba240); /* requirePre */ 
c_0xa8261ccb(0x2f51d4a2fff1a83bbd02089576e606f0ad487f7199bac75952536047daab4fa3); /* statement */ 
require(
            treeData[_treeId].planterId != _msgSender(),
            "Planter of tree can't verify update"
        );c_0xa8261ccb(0xe9b41b315cf445a605e7a786e9f4e7714ad3100875c975fdf3cdc70b96b607f3); /* requirePost */ 


c_0xa8261ccb(0x17fd0927a148902351c6f3ecd0e0d3f3cc6d6231361c5bbba451fa5f2f6df2bb); /* line */ 
        c_0xa8261ccb(0xbcc9fb9efcacebc5734450642217b99141beadbb28542be77cd9f711564fcab1); /* requirePre */ 
c_0xa8261ccb(0xc0b5dbd675c6d5aaa067b6ca2d3d0f4152744b97965396d862c6e939bdae0be4); /* statement */ 
require(
            updateTrees[_treeId].updateStatus == 1,
            "update status must be pending"
        );c_0xa8261ccb(0x6b7a1ec285b9b635b2b3b0694701f8904321441e3f9a8e43f9efab501b7976d6); /* requirePost */ 


c_0xa8261ccb(0x198d8fa9b5642c2a682e0e0b964c47d66e499463552db9a788c44f88212bfeff); /* line */ 
        c_0xa8261ccb(0x31811ff92c2175d450c072b105725e90b714044075cc4d64e64fda072ef43428); /* requirePre */ 
c_0xa8261ccb(0xce7b300977a6c237b560b2ae6c7902637db64f3ba8e8adeb555c349b21730900); /* statement */ 
require(treeData[_treeId].treeStatus > 3, "Tree not planted");c_0xa8261ccb(0x65320f23da995b6e60877e2724102d496832b66ae93d47ab7b73fb61493faf0b); /* requirePost */ 


c_0xa8261ccb(0x510268d673df1a699518bd4d9a69e1944c250b8323b698786ca4d2dbc93314f9); /* line */ 
        c_0xa8261ccb(0x1c972f4137f86ea2f969ea6e4e12acf58895394db77f3213435e9f342f892d20); /* requirePre */ 
c_0xa8261ccb(0x020467332ba3f3ead4efbfc10c28917e8deca3fbb8d5ad378c57531801846f78); /* statement */ 
require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(treeData[_treeId].planterId, _msgSender()),
            "invalid access to verify"
        );c_0xa8261ccb(0xfedce9dafd21b3832479c192d42ba3ce72054786403d91b007a01f07ef7de1c7); /* requirePost */ 


c_0xa8261ccb(0xfb50c7fb4e569d112898be793e49aa59d04ea0b96903deb9d7ec6d05bc7da9f0); /* line */ 
        c_0xa8261ccb(0xa034bcd9429aa47f508585b4fc353561448892ee586a506d81f053e8a9ed3f0f); /* statement */ 
UpdateTree storage updateGenTree = updateTrees[_treeId];

c_0xa8261ccb(0xdf022ca9bfdb63177d1464f08ed065428dd31506da758ee45e3199248fac9919); /* line */ 
        c_0xa8261ccb(0x451e8f8ce304c776d099cd89095fc0bb225413a66a81f59dc0ea83305c3a7c9a); /* statement */ 
if (_isVerified) {c_0xa8261ccb(0xca967052927cd5cb86f5c9655804244ed6d20b001d75e91e927fea9331a795d0); /* branch */ 

c_0xa8261ccb(0xff79c4bec658d1f131b4857a0fefd44bdbf312b20cdb40e9c3f0b2c51d490d16); /* line */ 
            c_0xa8261ccb(0xec51928bb7851f61a3d2f958bfa286e4b14829b88aef63bf852489d83e10a913); /* statement */ 
TreeStruct storage tree = treeData[_treeId];

c_0xa8261ccb(0xa7c69302efbdf4687111f3f39edcab105c91138de4157a88b3c65fe81fcd026d); /* line */ 
            c_0xa8261ccb(0xbc3fccc0e60127e2ed5f71536ffae0d625722c794fb0f90177f2dab97d30555d); /* statement */ 
updateGenTree.updateStatus = 3;

c_0xa8261ccb(0xad302fe650c2f899ffe4e068f7bb6e6465b5c15920e44cf047e53611854255cf); /* line */ 
            c_0xa8261ccb(0x1d372288c6b3951d10d97e05ac5ae636c64b9baa9d2d41a14e1d3deff2092851); /* statement */ 
uint32 age = ((block.timestamp - treeData[_treeId].plantDate) /
                3600).toUint32();

c_0xa8261ccb(0x9dad9e562ee1ca96b3e864613a802cec39027657f184e6ea38ecfca3ca17d27e); /* line */ 
            c_0xa8261ccb(0x3b355ad90f4355c05deba754471e53392441c409987db91951c71437b3b1b692); /* statement */ 
if (age > tree.treeStatus) {c_0xa8261ccb(0x6ea51ef41c32abfedd779df787a2b4e2932105c9ce74c792456005ba5db53438); /* branch */ 

c_0xa8261ccb(0x7f724dca1267efe96bdeb688b9ecc56b7e78757b6e4a1e300b1f2a51e151f5c3); /* line */ 
                c_0xa8261ccb(0xf28a6732795ba64a30effc03346cd88a91ec7b0bfe2a5cd0a0294011926d8131); /* statement */ 
tree.treeStatus = age;
            }else { c_0xa8261ccb(0xaf809d418bc7b9a288efd9bb6dc0bbbc2fa1b6e1a6e4b599380a72696a0909db); /* branch */ 
}

c_0xa8261ccb(0x2c42733c953ae1277c1297a29bb0a159b5f47c1b76b1729eb0aed8907e6f3c03); /* line */ 
            c_0xa8261ccb(0xcd5dbc073b2a315c58d2dcbd7b1d3525b51ba7ff3710b15ba741bdc7e63d3c8a); /* statement */ 
tree.treeSpecs = updateGenTree.updateSpecs;

c_0xa8261ccb(0x3da6bddc284f0cab7102741185189b0498304217630c1d49e4fb78cce93f3113); /* line */ 
            c_0xa8261ccb(0x30ea10924ffab66864d94266545afa425f8e9f5d2ad10c0c0febdafb1957f445); /* statement */ 
if (treeToken.exists(_treeId)) {c_0xa8261ccb(0x0617e68af4df9ba3e7939570eaabb944206ae4583e0fa8bdef08d5e4058ff484); /* branch */ 

c_0xa8261ccb(0x2c393178056086b7862b651f84f8324a670c30260f1da30c9859276902d34e61); /* line */ 
                c_0xa8261ccb(0x6aefdc490559a5493cfea7ba70b067dedcba6fc0572685b011e8a95fa385f1d5); /* statement */ 
planterFund.fundPlanter(
                    _treeId,
                    tree.planterId,
                    tree.treeStatus
                );
            }else { c_0xa8261ccb(0x2011d5c789ab9227233b2a4cdf6b9bb783f07a074bb2322e2f1bb4d6800bc7df); /* branch */ 
}

c_0xa8261ccb(0x766f699229c6dd9478a43e144875d2e5a29d685e91978b5f8242d124903cf22e); /* line */ 
            c_0xa8261ccb(0x23e56105a54047119c3272d5bbc266abe4d070d8ac676de6934407c95ad42e70); /* statement */ 
emit UpdateVerified(_treeId);
        } else {c_0xa8261ccb(0x002602004f92d090972dbd5385c76de7315f80101cbf8ef10590a577ec22b870); /* branch */ 

c_0xa8261ccb(0x8969dc2eb26711575ef3fdf7d2ba8f3882f4c63d753865f9a4a73fc8ffe4ad44); /* line */ 
            c_0xa8261ccb(0xbb68c2ac64477fe800af66cb24111a3bd217e4ba247a6b501c0e66f3d093a70f); /* statement */ 
updateGenTree.updateStatus = 2;

c_0xa8261ccb(0x533fa3d93b73592f8665f73012d3bf3a2fd86c5ab9fc867a29a7877a813dc8ed); /* line */ 
            c_0xa8261ccb(0x6d4400a5bdf0b06600376c3438c0f9ade7f1000d63d9f5efdc44eeccc4586517); /* statement */ 
emit UpdateRejected(_treeId);
        }
    }

    /**
     * @dev check if a tree is valid to take part in an auction
     * set {_provideType} to provideStatus when tree is not in use
     * @return 0 if a tree ready for auction and 1 if a tree is in auction or minted before
     */
    function availability(uint256 _treeId, uint32 _provideType)
        external
        onlyTreejerContract
        validTree(_treeId)
        returns (uint32)
    {c_0xa8261ccb(0x68b52866d253b9e7fc64b475c6b2ed627c50dcd1b7e568b15ce8c9af7e6abba6); /* function */ 

c_0xa8261ccb(0x858a45be89daec3f19093c6fc46a02dc95be527cae11f9ca3d9dd7a3fe12b2ef); /* line */ 
        c_0xa8261ccb(0x25c843aa68a7b6151b9d9c7101f72f87f3a8feb713cb8643ccf204148964be90); /* statement */ 
if (treeToken.exists(_treeId)) {c_0xa8261ccb(0xd0f69b6a57814a57ee650a752d38e9113dc5b6e6386e3df44b0fda6a6c0b270b); /* branch */ 

c_0xa8261ccb(0x16c71b308db51aece89876ad864f358f6b1f00403890dab7318ed7f6b2a1bbfc); /* line */ 
            c_0xa8261ccb(0xc3efe1e560f9699ece34dfd6f1358f29615fac80c85756d6fb06fa5a5d176991); /* statement */ 
return 1;
        }else { c_0xa8261ccb(0x7a8d034892e36b07a56b09b35a9441e4b7f3c9519a91ff58e883b51806bcf52e); /* branch */ 
}

c_0xa8261ccb(0xc5ae38a78bdca382691c8a6a08fcde6c0fff55ae3132d3ca26f513c785367825); /* line */ 
        c_0xa8261ccb(0x90d72328b0a413d1ee10c8990df42baca669e6113d49306ad87e19b64104db54); /* statement */ 
uint32 nowProvideStatus = treeData[_treeId].provideStatus;

c_0xa8261ccb(0x693aa8b82cca1dfa6198bffd27831ec5234c894bfb492a2a2d5da739d9feadf0); /* line */ 
        c_0xa8261ccb(0xec6a5c65ced6672234144728b02eb6c8863be8d3795a1561dce8d3849e382a15); /* statement */ 
if (nowProvideStatus == 0) {c_0xa8261ccb(0x2a6779695491577f3759b082f292e2eb1715e1b0d3533c0e006082f98cd0c987); /* branch */ 

c_0xa8261ccb(0x707686c2950e6f759eb00d2a2cac00f3a6b871c7f1d88ac7c75a527f199b1f62); /* line */ 
            c_0xa8261ccb(0xad846670f1a9548402b08ce7d0a92d4306aadbb4463b9d480025c73cfc35a43c); /* statement */ 
treeData[_treeId].provideStatus = _provideType;
        }else { c_0xa8261ccb(0x9213f843d1622e1c2d1842e704a80179af54fa4b5f80999cb0192eb387595338); /* branch */ 
}

c_0xa8261ccb(0x897d6c09d1fb6d1bedb0ab4628a376cdbe929f7fce2e05a556750f832c8b3649); /* line */ 
        c_0xa8261ccb(0x9695c89022487678c8b801de408ff99e5c0f7b1e0110304af6a4d1603cf8907e); /* statement */ 
return nowProvideStatus;
    }

    /** @dev mint {_treeId} to {_ownerId} and set mintStatus to {_mintStatus} and privdeStatus to 0  */
    function updateOwner(
        uint256 _treeId,
        address _ownerId,
        uint16 _mintStatus
    ) external onlyTreejerContract {c_0xa8261ccb(0xd63f8a2306cbdb434f1c08bda94134e1f48e2b6b12e6df5e028888769b25560e); /* function */ 

c_0xa8261ccb(0x935347f8589614fb9bcec0edd8c11116c41f6ee36fa8d544238d6803cbdefd7f); /* line */ 
        c_0xa8261ccb(0xeec19ca4a144caa49338bc7c45d34a858d39a91667e2b696ee15acb26651fca2); /* statement */ 
treeData[_treeId].provideStatus = 0;
c_0xa8261ccb(0x033fda28e15233b41cf34b3b5108ae7d72c5e874fa5fd818e7319d68351b71f7); /* line */ 
        c_0xa8261ccb(0xc220684e97e244303dbfe2945ef554e1397964c701ed9a487627d05818bcb81d); /* statement */ 
treeData[_treeId].mintStatus = _mintStatus;
c_0xa8261ccb(0x6a2fdbf837254791ec19c8c7c1349276c199932dcbc2e48da67170e4181f1651); /* line */ 
        c_0xa8261ccb(0xac0ef053c46c4905ef5460e882acc7372707e536dca59ee60006e833af792f2c); /* statement */ 
treeToken.safeMint(_ownerId, _treeId);
    }

    /** @dev exit a {_treeId} from auction */
    function updateAvailability(uint256 _treeId) external onlyTreejerContract {c_0xa8261ccb(0xe0235fbd1f7315702e821a558bb309df1c0a903e8756446cc53cbed1f53a8ede); /* function */ 

c_0xa8261ccb(0x20dacdcc7edef5e4d07d4e442703d479c9768afafe2792fb1bdef8208900bf38); /* line */ 
        c_0xa8261ccb(0x78d73c550818ba482ec8419f22a43ffe0c0e34cd1979754a37853c1d72ca8e96); /* statement */ 
treeData[_treeId].provideStatus = 0;
    }

    /** @dev cancel all old incremental sell of trees starting from {_startTreeId} and end at {_endTreeId} */
    function bulkRevert(uint256 _startTreeId, uint256 _endTreeId)
        external
        onlyTreejerContract
    {c_0xa8261ccb(0xe0ab5e54ad26514e47ca9bb4cda62ca346e6c37ee6e1106572c6a2107c75f6f3); /* function */ 

c_0xa8261ccb(0x2eb50dafd9c79045c1611035b2c576fec8a58c7ee1a856bdfd745fdaaf35d864); /* line */ 
        c_0xa8261ccb(0xf5d58a176fa1a622adc131bbb9d6bbfac6283c00e5f9532f67ce19dd8be070ac); /* statement */ 
for (uint256 i = _startTreeId; i < _endTreeId; i++) {
c_0xa8261ccb(0xcd7c5a2fa02ff79d4d4a279b1ecde71ad733e212996b4bf76e1a858409977ea3); /* line */ 
            c_0xa8261ccb(0x8abc975b271326d41833b175b9d9460b72a750386265807b40e0590136b8e57a); /* statement */ 
if (treeData[i].provideStatus == 2) {c_0xa8261ccb(0xb41aa51e22ca33f0390248bb308b0e06780f7af9a3ae80e58ed8c3f7378f9955); /* branch */ 

c_0xa8261ccb(0xc7f238e0f1be538c1ab817ebdf1e7daf6bc895251e9fc7a8765c46832af4ac2f); /* line */ 
                c_0xa8261ccb(0x7cb42d79adaf7ba05772907c4522b2d57489045b33b5ba860ed0380684802962); /* statement */ 
treeData[i].provideStatus = 0;
            }else { c_0xa8261ccb(0xdfa635bc7a36dd38923a047324d9330558229256b028ce87369e514af376c552); /* branch */ 
}
        }
    }

    /**
     * @dev set incremental and communityGifts sell for trees starting from {_startTreeId}
     * and end at {_endTreeId} by setting {_provideStatus} to provideStatus
     */
    function manageProvideStatus(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint32 _provideStatus
    ) external onlyTreejerContract returns (bool) {c_0xa8261ccb(0x35fe35da5d987a2c66eb073088bc6533a22a8f3dcf485a078bc30a7eebeb7376); /* function */ 

c_0xa8261ccb(0xe56f6f0443fa5cae5a4576fd7a15f706d4edebc84d264d2799fb1eaccdb737b8); /* line */ 
        c_0xa8261ccb(0x719e257992e4d627ee1a5491ebedb28117f5141394c93a165996dd58a30d99ce); /* statement */ 
for (uint256 i = _startTreeId; i < _endTreeId; i++) {
c_0xa8261ccb(0x44a4d5eb8140339e0544813c7d9f12cc2f5c41e8493ebd549f4f124807ed4121); /* line */ 
            c_0xa8261ccb(0x51abf134beb21d43b34cae0432206c3b626f8146fc11754eb8f9fc0817c358a0); /* statement */ 
if (treeData[i].provideStatus > 0) {c_0xa8261ccb(0x06c104d314cea88c1e372e5783198db036ebf598d70bf2fd253d497dd063d4a8); /* branch */ 

c_0xa8261ccb(0xcfdf1f598ebc30b0f30344da245551a0aac1166591c579e4015cc63971345797); /* line */ 
                c_0xa8261ccb(0x3fd85b03a56f83a45f40c6b611311fc8ac808ee2aa588d853419f2cd3f0364c7); /* statement */ 
return false;
            }else { c_0xa8261ccb(0x8165a9022a40fdb7edf8ebc2bed44cf5989ced7138f5e11258212b8f0c9ba9da); /* branch */ 
}
        }
c_0xa8261ccb(0xe9faa15e2ba527e4edc7989cf23e1471047773e8d1c9f6f2a5ed22e8009b8609); /* line */ 
        c_0xa8261ccb(0xc34494200e8408719c3787607aa35f4ab77a843355bd52979fd7a4bd96919cb2); /* statement */ 
for (uint256 j = _startTreeId; j < _endTreeId; j++) {
c_0xa8261ccb(0xa9b93b2b7bbf3c77141c4e00a5f405296fe539da6cead82d25f311f48b793ea3); /* line */ 
            c_0xa8261ccb(0x8a72c8dea34e224b8071c3f0481785ca3b7b5b34112d70cb5740887d4a927708); /* statement */ 
treeData[j].provideStatus = _provideStatus;
        }
c_0xa8261ccb(0x5d38445219363d07c660d0754efcc244ad821d6cec3ddcd8e1c20218c5c345b2); /* line */ 
        c_0xa8261ccb(0x9a3f852fe22e1340e195765853e340eea200b9efbeadc432b64db1344ef8fa10); /* statement */ 
return true;
    }

    /**
     *
     */
    function checkMintStatus(uint256 _treeId, address _buyer)
        external
        view
        returns (bool, bytes32)
    {c_0xa8261ccb(0x8bbed9a8d49dbfec5ebc4e9afeea2ca230e6e8074535517a5ac261bbc9e4b81b); /* function */ 

c_0xa8261ccb(0x4d49f608d77a870b9ce71ad3e27765a200d717e6dadc47442a4757098f9276f3); /* line */ 
        c_0xa8261ccb(0x10b33b20e8a2a88dd9e2a497ae99433eb3734bb49542ce20e64efaa176e1ec8a); /* statement */ 
uint16 minted = treeData[_treeId].mintStatus;

c_0xa8261ccb(0xadce6cc8491fe34189b6431c33c011093d6b3323dddce28529a6c1ef665fcddd); /* line */ 
        c_0xa8261ccb(0x1f13bc71df8ed79510f49ad5b9ba177c0d2735412e0ef41beebd6140eb672621); /* statement */ 
bool flag = ((minted == 1 || minted == 2) &&
            treeToken.ownerOf(_treeId) == _buyer);

c_0xa8261ccb(0xc0cb87c63b65fe9a632a1a60109ebff98ea003551e7c35657a8bb14406d824b9); /* line */ 
        c_0xa8261ccb(0xb3a7f12900d279e4d0dee5bdcc3368de9c9246d4b0bb3e87ec113f9430ab28c0); /* statement */ 
if (flag) {c_0xa8261ccb(0x42a216c587721bd6dc8dd5581be17bb96947fed8b2a8296d8b993ea4b341bb0b); /* branch */ 

c_0xa8261ccb(0xddbb4c775a2009c0eb8234a62914a66d437fd306ae0a656096f63b2374eb1c31); /* line */ 
            c_0xa8261ccb(0x08ba15a540f218c3f55dd12f3a07c80c5db6034bf7dbc67505bd844970e71002); /* statement */ 
TreeStruct storage tempTree = treeData[_treeId];
c_0xa8261ccb(0xf69ce629f7197de6ff27987e8469bfd1bb2cf67cd72eba892b9eeb4f5328a16d); /* line */ 
            c_0xa8261ccb(0x66d960b6f22d548fe882588524d3e698bd942af6ba5ccccf0ece6f499378c823); /* statement */ 
UpdateTree storage tempUpdateTree = updateTrees[_treeId];

c_0xa8261ccb(0x97f74eb0e4930ad2b306b7c8bfa544f3a94209e69b734b45207abe721d5f654c); /* line */ 
            c_0xa8261ccb(0x6c0e00912dc8424d2e6255b5a5930064ddc9602ce0270f2e7aec08233d89b7fe); /* statement */ 
return (
                true,
                keccak256(
                    abi.encodePacked(
                        lastRegularPlantedTree,
                        tempTree.birthDate,
                        tempTree.treeSpecs,
                        tempTree.treeStatus,
                        tempTree.planterId,
                        tempUpdateTree.updateSpecs
                    )
                )
            );
        }else { c_0xa8261ccb(0x91df8d79179044a5d01ea1049a2b8d73439d762f1b6a97ea57ffc4308a49896d); /* branch */ 
}

c_0xa8261ccb(0xa07226afd7e9979376d6fe5d59233b34eb0e567e448b9581af95b7e5d103d21b); /* line */ 
        c_0xa8261ccb(0x1fe050e8d1b306a296c43f97bbe0f1557108eaefe70aa11ec366e701d7d980e8); /* statement */ 
return (false, 0);
    }

    /**
     * @dev This function is called by planter who have planted a new tree
     * The planter enters the information of the new tree
     * Information is stored in The {regularTrees} mapping
     * And finally the tree is waiting for approval
     * @param _treeSpecs //TODO: what is _treeSpecs ??
     * @param _birthDate birthDate of the tree
     * @param _countryCode Code of the country where the tree was planted
     */
    function regularPlantTree(
        string calldata _treeSpecs,
        uint64 _birthDate,
        uint16 _countryCode
    ) external {c_0xa8261ccb(0xacd77abed7896db3d6e435cbd94bb105ade33e2061033535b34601c69e5ded25); /* function */ 

c_0xa8261ccb(0xba33228bf41fa011cf798b0af6cbc24698ca4bfec09de1cfa51a28c0081e35d9); /* line */ 
        c_0xa8261ccb(0xc835e7a7b08d4b783f4e458180e5a352037fc5d9b636e45a6e02511bcb51233c); /* requirePre */ 
c_0xa8261ccb(0xdbdef1bb0323f83519275e71fff3669579a6d34bbff9103b9a9188f926774589); /* statement */ 
require(planter.planterCheck(_msgSender()));c_0xa8261ccb(0xf9ecedf07b025bef5960bd5a07c1cae09fd8106b5248796ec2b06b72fbddf46e); /* requirePost */ 


c_0xa8261ccb(0x39502f2761970763a6d988167b5264378af7f255b07f15012c666f81c9f4b134); /* line */ 
        c_0xa8261ccb(0xaf3b18583273c007905e0e095ac45b440a1f9e909fc77cd33e6151839e308836); /* statement */ 
regularTrees[regularTreeId.current()] = RegularTree(
            _birthDate,
            block.timestamp.toUint64(),
            _countryCode,
            0,
            _msgSender(),
            _treeSpecs
        );

c_0xa8261ccb(0x176851bd4c1de16b136650f3069b8c719fd88dad5bb526749a7de90ae9175803); /* line */ 
        c_0xa8261ccb(0xc1809069cf3e89d86c56665fa29969c59725237daaffb2461600c10a4de2a27f); /* statement */ 
emit RegularTreePlanted(regularTreeId.current());

c_0xa8261ccb(0x3b6af5a74ef591df4add20ecc06359d6b6589a039e1f0452b8b63f0254815636); /* line */ 
        c_0xa8261ccb(0xd77138e5987dac4259608e15982c8bea0c6228a207c035579632494250039fa4); /* statement */ 
regularTreeId.increment();
    }

    /**
     * @dev In this function, the admin approves or rejects the pending trees
     * After calling this function, if the tree is approved the tree information will be transferred to the {treeData}
     *
     * @param _regularTreeId _regularTreeId
     * @param _isVerified Tree approved or not
     */
    function verifyRegularPlant(uint256 _regularTreeId, bool _isVerified)
        external
    {c_0xa8261ccb(0x85e683f8e5a5f1916c6888b99eca130c19e85dce8f090c221ce64c80b6c10531); /* function */ 

c_0xa8261ccb(0x09caa82176bd4b286c2ad4ba717130a7496ed219d14a27c1a35e4d099e9b86c7); /* line */ 
        c_0xa8261ccb(0x97d667cdc9a3c691da15d52d226a979950bb58b521661e03c337d07f7e5bc77f); /* statement */ 
RegularTree storage regularTree = regularTrees[_regularTreeId];

c_0xa8261ccb(0xba4aa4a1ff10b2735a0e5d47d01dacab881973846d3e81fedd7face5691cc253); /* line */ 
        c_0xa8261ccb(0xd72d794e9d07afadaff3777a92c29678f9d121317037a35ab4ef9a3f18f0c07d); /* requirePre */ 
c_0xa8261ccb(0x4b77e78f068d702898f94db1ab3ef74f9978e121fd12197bf44aaa56d550f482); /* statement */ 
require(
            regularTree.planterAddress != _msgSender(),
            "Planter of tree can't verify update"
        );c_0xa8261ccb(0x3c136fb9ca65f8e1217e6380017e8533e65b7911b1c3a3bb8f4943eb514f8412); /* requirePost */ 


c_0xa8261ccb(0xb0574a84be7746d12508984af0ba9625c2f05b11568675a72c3448b20f666e3e); /* line */ 
        c_0xa8261ccb(0xc1b3c50d9b7b50cb0efa750ef9901fb46a992a886f17983551a2d8e1efb69616); /* requirePre */ 
c_0xa8261ccb(0x041f58875d28134d4db227641ce43f18174859aab52d3bca01ba32d17a9968fe); /* statement */ 
require(
            accessRestriction.isDataManager(_msgSender()) ||
                planter.canVerify(regularTree.planterAddress, _msgSender()),
            "invalid access to verify"
        );c_0xa8261ccb(0x4665dcbd017fb74ca7bfa9d6ac0dcf983d41b7a9ea9c629aca63725bccdc9a44); /* requirePost */ 


c_0xa8261ccb(0xbfd66bd9131e75f66425fdf9fe8413c13e2663524d784181026d96c218e33e3c); /* line */ 
        c_0xa8261ccb(0x68c43abf7bcd464a7691965a9402e4467e9fdf080efbcc3b6e51e8ba5169e645); /* requirePre */ 
c_0xa8261ccb(0x37ef7abfb5a561000d7a54169f46d165437a145e1f32d84892292c0389a41576); /* statement */ 
require(regularTree.plantDate > 0, "regularTree not exist");c_0xa8261ccb(0xaaac1f0df2db24711fcc65dd3bac9179b06156bc167b0497389a960152002845); /* requirePost */ 


c_0xa8261ccb(0x681464a3069ca4ec8134dbfabc8f50e286006c0a483903d1dbaba15dfb7f2d51); /* line */ 
        c_0xa8261ccb(0xc48e67d808ae05cb297871bee767d93b249bb73a27786d646b706be136aaf990); /* statement */ 
if (_isVerified) {c_0xa8261ccb(0x5c345edf8fe09ef45de8f3beab3ec8c3e777993c3e68eeaaef3d4f85244419be); /* branch */ 

c_0xa8261ccb(0xf13d06df10bc5b1fb281c7c79f5248e6e5880880cf71d41306f0c727371e37bb); /* line */ 
            c_0xa8261ccb(0x2abf7b789cbdfe2f3933222437a31f18622ce0bf4ef4198697d282cdded09a41); /* statement */ 
uint256 tempLastRegularPlantedTree = lastRegularPlantedTree + 1;

c_0xa8261ccb(0x1c7357d6afda337d4c4dc4720c2e26834dd87da79951d97eda569075c82aff69); /* line */ 
            c_0xa8261ccb(0xbf98e590a574b3b050c3c9e819cfdda07b334d51a4765a1997dc391709e2f944); /* statement */ 
while (
                !(treeData[tempLastRegularPlantedTree].treeStatus == 0 &&
                    treeData[tempLastRegularPlantedTree].provideStatus == 0)
            ) {
c_0xa8261ccb(0xa8712bd61cf80bb7afa38fbd69620b3d121a3347dd9dae12c31e79932f7ac486); /* line */ 
                c_0xa8261ccb(0x11dfc766d0d8fab135e0fe65f9799eb4736743be0a2f44be6c3ce04b757635ba); /* statement */ 
tempLastRegularPlantedTree = tempLastRegularPlantedTree + 1;
            }

c_0xa8261ccb(0xa7cece62d577384db395f8a4d5a54f42cf20ed61c80ebb861d6175ffd08c83ae); /* line */ 
            c_0xa8261ccb(0x1f663d942c6504c7e9382002767140783065d532e8e247c42d676760984e5f3d); /* statement */ 
lastRegularPlantedTree = tempLastRegularPlantedTree;

c_0xa8261ccb(0x004668b581fb092e2204f832eb23324acd9fad43c72289e9174405a7cb889d29); /* line */ 
            c_0xa8261ccb(0x6ff7b46ffc28ade57fa40013ec9154a36d09e847039647a9e808ed9cadd72642); /* statement */ 
TreeStruct storage tree = treeData[lastRegularPlantedTree];

c_0xa8261ccb(0x32a11a8aeadc3a203cdbc0313049380de1409a684572aa749b90392c5dd8509b); /* line */ 
            c_0xa8261ccb(0x6b16d6575d5f693bc6883cb4e086ae7290601191f253b86395b82de7c3d71603); /* statement */ 
tree.plantDate = regularTree.plantDate;
c_0xa8261ccb(0x4f9f0586eacc692fe5ce4560c5c53b1a5da61fb67c17be9fae294646cc86b56b); /* line */ 
            c_0xa8261ccb(0xf720a074b59557c4897699b923445fcbebcf7c4d0f757bb89827c6a659acd14a); /* statement */ 
tree.countryCode = uint16(regularTree.countryCode);
c_0xa8261ccb(0x4aa2f4291df1c90a114daa03e7b0e21f81eb3daf0069c7822b8f3867ed656bd6); /* line */ 
            c_0xa8261ccb(0x72e4d85aba279f6508dceebb668c8c2aa64cadbe1ebb7cefc947ea6e16d9dc41); /* statement */ 
tree.birthDate = regularTree.birthDate;
c_0xa8261ccb(0x0532fdf7c873d7fc7408079ec7163f2f0251173989eb9209ef7734cfcf0b8242); /* line */ 
            c_0xa8261ccb(0x1642f5f91010bbbb732fbdb9735d4aad5abbcd305b8815338c2e0862d50894f2); /* statement */ 
tree.treeSpecs = regularTree.treeSpecs;
c_0xa8261ccb(0x75b60f60330ca0f76eb70d95b2c08e612409a655a71907ffd36b5c2ccb70c35e); /* line */ 
            c_0xa8261ccb(0xd17cd1242aae5b4ec080a82c3f5ec2d49aeb6e1a8dd7753fac3952e386b35ba8); /* statement */ 
tree.planterId = regularTree.planterAddress;
c_0xa8261ccb(0x7b44ebef76d44d07ed8322e6d4900cfbe504c5630c3127ccab9223e11e41ad8f); /* line */ 
            c_0xa8261ccb(0x368c3aa5808f1dc18afdc358eb26109c37d0856cb59a7afe03d6a3548137201a); /* statement */ 
tree.treeStatus = 4;

c_0xa8261ccb(0x7b864ade107cc98ace75caa3ab507cbc417cfcc8958223f59841a8629f0c8263); /* line */ 
            c_0xa8261ccb(0x6eb9a4439017f9df7749dc10a4af26e8542ee72dab853ed9b1bfd2a64b423b80); /* statement */ 
if (!treeToken.exists(lastRegularPlantedTree)) {c_0xa8261ccb(0xd83ad70bbfe3363fb365d9457f4895e06689c9e731f8381dfe2207f2012a4d8c); /* branch */ 

c_0xa8261ccb(0xda8765a322ccca03516f5db07a65ac101ded4b01e23cb33d0cd49b08b2d03524); /* line */ 
                c_0xa8261ccb(0x14da12a17a2cdb2942662a06dfeaab4ada0d7f833c26969bd197a8079a5c3777); /* statement */ 
tree.provideStatus = 4;
            }else { c_0xa8261ccb(0x50b856e9b85c02096c1879886a087f5aaef0e47599bf4594d20fb02ea61ff885); /* branch */ 
}
c_0xa8261ccb(0x298d853edb8e4e531fbadf475d2325691a280132040f6c0c8c157629da7a6b09); /* line */ 
            c_0xa8261ccb(0x5e817119c05cf2372d669beaf213038de6f62008ddcb78c31efbe37c27d79d70); /* statement */ 
emit RegularPlantVerified(lastRegularPlantedTree);
        } else {c_0xa8261ccb(0x5b10db20287bbd00c498bd10a5e97534a4e34975c13058dcd7c01111f7233584); /* branch */ 

c_0xa8261ccb(0xf80f1cdd131617fb785ba57fdac211ede35436ed41e46532c086dde72ec005d6); /* line */ 
            c_0xa8261ccb(0xd2ce27b89002b7fcc9bb310c23898c1401023d12f6b3f4981b0b1c0ef2f04520); /* statement */ 
emit RegularPlantRejected(_regularTreeId);
        }

c_0xa8261ccb(0x3e86a1f8c8b2ca33ee381749f677b417e76b953835d12a0cde64ce826ef494b9); /* line */ 
        delete regularTrees[_regularTreeId];
    }

    /**
     * @dev Transfer ownership of trees purchased by funders and Update the last tree sold
     * This function is called only by the regularSell contract
     * @param _lastSold The last tree sold in the regular
     * @param _owner Owner of a new tree sold in Regular
     * @return The last tree sold after update
     */
    function mintRegularTrees(uint256 _lastSold, address _owner)
        external
        onlyTreejerContract
        returns (uint256)
    {c_0xa8261ccb(0xf6ad8da3311e9ee1cd5ef8ed0532d3997466f5e180ece79c50f51be23638418d); /* function */ 

c_0xa8261ccb(0x774aff658432106766549ae70ef1a4801b83ea2b910f3505f57d4fd4ce806d41); /* line */ 
        c_0xa8261ccb(0x4e63e949f0368ce9a0364ef36fee5df5664ae0acce890cc888ed21082b0e40ae); /* statement */ 
uint256 localLastSold = _lastSold + 1;

c_0xa8261ccb(0xd161883637faac255e145709fb2b56a02ec45605702d776413e9eb3b8092e526); /* line */ 
        c_0xa8261ccb(0x95200bbf47d7f001b9fa76969827ae74425671785555dd37cedb5c61d8882582); /* statement */ 
bool flag = (treeData[localLastSold].treeStatus == 0 &&
            treeData[localLastSold].provideStatus == 0) ||
            (treeData[localLastSold].treeStatus == 4 &&
                treeData[localLastSold].provideStatus == 4);

c_0xa8261ccb(0xa22667eb11f410eae31596289480d2963bc5da2c165ffea9e27b7a383f876f63); /* line */ 
        c_0xa8261ccb(0xc5146824baedabb91bd0dfc00f8c7fe6428b32dc082121d80a7a02766ea429ab); /* statement */ 
while (!flag) {
c_0xa8261ccb(0xca5d4489eabf3cb8329dc1bffdec3c24813349ead691c38b04811ce24e62d8e5); /* line */ 
            c_0xa8261ccb(0x738b736ea769a2ccd12d224e10703c843ff5ca1ddf818064279bf4ca13e0ae1b); /* statement */ 
localLastSold = localLastSold + 1;

c_0xa8261ccb(0x9c8560f9231038d76b42a2186bc124cd20212c982095f325c8207de420f0f287); /* line */ 
            c_0xa8261ccb(0x7631fba6d1eb7692e678d4b312cb17210e07ecc0fca1b06a9c1a73bc57c5c671); /* statement */ 
flag =
                (treeData[localLastSold].treeStatus == 0 &&
                    treeData[localLastSold].provideStatus == 0) ||
                (treeData[localLastSold].treeStatus == 4 &&
                    treeData[localLastSold].provideStatus == 4);
        }

c_0xa8261ccb(0x0de62cae6fe219d0f4a71abe5dafdf4844317de3190d46d37be58cd810151bda); /* line */ 
        c_0xa8261ccb(0x67f14302f4e8a7076b5c88814d1a3f878536f5ec104f38778224121fa7e9e410); /* statement */ 
treeData[localLastSold].provideStatus = 0;

c_0xa8261ccb(0xec397951b1c6841824dd4f20225f403d95d606debed6855f1dda24ae59de3983); /* line */ 
        c_0xa8261ccb(0x651b17b6a09ac0498c6cc7157bb46467e761e972585e276f48769795aa35e782); /* statement */ 
treeToken.safeMint(_owner, localLastSold);

c_0xa8261ccb(0x10e38215d9ca5209e987558d2b444a7385f0a2d63fd9b775d38a4b895399db78); /* line */ 
        c_0xa8261ccb(0x33dc759bcb5a92537dd16bc221987dab24c8ac729701ebbad0d8f14413cdcee5); /* statement */ 
return localLastSold;
    }

    /**
     * @dev Request to buy a tree with a specific Id already planted and this function transfer ownership to funder
     * This function is called only by the regularSell contract
     * @param _treeId Tree with special Id (The Id must be larger than the last tree sold)
     * @param _owner Owner of a new tree sold in Regular
     */
    function requestRegularTree(uint256 _treeId, address _owner)
        external
        onlyTreejerContract
    {c_0xa8261ccb(0xb9576efac55d54cfa52b09ed6a36aa9f730ed5d10911ccc6ff39c55e1097fa39); /* function */ 

c_0xa8261ccb(0xcc173e3db0bf1a83cc9bb925d1598a9a41aac7242ceb49ae372afc17ed305304); /* line */ 
        c_0xa8261ccb(0xa8a153bae93087037e643d30f04c276759c74785969f57b0d9ba856ab813bf21); /* statement */ 
TreeStruct storage tree = treeData[_treeId];

c_0xa8261ccb(0x415b61fdabec1dc791bb59edd4038dee5be37ecf4ce1f3ac0c420201eed04cb2); /* line */ 
        c_0xa8261ccb(0x84ad2b8ec30b50f06530a72c98ff6d6ddb0292360489af27b9a283de08f7af5e); /* requirePre */ 
c_0xa8261ccb(0xdb5b367133a648f5df4a94f2f3b527281a6711119fdd63f95aac62d7eac68ac6); /* statement */ 
require(
            tree.treeStatus == 4 && tree.provideStatus == 4,
            "tree must be planted"
        );c_0xa8261ccb(0x3a2007feb4a6873e48fe6ec2af1dfb75fa4d9a0ca07d0eddf3dc9532cb50f6fc); /* requirePost */ 


c_0xa8261ccb(0xbc9a8b472de20df6903f4cb7ea79e40f0bd2076b8fc5ae35a058d331e4f8e032); /* line */ 
        c_0xa8261ccb(0x30ae44b6baab05e18d1e750fd744368aabec5faf035bc4c5bf16b95570ff250f); /* statement */ 
tree.provideStatus = 0;

c_0xa8261ccb(0x2201715bfc536b0fd0a624716ab03cfdfb4753505857e0967bc79f90e649e15a); /* line */ 
        c_0xa8261ccb(0xb956589f98df4fac66ec53190f368a998538fa93c2a42e83df896299c2511216); /* statement */ 
treeToken.safeMint(_owner, _treeId);
    }
}
