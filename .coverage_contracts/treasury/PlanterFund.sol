// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x2f673361(bytes32 c__0x2f673361) pure {}


import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/IAccessRestriction.sol";
import "../planter/IPlanter.sol";
import "../gsn/RelayRecipient.sol";

/** @title PlanterFund Contract */

contract PlanterFund is Initializable, RelayRecipient {
function c_0x1ae945e2(bytes32 c__0x1ae945e2) public pure {}

    /** NOTE {isPlanterFund} set inside the initialize to {true} */
    bool public isPlanterFund;
    uint256 public withdrawThreshold;

    IAccessRestriction public accessRestriction;
    IPlanter public planterContract;
    IERC20Upgradeable public daiToken;

    struct TotalFunds {
        uint256 planterFund;
        uint256 referralFund;
        uint256 localDevelop;
    }

    /** NOTE {totalFunds} is struct of TotalFund that keep total share of
     * planterFund, referralFund, localDevelop
     */
    TotalFunds public totalFunds;

    /** NOTE mapping of treeId to planterFunds*/
    mapping(uint256 => uint256) public planterFunds;

    /** NOTE mapping of treeId to referralFunds*/
    mapping(uint256 => uint256) public referralFunds;

    /** NOTE  mpping of treeId to planterPaid balance*/
    mapping(uint256 => uint256) public plantersPaid;

    /** NOTE mapping of planter address to planter balance*/
    mapping(address => uint256) public balances;

    event PlanterFunded(uint256 treeId, address planterId, uint256 amount);
    event PlanterBalanceWithdrawn(uint256 amount, address account);
    event PlanterFundSet(
        uint256 treeId,
        uint256 planterAmount,
        uint256 referralAmount
    );

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x1ae945e2(0x615dfa7be0772e11b54924bfab183c5a4a9ab84df3a7b13db27d847d6ed837ba); /* function */ 

c_0x1ae945e2(0x7e06715f73be824c97883111f24350039853b669a31de0a2e4522f0fd4d939a5); /* line */ 
        c_0x1ae945e2(0x2711a26748495d2e4f1884fb54f875e85911372ea2ec5f6da7f881e16c212a2c); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0x1ae945e2(0xeefa5209ef6f0763d12b68adea2e6c8c04d32cd47f37f02cc5f60cf5b07bacdf); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0x1ae945e2(0xd92868d6512b7604aaaae0d7c23de34b2224d2180509f1261c2dff187fb82c4a); /* function */ 

c_0x1ae945e2(0xfac9aacd78a63f69e5d9a7b1590397c598a309f0b02e68e7e6e8b95fe8a1390a); /* line */ 
        c_0x1ae945e2(0x66117354f000c78648e4e35c632decfcc53ff6682ae71dd1f2df7b60a6af837e); /* statement */ 
accessRestriction.ifDataManager(msg.sender);
c_0x1ae945e2(0xc5441c07265610aa591c43729cffd1609ad07d74d283f1918e8e4bad81abe095); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0x1ae945e2(0xaf7c1c73be3d605c542a044fd1b4c4d6c62b44d8ce1ae3972899d3e47ddd6bb3); /* function */ 

c_0x1ae945e2(0x1ab2bf24036a3c9388e01e97aa62e8b56f5a0583389605cba64a2fb470bb09bf); /* line */ 
        c_0x1ae945e2(0xae0e1afd5f28426d73c1b64f61659016a3b7e6701102830dd19588f646f33b64); /* statement */ 
accessRestriction.ifNotPaused();
c_0x1ae945e2(0x43a8cc315a97c1d85ba904003e273c57ed68faad9540a807613dadb55d412a07); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {c_0x1ae945e2(0x2e216b73388894512a3376641bb0eb568827f57973d2c88fd33b9557b945769a); /* function */ 

c_0x1ae945e2(0x8c2c26a684305bca63219d1a4531ee4b93684a53d54927f0e0e9c79629e0618a); /* line */ 
        c_0x1ae945e2(0xca7760aac29b19a6e18af7f9bdebafe899a92efd1af97de3832a19b47295d0f6); /* statement */ 
accessRestriction.ifTreejerContract(_msgSender());
c_0x1ae945e2(0x197b3b2bb3c742656342bd9698497afaa704580e1605a85aa3f5329e11861931); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x1ae945e2(0x5a05e2d8cd6ae3fff21fbb67ee30b72b5cc5849e5a846f442ca6330520f58335); /* function */ 

c_0x1ae945e2(0x39f4b72225feee6a58b07d3f894f5278ced4621ce015f5401d66a1070ce3c0d0); /* line */ 
        c_0x1ae945e2(0xc83fb52dd045f99aceb58e1bf95b8a6f14d9533fc4588b8c7dc01d8d9d63abb2); /* requirePre */ 
c_0x1ae945e2(0xa492cc44dd486c3ca22bedd9aa2da3cfe5f475170e3c3a8c90d27985cfb5fed5); /* statement */ 
require(_address != address(0), "invalid address");c_0x1ae945e2(0xa57fc9a5b57e11f275e6ac9e96ede91755e5f22589b23e93a21656f9bc14e8b0); /* requirePost */ 

c_0x1ae945e2(0x0180b42fed7f1ecc7cd2a22dea8bde3810179bcf586f54753cea7e131c27669e); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isPlanterFund
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0x1ae945e2(0xd7c6c6f2ec9a6826d24e827c384c8e6adf97d0bc335e0169f1b0fedd8b112e40); /* function */ 

c_0x1ae945e2(0xa716ece0d7f7af09ad930775046373ec097f20c19822f670c30b0609a31f15f2); /* line */ 
        c_0x1ae945e2(0xa97ddd8e4af6278c36f56bc0370ddc9e8a80bd6b8a8e21f57693257d540eff12); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0x1ae945e2(0xf389978df62d7c9f3fb4b4c5b59ec087fcfb20e10a32958e84ffa028091d499f); /* line */ 
        c_0x1ae945e2(0x30d5055243a63773b3b9decb13be0d42d1588fd9f4c3ed810b4ed98d04e340f1); /* requirePre */ 
c_0x1ae945e2(0xd62fefe3ef104443be41ce6f31cbb745eba3a30eb0f6e0d09064fee2005f2e5f); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x1ae945e2(0xefa6b2d51b11134ca10c97c495156fe0ccf172a2fe5efe8ddcf780fc97ef8f52); /* requirePost */ 


c_0x1ae945e2(0xedf648c990c530de03d5fbf3bc541b585bf6b6fa12176a5ebaea78a9c12bad8b); /* line */ 
        c_0x1ae945e2(0xd39147ac4396f9d0f6310653dbdf86de982acb6a9d386fafd90fa367ef3935c8); /* statement */ 
isPlanterFund = true;
c_0x1ae945e2(0xb777d86ae8804b9e113cfbc76134b882a812d90f2bb0a05a4659c08561129de6); /* line */ 
        c_0x1ae945e2(0xb67433819c6bfb90dc642141c3a9cb101e60d649d378a38dcab0aa527b0993d3); /* statement */ 
withdrawThreshold = .5 ether;
c_0x1ae945e2(0x5862a9d085cc87181b8df060277733c6be274ff303a2ad7a51f50cc7f5ff10d6); /* line */ 
        c_0x1ae945e2(0x5653ee5ab462d368c0668ac3825284d30d514ddea33386626214be42287b5341); /* statement */ 
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
    {c_0x1ae945e2(0x05afaa43040872c7b0652cc4c3269ee98bd6aca10352f93b9e96a610a7a93ad5); /* function */ 

c_0x1ae945e2(0x1d95bf8bca8b075e63f211ddd03c47ac0a7bb5c81d40ff1211409ff6daac9e76); /* line */ 
        c_0x1ae945e2(0x86d880a15e5e697b47704d3a0a74e78d2e98b0aaf949e29f94abbeacdefbea09); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev admin set Planter contract address
     * @param _address set to the address of Planter contract
     */
    function setPlanterContractAddress(address _address) external onlyAdmin {c_0x1ae945e2(0x9345ced307c63aedf3546ddf9e4838cf971834ddaf55e9cc640278aac0f693eb); /* function */ 

c_0x1ae945e2(0x3d439fc980f8caea13b4d6177d256e631834c5503cdb4eb5c78542cef6e0f496); /* line */ 
        c_0x1ae945e2(0x1ec4f509c9c415042f3aff40c4c06fa5b103aa126d837ecfa009eadbfa5033f1); /* statement */ 
IPlanter candidateContract = IPlanter(_address);
c_0x1ae945e2(0x61c74d2dde7a0a88cb3601477b4db595947ffa43dc97a928b53eda93d51f7d2a); /* line */ 
        c_0x1ae945e2(0x83c72b94d29ef1c27b26316899733ddb8742e45a07cdb391191c6d8a96b05844); /* requirePre */ 
c_0x1ae945e2(0xf4ae2be19905b43f5a34aa7b91a8f33f6875035b895c4a5ca37765146c6f29df); /* statement */ 
require(candidateContract.isPlanter());c_0x1ae945e2(0x6a3e62e20f8c164ab72630d173bdd0990c61b84eb3060b3ae86fb72687efff20); /* requirePost */ 

c_0x1ae945e2(0xc455c5f8dee396ec6baecc8e1d05e44d35c39ce55da72bc3e522c0e4c5733b3e); /* line */ 
        c_0x1ae945e2(0xb7559ef31e104e17c0b42c46974137d1606bac58ed147609b03a2fa166cce906); /* statement */ 
planterContract = candidateContract;
    }

    /**
     * @dev admin set DaiToken contract address
     * @param _address set to the address of DaiToken contract
     */
    function setDaiTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x1ae945e2(0xa017634711dd128d073d3b22445c53aa64f2551d987f70103956d72edff68dac); /* function */ 

c_0x1ae945e2(0x434caf4933d1da7c8918ab13508292e410ab525deda73dee3b90b20416386ac5); /* line */ 
        c_0x1ae945e2(0xb19a3ae56633403e6a098f7869360a3ad261665e9d74b12a31c5285fcda0b7d4); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
c_0x1ae945e2(0x0e1a56c7c2d43fedd8c68c29bd6f95d2e5ccc2b405f5c79b0a29f52effbb6d24); /* line */ 
        c_0x1ae945e2(0x40a68b032ca371f8dc74642e7dd69997821b8ce6e8108ce1dd72e2b099446989); /* statement */ 
daiToken = candidateContract;
    }

    /** @dev admin can set the minimum amount to withdraw
     * @param _amount is withdraw treshold
     */
    function setWithdrawThreshold(uint256 _amount) external onlyDataManager {c_0x1ae945e2(0x4cb0ad955394d596862f80f5eb5e3e10b02ae775578bc7caca4991f6492501fc); /* function */ 

c_0x1ae945e2(0x560a94987bb54533517206f8c6e1a61f13bfe29140320ecc6ca36caca6aa6f54); /* line */ 
        c_0x1ae945e2(0x3456a09758adcce1d99e112b2c90dec2a49ad3285af645124a33206d47ec0116); /* statement */ 
withdrawThreshold = _amount;
    }

    /**
     * @dev set planterFunds and refferalFunds of a tree with id {_treeId}
     * and add {_planterFund} to planterFund part of totalFunds and add
     * {_referralFund} to referralFund part of totalFunds
     */
    function setPlanterFunds(
        uint256 _treeId,
        uint256 _planterFund,
        uint256 _referralFund
    ) external onlyTreejerContract {c_0x1ae945e2(0xb1a847d13de400b4369a6aadf439fdc7f69de3c5436f0028c234c66eecee393a); /* function */ 

c_0x1ae945e2(0xc70cede9967c053737f48d8f4ffc96fb72b95b44a8194c6247f59fade4d81260); /* line */ 
        c_0x1ae945e2(0xc46a37ec2fb05df7e0b666efc484c45d91c6cb797fccbc2c7476e8feeaf78a98); /* statement */ 
planterFunds[_treeId] = _planterFund;
c_0x1ae945e2(0xdcc58af917cc0d7d57de924b490bee74d8076585d916e86330ec862866133749); /* line */ 
        c_0x1ae945e2(0x670ab0c084021d768547e6a7fffe42717fe3f40cedf3379d7e4bd9b65ff3a81b); /* statement */ 
referralFunds[_treeId] = _referralFund;

c_0x1ae945e2(0x29ec3dad8cf1e45cd4f19791baba0f58875815257208a5a461e1819229502e48); /* line */ 
        c_0x1ae945e2(0x5beb338bd2a4e828a7feee6ab1cd2aa25bfbb2e6a7b67b73643176fb98d475eb); /* statement */ 
totalFunds.planterFund += _planterFund;
c_0x1ae945e2(0xd9bf74064f1615dfac155df03ab3b945f4340d0da0f8ee42df917bf27a238885); /* line */ 
        c_0x1ae945e2(0xe0ba50dd070a715a7a111833ce99931e230fbee745eaa6c6821237007834ea5a); /* statement */ 
totalFunds.referralFund += _referralFund;

c_0x1ae945e2(0x8e88dba6f056010a4d31f3f7ea6e0650beb5994c2ad9e42c68b670fc7be08b21); /* line */ 
        c_0x1ae945e2(0x0ff34876feb3336ec5b6d962584b4866cf840da1059e713de9c15745cbc592cf); /* statement */ 
emit PlanterFundSet(_treeId, _planterFund, _referralFund);
    }

    /**
     * @dev based on the {_treeStatus} planter charged in every tree update verifying
     * @param _treeId id of a tree to fund
     * @param _planterId  address of planter to fund
     * @param _treeStatus status of tree
     */

    function fundPlanter(
        uint256 _treeId,
        address _planterId,
        uint64 _treeStatus
    ) external onlyTreejerContract {c_0x1ae945e2(0x3e20242fdd29383ae317905cac1900f7b466128c6ffb54dfd744a3fd6fca1c2b); /* function */ 

c_0x1ae945e2(0x50e83a7ab10cd7704a8f740717897786e06bb6efeccb41e3f05978141a540d2c); /* line */ 
        c_0x1ae945e2(0xba50c49852ff7adc630fa8aa3fdceabd7a3299e0146ba8c9a2bd994e0f6a1c7e); /* requirePre */ 
c_0x1ae945e2(0x57680fe16035e93dddb18ef614ccb92927508d5739465280fa06831db62a46ee); /* statement */ 
require(planterFunds[_treeId] > 0, "planter fund not exist");c_0x1ae945e2(0x17eb38abb8f4d596b3bd539e0844eebc6d75691c67cde8e599b58cdf255759b8); /* requirePost */ 


c_0x1ae945e2(0xe5cbe3aa26cb655e82f5b5b29d3dd5ea89b9d34f47946e4789eee33025e4d987); /* line */ 
        c_0x1ae945e2(0x973964947d83bc9751afd80f0f2ac4988a1502da4f717f1847173886b42b5a46); /* statement */ 
(
            bool getBool,
            address gottenOrganizationAddress,
            address gottenReferralAddress,
            uint256 gottenPortion
        ) = planterContract.getPlanterPaymentPortion(_planterId);

c_0x1ae945e2(0x5029d0e1426ef87220f7386918c73249bd5b12f72c4841248cb6c041c4e4f4f5); /* line */ 
        c_0x1ae945e2(0xc1d43fb0a355e3948a277295b1b0fd91f03c3180fac233b644882deb3b29740b); /* statement */ 
if (getBool) {c_0x1ae945e2(0x2868930fe28148d116e12373e60b6423f02149ac08a0d629819f3cdc8e9fc1c1); /* branch */ 

c_0x1ae945e2(0x42c1eb5da52ea05afe059101ca208532992923623ca2c0a34292e1f326040328); /* line */ 
            c_0x1ae945e2(0x35ac4937b76fba3a62da12956197da7e94cc2fde70b4a451c05003d8efa65d78); /* statement */ 
uint256 totalPayablePlanter;

c_0x1ae945e2(0x4de639b4d9c2c3500b3c9e028625e7714f4869a4e8ab2814ebb586c639a66193); /* line */ 
            c_0x1ae945e2(0xc31b7b92562521b9756c6a49d88261fec2bd46db1c6aa5e92b228465159cc5d9); /* statement */ 
if (_treeStatus > 25920) {c_0x1ae945e2(0x5b05d1282d86ac7bc88e55933a948404405fa5c464aedea627b418afd924663d); /* branch */ 

                //25920 = 30 * 24 * 36

c_0x1ae945e2(0x10400dade04e2d330cbf472367625379b4f891d7b4bc2c2e6fd0e2586396230d); /* line */ 
                c_0x1ae945e2(0x0d6543a32ee15ec9215c447c6af010bc320d0bd4332558918f487dec7e34097a); /* statement */ 
totalPayablePlanter =
                    planterFunds[_treeId] -
                    plantersPaid[_treeId];
            } else {c_0x1ae945e2(0x91f1052b4ec6e5c6bc4eba0b67918766b558c9132e67e409d7fb6ace4c083e68); /* branch */ 

c_0x1ae945e2(0xfd66b8412aaf1e95332c97f9bd96212d0b3cf88c1776471fb59bebd0468de07e); /* line */ 
                c_0x1ae945e2(0xb94f80d6672dc5b83eb1dd8fcce385951025bf05118056a1b287ca7341fe8bd3); /* statement */ 
totalPayablePlanter =
                    ((planterFunds[_treeId] * _treeStatus) / 25920) -
                    plantersPaid[_treeId];
            }

c_0x1ae945e2(0x93c148224ee2d1f5eddf1878949694ecf7e02d1a02a9f89322a7222c52d92b8f); /* line */ 
            c_0x1ae945e2(0x62aec339f3fcc076c941b6c0477a943b9ca17c31307738d2bda57b4c3be6ee98); /* statement */ 
if (totalPayablePlanter > 0) {c_0x1ae945e2(0x3a90d1fb7fdb233c750aba9d9f1cdd1ae8f28e36a7bc431bae3a934dab8ac9d0); /* branch */ 

c_0x1ae945e2(0x507a9728c9b5cd2897f69a525a45106c162a2c1ba12182fcdf179cfbb61700a0); /* line */ 
                c_0x1ae945e2(0x0a1856f7d02da8ca0438bb4d0180bd978f683d2cb6997a1c6c5075ac70a9a237); /* statement */ 
uint256 totalPayableRefferal = (referralFunds[_treeId] *
                    totalPayablePlanter) / planterFunds[_treeId];

                //referral calculation section

c_0x1ae945e2(0xe50504ae68ccbc4d5704ee9d8733e45945b5e769dad741e852ecc1b345589fad); /* line */ 
                c_0x1ae945e2(0x24756daefe4d3fc2bceb0b9d3cec3535b35c92e5a58b3e96cb7b8ee4e59f81c3); /* statement */ 
totalFunds.referralFund -= totalPayableRefferal;

c_0x1ae945e2(0xa4ba9e03dcd932a5786e09af5c770f3836fa28af412c9cbe8bc8aa65360129b2); /* line */ 
                c_0x1ae945e2(0x7ec8ac6545d0888b5887519e279703bf4a6bc12ff60efc4ec1f31e0037c4b7df); /* statement */ 
if (gottenReferralAddress == address(0)) {c_0x1ae945e2(0x7f2b51ba6025f78ad53ec99b687b072d08e46d5c85684bcc2fe847f7bc979862); /* branch */ 

c_0x1ae945e2(0xd1039a0eac18b24fa184be1308b1a21c3c65fc7fc66dc7ea97216a497c21ed1e); /* line */ 
                    c_0x1ae945e2(0xf06d30266db5f8c55f463ec6de837ead393071a9168a383c5ee12b53c9167a95); /* statement */ 
totalFunds.localDevelop += totalPayableRefferal;
                } else {c_0x1ae945e2(0x8e3f18021f8d30c76cc6313a683eee7b9e5da98823d79f3a273980b740131917); /* branch */ 

c_0x1ae945e2(0x4009033d6b4f0ded8df6ffec843b12142f9d19741c6999770f9724972ec39977); /* line */ 
                    c_0x1ae945e2(0xb0d090a043537455e84fd73064fef33cfcb26069784ca3dff9717d8643fbac5a); /* statement */ 
balances[gottenReferralAddress] += totalPayableRefferal;
                }

c_0x1ae945e2(0xe76bd2808c1de8c356994bba877bb2d629d9c6fd59323a6b6198d35fcc393bb7); /* line */ 
                c_0x1ae945e2(0x691504507091f1952d604b8799554e0d5c199f938e5fee6cf0f1fda048c58ea1); /* statement */ 
totalFunds.planterFund -= totalPayablePlanter;

                //Organization calculation section
c_0x1ae945e2(0xdd92d12b0936f4159dc66fc501e8cdefc9ec198a0c19a6fb2b54314cd9d88344); /* line */ 
                c_0x1ae945e2(0xacbf47e06f2e15cd04c924cad0ac35c3b9d254250eb23f48c7ef878f1a7b0ee3); /* statement */ 
uint256 fullPortion = 10000;

c_0x1ae945e2(0x381205b467b0401587bb98b56ed8e6c9f9135232f358765789d8795fb0e48fed); /* line */ 
                c_0x1ae945e2(0x85154fe7c8102f621adebec0584e7a9c617fc069006662407313f705a6ce6afc); /* statement */ 
balances[gottenOrganizationAddress] +=
                    (totalPayablePlanter * (fullPortion - gottenPortion)) /
                    fullPortion;

                //planter calculation section

c_0x1ae945e2(0xf2a7cdb880012292a1f5a316b2fef7fd1e943e6e05d9fcc770d2a36be5459fec); /* line */ 
                c_0x1ae945e2(0x145b150a3418fb2cabd657be3bbe5f427a9e725a5f8045a2f3fc7cbaa888948f); /* statement */ 
plantersPaid[_treeId] += totalPayablePlanter;

c_0x1ae945e2(0x4b79ff475f9b2c94bd8f4b17f006a9f8f1e376ae66af31d26340577b2e4e2e24); /* line */ 
                c_0x1ae945e2(0x38bef277e1845cbb35c4d198ad25f26cbe36f462b768c574841b1c99f65ef2d8); /* statement */ 
balances[_planterId] +=
                    (totalPayablePlanter * gottenPortion) /
                    fullPortion;

c_0x1ae945e2(0x01d7b868f0ccdac1422e5a9a4a7af8c6f09a166b71316f6f38fb22615832a4b8); /* line */ 
                c_0x1ae945e2(0x79f09dfe4d99e91b9355e5c42c2cea1dd4caa982d850d780c6b7b5a5d67e419e); /* statement */ 
emit PlanterFunded(_treeId, _planterId, totalPayablePlanter);
            }else { c_0x1ae945e2(0xc3854da039c9aebfccc546fa8355fa0af16e8ad4bde0752e5c9cdb1af8f540df); /* branch */ 
}
        }else { c_0x1ae945e2(0x0fbb4161819f38a95e8a94801f4aea293127207abedb75b0b46aea505430b794); /* branch */ 
}
    }

    /**
     * @dev planter withdraw {_amount} from planter's balances in case of
     * valid {_amount} and daiToken transfer to planters address (to msgSender())
     * @param _amount amount to withdraw
     */
    function withdrawPlanterBalance(uint256 _amount) external ifNotPaused {c_0x1ae945e2(0x348d38bf4d38a5f1eba76e9cd6bbf14bb81e0e55f9993b3cb7b71e1f8356cf2e); /* function */ 

c_0x1ae945e2(0x8cd1b40e57f3dd33800db56a82d3f3f43cedadd2c3fa88556209fdf0b93cdcdd); /* line */ 
        c_0x1ae945e2(0xd66730476bb064550395b12cab93ee0e5420d4049fc67fd20862859e2cb7ce9d); /* requirePre */ 
c_0x1ae945e2(0x38dc9af8b99e49dc3fb7e52adebae3a7b667daae849945d008065970d84a86a1); /* statement */ 
require(
            _amount <= balances[_msgSender()] && _amount >= withdrawThreshold,
            "insufficient amount"
        );c_0x1ae945e2(0x7e0229db769e92d12f659d61639066664c541d5f39af18a030075e3810d251c7); /* requirePost */ 


c_0x1ae945e2(0xd4fbf6038e49a66dd3a8f5a8920f1940965b7114dc6dce90f54619c2313add62); /* line */ 
        c_0x1ae945e2(0xf71815db98782a98ee5133c58f2ddd1e39c0e5704e9f38e332634a093e1b7eb5); /* statement */ 
balances[_msgSender()] -= _amount;

c_0x1ae945e2(0x6b699923eaca13b9f7dcc54f695b541226c44722012bd686240435c34439946e); /* line */ 
        c_0x1ae945e2(0xc433d1122e023a66f3cd686b4d2f4e7dbb7e9bf6831384ce1e55e0aeeec91303); /* statement */ 
bool success = daiToken.transfer(_msgSender(), _amount);

c_0x1ae945e2(0x6d526fe1af737b1ca9cc7b06021ee63d7bc3eb8e289e13f01123fc3d7a5aaaf7); /* line */ 
        c_0x1ae945e2(0x4de9bef0fb5887d83ba243d3b1957c15aa2daf3782cdc33d21d4e994c408775b); /* requirePre */ 
c_0x1ae945e2(0xa12e7577608ec1458a01173f3a99db8d530a020fa79bd6872654dd766d145b10); /* statement */ 
require(success, "unsuccessful transfer");c_0x1ae945e2(0x10443cf90e416fa726dc032626cd63fe98cef54aa8e80bd8674d371d559f06f0); /* requirePost */ 


c_0x1ae945e2(0xe02ec8385f990f9664142ca4dccd0f8e42fdaf94dfdacef2d5b3aa9087547793); /* line */ 
        c_0x1ae945e2(0x8c9621cedfb7568381b232717f51bc6849a26adfac2fbbe82010db93cf1fe0e0); /* statement */ 
emit PlanterBalanceWithdrawn(_amount, _msgSender());
    }
}
