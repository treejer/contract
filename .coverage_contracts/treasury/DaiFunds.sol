// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x7bf6b72b(bytes32 c__0x7bf6b72b) pure {}


import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPlanterFund.sol";

/** @title DaiFunds Contract */
contract DaiFunds is Initializable {
function c_0x934e0368(bytes32 c__0x934e0368) public pure {}

    /** NOTE {isDaiFunds} set inside the initialize to {true} */
    bool public isDaiFunds;

    IAccessRestriction public accessRestriction;
    IPlanterFund public planterFundContract;
    IERC20Upgradeable public daiToken;

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
    event ReserveBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );
    event ReserveBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );

    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x934e0368(0xc31d46b57eb60fe22a7ffc4714b9a0f8368eafe91b7e4efe75f87720878cb1b8); /* function */ 

c_0x934e0368(0x6204c12cc5ee9e6f9a9230820ccd67023c838b66f3e89ca1f421451ad70b1053); /* line */ 
        c_0x934e0368(0x70a9674d9e18c33a20cce8f5c0247a06a9a327dd22b4c9f97e516a03554dc77b); /* statement */ 
accessRestriction.ifAdmin(msg.sender);
c_0x934e0368(0xebcedd155137746292a6767ec80da696547d45bb4aa2aaa12490fd26cb4d81f4); /* line */ 
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {c_0x934e0368(0x98481d4b14c9ee1049089f59021689b1e1de3256a92f12615bb25d1cf5add605); /* function */ 

c_0x934e0368(0x86181bdb24a510163e8083ff642036739d9acde225660b9debbaf75d57cae4d1); /* line */ 
        c_0x934e0368(0x7ee9eec84fdc014278ae6a07e0f7193d1574299394b4f91dc4c0a3fa49271ae9); /* statement */ 
accessRestriction.ifNotPaused();
c_0x934e0368(0xd0d9828d3a2c6f1997571326755747ea31de71a4e398a6c9cbffde09552aca31); /* line */ 
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {c_0x934e0368(0x8bc592f2b40fc57064d918ff235b1f18966c57b811836c8b4a90e5da812e3e5a); /* function */ 

c_0x934e0368(0xc6f0b3188a640c6b69bc043f6653e0c32e65646ec2c47876386637adaf77e9ec); /* line */ 
        c_0x934e0368(0x2c605fde5a9b2b458c5462748521edd88ee23452599d42c5022c26bd39c31ef2); /* statement */ 
accessRestriction.ifTreejerContract(msg.sender);
c_0x934e0368(0x4b2abd658db62583f04491613a4df8f7de1a6785e68fbdb1e695b8d259e2a828); /* line */ 
        _;
    }
    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x934e0368(0x795a63b1ec044e9998eb5be4e4863c3aaa67da02ebefc0ecd780fe31b7cb2686); /* function */ 

c_0x934e0368(0x8542d49a5c0b8ac9c936e3b4bb9684b4ca156ac0a8ff1daba4dba27c7b8de993); /* line */ 
        c_0x934e0368(0xae1505d7f387e6dfb5217bfb5f220a97d1f999454f26b0be8ef533321ac4bd91); /* requirePre */ 
c_0x934e0368(0x3b8e2174a8dbcd4bb9e9db43f5cfcbe5c98abe64a29e3903c051e272892dd91e); /* statement */ 
require(_address != address(0), "invalid address");c_0x934e0368(0x1e4f64cc94b43caa66f1ab11a502122e440b4ba1148e708304939f7ac23a4560); /* requirePost */ 

c_0x934e0368(0x9b82f95c59152ce05cfb57016352b45011c30555f344ee5c87c7ba5c773e9006); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isDaiFunds
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0x934e0368(0x0ca8db56d41871062143e4d16caaaf511f27f9e1af35f9ba324eaa103e34b968); /* function */ 

c_0x934e0368(0xe509116e7b431247230b4644717e00f67c4297eb8e75243091789bb27f319ad8); /* line */ 
        c_0x934e0368(0x41004ef000ced070f888919dcb0a4b14b2b75dc2811b18cfd7d73c90428bfcdc); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0x934e0368(0x810cb93d719a4c7f31ae610b699961f00387a4eb2a08de1fe0931e5f0ccd6457); /* line */ 
        c_0x934e0368(0x795d86c03d372dca6eec400cb90d25d8b0f37ee8247769837d5db8e0e1ebff0f); /* requirePre */ 
c_0x934e0368(0x5a64421644ff8ac627be2a420f5e6de3721388f3278f5b5c16f454f5f62eb09b); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x934e0368(0x13bc44d487fadc69212f244c633fba90cccdff4c260a5d327409ca71808cdd21); /* requirePost */ 


c_0x934e0368(0x37b37fd4d0e11743e07c08870268931ef8622c0af1dc57ab8e39418e1b5d554b); /* line */ 
        c_0x934e0368(0x0b6b2e26e322a4312e239883640f6fc881b7f68d951f5beadf4f54290abbe928); /* statement */ 
isDaiFunds = true;
c_0x934e0368(0xab33e51a32cb148437544ddf26ab2154c3deeeb2998f01dc778c6a5b1061a0ab); /* line */ 
        c_0x934e0368(0x43dc75edb132f0856806070bc8e4c74a4246b7ddbf95713359e5c1dd65b0c1d3); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin set DaiToken address
     * @param _daiTokenAddress set to the address of DaiToken
     */
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        onlyAdmin
        validAddress(_daiTokenAddress)
    {c_0x934e0368(0xadd414661f725aa9bad102a8509dc6cf3ad922620d9736be22bb1ee51d3c1497); /* function */ 

c_0x934e0368(0xc6f57f8a6c201cff239a82dbb6d982f8300b70e126a7ba84c6150266b085189f); /* line */ 
        c_0x934e0368(0x0d182a2311b93807dee85df6224f497768fd3938e36469cd74556f2fd5c0c631); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
c_0x934e0368(0x1af691aa28dcd79b5eac031b3f05c974ca9dbefd447b40be81beb651e79ea7d2); /* line */ 
        c_0x934e0368(0xa0e56e6bc97b3da4c92bf030702704bf4204f964e22d35c2945de06b28fbea29); /* statement */ 
daiToken = candidateContract;
    }

    /**
     * @dev admin set PlanterFund address
     * @param _address set to the address of PlanterFund
     */
    function setPlanterFundContractAddress(address _address)
        external
        onlyAdmin
    {c_0x934e0368(0x9c61e34f27eaeedc2e21044024bfe99fe714856976e324c4a5bc140053a6a290); /* function */ 

c_0x934e0368(0x36fa425e5afb9976daa03a0105b8fef3608a704d1c9af2b3f1c46245142e4cca); /* line */ 
        c_0x934e0368(0x097809fec9d05a272945e9b60561d3921ee67d5c98e547a3d724f91758ab193d); /* statement */ 
IPlanterFund candidateContract = IPlanterFund(_address);
c_0x934e0368(0x4d0ef0096542120e0a6d3419348cc4e897b7fc2fafde488e9b3318fe4abe684d); /* line */ 
        c_0x934e0368(0x1aac4b71ad4eae3cd73cdf38d44700aa5eaf39fd134a0579d6cc297e5d1080a9); /* requirePre */ 
c_0x934e0368(0x380360ea48fe1da4e9086ebdae806816ba32db4b52a721458481f683f4cd2f7b); /* statement */ 
require(candidateContract.isPlanterFund());c_0x934e0368(0x28ed7b68672aaa7892abd155ad9ddfdc6330c8d8da922f5686e5b55dc669e151); /* requirePost */ 

c_0x934e0368(0xa470205c6a4e2c322472bec90b6b6cd3db40ff1af3765999d0daa6d0c360b393); /* line */ 
        c_0x934e0368(0xe380d3351f8f0ae0c9875b54588f9b0fa71578b8929070de4255e41183181cfc); /* statement */ 
planterFundContract = candidateContract;
    }

    /**
     * @dev admin set treeResearch address to fund
     * @param _address tree research address
     */
    function setTreeResearchAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x934e0368(0x43734623298fb4755e3efaeb7a5cb6db9a75d9aea8dcb987c8050518c835e6fa); /* function */ 

c_0x934e0368(0xd99cbe689188a782d658e8448e5a5e1562ce69ad563204751b2e537ee671037e); /* line */ 
        c_0x934e0368(0x8f4a670e376528a4e976c8e2e613fdec225d5b5ebf613ab982a9177b49f4e7d5); /* statement */ 
treeResearchAddress = _address;
    }

    /**
     * @dev admin set localDevelop address to fund
     * @param _address local develop address
     */
    function setLocalDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x934e0368(0x5fbd38fd97209b9d4ca5ff5ab0c85e9dbbc5a6a7d953a7691ef217a7e843676c); /* function */ 

c_0x934e0368(0x3c37b606c67fda1a22679edf8f008334b7219005106fe8bb1da01bea96d651bd); /* line */ 
        c_0x934e0368(0x63a080af692e3ec8b07a9c6c28f8b0be7c190a7c7511bba6c4ec8eb98766c535); /* statement */ 
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
    {c_0x934e0368(0xcd9743756450f4a8889f4c9c3b34cfd563b896901e20d08b33f51513d09a2fae); /* function */ 

c_0x934e0368(0xb47ad127bb9130c2f000b100a0ed08239afd453e631e7a42307f1c7c513f1b30); /* line */ 
        c_0x934e0368(0xdcbcd632d06e66d546f3fd8c0827cc6e8606d1852f98280a3feaee58fec96c70); /* statement */ 
rescueFundAddress = _address;
    }

    /**
     * @dev admin set treejerDevelop address to fund
     * @param _address treejer develop address
     */
    function setTreejerDevelopAddress(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x934e0368(0x1416a5534c1178e2d848d37cb8514a147c0d87d8c6738fcb640f38d515c73840); /* function */ 

c_0x934e0368(0xde788727ca9fdd70891cef288edef51306774250f561ca2b0c7384968f2e9faa); /* line */ 
        c_0x934e0368(0x3b1afc6a18b2b9899c7ec12508117fcaff419ec80eb101af28ddb260e28fc0b8); /* statement */ 
treejerDevelopAddress = _address;
    }

    /**
     * @dev admin set reserveFund1 address to fund
     * @param _address reserveFund1 address
     */
    function setReserveFund1Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x934e0368(0x882f955370f05bca384d14adc7469ed3eadfe5fcbeb6e267a06ddb98702f2b82); /* function */ 

c_0x934e0368(0x99526ea96b49d4b255a5eff98cee784bb954f5b28d1881c444d505ce687886c5); /* line */ 
        c_0x934e0368(0xade463d95f5219ca2ea4d54e9b8ad32410e0a576287805758457feb0a8927e50); /* statement */ 
reserveFundAddress1 = _address;
    }

    /**
     * @dev admin set reserveFund2 address to fund
     * @param _address reserveFund2 address
     */
    function setReserveFund2Address(address payable _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x934e0368(0xc7768577dfdc2398494a4a19b671dd75e4e3108c8aca286f4548592f06844585); /* function */ 

c_0x934e0368(0xe53487ae4069c6eea160028204502e12b211f7d068b4405fe474a2f8bf5ca34d); /* line */ 
        c_0x934e0368(0x254bb23029f5031d8f75c0146eac8083d00663ae7d2144caecfd5bf2848c0025); /* statement */ 
reserveFundAddress2 = _address;
    }

    /**
     * @dev fund a tree by RegularSell contract and based on distribution
     * model of tree, shares divide beetwen (planter, referral, treeResearch,
     * localDevelop, rescueFund, treejerDevelop, reserveFund1 and reserveFund2)
     * and added to the totalFunds of each part,
     * @param _treeId id of a tree to fund
     * NOTE planterFund and referralFund share transfer to PlanterFund contract
     * and add to totalFund section there
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
    ) external onlyTreejerContract {c_0x934e0368(0x2ed76a5ce696d6d6076712250d4c0c6911fe7e34e36c55ccd09e6cfc67d57109); /* function */ 

c_0x934e0368(0x3ca3c91e9186ce4034f714b2c6a452da2019b36049c01cd04f37da052bcabea1); /* line */ 
        c_0x934e0368(0x1f33c502cc3503e156bb400e25663d931553e008acc047d8d304822fe2712200); /* statement */ 
totalFunds.rescueFund += (_amount * _rescueFund) / 10000;

c_0x934e0368(0xfcb47ef51e903d326cad0bd831faed5894f50f16d20948f399cdef232fbd40b2); /* line */ 
        c_0x934e0368(0xcf87ec521ad235ca2c706faece077816fea99703cd70e7581f0ac4d44dede84f); /* statement */ 
totalFunds.localDevelop += (_amount * _localDevelop) / 10000;

c_0x934e0368(0x47a316a223a014e5542e64889003bff795c697761226670c327d8c2f748fe741); /* line */ 
        c_0x934e0368(0xeffb86cb51a6b5fe0d434aada40b3baf2407c82e98d6bbe35cfb11a5259c7320); /* statement */ 
totalFunds.reserveFund1 += (_amount * _reserveFund1) / 10000;

c_0x934e0368(0x8532447fdb57c9ed1524b83561bbe3c4bdd93ddee25ed9fe1274714da3f70269); /* line */ 
        c_0x934e0368(0x5cddce1905ae889bc1e6abe7ab6141754dc42ba69e7c62c20bf3104d19f97ba9); /* statement */ 
totalFunds.reserveFund2 += (_amount * _reserveFund2) / 10000;

c_0x934e0368(0xafaaf103f0eb35910dc3c714c4f126935a0c06810799728cd5f9f76666f39a6f); /* line */ 
        c_0x934e0368(0x2d05fae5c14cd9a3d408f718d87d84846062613fb2fb087ae7863e19c3043f20); /* statement */ 
totalFunds.treejerDevelop += (_amount * _treejerDevelop) / 10000;

c_0x934e0368(0x9f884bfdb5317339ff861915d264feafedad4ada31b5f80537f572668701e159); /* line */ 
        c_0x934e0368(0xffddf728789ecccfb0d359215eb2890176b66afd2a5e6ced11012be5ab1aeb73); /* statement */ 
totalFunds.treeResearch += (_amount * _treeResearch) / 10000;

c_0x934e0368(0x9f2050528fe5d9b94cdeffc089e0890a6e5708574979bd266cb54e634e5194a2); /* line */ 
        c_0x934e0368(0xeaa2ee97da558fe3c48e22978258ef5b8e49e84d13ec659a392ff6678fa6385c); /* statement */ 
uint256 planterFund = (_amount * _planterFund) / 10000;
c_0x934e0368(0xbd1ceba56d121e413e55b56b6164b47a213d05330a1f9d37eff007e8d8ec1e55); /* line */ 
        c_0x934e0368(0x82d7bd9733052e43ec04dbc8bb434602a10b6464ffda670c1f013e444847dad9); /* statement */ 
uint256 referralFund = (_amount * _referralFund) / 10000;

c_0x934e0368(0xd3c4f7dc50c1e9e12a532d9c0bd7fa3303662593f83bed00f6131d3ae7042cff); /* line */ 
        c_0x934e0368(0x4a50077e294f8dc4a71fb6e85cff00c829a12f51c6fdeaa60974937b400819c7); /* statement */ 
bool success = daiToken.transfer(
            address(planterFundContract),
            planterFund + referralFund
        );

c_0x934e0368(0xb800be0907bad3c5d2d7378b7f1cf2c8efa2cc5b63f75f964f168bb460c8c1c3); /* line */ 
        c_0x934e0368(0xefd1a343678069b7f0cce3de33926b1522d5f74097fb3c45338a6fe6822b3705); /* requirePre */ 
c_0x934e0368(0x4488db6ba938fe6d96f0459567dbfbb06e8d9467574f73594ba046efaec1bcaf); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0x67e02f65277cbee6df861ad5fa894b95ff0d672dfa800a4a4c9ada7385f7a86d); /* requirePost */ 


c_0x934e0368(0x918e63df830bb54b492ababfde10bb37a2cb8c707fe063e565b371bdfed75873); /* line */ 
        c_0x934e0368(0xf3de76551ac25f907d7ebaa04f8218d65267757917a603a17429082bedfdf35b); /* statement */ 
planterFundContract.setPlanterFunds(_treeId, planterFund, referralFund);

c_0x934e0368(0x9d96c52637aff349ce9107752df644e6f5d5c99ef3f23e0b739dc5a8ab720bd4); /* line */ 
        c_0x934e0368(0x9c29dcfacd8702961d2b3f133ed10865ffa40b5eb547fa1becc7fbfd0dc21cdc); /* statement */ 
emit TreeFunded(_treeId, _amount, planterFund + referralFund);
    }

    /**
     * @dev admin withdraw {_amount} from treeResearch totalFund in case of
     * valid {_amount}  and daiToken transfer to {treeResearchAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreeResearch(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treeResearchAddress)
    {c_0x934e0368(0x9f05dff9c986729351ba863ade4a20eb1364d33732bd2404e933944c87df256e); /* function */ 

c_0x934e0368(0x414371f05d3f728aff488959dba88cd170505066f540741eed905c2dcbc82561); /* line */ 
        c_0x934e0368(0x7ec6e2dd0744ed545d1e8c3337896419126bdb43106f12d6c6a6ed7db21c1e2e); /* requirePre */ 
c_0x934e0368(0x107c624f38a719ae552c8b9c196c687bd1edc4aaf20cebbbc740647ecc473e32); /* statement */ 
require(
            _amount <= totalFunds.treeResearch && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0xeb4bbd13195722077478365b8361b627580900bed8d856b9d1a9d94b6710dfee); /* requirePost */ 


c_0x934e0368(0x5b3e1525fd1568c27e7d15fabe057893f4c9016e05637849221abb8c7e0b93c5); /* line */ 
        c_0x934e0368(0xfe2868a8055dfa69fe94ac43c80c4a1dacad24b652321968f96ac4893e39806e); /* statement */ 
totalFunds.treeResearch -= _amount;

c_0x934e0368(0xc6ce591a29d723a75ffcb486b8f12eb83ccb2b360593cd1128c9d84f4c754797); /* line */ 
        c_0x934e0368(0x6a7538e63b88020194cdb319c5048f1f509264cec569f9fd92308ba182e5b797); /* statement */ 
bool success = daiToken.transfer(treeResearchAddress, _amount);

c_0x934e0368(0x14701be919c252dabdf9092d9386f9a553fdd613ed2493c766f010fa17854615); /* line */ 
        c_0x934e0368(0x900d91a7946c2dfbf6e6ad8fe7fc75d5e45566077b52c5e55afa575dfa7b4999); /* requirePre */ 
c_0x934e0368(0x2fd595ce190930dbf8e73d116f3bede5bd17eb8e23135cef24a5b3950fc046de); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0x1cf1d690e27d8f4d8d210c691623f4394c733656a2179ea8a1f269a884e26b62); /* requirePost */ 


c_0x934e0368(0x867ad47a166630dfc790cde0a10a373f4ec26a169ec344f812f0041862598326); /* line */ 
        c_0x934e0368(0x60fa0a7ff5df630b753f8fb1a21ae03db6bafc2fd61c11f92d9a62f7f91b1e4a); /* statement */ 
emit TreeResearchBalanceWithdrawn(
            _amount,
            treeResearchAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from localDevelop totalFund in case of
     * valid {_amount} and daiToken transfer to {localDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawLocalDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(localDevelopAddress)
    {c_0x934e0368(0x42ba810ff5992dd869a17253d7bb7d6967962a026c2ff553437f2c5fe800911c); /* function */ 

c_0x934e0368(0xc989a9d50977ceab06564ce12b240bb3c3f67b225706c24c2b825525a4583ac5); /* line */ 
        c_0x934e0368(0xc5e85340acd69061f310b092d68c366ded6d94a3c916bd1b4b2eec51483dda8d); /* requirePre */ 
c_0x934e0368(0xe193b7a6d25840529fbd5cc0ac511153a0deddbb8ffe0f39a9b176ab01590cbe); /* statement */ 
require(
            _amount <= totalFunds.localDevelop && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0x0ab2913511a8dbf3b7bca93d5a6ea38383aa43f6229f611cc88f99614a030571); /* requirePost */ 


c_0x934e0368(0xc8e2542018115fc93640965cfd61f65b56ead235f4f3720ede820b734ae238d1); /* line */ 
        c_0x934e0368(0x0461f77c73283637ea94e5d248d03997d14bd34fc510008b3ba35c8ea95b67af); /* statement */ 
totalFunds.localDevelop -= _amount;

c_0x934e0368(0xa225701f6fe9cd4fcfa3cc98c09e2d3d173cc450b72243a238a31ab7be47eb75); /* line */ 
        c_0x934e0368(0x73e3743a60c26b9af731d0a383350940f9c99ffa0a43418ae542ae5aab691975); /* statement */ 
bool success = daiToken.transfer(localDevelopAddress, _amount);

c_0x934e0368(0xfa80989cf2648b2de6e7ea5d32596223f811a3abce8012f4ff4e682137b83aff); /* line */ 
        c_0x934e0368(0xc9a1c80665efe9823b4e9761f6aaec97107c94c76f318e1ad5f3eacbc523dbc9); /* requirePre */ 
c_0x934e0368(0x60d11805fe22a454b14f45d7740d7351291f77a867466d7facafdf1e00cd66c3); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0x230c0ee33465de6d481fcf07c8b895e65ba02ac96555524c9da9fd78c3a7a070); /* requirePost */ 


c_0x934e0368(0xb0c79f29f84befa4881c308c75e18b3f4c86e8166a0f57760f137ad9906be556); /* line */ 
        c_0x934e0368(0xc77084f5df579472c51879be13564ce89a5ceb46e1caf8a33d4fed0ab1f1d1b3); /* statement */ 
emit LocalDevelopBalanceWithdrawn(
            _amount,
            localDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from rescueFund totalFund in case of
     * valid {_amount} and daiToken transfer to {rescueFundAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawRescueFund(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(rescueFundAddress)
    {c_0x934e0368(0x9870edffc2d6af6b9180eb9fce9d3fffce835d9952554f43c0aa24ec8d1b1e1f); /* function */ 

c_0x934e0368(0x78635f8db00743f1708f144e4e87fba8d3052380ad2492b186de970d802edf5a); /* line */ 
        c_0x934e0368(0x2fd613aae2144a350385241aace5ae3dac06da5ae46afabfcfd8f11b4d5d8777); /* requirePre */ 
c_0x934e0368(0xef15aef8e18154e6784584ea3d3d470527fadcd94a8d257dc3e652766e66ce13); /* statement */ 
require(
            _amount <= totalFunds.rescueFund && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0xeb1ccf3afd8d10d93b3be055de5c42228c1775df8feda6b777d0b95ca496ae76); /* requirePost */ 


c_0x934e0368(0xe10812c5bc064a8de3593285996f774a10e398dabc3b5c88df2e5c6ab6edbb7b); /* line */ 
        c_0x934e0368(0x0a014fe76289476b8526dfff4273d93afb051327b5cdd55669dba3d2cfd11d43); /* statement */ 
totalFunds.rescueFund -= _amount;

c_0x934e0368(0x7279f04da3727458ed1b149dd792073a02c97e4706c01bf3c45ca1aa59fcd2d2); /* line */ 
        c_0x934e0368(0xca601e9469d244ea71d09ba37ba60ecb50655ff0f96058399bc57e76199255da); /* statement */ 
bool success = daiToken.transfer(rescueFundAddress, _amount);

c_0x934e0368(0x8fd65cd37e833ec854d54dc08cc4f42801cd3113fe3b3218ff7dd4860891bd79); /* line */ 
        c_0x934e0368(0x7f4f4b15411d4f12d3666960bb555a76371fe35fb2d8d4796376b3e792f6f7f0); /* requirePre */ 
c_0x934e0368(0xde47418640c83ba480c1946cd9ee294edb1d2dc088e0c9dcfbfb8d980d09b551); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0xc57419e8c01065ee066377233c33544a419a2cc85e00395e1736cc2103a7eb80); /* requirePost */ 


c_0x934e0368(0x007da7533d6869d148863879dd2fa3d0966d7c2f6b5e0f5fe1aa81ed0c8e60e7); /* line */ 
        c_0x934e0368(0x7609f829ebe33276a1d3c13d9f6d890512fea3ef6f606336016f1d194e996d78); /* statement */ 
emit RescueBalanceWithdrawn(_amount, rescueFundAddress, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from treejerDevelop totalFund in case of
     * valid {_amount} and daiToken transfer to {treejerDevelopAddress}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawTreejerDevelop(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(treejerDevelopAddress)
    {c_0x934e0368(0x33d18b9d58fef9090b708ccb05825a8a5ad29a8dff06e03e4cef09d07dd89d70); /* function */ 

c_0x934e0368(0x27ea03ab35e439f79cc008e80c2db4ad1754d6d64b65646e71ef6cb400e5e37a); /* line */ 
        c_0x934e0368(0xefaac22c11e5359fc76c7bad416243ded8aa6435a759b2e1d8df0f38aecaeb94); /* requirePre */ 
c_0x934e0368(0xeeaba98e6f46e92ab69b47e2c9ca88cc53ecf35234d3de83386c7bf5871d73f2); /* statement */ 
require(
            _amount <= totalFunds.treejerDevelop && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0xde0d434d5a559a0f89d0250ccc95bc21a2bef637f626078ea6e1083d196398eb); /* requirePost */ 


c_0x934e0368(0x01858a6d606e304d8ab0d3a2ef603c749fa988a09653d05e015b25df6d89f410); /* line */ 
        c_0x934e0368(0x3ede5d870aab882b5b59c3854007336e62899c97f91c8432e0134722b225e3a8); /* statement */ 
totalFunds.treejerDevelop -= _amount;

c_0x934e0368(0x7572b89ba4db164d4d5fed73aaaed0b74e6c4b139eb22bb40e18731bf10b7ec3); /* line */ 
        c_0x934e0368(0x8b60f69c8d8b2a46f6e6024fe787260b72072593babb04e49204a4121692ba71); /* statement */ 
bool success = daiToken.transfer(treejerDevelopAddress, _amount);

c_0x934e0368(0x76095280a25aa803d6e4c5dea71c49f0afb372b50d79bb5745ba9dd111ddea76); /* line */ 
        c_0x934e0368(0x3b36b189134f7c982d5b79521ee907939acbab5534dafe69143d0fe15ccc7820); /* requirePre */ 
c_0x934e0368(0xd53951464b9d29e3e77150f2e944119083e1c0a7e38f83d306d3ecaf77a5f3d4); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0xbe9e7a1faf46aaf8fd2d7fcf81af03ce04bb94942effc5da7020c0ee675c4a3e); /* requirePost */ 


c_0x934e0368(0x9f6867972599125cb2424929c7c49312fd7120a379ced38b88072fb33227a8db); /* line */ 
        c_0x934e0368(0xce80e3ac128b19658b3225cc20cb826cf7633f5554b49a06bd26ac8f757a0f96); /* statement */ 
emit TreejerDevelopBalanceWithdrawn(
            _amount,
            treejerDevelopAddress,
            _reason
        );
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund1 totalFund in case of
     * valid {_amount} and daiToken transfer to {reserveFundAddress1}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund1(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress1)
    {c_0x934e0368(0x055c44030e8a30b0904bc30afe61bc6c57129a4fdb8c3be338dec4fb5a0f0220); /* function */ 

c_0x934e0368(0x385206bd52cd707e9a0fbd42616514a857902645d73365fb87d130dadd2ec33d); /* line */ 
        c_0x934e0368(0xb9e5ae3f852d184868c9fc941d0de4e5a16d9c1842a3abbb3c1eacc12145d6c0); /* requirePre */ 
c_0x934e0368(0x21cbe5e9b69891f7683825499bafdd40c27222e698b9cbd697ab5f7fbcc022f3); /* statement */ 
require(
            _amount <= totalFunds.reserveFund1 && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0xeafcf628b8aa5689424a89d99b343dfa4ac7947d816a11c7d22d6718e300615c); /* requirePost */ 


c_0x934e0368(0xbc989c9b5e3c381c7d074ad162039fcf6456f567aa5b07e9edc606e451f7dcce); /* line */ 
        c_0x934e0368(0x57863ddc262bc11b1876533bba55fdfbbef900a3be5e440c732da5870e5f3639); /* statement */ 
totalFunds.reserveFund1 -= _amount;

c_0x934e0368(0x2cfcc1a93fd85c31d7677148913e8edbd98f8544ee7f0706c2264613a76b9e1f); /* line */ 
        c_0x934e0368(0xbef62b0ff10d5c022203cd8a93d918ff3d544e1dd2a4657e3b20aa269e45cd08); /* statement */ 
bool success = daiToken.transfer(reserveFundAddress1, _amount);

c_0x934e0368(0x39e74ddf0d2c45a22a653fa270c02bcccfc2006df1dde90af292a25abcbae319); /* line */ 
        c_0x934e0368(0xec759c2925977e52a434748925fb03f3f82ad23255daef335d12382f089be216); /* requirePre */ 
c_0x934e0368(0xcbd71d6dee40e3ab39e2312e462f61a4cfe742217baae1ef257929c5820bf74a); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0x444137795c9404f0141e8ae22a9ed6d2462ba624eeebcf7329e71053884800e7); /* requirePost */ 


c_0x934e0368(0xfc4d408097acbfa972edc1e7590f8f9445839db346634084e7565baddfbede40); /* line */ 
        c_0x934e0368(0xddfb495d512c788a6a0f4e384d82817c55e9c26116a92be463a0435c5227ce1a); /* statement */ 
emit ReserveBalanceWithdrawn1(_amount, reserveFundAddress1, _reason);
    }

    /**
     * @dev admin withdraw {_amount} from reserveFund2 totalFund in case of
     * valid {_amount} and daiToken transfer to {reserveFundAddress2}
     * @param _amount amount to withdraw
     * @param _reason reason to withdraw
     */
    function withdrawReserveFund2(uint256 _amount, string calldata _reason)
        external
        ifNotPaused
        onlyAdmin
        validAddress(reserveFundAddress2)
    {c_0x934e0368(0x65db9ada780298f8de481f94c49bfd220ad1db755a172ca150183073186c5ade); /* function */ 

c_0x934e0368(0x19b1da17696b08a83b8c8b2873a8b8805bdcbc4cd99c3319771717e8474d876d); /* line */ 
        c_0x934e0368(0x4684d6fc6d49f7de55181942366053531d7dc6ac9e1b71bdef351dadf2b7d49a); /* requirePre */ 
c_0x934e0368(0xa55e3753b0a9c7f2db97bbc4167f643d7e56a815481cf06315d5c21e9270fc1c); /* statement */ 
require(
            _amount <= totalFunds.reserveFund2 && _amount > 0,
            "insufficient amount"
        );c_0x934e0368(0xd9468cb16f2982689131ff4048385f47d01f2900c7ef79348cf9bfc632b03c02); /* requirePost */ 


c_0x934e0368(0xfcc917a8a459b26d6e9104b53ddbfe8513b4e3c4932a019ed72c5afe909dfcd9); /* line */ 
        c_0x934e0368(0x7eaf62437f8eceb201b54b1dd783de4210e6d6886d42cdab6d8f6c3e25d4d6fc); /* statement */ 
totalFunds.reserveFund2 -= _amount;

c_0x934e0368(0x0c08b1e25782d769ecd4c085edb6c842bb5164e6e47257b50b733368945da36f); /* line */ 
        c_0x934e0368(0x680d194fbd886d75e4cb8a936d05f7d5cce9d6ffbfa43dbaaf071c2d20038943); /* statement */ 
bool success = daiToken.transfer(reserveFundAddress2, _amount);

c_0x934e0368(0xe00186071db1145aa18c619416e636a81ea72f5804c946d38da8e109e03e6c16); /* line */ 
        c_0x934e0368(0x291c72860f31662ecd660c1e0f7e5dd1862a2cb54a71436f5a3c0073a94e67f1); /* requirePre */ 
c_0x934e0368(0x03ee1b6a7a8230451a9561578e744cacb4c8d7ae2951578e83c8db58f65506b5); /* statement */ 
require(success, "unsuccessful transfer");c_0x934e0368(0x0a8f1d90e5f3872f341775bd33be057b0b8f888d47cbf28c783fee6d7330bc58); /* requirePost */ 


c_0x934e0368(0xdc4ed1ade9dc16638efe2b2f808478c20b8272bb38703b294d1a4673dfdebe5b); /* line */ 
        c_0x934e0368(0x03312c2013aa9000d59402df15e4a5d4ae32a8bd06b0df3871beb74bbd956060); /* statement */ 
emit ReserveBalanceWithdrawn2(_amount, reserveFundAddress2, _reason);
    }
}
