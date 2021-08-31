//SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0xb2d838aa(bytes32 c__0xb2d838aa) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../gsn/RelayRecipient.sol";

/** @title Planter contract */
contract Planter is Initializable, RelayRecipient {
function c_0x8967a34f(bytes32 c__0x8967a34f) public pure {}

    using SafeCastUpgradeable for uint256;

    /** NOTE {isPlanter} set inside the initialize to {true} */
    bool public isPlanter;

    IAccessRestriction public accessRestriction;

    struct PlanterData {
        uint8 planterType;
        uint8 status;
        uint16 countryCode;
        uint32 score;
        uint32 capacity;
        uint32 plantedCount;
        uint64 longitude;
        uint64 latitude;
    }

    /** NOTE mapping of planterAddress to PlanterData */
    mapping(address => PlanterData) public planters;

    /** NOTE mapping of planterAddress to address of refferedBy */
    mapping(address => address) public refferedBy;

    /** NOTE mapping of planterAddress to organizationAddress that planter is member of it */
    mapping(address => address) public memberOf;

    /** NOTE mapping of organizationAddress to mapping of planterAddress to portionValue */
    mapping(address => mapping(address => uint256)) public organizationRules;

    event PlanterJoin(address planterId);
    event OrganizationJoin(address organizationId);
    event PlanterUpdated(address planterId);
    event AcceptedByOrganization(address planterId);
    event RejectedByOrganization(address planterId);
    event PortionUpdated(address planterId);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x8967a34f(0xeb9d0dd00a8421ea81a359e83892b7fd9156073eabe24af40bb0b58c281bb593); /* function */ 

c_0x8967a34f(0xe2342833ecf1acb2957d841457aa7d97233c6af16d87ef810503c65134f50d51); /* line */ 
        c_0x8967a34f(0x8021cfd7fe9c37a661e0bd0d93da5c034dfc98bfc8bbfdba35a54aef7e9c6de9); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0x8967a34f(0x5016a7af825942d0ca5c66027096c1b4cd7b9752beff07db604b68cf1a507fe5); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0x8967a34f(0xa386fe903e0585a9e73ed9a53545f3758a36c128788932cb6b37e7152528d16e); /* function */ 

c_0x8967a34f(0xef7da4c9123733cb23e3dac0e55bd99b4d9213bbbda761afc0359085c0804ee8); /* line */ 
        c_0x8967a34f(0x4bb92b36047b886c38cac0bc0ce7d43a7078c48117c66a6daeb1ee47ba0531d5); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0x8967a34f(0xac97bb99f38eff6cf80fc7e9d9277eb95ba969ce97407867e7690dda876a6928); /* line */ 
        _;
    }

    /** NOTE modifier for check _planterAddress is exist*/
    modifier existPlanter(address _planterAddress) {c_0x8967a34f(0x1ff18dfca59e21735987b3addf1fe53b0b65bd5492b0f8429a08c32f54789af3); /* function */ 

c_0x8967a34f(0x5570f00d23e60c3d40ab6b27046efde1a19369b8c121374c143a8f4f326d4f36); /* line */ 
        c_0x8967a34f(0x67efbec4683ce4d5a8c1833c8924cc37bde68450ab6270de842d7df4a245aafe); /* requirePre */ 
c_0x8967a34f(0x609f5e404b09121f25a2749bdd459c8e55dfb1ac871c0fec4994858f81633427); /* statement */ 
require(
            planters[_planterAddress].planterType > 0,
            "planter does not exist"
        );c_0x8967a34f(0x81713bd6fc5176a3d18d12c118bfa9214a3a8ab76307accd4ea275e263689678); /* requirePost */ 

c_0x8967a34f(0x72a05d94c3cb7ebe36369dd3adbf6272720e7f1b05cb30ef595a6f607a521fe9); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x8967a34f(0x9d92442d54bf862d2797e3e675ef2a4c77183f7bb58bffc96b165ba3f52e2525); /* function */ 

c_0x8967a34f(0x69661f61495339df377077bc68c72c2523e2fa756d204ce02c1c8e7d4eb426ac); /* line */ 
        c_0x8967a34f(0xa7af1932ece72f0edc792a3abad0fcb2acb1cd29e8d05630d83f3af85d3c1135); /* requirePre */ 
c_0x8967a34f(0xee725099a1989305c7a6541a52d2c73470f7ab486117d0ed014fb520fa4f7a87); /* statement */ 
require(_address != address(0), "invalid address");c_0x8967a34f(0x4fbab3b3ec509a395d85d1ee4fb7875e4a6f5ae8b427849aecd1da33a4083b0b); /* requirePost */ 

c_0x8967a34f(0x80a019ff8dcdae14b0c452f5b94fabbae94084b250f7af629812bd30045e7a7f); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender planterType is organization*/
    modifier onlyOrganization() {c_0x8967a34f(0x122977523c46ce42e3f6fccadce005ccc9464e66c354a9069491704e7e4a8500); /* function */ 

c_0x8967a34f(0xa49ea10bd96443abd00d87e6a0498e4876b02ac4f2ec310986a87d4b13d0a22a); /* line */ 
        c_0x8967a34f(0x764d0d03fd379bed99d632903611b193dd4e0599177146896ea33e4defcc4202); /* requirePre */ 
c_0x8967a34f(0xca4772aaf0f4a5323382319a95c54d6f2dbc5e2dfd2a09815dc8a37795348356); /* statement */ 
require(
            planters[_msgSender()].planterType == 2,
            "Planter is not organization"
        );c_0x8967a34f(0xa22c4b735f2023e94c52592d06ee0b239baf33a6592496982bd1738419eaf3c0); /* requirePost */ 

c_0x8967a34f(0xd6d4fcf0356e3c8ce6e7f5397847ca478d1d05fa21ccf1593e225699348e3a9f); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier onlyTreejerContract() {c_0x8967a34f(0xd1eb6ff6029a684fab515b5a66231fa63aa2806b284f307d2c522148dddd66fe); /* function */ 

c_0x8967a34f(0xb27b52f5da05e8ab6b1e048385d8fe9e8566af1646fb0626f1fd83be8db83ac1); /* line */ 
        c_0x8967a34f(0xb6d42af2884fe2664936e88e92618fb6ecf6dab5ec241f537b35e75a4736e3e5); /* statement */ 
accessRestriction.ifTreejerContract(_msgSender());
c_0x8967a34f(0x2ff24a1fa492c440a68c8bc8d0dcc939b494523d0c4bf71db7bf2325e0e25580); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isPlanter
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0x8967a34f(0x555e35aa1f1d149c8158dab22d4ce3ba431e82d1a13f8a0ed281d721573441c2); /* function */ 

c_0x8967a34f(0xa5b330df22ba794219ca6fcfb88869dc3468f8c7c309bd22647f606209cf8cc3); /* line */ 
        c_0x8967a34f(0x6f46cc4eae3ef1e31854b9e962452c6c0e38872428fbf65cb1f226902ff101ff); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0x8967a34f(0x09fb77b2877286644e7bb195d218ee10bc533f0961921069022d54db4d24f908); /* line */ 
        c_0x8967a34f(0x8a0d45d69cc9f4f6c12820954fcffe0f50d9c01e076437acef31dc77d7acd875); /* requirePre */ 
c_0x8967a34f(0x1d3cc1cfae83ba1ddaf5fe8e1d52cbe934ff9b1cff90dd566f5cf1edf6b4a736); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x8967a34f(0xd4b604a8908609a6d5253f303e5fca4bea1ddbd2be2910a9bcd712059975d945); /* requirePost */ 

c_0x8967a34f(0x7a21327ba475115c10c611b70ea99aa0adf785d3e589bed857a5ccc3bedcdbbb); /* line */ 
        c_0x8967a34f(0xc5c43f0bded99cc00996d40a3b684a9bd4e50dbecc57e1dded3ab511cd4d66b2); /* statement */ 
isPlanter = true;
c_0x8967a34f(0x3821ce495287c567572419a3e858a572156677a9659359e8f1341d97ed7fd42f); /* line */ 
        c_0x8967a34f(0x687e312451508320cf026c12dcceba4032739379f41f35f2831848d41a8a7e5b); /* statement */ 
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
    {c_0x8967a34f(0xc0d001dedbc7da3142b36761c30b28a0b987cb734cfa0559632cc297bbd5e368); /* function */ 

c_0x8967a34f(0x29293abe6a09b34160f7a6d2b416a5978bac324bfe9203215b33bf3ff5358b37); /* line */ 
        c_0x8967a34f(0x8f93977dcf92f5c8587c5ee856fe455e8c7c2cb20cf059c992c0e162824615ab); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev based on {_planterType} a planter can join as individual planter or
     * member of an organization
     * @param _planterType 1 for individual and 3 for member of organization
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _refferedBy address of referral
     * @param _organizationAddress address of organization to be member of
     * NOTE if join as a member of an organization, when that organization
     * accept planter, planter status set to active
     */
    function planterJoin(
        uint8 _planterType,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        address _refferedBy,
        address _organizationAddress
    ) external {c_0x8967a34f(0xf1db9d6a086ed8e6a4071539403aa09ffbd4758981dd4395b483ace57eabcf5e); /* function */ 

c_0x8967a34f(0x0f42957d213d34913c271d9c2bb7d11262b44f72f71da0cca6b7e09d1e76283f); /* line */ 
        c_0x8967a34f(0xb8f4c18071db7ffdf6fc9ff2656f18436b7093738cbdee124f3be341606fd9fd); /* requirePre */ 
c_0x8967a34f(0xf8acfd510a15b420d0f0388c6eea02e999d38dcaab1ddb4d0ee532eead1d5af0); /* statement */ 
require(
            accessRestriction.isPlanter(_msgSender()) &&
                planters[_msgSender()].planterType == 0,
            "User exist or not planter"
        );c_0x8967a34f(0xdaf1f42acbf3dfe8e53a3fc7decebb3cb1f813176612b336e0e62e5fff1a4d89); /* requirePost */ 


c_0x8967a34f(0x2a5e7552c39f06cd4dbdd5575917f75d879ff91fe781a160079dc1b31da67804); /* line */ 
        c_0x8967a34f(0x93dc614768d75a0b9eb291fe74f109546a3d73ed03e860640d43795b21391101); /* requirePre */ 
c_0x8967a34f(0xf9e1c01ad321699c7422439ad8810633b70195b6c632e22fb736812a00e211e0); /* statement */ 
require(
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );c_0x8967a34f(0x18ec6ac6e61a3283d559e316bf4acc020e0c748b6393a066648e653c373add78); /* requirePost */ 


c_0x8967a34f(0x9f5946bca3d5f29da4b579ccf5fe61fe96a99b4e1862f8e535a0e6fb72469197); /* line */ 
        c_0x8967a34f(0x3bff1b3b465cfdb7bd24850f902fa3622e44399178f1a7685cfae1c3078ab73a); /* statement */ 
if (_planterType == 3) {c_0x8967a34f(0x065e63a475abd5d5344dbef089fd01ae69021d9a4938267c00e925434c80985c); /* branch */ 

c_0x8967a34f(0x8590aec994cee31914335f719e3553f3db128681a0d6e6098545ac6772d6132a); /* line */ 
            c_0x8967a34f(0x5695b985a9837af8fd4c29b768b850044c876fc6f7ac0e2183b86fb84b006315); /* requirePre */ 
c_0x8967a34f(0xcb196ea701712d608e2fc7930ede1c2a9a7c2001454571974b07b726be305556); /* statement */ 
require(
                planters[_organizationAddress].planterType == 2,
                "organization address not valid"
            );c_0x8967a34f(0x38ac53de941801b7b06bd9e71ba41b84c032b313b3a1a1686bbaf70aab67d0ef); /* requirePost */ 

        }else { c_0x8967a34f(0x1a774b56986c00a5d4ed581da8650f5964d90cd7a53dc1fa03cd31d0947e7e85); /* branch */ 
}

c_0x8967a34f(0x734aac6a00f1e4cb5a5b8115cc99b5a5704b560fdb07662221d3f18b85b35572); /* line */ 
        c_0x8967a34f(0x8f56fbad5c0a50978154806cdd95dde66bc61ba1371fd686a733d5b61c8c7b50); /* statement */ 
if (_refferedBy != address(0)) {c_0x8967a34f(0xf7f6fecb7872e4ee36cc141e0f3e085308b5d0376cfaaba4e25efcad62fe17fc); /* branch */ 

c_0x8967a34f(0x9314d1192d1304074196054dfdb88e555cb2477001b5a61c373026ba080851e4); /* line */ 
            c_0x8967a34f(0x77de5cb42f37b7d08219cb86eaafe9036d9253e66fa9ba8a9d2effb3d595abe5); /* requirePre */ 
c_0x8967a34f(0x80e5fba79bcd33d1376371dc190730a382e077a9e37bdc48e2d8f4f087157976); /* statement */ 
require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );c_0x8967a34f(0x5d301f8a41c63a1ed0be3688ceafa07bb2c5a811b6c457e2544beb719e073ef4); /* requirePost */ 


c_0x8967a34f(0x3795e7ea326ecd5a9d429137c4d94e96365c3a9b736104c29687796eaca59e6c); /* line */ 
            c_0x8967a34f(0xa40cf9212a1b7ebc1ee91b4c94388aa30a3a0a69299e400563d9344e3aed1820); /* statement */ 
refferedBy[_msgSender()] = _refferedBy;
        }else { c_0x8967a34f(0xc12f473fcbb243336355396b3dcba5d8bcc63119a190be1ef3b31ccd29a10c71); /* branch */ 
}

c_0x8967a34f(0xc012b0e4bb5f4a2743e5e54f90be8cf07dba53f2b2d7a69d0efde6ce63d8cecc); /* line */ 
        c_0x8967a34f(0x13d9d897b9fd24ba645b29a46ac28e62eb35edbcf6f34a9c5bb766d133ff8ed7); /* statement */ 
uint8 status = 1;

c_0x8967a34f(0xe1516b04294d4d6afeb3b15b55ba84b6da0d531fc6b1040846b6ba958de68edc); /* line */ 
        c_0x8967a34f(0xac3b76c122890f4712d31689a93b1338e775e934d350fb59f0094410ae7de8c0); /* statement */ 
if (_planterType == 3) {c_0x8967a34f(0x2c53ac7ecd113d9b7cf8d276e7086d0476ae013429b7f0826dabb14edb267861); /* branch */ 

c_0x8967a34f(0xc5f0b7ebd42e9f1ca64a78ebeb4cb70227ab545b3b41cc9aef2b4cc91bff51f0); /* line */ 
            c_0x8967a34f(0x73fa5213f1eee11b557446dee82aaceb770eab029117338a68f5f3893f16c68d); /* statement */ 
memberOf[_msgSender()] = _organizationAddress;
c_0x8967a34f(0x7ea285927c141f00951483cead6479cfb3d2af2912e2da5d032daaac9b30c7f9); /* line */ 
            c_0x8967a34f(0x732deabccc2fc1239a4b0cb02eba89624c0ec54740d6d857819347b08c9231bf); /* statement */ 
status = 0;
        }else { c_0x8967a34f(0xe2dcda266e2840c80364eea3da230f857c4f6e0e023ebed30e61782efd55bad0); /* branch */ 
}

c_0x8967a34f(0x60fce933361665b293febe0bce128a07ff2b0091f903b44f52e4e60a43c3ed14); /* line */ 
        c_0x8967a34f(0xec1c5cba964645f5c2aad42274da55a0e3298932b751c4d37d672e8905b976b6); /* statement */ 
PlanterData storage planter = planters[_msgSender()];

c_0x8967a34f(0x51265f1890808029b484ee1aaeb911b9b786d6b00db21cfbce641162a353dd1a); /* line */ 
        c_0x8967a34f(0xd552432f49241d81f8745a01040c9fd3bc0e899c29dc414062939b0055ba022b); /* statement */ 
planter.planterType = _planterType;
c_0x8967a34f(0x5d5295af4742345732df7906e8cde8e4eb1f60bdffc1bf7565f2da8b0b2e48c2); /* line */ 
        c_0x8967a34f(0x0044f8713d84302c227202c3c68f275f69b4feb3a7b296254ce8d083c5bcf856); /* statement */ 
planter.status = status;
c_0x8967a34f(0x0e7c248b3648562b8ce29970f6a53602f832af1f85001d8572db72329b65e9e6); /* line */ 
        c_0x8967a34f(0x6a78ec3885b3274ae380bd445559640e5f2e474b57349dc650682f60bb535c53); /* statement */ 
planter.countryCode = _countryCode;
c_0x8967a34f(0x612c852a25971349d6db2b168433a0ceec90a5a79a547d9940559f6c5e35d79c); /* line */ 
        c_0x8967a34f(0xadc36bcfccdc4cc07ab55ece0611fed63737ecb17af2780b00256b7407159ba9); /* statement */ 
planter.capacity = 100;
c_0x8967a34f(0xf078ac0ad4619799595102525d96d5081fc3d92156fb6ad8f08a9fb604219412); /* line */ 
        c_0x8967a34f(0x519885a365204abe20a0cdd85e0833d272f87febe01074a408914c1287be293a); /* statement */ 
planter.longitude = _longitude;
c_0x8967a34f(0xd1d3a7c1ee5702ae8b7e8465449a70a3371e73ee7bf5b101cea84860c477c70e); /* line */ 
        c_0x8967a34f(0xdd1c6983beb4070950bf5154b50a88ff997223949725441b1b7eea3eec7a12ca); /* statement */ 
planter.latitude = _latitude;

c_0x8967a34f(0x52066b8e8b8d6432e4984cbea796be0010831cd0aee1be90666b760319627477); /* line */ 
        c_0x8967a34f(0x07ad61a2cdfc20fe331790359b8d0b2608087a8f4d40b397755e9b29309a29ff); /* statement */ 
emit PlanterJoin(_msgSender());
    }

    /**
     * @dev admin add a plater as organization (planterType 2) so planterType 3
     * can be member of these planters.
     * @param _organizationAddress address of organization planter
     * @param _longitude longitude value
     * @param _latitude latitude value
     * @param _countryCode country code
     * @param _capacity plant capacity of organization planter
     * @param _refferedBy address of referral
     */
    function organizationJoin(
        address _organizationAddress,
        uint64 _longitude,
        uint64 _latitude,
        uint16 _countryCode,
        uint32 _capacity,
        address _refferedBy
    ) external onlyDataManager {c_0x8967a34f(0xb2261625961d63b4cde1e737b7bb2602a9c96bbdd229b217c02f6ea7184d630f); /* function */ 

c_0x8967a34f(0x9da0777bed00eefe0453badc9a713b5fb01e57b890f1b8bc03c9cb8f38613418); /* line */ 
        c_0x8967a34f(0x7c83ed0876f0539aee8336e28f98900d7cbcb12caa1d0b4743464d2498129dca); /* requirePre */ 
c_0x8967a34f(0x212301b2ce292b03e0f5775f346964a44e75d42176892edd1b31dfde27560910); /* statement */ 
require(
            planters[_organizationAddress].planterType == 0 &&
                accessRestriction.isPlanter(_organizationAddress),
            "User exist or not planter"
        );c_0x8967a34f(0xe2d964cd0e51352d19c55771fdea2465f47953e01a5fca3fb01eaf77b552f050); /* requirePost */ 


c_0x8967a34f(0xaf2417461a9044e3033a9e68289db2452ca34c6de8cc04b3eca2909862c4bd65); /* line */ 
        c_0x8967a34f(0x6f29e6744689150845087e8e86d7dde29fbbd63a766ebbc22a8ef162df25dbd7); /* statement */ 
if (_refferedBy != address(0)) {c_0x8967a34f(0x132160a1b2efe211088144b7d2f6e4fd1a75f0784426ee1549133bcddd150199); /* branch */ 

c_0x8967a34f(0x27b314e3628f86d2ff78488bf40b18cbf023d1e7096a073bb4a7ce15374e49a1); /* line */ 
            c_0x8967a34f(0x3c0ba85b631d53fd21562819f526fc7feece49d43ce62a90b16a3d238c7ad034); /* requirePre */ 
c_0x8967a34f(0x6ff06056e4e48c7856033e042ab40cd74cb376e97a62eadccb2cf509cb8f01b0); /* statement */ 
require(
                _refferedBy != _msgSender() &&
                    accessRestriction.isPlanter(_refferedBy),
                "refferedBy not true"
            );c_0x8967a34f(0x5ea2384f387cd9f7b78793e799a17b5165e8b30e62ee3d7c104e0510f7276f90); /* requirePost */ 


c_0x8967a34f(0xd9cb965792f4eaf376420e3314b220f34f661579dd6e8f56ef5cab060206c15b); /* line */ 
            c_0x8967a34f(0x6914a347963e192850c4759b362870b278cb0d23b737a220fe8772f4d3ce61de); /* statement */ 
refferedBy[_organizationAddress] = _refferedBy;
        }else { c_0x8967a34f(0xbfc9096adfef07854a49ee5c927f5f68f8d0db78292d023ac4442e78225543d6); /* branch */ 
}

c_0x8967a34f(0x87af2a9efbb55a61aa165ec5ae048d6927827d397f39373b748e0531cb08515f); /* line */ 
        c_0x8967a34f(0x50e4c6d2238547b28d531c73dba16fab28706da7479215f6b8d56ea945a5765a); /* statement */ 
PlanterData storage planter = planters[_organizationAddress];

c_0x8967a34f(0xdc1ba560b19e8dcbd3828e3a2d5444af17584662882db5aec0a8547d9f540f8f); /* line */ 
        c_0x8967a34f(0xb0861da263712cbad905b9dd69b734a8465180a47dad3081c9871d3b0a88a4e7); /* statement */ 
planter.planterType = 2;
c_0x8967a34f(0x470eb71b3b14cbf66f60e2704cf8db416aca4133704a49bbd0bbfffd50ae7ce9); /* line */ 
        c_0x8967a34f(0x90a3299463122f4f0c312ae29305794b2250b5d50be48ca4f81ac76773b5ac63); /* statement */ 
planter.status = 1;
c_0x8967a34f(0x71ad96c5fb33cfc9c4117303c89cb4fa9b09afeade4328aae6a015c5bdfe53cb); /* line */ 
        c_0x8967a34f(0xde6d1441c17caf1c17ce854971ec5775c0dbcda4c23e6f0ce4fc51db74c86577); /* statement */ 
planter.countryCode = _countryCode;
c_0x8967a34f(0x94fa12bf9a48431d8698d586efbf862d054f4f07db031271e61f47aea6bb2be4); /* line */ 
        c_0x8967a34f(0xea22ee36e94eef0ac9dbe1642bc69b6a21a4ad46ff40ceefa1c9e9be0354b199); /* statement */ 
planter.capacity = _capacity;
c_0x8967a34f(0xcaaa51a98b79feb37aac960f6e8b3839bd94e80cf057faf242ac4849334511ec); /* line */ 
        c_0x8967a34f(0x5ebb54ef55d18959adc60e9958b6370d1a3f381e963b463fc4381b7d533f0cf6); /* statement */ 
planter.longitude = _longitude;
c_0x8967a34f(0xaf7d07bd41f927e6f8c00cd64a6550c66423dec0853e715d67ae2b1986dc2e2d); /* line */ 
        c_0x8967a34f(0x698ce4485e9702119376cc5375561c54f1a031dcf56bf2edac48016b3c0e5894); /* statement */ 
planter.latitude = _latitude;

c_0x8967a34f(0x035510fefa84431184faf3c421eb2d5ec6650d9e2c89761d36a593d43aa1e60d); /* line */ 
        c_0x8967a34f(0x45fcb601e73e78a3748e4424c5d3e1637ceffaa51bfd71f1c598153bb60c3d99); /* statement */ 
emit OrganizationJoin(_organizationAddress);
    }

    //TODO:remove this function??

    /**
     * @dev planter with type 1 , 3 can update their planterType using this
     * function.
     * planterType 3 (member of organization) can change to
     * planterType 1 (individual planter) with input value {_planterType}
     * of 1 and zeroAddress as {_organizationAddress}
     * or choose other organization to be member of with
     * input value {_planterType} of 3 and {_organizationAddress}.
     * planterType 1 can only change to planterType 3 with input value
     * {_planterAddress} of 3 and {_organizationAddress}
     * if planter type 3 choose another oraganization
     * or planterType 1 chage to planterType 3, they must be accepted by the
     * organization to be an active planter
     */
    function updatePlanterType(uint8 _planterType, address _organizationAddress)
        external
        existPlanter(_msgSender())
    {c_0x8967a34f(0x231b73caec69ebcc33686d2a952a78335c7a1fb624bb72068673adb3ff49bf8c); /* function */ 

c_0x8967a34f(0x845164603f48060516510c03cae40752dbfafcdf965f4c84f70071d0b3337b35); /* line */ 
        c_0x8967a34f(0x95e099d5b534b7fab8d668fd8dbb175d8364db7e2326db7d6561669f0f1ca628); /* requirePre */ 
c_0x8967a34f(0x3aec6bae77ef8f6a4fb499be892c162c269cb887a3e372c258bbd049f71a1f8a); /* statement */ 
require(
            _planterType == 1 || _planterType == 3,
            "planterType not allowed values"
        );c_0x8967a34f(0x6a7bede875714f9e08a9b93f9dbb99a6e8b201f1362a8c4f4ed1774796ad41a0); /* requirePost */ 


c_0x8967a34f(0xa66a774df4e172c7b22fbf39cdc2e326eaf84c1cb25f2113bca9df49160e83c5); /* line */ 
        c_0x8967a34f(0x4f8b97e2be7aba93147ffa1e704a29f694ae9cdcf406207f6b2e1f6a6fa6cb98); /* statement */ 
PlanterData storage planter = planters[_msgSender()];

c_0x8967a34f(0x5c5876bc4572e8e9a4788502e2b94bcf4363e4264b65fbe4f8d924850b04dcf5); /* line */ 
        c_0x8967a34f(0x58f45fe2ecbf56d3ed723c5022f3b3fc95d260235c2ac843e35dd932c6cc3d7d); /* requirePre */ 
c_0x8967a34f(0x1878b6076d6adea9ec5cb7f9dcdf368a1bde219b6e1bc5fee50f27190271993c); /* statement */ 
require(
            planter.status == 0 || planter.status == 1,
            "invalid planter status"
        );c_0x8967a34f(0xa66d4fdd1f6409e601c79c1e343be514307ca166c041d59ca1e1cc14d949b4a6); /* requirePost */ 


c_0x8967a34f(0x03fd0805659f810c3ba196b488c86ef0bef05eb41bc26760544fd3a633a75bd9); /* line */ 
        c_0x8967a34f(0xcaa0b6fcba7dca0dfeadf2cac7b617a1596ebc5ed6103a9612cac49c7c62ee89); /* requirePre */ 
c_0x8967a34f(0xa270494f1fb34aaaa1a0ec9d19202fe684e6e7101c89486ae0ae3b5f9babcb96); /* statement */ 
require(planter.planterType != 2, "Caller is organizationPlanter");c_0x8967a34f(0x3b7d342254f237a13652cc0b620151e65b4ae49e0d550098df1e61eefc78609e); /* requirePost */ 


c_0x8967a34f(0x33a9174acd385a8251f173e98d5f1ebe6811d2fdf13340b7ed9c325a244aa72a); /* line */ 
        c_0x8967a34f(0x03fdb5e0f8d70edabaeda1c094f0b956767a35e1d3f4e84fafdcafc008c2300f); /* statement */ 
if (_planterType == 3) {c_0x8967a34f(0x019342d2aacd0129327a7c61eee6bb17de84fc885373f0cc3f5a170435d90589); /* branch */ 

c_0x8967a34f(0x72dad79141c48494c149b7249d3a96249cae93f19528a0f38dee502faefc282f); /* line */ 
            c_0x8967a34f(0x579b4a75fccb6a342918cf1add4ceaa43e42fd7f94069734f04750a52bd32063); /* requirePre */ 
c_0x8967a34f(0xb2210cd79cd9ca056054cbaacbf3ccd780626d85e22ffdbcde26f32047b8fb09); /* statement */ 
require(
                planters[_organizationAddress].planterType == 2,
                "organization address not valid"
            );c_0x8967a34f(0xd24b056c6fdf59eeb334a9633e903d4b3204bde0649a7425f9d5d6658a6de2c2); /* requirePost */ 


c_0x8967a34f(0xb604ab367393f0327c4fc2506fdda22b46e48a23e51d88f5be57290c1349f3f8); /* line */ 
            c_0x8967a34f(0xf7c54b0a866465b8e151682eec4293a6d69d3bced5418c1ca83b918b67b9803b); /* statement */ 
memberOf[_msgSender()] = _organizationAddress;

c_0x8967a34f(0x33f043efe4622cf3968c7626fdbed5ee6f899c05b7f761f61bd707752bed62ee); /* line */ 
            c_0x8967a34f(0xc6c2ae55132eccf590f05cad34168b7baa5d21b9f785ff535feea70c5d3e3979); /* statement */ 
planter.status = 0;
        } else {c_0x8967a34f(0x210155bc68c4e8fdf62222cbf8d5ad42749f271adb96052549807fd715c5acbb); /* branch */ 

c_0x8967a34f(0x13a93305eccf1a5fd5b76ec2065ae588770eadfda52c175ea35e4136f6d8b3c9); /* line */ 
            c_0x8967a34f(0x73a134c69950c7d1075df5485e31e10556f2c400a772a043097f415418e4a6a7); /* requirePre */ 
c_0x8967a34f(0x26ff2823caabaecd8c1f770dadc898ea4cf73a6f59a8a73b3701fef19dc9030d); /* statement */ 
require(planter.planterType == 3, "invalid planterType in change");c_0x8967a34f(0x97e26b991f886f9363a8402af87e3f78f4785059501d355ac64f7e1f9e28758b); /* requirePost */ 


c_0x8967a34f(0x14906152d5198af214abe77eba07a3ecccf29ee7fe11493276b820d85a5bbba4); /* line */ 
            c_0x8967a34f(0x15a5f3174be810a0212312e1ee163a2531db92a5bc91258270ce00a6a7453a2a); /* statement */ 
if (planter.planterType == 3) {c_0x8967a34f(0xebadb982f8ec62336e882f2d37acf88d104d1623aa7ab1d4802335e2203c8ffa); /* branch */ 

c_0x8967a34f(0x918ee4407f49992b493b1f68626d626f97c2f607ecafd375cac0545e1053b2b4); /* line */ 
                c_0x8967a34f(0x3b4f35f2336ae037155c02b827f5d23df1b2e87c713e9af0a9082ef327a8e45d); /* statement */ 
memberOf[_msgSender()] = address(0);
            }else { c_0x8967a34f(0xc4a5e1e640f46d4b567cde2428b3944455ca1847f8dbeadfc4fe27ec02cf7ba3); /* branch */ 
}

c_0x8967a34f(0x324c8788e9417db0f80c2962c9e36eda31cda1f8dff47dd1fe96f9707076ca94); /* line */ 
            c_0x8967a34f(0x41313df232c2cbdd3cd6410673aa04962e42f07a665f77ccd3c93051f2820142); /* statement */ 
if (planter.status == 0) {c_0x8967a34f(0x968aee6b95d67e6184e42efea3458c442e09d30ee57ed6d61c3a046c3cb93ec9); /* branch */ 

c_0x8967a34f(0xfd4217a2958fa806e34c3e4e10cecb0abb7569d0bfdbf5c452e246975ce3955a); /* line */ 
                c_0x8967a34f(0x8dc77aec593522c5ba57005be6c0a686a5cf2ad97622612cc6135902adc6d61b); /* statement */ 
planter.status = 1;
            }else { c_0x8967a34f(0x22a502cf58ffabfe73eadf1579badd389051f682774d16f1a205f83d2da75f97); /* branch */ 
}
        }

c_0x8967a34f(0x607e81ffe0d67da726fa3aab539e32b58c92b7ebd0371626c56b54ced5531512); /* line */ 
        c_0x8967a34f(0xc7470c5f7a9bd09ae9078ffb54f706380c00a5c108fc6506000b9e82f3fbc9a1); /* statement */ 
planter.planterType = _planterType;

c_0x8967a34f(0x016104d2600bcfcda16dd3170b2b89f9924dfc91f7a774fe8e883eb22b195b47); /* line */ 
        c_0x8967a34f(0x091617b049432597469fdd334655b987fa7518ea5a620cef1e0dd62b1a874c8e); /* statement */ 
emit PlanterUpdated(_msgSender());
    }

    /** @dev organization can accept planter to be it's member or reject
     * @param _planterAddress address of planter
     * @param _acceptance accept or reject
     */
    function acceptPlanterFromOrganization(
        address _planterAddress,
        bool _acceptance
    ) external onlyOrganization existPlanter(_planterAddress) {c_0x8967a34f(0xec29926a99283e52b922e890d70c3c87f9c187d8b41f155542e74ba7c729321c); /* function */ 

c_0x8967a34f(0xb7ece4cc4402d4fc63c336229837ef370cad295265c2d557ff19358712b92f8b); /* line */ 
        c_0x8967a34f(0xdae0b60dbbb59b9e6b02891ae2b5c121fc0428e25755672ecc4d7cf74f4fb309); /* requirePre */ 
c_0x8967a34f(0x78ce2775cc9c81f5bb06a6672c079ea7172549b88f5b8130340d85d34656c01d); /* statement */ 
require(
            memberOf[_planterAddress] == _msgSender() &&
                planters[_planterAddress].status == 0,
            "Planter not request or not pending"
        );c_0x8967a34f(0x5a5e15cba67e80a4e53feabb07f9cbe94d3d735dca3eb49a35433ad5911ea17c); /* requirePost */ 


c_0x8967a34f(0x0c112d89f194f555bb2f54ee8f1ca6eb91b1c17f090ea02b48eff3a4192a609d); /* line */ 
        c_0x8967a34f(0x4a67ccdcd7ad00c9e24c1bb4abe0f59dd2c33b8f0aaccc74c69fb35b0f5d2a89); /* statement */ 
PlanterData storage planter = planters[_planterAddress];

c_0x8967a34f(0x50fa8115a4fc050e624625888f1c206490573a67794e834282914c67bfbdc94e); /* line */ 
        c_0x8967a34f(0x32fb40e27d48c7ccddc6c047cbb159789d18e169c36f0aa1463e8072799b8d4a); /* statement */ 
if (_acceptance) {c_0x8967a34f(0x84862d97962d386c1cbf6c23eece695b87ab969cdc9b6b871e2e39a10f93c758); /* branch */ 

c_0x8967a34f(0xed284989734772dac9ed243b48a3cd70715ecaa2919dcaf668b63a32464b63d4); /* line */ 
            c_0x8967a34f(0x651694c09bbdfcb045ca03bdfd68c9451a25b18bbacec4aa6eece2f476625aec); /* statement */ 
planter.status = 1;

c_0x8967a34f(0x49e50820b7f247eed910bfff43511845712904fa2c0ffb8f36eb7df827ab01b3); /* line */ 
            c_0x8967a34f(0x836b7817ff9d7e79a0d4e52ec22d7506fbc1bd8a5c638a6b898f1e829ee661da); /* statement */ 
emit AcceptedByOrganization(_planterAddress);
        } else {c_0x8967a34f(0x530a7bf5305d81ebab82243510d4f45c60220d799492964bb04e1a09dda04f39); /* branch */ 

c_0x8967a34f(0x0b0bd6d44b5e64cfa1db503acd61bd10f9c05d4b4a890bfd87b8bc4415e6b4fa); /* line */ 
            c_0x8967a34f(0xf97d821a371d50de3122c270c1bbbbbc4327b872be5812fbc942d1c0dc09caf2); /* statement */ 
planter.status = 1;
c_0x8967a34f(0xc8533538c5146542bdb4bf4ec331d07cf6b71532322789b48c35fe395b817ea4); /* line */ 
            c_0x8967a34f(0xe690544676c47a442c7b9d304f626592e60c8b1e3c35c4100cb288b487742138); /* statement */ 
planter.planterType = 1;
c_0x8967a34f(0xf143bb3196ead42d663da28bac0a7a25c1569ed508b88fd0eea6ee92c8a7bd0a); /* line */ 
            c_0x8967a34f(0xdd3f392b4e6378f43ef7c552bf7ae5051189dfccbc8394491dd41ca8a395f0b0); /* statement */ 
memberOf[_planterAddress] = address(0);

c_0x8967a34f(0xe729f603296c01e837bb44e2743f4b3b8fb2a3bdb0b2b0bab30f58de8123ea2f); /* line */ 
            c_0x8967a34f(0x9ecde7ef3123396e40c73111166ddaaf01ad855f085e6b5ccaa47c78eb90761e); /* statement */ 
emit RejectedByOrganization(_planterAddress);
        }
    }

    /** @dev admin update capacity of planter {_planterAddress}
     * @param _planterAddress address of planter to update capacity
     * @param _capacity capacity that set to planter capacity
     */
    function updateCapacity(address _planterAddress, uint32 _capacity)
        external
        onlyDataManager
        existPlanter(_planterAddress)
    {c_0x8967a34f(0xa2596d73843a68a2329bc7d531bda00865672b62efdab20184cf7687928609a0); /* function */ 

c_0x8967a34f(0x134bf6c9e1bdd558db1d5e2dbfefb1cc3a0f7778174415dcfc2003d2d8115670); /* line */ 
        c_0x8967a34f(0x0004097e3eae284383756122dbc3e124155cd7c72f955307da73ba5a30fb1656); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];
c_0x8967a34f(0x7dce792d12cdb00806afcb55f4ce3f49ff907ad4f0ccd4b7a70b2e98aa5ae54c); /* line */ 
        c_0x8967a34f(0x33d062230d9b1422c3d82dc2f69c666770e4aa4f4f31acfb610338d12009aa3d); /* requirePre */ 
c_0x8967a34f(0xf734a356e191e7d2a3f2139a4a501a26b2f7ec8cba7e4e0c5d010252079d772a); /* statement */ 
require(_capacity > tempPlanter.plantedCount, "invalid capacity");c_0x8967a34f(0x340fc354e0bbcd3ea58a9060ea911a608a675129e16c8ff65b93e66339450636); /* requirePost */ 

c_0x8967a34f(0x1961a339a0522c482eb429974c9a9b8bf9d54eb94afb7a042ffbd9e69ece39a0); /* line */ 
        c_0x8967a34f(0xe8a0e064699a1b93aa987b7cbfa9dbf6183050d62050edb1fe37997af9169cfb); /* statement */ 
tempPlanter.capacity = _capacity;
c_0x8967a34f(0xe9f562007c998bfecbb9b3a3a477ad5514c1a34e555a79da1032cca13dec1422); /* line */ 
        c_0x8967a34f(0x9d0227ce9a05c0d92f145af9984e2e255fc504a8518fb4b57fc63cf352addf69); /* statement */ 
if (tempPlanter.status == 2) {c_0x8967a34f(0xbce9a71c7aa69fca2bd978ab0cb490d2a525846f3519d0e73afd3e90692da5a8); /* branch */ 

c_0x8967a34f(0x2acb0ac3f5959992c9ef809fccb342581a0ed470ac1cff9f23558301971a4b05); /* line */ 
            c_0x8967a34f(0x15491db1d38b17ffed8d567a6e845500755f7b277af3cd5bac486e6f9d2aa9f7); /* statement */ 
tempPlanter.status = 1;
        }else { c_0x8967a34f(0x5ce6378c6b3a869b898624395e3c373ee6d84fb4094e097bd9852ca56503b057); /* branch */ 
}
c_0x8967a34f(0xbd3402490333347e80744d7d92bad783cf96f92df48d83ad70ac623e1949193d); /* line */ 
        c_0x8967a34f(0xaaffd25547735f6c06106994c74f38dd0eea209719da0723f00e345fb115b90b); /* statement */ 
emit PlanterUpdated(_planterAddress);
    }

    /** @dev return if a planter can plant a tree and increase planter plantedCount 1 time.
     * @param _planterAddress address of planter who want to plant tree
     * @param _assignedPlanterAddress address of planter that tree assigned to
     * @return if a planter can plant a tree or not
     */
    function plantingPermission(
        address _planterAddress,
        address _assignedPlanterAddress
    ) external onlyTreejerContract returns (bool) {c_0x8967a34f(0xeda3dfb06bd33b5a6d7e22544c83d0abf9eb211d302f06a9005ae6ef703f4e60); /* function */ 

c_0x8967a34f(0x2c43785cd2a38c34b4dfa238ec481edb71e21f083e9fb8112693c4d651cf624c); /* line */ 
        c_0x8967a34f(0x60eb5b0589e8f11758d66a8f603f5f49c1a90ef8425b580849d700c48931d427); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];
c_0x8967a34f(0x50cdb2b245f4d2244f3fe387bebe5cbf666452545440b35ab19bdb5344f1676c); /* line */ 
        c_0x8967a34f(0xa039928453e2527599369e40e299f765711ec486cfafb2b3a25b9b8ef1690409); /* statement */ 
if (tempPlanter.planterType > 0) {c_0x8967a34f(0x81629c1eaccc1c26585d7e966b10441a8a3f8bc9442f7b8288c7622f4d9dd368); /* branch */ 

c_0x8967a34f(0x227b39bf34fd36c3ccc09b36bb2d265713c1a386785fea619fbfa53b62590d39); /* line */ 
            c_0x8967a34f(0x2c98b5a676b85ae6501e27649606d0640149cc36054f7a7bc2b3d3fc81f1d00f); /* statement */ 
if (
                _planterAddress == _assignedPlanterAddress ||
                (tempPlanter.planterType == 3 &&
                    memberOf[_planterAddress] == _assignedPlanterAddress)
            ) {c_0x8967a34f(0x5fa43c30c4aebf3536d9033585248fcbac264af11fefcf04b427e39b161ab96c); /* branch */ 

c_0x8967a34f(0x551016d205bf44f31991befed62d32120604bd51bab431d98917f9fc43c3ce57); /* line */ 
                c_0x8967a34f(0x945be388928316c692dac180a3fd6a78636069f984f3a07a9c27abb9c03d52e2); /* statement */ 
if (
                    tempPlanter.status == 1 &&
                    tempPlanter.plantedCount < tempPlanter.capacity
                ) {c_0x8967a34f(0xd9cc3a4ce26be231e8eef152190e4a4a1942fd76afc55c38fffda0290b25e78f); /* branch */ 

c_0x8967a34f(0x719b1d4ba0268550f55c1f4bf82f2fce468c86ee7ad34871590a8d2453a81fcf); /* line */ 
                    c_0x8967a34f(0x99653446747dec78e4315df30e9498157a3e9bc393ef99829bd4a5e199cba306); /* statement */ 
tempPlanter.plantedCount += 1;

c_0x8967a34f(0x59ff76b510178a0bbeffc8a3210f0dd2919ad5b27736f548bd03b97e785193e0); /* line */ 
                    c_0x8967a34f(0x2efa6b538dcc3e3868ceabd968202ce9aeef0b42fcb8169046cf446f7ab32cee); /* statement */ 
if (tempPlanter.plantedCount >= tempPlanter.capacity) {c_0x8967a34f(0x16e98e1e49f2e7549d81c7b44f1ce184aa349af43a617dbd63423e22cd0f87a1); /* branch */ 

c_0x8967a34f(0x40f2ab9a98fc9d7e01c1443663c3435c5fc89a8685c4019d7f98f96d1c44c70f); /* line */ 
                        c_0x8967a34f(0x2516650e69651ac4a36c29a7143102189b520970cc55ce692a18556cba453cf7); /* statement */ 
tempPlanter.status = 2;
                    }else { c_0x8967a34f(0x55a7a0bfa52bdc87a241766712a11c4d6692def1a442c684034bdad6e3231f52); /* branch */ 
}
c_0x8967a34f(0x1cb51c6c01727ae32050765c9bda34f4a5bd775b0a3543ab84824e6c22d90a10); /* line */ 
                    c_0x8967a34f(0xfa59e27db8f5111dbf58ac5c239a324027e9e14869081cbbc8a8fd4598da3080); /* statement */ 
return true;
                }else { c_0x8967a34f(0x7debfb47b621087b86f3eeddf25062a9d79ba69fa8a2b5533a47237a197c56b8); /* branch */ 
}
            }else { c_0x8967a34f(0x80d90bb7262cbf144c3000fe8b035d99a91c58f4d28434f5f5fbb6f505dd8a6e); /* branch */ 
}
        }else { c_0x8967a34f(0xd51545bfea2349c3e0dbc412648d30d390ffb47f17cb938d3ddd012613e98370); /* branch */ 
}

c_0x8967a34f(0x7e8586c31c149fbdef91bb83fc9c6397c0547f378af32dcd1d735ef0e24425a1); /* line */ 
        c_0x8967a34f(0x2f9822765e9349a86c409be429b23a6131f587caece448b5d4e970f48e88fd3e); /* statement */ 
return false;
    }

    /** @dev oragnization can update planterPayment rules of it's members
     * @param _planterAddress address of planter
     * @param _planterAutomaticPaymentPortion payment portion value
     * NOTE only organization (planterType = 2) can call this function
     */
    function updateOrganizationPlanterPayment(
        address _planterAddress,
        uint256 _planterAutomaticPaymentPortion
    ) external onlyOrganization existPlanter(_planterAddress) {c_0x8967a34f(0x59e56f5dfa5ac0d351bbc5f1e8339597e949b40b906adee1ed2c7cf151a40ca5); /* function */ 

c_0x8967a34f(0xd340ee53461ce13289c3c70a14ee0c0901d184dd6fbc8b6315b65f776af89e73); /* line */ 
        c_0x8967a34f(0xf36d1f412df2c479a340304497af609d8d6f21068219acc6cd1266bcbe9440b4); /* requirePre */ 
c_0x8967a34f(0xa73b2a920785fff9c5e741c6c0529bfe4009f866d4db8b8715033b66517bea6e); /* statement */ 
require(planters[_planterAddress].status > 0, "invalid planter status");c_0x8967a34f(0x82561b1778dc73886769fdd01db41bdf1ac6632486712317415881674b4d0a9f); /* requirePost */ 

c_0x8967a34f(0x11c1267f58ba268e6ebadcbe9b0d6d31929122c1a5e48aa8908b99dc4957481c); /* line */ 
        c_0x8967a34f(0x674ce368ec91e56c981caf81d7d47db5995de70e34a5128e616c154b519516d0); /* requirePre */ 
c_0x8967a34f(0x977c90372ff088370a8dd40a9dabc2194ae367c02d47cdf4a9e8a52e82c5476d); /* statement */ 
require(
            memberOf[_planterAddress] == _msgSender(),
            "invalid input planter"
        );c_0x8967a34f(0x6c2ad2287abfd741365aa84a4d9dea6288b6cc621a9e6a98886aae8c3e6690ef); /* requirePost */ 

c_0x8967a34f(0x25f9fcfb0e10dd87b6a43208abcc1263f75c90b1a38676738bde5f9c614bc3e8); /* line */ 
        c_0x8967a34f(0x62f95d258971b267a31bc012b5a06fde6e431141160481b0e4dd1e3d430bb6fa); /* requirePre */ 
c_0x8967a34f(0x67c5df3b41ba3e81fc863db205849342f9f897fc9b78c198c9888244934d5c37); /* statement */ 
require(
            _planterAutomaticPaymentPortion < 10001,
            "invalid payment portion"
        );c_0x8967a34f(0x7ed44907b9c51104a94407def772e5a292e859fc409c79cd4dbcc2f7dd22a182); /* requirePost */ 


c_0x8967a34f(0xa05f97ffce6be23cc4e921f314981f227ae1075b041b6f8ce33c71bd52a5773d); /* line */ 
        c_0x8967a34f(0xfafce9f41eec73fa313685e65bc0f862fb4aaa27f52e65086f5f3331fed6d848); /* statement */ 
organizationRules[_msgSender()][
            _planterAddress
        ] = _planterAutomaticPaymentPortion;

c_0x8967a34f(0x1c5aa8fff0f874204d6a6d353da9adb1939c5ca1b960a9df74acee8efab41f31); /* line */ 
        c_0x8967a34f(0x2753140658fcd186689dab0e764068aad596c20fce448c6e8896f7cc9624b24c); /* statement */ 
emit PortionUpdated(_planterAddress);
    }

    /** @dev return planter paymentPortion for an accepted organizationPlanter
     * @param _planterAddress address of planter to get payment portion
     * @return {true} as first param in valid planter case and seccond param is
     * address of organization that {_planterAddress} is member of it.
     * and third param is address of referral and the last one is portion value
     */
    function getPlanterPaymentPortion(address _planterAddress)
        external
        view
        returns (
            bool,
            address,
            address,
            uint256
        )
    {c_0x8967a34f(0x30189993773a9732bc37658691fd519ea23dfb9b515587b5c8b0f55c4279d8e9); /* function */ 

c_0x8967a34f(0x74629c2a1774d6a71afd5809f22605dd2cca28cee5e0df0b8f72b7995c1d77ae); /* line */ 
        c_0x8967a34f(0xb3becbb5273955d7d0a054afd71f4744204dca9e7eff98b2f7e6a4b5f0409c11); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];
c_0x8967a34f(0x62640d1b585ce12b239d4fc7615e450eaa2596aa22aed06339ae68884fc62472); /* line */ 
        c_0x8967a34f(0xf396a1e0f5347faa77bb331b86a068b6254ac51f20854555c0a6a3469bce5d1f); /* statement */ 
if (tempPlanter.status == 4 || tempPlanter.planterType == 0) {c_0x8967a34f(0x3c86823502c19a5fefe0314168fd38b03ddb9271b2ccba1b134fbfaa97165db9); /* branch */ 

c_0x8967a34f(0x74cf9168dffaf6864e04d61d6c4aae9a0478bdcf7ce2771ea85f76fb45c2514f); /* line */ 
            c_0x8967a34f(0x370c9a9dfb7f0ac77d6134b361a3fd68163ceb6360ab2e24bece930f23de154e); /* statement */ 
return (false, address(0), address(0), 0);
        } else {c_0x8967a34f(0x163a2cf99818c963ceed84f377c5968710b3ea48e66620057578b99d6bfcc6d7); /* branch */ 

c_0x8967a34f(0x65a7892e71b45b918d1e7afbcad447cd814c74fc53b8cdd4bc6cfbe0ce59a671); /* line */ 
            c_0x8967a34f(0x40c86fd3d824c0e9b08c6e59515a8cfdc6758991388a51574334be70131c3c64); /* statement */ 
if (
                tempPlanter.planterType == 1 ||
                tempPlanter.planterType == 2 ||
                tempPlanter.status == 0
            ) {c_0x8967a34f(0x63ef964145728e1cef98504a1b501d622c0fc8cf5a19743518bddc45d10294b9); /* branch */ 

c_0x8967a34f(0xc49fc7be11530b5ee4c4db2ec04620c070ae910ccd9d21a9aa6ddec798d069e7); /* line */ 
                c_0x8967a34f(0xbf3d654e62616c66f5640abb36a68feda56a7e86f6d2da488ff023be15cb1ff6); /* statement */ 
return (true, address(0), refferedBy[_planterAddress], 10000);
            } else {c_0x8967a34f(0xccf4a7c2b5797d209fa920121cfc32a879eb3c2a00615ecd7ac300c486421649); /* branch */ 

c_0x8967a34f(0x8b0c468293f05f8045b906ece20aff909e6082d8ab2be19cbbc106e0414fbf4b); /* line */ 
                c_0x8967a34f(0x0337f73b6b6c7fde1e3906f3da4123596f6bcfbf93330fcc6d0bbe178f274e94); /* statement */ 
return (
                    true,
                    memberOf[_planterAddress],
                    refferedBy[_planterAddress],
                    organizationRules[memberOf[_planterAddress]][
                        _planterAddress
                    ]
                );
            }
        }
    }

    /** @dev when tree plant of {_planterAddress} rejected, plantedCount of {_planterAddress}
     * must reduce 1 time and if planter status is full capacity {2} update it to active {1}
     * @param _planterAddress address of planter
     * NOTE only treeFactory contract can call this function
     */
    function reducePlantCount(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyTreejerContract
    {c_0x8967a34f(0x78187b83f4b1821573d174baed25eb8fca56def7913b604dfb945db80550d87a); /* function */ 

c_0x8967a34f(0x7e3b0902db2aff6b4eb5cf6419d86ab81a71ec374fd407f6b4e983bd55362ecf); /* line */ 
        c_0x8967a34f(0x88f044eb12a6687782265b7693b5f485c32ac0b28709178f6ddb8e4da0b4d8f5); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];

c_0x8967a34f(0x28123f61c856f6044fd32efee44f2e78a99966395fe35f8d8bfd2dbf221afbf3); /* line */ 
        c_0x8967a34f(0x8547b097f04dad4e2bfbaff4d099ac19e622e93e9305774e8c3592b261e86ada); /* statement */ 
tempPlanter.plantedCount -= 1;

c_0x8967a34f(0x2b283fd03e8d4ddb08fc997ec86a45f442ef87d509b253d3f5d505cc01052575); /* line */ 
        c_0x8967a34f(0xdb201d3f59121cbaf9eac7961c864d6c28310aec87430465a7e3ad97793a1d1d); /* statement */ 
if (tempPlanter.status == 2) {c_0x8967a34f(0x87afe7b1fa22895d4e61722d6b02c06d8432ab05898fc5cf3e9e6c41c7294f3d); /* branch */ 

c_0x8967a34f(0xa7a07b75113016817df926506f31a1295882c9eff8a70c880f875a7a9721aef4); /* line */ 
            c_0x8967a34f(0x941663429a911757faf1e035db8a7dd41f929c18dee7e6d4be23f47398d65e90); /* statement */ 
tempPlanter.status = 1;
        }else { c_0x8967a34f(0x5c789db0b22f18692159b7637dcade975556c15dd9b3661c7383cb7739d11a9f); /* branch */ 
}
    }

    /** @dev check that planter {_planterAddress} can plant regular tree
     * @param _planterAddress address of planter
     * NOTE treeFactory contract can call this function
     * NOTE change status to full capacity if plantedCount be equal with
     * planter capacity after increase plantedCount by 1
     * @return true in case of planter status is active {1}
     */
    function planterCheck(address _planterAddress)
        external
        existPlanter(_planterAddress)
        onlyTreejerContract
        returns (bool)
    {c_0x8967a34f(0x28b1d3b27bc0b924103ea51fc98fa86367e11ad82b4b6bdbf476e9997d4b21b8); /* function */ 

c_0x8967a34f(0xb752c3f79fedde24fdfb3a66bc36e70ae6c0e334702b9a5c9fdb532acbfe62f8); /* line */ 
        c_0x8967a34f(0x919287c3b57efd4ed757db294b9c0b87700bc98c9e2abb94cc4aa3fa59a7d9eb); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];

c_0x8967a34f(0x3065f46c73e36d6c8ef378688c85e4a1c5ed1890f494480a390041186bc8ac6f); /* line */ 
        c_0x8967a34f(0x9eabe472d073eab357329cca2051354e0560a479b3939335186d483b08e59fde); /* statement */ 
if (tempPlanter.status == 1) {c_0x8967a34f(0xa52bc613ee92171ddd0cf35edadea49beebfd15b07dd31d762fc66b2506a5a7e); /* branch */ 

c_0x8967a34f(0x96e76e6fb46bac82a1eb428ead8644c5f78fc77dcd226069603598d2bb16b5cc); /* line */ 
            c_0x8967a34f(0x7724a9de712ec9f11b5854da8e4b7bb82fc36590a8af21233de41a6d9c464670); /* statement */ 
tempPlanter.plantedCount += 1;

c_0x8967a34f(0x3f7ea84b51f673ef34074b39f75159f5648dd36e9405c0375c7503d5552ac464); /* line */ 
            c_0x8967a34f(0x29ab4c841694f7972a757285c52038902479c80c751db23d26d9474ee7476073); /* statement */ 
if (tempPlanter.plantedCount == tempPlanter.capacity) {c_0x8967a34f(0x6292e570c4c668fbe538fe011b427b95aa54c3215b85182480661f11bb009f04); /* branch */ 

c_0x8967a34f(0x8327cdcea9e753617732ddcc0402d3399aec6114995e281f77094da4934290ae); /* line */ 
                c_0x8967a34f(0xe6d24551da899680b7e31fcb1a5bd00fc191183cefcd83e33183e0b194539e4a); /* statement */ 
tempPlanter.status = 2;
            }else { c_0x8967a34f(0x3a14d396057548c607fe6f639965c867e286246d99fd20149c2b36f3efe38ac6); /* branch */ 
}
c_0x8967a34f(0x5ecb91bd8a60f3516aa2836265b6d47b06b1540607df67d1efb311fd6fecae2a); /* line */ 
            c_0x8967a34f(0xfe8d9f7b7b6960fed5d587e0cf4df4a4eaf22ced1f8448cf1dae7756330a74eb); /* statement */ 
return true;
        }else { c_0x8967a34f(0x868d1b5d9c043d5529b154c1b4372f7ab41e4d24dc292f8e5f1533cdb1ac2fef); /* branch */ 
}
c_0x8967a34f(0x8e1226184a44fc1a05fa38bb2a2404f1884bf85f3270573cca315e928e396497); /* line */ 
        c_0x8967a34f(0xaf9cc5e3af7f64dc0631f74179541042660c110bfbd78d2050ffd19ac5461d86); /* statement */ 
return false;
    }

    /** @dev check that {_verifier} can verify plant or update requests of {_planterAddress}
     * @param _planterAddress address of planter
     * @param _verifier address of verifier
     * @return true in case of {_verifier} can verify {_planterAddress} and false otherwise
     */
    function canVerify(address _planterAddress, address _verifier)
        external
        view
        returns (bool)
    {c_0x8967a34f(0x020860c7cf90734889e073a609e08716145e4e46625e6089e626a3e1f67263d6); /* function */ 

c_0x8967a34f(0xeb4c8712e7f7e4a46c6b0dd3f85532d03a7167d2fd5f3cca13f1a23b8314becb); /* line */ 
        c_0x8967a34f(0xeb53687a7a971e075b407ec4145bcfe6e26ff20ddf9879cf589eea6f391b3265); /* statement */ 
uint8 _planterType = planters[_planterAddress].planterType;

c_0x8967a34f(0x02b7cd5bea477c48dc0e0eef7f365ceb58c3613f2ebda13daf53b4aa40ce148e); /* line */ 
        c_0x8967a34f(0xd464dcf1dc7d431b6b7c8752894c4bbc26bd5d9998cccc89107d5e862b9b0107); /* statement */ 
uint8 _verifierStatus = planters[_verifier].status;

c_0x8967a34f(0x9a58f089e1c5558ae5c090c903688488158b769745bb223d880dd13eb317d53f); /* line */ 
        c_0x8967a34f(0xd60624c8e4ac4bbc63fbfd00c0a2b758480954e4f2a7cc7c2b48b10dfedf5744); /* statement */ 
if (_planterType > 1) {c_0x8967a34f(0x2fd5a5c63a3ff48e20a6d0ef444f216da6ed095fd2e6092f73223e812e11736a); /* branch */ 

c_0x8967a34f(0x92990aaba52ef0ad87f93fa4386499be04406e645f29f66e59235659144fdbb6); /* line */ 
            c_0x8967a34f(0x3b919a61f0710521e66c1a5e9f4b6fdf87d2c0ac1c5471eb65d9f683acc633f0); /* statement */ 
if (_verifierStatus == 1 || _verifierStatus == 2) {c_0x8967a34f(0xee6370d56f3b2bfa9ff856c2531bcbed6dd559c93877792cf0dac1713bf8dfb5); /* branch */ 

c_0x8967a34f(0xf2edcaf5157e0b28c15260184fe2a19bc7c7788de6d846fa11be89c77318e296); /* line */ 
                c_0x8967a34f(0x279ddc37781f8a57d83f5a4d8b76f1f4631fa841d9be5547d50b25d2cd8c2fcb); /* statement */ 
if (_planterType == 2) {c_0x8967a34f(0x36003a5c60996bed6aa785e9800603bcae142d8c7bb8701667560552dcc2ad8c); /* branch */ 

c_0x8967a34f(0x737f318ebefc0f1c6765c522fdad494c6da67672a8dde7c0a1dd631442053ceb); /* line */ 
                    c_0x8967a34f(0xa5658283f5f3bc693729699ad338e89ce27a67c8575443b386a5d0d497bbbdae); /* statement */ 
return memberOf[_verifier] == _planterAddress;
                } else {c_0x8967a34f(0x0be81851500f171d0ec8d799ba9ef42a4a9e6777217286b99010789788bacde2); /* statement */ 
c_0x8967a34f(0x8a49004f44d306ddd4d3470b84ef7ffc457309f9ae43874f14537edf23c30284); /* branch */ 
if (_planterType == 3) {c_0x8967a34f(0xfcef18e24500f45fee0669a739b1187e4db4efbba35bb17290749625f68ca0e5); /* branch */ 

c_0x8967a34f(0xdcb59c5c811435d36c2b9488482fd543789ee1d61b2fdd37a91df897e527da93); /* line */ 
                    c_0x8967a34f(0x59eacb1be8380f381e25ceb1d5aa250027aeb8f6e708ce072c421b087805ebbd); /* statement */ 
return
                        memberOf[_verifier] == memberOf[_planterAddress] ||
                        memberOf[_planterAddress] == _verifier;
                }else { c_0x8967a34f(0xaafdcda0b9c047f5ad6b80a1af12400aec22c0eb880e0370489f573a44fbfeb4); /* branch */ 
}}
            }else { c_0x8967a34f(0xcbdf2ac9455c532baac9e4103d0676ec481f6d4f8074120052ec02aed195dbc6); /* branch */ 
}
        }else { c_0x8967a34f(0x453f1b35c9238676ebd1dd4d6ef94a60a9f8cc5cd6f72671ec6715f2479808c0); /* branch */ 
}
c_0x8967a34f(0x9705c83f44a7892f4278a953563eecc3b4dda4ccd743876a1d7cfdfcfc206c21); /* line */ 
        c_0x8967a34f(0xde19f87f724f62c26ade5e6a55eaf88ccaa582ea954fcf167a8cea1321569572); /* statement */ 
return false;
    }

    /** @dev check allowance to assign tree to planter {_planterAddress}
     * @param _planterAddress address of assignee planter
     * @return true in case of active planter or orgnization planter and false otherwise
     */
    function canAssignTreeToPlanter(address _planterAddress)
        external
        view
        returns (bool)
    {c_0x8967a34f(0x0a60da3fd88ac53efcf09c3dc99fd9a4378e09eb49eb86701f99c50cd1ac68ab); /* function */ 

c_0x8967a34f(0x5f28ab3fd2f5e47c94599f99dc9239d0bbbf9a2ec7cd3d3895b616d3b1fae6cf); /* line */ 
        c_0x8967a34f(0xe312611712bed8833b6e111795d59fd273e5bb2610a40c06606b2900a62bcd52); /* statement */ 
PlanterData storage tempPlanter = planters[_planterAddress];

c_0x8967a34f(0x07073056da1d503f05350dfc59711e7e38fd50d484a5797b3f1cfbbe3e78c93f); /* line */ 
        c_0x8967a34f(0x81856caa8ae347b9c2a1d13aa7079af6ce26309bdae1fa3b6e28de73084e031c); /* statement */ 
return tempPlanter.status == 1 || tempPlanter.planterType == 2;
    }
}
