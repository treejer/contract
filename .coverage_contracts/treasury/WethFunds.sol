// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x0c2bd4b4(bytes32 c__0x0c2bd4b4) pure {}


import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";
import "./interfaces/IUniswapV2Router02New.sol";

/** @title WethFunds Contract */

contract WethFunds is Initializable {
function c_0xd7dd2f7a(bytes32 c__0xd7dd2f7a) public pure {}

    /** NOTE {isWethFunds} set inside the initialize to {true} */
    bool public isWethFunds;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public wethToken;
    IUniswapV2Router02New public uniswapRouter;

    /** NOTE daiToken address */
    address public daiAddress;

    /** NOTE {totalFunds} is struct of TotalFund that keep total share of
     * treeResearch, localDevelop,rescueFund,treejerDeveop,reserveFund1
     * and reserveFund2
     */
    TotalFunds public totalFunds;

    address public treeResearchAddress;
    address public localDevelopAddress;
    address public rescueFundAddress;
    address public treejerDevelopAddress;
    address public reserveFundAddress1;
    address public reserveFundAddress2;

    struct TotalFunds {
        uint256 treeResearch;
        uint256 localDevelop;
        uint256 rescueFund;
        uint256 treejerDevelop;
        uint256 reserveFund1;
        uint256 reserveFund2;
    }

    event TreeResearchBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event LocalDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event RescueBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event TreejerDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event reserveBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );
    event reserveBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );
    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0xd7dd2f7a(0x4387c132d039219b9717b185471afb98228f3881c496bc454b40c42abbf7c675); /* function */ 

c_0xd7dd2f7a(0x0c12063a02b34ee9eac7bd2c37b953996af6c589227276ad0b738bed8fdd0b01); /* line */ 
        c_0xd7dd2f7a(0x5712950a949a1ce40339ae39f25e5e1dc0cd7e65ed902f7e9f46ced64b1c489a); /* statement */ 
accessRestriction.ifAdmin(msg.sender);
c_0xd7dd2f7a(0xd57b34e944d75f2915379be003196ce732222b90d3f9be8e935f1d86772c263c); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {c_0xd7dd2f7a(0xbb954ff91551c2e8d8a723cbd457f8cfd7bd0c921e57b68685864425cbe6e21e); /* function */ 

c_0xd7dd2f7a(0xee555bd52000aa1b04303bb4c6143190b85d186a8083a4d3cdc273d5d75bb372); /* line */ 
        c_0xd7dd2f7a(0xee23399802b40d8eba6a10024d0ff9a02970b67c45040157578a76d5915e5e6d); /* statement */ 
accessRestriction.ifTreejerContract(msg.sender);
c_0xd7dd2f7a(0x1a02d6ac8c5862c4d46d8b80c1967d552bb3c6575555b7fde3d88f1f1d82f3bf); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0xd7dd2f7a(0xc0ee46b8469e4cc9b2eb97686fe0b041315b757b80ac7bd089190fd56dece1ca); /* function */ 

c_0xd7dd2f7a(0x0e1cbb5473da23f932b969946ed389347343de5224ae4d29e9ca0cef3b46f70a); /* line */ 
        c_0xd7dd2f7a(0xd8cecfe751c2c6b1604e07593f149656c64b71c10ea5a4f2aa46dbd004b877b8); /* statement */ 
accessRestriction.ifNotPaused();
c_0xd7dd2f7a(0x9fe82423c38035538aab2c5b11222b5bedfe353e8b0ba3806b4d54a3378201bd); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0xd7dd2f7a(0x007882005a6c9b3db1509fbb93618baaa23f5e6e9fe3c4714fc9a2f6afe903df); /* function */ 

c_0xd7dd2f7a(0x46a5d5e2ed6c75af1f7721c48797f2adb7c34c7fd65791b000a64b60037fccda); /* line */ 
        c_0xd7dd2f7a(0xd8596d8c76a9466a0808b910d6ac5dda24da7df7b2a977a7e33afbbd32aba3c0); /* requirePre */ 
c_0xd7dd2f7a(0xfd061aa9d74bfe1c81390692c81dd1331f7ad8d2b02aab2831aa2173df160663); /* statement */ 
require(_address != address(0), "invalid address");c_0xd7dd2f7a(0x8da5ea3def2cce20a38e0249972d2eb7b239c4eca3787c76b3802946ca8d5ec4); /* requirePost */ 

c_0xd7dd2f7a(0xc24c1adaa223d7714126727613986443b5431013bf0c89e47727260115fabf40); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isWethFunds
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0xd7dd2f7a(0x260751cef034197209f3f0af1c3d947b554967b9085e1f6060ae734bc9ba9f64); /* function */ 

c_0xd7dd2f7a(0x68d75b6280b323f228a33b6a525dd04b5f6e702d4b79b8975f5f50596fe17322); /* line */ 
        c_0xd7dd2f7a(0xaf2aa570e4f2adbbb93dd28059c5f01eebf2c427fe4f2288f55f8b15b874103f); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0xd7dd2f7a(0xe93d953f92a6f9da86094bcdf573df12a1645ffb77926e1a52fe42cd46707a6f); /* line */ 
        c_0xd7dd2f7a(0x8141ba975c4bd73f425df87728f7ce8e1a9486f857d652cf32a046d725b525ee); /* requirePre */ 
c_0xd7dd2f7a(0xc816a8fd68065588cbbebb85979b4118756204248bb7727338136784262b23cb); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xd7dd2f7a(0xcf5ee6769878408dcd3f3440f989d3d90630b93f450d0377600085ac940121b4); /* requirePost */ 


c_0xd7dd2f7a(0x1693880799214bee188497910ea8d88790fa47ebeb94093966b5b1f4aebddc20); /* line */ 
        c_0xd7dd2f7a(0xff62275603d1fc603d98f26865cda31ebcb0d3c15f8403de4c6fec114988e38e); /* statement */ 
isWethFunds = true;
c_0xd7dd2f7a(0xdfc5ee5d6df0aa8f1c6969f782c6443bffb632d697dd3e3e6f7f5d9d044db829); /* line */ 
        c_0xd7dd2f7a(0x29928f74b93d2f8ba08deb383d579a2e2132d5fa2869d2d87df51db3bdc6e4a1); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin set DaiToken address
     * @param _daiAddress set to the address of DaiToken
     */
    function setDaiAddress(address _daiAddress)
        external
        onlyAdmin
        validAddress(_daiAddress)
    {c_0xd7dd2f7a(0x8fb9947126e4c93bd23f8ba43b278e8736b775c6942f5ffd164e0508cf3a5976); /* function */ 

c_0xd7dd2f7a(0x03e6a4056ca5ff73b68100d0a47e5dbb4c26d14af5c1482e269ea24ec0a0816a); /* line */ 
        c_0xd7dd2f7a(0xab8ef7b68e24d47beebbd2e9c43b1f5f0c31525c9bfb777b0d177b6ddd141c3e); /* statement */ 
daiAddress = _daiAddress;
    }

    /**
     * @dev admin set WethToken contract address
     * @param _wethTokenAddress set to the address of WethToken contract
     */
    function setWethTokenAddress(address _wethTokenAddress)
        external
        onlyAdmin
        validAddress(_wethTokenAddress)
    {c_0xd7dd2f7a(0xf0612cb44c37c369e4858680e696affba7cc530f997770c6df47704f064eb0ee); /* function */ 

c_0xd7dd2f7a(0x09a34f2f3927fbe475da33ed8a412529cf4b262c97901ac035308caefb7d5426); /* line */ 
        c_0xd7dd2f7a(0x586783fc2114dd58119815f5cbec6aad877be3eeafa6d86ba9e86b52a0996a23); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _wethTokenAddress
        );
c_0xd7dd2f7a(0xe328c761d87c8489581ec906e203ef9d7c438cd2b4831e3ccf71e09021d830aa); /* line */ 
        c_0xd7dd2f7a(0xc7500c15c68ff139f394963ee5cd5773fd1c418f21da0bd46c0825ef5b53a533); /* statement */ 
wethToken = candidateContract;
    }

    /**
     * @dev admin set UniswapRouter contract address
     * @param _uniswapRouterAddress set to the address of UniswapRouter contract
     */
    function setUniswapRouterAddress(address _uniswapRouterAddress)
        external
        onlyAdmin
        validAddress(_uniswapRouterAddress)
    {c_0xd7dd2f7a(0x000aed4aec9d8a36c9ad91f0391fc20b2b909438dffc979f1b88a10eb5786da9); /* function */ 

c_0xd7dd2f7a(0xc8fccdfbd17f30c47eebd30a68af1767a798913d89676b97ddb2fa85d2c0f812); /* line */ 
        c_0xd7dd2f7a(0x8b4468dcf6641bd9c8b38772ae169ea1650b13feb7723eb294b8d7b8791b71f3); /* statement */ 
IUniswapV2Router02New candidateContract = IUniswapV2Router02New(
            _uniswapRouterAddress
        );

c_0xd7dd2f7a(0xfe1dbb3a5b496de1be60e4b1129d665dcf60e727ccad879ea30ef913fcb447ef); /* line */ 
        c_0xd7dd2f7a(0x0c5233e8f5d085c80f02fe5d23f2e36cfdef79e557228821ce37897264406f3c); /* statement */ 
uniswapRouter = candidateContract;
    }

    /**
     * @dev admin set PlanterFund contract address
     * @param _address set to the address of PlanterFund contract
     */
    function setPlanterFundContractAddress(address _address)
        external
        onlyAdmin
    {c_0xd7dd2f7a(0x2cbd3ba47b833563761e988ca7ed463243a519d38b7a428800295b4ecf3b06b9); /* function */ 

c_0xd7dd2f7a(0xae55a220ffed4c22fc29f272357e4c59a9282fcfc096beab886a97a2c923f0ca); /* line */ 
        c_0xd7dd2f7a(0xb31400bb99e736a9fda65a6470a94a59c1fd715f78e456b32e400c30494c884c); /* statement */ 
IPlanterFund candidateContract = IPlanterFund(_address);
c_0xd7dd2f7a(0xd3147d7d31077cc59cfa65b5a319e1b4c69165fee0f2dc4e8e746076747c0874); /* line */ 
        c_0xd7dd2f7a(0x4a44f0c66df6c7a0a3bdde11e6170a7c39eea9a67b798c752e93e435dd32a592); /* requirePre */ 
c_0xd7dd2f7a(0x4298876ed269cd8fb656dbc757c27abd71ee861aff0dcecc0cafa58877f0a047); /* statement */ 
require(candidateContract.isPlanterFund());c_0xd7dd2f7a(0xf2b319d012271ab9d2672689fcac5bca5bb6d3bc4d615a94b7d64950eee1f512); /* requirePost */ 

c_0xd7dd2f7a(0x3ed82169eb4fa34de8ef16445d0e6d2259b04fe3562fd14b60fd1b47afe28d87); /* line */ 
        c_0xd7dd2f7a(0x62b789ebe2eef27e598e35e661a8a8e08419d953fee32bceafe728965bb80392); /* statement */ 
planterFundContract = candidateContract;
    }

    /**
     * @dev admin set treeResearch  address to fund
     * @param _address tree research address
     */
    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0x3811ffbe11b97586ee20e98c4fd0a543128aa0dc7671ceccd98dbb7d06e01935); /* function */ 

c_0xd7dd2f7a(0xb398b1ddc6c3a95594a4638757477a94c879aee1648f89fb361d3988d8814d51); /* line */ 
        c_0xd7dd2f7a(0x3ff1345fcbc3749976edf2f34a560027d87c8467652c06db1a43f7c3c525e5f5); /* statement */ 
treeResearchAddress = _address;
    }

    /**
     * @dev admin set localDevelop  address to fund
     * @param _address local develop address
     */
    function setLocalDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0x67c29b859bcde20a2ecaa3104e04a37183eda44f293c9dd4f7f7f1ca6deca0ba); /* function */ 

c_0xd7dd2f7a(0x209c8bf1088784b71910d00d80ba5a5ef91501f8066f88487252a40b355cfb62); /* line */ 
        c_0xd7dd2f7a(0x9508aca0d8d96983d8d3e474b97e1e0d581a0ad7f75f8fc15fc2bb37dd5f45af); /* statement */ 
localDevelopAddress = _address;
    }

    /**
     * @dev admin set rescue address to fund
     * @param _address rescue fund address
     */
    function setRescueFundAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0xda9ecb324440afbe56c26ffcd6fc1ac6854b9bcf65cf1c6001ad9204bb8d4fc4); /* function */ 

c_0xd7dd2f7a(0x94d2b56cfb572a29f964f3536ce41192b9d35c31ecde99bbc84cdb0fb2b9479b); /* line */ 
        c_0xd7dd2f7a(0x862c014b3a7a89e07a663cbe6db1ab9dd7431d64179765377b386ba77128c943); /* statement */ 
rescueFundAddress = _address;
    }

    /**
     * @dev admin set treejerDevelop  address to fund
     * @param _address treejer develop address
     */
    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0x0cf4fa0bb1b69d93b8a54310ca81394df0e5a4f901cf65c0a748005fd45ee09a); /* function */ 

c_0xd7dd2f7a(0x6f5a96b374282a40381b0135a7f1dec18738b2aeba3ee22af09210cfb1a398a2); /* line */ 
        c_0xd7dd2f7a(0x78e5e454f3a88e5f1fbe16a3f92a33374171b0d5f80bcd179b28dc13adbc17fb); /* statement */ 
treejerDevelopAddress = _address;
    }

    /**
     * @dev admin set reserveFund1  address to fund
     * @param _address reserveFund1 address
     */
    function setReserveFund1Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0xd629a04978f2c7f6813104a52dd5faed5f0ee68ee1bfadf252e49e6aa3f0bce3); /* function */ 

c_0xd7dd2f7a(0x41cbdf371725db6785019ec71364790dc3c78c51a1bc757764ef4d1a7139e36f); /* line */ 
        c_0xd7dd2f7a(0x9b16d73f5b5aac2cbdb2193e19077e1cbb6f65c7141280e4b13844d23c239cb4); /* statement */ 
reserveFundAddress1 = _address;
    }

    /**
     * @dev admin set reserveFund2  address to fund
     * @param _address reserveFund2 address
     */
    function setReserveFund2Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0xd7dd2f7a(0x76cbbd673d17fa590285af406782ea329a465640b18d0423afe6a3c84f8c09a6); /* function */ 

c_0xd7dd2f7a(0x9c1113a5e9359fa46ad4c02a02273b09a1c78a2b1ad3bcccf0287b543881f272); /* line */ 
        c_0xd7dd2f7a(0xea0681b5a48f754a8127f17aecd754393d340f570154ac429acf9bec9f4d5420); /* statement */ 
reserveFundAddress2 = _address;
    }

    /**
     * @dev fund a tree by IncrementalSell or Auction contract and based on distribution
     * model of tree, shares divide beetwen (planter, referral, treeResearch,
     * localDevelop, rescueFund, treejerDevelop, reserveFund1 and reserveFund2)
     * and added to the totalFunds of each part,
     * @param _treeId id of a tree to fund
     * NOTE planterFund and referralFund share first swap to daiToken and then
     * transfer to PlanterFund contract and add to totalFund section there
     */
    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external onlyTreejerContract {c_0xd7dd2f7a(0x564a1c1fc567569056702f7a7f9c76b39794169fd277bb8f760b1eeb7b38008d); /* function */ 

c_0xd7dd2f7a(0x91811d921da21542f53d3d76176e175d2d59310722345aa5e92b097b72922457); /* line */ 
        c_0xd7dd2f7a(0x90332a5ea2b9eb7a0f26f70c2d05867cb3ec0a2e91cdf0215d58314791d40888); /* statement */ 
totalFunds.treeResearch += (_amount * _treeResearch) / 10000;

c_0xd7dd2f7a(0x5745b85df7cdbace84a1749c7152e6f5a37a1d32979b7b8b20f5939b944b35fe); /* line */ 
        c_0xd7dd2f7a(0xc4dc105488c1863aebf755236d90c6be3a5b3390dae11ecc23b2233b317ce7ef); /* statement */ 
totalFunds.localDevelop += (_amount * _localDevelop) / 10000;

c_0xd7dd2f7a(0x043edfdbf894c2e39c1f68ef0550cbdded5f70dff694b9ba3ce36df0b6a97a20); /* line */ 
        c_0xd7dd2f7a(0xaab224f37d3a9a0f8caa27ce60028ebeb1812759742a57bb4141cbbdacda7a68); /* statement */ 
totalFunds.rescueFund += (_amount * _rescueFund) / 10000;

c_0xd7dd2f7a(0x8a763a4575ac83f9332079e540c33fd458991c815eccb368129229b570c187d5); /* line */ 
        c_0xd7dd2f7a(0x52da38d4b2ba51ca42e1abb6dffa5f9d82f742fb86577c18d8c28fba69bbae36); /* statement */ 
totalFunds.treejerDevelop += (_amount * _treejerDevelop) / 10000;

c_0xd7dd2f7a(0x3e9a32e5b724108ef44e0f0ac993a9797d5722853ede298eb66e6c61972b6413); /* line */ 
        c_0xd7dd2f7a(0x37a475e67745fd3623f7c0cac2e22d08e42ff7bd4e9060a4493b8db794d41f02); /* statement */ 
totalFunds.reserveFund1 += (_amount * _reserveFund1) / 10000;

c_0xd7dd2f7a(0x20af93a5f47d6e98d0a506cca7f75990c3d231e1ee3452c87bc3b1f9697f1ff0); /* line */ 
        c_0xd7dd2f7a(0x13a62fb49ec09f82fd78dd2039f1b445a650b226e7bd2bf00ac8deacc21cd442); /* statement */ 
totalFunds.reserveFund2 += (_amount * _reserveFund2) / 10000;

c_0xd7dd2f7a(0x901ce672195732e894126805b50a47945b092a9050257b4beeaf3fa3b5f1c930); /* line */ 
        c_0xd7dd2f7a(0x0c413215a988b228f636d2bc7638431ef31d8e87b5068e8c9b3b05ab7a3012de); /* statement */ 
_swap(_treeId, _amount, _planterFund, _referralFund);
    }

    /**
     * @dev admin withdraw {_amount} from treeResearch totalFund in case of
     * valid {_amount}  and wethToken transfer to {treeResearchAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreeResearch(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treeResearchAddress)
    {c_0xd7dd2f7a(0xcf9d86f0761bdac3f26711a902a54c0c701ac7a22c570d3168abc77ae1548fa5); /* function */ 

c_0xd7dd2f7a(0x01e200ac569d705bec1d7db5dbaa7e5e9fc3060119b303fa97db8b9fcac3d66d); /* line */ 
        c_0xd7dd2f7a(0x111e97482ee4ce4808a7f2754bff93571ce5ac2742ddbeab4f8e96bbff30e2df); /* requirePre */ 
c_0xd7dd2f7a(0x797ebe024079f9791c4d4035d95deb72d254c2c43ca9c503273789510a41c1d8); /* statement */ 
require(
            _amount <= totalFunds.treeResearch && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0xa4408e28bed93a6023a8fa6a6fedf7e14fc1d2b7f0b793b5a12f2956b20513bc); /* requirePost */ 


c_0xd7dd2f7a(0x7ad0ea5d2249eb3679a845e9728ef6c61eab58368d5b73c2fcab9898da6bece6); /* line */ 
        c_0xd7dd2f7a(0x9c0c3fd85fbbe544496c80a36d852f00d262d29873d1a27fb7d43e315ead2340); /* statement */ 
totalFunds.treeResearch -= _amount;

c_0xd7dd2f7a(0xc97980c3dd714ffd73e42bec9e58ec728e306e54ae6055fa4bf50b3195028296); /* line */ 
        c_0xd7dd2f7a(0xbbb2c4c62595c29216331a0f2130565dafa0dfa04af14ae54d447546252b26e8); /* statement */ 
bool success = wethToken.transfer(treeResearchAddress, _amount);

c_0xd7dd2f7a(0xd62d34b30601cf0da268dddaee2db96688fda3bf543ff6f9fde01983b7676bb9); /* line */ 
        c_0xd7dd2f7a(0x22133af33855a9c2a33d542a60a980dc2248c7015127345047ea4a8103b56fa6); /* requirePre */ 
c_0xd7dd2f7a(0x345df02038478da5edc2cf1103be8ca8be8d1e3b4c91ef718b3449d7dd18396b); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0x12b66d501c9ba419bc831245287939faf38b95149b4128664c5560e134370b9b); /* requirePost */ 


c_0xd7dd2f7a(0xa07a52aa5fb512fd03e106d82b6e637fef1856485e32c4da20a6aebd36def18a); /* line */ 
        c_0xd7dd2f7a(0x54a89a79132956c9eb5febb725af1ef692983c3817c6d1680cf9029e2ca5cc88); /* statement */ 
emit TreeResearchBalanceWithdrawn(
            _amount,
            treeResearchAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from localDevelop totalFund in case of
     * valid {_amount} and wethToken transfer to {localDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawLocalDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(localDevelopAddress)
    {c_0xd7dd2f7a(0x008542b0c081448054e0af3d3b219632fbd5639fd34992019039bbb692bbfda8); /* function */ 

c_0xd7dd2f7a(0xc0b1bbea06cc25d328014ad837fa79897712315606b526ffe37f64751a4151d2); /* line */ 
        c_0xd7dd2f7a(0x15707c53d92764b4014b5402845ba7b942b0c7fa29c3d3aa6f7168d99edb5c80); /* requirePre */ 
c_0xd7dd2f7a(0xff9f1067e32e820c4986402a22c76f22383a362c7c6827298ee8cd2ce6b3b590); /* statement */ 
require(
            _amount <= totalFunds.localDevelop && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0x73c8081f90a1b46d5d966fb8f71937285a4543cd28ef1f90a436bd43f7670912); /* requirePost */ 


c_0xd7dd2f7a(0x80bb85ef9bf90c961fd5ddf9c5805840b71b461b81d20318a440a8c6d140cdcf); /* line */ 
        c_0xd7dd2f7a(0x02bfbedd0e516eb2feb8d0244db981c4da542e80618efb314b8b3531666f7c24); /* statement */ 
totalFunds.localDevelop -= _amount;

c_0xd7dd2f7a(0x7c54273a60ea50f168f8d3d1fa58199c46297d51b63176bb1135e10f0e5f4846); /* line */ 
        c_0xd7dd2f7a(0x7cabbe2b6b375c8a3d8d8fdaac89ce96f072973f6f31907fd20405227cc5853b); /* statement */ 
bool success = wethToken.transfer(localDevelopAddress, _amount);

c_0xd7dd2f7a(0xa0b15fa0fdc241ee70971733fc2b6d70889a198676c7e6867c3e9027d93853d8); /* line */ 
        c_0xd7dd2f7a(0x663cad3ff3903a1f422f8d048bdddb57d0651e3897b7dacdd2c61885506bc3d3); /* requirePre */ 
c_0xd7dd2f7a(0x14e87aa4e9482962bb3c9eb4134027a6dfe812c9d455a9ff04b264132265fb97); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0xae9a7f50442a4503e3e6801b8a374202ad00bda3775fef43b98f5fac38503f3e); /* requirePost */ 


c_0xd7dd2f7a(0x695fb0f97d396daf8f8892bdf1361e5c9263ecde600e10cd9297c9e0754f9cfb); /* line */ 
        c_0xd7dd2f7a(0x9ea750a7f228803a573b63cba6d08e33b0675cfc40edca9e8ee290ffed4e7eab); /* statement */ 
emit LocalDevelopBalanceWithdrawn(
            _amount,
            localDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from rescueFund totalFund in case of
     * valid {_amount} and wethToken transfer to {rescueFundAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawRescueFund(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(rescueFundAddress)
    {c_0xd7dd2f7a(0x88a9a0ebdd0ea508d058dd0988d01be62dc988d48e1134d3c55d50880525ad90); /* function */ 

c_0xd7dd2f7a(0xe22eb2ce4bf1e98b88193cc50ccbfdb7b566d32d8a4a10623cdd785860aad99e); /* line */ 
        c_0xd7dd2f7a(0x50a467e57a30a392c251214387bcb3cb6a7b973ec20441adbe1d0522cb7949a7); /* requirePre */ 
c_0xd7dd2f7a(0x0777cfb2e0c5bf6990e07308d2c70bbd6ee6ba2bf8cfe2beeb48ffba59f37b6f); /* statement */ 
require(
            _amount <= totalFunds.rescueFund && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0xa12b58598403f1eabab16ec2554c378a4c7a0626c5c35c46b539be5027e05b1d); /* requirePost */ 


c_0xd7dd2f7a(0x828e10b8c4ff58b2b84e7f9321c1ec99f99cd88cb50b56493945c3e3323f3b5f); /* line */ 
        c_0xd7dd2f7a(0x14e223f5ca08f785fa8f2d8648be62953f32f6323d2ac2da80277034e066905c); /* statement */ 
totalFunds.rescueFund -= _amount;

c_0xd7dd2f7a(0x384cab6c3ea3341499b19f4fa91e3929743031d9aae61e0ca63a81a581e4118e); /* line */ 
        c_0xd7dd2f7a(0xa94a82700aa56ed9c1d08f3cd9563a9876396c0386bda0c71ee7879ee26159dc); /* statement */ 
bool success = wethToken.transfer(rescueFundAddress, _amount);

c_0xd7dd2f7a(0x96e8bbda08e49ac266d03090ea4a82c7ea6659fe1216f235803a4affbf869bc6); /* line */ 
        c_0xd7dd2f7a(0xa8a4a1c0bf09d98186acaa9300331a47e2198ef208d05a07e1dbd4bc647e2652); /* requirePre */ 
c_0xd7dd2f7a(0xa60f872360bdd3dc52b2e04b7000389a6716029cc03cee8b469968c8ac496df9); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0x62c226916e4d4370c58aaa6d6674a5ae42a6346ddad8009326be248b213a906f); /* requirePost */ 


c_0xd7dd2f7a(0x569082f9e07fc60658c395e8c4700e7ec283369ab385789569c7a82833de8e7f); /* line */ 
        c_0xd7dd2f7a(0x4950709392bc59671d30b93e67f3ca563592612dcaf2376b75f54d4f02408405); /* statement */ 
emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from treejerDevelop totalFund in case of
     * valid {_amount} and wethToken transfer to {treejerDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreejerDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treejerDevelopAddress)
    {c_0xd7dd2f7a(0x1ac44aeb88c7544f2df8c949dfb7f48fc769763998d355d8ee9abed477adb596); /* function */ 

c_0xd7dd2f7a(0x8441fb9ebb1c74b0aab991d63e17413d08e7881e69c29c4d2e6d2658b18d4044); /* line */ 
        c_0xd7dd2f7a(0x9e38b38097c24b3417836e6638f195bf9031411340778702212a7c4508ffae29); /* requirePre */ 
c_0xd7dd2f7a(0x93feaf4ca9ecbd47525adf099f54b7180f7540ed3e5634847f421e16cc9630f6); /* statement */ 
require(
            _amount <= totalFunds.treejerDevelop && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0x7afd0e1efd2be57efd74d08653dc1e08d4ee7fcc9cb2aca067f74cfef5bf4b72); /* requirePost */ 


c_0xd7dd2f7a(0x68ec451fe75f14397478ebfadd07cf232d6396dacb715df512f7ac1abc24e519); /* line */ 
        c_0xd7dd2f7a(0xf2f9108f79204f153d9a910380eb53c3eb0dfbd9e2f63eebf687e0192a986d07); /* statement */ 
totalFunds.treejerDevelop -= _amount;

c_0xd7dd2f7a(0xf97ac3cbf4b8cef9e236501843cfefbda7f6184c67fbd35c786b2ca99b9b90ca); /* line */ 
        c_0xd7dd2f7a(0x81f12874bed5ccf2a62a333dd42e085a6ccafc110fcf87591ac93d4846e25744); /* statement */ 
bool success = wethToken.transfer(treejerDevelopAddress, _amount);

c_0xd7dd2f7a(0x94f622d5c0fbc27b156f8cded42468995cac6da93b6070e510a2943027afb059); /* line */ 
        c_0xd7dd2f7a(0xe4be368806bdd354b07aa5f5e684fc399122e0f139c771df69b943acbdf94a66); /* requirePre */ 
c_0xd7dd2f7a(0x436e8d1195575d0fb84f8c3d479ee8761cb01f198e1835bafda8d18aedaa56a0); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0xf95bdfd9c0248f57aedb861828ab7f07310257b333a049222be320257093e295); /* requirePost */ 


c_0xd7dd2f7a(0x2cf5697c98198c213d0df9cc8ae377b45c3e77d5f1b075c5d1e15e3ab28d8829); /* line */ 
        c_0xd7dd2f7a(0xc28f28f2a3d66ba5b630c29d943a33cdad9a80c489479af70caee760a3ba13be); /* statement */ 
emit TreejerDevelopBalanceWithdrawn(
            _amount,
            treejerDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund1 totalFund in case of
     * valid {_amount} and wethToken transfer to {reserveFundAddress1}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund1(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress1)
    {c_0xd7dd2f7a(0xfc43ccaae24f460c16f8d75554df6051dbfad6fd32617837408cc1fee163fb3b); /* function */ 

c_0xd7dd2f7a(0xac6fa375399b41dac22faa78f664e8289d6561a51d81205b0f7cbfa8a7829f14); /* line */ 
        c_0xd7dd2f7a(0x3a0acd8bef0064616cc1f7580c21ea9e7b0f60b5b0d7c5286e0db2ff6789cfc8); /* requirePre */ 
c_0xd7dd2f7a(0xcc98684641fa5c91cdf9ce4a93b5c7263e4a8776f9cad8981ae4d5c3cd76033c); /* statement */ 
require(
            _amount <= totalFunds.reserveFund1 && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0xa8a2df6155becc50994611241857f43c2ca5417229f108da9e626ebe94c87d2e); /* requirePost */ 


c_0xd7dd2f7a(0xd8fe474a38f559104139c092ae9a315afac4b5b87121fdc66220b4946fecb661); /* line */ 
        c_0xd7dd2f7a(0x76b87291ea8865c51852a3d0a7265338b669a052bfaad876bb501ff6fcf90e53); /* statement */ 
totalFunds.reserveFund1 -= _amount;

c_0xd7dd2f7a(0xec56cefb56d15efe8440c4ae4d85332149b694cdc38b7829ada9752b2bdb0c11); /* line */ 
        c_0xd7dd2f7a(0xd46dc6e76696ad6ef49a7ef0521610257a0c7e90157642bd29a247de5a2e00c1); /* statement */ 
bool success = wethToken.transfer(reserveFundAddress1, _amount);

c_0xd7dd2f7a(0x44af6203e27012f53016fffce8e7cb6bcc9f4ea27a0335a8284e03d93436ca3c); /* line */ 
        c_0xd7dd2f7a(0xcfd46e18d5ca361f6feb308beabbc6c40ee7c836953a4ea341ccb5d620c62316); /* requirePre */ 
c_0xd7dd2f7a(0xf4e3470b58a2db3148f887776d71796454f80c2f9ca351c0f40cbbd8dd92dac4); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0x8ed2f7f894279f12b96718de8bbbc9a3e176ff5c80c3cc02416233103f081955); /* requirePost */ 


c_0xd7dd2f7a(0x68b5d1dde6eea00f71d8bcb1412cd33fd1620754e1a97e16a79b206422f7f596); /* line */ 
        c_0xd7dd2f7a(0x664f858ba522a0a286d2b21842d43a0dccc5464f889ae4940a03def4cfa611d7); /* statement */ 
emit reserveBalanceWithdrawn1(_amount, reserveFundAddress1, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund2 totalFund in case of
     * valid {_amount} and wethToken transfer to {reserveFundAddress2}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund2(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress2)
    {c_0xd7dd2f7a(0x0a153c158fecaeae9930c5a2a3ad9d4eceae2a3510ee6c8cfcf6f3897eb0d992); /* function */ 

c_0xd7dd2f7a(0xc112cfcfd1b076d07092a4773e398853c775cc4549bfee63fc3ee070c1926de9); /* line */ 
        c_0xd7dd2f7a(0x5308090c555c081c239eab1e6e565ffeb6d768d4d339bd77bb22a1c7556a276e); /* requirePre */ 
c_0xd7dd2f7a(0x8d5522d38c8c3df5e602302d7e7f79ceda8364fe11d3cc13f59eb764b1815129); /* statement */ 
require(
            _amount <= totalFunds.reserveFund2 && _amount > 0,
            "insufficient amount"
        );c_0xd7dd2f7a(0x4087e6f2a8ce5742f1bb535b9b81740fec957696145142029c6a664c89eb9c53); /* requirePost */ 


c_0xd7dd2f7a(0xa5986c3e77b94390356d77102b700dd6c094a3881b96cfe78e6de97547f7de86); /* line */ 
        c_0xd7dd2f7a(0x384a45e37a10dd6bca1bd5fab1b6c221143336711581e983ca7d658e5492ee4b); /* statement */ 
totalFunds.reserveFund2 -= _amount;

c_0xd7dd2f7a(0xad2fe455b285ed1d6c541ba2c736169e0863e69278b7b6220d1ed57b4d0667b1); /* line */ 
        c_0xd7dd2f7a(0x146ffb03b212f05e9300dd8926265ed4c270e89b04762573ed1580a275164027); /* statement */ 
bool success = wethToken.transfer(reserveFundAddress2, _amount);

c_0xd7dd2f7a(0xd916b692be11d8ae5cad4bf439c60e8640085134f6ecfda226de0eb900d8436c); /* line */ 
        c_0xd7dd2f7a(0x0f597f920e3be88ab29df17dda31e3626054d5f825207a8d812057f2878db1c5); /* requirePre */ 
c_0xd7dd2f7a(0x3eb4cdde83c9f14cfdbe63a88c9011ec3cc6dc7e9c1e0a9a4e7dd6eacc866e38); /* statement */ 
require(success, "unsuccessful transfer");c_0xd7dd2f7a(0xd441b5817855293a5526908ffaac7054348ed7d7c73286f0a3172969e627f29f); /* requirePost */ 


c_0xd7dd2f7a(0xd447d08bb6a9867c98e522bdd78acb253d3906a76eb23f9bf1badc7b24849a79); /* line */ 
        c_0xd7dd2f7a(0xd4fe61d3c38cbdf15c3a3060ecc5d386fb04adf790121b359134bc8632d50a2a); /* statement */ 
emit reserveBalanceWithdrawn2(_amount, reserveFundAddress2, _reason);
    }

    /** @dev private function to swap {_amount} wethToken to daiToken
     * @param _treeId id of tree that funded
     * @param _amount amount to swap
     * @param _planterFund planter share
     * @param _referralFund referral share
     */
    function _swap(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund
    ) private {c_0xd7dd2f7a(0x6594732a39bf29df58d6b6f8ad86e035d4d58e802edc2d62df6690747d5e6f78); /* function */ 

c_0xd7dd2f7a(0xd98bf61dcbd90ab6d72536eaef53d1eafe921d3b361d50536bd3046f35c8305a); /* line */ 
        c_0xd7dd2f7a(0xb7abc54b15a21f9f2840344441d397acf2dbc3fee771e498f5ba524a7fb85cd6); /* statement */ 
uint256 planterFund = (_amount * _planterFund) / 10000;
c_0xd7dd2f7a(0x000c7d7fbea5952d3d945ffeb794546d75742fdd0b31ce805b3103ac3ac9c8ac); /* line */ 
        c_0xd7dd2f7a(0x1c5cf3e52153afe7667fee5a428a67026c90c28b651bff1bc22200249c949347); /* statement */ 
uint256 referralFund = (_amount * _referralFund) / 10000;

c_0xd7dd2f7a(0xf23d184f8576c4f5a2fabf2f79f58c313fcc6c0c43dc355e360c5c87f8c167c7); /* line */ 
        c_0xd7dd2f7a(0xc321398e9da28c9ffa671d879b1e732ee049ea69fd4bd47eefe63acafc0c9be7); /* statement */ 
uint256 sumFund = planterFund + referralFund;
c_0xd7dd2f7a(0x4e20efa538ab2d3ef694dd4612fb77faf3eaf54b79351fb97694c1b801ae767f); /* line */ 
        c_0xd7dd2f7a(0xded45b74467b03b7bc79b4d0b09985f41541fea3112a4432569f707da87d1933); /* statement */ 
uint16 sumPercent = _planterFund + _referralFund;

c_0xd7dd2f7a(0xe719df8f1f79c7897b5233c7098416e8ae194dd694bc45682cbd9cdbba5e3608); /* line */ 
        c_0xd7dd2f7a(0x2c02f10fdb066ee5264faf1cce4d34ebd056489724ae2194cd3402db56b3f17f); /* statement */ 
address[] memory path;
c_0xd7dd2f7a(0x997ff184c8e3c96d80061519d4444859962aa35d72c65983603eaac31fc1c862); /* line */ 
        c_0xd7dd2f7a(0x0344ccddc2ec82dfa4e6ae76b27c7b1bb73426bcc410794a1ab5588176800500); /* statement */ 
path = new address[](2);

c_0xd7dd2f7a(0xc1c9274d4f58c4e541b1b59121c7508372e61c86f8bbc79d809969a357e8e574); /* line */ 
        c_0xd7dd2f7a(0xa2f34d552e2435119f3f79b293245ef50d202bdc5cf37f02e2b6a3d3a33dd212); /* statement */ 
path[0] = address(wethToken);
c_0xd7dd2f7a(0x8fe6154c82d9e5d84668316f7ece351ecf9b8ba07ee1f794d3cdbcd1b1169c7c); /* line */ 
        c_0xd7dd2f7a(0x39650c3f47d6ee526a6a1453d1b198a7990a7f8df8c9b6da3e34b990eadc9d13); /* statement */ 
path[1] = daiAddress;

c_0xd7dd2f7a(0xcc0575fa06cd1d86023d00769f812930b632508f37219df4646835d57853de7f); /* line */ 
        c_0xd7dd2f7a(0x16a84ac5fc67e57e95a146ff55f2ade98408cfe9f2e1d3ce6e9b123602df5f65); /* statement */ 
bool success = wethToken.approve(address(uniswapRouter), sumFund);

c_0xd7dd2f7a(0xfd94ce7795c0ee4c34a40f0306fe5b0665a847a2d50c442ac874b394e19b5c6a); /* line */ 
        c_0xd7dd2f7a(0xb919d4fc8a3e67a77844176ca22d6113a9ec2f3f68fa9ebe435bc6c0dc89791e); /* requirePre */ 
c_0xd7dd2f7a(0x9ed3ebe0dc5ba4412360075b8fd9e6756a630171a61ccd50f6a9b60365077c96); /* statement */ 
require(success, "unsuccessful approve");c_0xd7dd2f7a(0x2ceee6db77fc2e781ec59faa47b163fa8dee3fd8a2c70f39274688abab55b0df); /* requirePost */ 


c_0xd7dd2f7a(0x8964aecfd7d9b1dd87af628e6b4d01e9e750571c8f7970f2557885fe9a4ea66f); /* line */ 
        c_0xd7dd2f7a(0xc8ba43aa6301dc7df0e14785cd1d3d7ba28d2f2d92bcaf5fc16f246e1bb2efbe); /* statement */ 
uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            sumFund,
            1,
            path,
            address(planterFundContract),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );

c_0xd7dd2f7a(0x8e300e648104d7093c9aa4026cb723fb22117cdcbc554354f62f5f0679c2e57d); /* line */ 
        c_0xd7dd2f7a(0x5a33075561e3ab8eef2e2942d6c61f34ae286f840d90f2b1ecaf57e54c6e7a84); /* statement */ 
planterFundContract.setPlanterFunds(
            _treeId,
            (_planterFund * amounts[1]) / sumPercent,
            (_referralFund * amounts[1]) / sumPercent
        );
c_0xd7dd2f7a(0x95c66ae485731b0f14a7861eba9ddf5f08e686ecae68159b066e7c78937e5658); /* line */ 
        c_0xd7dd2f7a(0x99b7a1ef4563b9e389a881af07606d8a692cb3a103ef78e68b95173878318e42); /* statement */ 
emit TreeFunded(_treeId, _amount, planterFund + referralFund);
    }
}
