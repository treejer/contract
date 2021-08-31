// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x32d3e07e(bytes32 c__0x32d3e07e) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IFinancialModel.sol";
import "../treasury/IWethFunds.sol";
import "../gsn/RelayRecipient.sol";

/** @title Tree Auction */

contract TreeAuction is Initializable, RelayRecipient {
function c_0x3885e695(bytes32 c__0x3885e695) public pure {}

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private auctionId;

    /** NOTE {isTreeAuction} set inside the initialize to {true} */

    bool public isTreeAuction;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IWethFunds public wethFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public wethToken;

    struct Auction {
        uint256 treeId;
        address bidder;
        uint64 startDate;
        uint64 endDate;
        uint256 highestBid;
        uint256 bidInterval;
    }

    /** NOTE mapping of auctionId to Auction struct */
    mapping(uint256 => Auction) public auctions;

    event HighestBidIncreased(
        uint256 auctionId,
        uint256 treeId,
        address bidder,
        uint256 amount
    );
    event AuctionSettled(
        uint256 auctionId,
        uint256 treeId,
        address winner,
        uint256 amount
    );
    event AuctionCreated(uint256 auctionId);
    event AuctionEnded(uint256 auctionId, uint256 treeId);
    event AuctionEndTimeIncreased(uint256 auctionId, uint256 newAuctionEndTime);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x3885e695(0xa940f955ec71814bfd5552453f5a3b981535728c26551d4a1adadef5210b4d6a); /* function */ 

c_0x3885e695(0x078aa95a07a378b287c4263e2d68f71cd26b86d134432f28aaddd18e1153d546); /* line */ 
        c_0x3885e695(0xd69abad78dfe01e56a925091bb6389a650f8896a9b2c32691de1b2ba09aee510); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0x3885e695(0x4e9acb8a9a9f789548dd42d5ace19b578a46ef4ef79951528e2ab58de4582d9e); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0x3885e695(0xda9cd017d84f2d0e1e5c57cb824ee81afec7c5ea2fc946f766dd02beef727090); /* function */ 

c_0x3885e695(0xd92232571023b6f62734f1cb4b9adee0788ecbe068a9849e9d9df8d1a7831ddc); /* line */ 
        c_0x3885e695(0x4524f92fe008e14ae64d7478e413cb0eaf3dfb42f17cf2949b9eb12c3416e8c8); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0x3885e695(0xab5d7f3c14cf1b5e1cc9040d058b0c7af0317c500d608d73fc1a207b456a6795); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0x3885e695(0x4f0d9fe6cce5087efdfd438dc5f8fa06dd56cf53de7b7de678d213b81af810be); /* function */ 

c_0x3885e695(0x514ffaa2ba835075a6f421495dd821934b9605282b0bb0016f0f08ba0ff24013); /* line */ 
        c_0x3885e695(0x220bbc059ca01aa34a6276590786c37a1d8afec77352268d3e69846d4f2ae9fc); /* statement */ 
accessRestriction.ifNotPaused();
c_0x3885e695(0x30e45b2d41891bfacf7f97d97bc6d079cbc3dfff454eef963b8fb6f50d73a8d3); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x3885e695(0xb5aa7409892284405930fd652fc2c97f699cf79ea8fb9494a258085da10b1276); /* function */ 

c_0x3885e695(0xf05d07559d7044999ea9a95cd7f7d62ef2e8de6fdc3bfdd347b17a9f49cb072e); /* line */ 
        c_0x3885e695(0x0a48b258607b2c41e483a77e84546a7190086c4cb4d7c3ff88da36213bc39b9e); /* requirePre */ 
c_0x3885e695(0x034201cde972c7b84489ba979447ff0a79a9f8c19c936f81c9f280ef81f3b2fe); /* statement */ 
require(_address != address(0), "invalid address");c_0x3885e695(0x70fd55ffdfa10b8e16f95ce1284802fd68b25cc564631f1bcf98753923559be6); /* requirePost */ 

c_0x3885e695(0x44d415e3ba1b7b2d25fed32954969c4162a0a95318eaee29875e15dc4971f9cc); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAuction
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0x3885e695(0xc5e18dbb10d91e0d4f511a12c246a5dcbafc5a1a7e1de823fd2cc290a7235576); /* function */ 

c_0x3885e695(0x0efaa8cf279988a1fa17efbd76bd20916d7cbb5c52e62686f1039d9284c5b8a4); /* line */ 
        c_0x3885e695(0x9e7ae545f4ecaf96ffd94e86b11bfa3eb74ca3eb7ad9a8a88073139aa1b133a2); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0x3885e695(0xb4c9fe11ed4dd626db9d22e0915d27d57f38f2c8c217847fe5e6c8c9cfd166c1); /* line */ 
        c_0x3885e695(0xba18d6365ed2fe465ca93afae8d1334a711f2d57f9040ffa3ce630dd5a2f6fda); /* requirePre */ 
c_0x3885e695(0xce68d5b71641c2f6e19878f643bb76687a4602bddb9abbd3dae14dbd7d0c6644); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x3885e695(0xfa895f1f7fa3512fbae9b1c26dea961cef426b24e2ae31d434cc8015afa2094a); /* requirePost */ 

c_0x3885e695(0xcfcdd8caebc4b746c0d08ece8a48a8bbb045ffa7f1cf9e4e98ea73c5a4482d90); /* line */ 
        c_0x3885e695(0xd8e59ca538fc070e49b3c1b6d9ba402806a81dd43c9f95774b1ef7da723a5b0b); /* statement */ 
isTreeAuction = true;
c_0x3885e695(0x3d24c807d875fb54c61334b3fce11964eabe8d55c77b20c80730cc148ea1ecd4); /* line */ 
        c_0x3885e695(0xd0a583c1a7ff9e716319529d892d1a4c2425e7e48f07cd12f1b94253ba68463c); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x3885e695(0x3fb2d2cb8a2b114353976ce8af78f38beca37ecf8e22b771815cbbc49f1692b3); /* function */ 

c_0x3885e695(0xa114b075f26d1ab9de007d8298447d67b89d7a429960c129c45d23af19ab41d5); /* line */ 
        c_0x3885e695(0x1337c71b8135b2d778bbdc20f059a0613fac5933949350e4d1ae16d8ffe1d9d8); /* statement */ 
trustedForwarder = _address;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {c_0x3885e695(0x3754776548f7aec93bde837e34b706bb02ac93b668e224f712e5d4d1086e8dd8); /* function */ 

c_0x3885e695(0x59e8465ce0c4a523d1ab3590e75ec96d01aeb90b1536a3bf1375dbc4a6e6205d); /* line */ 
        c_0x3885e695(0x173ad34950aec8c5332c48e44e7b8b3352d0ba29ffae37d67606760b8cfd4b5f); /* statement */ 
ITreeFactory candidateContract = ITreeFactory(_address);
c_0x3885e695(0xb2427e83b801364ab4553a304618561e9aabb51f9a258fa31e8946a8296bccbc); /* line */ 
        c_0x3885e695(0x8f5fccc7a7996ec6b09331061a98d8ef87cc1bf9576fde41602d3befe49ba9e6); /* requirePre */ 
c_0x3885e695(0x75e8bd75b5ae7291cac67b67c3471f66217f0a8a9e41b6ad1f3af0145561fc71); /* statement */ 
require(candidateContract.isTreeFactory());c_0x3885e695(0xd0e60ee532b000c45f308adddb07ec50ccbf8672195fdab8e0dae7f2f5dd5e9b); /* requirePost */ 

c_0x3885e695(0x95a936fd769ef3647376e52100aa9497cad8def1a445a7430668c3a343e599f7); /* line */ 
        c_0x3885e695(0xaa5f508f663cc2bdfc25b933142ad7c79280d55ab9de36f8bab8c1f784026eb9); /* statement */ 
treeFactory = candidateContract;
    }

    /**
     * @dev admin set FinancialModel
     * @param _address set to the address of financialModel
     */

    function setFinancialModelAddress(address _address) external onlyAdmin {c_0x3885e695(0xc46abdaebf2fb83b9e37e6887b165fa743b65b2a9374c6a7db020e1935a5c760); /* function */ 

c_0x3885e695(0x5ab70b39cbad2b70bfd0d0c8e086d9e14ffd2e34176637d8b131e97cc8867a84); /* line */ 
        c_0x3885e695(0xbbc6bde4a83e95c35281caab9f9793ebb0fa9ee0b7a6c50e859890cddab33a26); /* statement */ 
IFinancialModel candidateContract = IFinancialModel(_address);
c_0x3885e695(0x7beed00b73fb6dbbbfcdd076c4f5abac7d6ec22269a0c1b426687f950fe1b5a4); /* line */ 
        c_0x3885e695(0xf07e400141e9e4efcc4874147c06bb572c590e822365fe3989f457dd3bb82092); /* requirePre */ 
c_0x3885e695(0x0851bd15257a481f7a07d3f54e2180c94cf0b913307c4ab749182efb14351b5d); /* statement */ 
require(candidateContract.isFinancialModel());c_0x3885e695(0xf97787669ae720ee37fdbe64e91f1c64c40cfff285e1133be3b1473bf8d5a87f); /* requirePost */ 

c_0x3885e695(0x21ee872925cbba8bf9ae6024856e0b0dfc09ece86c9e08057f88261963537ba7); /* line */ 
        c_0x3885e695(0x2583a18216468f1da93bb4663d21d9ddc199e45c80023024c0019c58fd163419); /* statement */ 
financialModel = candidateContract;
    }

    /**
     * @dev admin set WethFunds
     * @param _address set to the address of wethFunds
     */

    function setWethFundsAddress(address _address) external onlyAdmin {c_0x3885e695(0xfe0b6781cd64d7ca1d4e7cf9f2c63d021bf81f6f90ae08f4bbb467d262913f45); /* function */ 

c_0x3885e695(0x4c71819cf4d6710d4cfbe6db3c8faaab40c8bbc6d6682893867e03a16fc526e0); /* line */ 
        c_0x3885e695(0x9c77e45109e4bdc68ce4fccf59598cabe8866fc44875100bc05fbd32fb1dd75f); /* statement */ 
IWethFunds candidateContract = IWethFunds(_address);
c_0x3885e695(0xeff5567550beaf9c716a5569a1d9878df0dd48bf4e57445d766ecf549731384a); /* line */ 
        c_0x3885e695(0x0f1fa6c32a017bccf6c608aba6762691715ab7f2cad1e34613071df9bb3dad47); /* requirePre */ 
c_0x3885e695(0x7913b848b822971b134f5d4c8489e7a38d099932004fb7d53898972f97c1d165); /* statement */ 
require(candidateContract.isWethFunds());c_0x3885e695(0xe0260d81f82ab6584ba4eaaf543da9c5f8a388c9cc0b75b0230da151640175cf); /* requirePost */ 

c_0x3885e695(0x7db5be3e57639eeb656cf582854117c8037c0cb1db60d5ab1c880f495b6100b3); /* line */ 
        c_0x3885e695(0x0f7293fa1d2d81ad7cdcfef4221dcb88d323203fba929cc14576f8e93518193c); /* statement */ 
wethFunds = candidateContract;
    }

    /**
     * @dev admin set WethToken
     * @param _address set to the address of wethToken
     */

    function setWethTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x3885e695(0x8f10978504a9ef81e28d77e6ebec0fd2e579529a2f04a16dca0cc6619d3b5992); /* function */ 

c_0x3885e695(0x51ab963a4b5fc41dbf485e4e66b5ff8aa2cc77650c7ce9904918846402342d55); /* line */ 
        c_0x3885e695(0xe73455efbbd0ebe27fc6fefa041906b3dceeae62dadb4779437c729e99480790); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
c_0x3885e695(0x01c3575df45d04e0cf8b2046b342f03bd165db7b9834b55bb6e7ef0113f71f33); /* line */ 
        c_0x3885e695(0x1634812b8734a9528e9f81c67f385dc7497ed9f6091ebf03d3404570f750c085); /* statement */ 
wethToken = candidateContract;
    }

    /**
     * @dev admin create auction to a tree with provideStatus of '0' and push that auction
     * to {auctions[auctionId]} and increament auctionId by 1.
     * NOTE its necessary that a fundDestributionModel has been assigned to {_treeId}
     * @param _treeId treeId that auction create for
     * @param _startDate strat time of auction
     * @param _endDate end time of auction
     * @param _intialPrice initial price of auction
     * @param _bidInterval bid interval for auction . if it set to 10 for example and the last bid is 100.new bidder can bid for 110
     */
    function createAuction(
        uint256 _treeId,
        uint64 _startDate,
        uint64 _endDate,
        uint256 _intialPrice,
        uint256 _bidInterval
    ) external ifNotPaused onlyDataManager {c_0x3885e695(0x34323399ebfd1c06aa665013e822f298b228ac3d1db7c2b5cd012e1f29bd55da); /* function */ 

c_0x3885e695(0x7ade5cc3735cbd8f05a5fc678e8dc68221e840620c982fd812dc37d7abe80900); /* line */ 
        c_0x3885e695(0x687996eb47f1782931820b745abde9aeb49ed7d8550454926c7d91c62c1ed323); /* requirePre */ 
c_0x3885e695(0x96c8b4fa16cee1169de9c724c768279ba9db42c587e38cdee8eaa3b38f82cf0f); /* statement */ 
require(
            financialModel.distributionModelExistance(_treeId),
            "equivalant fund Model not exists"
        );c_0x3885e695(0x7a01b36b703b8efdfd1aa122112678ecce3e424cf0610c041057dd1eb489a1ff); /* requirePost */ 


c_0x3885e695(0xf5e10368fd88be2633b060820ec1d13ef6623a26b14c98eb79a64a1fdc11e7af); /* line */ 
        c_0x3885e695(0xa6824bd97eb1efbf3f9961a325fb1a35d4e7a25f9ed7c5b914ed5febfa6733c2); /* statement */ 
uint32 provideStatus = treeFactory.availability(_treeId, 1);

c_0x3885e695(0x0f575e45361399057b3d1ba5c7590942a0901928298cd8fc687e6d4b174d2ed3); /* line */ 
        c_0x3885e695(0xa5d565c4ea8de51dc8c33c1f21312ba37320c216292f99ca95396689af0dc351); /* requirePre */ 
c_0x3885e695(0xdd36b81f4e59694af92b7847cd2f3646e5b8f1ec597c1e595264ef101fc14d78); /* statement */ 
require(provideStatus == 0, "not available for auction");c_0x3885e695(0x28a72cd7805e21be3f548b3e1f4ba586b9fe0f21c04a0d344b186ce6c17ca4ff); /* requirePost */ 


c_0x3885e695(0xfb236f99394f76e3c004150161174af58b4b86d7b9bcd1a06967456740a70081); /* line */ 
        c_0x3885e695(0x25bf23c37adb95061ef9d64495d896efe546a34aac313d0f804ed0738f4a509b); /* statement */ 
Auction storage auction = auctions[auctionId.current()];

c_0x3885e695(0x42dd2c1623e518a1b23da2e84f086ec6c841547c8f4868ccd9ae502264ada13f); /* line */ 
        c_0x3885e695(0x8caeca4372ddf91b8279c659c80290a74795f32a883f0911888ee4d52746ec87); /* statement */ 
auction.treeId = _treeId;
c_0x3885e695(0x6dc4073d906960aaca883f6a5c52c88ab7c375691992e6518c2f0a1e5ad444bb); /* line */ 
        c_0x3885e695(0x87f4ecd5e5c581b8c45a8001c5885c83d333671d4e16119d46f3031254dfd52a); /* statement */ 
auction.startDate = _startDate;
c_0x3885e695(0x5868a2f7f72b48b0edf69a20124f3ffda07eed77eda9e8af05db602fbeaf714e); /* line */ 
        c_0x3885e695(0xd1eb745e14199583699a37a24baebb986a1e36224d32e5ef74f3bda42ca36af7); /* statement */ 
auction.endDate = _endDate;
c_0x3885e695(0xc6c6df25d7578cd4ffa58c1cd3792942d0f44c806a5cbfd5491d932f8feb0351); /* line */ 
        c_0x3885e695(0xb881e6fc05ac5688423b2aa06823823f4c5b0e417431489d6cdb75b841237c46); /* statement */ 
auction.highestBid = _intialPrice;
c_0x3885e695(0xd3d4fa735780468d5cd2432a42572acee8d1b717962d567b03f08d4cd0fd2c7c); /* line */ 
        c_0x3885e695(0x47c0bf470778fb569597c455f3498f0799c1823ba9d79583746a0e8278f79835); /* statement */ 
auction.bidInterval = _bidInterval;

c_0x3885e695(0x21195ba079ce8422ef1fda3ad89878a1fedb6aaaf095387110eafc636e1c9952); /* line */ 
        c_0x3885e695(0x7cfdf77e3dbfc3bc60d6d4c08fadb1b0c390ed8f4836d7fc8625237dd9e8ff00); /* statement */ 
emit AuctionCreated(auctionId.current());

c_0x3885e695(0x86965be0d25458267bff7c965fdb2fe668b15cc70e2b33e03af77761ad53fd00); /* line */ 
        c_0x3885e695(0x9596cf6414feb2e741ce87c984ba929040154007961e92c81b2657d44de185b0); /* statement */ 
auctionId.increment();
    }

    /**
     * @dev bid to {auctions[_auctionId]} by user in a time beetwen start time and end time
     * its require to send at least {higestBid + bidInterval } {_amount}.
     * if new bid done old bidder refund automatically.
     * @param _auctionId auctionId that user bid for it.
     */

    function bid(uint256 _auctionId, uint256 _amount) external ifNotPaused {c_0x3885e695(0x0bc9513824e8d3f969d814874a9065c35fe3ae86af77353e1c65f3438c4d852e); /* function */ 

c_0x3885e695(0xe3a22151b47f3c276e3248d3b02c0fe9e4a74b1d6d15ccfdb254fb3653cb1451); /* line */ 
        c_0x3885e695(0xc4fb89cf718ca472e8b17eaf78d9ecbc6ba7187a9371602c8ecbf8f125fac74b); /* statement */ 
Auction storage _storageAuction = auctions[_auctionId];

c_0x3885e695(0x8828a5fd22b8c3aa40192eeb1f8d00a1639db6f42498b4c3fb4a4fe87dd0c773); /* line */ 
        c_0x3885e695(0xfe72490cee98b5eeef2aca8e77714ed11001d364509569da3ecfb321f88e49e4); /* requirePre */ 
c_0x3885e695(0x8eb8c65d0763d47a341a6ad04370357a37d8a9aee511c0df6514ca67cda7ffc3); /* statement */ 
require(
            block.timestamp <= _storageAuction.endDate,
            "auction already ended"
        );c_0x3885e695(0xdffef79cb69c631320be4471d8b989fff0ffb2d8c4c0c035d7e2e50f5fc9da90); /* requirePost */ 


c_0x3885e695(0x2737556cccfc766a4c8ca23695be35ee95f58b927355d0fdfc955129947abe2c); /* line */ 
        c_0x3885e695(0x2f8503441aab7fa47f6565817b0e9cc25f08d224a7bbb953c7df4e8ea2d60c34); /* requirePre */ 
c_0x3885e695(0xc32fd4593ff624f0291afff5cd5497a06ddc6a248e396d9243eb928f80b15772); /* statement */ 
require(
            block.timestamp >= _storageAuction.startDate,
            "auction not started"
        );c_0x3885e695(0xd976af056c31aaf34a90262f74dc235dbf446c05399bab88099bd2c10b9f34d5); /* requirePost */ 


c_0x3885e695(0xa987cc19d8fbf946eed509d3c2690630adeaebd60bc3e27d8f16abe0a624030a); /* line */ 
        c_0x3885e695(0x5015e636c5105a40148c35d234d873ff8d3951d95c1cc87a5423f3db349c27b1); /* requirePre */ 
c_0x3885e695(0xc4a15683767dba24421e72ee087657d93b5b6a06a233cd5a5e07072564ce138c); /* statement */ 
require(
            _amount >= _storageAuction.highestBid + _storageAuction.bidInterval,
            "invalid amount"
        );c_0x3885e695(0xb021ece567510db6badf3d55ba1da45c37a3e50a10d797bf809f9d0d3806b173); /* requirePost */ 


c_0x3885e695(0xf2fc0ea93edb666a95fbf2a76cab75773536575451e9428c62bb8f577bfd8606); /* line */ 
        c_0x3885e695(0x924fba34762ed7d3d56d5c17d90dba5e592d4d5a9d9843a03f1dab5f65091ae5); /* requirePre */ 
c_0x3885e695(0xe0916be97ed5ba5e8fa63c69ab5fa9ddc13404298942dc910bbdfdc928b3a6d8); /* statement */ 
require(
            wethToken.balanceOf(_msgSender()) >= _amount,
            "insufficient balance"
        );c_0x3885e695(0x122c2fb41ccd16a6f7a73d35378d38670ac9861b6b2fc9e534a180a17003355d); /* requirePost */ 


c_0x3885e695(0x33906eefba78d5191529338e35bbbe9b86a551d187cc333281b199023d744cb2); /* line */ 
        c_0x3885e695(0xd92915bacd83b499a7b64e42c84b20143efbcfdc77529470dd045c2536c9e7b3); /* statement */ 
bool success = wethToken.transferFrom(
            _msgSender(),
            address(this),
            _amount
        );

c_0x3885e695(0x6817c3f785a2c9f4828a6916bc443a9ef467b292bdc7a660b7c7617933d8b0b9); /* line */ 
        c_0x3885e695(0x934c2e886cb021b96b6077f978905ff24cdb96fa98dacb89df012a17ecdd2de6); /* requirePre */ 
c_0x3885e695(0xad6e521f1abdda24220535496e01bec814a2ea62a632ba762fedf952655af6ac); /* statement */ 
require(success, "unsuccessful transfer");c_0x3885e695(0x45ce4771c2d21180c21183fc94a3baf26c0b9567ad2bc49bbe774d2ae64faf7f); /* requirePost */ 


c_0x3885e695(0x7cacaf96763a4374b4d04164479b32b7712e1a41c62d3e902bd668247616c373); /* line */ 
        c_0x3885e695(0xfd4911cdc0d1c302f16e1ab2818d1463d563904bcee13eb3edf6fd57c7be9ac2); /* statement */ 
address oldBidder = _storageAuction.bidder;
c_0x3885e695(0x46139c1bf2d3183c88564b78c33410ef16ce38e1da41d91f50319f8d50cc7e5f); /* line */ 
        c_0x3885e695(0x9e0a240101c032625685fe2306fe2e0514f86c5d2f838e27b67ab504f8826eec); /* statement */ 
uint256 oldBid = _storageAuction.highestBid;

c_0x3885e695(0xb0b1e20261b8461b08afc6b7dd391514f94620365b8f6a03a10813cc0b15eabf); /* line */ 
        c_0x3885e695(0x37da9c923c7f718fe2b42fd342784d5c169b65618fc75abd043ca84c2351109a); /* statement */ 
_storageAuction.highestBid = _amount;
c_0x3885e695(0xb201af76462f29ab3e86dd3013a96394044df52449f54ddb0d3b405b5606565d); /* line */ 
        c_0x3885e695(0xc6f9838314f5ae053985aa16e7ac4a20a20613ed39badd6238498d1df9611c7b); /* statement */ 
_storageAuction.bidder = _msgSender();

c_0x3885e695(0x28595b9b451dab63d6067b4a4383f2d249f9d4440120bdf681e2808aada41106); /* line */ 
        c_0x3885e695(0x872b35166d33bcc7aeec02230d500749a801da18e9235cf905e6c8f3a1455a67); /* statement */ 
emit HighestBidIncreased(
            _auctionId,
            _storageAuction.treeId,
            _msgSender(),
            _amount
        );

c_0x3885e695(0x75997cb6affb75650024758abdffc049ac0ffa169e4c2797f46c0b1c3ae5a5f6); /* line */ 
        c_0x3885e695(0x3e25e46d0ed7b1a7900bc58f79be85ce3768b3b34af8f0a31e2486eb64ec1e73); /* statement */ 
_increaseAuctionEndTime(_auctionId);

c_0x3885e695(0x5cfcc43e5189e07b534fce5acc408df6a1f4ca62f8f426541163d44a7de4e9ca); /* line */ 
        c_0x3885e695(0x6699b0a73653b72995f06b0e8a525c3de4929fb588cc585041d2b305a7162573); /* statement */ 
if (oldBidder != address(0)) {c_0x3885e695(0xe92ccbb958e97eb029e937acd68f7e59f974617f27866746c1d265946a2dbfa8); /* branch */ 

c_0x3885e695(0x5ffb0a0e5e5989baac8d04856414269953bc3fdd66ee9fa9d81b551b7944205a); /* line */ 
            c_0x3885e695(0xa22b15b3763e98ab5c7a9271731661720dc4f07d827c1984e962ca9957829f60); /* statement */ 
bool successTransfer = wethToken.transfer(oldBidder, oldBid);

c_0x3885e695(0xc2cb866e56d55c24a856b554350dc014715a37cb9664b349ce681a3949dfc377); /* line */ 
            c_0x3885e695(0xea067a7824d16cf0566d26ee5f8b01be4bd9201b6e17663da9817a4c58e1023a); /* requirePre */ 
c_0x3885e695(0xc68aad93fe676eab879d47c51484ec9dba30dc0dc55c9bf73bb4f86fea420100); /* statement */ 
require(successTransfer, "unsuccessful transfer");c_0x3885e695(0xeaadc5afa6284986e3997f671466c2a50ff93b2e2edab05a8abb08a7698d7533); /* requirePost */ 

        }else { c_0x3885e695(0x3873fbbb2f58f0d4a6924ad2b175051ee2423662bf8fdf313b64f3648dacb731); /* branch */ 
}
    }

    /** @dev everyone can call this method  including the winner of auction after
     * auction end time and if auction have bidder transfer owner of tree to bidder
     * and tree funded.
     * @param _auctionId id of auction that want to finish.
     */
    function endAuction(uint256 _auctionId) external ifNotPaused {c_0x3885e695(0x8d29191c03cb1df3588ad5e007f3c8650b6a5d6de04aa549958f9f0e8fe41a80); /* function */ 

c_0x3885e695(0x95a7d6bef5fc41e993a23504442cdd8720369e73f55e780107a466bb6ef76f68); /* line */ 
        c_0x3885e695(0x360c284d1b31cb400f4f2178f78cc3a81a111418c81fa6ed6175a3f11273b7d1); /* statement */ 
Auction storage auction = auctions[_auctionId];

c_0x3885e695(0xc4d22a7d246b0fed2219e805609d7117253a7f954627209da6dab4523e3d8cb8); /* line */ 
        c_0x3885e695(0xf95c514f18c76869024ccaf4c94085f781a8f46d6a20304ab79b182bf99621ad); /* requirePre */ 
c_0x3885e695(0x0f8d9d7b391edf688fba4e5c3594595e001db05153d893d63fad984f89cd5a65); /* statement */ 
require(auction.endDate > 0, "Auction is unavailable");c_0x3885e695(0x054db27c1bd1216493fa37714daf624a461137a8ae1d0fc90887390e8f730f92); /* requirePost */ 


c_0x3885e695(0xa870e4ec278f77fd40c2c7036e3b1a4d4bddf2d978422ba2b2e8f5560cf8961a); /* line */ 
        c_0x3885e695(0xf5ac8a3a142f498d75fd6aaeeabf90d828d65f2e476d0d73746cfa4a30f876d3); /* requirePre */ 
c_0x3885e695(0x23af786ae4e6753a5755bbdc99aec597a904a23a65f3cd67a26eddb870253eb0); /* statement */ 
require(block.timestamp >= auction.endDate, "Auction not yet ended");c_0x3885e695(0x79aec84f85cd0c1e185a5ae719ab4bcd49073cac50fe37d3cfef0e3de4e0f8d3); /* requirePost */ 


c_0x3885e695(0x1107889328dec699763054c484a8d94a34c7fb1a406bb441282d37e0b8366bbf); /* line */ 
        c_0x3885e695(0xf2a09e58a5e893db24d1279f73e58b25af374fbc051beba2e303e08e7d3ab9c5); /* statement */ 
if (auction.bidder != address(0)) {c_0x3885e695(0x79f4228520422026d200b3aa4153f32f67dd060167540474c1baea430b8c84d8); /* branch */ 

c_0x3885e695(0x12d80b5b97f0aaba6134393acdc04da3c4c6aef6cd3c56d51fee244d6f560177); /* line */ 
            c_0x3885e695(0x0cc9d3aaafde8b5106a035226ab0904b66d65aa4d49dbd0c823d7805f93f33e4); /* statement */ 
bool success = wethToken.transfer(
                address(wethFunds),
                auction.highestBid
            );

c_0x3885e695(0x2b669c6be29daba406bf4a2351ecb5c23506e296031efea5ead8ff83a5fac04f); /* line */ 
            c_0x3885e695(0x39c7baf309441b38151d39d6ecf7e8ed0bbdd1ef07abab7ae1db64d7b71afb0e); /* requirePre */ 
c_0x3885e695(0x3d3103e8e85136e35dde8ba5d51c15276533c240ee4b321af07d725df5c1bb1a); /* statement */ 
require(success, "unsuccessful transfer");c_0x3885e695(0xbce9988af78a2426fd8463b9f7714b99975b1de1e99259ebabd9c99edd5e3b81); /* requirePost */ 


c_0x3885e695(0x0d551dc6edea729054ee6f53add9279bfb83f8ddd557e84238e4787599a2cd8b); /* line */ 
            c_0x3885e695(0x428f18130d9fa14efe120ada61043b7bba7ed54501dc02f3f03894e0cb559bc8); /* statement */ 
(
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = financialModel.findTreeDistribution(auction.treeId);

c_0x3885e695(0xd9098eccaa22015fffc6b40beac4a6a9af4720a6a1833b297ac8a6898acdd5dc); /* line */ 
            c_0x3885e695(0x6bd4f91f0f921d2b942a70ccf6e810efdc77825d207f9223fb8cc72d35082d44); /* statement */ 
wethFunds.fundTree(
                auction.treeId,
                auction.highestBid,
                planterFund,
                referralFund,
                treeResearch,
                localDevelop,
                rescueFund,
                treejerDevelop,
                reserveFund1,
                reserveFund2
            );

c_0x3885e695(0x4acc1b5d09780a1cb04e5f50cef7efa695eaef4648f17282dc42aa227cbc63b7); /* line */ 
            c_0x3885e695(0x473ce96363483f8ec8dd35493019b164184ec294691a49823935f53e29015398); /* statement */ 
treeFactory.updateOwner(auction.treeId, auction.bidder, 2);

c_0x3885e695(0x9cf0743754e125911a75e4a5c9edc276c489f88bc62ba44d57c3689a4527be2a); /* line */ 
            c_0x3885e695(0xfe0b5a3025aaf87be37a1cf67c76c13dae6c04df9e85a5b4eb92b378280dd3a5); /* statement */ 
emit AuctionSettled(
                _auctionId,
                auction.treeId,
                auction.bidder,
                auction.highestBid
            );
        } else {c_0x3885e695(0x4b125902b7cda2546c2fb54f07fcee3f3f65411a4b4d5e70778bef6b44277d8e); /* branch */ 

c_0x3885e695(0x58c936c258933039d8131371694cce2458653bf28d40c8d6b25050d57b7156c4); /* line */ 
            c_0x3885e695(0xc1423ed43c6cb3ce10e30a043dfbed8bdf66e1f3e11185e241b2a58c4e6fa66e); /* statement */ 
treeFactory.updateAvailability(auction.treeId);
c_0x3885e695(0x8f82ab49836a699b776e2e727f56fdd80bf45830acfe06c603beeee184080103); /* line */ 
            c_0x3885e695(0xb96a6331517ba1ac74e8c977ada4c6134f4e617e5f4327a6b6bbdeba9c65c5b0); /* statement */ 
emit AuctionEnded(_auctionId, auction.treeId);
        }

c_0x3885e695(0xf9af00f82710bb2e10f7f0459ddd2e743e936de4b3695e74e98043a90c19bcb7); /* line */ 
        delete auctions[_auctionId];
    }

    /** @dev if latest bid is less than 10 minutes to the end of auctionEndTime:
     * we will increase auctionEndTime 600 seconds
     * @param _auctionId id of auction that increase end time of it.
     */
    function _increaseAuctionEndTime(uint256 _auctionId) private {c_0x3885e695(0xd58b354b76eb351911304a00c94a3f51f92ba5e1cd1714fef79b6df9229c2b60); /* function */ 

c_0x3885e695(0xa826ddff161b308800f5ecd42b1f0297c443e878fc30be047f5663e18e7c3575); /* line */ 
        c_0x3885e695(0x9a3cb0434337f9963d7785e532a0657e9e4226999c82be7dd0b9055754b4b062); /* statement */ 
if (auctions[_auctionId].endDate - block.timestamp <= 600) {c_0x3885e695(0x7d991650e3cce42579640d25cdb08deca7845c508eacde0ebca0ed66922deb59); /* branch */ 

c_0x3885e695(0x27422fb25a86534ad3e8a6189472af8f72b5541e046f04866d512ec0cc3adae5); /* line */ 
            c_0x3885e695(0x62c8bb3e9975cd8c0c8ad515376f81c4d53f1f44052d652844bd0bab9a8e806d); /* statement */ 
auctions[_auctionId].endDate += 600;
c_0x3885e695(0xe5a50f381a7841ab7af2a10065a1beaaaa5736c89a9844551c77eb06148be58f); /* line */ 
            c_0x3885e695(0x5829fa9b0db87a15e685db08d8ce49e131bf96724d741e9ce262aa648816617b); /* statement */ 
emit AuctionEndTimeIncreased(
                _auctionId,
                auctions[_auctionId].endDate
            );
        }else { c_0x3885e695(0xfa40c5b697bb514942f30741f38accf525fcb21719a0fd30e3dafb1effa06098); /* branch */ 
}
    }
}
