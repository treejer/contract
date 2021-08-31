// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
function c_0xf07fbe48(bytes32 c__0xf07fbe48) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IWethFunds.sol";
import "../treasury/IFinancialModel.sol";
import "../gsn/RelayRecipient.sol";

contract IncrementalSell is Initializable, RelayRecipient {
function c_0xbcb12c3d(bytes32 c__0xbcb12c3d) public pure {}

    /** NOTE {isIncrementalSell} set inside the initialize to {true} */
    bool public isIncrementalSell;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFunds public wethFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public wethToken;

    struct IncrementalPrice {
        uint256 startTree;
        uint256 endTree;
        uint256 initialPrice;
        uint64 increaseStep;
        uint64 increaseRatio;
    }

    /** NOTE {incrementalPrice} is struct of IncrementalPrice that store
     * startTree, endTree, initialPrice, increaseStep, increaseRatio values
     */
    IncrementalPrice public incrementalPrice;

    /** NOTE mapping of buyer address to lastBuy time */
    mapping(address => uint256) public lastBuy;

    event IncrementalTreeSold(uint256 treeId, address buyer, uint256 amount);
    event IncrementalSellUpdated();
    event IncrementalRatesUpdated();

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0xbcb12c3d(0xaada80870ce7e2633d57f08df1a6c60aef9542f2aa745dfec479001a46091db0); /* function */ 

c_0xbcb12c3d(0x4c4803b67c4d0ee1d862d0b7eb6433b1000105cd9f0e788c0dc06422d8b0f21b); /* line */ 
        c_0xbcb12c3d(0x30ad38ed2a7ecf2295cfc514c5e1ba86c8534a0ab9e7af2617da334ed4899b4d); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0xbcb12c3d(0x1bac2a6b07434fc84ea9d5361fc9ec3142d9b3a5b4d300a5cdcd00d29f58b41b); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0xbcb12c3d(0x8733183129ca3dee788da1e9b5d3f53954816fad8619b36ccf83dd88e87cd509); /* function */ 

c_0xbcb12c3d(0xdf8635e0ce2660d02fe0a54ee78a688097de5c9b5892826be4d83e7f4af56aae); /* line */ 
        c_0xbcb12c3d(0x51eb648a07af791e5d8b4708d6eebc5f03a070a65cdb61e630e3a61cb8b417cb); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0xbcb12c3d(0xce37193b1a3e7701cb1883cab77d656f256f1f688844417283b7e75c84608309); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0xbcb12c3d(0xf064592dbcbb3e79202d430cda3092f535bb7c7a68337a9ee37fb81b0f29cd46); /* function */ 

c_0xbcb12c3d(0xa4733e8b5da85323a6441fa6c1427231ec13faab77fdf5ce8ce315d615c4a00e); /* line */ 
        c_0xbcb12c3d(0x0e6d46292e51a1b4c4562ccbce6e6b006725ee2f1caac9be9570b29c959e1d96); /* statement */ 
accessRestriction.ifNotPaused();
c_0xbcb12c3d(0x25b0c97ab84b844e63ec1787ac2c3c6ea755c1b8bfcca017d5b752ff150f785e); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0xbcb12c3d(0xa09c05a895fce26eb918729a551f8633dc3963841d782921987dccdf1073765c); /* function */ 

c_0xbcb12c3d(0x6de33c1b741a0aaa6311c8aa6dd58da996b170c19101aec4de17af7e5ecbdbad); /* line */ 
        c_0xbcb12c3d(0x614efaa266ebcc561c59e6dec33adb3d730cf5ff8901cdf82ee779e13f322c40); /* requirePre */ 
c_0xbcb12c3d(0x007a29eb780ba27dd1b7e48569c74ff4c12a4a0def15c0ee45f1a653c18e7a5b); /* statement */ 
require(_address != address(0), "invalid address");c_0xbcb12c3d(0x49eeecaf4e82170982b0d04433779d9328537929c8d1ed6c69d3495a955aea86); /* requirePost */ 

c_0xbcb12c3d(0xc461c849c5c14eba736b12f5b69e3d2a884e84f0b48ff0d2c651788415245c8b); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isIncrementalSell
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0xbcb12c3d(0x148ce58fc95d109074bb2caca72ac3f7b3241f69ea49d63e1c97e4f3a2e8d31a); /* function */ 

c_0xbcb12c3d(0xdfba84e166564960abffc68b40a58b738d23994fed3cedfa7267d009ce7d8b3c); /* line */ 
        c_0xbcb12c3d(0xccb993e5e29f022ea17f0b3f287da3dbf0cdacaa59a14e7cf18bc045646bd720); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0xbcb12c3d(0xcb562b90e8e68a78efd553820036b2c4db6142c3f33c3b8fb812ebf192d9fa7f); /* line */ 
        c_0xbcb12c3d(0x503fc8c62e1fd150976dec52a9de94f201b838a0f793c088d20ebc494c37fe85); /* requirePre */ 
c_0xbcb12c3d(0x8bc9723af42ac80ed0bd572b6fe80273a1f404bc0995d236f8ddf2c875eb8401); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xbcb12c3d(0xe69d7266076e89b294464fe26bd8c7e11790016c50537796584ba436323d7cd9); /* requirePost */ 

c_0xbcb12c3d(0xdb784f496a4f742c31b7071097d3cab07837e29fd0fc950f606c82b463d9758d); /* line */ 
        c_0xbcb12c3d(0xaaa22a37dc63b8ca374d3b9449f20b54c0af8855d56dfb0870435739c4833986); /* statement */ 
isIncrementalSell = true;
c_0xbcb12c3d(0x3720eab7762d7f07fc803e81281f45b49bca776e3144ecacc573d57dc5717573); /* line */ 
        c_0xbcb12c3d(0xa5b96aba713b851133c65b6331fdf3ef6414237bf6c027e450dc976bfd7d0b56); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xbcb12c3d(0xcbc524f9dc94fca7857b75ddd76589825eebf866165f2186bdc03e6c4b6c46d7); /* function */ 

c_0xbcb12c3d(0xbbdedd790560ab4ab3f157b896d50cb5f9519cc9ccd9850d29096a5c4a373c26); /* line */ 
        c_0xbcb12c3d(0xefb9e3d2201e9cc2ed578d05a681a7bc62a946a4295cecb203f19b24bb722c4e); /* statement */ 
trustedForwarder = _address;
    }

    /** @dev admin set TreeFactory contract address
     * @param _address TreeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {c_0xbcb12c3d(0xf6df6f78e7fec90fc16413b5a8b0dcf0d9bddd9775570228dae08b46d36ed3a1); /* function */ 

c_0xbcb12c3d(0x195f63bc3ef00784407ac18b9cc5ce7fd0190c616ec24e5775a05e46e6a551d0); /* line */ 
        c_0xbcb12c3d(0xd5173e7683da6f524b40eff6c570d391bffc1739b14124f166e66661e9492412); /* statement */ 
ITreeFactory candidateContract = ITreeFactory(_address);
c_0xbcb12c3d(0x95370af9a42452fe87f3bd0b932f3ac01c43fcf3b1ef6ef51f8ef3e57085b538); /* line */ 
        c_0xbcb12c3d(0x1f19992f1cf9eab092b1d45dee6f7ceb3d0f35ec56df0583e109eb9ccbe0ddf6); /* requirePre */ 
c_0xbcb12c3d(0xfe93f43f747f079d5b238ed5fd6c6e73a79d01ac6b7870d0aaf1114d99d29bfe); /* statement */ 
require(candidateContract.isTreeFactory());c_0xbcb12c3d(0x7650bc5291d8cdc1110488b834bfa2dc4a02bc31e53b9dfc2680344ba2f1b53e); /* requirePost */ 

c_0xbcb12c3d(0x36dcd80041039b508aa07f717e2d802d25613ec63a73406be60c2b5fe4e7e73e); /* line */ 
        c_0xbcb12c3d(0x10082b3d807a63dca5e0c40235d2b6886ba6ac53334dcafc882647f1c43ac798); /* statement */ 
treeFactory = candidateContract;
    }

    /** @dev admin set wethFunds contract address
     * @param _address wethFunds contract address
     */
    function setWethFundsAddress(address _address) external onlyAdmin {c_0xbcb12c3d(0x9785209bf1a47dbfdd9cbca6fd3f76bf08b9244dbef832262ac3ac9080b71380); /* function */ 

c_0xbcb12c3d(0x6b6003cc79a3ffffb27a903a2e8041a32b0e16a5bc65f9414a8e674443fc8036); /* line */ 
        c_0xbcb12c3d(0xb657482cac71b94310ce700a9304b08b0a1559cb21747e49b4efe24be776f4a3); /* statement */ 
IWethFunds candidateContract = IWethFunds(_address);

c_0xbcb12c3d(0xfec38d38bac79a831f05ffa14b79c180335a777f3e8087b3f65528eb0ae8d8b3); /* line */ 
        c_0xbcb12c3d(0xc8ab4f96d8168afa5c436b4fe28ae0edcc5e981ba189114efea8875e61d20a2c); /* requirePre */ 
c_0xbcb12c3d(0xffdc8b816e25c0b0f0252ba4a7934b7082dcb68c2212facaabb334cb42e7865f); /* statement */ 
require(candidateContract.isWethFunds());c_0xbcb12c3d(0x9b6dc5be02fbbc89155553862874062d538570c474724a8d17e420ffe4b2a243); /* requirePost */ 


c_0xbcb12c3d(0x551b50636da46c730fbaa95020997a1ca9dbc6075e7619d68b9b08259ca8bd54); /* line */ 
        c_0xbcb12c3d(0x83041128b80d1bd192d672a3282605d6e48f92fe6d8f0c2696214157d4718982); /* statement */ 
wethFunds = candidateContract;
    }

    /** @dev admin set wethToken contract address
     * @param _address wethToken contract address
     */
    function setWethTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xbcb12c3d(0x6512a49c2dac6ede155d52f882b32a434a1c7ffc5e7689a2fcceeb4e9a79c8e2); /* function */ 

c_0xbcb12c3d(0x03c7010c05c491649fca8b6c37ac35cfe628a862a2fd7a7fc5d0f8f95b497f78); /* line */ 
        c_0xbcb12c3d(0x1c2bfdf90ff0614727fbda0742e659ac23530af904ba6c46587e4fa4185a8165); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
c_0xbcb12c3d(0x7bb6ecade7d4104b3c97a8b603c9d287da339f4e3f67af7ebd2a4d64b794e945); /* line */ 
        c_0xbcb12c3d(0x9e07788c776aec1e595d95f0ee4648988e28b5e6c15761dbd915916421ecc348); /* statement */ 
wethToken = candidateContract;
    }

    /**
     * @dev admin set FinancialModelAddress
     * @param _address set to the address of financialModel
     */
    function setFinancialModelAddress(address _address) external onlyAdmin {c_0xbcb12c3d(0x40e7f4f1564e7b487467e3615e24d517d78c277e3216ab2f19442e171f9e4864); /* function */ 

c_0xbcb12c3d(0xe18dc59b9d4e25f62f48b7340195f7d604a4c1a25fd3aeaa39fa3c1f40826e64); /* line */ 
        c_0xbcb12c3d(0xf09aa85ca5fe0b30651a14878ef3b3c39519d4e2664f1d3db9fa7f9cf3f7ff93); /* statement */ 
IFinancialModel candidateContract = IFinancialModel(_address);
c_0xbcb12c3d(0x0b17dd96e7da731b8dff990c5ffc2f15b7c695bae0616275ee07e5a5e9078e72); /* line */ 
        c_0xbcb12c3d(0xe7645a8320e046a6e6c09432d93e50541091e2ef2ea21dd88b87aaeca576f61a); /* requirePre */ 
c_0xbcb12c3d(0x43615e516fe47a9a86e6a9b9bbe73f873b387e9e53226334b7709e770c1c2d8a); /* statement */ 
require(candidateContract.isFinancialModel());c_0xbcb12c3d(0x59974876dcc6befb0108e458c37c5cd8a96ea9fdb7389863e5cf684e042f0d08); /* requirePost */ 

c_0xbcb12c3d(0xfcb6e708581f76e6ba4cd8fa3893f723f833d17ce060ca86eaf43084acf9e4a6); /* line */ 
        c_0xbcb12c3d(0x9c2f98b18b3fbfd0c04e829b8a497d74ce76b8122a91a1a3a4678736254cb388); /* statement */ 
financialModel = candidateContract;
    }

    //TODO: ADD_COMMENT
    function freeIncrementalSell(uint256 _count) external onlyDataManager {c_0xbcb12c3d(0x95b094e99c9f39ebcb6fbe9dd4ba188fdad016ea9e86b3ff6141d7879f34bb79); /* function */ 

c_0xbcb12c3d(0x3e83fc123057d27e87c5072a6320ecb9a1256fcb1a3e8744f0cd6ea2c3fafce7); /* line */ 
        c_0xbcb12c3d(0x929a74012101d0bfbf8456f6803f567ed68b9b5b78079a4508782e4302519e53); /* statement */ 
IncrementalPrice storage incrPrice = incrementalPrice;

c_0xbcb12c3d(0xdf83ab8b48583f8129a8fbc1bb1a24ac009960d3c2a9df6588a2efa61e279dc5); /* line */ 
        c_0xbcb12c3d(0x718bbc4d6e2101a642618b009d6fc52da17f8ac5e2288050fde40de85b1966b3); /* statement */ 
uint256 newStartTree = incrPrice.startTree + _count;

c_0xbcb12c3d(0xbc1d224c99b8b0446223921041809361e77275b5890705eb60176f696b0e0250); /* line */ 
        c_0xbcb12c3d(0xb8eddd559b1c380710c9c8c7148d1b92ab33b8b1e6af8e6627803f93af139f0c); /* requirePre */ 
c_0xbcb12c3d(0x0c08a6fe43ce5726f3ff1d13e4038753a6e60883513dbad87f3498ee800de0c9); /* statement */ 
require(
            incrPrice.increaseStep > 0 && newStartTree <= incrPrice.endTree,
            "IncrementalSell not exist or count must be lt endTree"
        );c_0xbcb12c3d(0xb08cac53438689a1c5830fffdc332a783c3cebf8357f074641863521c5936be5); /* requirePost */ 


c_0xbcb12c3d(0x5cdfeb07954f72d1101492fb02e6b83a1c1c41711b69bf1ba7acee9f71cba92e); /* line */ 
        c_0xbcb12c3d(0x789be83bdcc19d13592cec39c860ea3c5b76e695b5cdcfacdc158d631defdba4); /* statement */ 
treeFactory.bulkRevert(incrPrice.startTree, newStartTree);

c_0xbcb12c3d(0x53f6d3582d054085b0818ff1b98fecdb7a3b6aaacbdeba877476fcc6da81b52d); /* line */ 
        c_0xbcb12c3d(0x0214afce7a9e6cf04e7a9a0fd71bee5890d809f0672c753b7ab709e528cab40d); /* statement */ 
incrPrice.startTree = newStartTree;
    }

    /**
     * @dev admin set a range from {startTree} to {startTree + treeCount}
     * for incremental selles for tree
     * @param _startTree starting treeId
     * @param _initialPrice initialPrice of trees
     * @param _treeCount number of tree in incremental sell
     * @param _steps step to increase tree price
     * @param _increaseRatio increment price rate
     */

    function addTreeSells(
        uint256 _startTree,
        uint256 _initialPrice,
        uint64 _treeCount,
        uint64 _steps,
        uint64 _increaseRatio
    ) external onlyDataManager {c_0xbcb12c3d(0xae53db4d574505ccfd40793d541dbf770fab5ed86a058ff5d82ba24601dc2bc4); /* function */ 

c_0xbcb12c3d(0x0a870e30109cc7d5ccabf76bf651706740b0416b7e6cc90a45d3f747fe4de377); /* line */ 
        c_0xbcb12c3d(0x1cd7046d94d6b6d70cc320caf3636c7401cc2efaf3e10f6d95994ce4a0db0bf9); /* requirePre */ 
c_0xbcb12c3d(0x80571faab9c3e45736575dadf1e2761050b56b11e2616da69747e2b27a973387); /* statement */ 
require(_treeCount > 0, "assign at least one tree");c_0xbcb12c3d(0x0ac6427279fa549f7954c29b2fbca6078e75704421dd50a79c3cdb1ed61289a7); /* requirePost */ 

c_0xbcb12c3d(0x82ccbc904dd0983c65530d3634f1915501eed726c4e6758431c3344a7a275fa1); /* line */ 
        c_0xbcb12c3d(0x57099590c9919220df60cd66664876467d2cd020552ae767613eb0d62c3cf21b); /* requirePre */ 
c_0xbcb12c3d(0xe0b75ec4769d4e7c04da54fd965e4faf3340d31dc26d72b4e35984a8c1e897a1); /* statement */ 
require(_startTree > 100, "trees are under Auction");c_0xbcb12c3d(0xdb3c3315a87c8290e90b0fc4267a845510012bec9107522d6726e66f0c78f492); /* requirePost */ 

c_0xbcb12c3d(0x47529ed53e0b27f9ef8406678593c2d1515f5f6e9d4b6ed858b3c8b211222856); /* line */ 
        c_0xbcb12c3d(0x06289637d8d9418d7b339c44b029c7e07f645b95ce8ad62032b7cb928a6e70a4); /* requirePre */ 
c_0xbcb12c3d(0x77b70b227938e1020069b380edbb64c91b088d084b931f7590a0dc31897da149); /* statement */ 
require(_steps > 0, "incremental period should be positive");c_0xbcb12c3d(0x8c7fdd4790a06299fa52425e56737f9bdaad3d57731f01338c958824e30d49be); /* requirePost */ 

c_0xbcb12c3d(0xbc449b8f43f2ccf34cac71efccf84aae9c6e45c00005f0e7b9877435d4704720); /* line */ 
        c_0xbcb12c3d(0xe6740be671fbf188c0d8f67660d0f2aeef18f398a1a7c7efbdb9a6dc37d03078); /* requirePre */ 
c_0xbcb12c3d(0x982e6dd864ed258daf3a49ba7dc4c8ac23ace9727aebf509f2b54107e9885e9e); /* statement */ 
require(
            financialModel.distributionModelExistance(_startTree),
            "equivalant fund Model not exists"
        );c_0xbcb12c3d(0x4325db3372b8b06cdcb9c3234af6451cfd3011bd8304c9bc972abb04af5e1202); /* requirePost */ 


c_0xbcb12c3d(0xfe17c093a58932689008f9646f75fe59ef9dbcdd8e73cb0ef372d023ffd339ce); /* line */ 
        c_0xbcb12c3d(0x1ca32f842505921574e823066898b40884cfec720f606c667a0b725e71ea8481); /* statement */ 
IncrementalPrice storage incrPrice = incrementalPrice;

c_0xbcb12c3d(0x92476bc71da0798c07261b911b029ff56d6019673057056f93a72b2bd74eb671); /* line */ 
        c_0xbcb12c3d(0xacd2122248112094b54c0d4249c34c7ba6de356959eebbed3f6526328b11e8e3); /* statement */ 
if (incrPrice.increaseStep > 0) {c_0xbcb12c3d(0xb604e0c6af46f7566f18882cb3e78a8a0a56d9b233b2beabe2cdd9febb35064c); /* branch */ 

c_0xbcb12c3d(0xd71c9d136b8b95a2fb6b4a28c86a948fd3c9957ed3c277579f7592694e785189); /* line */ 
            c_0xbcb12c3d(0x6c8e8a22eab9a5eeff94a6fd8295f5259671af9dd85f2c3997bcc3c8ff53b113); /* statement */ 
treeFactory.bulkRevert(incrPrice.startTree, incrPrice.endTree);
        }else { c_0xbcb12c3d(0x780a3da562011940ef03efecb89013a867793e1b4d2a8f72f756f68fa56d9139); /* branch */ 
}

c_0xbcb12c3d(0x06ce25ee4064b870833908b40b8419db62d5567163eec994c0ee94e6576cf97e); /* line */ 
        c_0xbcb12c3d(0xcee5069cd40b94ead001bf1cf193990b987bc4a13c25d34d381279999acbcde7); /* requirePre */ 
c_0xbcb12c3d(0x5b265d0dba3b8dc8a7e30f17e7c4b8014e76075f93bc2387696717577e34416e); /* statement */ 
require(
            treeFactory.manageProvideStatus(
                _startTree,
                _startTree + _treeCount,
                2
            ),
            "trees are not available for sell"
        );c_0xbcb12c3d(0x82b519c1d95d1242d40fec0ff804b89667e5037f4a71a791efc1add0f4a08aa7); /* requirePost */ 


c_0xbcb12c3d(0xaa200341afaaf799ff5599aaae54206553468c310dd8d4d733fc803e7d8057e7); /* line */ 
        c_0xbcb12c3d(0x9c9c1ac9e6d48683383e52ecc34434a8ea00af71a77df24715500bd97c1a7867); /* statement */ 
incrPrice.startTree = _startTree;
c_0xbcb12c3d(0x7da691b69cb4212278305b11667c110add20fe5e7610e6af6da318ac9790dbd9); /* line */ 
        c_0xbcb12c3d(0x675ca40613c96b3bb3d829c276c7a21252cc58abbae8f6cc40515e21ce3df0e6); /* statement */ 
incrPrice.endTree = _startTree + _treeCount;
c_0xbcb12c3d(0xaa920462e94fcf818a75d17e32fa463bcc61198bb5e249635b25ee38c2d06c31); /* line */ 
        c_0xbcb12c3d(0xc0302dd2cd7b4d155b8c64aab6abe4ce3579817b9334ea5b18890efa8b1e7d42); /* statement */ 
incrPrice.initialPrice = _initialPrice;
c_0xbcb12c3d(0x3fa44f4adfcc706c7d3bb0f424eed61e0117b7419fb707079a8855eeb516b1e4); /* line */ 
        c_0xbcb12c3d(0xfb1ee0066dc4f51adc32373b07fb3ad61868926368045a5f92e3614651dcd794); /* statement */ 
incrPrice.increaseStep = _steps;
c_0xbcb12c3d(0xd457bdaf0fba2bdc3aa8782c1150302131211fb111f4207b66b5e14d99452531); /* line */ 
        c_0xbcb12c3d(0x9818904d2fd3053fb41efba923190248a67a84b86243081611f66fc6e23cc388); /* statement */ 
incrPrice.increaseRatio = _increaseRatio;

c_0xbcb12c3d(0xf4080d8a55343d9106e945e7c6280377b16926d63c86c199708be9ed3b6f4cf8); /* line */ 
        c_0xbcb12c3d(0xdb1b8595ea6f65ebc814d54fc2e786f684cf412677fbf924352b751a2c8923b5); /* statement */ 
emit IncrementalSellUpdated();
    }

    /**
     * @dev admin add {treeCount} tree at the end of incremental sell tree range
     * @param _treeCount number of trees added at the end of the incremental sell
     * tree range
     */
    function updateIncrementalEnd(uint256 _treeCount) external onlyDataManager {c_0xbcb12c3d(0x17de9bd3fd0a045f79977aca9bc372389be7ee052a9ff4c019082c444541771e); /* function */ 

c_0xbcb12c3d(0x7c8f3a16eafdb85d5ce66585d4755b1406355c636e69799f78d0fccbd03181d4); /* line */ 
        c_0xbcb12c3d(0x8eb8eefe83e8992a805a21eaee4b9e5aa0f02a43089d6c4bf3b93ff8e45434cb); /* statement */ 
IncrementalPrice storage incrPrice = incrementalPrice;
c_0xbcb12c3d(0x8345b64d858e89e33eddde6490a018b05a05c9f704d55507b653ee4ddede009f); /* line */ 
        c_0xbcb12c3d(0xeeb80696bb31d07435a1703cde82a1d4601c2b9b5abedad7e8f7890fe0d1cbe0); /* requirePre */ 
c_0xbcb12c3d(0x0e0834334edafec6347fe12f732e7f13bcd6c56b021c911b3f66ef8cb3311443); /* statement */ 
require(
            incrPrice.increaseStep > 0,
            "incremental period should be positive"
        );c_0xbcb12c3d(0x7487d8519bf033781792e379affabdd9965f5b725aeaf9120701a2ffd43faaeb); /* requirePost */ 

c_0xbcb12c3d(0x88612b3005951a917fb5a123f2c237645f06217b72d5e4aab60be848a16bb361); /* line */ 
        c_0xbcb12c3d(0x8c287a01f626f9d6cd2172a6e3391349547857e977d86b3a2d9511cde6aaf251); /* requirePre */ 
c_0xbcb12c3d(0xfd6eaa1b09a1ee59ae74d156eb034f0d5fb5aac68b65cb21bb9cf6a08090ad76); /* statement */ 
require(
            treeFactory.manageProvideStatus(
                incrPrice.endTree,
                incrPrice.endTree + _treeCount,
                2
            ),
            "trees are not available for sell"
        );c_0xbcb12c3d(0x21eeea3ff934fa153229a56bcbd8ab9fd9c1581abf37ae8dd9b3debb2108465e); /* requirePost */ 

c_0xbcb12c3d(0x9668f09f3e454aa6a136e86f9c983807b7519d91eb5a8768544e0cc4fd4780cb); /* line */ 
        c_0xbcb12c3d(0x365386b8185e31151a959bf84a1c8b7103e3c89651f782ec50718779df2d33db); /* statement */ 
incrPrice.endTree = incrPrice.endTree + _treeCount;

c_0xbcb12c3d(0xf6370c463db74dc47af556edf65ba7ae888497d9ff72e88b1a0bf62bbe685978); /* line */ 
        c_0xbcb12c3d(0x35f29b66270cc6961b947fb1ef44a8c82c0e73252d675d844aa03fd083f85515); /* statement */ 
emit IncrementalSellUpdated();
    }

    /**
     * tree price calculate based on treeId and msg.sender pay weth for it
     * and ownership of tree transfered to msg.sender
     * @param _treeId id of tree to buy
     * NOTE if buyer, buy another tree before 700 seconds from the
     * previous purchase, pays 90% of tree price and gets 10% discount
     * just for this tree. buying another tree give chance to buy
     * the next tree with 10% discount
     */
    function buyTree(uint256 _treeId) external ifNotPaused {c_0xbcb12c3d(0x796b8f1c59f841fabcc3a4208cb4159dae87da025b4291638a42698fea1ca0ea); /* function */ 

        //check if _treeId is in this incrementalSell
c_0xbcb12c3d(0x09166debc31b0769242f124fb8a81db3cefbc26e66d8389e7204596f0dc1ae94); /* line */ 
        c_0xbcb12c3d(0x51b7393109a775f4ee73b953b8297ce3a078df9291ca50423c4e2d3eddd3b733); /* statement */ 
IncrementalPrice storage incPrice = incrementalPrice;

c_0xbcb12c3d(0xaddb2294fde395b10e6a96a262f7ec5bdf07ca2479c787e55f67507071692c04); /* line */ 
        c_0xbcb12c3d(0x8d56640be6008358a999e86fe03941746fdf8a0d7bbae47af6ab7c8549dd7903); /* requirePre */ 
c_0xbcb12c3d(0x896ce34a6e287caa90e09afbc4a07f3016ca162076033328b85243722d9c93a6); /* statement */ 
require(
            _treeId < incPrice.endTree && _treeId >= incPrice.startTree,
            "tree is not in incremental sell"
        );c_0xbcb12c3d(0xb6f30a7470b0356d5795655d8cce7090ba9222cbf99809e144db7c7bed0ce501); /* requirePost */ 


        //calc tree price based on treeId
c_0xbcb12c3d(0xb985e3aaf2c170616e941d0d1ac6bbed4879f8aeb984e24b53962df66d9ff27b); /* line */ 
        c_0xbcb12c3d(0xd52f70c09daf3f603f9d5e72c66aa97abdeb39406ec400077b51015ef652d566); /* statement */ 
uint256 steps = (_treeId - incPrice.startTree) / incPrice.increaseStep;
c_0xbcb12c3d(0x8d47799470ca6a47f73b283b3d61f08e0fead1d61f54260acdd3acb5b27dd338); /* line */ 
        c_0xbcb12c3d(0xeeacd2fabd89f2bcc84b440f83ea9b136247c7d1961fab3adcae134b622e3dd8); /* statement */ 
uint256 treePrice = incPrice.initialPrice +
            (steps * incPrice.initialPrice * incPrice.increaseRatio) /
            10000;

c_0xbcb12c3d(0xaf992f4ed8826800ea4c535ea8f35611cc8aedcb8d46de07e27c5d43d5e7a4b0); /* line */ 
        c_0xbcb12c3d(0x39c0b3daee8260460e37aa388fe33dea4675f63c5d82c053334e520a03fb7952); /* statement */ 
uint256 amount;

        //checking price paid is enough for buying the treeId checking discounts
c_0xbcb12c3d(0xa7d7f61d0171e724abb045be5d442e5fd1c51bc5aff9d79216507c1d35c19721); /* line */ 
        c_0xbcb12c3d(0x9dee280bfbd368bcb78f28e0929132d8622cd6d89ace59a7dc6f005ab31e3dd9); /* statement */ 
if (lastBuy[_msgSender()] > block.timestamp - 700 seconds) {c_0xbcb12c3d(0xd1a2e460856e624ca456a7bd07ea528cda2a33cf3d4dd7b2c367c60221567e90); /* branch */ 

c_0xbcb12c3d(0x523b1a755c322b7d61767455a23db95f06173bf34065bea328ba464d9fcf1b84); /* line */ 
            c_0xbcb12c3d(0x8c7178e412306a1c02798a9b8ad137d4c01ab0f32dc9fa8e305c465adbc40da9); /* statement */ 
amount = (treePrice * 90) / 100;
c_0xbcb12c3d(0xac774c4845d93f210e05652778d193a64c0c7bbbefb1b633610072c2ca1cfbff); /* line */ 
            c_0xbcb12c3d(0x2769ba206ef9517b3ab4fa8aa594c4d34b62ee634bca43e7f9c0d566c1f713f1); /* requirePre */ 
c_0xbcb12c3d(0x934fc91b0fc50cc63e93dc714b0ed7c9d24ae6968a4bd212484595cd1f975783); /* statement */ 
require(
                wethToken.balanceOf(_msgSender()) >= amount,
                "low price paid"
            );c_0xbcb12c3d(0xc2e5b9b4895a8560bff0119bc0a4ce7fcd5f4af5e163f798df92265f0f281541); /* requirePost */ 


c_0xbcb12c3d(0x1dfcd080e5897336be1def0464810a3c6636cc988e0652ea1ecb7597b8d463b0); /* line */ 
            c_0xbcb12c3d(0x1926cbce494fd2769c16ec1dc05d24b7b39c09a7c55431f6830789ceb1016f0e); /* statement */ 
bool success = wethToken.transferFrom(
                _msgSender(),
                address(wethFunds),
                amount
            );
c_0xbcb12c3d(0x55f0e015e76ace2ff95beeb07a4a6e102fc1f8d1a961cf52a192f100833a19a5); /* line */ 
            c_0xbcb12c3d(0xf011e088aebbbe65fdb01a52879178f5e3443eb57eda9e4bc47ca615c352d17f); /* requirePre */ 
c_0xbcb12c3d(0x3d90e89c96a61ac81fe9eb93fc46ed7f976e1852cce41710229320abec6945d4); /* statement */ 
require(success, "unsuccessful transfer");c_0xbcb12c3d(0xe635924601546b7c16e6ec6c86fdeb42aa5356a7a16515af23c01a16ae8fdb57); /* requirePost */ 


c_0xbcb12c3d(0x5b440eb75b851fd8c5cd25cfae2a29336349c8c0a2dee315acd722d887021d98); /* line */ 
            c_0xbcb12c3d(0x67085aada20f26dffc125ada4e674b7d12cf42d939ef474bbf3f42563048d5bb); /* statement */ 
lastBuy[_msgSender()] = 0;
        } else {c_0xbcb12c3d(0x537261e4e331000f8b1df7bdbe68ff39f303779dedaa091952e1f793c1bdd994); /* branch */ 

c_0xbcb12c3d(0xabda7420f9668157eea588411111c40758df9a44fe199eeaed18e8db2f3c5f15); /* line */ 
            c_0xbcb12c3d(0x070c583713d24ef87661a044026b6262f92ffc6edabbbf8a0324985d536bbf12); /* statement */ 
amount = treePrice;

c_0xbcb12c3d(0xb444ade96b5f65a600fd2fdef42a65c50cf0a99a67b6b363c89c3cecb42b634d); /* line */ 
            c_0xbcb12c3d(0xb32f86fdfafde8dd0200dc33bab3d2b736598d6c635f5a42896e68de1f53b3cd); /* requirePre */ 
c_0xbcb12c3d(0x498863c0379fce6c8a7d0810020c1f933773398f0cd5582f40cf56f27d2293a9); /* statement */ 
require(
                wethToken.balanceOf(_msgSender()) >= amount,
                "low price paid"
            );c_0xbcb12c3d(0xc0a8870f05efbc8f5853ed8f93104a7a37e335b470cfa6d4ff7b5092e117ace3); /* requirePost */ 


c_0xbcb12c3d(0xdec26e5667ae06f88bd1e1c4e4e600a751d05cde32305d460d3a2da0b7bd9c10); /* line */ 
            c_0xbcb12c3d(0xebae6932d8f6330f561c0288cf3e5b354f04d9725950d9b88a873fe7fc988c61); /* statement */ 
bool success = wethToken.transferFrom(
                _msgSender(),
                address(wethFunds),
                amount
            );
c_0xbcb12c3d(0x36fe540dbd85517ca5d4872293c387ec9baa9841e0dfdc8b496ad1d308a1c542); /* line */ 
            c_0xbcb12c3d(0x9184f3f4299dfc63526a132911c3fab686981c1dc8c18409978548193d22567d); /* requirePre */ 
c_0xbcb12c3d(0xaabc91aa9472bfa2fa27beaa96ea38d22877cdbea26c97e60e2f25743e6b8daf); /* statement */ 
require(success, "unsuccessful transfer");c_0xbcb12c3d(0x0323ae09580e2874117365c3b4b6b3407234fa4cf1e0557d88d9222076a598c2); /* requirePost */ 


c_0xbcb12c3d(0xca88606d7a342d1d3280d2d9baf439a28763e003faa3d1791667de32ceaf137e); /* line */ 
            c_0xbcb12c3d(0xc4c2f02b5cfe71018bdbe86db31e286dd938988f68690531ad78bf5740c0e98b); /* statement */ 
lastBuy[_msgSender()] = block.timestamp;
        }

c_0xbcb12c3d(0xe55aaacc054346130dccb641f83d980ce682a9e6bcb2fc16585c526ce2e6d77f); /* line */ 
        c_0xbcb12c3d(0x7e1326a08c69d1b8c16fb44bb19df29c29e5457241d2c912d2ac2655ff95bce3); /* statement */ 
(
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        ) = financialModel.findTreeDistribution(_treeId);

c_0xbcb12c3d(0x7a8667275bc7cd192fdfa5bfa376d96b468b01ab0a42efa77507dd3c341d0248); /* line */ 
        c_0xbcb12c3d(0x944d157f81e011f86445757b05fefd4893a7ef4bd265d45ef7b4e9efb17ce7e0); /* statement */ 
wethFunds.fundTree(
            _treeId,
            amount,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

c_0xbcb12c3d(0x35f3d87757a6cce85acd32dc01cb7451d02dc8e1f7d152c4f4d59267ec65731e); /* line */ 
        c_0xbcb12c3d(0xabf0ff0b7f8cc168d4894ea4b5d9edf9d9d99833b29d5250ff18af6468b5952d); /* statement */ 
treeFactory.updateOwner(_treeId, _msgSender(), 1);

c_0xbcb12c3d(0x7a76171af686bd5be2ec0f39ecd2862a7698ea23ab063fc6aeb35a11b22a0e84); /* line */ 
        c_0xbcb12c3d(0x7ee2debc343d8fda76838591d83e4f7ce3111cbe0f78041a0baf141ad8212f0e); /* statement */ 
emit IncrementalTreeSold(_treeId, _msgSender(), amount);
    }

    /** @dev admin can update incrementalPrice
     * @param _initialPrice initialPrice of trees
     * @param _increaseStep step to increase tree price
     * @param _increaseRatio increment price rate
     */
    function updateIncrementalRates(
        uint256 _initialPrice,
        uint64 _increaseStep,
        uint64 _increaseRatio
    ) external onlyDataManager {c_0xbcb12c3d(0x7d88f209a7d6f227af6580a37ce144f323c7aad4ae44c5b7213f38f771d4324f); /* function */ 

c_0xbcb12c3d(0x647abc4c28dfe2144d2d8c3c22799aeae8f785e2da0fa73e4388f13fe4672346); /* line */ 
        c_0xbcb12c3d(0x17bc339145f63150138251684704f2cff11e27efccc4a1a3443f02ed4f60ffd7); /* requirePre */ 
c_0xbcb12c3d(0xd85c20ae87b882837298e140716ce61a9b15e32d6b301c6f77285b750dced1d5); /* statement */ 
require(_increaseStep > 0, "incremental period should be positive");c_0xbcb12c3d(0x1163962ab5dac80418b37210b56f35adb2297c25174e1aa33f48cd0ac7aa755c); /* requirePost */ 


c_0xbcb12c3d(0xe1b8963100d13144c3c539ac87e37c2d5c280518f37f4375630d08ede501bb9f); /* line */ 
        c_0xbcb12c3d(0x4d5a5fccda9507415e5dde6f394506c3b451bda0049bad2b37a8a258630ec533); /* statement */ 
IncrementalPrice storage incrPrice = incrementalPrice;

c_0xbcb12c3d(0x19d3f49802f732b4476aaecf194e1dfe5ca5b641c61b25082c91345b579444e7); /* line */ 
        c_0xbcb12c3d(0x1a54ffabf299e6a3e92271c5bda0c87213d48162a56d2df6ea3657d2668f357e); /* statement */ 
incrPrice.initialPrice = _initialPrice;
c_0xbcb12c3d(0x329b910480db7dc280ecce9d984ec9194f7d627b49011b6156d9dc1a6de0e9be); /* line */ 
        c_0xbcb12c3d(0x60413a09a89f8a5f00812ef3cb8754bf1992b5b2722bea574e0f940232267a24); /* statement */ 
incrPrice.increaseStep = _increaseStep;
c_0xbcb12c3d(0x6d3bb0683a51be8a10ece93b6e45f32556fc52a8f05d491e227401c82d043623); /* line */ 
        c_0xbcb12c3d(0x2441e79576674321dd2a00c3f314612a1fa350d864838042393fb78ed8a8ba30); /* statement */ 
incrPrice.increaseRatio = _increaseRatio;

c_0xbcb12c3d(0x52164299fc8e7a45eeaf1c639d2f45229c9a87e347e7bd842cf967599892531d); /* line */ 
        c_0xbcb12c3d(0x0afb3bae1293600963a22988d7a0db2dd272676f5a90a810c424633c19a641d3); /* statement */ 
emit IncrementalRatesUpdated();
    }
}
