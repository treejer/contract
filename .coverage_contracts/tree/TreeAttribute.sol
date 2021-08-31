// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x782db1a4(bytes32 c__0x782db1a4) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../gsn/RelayRecipient.sol";

/** @title TreeAttribute Contract */
contract TreeAttribute is Initializable, RelayRecipient {
function c_0x8f48945a(bytes32 c__0x8f48945a) public pure {}

    using SafeCastUpgradeable for uint256;

    bool public isTreeAttribute;
    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;

    /** NOTE parameters of randomTreeGeneration*/
    struct Attributes {
        uint32 treeType;
        uint32 groundType;
        uint32 trunkColor;
        uint32 crownColor;
        uint32 groundColor;
        uint32 specialEffects;
        uint32 universalCode;
        uint32 exists;
    }

    /** NOTE maping from buyer address to his/her rank */
    mapping(address => uint8) public rankOf;

    /** NOTE mapping from treeId to tree attributes */
    mapping(uint256 => Attributes) public treeAttributes;

    /** NOTE mapping from unique symbol id to number of generations */
    mapping(uint32 => uint32) public generatedAttributes;

    /** NOTE mapping from unique symbol to reserved status */
    mapping(uint32 => uint8) public reservedAttributes;

    event BuyerRankSet(address buyer, uint8 rank);
    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x8f48945a(0xfd51bd35c2acc01c75cad85a1ec84eaf512e198361cb0f4bb2c85606b0ff7060); /* function */ 

c_0x8f48945a(0x7935ad9c1971d64fcbc668e3b2cbede04ba2bc427e295bbcbde184b7546ba4ee); /* line */ 
        c_0x8f48945a(0xbe947384078f7b4bea5d4c3a5194fba3734c91488cc7fa148b4091b0364dbee7); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0x8f48945a(0x6cdad768c5ab3fce7a9445f10bfc3df34176e829532eda6818ca29ff521b19e5); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x8f48945a(0x25ae9a5d4d5918d580b6f618edfba537e77175a26cf4a292f723f4d45be8abd0); /* function */ 

c_0x8f48945a(0xbbb1c76d1b8c6dd032033168ac888fe02817dfe296f302cfe15e1da2c1b08e9f); /* line */ 
        c_0x8f48945a(0x8b28ff43aeda83ffeedbc021f8319161ed8230d74339b608a156f81fd616b733); /* requirePre */ 
c_0x8f48945a(0xe2bb2b9769442dedd5dcaaaeabccb3892c2cab2f81763117401bd7d6ce8056ec); /* statement */ 
require(_address != address(0), "invalid address");c_0x8f48945a(0x635c6ede1429ae8d304b72440705fcc4efc27c2ff8d59b381d17fcec165b506e); /* requirePost */ 

c_0x8f48945a(0x656bac6fe07c765d358ffc60578d713961c4169e5f9c26cfbdb9e7ccc8bebbab); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager or treejer contract role */
    modifier onlyDataManagerOrTreejerContract() {c_0x8f48945a(0x89395798b31da8af4071a28311e8b93b31f7f665ac492fecd2056fb3507e5b4d); /* function */ 

c_0x8f48945a(0xf72d0acbc8ec30926dbf0b4a367bfa1091bf535f9b1b9598cf569e34e21f4b79); /* line */ 
        c_0x8f48945a(0xd54ecfd1d049ba3208c233896dd28b0b62eb288753b6b931ac30738092011fbf); /* statement */ 
accessRestriction.ifDataManagerOrTreejerContract(_msgSender());
c_0x8f48945a(0x40b51a474ddfc8c5abc6905b65e5c1c7c25b18c75f5c00dc59cc5a09f7e363de); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has buyer rank role */
    modifier onlyBuyerRank() {c_0x8f48945a(0x0cf57ec73b55008c3eb782c83c1e946b1e1f8163e526cad0902a6f481cbee97d); /* function */ 

c_0x8f48945a(0x0018f3ddfdf7fcf3ef7bc8647e16c3ff6d79e31e028df9ff1a8c953e8f64db4b); /* line */ 
        c_0x8f48945a(0xffafbbba35b8be141b0e59b9e9f869bc8c2f354fa0de411f4b7bd7bfd3b28ad8); /* statement */ 
accessRestriction.ifBuyerRank(_msgSender());
c_0x8f48945a(0xcaa295811b9f1a1783e9da7fd657eafb4d1fe7485c410b77a55ad63bc7a370b0); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0x8f48945a(0x831fe4478e03bf7fbf58b8036e6e538a34e77fd1da1f73ce31b72ccfe8af7640); /* function */ 

c_0x8f48945a(0x5a30c71d8d93ca9ba669d945141074ef6be56defb3e77ed41d65af46f01c504c); /* line */ 
        c_0x8f48945a(0xbcaed83b9b9cd95f92811367929b9d55b580dcd7cf0779a5ed13ad77c64f320d); /* statement */ 
accessRestriction.ifNotPaused();
c_0x8f48945a(0x8a2d8da5c23c294769f4369e9818afbb78aca09c843942c5abd82406d5bde007); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAttribute
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0x8f48945a(0xea6dd35208ca5295c6eee69bfa773621d54837f2dda206e9ef72638ef559f5d2); /* function */ 

c_0x8f48945a(0x1009f7cffee5b338e1ed1702e63c39bfa5b5a3258e5a58f396838b0333c19737); /* line */ 
        c_0x8f48945a(0x0d7623efddd12c266efe54625d81fbceabbb89c9a13eef46fd087aa780818a26); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0x8f48945a(0x8d01732ea0c72aee3634135fb07edb7f8522d92e2daaf80b0f53efee8393607e); /* line */ 
        c_0x8f48945a(0xb034b94cff3d4c340f61e9a80c6a029d42b947da5a63252963eb007b081a2e55); /* requirePre */ 
c_0x8f48945a(0xb80e871afb922250c4c5d5ea9cc19675b97f484d91ba5f5c2dfed31bae13787b); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x8f48945a(0x53e6f4968a0a1ac1c42b258a16952ac140a1f2f128d188d8063a245bcf700e81); /* requirePost */ 

c_0x8f48945a(0x8d2c911905cfc864665b7bde331b703beed2a03164e03a7c579fd0b2049c5a76); /* line */ 
        c_0x8f48945a(0x9065a212471bcb23f8c135673838221d5516129839adcdb24b702b5d4624ea41); /* statement */ 
isTreeAttribute = true;
c_0x8f48945a(0x3a779d8ae62fd92d7e1bc16e3414c7fbe3cecfef0b69dbaad7c05bb4911fc144); /* line */ 
        c_0x8f48945a(0x12abf14c244a50c3be61c44a4031da247610d933db10d90a7e3b61db4d65af09); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x8f48945a(0xb6a1aa05a719c7511ca30f032d76a91c8f488f29a2cfe075c31a58b6832dbaf1); /* function */ 

c_0x8f48945a(0x5830e036f517aeb71ba36a6c7a287c1bf60cec61755311c4276b2adfe8ebd0d1); /* line */ 
        c_0x8f48945a(0xcb3c7613e5c2f9e616960f74f21a532a4b51232e24b03297f64558db065ed542); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {c_0x8f48945a(0xe91d03fc1354d606996fbafff49dce9c8e74a5bb3d9ce706ab4345b93ec97baf); /* function */ 

c_0x8f48945a(0xd5ecb66e0682f8752f2524624c46da2cad729b0e4afa7ab1cc117b4dfad3221f); /* line */ 
        c_0x8f48945a(0x281a6ca52b180837242367eabd5308d85fd19c6e2f926b3591ca3037abc85c9b); /* statement */ 
ITreeFactory candidateContract = ITreeFactory(_address);
c_0x8f48945a(0xbc4bd4a31c857e9d28688a3718014823bd010e3aaf9b47cdb0cc938c97928fac); /* line */ 
        c_0x8f48945a(0xf6ced79edf26e6eacdc4c1e8c2c98ff0385a1b33ca70114d087bd5a70aa8b5f8); /* requirePre */ 
c_0x8f48945a(0xa99f62b18278c2181d1f00eef21f933f5d0c6422c995663c418e9b4fc803be18); /* statement */ 
require(candidateContract.isTreeFactory());c_0x8f48945a(0x62998c71abc2565b6fa66e64925ff3362c0590a1570e93a39c967e4736eb85e5); /* requirePost */ 

c_0x8f48945a(0xf5f07188d4bd503fdcc487f702caf15a5c94db5b712c256b2517345b593d4579); /* line */ 
        c_0x8f48945a(0x5504d5309beea9e2b0b3b3d4a087fc3b72fbf605dee319734293592e9b264eb7); /* statement */ 
treeFactory = candidateContract;
    }

    /**
     * @dev reserve a unique symbol
     * @param generatedCode unique symbol to reserve
     */
    function reserveTreeAttributes(uint32 generatedCode)
        external
        onlyDataManagerOrTreejerContract
    {c_0x8f48945a(0x1e109cd893426cfe91eb5b19b54a59d2972d7f1b59c30a5c88cdfd1949baf51b); /* function */ 

c_0x8f48945a(0x48840d9042d0634f1b2a93b6dd336196528cdabc16f79e6acfb07d7853e7a91e); /* line */ 
        c_0x8f48945a(0x0b7d5c8034467c62b04444ab72d891cd5bac5cafaa255d8bc9c6e5c61811b5e9); /* requirePre */ 
c_0x8f48945a(0x320f0fa2713288d86353210b716b68567194fd8f40263d398185c394c5001854); /* statement */ 
require(
            generatedAttributes[generatedCode] == 0,
            "the tree attributes are taken"
        );c_0x8f48945a(0x1eaea729bc8540d61c020ee28cd13981919582b7869c1bf92070a54d321f5cb4); /* requirePost */ 

c_0x8f48945a(0x4beee4ba5d69d19bdb3d4e2e9860f2e32ff1e3c10df59f40cb862d2d135b8e87); /* line */ 
        c_0x8f48945a(0x31fb41e5d3c80f792543f90902935251d187e5fcfacaa1045d8a30234d4518c6); /* statement */ 
generatedAttributes[generatedCode] = 1;
c_0x8f48945a(0xf987c14b5c5427631b9c503f72e26ca2defe7319a3717b724c5ac2eee9be8391); /* line */ 
        c_0x8f48945a(0x590d523bfc3d9e840e8e1de6896154d545a22ef68910f98add2139301e1fd9cc); /* statement */ 
reservedAttributes[generatedCode] = 1;
    }

    /**
     * @dev free reservation of a unique symbol
     * @param generatedCode unique symbol to reserve
     */
    function freeReserveTreeAttributes(uint32 generatedCode)
        external
        onlyDataManagerOrTreejerContract
    {c_0x8f48945a(0x02ac3c7e5f09aa38023c87af6bfa7c561512305379a8e17abca0b5be23ee4c8d); /* function */ 

c_0x8f48945a(0xf030894da6704c32be9613e0d6f9142478e602ed3de372755206dccbb84f8e71); /* line */ 
        c_0x8f48945a(0xc52c29cb4080b51a476a7bf157d9062e2a3b0631d5707f6815405f8ff2c4269d); /* requirePre */ 
c_0x8f48945a(0x5bf37cb95462a7fc3f50b4c3832050486fbb989f4ce1f751472b4e941bad4279); /* statement */ 
require(
            reservedAttributes[generatedCode] == 1,
            "the tree attributes not reserved"
        );c_0x8f48945a(0x2ff017ea5dabfd0827492cfe748989166e7e77f1099edeebe52209ace7c51dfe); /* requirePost */ 


c_0x8f48945a(0xc86af19730d8ff63199a2b4bbd2d674bff1dcb2d63c6fb5d68c978219de3a601); /* line */ 
        c_0x8f48945a(0x256899fd8f04f45b21ab23d4b0f721225d0dc0687738291718f6dbc92bb49f1f); /* statement */ 
generatedAttributes[generatedCode] = 0;
c_0x8f48945a(0xceba7dc7134dce5dc948f329d112c62b71b69a088285f7c21d553d5434ead2b2); /* line */ 
        c_0x8f48945a(0x0f2752b17f870b8f0d4365f993652962a859238fdd6c86f2936a43b5f1118912); /* statement */ 
reservedAttributes[generatedCode] = 0;
    }

    /**
     * @dev admin assigns symbol to specified treeId
     * @param treeId id of tree
     * @param generatedCode unique symbol code to assign
     */
    function setTreeAttributesByAdmin(uint256 treeId, uint32 generatedCode)
        external
        onlyDataManagerOrTreejerContract
    {c_0x8f48945a(0x7c4947b870eb2d1d7a41ca10f5fde312485d04ed3000a60fe710f6f64a34a050); /* function */ 

c_0x8f48945a(0x7ac49a8250b80c635d2953c23061436b711056e375404a7f7abf630397a6d103); /* line */ 
        c_0x8f48945a(0x547c9311998136c95a7224a86be29697bfada50a066c573ec4a700a96be9725b); /* requirePre */ 
c_0x8f48945a(0x32b60e1bdb8e855eff2f268a79aac278314ae54a436b37f53a3fde32f48b4700); /* statement */ 
require(
            generatedAttributes[generatedCode] == 0 ||
                reservedAttributes[generatedCode] == 1,
            "the tree attributes are taken"
        );c_0x8f48945a(0x3e7e01452bf686ec8ae1c9fb7f3575f3b2418c2238d216e01b8e3992cf8ba7d7); /* requirePost */ 

c_0x8f48945a(0xdc8c86b98b7872cae09e7628742c21029c50c1b6bd36c875aae32c938d7f9540); /* line */ 
        c_0x8f48945a(0xde27bdaeffa9c2a212dc5c19af4555cb7e8439504d87dea0667af94ff5dce5a4); /* requirePre */ 
c_0x8f48945a(0x5891998416e9c2a34b34612754ab83d8464d415d786cb8b20e068e432a3ee8df); /* statement */ 
require(
            treeAttributes[treeId].universalCode == 0,
            "tree attributes are set before"
        );c_0x8f48945a(0xef9e8ee19ec5eace855e843a9bc62bf4eba55d5aba07f7a6f1965b4d81114800); /* requirePost */ 

c_0x8f48945a(0x5d7db6057e1d9cd22b6262c11bcdc7ffaa730b153e1a1197e0fe5cf5b6ef0bdd); /* line */ 
        c_0x8f48945a(0xadcc2d5f4ae1dcc28d27d1f333dd57bba864d1cd4df9db399cb70b70612581c7); /* statement */ 
generatedAttributes[generatedCode] = 1;
c_0x8f48945a(0x9a875570f441e6366d97cd23b973affafa38444ae0600b9286a490ca118f065c); /* line */ 
        c_0x8f48945a(0x3020cb89e5e8dc58afa0d6c89a37a9612cb128f9575f89ed0eba90052f154f68); /* statement */ 
reservedAttributes[generatedCode] = 0;
c_0x8f48945a(0x5f3b56db3e4bf26d38a337d17fda29de30bb8787bd730033b857e8e721c12257); /* line */ 
        c_0x8f48945a(0xfd74df01b04e10fae1747009b9dc2ba88493cab2539521b37c4f0e84dbd318d5); /* statement */ 
uint8[6] memory bitCounts = [6, 3, 4, 4, 3, 4];
c_0x8f48945a(0x120bc8fafdd0e95ed9d7239722ba66496df14b381c2275b738f8db5bdebad5b0); /* line */ 
        c_0x8f48945a(0x0fdf332cac94a411b5f267d6e8c6bff13b300aeb51ae5c4f126751d1d8b45226); /* statement */ 
uint32[] memory results = new uint32[](6);

c_0x8f48945a(0x0e33e0621fa664f4bda97d1a2de8cd7ac2739a3d2c1218c3cc02eca476ee71b5); /* line */ 
        c_0x8f48945a(0xc246c1a47e7b99f0f87c02b1a5f952022ff9838419a4f3a44f46155c8b5be3e8); /* statement */ 
uint32 tempGeneratedCode = generatedCode;

c_0x8f48945a(0x76d0b1ac3c1add7166f81d78a66cc4223923edf3d7a240a35619e83a61e8cc19); /* line */ 
        c_0x8f48945a(0x18fbb9eff1a6c4b0d926639f8f880dcc6138de337b62b5dd2637fcad04000ccf); /* statement */ 
for (uint32 i = 0; i < bitCounts.length; i++) {
c_0x8f48945a(0x17e71d955b219a93b609e6a0dbe6f4b1582b2074a6fcbe2ee7d55cfa2d5576e6); /* line */ 
            c_0x8f48945a(0x059dc47bb104d30f41dad445a4f828e6294451985015219e00fe59a651dca519); /* statement */ 
results[i] = _getFirstN32(tempGeneratedCode, bitCounts[i]);

c_0x8f48945a(0x1e26d1203f4f745bd1e25b3d5205927d4731c8f814a90c822e5d7f432762a272); /* line */ 
            c_0x8f48945a(0x3cfcf2db342654b4036b397c1bafd2004f5a6dc95d3a2e8fdd4b70a85e9d856f); /* statement */ 
tempGeneratedCode = tempGeneratedCode / uint32(2)**bitCounts[i];
        }
c_0x8f48945a(0x9b6a6fd3151051f1417b4bd18a802e5f1ae7dbb5f6060ad9c4fea26f7cbfbf84); /* line */ 
        c_0x8f48945a(0xa9d2899e1793f1be95ee4880da1b6b5eccab3c48cd64df0e8f8e2402f12a388d); /* statement */ 
treeAttributes[treeId] = Attributes(
            results[0],
            results[1],
            results[2],
            results[3],
            results[4],
            results[5],
            generatedCode,
            1
        );
    }

    /**
     * @dev calculates the random attributes from random number
     * @param buyer buyer address of treeId
     * @param treeId id of tree
     * @param rand a 28 bits random attribute generator number
     * @return if generated random attribute is unique
     */
    function _calcRandAttributes(
        address buyer,
        uint256 treeId,
        uint32 rand
    ) private returns (bool) {c_0x8f48945a(0x5bda0f32ae9a349181ee3678fe083b6cd2617d6fd34895069f38530b0564a238); /* function */ 

c_0x8f48945a(0xe3abd015f0c58bd7fa48d64d3b9703816cb5c9f3d321f818fa5a7961ac570eb6); /* line */ 
        c_0x8f48945a(0xb9a32674f9f183a408181cc7d8bde59caae76db4fc1d8061c5475361205fa2eb); /* statement */ 
uint8[6] memory bitCounts = [6, 3, 4, 4, 3, 8];
c_0x8f48945a(0x4a98427e92845e8f1bb7854d923439ee103b7e5f474781b30f8ac818bab60d04); /* line */ 
        c_0x8f48945a(0x36677df79153855a523ac2c1d330c0d34934b5533ee0093bab6e7393e2a6ac18); /* statement */ 
uint32[] memory results = new uint32[](6);
c_0x8f48945a(0xe70a341ed1a05dacb8c745fe11705577cd146ae199462aeec83d910d350a03a2); /* line */ 
        c_0x8f48945a(0xeaf64811d5b293e60c1d326c9d4adb6272fbd564daccc3ddff0d47999e75be5d); /* statement */ 
for (uint32 i = 0; i < bitCounts.length; i++) {
c_0x8f48945a(0x2b53c331ed42581dd858487a59be9899c4685ebdbdc2b93638374f7aff4a23a9); /* line */ 
            c_0x8f48945a(0x783a670eb38f61bd50bb90c4e6b23f9f36b37901d481c00fab6cfc6ef1361302); /* statement */ 
results[i] = _getFirstN32(rand, bitCounts[i]);
c_0x8f48945a(0xe9f363f82e63c89e2717dd7e51e93a1024a3369759d4e340d11c0e872f1fa831); /* line */ 
            c_0x8f48945a(0xe917c296fbce0c49dd65eef0364dec0b23ca438a72bcee0918f6b548a5ee3138); /* statement */ 
rand = rand / (uint32(2)**bitCounts[i]);
        }
c_0x8f48945a(0xe6aa068f1d4abd3edab6f474c26ce6168bbe26f068f3f6924ddfc303794a3e0d); /* line */ 
        c_0x8f48945a(0x40eacdcc1874c1c3e7044435245e4bc19c2bb88ffd35a2b32b1a655376714e2a); /* statement */ 
if (treeId > 100) {c_0x8f48945a(0xfebc0d42a42acf0429cc09062c8b745566586309e44727a5616291536254e28d); /* branch */ 

c_0x8f48945a(0x773056431bf58a779b30bb620f971076369895cec2e880a882cb7734a6a52b8e); /* line */ 
            c_0x8f48945a(0x9bb5fe5713e17ed699f9af99a7bf04d177ec11242f3b08daa54cc219f4479430); /* statement */ 
results[5] = _getSpecialEffect(buyer, 0, results[5]);
        } else {c_0x8f48945a(0x66d468112caec23c7c5c41aa51b1a1a06a640674ed55ebffc182c38842d316b5); /* statement */ 
c_0x8f48945a(0x89bc91acfbaabe3db460a02ab053946f1d6ea70d4fbdeab2e3b425da13bd8712); /* branch */ 
if (treeId > 50) {c_0x8f48945a(0x00c780cf682c681a8124349c5a4c38aed5e5c7adc6ed5af56a41529af50bbac3); /* branch */ 

c_0x8f48945a(0x5372715616cb38579cf50a97c4e43549905da7401a32f7c71fd57eb203893607); /* line */ 
            c_0x8f48945a(0x36863ed916ff3429762f8beb00e73318150885cf3894dc0bd27071d46b010636); /* statement */ 
results[5] = _getSpecialEffect(buyer, 2, results[5]);
        } else {c_0x8f48945a(0xfbb86c3c2825019c1ab7f3914c80ff0e6c8baf568e3c4049900135c1e9f4a412); /* branch */ 

c_0x8f48945a(0x2cde9c56a81c9d13867a005cd466ccb2d0ddb264a31756723dfd4677d8fc23cb); /* line */ 
            c_0x8f48945a(0xfb451f34b1c33d8032f67ee76038f3b5b3720cd2a65265d4f05c98d2bfd9708c); /* statement */ 
results[5] = _getSpecialEffect(buyer, 3, results[5]);
        }}

        //check Uniqueness
c_0x8f48945a(0x33be4e2c4aaaf94442732123055acf0a89154e4946f4d8c425111b0afdddf640); /* line */ 
        c_0x8f48945a(0xf9726cc687f7b0ffee5787c00a01ae079c38a1fe37ae49a97a0741f3ab8942e8); /* statement */ 
uint32 generatedCode = results[0] +
            results[1] *
            64 +
            results[2] *
            512 +
            results[3] *
            8192 +
            results[4] *
            131072 +
            results[5] *
            1048576;
c_0x8f48945a(0x74cba3f9258383db85eddf7f0dcb32a050fa895810243178f25461f102f4ac92); /* line */ 
        c_0x8f48945a(0x3a8a583baa8b53a23db3971ec347937727deee7ce1cef70839df213632a492cc); /* statement */ 
if (generatedAttributes[generatedCode] == 0) {c_0x8f48945a(0xd5eb2ea24ed28c1b250618c25bf4cf442e5f47103a9fa0b6d18d7d370854fddb); /* branch */ 

c_0x8f48945a(0x393dab5fa9cf33c7223c15ff9c064c5899e942e9a0d1c02cfe3e2a285f329288); /* line */ 
            c_0x8f48945a(0x5f5f8f5e46d53bca1fabe9150c16094b2a7153cbc4318a56e7dd08b8c05640ef); /* statement */ 
generatedAttributes[generatedCode] = 1;
c_0x8f48945a(0x13af9166647c843940bf28f0c2544c43fd30f823b6b39d25f2b4c1b358a453c1); /* line */ 
            c_0x8f48945a(0x79f6e28baca51a9f8114df69b40104affff18edc1f76c297348871727115bc74); /* statement */ 
treeAttributes[treeId] = Attributes(
                results[0],
                results[1],
                results[2],
                results[3],
                results[4],
                results[5],
                generatedCode,
                1
            );
c_0x8f48945a(0x52b20fc8cebbe71bb9bc2808e6678bd7bd0ce662d87f8ef50b29000f585244dd); /* line */ 
            c_0x8f48945a(0xf1c8c221ae5edf3e33153fb4e7121248779eb6eec1e9a67dd04a6b34d50fb2d4); /* statement */ 
rankOf[buyer] = 0;
c_0x8f48945a(0xcdeed400560d646b7831efbeaa1911467995e4c2e0103648c6e746295098a6ab); /* line */ 
            c_0x8f48945a(0x12ae209f5c144417de0915847ee6541032d05597851682c79cee9c276367fa63); /* statement */ 
return true;
        }else { c_0x8f48945a(0x44ff0ba763afa008dd7b0d6e82ec511adb4376527c8141f49dbb2cb3dbb4a067); /* branch */ 
}
c_0x8f48945a(0x848700f5cbd0df2c8c2353b92dc22107e87b9e805e841cb31a6d2d644f4b75cf); /* line */ 
        c_0x8f48945a(0xc119a64e939410a7119d752b3d28f62190118e5ea2ed79e8f13411ba209d557d); /* statement */ 
generatedAttributes[generatedCode] += 1;
c_0x8f48945a(0x8ecf56c614502428fa43fd93cdaa95ec852b4f3d0aa784610a217ee2ce107575); /* line */ 
        c_0x8f48945a(0x23efcf9306c0596889372f5855a57057688917aaed300a38c5c24ab14f429126); /* statement */ 
return false;
    }

    /**
     * @dev generate a 256 bits random number as a base for tree attributes and slice it
     * in 28 bits parts
     * @param treeId id of tree
     * @return if unique tree attribute generated successfully
     */
    function createTreeAttributes(uint256 treeId)
        external
        ifNotPaused
        returns (bool)
    {c_0x8f48945a(0xb7856e27cc38914f4372c976f012c22f86cdc9ef87f56870acb45039cb439f9f); /* function */ 

c_0x8f48945a(0xec309290a874e5d7e48372ee37259ea48d074daeef71d5c390c7a94426a763b7); /* line */ 
        c_0x8f48945a(0x3165caba52d1d6e1585d881f561f4d042f19c20d118f364febfb7e29ec89b39a); /* requirePre */ 
c_0x8f48945a(0xa903c3e76d8df737dc143af18da5678b4f266db785c169a069b4580ea55a5fc8); /* statement */ 
require(
            treeAttributes[treeId].exists == 0,
            "tree attributes are set before"
        );c_0x8f48945a(0xea065a5e18b4d7241d4a65d3d665e4c804da519ca3f0d32ca9db92182f969dc7); /* requirePost */ 

c_0x8f48945a(0x3bcaa1284456a55aee9521ddd00eeb6eb063a2b46e68bde7c2bc53a9fb2042b5); /* line */ 
        c_0x8f48945a(0x444b1859b1cafb011af99fa1a53a9adabf772a61e82dfeba0c2af866a3e12416); /* statement */ 
(bool ms, bytes32 randTree) = treeFactory.checkMintStatus(
            treeId,
            _msgSender()
        );

c_0x8f48945a(0x7424c52e645eb104b0a8da26ecacaa8df12e4aac72c7bda26a7a4a13d88d1450); /* line */ 
        c_0x8f48945a(0x8c78950feaaf5789b5f7b4e76f549295af06ec1fc6524ac918095067022184e2); /* requirePre */ 
c_0x8f48945a(0x20cbcccb6ab1c4c5abadd3ad50d6f7f53aa0b4e4cb2f92d073224d93ef8d071e); /* statement */ 
require(ms, "no need to tree attributes");c_0x8f48945a(0x5b08d1b86c300951229ec26321264eab53223bbe34e054ccb72ccd0995a11d56); /* requirePost */ 


c_0x8f48945a(0xbd7ba7c3a572b9d6da85d657254940857c1fadde702e561033701ecbfd0a8159); /* line */ 
        c_0x8f48945a(0xafb134bca2e21ae508fa230dbbd889c788be0e610d4a928acdb159fc893c69fa); /* statement */ 
bool flag = true;

c_0x8f48945a(0x8ec50ecf10bcfdda349fe73e1de30af3ea7932c6f82bb9c5e4f44d298598389c); /* line */ 
        c_0x8f48945a(0x0c720d557760666bb7fc4d6f119dc1ca44b2661c8a22607e29601bd69bb825f9); /* statement */ 
for (uint256 j = 0; j < 10000; j++) {
c_0x8f48945a(0x843ae4c7bc52174f85d799b693339cdcf7306f7e367d1d4fcf0881017c7ea68f); /* line */ 
            c_0x8f48945a(0x6ecbb1877ac138507e698c4bac99e04d68568d50e4779ec4219dc938dbe14d43); /* statement */ 
uint256 rand = uint256(
                keccak256(
                    abi.encodePacked(_msgSender(), randTree, msg.sig, treeId, j)
                )
            );

c_0x8f48945a(0xda883c4717da6f2c1395ace2b361e7d8fcfea83816eb1c7183f08fb778c19e14); /* line */ 
            c_0x8f48945a(0x0900e511999dd075b457e06ae26501760d39325810c7b4fb451bb40191aed758); /* statement */ 
for (uint256 i = 0; i < 9; i++) {
c_0x8f48945a(0xb2177fb2c077d41f90c086834236f47b50985c1384c265bb4e87d4611fdb6aad); /* line */ 
                c_0x8f48945a(0xa016faa5420862818e1409096eaa579578c7b7eab17a932ea46e5e78b4737217); /* statement */ 
flag = _calcRandAttributes(
                    _msgSender(),
                    treeId,
                    _getFirstN(rand, 28)
                );
c_0x8f48945a(0xe09722b0a9c18e8c7123d4a9087e7fb14464ab988a7a4676a7df89a3eaa3cf47); /* line */ 
                c_0x8f48945a(0xa63def21b566cc0ed23279aa8c32ca6f16544db8a2577cd9661ef696d0567dd6); /* statement */ 
if (flag) {c_0x8f48945a(0xd91b1444b5835d2e5da4fcf4eaf042ace31228e53553f5167e6cb5d4c74b856b); /* branch */ 

c_0x8f48945a(0x20eb0437f4f8976ced16693fe4a989bab0482c6d1a2857d6cc8a716a90731f0f); /* line */ 
                    break;
                }else { c_0x8f48945a(0xe621a5711ac00a0cf1522a6bfcec90a4b6a18e46e171d59ac1e70abf254df55b); /* branch */ 
}
c_0x8f48945a(0xaa84d6bf0ea5e073e887fa915dafedd112a7d41f46b830bdf996093f19999888); /* line */ 
                c_0x8f48945a(0x0837193280ed35165652c7bb38ee884ff42fbbe4135f4be595c8c298fd08215c); /* statement */ 
rand = rand / (uint256(2)**28);
            }
c_0x8f48945a(0xd813de67e1014984ab041841b9791c0d5cb8781f58098efc0dcca9a185c34190); /* line */ 
            c_0x8f48945a(0x0656605d91c766fe60421225941ec875f9e160fac3f0cae15fa74def9b13b3b5); /* statement */ 
if (flag) {c_0x8f48945a(0xbabfcc82c67084bd8f8f229a33369666273aabe114d48f3f0f7d579cd4101097); /* branch */ 

c_0x8f48945a(0xbcd70ffbfd17995f240d33dd050039536d5d2648e90a9cf913201a22d084122e); /* line */ 
                break;
            }else { c_0x8f48945a(0x6c3895133cfafd07b4edcc451fd908575b01c466110d57caf172493b3d5e646f); /* branch */ 
}
        }
c_0x8f48945a(0x7aa3eb38cb9c2e061ff0eb05a4884ec03d7e4abba93d1eb6279c9d8370f25357); /* line */ 
        c_0x8f48945a(0x9667da46fddc31026724c9a0096e1add2f5cd6d8027fd6f0219180d9359552be); /* statement */ 
if (flag) {c_0x8f48945a(0x68c26993724999615acc6729409b81b7b97286d0081a805c611d3fc2b6813568); /* branch */ 

c_0x8f48945a(0xf2f94cc4a4a0647bce394bc32554ebda71c88f30d4ed4e180a30716750721998); /* line */ 
            c_0x8f48945a(0x0f655c45e131d81552fa36f79edc7a696c51d39adfd1a18afe20fed12a9ee3b9); /* statement */ 
emit TreeAttributesGenerated(treeId);
        } else {c_0x8f48945a(0x3f07c94a16d1176bb9a4d6800edf90b3dc2db411e63a8a93c5ed06c5f4932778); /* branch */ 

c_0x8f48945a(0x1e6e59ded148d9c08294ba6f84df2fdcf87152bb5dc7c4f68e189cb47c903b23); /* line */ 
            c_0x8f48945a(0x069691fbe89b83f24d943408170cf8023a7cc925cd33561521149394035726a2); /* statement */ 
emit TreeAttributesNotGenerated(treeId);
        }

c_0x8f48945a(0x0fb9394db1846ac12991f8309762fe85175faafdf71376bb00baf9cf5c04f25a); /* line */ 
        c_0x8f48945a(0x72ca414f510299ab9509b4f70b53161418f8ac6ebd90f6926830b3a7680cf6a9); /* statement */ 
return flag;
    }

    /**
     * @dev the function Tries to Calculate the rank of buyer based on transaction statistics of
     * his/her wallet
     * @param buyer address of buyer
     * @param treejerSpent weth amount spent in treejer
     * @param walletSpent weth amount spent from wallet
     * @param treesOwned number of trees owned
     * @param walletSpentCount number of spents transactions from wallet
     */
    function setBuyerRank(
        address buyer,
        uint256 treejerSpent,
        uint256 walletSpent,
        uint64 treesOwned,
        uint64 walletSpentCount
    ) external onlyBuyerRank {c_0x8f48945a(0xf6f392c15c430f3ede89edba6c74c0fe5b021d6df66fd6a14efa084f36d83aab); /* function */ 

c_0x8f48945a(0x4cab6eff16439d3c40a23ce8f28247967c964f79933681c226873208611da7fd); /* line */ 
        c_0x8f48945a(0xa748b774d89c193ef5872b3afe32b56ec2681a4168a811f907927195451c177a); /* statement */ 
uint256 points = 0;
        //each 0.004 ether spent in treejer has 10 points
c_0x8f48945a(0x2241cb090e02969025ac51adc415f63a435d67dc9b70d07c1a8aceaedf805600); /* line */ 
        c_0x8f48945a(0xaf1995f76bc8cc18830838b66b0e2721a2285dc5ee2dc58495deb5fe89af35b2); /* statement */ 
points += (treejerSpent / (400000 gwei));
        //each 1 ether spent of wallet(sent or withdraw) has 2 points
c_0x8f48945a(0x598f0147fbd4d9e7560dacc70a5597e126a27d07f41740c764516a61438eb430); /* line */ 
        c_0x8f48945a(0xd5f764c2c831aa0aca7f866318e190f2d7c6238535802d14f6bfb618b29fed0a); /* statement */ 
points += (walletSpent * 2) / (1 ether);
        // each 1 send or withdraw of wallet has 1 point
c_0x8f48945a(0x06c02c009ec6b4965025e5e4de6bf0b01ce07debdb12b21d990bd97f256b6e11); /* line */ 
        c_0x8f48945a(0xc01279bee6da59f949b941988fd96c9ebddef3c443936184c18ca49b1dd3f362); /* statement */ 
points += walletSpentCount;
        //each tree owned by buyer has 10 points
c_0x8f48945a(0x004ff29f1210901fc47a95f94143af820fb2f7ff0bcbede07752354c70eff843); /* line */ 
        c_0x8f48945a(0xd6cb305ac531516689c165eacd7d24030c396eaa25e0c10cbbcf0273310789c1); /* statement */ 
points += treesOwned * 10;
        //points under 31 is rank of zero

c_0x8f48945a(0xe893313bacb769083f68220172e8a3e261ecffe26d7a6b0f4496c1c37a40db54); /* line */ 
        c_0x8f48945a(0x67718af649a10d8998c92363b45ed477f891862b3c546d294f0aa2234ba94148); /* statement */ 
if (points > 1000) {c_0x8f48945a(0x70de5eeb1b3a775df06cd18d2d2ecb2ff73b6d8b9102eae4b9262610a7ac2e43); /* branch */ 

c_0x8f48945a(0xfc3a61f812cbfad89632050a2d133ec9300aba6425c377464c6e58abd64295b3); /* line */ 
            c_0x8f48945a(0x6b2dd2e9b726d19b9a602de4ac2ae5079310f45409627f05f2ce4d7ad4ae353d); /* statement */ 
rankOf[buyer] = 4; //points under 61  is rank 1
        } else {c_0x8f48945a(0x8a9555f7b87f458f9e0c1126ea24ac79c62c89930fb74a3b1c4c250599286a16); /* statement */ 
c_0x8f48945a(0x23455f427a5e071a225a2411524a70c162ee1ad51522e3088b97a4efbcace7b4); /* branch */ 
if (points > 200) {c_0x8f48945a(0x2b6cbdfcce90125bb56a4d67958eebef882257e30643788854a8d9b515dc322b); /* branch */ 

c_0x8f48945a(0x996e6896e808a376ed60bc91ab31bf20246c07184465711eed8aa470844b16f2); /* line */ 
            c_0x8f48945a(0x2aa948be5977626a5d6103bc62128c8d8539389a0e3addd3199e1a4e64ae28e8); /* statement */ 
rankOf[buyer] = 3; //points under 61  is rank 1
        } else {c_0x8f48945a(0xaba70205560be660b1752f200a3889efc4840c7b43ecd53efcce0eff2047dccc); /* statement */ 
c_0x8f48945a(0x700eee3be7f7711bba9e7d762626e52f2fea671ffb41cb47163fa41f82bbe6e2); /* branch */ 
if (points > 60) {c_0x8f48945a(0xca27a80785897f7613b77270c0c9d9db2bc8944d7aecf8820642242819c09ab5); /* branch */ 

c_0x8f48945a(0x1cef8b462ecbf572b918ede2ae3655017f98d37cfc3719f6208e4a84c87a3ff6); /* line */ 
            c_0x8f48945a(0x53ca1b77091c20ec125f827776304c052e760ccb7ef3cde130a6d550772bd138); /* statement */ 
rankOf[buyer] = 2; //points under 201 is rank 2
        } else {c_0x8f48945a(0x3007ac2852cc1a5202f454b5c704731a57f9ff7c6d48e93c83885d99ff107a64); /* statement */ 
c_0x8f48945a(0x0ef8f1fdb806bca0c0e43c9db6835f49c011b0da1fb20213cc3503306f857055); /* branch */ 
if (points > 30) {c_0x8f48945a(0x035476850a77473b16e1a168e28fc166e03abd3453d79c2f39df6dd27a192519); /* branch */ 

c_0x8f48945a(0x53497e229d08ce53c14c193d444ef1f1154be27e754bd03fc1609b4a79332ffc); /* line */ 
            c_0x8f48945a(0xf4b600732cd064e443dd29d586defa30447a42be86cec20a7e5ac0c34af1d7b3); /* statement */ 
rankOf[buyer] = 1; //points under 1001 is rank 3
        }else { c_0x8f48945a(0x8d08da6e45ef9a45ddf58bc213984b54461542e42839c9a19036397a2fff3c2c); /* branch */ 
}}}}

c_0x8f48945a(0x1f5d11c82378060c54a0fd51b166f21b97f118f741016a63bcad03908f640548); /* line */ 
        c_0x8f48945a(0xd4f0f3f5dd3738056dc27037cff6cd1ea521fe95e5b80e6ae1a4430e3a33c7e8); /* statement */ 
emit BuyerRankSet(buyer, rankOf[buyer]);
    }

    /**
     * @dev to get n lowest bits of a uint32
     * @param rnd a 28 bits number
     * @param n number of bits to fetch from right side of rnd
     * @return first n bits from right
     */
    function _getFirstN32(uint32 rnd, uint8 n) private pure returns (uint32) {c_0x8f48945a(0x153227ab091885140e12bbb6f6fbb6f82c83cbaa68c51d723229ba205c11fead); /* function */ 

c_0x8f48945a(0xca2e0a68c491f6b8b7122bc0cf1a498e1fd0e9dd4368d4976afd780f4f55d0e3); /* line */ 
        c_0x8f48945a(0x7cef59c87651beb4b53d04eae2f5f7ca61ba57806ededdd422879925844f0ee9); /* statement */ 
uint32 firN = (uint32(2)**n) - 1;
c_0x8f48945a(0x1c5d1596596fb9b8ce2c2557c9e34951f932cfeaf9452c6a5ff32933fbfae8c8); /* line */ 
        c_0x8f48945a(0x6a0f76e1240d1a1f655f4e61716e26e1df90c90779a80a7a5d850a735aaa6d7f); /* statement */ 
return rnd & firN;
    }

    /**
     * @dev to get n lowest bits of a uint256
     * @param rnd a 256 bits number
     * @param n number of bits to fetch from right side of rnd
     * @return first n bits from right
     */
    function _getFirstN(uint256 rnd, uint16 n) private pure returns (uint32) {c_0x8f48945a(0x059a62115e5c92aba7a780f213b5285d6041d8fec9e19087fb63393dad321969); /* function */ 

c_0x8f48945a(0xf84685b576406a4a4a44ee06c0d484726914022e6fc8854038d66b5a80275704); /* line */ 
        c_0x8f48945a(0xce17724cc616bc917e87acebe30e728fec93b716685e00a892a11ef5fc61d219); /* statement */ 
uint256 x = rnd & ((uint256(2)**n) - 1);

c_0x8f48945a(0x28a1487fbdeb568481e57790dad3c884d24e54dc97a9360023e05d3906b3daa6); /* line */ 
        c_0x8f48945a(0x792c340620dbb330e827841494b434b29bb5b787763de0e51884e3959093aa6a); /* statement */ 
return x.toUint32();
    }

    /**
     * @dev The function manipulates probability of rare special effects based on rank of buyer
     * @param buyer address of buyet rank
     * @param bonusRank rank for bonus on auctions
     * @param n random number generated for specific effect form 0 to 255
     * @return special effect value from 0 to 16
     */
    function _getSpecialEffect(
        address buyer,
        uint8 bonusRank,
        uint32 n
    ) private view returns (uint32) {c_0x8f48945a(0x8300f08d5a6acf807d66a5df08b03ae994741d9f2a4687f7e8ca9155eb7bebac); /* function */ 

c_0x8f48945a(0xcf44e8dc9feaab9b93ba7a52c566ece9b0bf299ffe89999c6585ad8510d28700); /* line */ 
        c_0x8f48945a(0xbf492cdc4b4a482e5e84f7c8cd9c31a3bdd0cb3d32fe283467a5801b02649399); /* statement */ 
uint16[16] memory specialEffectsRank0 = [
            50,
            100,
            150,
            200,
            210,
            220,
            230,
            235,
            240,
            245,
            248,
            251,
            253,
            254,
            255,
            256
        ];
c_0x8f48945a(0x67d1d05751c152d9d40fa34b2886baf2b785da243739f1648202833a7433c2f6); /* line */ 
        c_0x8f48945a(0xe7fd0e33f17822892c3103303715f2457046a3350873a087292bf244f5e82796); /* statement */ 
uint16[16] memory specialEffectsRank1 = [
            42,
            84,
            126,
            168,
            181,
            194,
            207,
            216,
            225,
            234,
            240,
            246,
            250,
            252,
            254,
            256
        ];
c_0x8f48945a(0xd1d1ed11e1eedd35273a0c22345590d130042ed3d8cacbae8acbfe5b61fad222); /* line */ 
        c_0x8f48945a(0xa9c6b499c9379d2f683e79527215159c81e5e7199b510eabaccccbcb3d10f412); /* statement */ 
uint16[16] memory specialEffectsRank2 = [
            40,
            80,
            120,
            160,
            173,
            186,
            199,
            208,
            217,
            226,
            233,
            240,
            244,
            248,
            252,
            256
        ];
c_0x8f48945a(0x931291b494975d27e5a026e153400b20736174bb9d49f4eaac45b3b1e57dbb62); /* line */ 
        c_0x8f48945a(0x1a15c9320bf41dc2096431766e8227027c5cd06f4ab4bd46dc026dc8f7e31403); /* statement */ 
uint16[16] memory specialEffectsRank3 = [
            32,
            64,
            95,
            126,
            141,
            156,
            171,
            183,
            195,
            207,
            217,
            227,
            235,
            242,
            249,
            256
        ];
c_0x8f48945a(0x2ecaf6e800f58e94f0788ef371188f05ce3a50eb233b119e6200239e7e734561); /* line */ 
        c_0x8f48945a(0x37884224602689fe7d72bad3221e209872dc93669149b410ca0c6d25d63601f2); /* statement */ 
uint16[16] memory specialEffectsVIP = [
            25,
            50,
            75,
            100,
            115,
            130,
            145,
            156,
            167,
            178,
            188,
            198,
            214,
            228,
            242,
            256
        ];
c_0x8f48945a(0x8001a5028a63cb34526f21ea0902105314a39251b0fdbda82bbadfef6e5c10f5); /* line */ 
        c_0x8f48945a(0x652d058ec99d13d656ca4d329770527c508ea227ecbaff2c291b92b22d1e9cda); /* statement */ 
uint16[16] memory suitedEffectStatistics;
c_0x8f48945a(0x37b2dfeab7f7932a35c7fefe6602ba368b127b81232f4ab13adfe6d3090a3d06); /* line */ 
        c_0x8f48945a(0x302bc463c4510092df0cf03902830ed5df9dc629ef75bda6d481bc190a6de56a); /* statement */ 
uint8 rank = rankOf[buyer] + bonusRank; //bonus rank for special trees at auction
c_0x8f48945a(0xf93b128361aebbde1abe97df9a637edcb0eb724d8dbcef8312cd313b40181f21); /* line */ 
        c_0x8f48945a(0xb1cb73acd45bf683feb6fc9b02c89cf09b5c098ea636a6257da4fb8fae021395); /* statement */ 
if (rank == 0) {c_0x8f48945a(0xe887fa88c85b40c7cd38e4b8390405c52b7eae70123bb0c40742e7e882aa1706); /* branch */ 

c_0x8f48945a(0x594f56bcee47a5336da21a1090d47643a5b6a38ec2abf8e272692967c3bc1ba1); /* line */ 
            c_0x8f48945a(0x68ad2a2818d2151056e282a5717d7961fff7e4f01c7f1fc318466255351c0a35); /* statement */ 
suitedEffectStatistics = specialEffectsRank0;
        } else {c_0x8f48945a(0x41f2dfae2708a739be7079eca53cd07f0c26c863d6ac3ee828956960ae250d94); /* statement */ 
c_0x8f48945a(0xd8efb4f093bb4ee5b0e62e3b5a6541b111bb624b78a260469236df9ef40a41ff); /* branch */ 
if (rank == 1) {c_0x8f48945a(0xaf262c7b526ac6bcec58c03035bf088574ed108d887e6b97c79bdee250534e85); /* branch */ 

c_0x8f48945a(0xeb233ebcd1af104d7d8cd19c07af88076f6d7bef367b8cc0f37ef93e1432ab2f); /* line */ 
            c_0x8f48945a(0x1a77bda2e1c9c2e3b433c8ee9c7a4b8a953af28d04dc18d765d7ecd7c352f48c); /* statement */ 
suitedEffectStatistics = specialEffectsRank1;
        } else {c_0x8f48945a(0x48d3baeaca9c1db60421978e12bb72f289766dc48438ab293a5f709dff12d7be); /* statement */ 
c_0x8f48945a(0xdc16311c17e62be66c197716a0c250c7af9492a8e49076731e9b4e94d2cf139d); /* branch */ 
if (rank == 2) {c_0x8f48945a(0x2ebfba8087246931d2a91738dd087f24e7dead07a7b898abceca4cf91b988413); /* branch */ 

c_0x8f48945a(0x2a9ba0e3b865463fdfe09d9944a1aa66c6c22949cf9f69554ad856cbe308ee45); /* line */ 
            c_0x8f48945a(0xdeca336e6e5e0a66d5289f1ee45ca42a034612046f21c603491dc2467889060c); /* statement */ 
suitedEffectStatistics = specialEffectsRank2;
        } else {c_0x8f48945a(0x8ecc51c0d105730bed4ae21d01b39c488c34a97f66ff1dbbc12f8765de8c77a6); /* statement */ 
c_0x8f48945a(0xcaa37489b738a8fd78a7934bde824f60fbf96068b36640521c4500efea9d25db); /* branch */ 
if (rank == 3) {c_0x8f48945a(0x383131f73e94bcf19ff97f03df2ab51435112d17903c800329a77c21adff818f); /* branch */ 

c_0x8f48945a(0x016fe5f86aae272300b8f13842b6d9cde77bd3a9361331638a08144d91f5041e); /* line */ 
            c_0x8f48945a(0xe46a691941569085a32a0f1a500c1031c89209faaf7a625b13237c4682ff69da); /* statement */ 
suitedEffectStatistics = specialEffectsRank3;
        } else {c_0x8f48945a(0xaf4d03020167b8aebb3eb3bf4aaed5b23a89cf9f8edbf50e31708f73f1317513); /* branch */ 

c_0x8f48945a(0x2912f3de780922cfc3bfe3c3171299688f12e5bd368062b7b1f43dad0ef162c5); /* line */ 
            c_0x8f48945a(0x61e6e4cf7eec7e73ef86021cb4edebd7f9128a6f2a0ad679f68a17ed44cf6563); /* statement */ 
suitedEffectStatistics = specialEffectsVIP;
        }}}}
c_0x8f48945a(0x7b19498a54a7089e06b0b72884e4fa82a97bb652cc937e44b77c17ceb88599db); /* line */ 
        c_0x8f48945a(0xd5f415243d974059c10f95fcf5f156c5a2bdd5d8d790663b28298a8d7cd1149b); /* statement */ 
for (uint32 i = 0; i < suitedEffectStatistics.length; i++) {
c_0x8f48945a(0x4c8afde75714eb142b62275a3198cf80ed717b4aa004cd9657bd78fc349c34cd); /* line */ 
            c_0x8f48945a(0x76d28cc4591b4ad18d6c3938b8381c2e7823afe1f4d990ca942a6ab4e3557964); /* statement */ 
if (n < suitedEffectStatistics[i]) {c_0x8f48945a(0xbb8e37e8c2beffbeb8dc6510ee0d5a5b2752127a5fe7b198b6d06705b69a548c); /* branch */ 

c_0x8f48945a(0x16fdab772ed1dc02bb23776354ab315f5c8e4ac85e63fed7f3ba4219a56bf188); /* line */ 
                c_0x8f48945a(0xd8217bfc5f4de5507d152fc5fcf2c065d7540929cf1d305dc4f9ae5db6ae9d55); /* statement */ 
return i;
            }else { c_0x8f48945a(0x26659ace1fd434dc31136ba266e900170e8a2ffea3d81914812c6ef99ffc823b); /* branch */ 
}
        }
    }
}
