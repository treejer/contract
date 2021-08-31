// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x1bf47d92(bytes32 c__0x1bf47d92) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/ITreeAttribute.sol";
import "../treasury/IPlanterFund.sol";
import "../gsn/RelayRecipient.sol";

/** @title CommunityGifts */

contract CommunityGifts is Initializable, RelayRecipient {
function c_0xc722df10(bytes32 c__0xc722df10) public pure {}

    /** NOTE {isCommunityGifts} set inside the initialize to {true} */
    bool public isCommunityGifts;

    /**NOTE {planterFund} is share of plater when a tree claimed or transfered to someone*/
    uint256 public planterFund;

    /**NOTE {referralFund} is share of referral when a tree claimed or transfered to someone*/

    uint256 public referralFund;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IPlanterFund public planterFundContract;
    ITreeAttribute public treeAttribute;
    IERC20Upgradeable public daiToken;

    struct CommunityGift {
        uint32 symbol;
        bool claimed;
        bool exist;
    }

    /** NOTE mapping of giftee address to CommunityGift struct */
    mapping(address => CommunityGift) public communityGifts;

    /**NOTE {expireDate} is the maximum time that giftee can claim tree */
    uint256 public expireDate;

    /**NOTE {giftCount} is total number of trees that are gifted to someone */
    uint256 public giftCount;

    /**NOTE maximum amount of gift trees*/
    uint256 public maxGiftCount;
    /**NOTE id of tree to claim */
    uint256 public toClaim;
    /**NOTE maximum id of trees can be claimed up to it */
    uint256 public upTo;

    ////////////////////////////////////////////////
    event GifteeUpdated(address giftee);
    event TreeClaimed(uint256 treeId);
    event TreeTransfered(uint256 treeId);
    event CommunityGiftPlanterFund(uint256 planterFund, uint256 referralFund);
    event CommuintyGiftSet();

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0xc722df10(0xbab0609464fe14b484602a7401e8503ca3cd9e483e869f5eafa100695f9f2a0f); /* function */ 

c_0xc722df10(0x82f4246d915a89adcbd7c2a68bc30cf7447b7c45b9acc87d380b9059ec31d9c6); /* line */ 
        c_0xc722df10(0xbca00994f81c597de38f325ce8580481854e9df66834f59ef673fad9b5b59f7f); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0xc722df10(0x93add002d9ae4bf84c3340a6a82d4916c358010378dd3383d4dbf81e863a1d22); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0xc722df10(0xb0244bd1f6f21296804392d873422dd2f6c23ef8057348efcaf354cb3a3398e1); /* function */ 

c_0xc722df10(0x66af75ec17a1edf1b9d0520a77b13ec6d9c580a74c8071d197c07872e2a7076c); /* line */ 
        c_0xc722df10(0x24402b3859ec870cf454498886fd9320fd068b78fd1fb9ff1a988ea83277c34b); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0xc722df10(0x967677bc542d5f3bcf7189ad698903307b7060e74358d9b1189beff35552424c); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0xc722df10(0xc4157f6dc1ca01ca3990d9f4f4008e0a64acd280a6a46d755fe1cc75e456fc9f); /* function */ 

c_0xc722df10(0xfcc72c57094ede92037cd52b3dc6403ecbcd13436a12a880460b5c30334b7095); /* line */ 
        c_0xc722df10(0xde60e977129956c4f00607b41f773de7a1802f62f4132d509e021539432dcaef); /* statement */ 
accessRestriction.ifNotPaused();
c_0xc722df10(0xf39f171b17f23c7e02e98505c406d500a3ee7be31d6c2942d504c595b03f4277); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0xc722df10(0x32d401f415956a7837b51dd32311c5aed0ae29bc641f92727d8361022c2fde54); /* function */ 

c_0xc722df10(0x6f01f4ff4bfaf5a75702e0abf347bff583a038e507e1a01f97456862a084aa2f); /* line */ 
        c_0xc722df10(0xdf090e960c17931de24cb0d0e001d0777ed7a3f5e392aa4cf90c8f3bd40216d9); /* requirePre */ 
c_0xc722df10(0xe319b404b1657abf097296c76e362c9be68a8f523817f6be11e8d4424a5c5203); /* statement */ 
require(_address != address(0), "invalid address");c_0xc722df10(0x788cc48a58367c9bd4dc849e4e3b3a2d2736ffafe7f469ccf48e055427f6e3b4); /* requirePost */ 

c_0xc722df10(0x2ece79b567f3abb4c04b6fb1d598df3e055f0f93b302fe1f91f7827967a06030); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isCommunityGifts
     * set expire date and planterFund and referralFund initial value
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _expireDate initial expire date
     * @param _planterFund initial planter fund
     * @param _referralFund initial referral fund
     */
    function initialize(
        address _accessRestrictionAddress,
        uint256 _expireDate,
        uint256 _planterFund,
        uint256 _referralFund
    ) external initializer {c_0xc722df10(0x065fa28efa95f173a20a6f1bc18ceeac0613cf701201de77ed67976583e57965); /* function */ 

c_0xc722df10(0x2b51b8cbe4b53147861903dd4b271dcf03f3267a1bcf2c162308597c3a6a2c45); /* line */ 
        c_0xc722df10(0x0b5e09bdc9e877826a19d1b92331a1198fa08de3f0c5e11a8ddc397d98e0eb04); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0xc722df10(0x36e0e2ffe87d0df6738b26fb75d07d393e12a8c98b072ec6e10447984a6199c7); /* line */ 
        c_0xc722df10(0xb08b4ff12157ae02e591fb5d3d978f1d8d4ecb75986b334e3c91ae90b7ac8816); /* requirePre */ 
c_0xc722df10(0x693599d5fd2bcb83346b35abf9610dfbd0bf3e342a6a7806186f065854da698d); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xc722df10(0x2fa52bb3be972c66abdaf9ab45d309ca0c500181d354c3605245550508a246d0); /* requirePost */ 


c_0xc722df10(0xd9c1bd986edbeabbff42eaee22066a0e8359e3c94f8da6e0d2819b5cc2bb3d6b); /* line */ 
        c_0xc722df10(0x8bc193964dc448aa156008c203381fba2f5168f61072a26c069c461c5ccb4ea0); /* statement */ 
isCommunityGifts = true;
c_0xc722df10(0x5f318b225017a5ecc626284a8de80fa9b8bf4aef477ec3af4265cbbbafc868ac); /* line */ 
        c_0xc722df10(0x2158ba8d7e1e45afe912cf062a61c09ba0bc5a8a660eb654fcc6f549ff175807); /* statement */ 
accessRestriction = candidateContract;

c_0xc722df10(0x0addd276f447982b5cf9a5c64a976cfda14981371b6502e7844c0e3c53fc07cf); /* line */ 
        c_0xc722df10(0xc4288f350b81268d01116a8e24be883af9787cba14d641b33e3483861df0d7d7); /* statement */ 
expireDate = _expireDate;
c_0xc722df10(0xc6ce2a5298da9a8b242a9997a495b12437cd16640497953f3af9220f920c0e45); /* line */ 
        c_0xc722df10(0x7b2d4b41ec468c2f7b6ccde076a135a313767e70f935524ee4185d941f125fa5); /* statement */ 
planterFund = _planterFund;
c_0xc722df10(0xe4c1e812521f12f8ea84894ca532e614d5b2e559b8aab568af3e48c98959cb87); /* line */ 
        c_0xc722df10(0xf1dbf00a2ef9e4dc1c1c087cfd04147d0e161acf783512f55b53382d90683cb7); /* statement */ 
referralFund = _referralFund;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xc722df10(0xaea0cc434acb5f477af1069ba3bf9e071ddc475152ffc9142fad6b53e2b34d76); /* function */ 

c_0xc722df10(0x83cafe65f7eb4b7ba1525699055c4cddc45b3587a896fdd04992376f5175a47b); /* line */ 
        c_0xc722df10(0xa8b946bd7d6cdca1deccc15a47b992d98694eaabab560123d76947b7584cf1cc); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev admin set DaiToken address
     * @param _daiTokenAddress set to the address of DaiToken
     */
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        onlyAdmin
        validAddress(_daiTokenAddress)
    {c_0xc722df10(0xf03da04a7d55abb476be4b00bf8208b4a01b013c02d86fa013550a5909feda65); /* function */ 

c_0xc722df10(0xf70027016d7535c1f20a4939caa7ceefb7906fc86980acedbf26c7ad209e3cbb); /* line */ 
        c_0xc722df10(0x936a903996f6c012856db49e6008905de4c3ebbc6c64091f7f9aad6e1af269b1); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
c_0xc722df10(0x224fb3b7406a062c4aff7592d610af1f3d138b0b3ef2f87258368d0410fc1822); /* line */ 
        c_0xc722df10(0xc7cffb3ad100a63a6d23de7185a41fb6557dbc03e9db321006978e771df27ef0); /* statement */ 
daiToken = candidateContract;
    }

    /**
     * @dev admin set TreeAttributesAddress
     * @param _address set to the address of treeAttribute
     */

    function setTreeAttributesAddress(address _address) external onlyAdmin {c_0xc722df10(0xbc09d9f7ffbe1bebc9405e8da8dbb579a0a1f20dc3bd0a49de910e5cfa14a16b); /* function */ 

c_0xc722df10(0x8d4584a37ddd17af9260775c14b1236184c60dbd8c736998b0ffd75ed6df564f); /* line */ 
        c_0xc722df10(0xee82027e23d6521cfe09e6c325a118ba9d2b11410b0a3a165f1a172f0f2769ad); /* statement */ 
ITreeAttribute candidateContract = ITreeAttribute(_address);
c_0xc722df10(0xdc9e742b52e69e477ba1544d872c812c45a995a7bc5d00ea26e8fd1735a520d0); /* line */ 
        c_0xc722df10(0x5a726c5ffecede44c60d65b683af13959afb4e95320b08794e552ffa90c8b6ca); /* requirePre */ 
c_0xc722df10(0xeee84a1adae5654102a4fe0b89ed43e020098251882dc612a793acb73ed8f868); /* statement */ 
require(candidateContract.isTreeAttribute());c_0xc722df10(0xd221e4dd11b2f507faac91a2a069d1525b367374adc58516baedf3c30a81ddc3); /* requirePost */ 

c_0xc722df10(0x14d46883cc1918531ef0a0a81d94e572a822f07aa24dad371a8de61ff2ae0a9d); /* line */ 
        c_0xc722df10(0x051f319377a3c40b107e7078736c2ece133453d210007a3be1fb20f212eec239); /* statement */ 
treeAttribute = candidateContract;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */

    function setTreeFactoryAddress(address _address) external onlyAdmin {c_0xc722df10(0xb46ccbb03f31d12465a89ca6b5d0a92c45f2e30af147b4392ff072b09fb5856b); /* function */ 

c_0xc722df10(0xbd86a3aaafb94bbde01302b112ff8e260873cd1b5e5b1ded2a6ced34e3a9a18d); /* line */ 
        c_0xc722df10(0xec0aea92ceb7f292259588aff9b26b798687369de9df59b16c960a4116182350); /* statement */ 
ITreeFactory candidateContract = ITreeFactory(_address);
c_0xc722df10(0xe94e298ce810314f27aa83359c2d434742ab74095d659bb8fdf067a0a4ec052e); /* line */ 
        c_0xc722df10(0x28ab05fb8c53abbdac77fca005f19e7ead50a2b14701e9e37342b92d13c0fae5); /* requirePre */ 
c_0xc722df10(0x8ceae8f7197e9f5241e227b4285c1db7ace246573268983dac1bbe602aef4ee2); /* statement */ 
require(candidateContract.isTreeFactory());c_0xc722df10(0x441a5784d73dfbe4180a6f102d9ae173a91d612203d2b97b6032e1b81afd4200); /* requirePost */ 

c_0xc722df10(0x5d2c57a95ff3ddc87576fcd7bea262fcf8ddd6ce84b72c539f47216f13d17ad1); /* line */ 
        c_0xc722df10(0xeea7429a2a339c3b6638ac5dcf5b6c6bd0785d535bc28452db575479f6ca43d8); /* statement */ 
treeFactory = candidateContract;
    }

    /**
     * @dev admin set PlanterFundAddress
     * @param _address set to the address of PlanterFund
     */

    function setPlanterFundAddress(address _address) external onlyAdmin {c_0xc722df10(0xd824d13a1e7d128d0e18131f3e73e341addd2f292b41e6ff9792a40733833a23); /* function */ 

c_0xc722df10(0xd001be045a37a02d11e9557e9769d74a21d3a08bc62dd3fef987e2f7cbf71957); /* line */ 
        c_0xc722df10(0xa25723d03d7e7ea3fb3aef18fba904fa0e19c163b68d6895fd9c6524143d8391); /* statement */ 
IPlanterFund candidateContract = IPlanterFund(_address);
c_0xc722df10(0x0f8ab00cd003bba060c6f58206ebcb235e194a6a6b8ea478e4461b9be27143bd); /* line */ 
        c_0xc722df10(0x15a37de9e18a806e5032921393716b66cbe8b4749e60bb26dcc170dc10f3e6ac); /* requirePre */ 
c_0xc722df10(0x3f2c43d1f4b714293f987b31be5b3504780ad2410db4ce17b9a508f906da0dae); /* statement */ 
require(candidateContract.isPlanterFund());c_0xc722df10(0x663c4661f928280c976bf7879f412ce9cff073e83aa4514c2d350df6c54cea56); /* requirePost */ 

c_0xc722df10(0x4b0dcba22f2d86bde7c78a555862c9fd46b91ded3a2daa9ef378a1fdfa2f4f57); /* line */ 
        c_0xc722df10(0xfbbd267f57320151a4ef1c286a501c0c740d06e7ef311aa8a3644543476bab6b); /* statement */ 
planterFundContract = candidateContract;
    }

    /** @dev admin set the gift range from {_startTreeId} to {_endTreeId}
     * with planter fund amount {_planterFund} and referral fund amount {_referralFund}
     * NOTE community gift ends at {_expireDate} and giftees can claim gifts until {_expireDate}
     * NOTE when a community gift set {_adminWalletAddress} transfer total value of trees
     * calculated based on planter and referral funds and number of gifted trees to
     * planterFund contract
     * @param _startTreeId stating tree id for gifts range
     * @param _endTreeId ending tree id for gifts range
     * @param _planterFund planter fund amount
     * @param _referralFund referral fund amount
     * @param _expireDate expire date of community gift
     * @param _adminWalletAddress address of the admin wallet
     */
    function setGiftsRange(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _planterFund,
        uint256 _referralFund,
        uint64 _expireDate,
        address _adminWalletAddress
    ) external onlyDataManager {c_0xc722df10(0xec639007c11ce0c60466767e6071073aeb3314a8b2d1611d40232379ba382be0); /* function */ 

c_0xc722df10(0xe7f9363c545cb44fd0df371f1c69731db4b0db7f9410a38cf7dbea3b6409ba84); /* line */ 
        c_0xc722df10(0x94c4f06e2912c577110d0b2fb435fd282391585138420bae311539410b4938e3); /* requirePre */ 
c_0xc722df10(0x0bd317efd5b58abaaa5f587cd41ff23ea303d885a39b99843d88589c58a92ab7); /* statement */ 
require(_endTreeId > _startTreeId, "invalid range");c_0xc722df10(0x29491f70555f1ab4e9142d6cd0faa4fd5cebaddc610e37e8b9dc425910fdd90a); /* requirePost */ 


c_0xc722df10(0xcc8274cf549b36e7055b5fe07897e30843d2c3f7813cad495696a8fce8a732ce); /* line */ 
        c_0xc722df10(0xec6fd96b1629355c6924637ba30e762694cba64c78f8e5c048a4b769b159c4e6); /* statement */ 
bool check = treeFactory.manageProvideStatus(
            _startTreeId,
            _endTreeId,
            5
        );

c_0xc722df10(0x95c331e535b6bdc4f9ee0670dcbe861c7ab627e5b1dd156e5d678050c6625f79); /* line */ 
        c_0xc722df10(0xd474b7a6011601fba8274492ed04362280a5111047c99a189a82bf35954990d1); /* requirePre */ 
c_0xc722df10(0x5cc3a098ee32b595c4d35141813d77531a470b4e032b4db4c67012849c8a0cf9); /* statement */ 
require(check, "trees are not available");c_0xc722df10(0x6150ec058061aabfebc52811ccd657fe7b303ca0a09953bad521ae7eaaf045fe); /* requirePost */ 


c_0xc722df10(0x7c74af6a8b0bc7daf06f4534150c2831326caf12076e2bc077f380d23e86f110); /* line */ 
        c_0xc722df10(0xcd4a3c54fdaf3222606612e2bb4380bcabf78c460ce1667e506abac8112b0753); /* statement */ 
planterFund = _planterFund;
c_0xc722df10(0x49cdd005cec0fd9f025679d57efedd94a342c0347d3ccd5d238049567e1574d4); /* line */ 
        c_0xc722df10(0x238a232f45c2fac2db4db591f4384daee221c30bebe183b35e069c2cb85055ac); /* statement */ 
referralFund = _referralFund;
c_0xc722df10(0x3f7b146c61c228ca83e3545f7e761f64184b9d4d0c9d92679fc64cf6fd72c67e); /* line */ 
        c_0xc722df10(0xba60f02724d161d2a87cad3ebe0926750a87f9db90e2ec12517c904adc916d7e); /* statement */ 
expireDate = _expireDate;
c_0xc722df10(0xb43fc504cab3fe90e52f16dcf0a74992c304cdf845ab2b0dc3ed6e25f5d0f13f); /* line */ 
        c_0xc722df10(0xc5d0fac5cdadcae0894d2d64e080ce68b7dc1332ae1f088d4aa0a06e687f07ce); /* statement */ 
maxGiftCount = _endTreeId - _startTreeId;
c_0xc722df10(0xd2cb2e3e5423476e1305be016e2789407a98fb5847ea0e01714794455c88ca42); /* line */ 
        c_0xc722df10(0x386898671961894091d375ef7ff015a2f6bf5587228333924947786fc9197161); /* statement */ 
toClaim = _startTreeId;
c_0xc722df10(0xa18d0c844e72db54326e34434fb0f4aaec91548e295782beaba746cb5b0017cf); /* line */ 
        c_0xc722df10(0x43efbff99b08857bae22c400789c2632c46102fb6a26fe6c4e2477f2035ee13c); /* statement */ 
upTo = _endTreeId;

c_0xc722df10(0x6aebcf053cdc1108e35c6a35e1ee93f0a62ccac96c6a6b54d120e07f02fbc1a3); /* line */ 
        c_0xc722df10(0x51b84feb096a9669e3833a6865317d4db03b59adcaa563e9e90dbe1b245075af); /* statement */ 
bool success = daiToken.transferFrom(
            _adminWalletAddress,
            address(planterFundContract),
            maxGiftCount * (planterFund + referralFund)
        );

c_0xc722df10(0xb4eca6162043097e11ac1655fa737bf74223ea8aa4d23939e968c5265693e2fc); /* line */ 
        c_0xc722df10(0xe11e37d49fbbe072a1be5ed02101773f1e67290fbf7d4063fcd6bc6401de1617); /* requirePre */ 
c_0xc722df10(0x92b2483f9e18b1450c1c9b9bacede089a72c417d04b1c4c7333efeceae5f65b7); /* statement */ 
require(success, "unsuccessful transfer");c_0xc722df10(0x736c23e9b0a4f199d88815194e25021fd5f76b9c1342ade093c62ca4432010d8); /* requirePost */ 


c_0xc722df10(0x3e3b4c64bdda7f76aecfec887e4f968efa6ecae371adde5219631ff42185b69e); /* line */ 
        c_0xc722df10(0x77f125262423499375fbd8d6841364baa7e6ccbc5b2c971245312a7d9f249460); /* statement */ 
emit CommuintyGiftSet();
    }

    /** @dev admin assign an unique symbol to a giftee
     * @param _giftee address of giftee
     * @param _symbol unique symbol assigned to a giftee
     */
    function updateGiftees(address _giftee, uint32 _symbol)
        external
        onlyDataManager
    {c_0xc722df10(0x253e7132d960502923a9aec3a86ffe9661f2046111647b29785cd4d3cbd22340); /* function */ 

c_0xc722df10(0xebc91b7b8201f9f861b16cd6e9019b21807e1ec842d5433aa9cd947e46a9f2a2); /* line */ 
        c_0xc722df10(0xc80c9b78c615e37a2f9a69a95737a0cf7effb2455826e5719dfb1f5f138035ad); /* statement */ 
CommunityGift storage communityGift = communityGifts[_giftee];

c_0xc722df10(0x99176f4d7ee64f6aed09fbcae3d62ee7da1e59f0556c04f9586fb6c2d87616a4); /* line */ 
        c_0xc722df10(0xef5f2e917faf5c46903542d7668707c7f228beb94b807ddda95fecb52106cce8); /* requirePre */ 
c_0xc722df10(0x984b1308318421a5e1c260156653725382dc2eb463a9dd816a30c85ba0d837c5); /* statement */ 
require(!communityGift.claimed, "Claimed before");c_0xc722df10(0xa27873d2797353f07fe5054a87def95d45faf989827605f5de5265c92a9a8c22); /* requirePost */ 


c_0xc722df10(0x73fef7676712e8eec731486d426a5111f930e73ef9db35b8a601cf47ed80f20b); /* line */ 
        c_0xc722df10(0x1e0b312af5998c53edc2443c734d42be8450b25f4452b0f20be8245ccda37f63); /* statement */ 
if (!communityGift.exist) {c_0xc722df10(0x7fddf147913b018f25fc0020da6e59c17a72c0ad05263579e70c86ecd861d39c); /* branch */ 

c_0xc722df10(0xfb9409f9a1fd215712b1412c47480f266101fde0ddbc5d04707246981878e5e7); /* line */ 
            c_0xc722df10(0x262365ee036087a3361446861de9c85dfbcfa2b13181f8a47cb8d3a63be92081); /* requirePre */ 
c_0xc722df10(0x3250a82e3f834a105b5a55f48408cf7d057ef14b7bbee20f99e99144e8fcb5a8); /* statement */ 
require(giftCount < maxGiftCount, "max giftCount reached");c_0xc722df10(0x74a12c7b83cc5736b310726ca98ac398917d7aa44ddef0f354f3ced6a005a317); /* requirePost */ 

c_0xc722df10(0xd08b99393119b1bbff440a8aaabb122b065c7f76cea8243c5cb8c3fb4769b1cb); /* line */ 
            c_0xc722df10(0x17e15da83b982eb62c6de6e1cc5e2a9f65d3e9c48c3eac8c9ad6d8b3642ee302); /* statement */ 
giftCount += 1;
c_0xc722df10(0xed80c5c8a4f9a11f5fa2093304fb683c2e141a246d4cc6f9d2a92430f517f123); /* line */ 
            c_0xc722df10(0xc83b4e2a26a4179e3f2841f5c64f9b4fa4ff3eb9ac406ba5f230eaa7e2c21d0d); /* statement */ 
communityGift.exist = true;
        } else {c_0xc722df10(0x80ee0c8232f5dc08158c3c7fdc1933f0c8cb042fee0b63e3bac5c8fe47ba163b); /* branch */ 

c_0xc722df10(0x325816fd7d548357e21e6f9017a5f2ad30edaffae15401a1436fca38a78ade74); /* line */ 
            c_0xc722df10(0xac4253e5b64d797c4db9967abd44a010c190fcd750c9f1d0481486c86ae85e87); /* statement */ 
treeAttribute.freeReserveTreeAttributes(communityGift.symbol);
        }

c_0xc722df10(0x3aac5e7bf4b339ce12222f525663445dbaa847fa9215f06be51dff9ecf90a8f2); /* line */ 
        c_0xc722df10(0xe74798ab03c0134b41c6ec937486c2b075f850c5657edf565e2b264ce1a89896); /* statement */ 
treeAttribute.reserveTreeAttributes(_symbol);

c_0xc722df10(0xc07d3c8d7bba6cf4894c6811fa4c00245cb2be83cf27e087bca9c44153cf6cc3); /* line */ 
        c_0xc722df10(0x4463cde9d2d05f2daa8228b6e99ba9199965faf216fdbef4a14651f0f93f13da); /* statement */ 
communityGift.symbol = _symbol;

c_0xc722df10(0xbf9b2e67cb3550b14d23af25d31ab5bf1e2846b652267c6dd7fade6c7b53e3ae); /* line */ 
        c_0xc722df10(0xa6f54ebc370a46b854bd2613a3284e364fe758e0ad27b8b6ff827b76bec5fc60); /* statement */ 
emit GifteeUpdated(_giftee);
    }

    /** @dev giftee can claim assigned tree before communityGift expireDate
     * and ownership of tree transfered to giftee
     * NOTE giftees that claim their gift soon get low tree id
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     */
    function claimTree() external {c_0xc722df10(0x5a0a99b8551a32b5b5199497fcda10105cc6d88e6f19c21d9348ce9d7b6bbeb4); /* function */ 

c_0xc722df10(0x5d4154197e818daa84d2f33c17b2e4e9a2dc9a08572c1ef94b9d3bb8f66d3743); /* line */ 
        c_0xc722df10(0xb2bb9d88816582ac91ffe487dc462619362ef2588a499776e48c013b5078e663); /* statement */ 
CommunityGift storage communityGift = communityGifts[_msgSender()];

c_0xc722df10(0x3a64989d9625aff2f085a3102cc5e9df709a475d52bb77115a8970150d330a76); /* line */ 
        c_0xc722df10(0xcb5fc4753a645896689b779350038162383994c5f9343a72d6ba8f6e7d635527); /* requirePre */ 
c_0xc722df10(0xb713f80cb69115fa16005c5a8b4847188353f445217bdb35c86b151fca832bec); /* statement */ 
require(block.timestamp <= expireDate, "CommunityGift ended");c_0xc722df10(0x8b9e3ccc544df704b595838dbcf8022d3818517e1a7aef2ac9fb3a9f459db4fa); /* requirePost */ 

c_0xc722df10(0x01aa74311cf770ce4c5d36434da3dbdeacc4c4ad3e9ac8e80401e168aecc315f); /* line */ 
        c_0xc722df10(0xe66fd7544d6e3dbbb8e36d09691317ee67756477a9abf64bd91dc626d72fe1d1); /* requirePre */ 
c_0xc722df10(0x0b29ccc0d8354a116a031c866afd846d2f8366171e269297e5342aadc745c61e); /* statement */ 
require(communityGifts[_msgSender()].exist, "User not exist");c_0xc722df10(0x72e847ba80b2e7592a7ff5fc808eb79c3e5f4afc9303e6af2884d5c0c023bade); /* requirePost */ 

c_0xc722df10(0x2105c1186001358e09012fd7cf99f5ba425a3f6663f75a93cd4d8fa0e3c15768); /* line */ 
        c_0xc722df10(0xcea48eb5ab70bfdccb0b5f5486c1fc9c0e90ba8454e37154635c42a34de8dca7); /* requirePre */ 
c_0xc722df10(0x3a12e572d24345bc92c994698cc30ff3b3a5032caff678fb8b91a18e8ddabce9); /* statement */ 
require(!communityGifts[_msgSender()].claimed, "Claimed before");c_0xc722df10(0xf717d2570007fb1a2d67fc20a79aaee3d23614850ec4bd5dfe7a9437da3ea0ae); /* requirePost */ 


c_0xc722df10(0xb7db88e8bfb29f3c705acfa8b5af15c489b4ca3fc7568ba53c7e385e5ba08317); /* line */ 
        c_0xc722df10(0x3e50347dbd873f7517c3d989ec6b2b0d8e980a392aba6063fc57340ff756e59e); /* statement */ 
uint256 treeId = toClaim;
c_0xc722df10(0x928dbfc9582b01e6002f60e82b1762adc1c11f3a169fa51e01f2e7e647fc4127); /* line */ 
        c_0xc722df10(0x33c4de82cb44252be5657c20cd6303747e741b9a171f31242bf714920029d0c6); /* statement */ 
toClaim += 1;

c_0xc722df10(0xee50b871774f3831a9ff13d3b4285c0d00b9819c3a8d91febcfd7b05a249fd28); /* line */ 
        c_0xc722df10(0x0d7bfb773df7078f2a912a9145c9e512823d91ae421da0c89e674a12b65f58a1); /* statement */ 
communityGift.claimed = true;

c_0xc722df10(0x73d014324bdaa4b055bfcbbdc11182f22948d6b7e0f5ff37120073be367f4a47); /* line */ 
        c_0xc722df10(0xdc49b4916395aba66eef292afa69ee651b3f9cf050bcb84a7a7cf6a90addd5f5); /* statement */ 
treeAttribute.setTreeAttributesByAdmin(treeId, communityGift.symbol);

c_0xc722df10(0x15342ff2b3748861f72f328152525b780cce042d2ecb55845bc98cdd6a2b6ee6); /* line */ 
        c_0xc722df10(0xcec50dcd6211b523c66d3e2fb947db185eed55f6385b2cb5034cbdaa264029b7); /* statement */ 
planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

c_0xc722df10(0x950278851506ad5957ddc65b4f8fc3818fd6834d18212ed517f1c923eb57582d); /* line */ 
        c_0xc722df10(0xfe47d0369e0b73d072d510f58efcd18a8e708681f445c12ffb2680454e20c3c3); /* statement */ 
treeFactory.updateOwner(treeId, _msgSender(), 3);

c_0xc722df10(0x1041adb7bc34ec417a826af9b163e4197023df3e461bca00dd8f42ff483801ab); /* line */ 
        c_0xc722df10(0x7cdc1a97e6421df5ebceb037b57bd8d4feeceb128311793114edfe9106ae9cc7); /* statement */ 
emit TreeClaimed(treeId);
    }

    /** @dev admin can set the maximum time that giftees can claim their gift before
     * expire date of community gift reach
     * @param _expireDate is the maximum time to claim tree
     */
    function setExpireDate(uint256 _expireDate) external onlyDataManager {c_0xc722df10(0x6ce7b56124256ad88d0f71a9407166b984e66e461e3f1ba95c973409302313f0); /* function */ 

c_0xc722df10(0x3f6a1453779b0102ab5e2ca497c694b521afc7a599f5336a22257b6873878a39); /* line */ 
        c_0xc722df10(0x1e355f6ea2f6bbf30cb6a5258ca19f690618caf9a89b2d17f07810cbfbba04b8); /* requirePre */ 
c_0xc722df10(0x441e70f40c7aab8fc7c0634fbf47f5825abc46d3672b1b428c6f24562f7c52d7); /* statement */ 
require(block.timestamp < expireDate, "can not update expire date");c_0xc722df10(0x941720dbfbde957b3ad1b8bee6d10fc3696d3f497d36e3964f174a8e445a024f); /* requirePost */ 

c_0xc722df10(0x97f7c2c8d6a3be40bd66c84c76dc6ee162f5de447b69df9521491d3334af506c); /* line */ 
        c_0xc722df10(0xff79eb3e9c2ee01ad17e908dfb30844e927fc0441ee75c1efc47438756879708); /* statement */ 
expireDate = _expireDate;
    }

    /** @dev if giftee did not claim gift, admin can transfer reserved symbol to
     * a giftee
     * @param _giftee is the address of giftee to transfer gift
     * @param _symbol is the reserved symbol is transfering to giftee
     * NOTE ownership of tree transfer to giftee
     * NOTE planterFund and referralFund of tree updated in planterFund contract
     */

    function transferTree(address _giftee, uint32 _symbol)
        external
        ifNotPaused
        onlyDataManager
    {c_0xc722df10(0xd759818caf7b290b55df78f8e80f7e24b5da5703c986cbf9c28d51ccce5e6b72); /* function */ 

c_0xc722df10(0x6a76c6f7e4283a56815d26d9a09087bd4cc19ad70d359bbd464cbb4cdd4348e3); /* line */ 
        c_0xc722df10(0x877d1af192894576f8600975b1559df956c7d371251b6dfaa2104825b89ec072); /* requirePre */ 
c_0xc722df10(0x818c51a4f8a39380c8484953e3ce81cb3321a1696eabbda322a89a671181236b); /* statement */ 
require(
            block.timestamp > expireDate,
            "CommunityGift Time not yet ended"
        );c_0xc722df10(0x386a79680ac255e7ce7d0a47bbe0665fd06528578e11462e7d6ac75494fec5d8); /* requirePost */ 


c_0xc722df10(0x85b3f646e4639292db009df88c588b5288a31728eee68764effb77625e028aac); /* line */ 
        c_0xc722df10(0xc3b8dfe1390ccb4b4ff47ece4132ecac4c30191237e256402593e276ce6b53e3); /* requirePre */ 
c_0xc722df10(0x08cc3621cef955ba891c11d26fee2a162a40bc64fc663e1a55503c4c65fed857); /* statement */ 
require(toClaim < upTo, "tree is not for community gift");c_0xc722df10(0xe8537230791d6a07e8ceca6eaf2cce75e3852f4462c9984d62242b22d864c9a6); /* requirePost */ 


c_0xc722df10(0xe7782dbc8e133318feaebe75f77b7a61a1d05be264badb9b7407e64e14598715); /* line */ 
        c_0xc722df10(0xb38cf5d6bd7dd6ff259004f06c3f50bf5dd96e4c778bc8a692fa00cff08d3b08); /* statement */ 
uint256 treeId = toClaim;

c_0xc722df10(0x7a9be75dd8b7c90fe5fa8ffa1773b1785baf482b33f68c28c23d458eb053309a); /* line */ 
        c_0xc722df10(0xd13ee656addc627339832284640efb58b242f0492a1b3b64d66abe4a6462aa16); /* statement */ 
toClaim += 1;

c_0xc722df10(0x224bf7762fbbc9113b55b8ae01223a77da15eb8d5c643f73bd8765f3166b2dac); /* line */ 
        c_0xc722df10(0x4445faca135b8c0f72112bbb487d2e7217c514cfb684b29ddabdc11ca7e5d7c5); /* statement */ 
treeAttribute.setTreeAttributesByAdmin(treeId, _symbol);

c_0xc722df10(0xa75f20416f3fba413bb1467acf4a7e916d4e2e944d11152158a5788eb016c44e); /* line */ 
        c_0xc722df10(0x25a1c5f536f4a9ca6a73f01a236052f2a649a25f0241b8e1768af14a26e50ebf); /* statement */ 
planterFundContract.setPlanterFunds(treeId, planterFund, referralFund);

c_0xc722df10(0x9d1d96717b1cc247889ddd609b3c390e3eda1c41b0d4f9316f00a3fb0b05ad02); /* line */ 
        c_0xc722df10(0x8154c7aba335c50740c1ad92b9b235199c15af9a1ea68a801b1b3d0d3f231a0a); /* statement */ 
treeFactory.updateOwner(treeId, _giftee, 3);

c_0xc722df10(0x7edb829450f5b313fd81cc3569e7a2b4743afba4af113efab2b009fd3ed81e1e); /* line */ 
        c_0xc722df10(0x804bd3eeffcd6eaf34b8984aab7d96b66d2104733f45982af1016655b1ca1398); /* statement */ 
emit TreeTransfered(treeId);
    }

    /** @dev admin can set planter and referral funds amount
     * @param _planterFund is the planter fund amount
     * @param _referralFund is the referral fund amount
     */

    function setPrice(uint256 _planterFund, uint256 _referralFund)
        external
        onlyDataManager
    {c_0xc722df10(0x11b80aa7e377445662dae9142b7882ba0740c2b4bdb3af15fa74f2570d124c86); /* function */ 

c_0xc722df10(0xcda3428087d0ab5bf179e25879e2d30b36a6158d62a282488d6a09ca5d68e0e2); /* line */ 
        c_0xc722df10(0x6a27289f56718a77e2ba641791eccd39dd54c50b7178ae00b002e3c515cfb6c7); /* statement */ 
planterFund = _planterFund;
c_0xc722df10(0x845babfd7bae50d467739fc4d8dd8b57e00cfcbea16b3fe8e96fc4f0c108644e); /* line */ 
        c_0xc722df10(0xbeec4b87b83eb869c0c5dbd9f6efd022081e6fde1e3a396e42d2b4377e170e36); /* statement */ 
referralFund = _referralFund;

c_0xc722df10(0x8c79af59d5572db1e935f5bd9e955e5e99e7f3f7835fc5d422f9a550cc1a6a85); /* line */ 
        c_0xc722df10(0xd8b18d624515e8a0f57186afab822e7fade259a4aac90ac9510bb66cc846d82f); /* statement */ 
emit CommunityGiftPlanterFund(_planterFund, _referralFund);
    }
}
