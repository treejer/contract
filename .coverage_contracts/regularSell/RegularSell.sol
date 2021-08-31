//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
function c_0xb885dd76(bytes32 c__0xb885dd76) pure {}


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IDaiFunds.sol";
import "../treasury/IFinancialModel.sol";
import "../gsn/RelayRecipient.sol";

/** @title RegularSell contract */
contract RegularSell is Initializable, RelayRecipient {
function c_0x0000771f(bytes32 c__0x0000771f) public pure {}

    uint256 public lastSoldRegularTree;
    uint256 public treePrice;

    /** NOTE {isRegularSell} set inside the initialize to {true} */
    bool public isRegularSell;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IDaiFunds public daiFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public daiToken;

    event TreePriceUpdated(uint256 price);
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);
    event RegularMint(address buyer, uint256 treeId);
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );
    event LastSoldRegularTreeUpdated(uint256 lastSoldRegularTree);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x0000771f(0xfd76f0a927cdd1294c0a88a56cc2fc1b9620b512ce7fd209b5860b119c07b066); /* function */ 

c_0x0000771f(0x30e3b82222fe8a8969e323eaf4b7beceb7e6fd62c56081c4a9e3ea317284d3c6); /* line */ 
        c_0x0000771f(0x974d223b1da07574656d3bb150fc979a5fe4d7481456fc2c99414bfc2c6b49b0); /* statement */ 
accessRestriction.ifAdmin(_msgSender());
c_0x0000771f(0xf9dfc17f50f06f8eb7d61b50b053aa6e6f1aac44beaa7eb875f19b8a8282b940); /* line */ 
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0x0000771f(0xcf19b9c20c4c586b5b2db32a7e8c6b58091137769ed7d8f9f4f9f714c8a40399); /* function */ 

c_0x0000771f(0x1df0f8f63d806c8a719275ff475bf5480cce67aeb0e7065b682d9378502464b2); /* line */ 
        c_0x0000771f(0x267611e0c4c5f75dad63edf665af1cd31b219a949dc9b45ddf278fd4c0dc633d); /* statement */ 
accessRestriction.ifDataManager(_msgSender());
c_0x0000771f(0xee621bea4686ae1c3e31fc0a8c2c4ed8a5078b1c0f7dc4804216128628db98b2); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0x0000771f(0x345253f4696a0e728de2ceed06c656ada5154232039b49c6f4631d674e5e4462); /* function */ 

c_0x0000771f(0x469918f17cc73d2bcf2568d3e4310fd23bba53682cf79f5a79fe92305b0a1344); /* line */ 
        c_0x0000771f(0x970d59b7a37f7c0f62f456bcaf7c83fe418b9538ad2b3658955b8c3ff3f48d11); /* requirePre */ 
c_0x0000771f(0xdeca302b5dc52d7c505d6e31b1326a483ce246457276323929d091df98a6120a); /* statement */ 
require(_address != address(0), "invalid address");c_0x0000771f(0x29ce1f1a82927d3fc7c2ed08682732dfb06ffd1b49c89a44eac3510d4626fac2); /* requirePost */ 

c_0x0000771f(0xb0c922df2086c2b3c095e406aaceaf2285cae06dbb3d19045410e0dde69c98b1); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isRegularSell
     * set {_price} to tree price and set 10000 to lastSoldRegularTree
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _price initial tree price
     */
    function initialize(address _accessRestrictionAddress, uint256 _price)
        external
        initializer
    {c_0x0000771f(0xabb06029b764b8aa5ffb36de8f61ad9b0e52850f6d25ceeca4d1c17d82b1b9ee); /* function */ 

c_0x0000771f(0xdaffaea39ca7c6662c168afed033ff1f9ffaeecd30cdf7b37b5fface721cf2a1); /* line */ 
        c_0x0000771f(0x8fd49b3cf818fe39c30cda2a2b0813192277f52710631d47a7f85c52f6a4d03b); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0x0000771f(0x8c03992ea3f0600bcec8271354f5dd6d0609c564c9142178cdd2d31caebb2745); /* line */ 
        c_0x0000771f(0xeaaa54ee61f25567ce98e1ef35b77a5fb80fee05b097f231f4b397b93bfd03cb); /* requirePre */ 
c_0x0000771f(0x0278b53989fbda89ccb434d0529221e5941840c8efea017c42dd0c24884f6133); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x0000771f(0xf189a13e2ecfbf3bb43c69bf04b3ebe315063d874d4d5d388f358c71d46a5362); /* requirePost */ 

c_0x0000771f(0x452458da02eb081d3592dc5c5455ab2e8524ce9ef148419ced0c6b7c3c96abfe); /* line */ 
        c_0x0000771f(0xeb88fdd3e5e59f806ad7ac3010e883f3bebc01f7103de0ff70d3997db138b130); /* statement */ 
accessRestriction = candidateContract;

c_0x0000771f(0xb579bd9f7c474288e51a6ec322e4ab44cb7ab27518372135184c363ad3d208a7); /* line */ 
        c_0x0000771f(0xa860df84a1b75ecc4fe96915fc8a0cef96c4963bd984fde5d7464059ac282b6c); /* statement */ 
isRegularSell = true;
c_0x0000771f(0xb9e697ccf5a04ae383295a4d67bb634e8a30796daee8822e5ce5012077108903); /* line */ 
        c_0x0000771f(0x166f71927a7505ec9e855ae3f6f8b7a90faf1c0c70dee3314efee11bc5332777); /* statement */ 
lastSoldRegularTree = 10000;
c_0x0000771f(0x6783f22bbccc782f39c5879544c610091fd6c0ad0105beedaed9aabbbcaee9cb); /* line */ 
        c_0x0000771f(0xbdf57fecfdd55d49bb8d7b62633bc1e17747d5ebf950b9b552e41631a4d31b9f); /* statement */ 
treePrice = _price;
c_0x0000771f(0x60285b31390aad0d6a2e488dcc44bf1ba053fbd35b26ae23147feaf1ad7b573e); /* line */ 
        c_0x0000771f(0x79cd393c5086625c7d2aeb45187226a427de9c421017f2a7eeaec60cc52b73d0); /* statement */ 
emit TreePriceUpdated(_price);
    }

    /**
     * @dev admin set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x0000771f(0xd7e3581f44f0e6bc6077902e127b9e6c14cccea71c7c41cc0238cdc9efe8a730); /* function */ 

c_0x0000771f(0xc889feea19427f52d639973dbf857d516a816c9afe2e739d20226cd814612c01); /* line */ 
        c_0x0000771f(0xc33b4d268d0bad5c94b4a2670ee21dc28177f87def86107562b34bec1b30b548); /* statement */ 
trustedForwarder = _address;
    }

    /** @dev data manager can update lastSoldRegularTree */
    function setLastSoldRegularTree(uint256 _lastSoldRegularTree)
        external
        onlyDataManager
    {c_0x0000771f(0x4b01acc24e04337ea8d3096c73d4b70a872f4583012bc6a0a266c9b0f53ace69); /* function */ 

c_0x0000771f(0xd70d758284a80500c8543d17957a2ec7556c1b153cc151804ef60bb05da9af29); /* line */ 
        c_0x0000771f(0x1b373f139847a2b799c8b5b077ed4fc84c1b2e480f38cf28f2a8deae382633be); /* requirePre */ 
c_0x0000771f(0x435624fcbf233bdaa056abf51a6f6e297807603e26c6dcea89de032cbb894055); /* statement */ 
require(
            _lastSoldRegularTree > lastSoldRegularTree,
            "Input must be gt last tree sold"
        );c_0x0000771f(0x878de278a010c254f1837983503e0c85ae4ae5af2be1daf1abfaa7f0c8746abb); /* requirePost */ 


c_0x0000771f(0x474bf80967a3a145a2884e06232734aa9442ee3a6b9790119c459eacc281a52b); /* line */ 
        c_0x0000771f(0x8ca5d66789339442a95bff4c86803641e16140a1613dcc12b6165c526a5569c1); /* statement */ 
lastSoldRegularTree = _lastSoldRegularTree;

c_0x0000771f(0x11a1e723443a30b98bb288394a360dcf3774dd6646dcc7c354665fb3a718b3b1); /* line */ 
        c_0x0000771f(0xac754f21acc37a5432232466d0d3ad9dde21cc4a53a28c3a723042bfd28e4c42); /* statement */ 
emit LastSoldRegularTreeUpdated(_lastSoldRegularTree);
    }

    /** @dev admin set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {c_0x0000771f(0x0d4dd55020a1aa78cc6fe387ae4f7f4066775fb819047964777dc50ba6bc752d); /* function */ 

c_0x0000771f(0x1bfe7464b0a275985d7fa1d5f7028a1b821f1c2b34787210d4a2ec9409ff88f7); /* line */ 
        c_0x0000771f(0xf80d233db284256bdabcd39710586b6ec0149ceda9512716a84a922d18aea859); /* statement */ 
ITreeFactory candidateContract = ITreeFactory(_address);

c_0x0000771f(0x9087fba48aac3d7a7591b3e76acca686c7f23bcfa6c89e3b631d2f83e366dee6); /* line */ 
        c_0x0000771f(0xc9099f8ee9a2748e1cdcb64913ddbdf9af9760e2fac1718e0932d11233b98e55); /* requirePre */ 
c_0x0000771f(0x17e9e50716c130d70f35a5447ea7d24a4aafd666831d81f7065e1ea1c775feb5); /* statement */ 
require(candidateContract.isTreeFactory());c_0x0000771f(0xad86cde99961b0f6f75bbc40e31a2fab563c6bf34427376d6e95bd6fa63515b5); /* requirePost */ 


c_0x0000771f(0x04b3fd0e65045e7d2251941a1898474aac85a607c1fc5b1b6a3a78d510ccd03d); /* line */ 
        c_0x0000771f(0xab23764b012946e7d675d858af483de789715b3a97f0e58f4bcb18641d995cf6); /* statement */ 
treeFactory = candidateContract;
    }

    /** @dev admin set daiFunds contract address
     * @param _address daiFunds contract address
     */
    function setDaiFundsAddress(address _address) external onlyAdmin {c_0x0000771f(0xefbd8c7eec318f8fba897f88119a244fe60dd1134180d9d8abb74c5efcee97e6); /* function */ 

c_0x0000771f(0xee2d78218dcc0a43aa3d0d7aa6055d1805949877b3e71e7f70c3ecdc94c32c25); /* line */ 
        c_0x0000771f(0x4627d4bdfb3faff46983f1ab67c5d17233343d6f45042defcad5cca2987c5d40); /* statement */ 
IDaiFunds candidateContract = IDaiFunds(_address);

c_0x0000771f(0x44968c69568d6fa7abcca97a942d4aac573da93d281a9b05eab74d68ad28aee5); /* line */ 
        c_0x0000771f(0xdcfe7ce4f5a0780907dee89164e1146673338eede2cdc6f22d63fbe6b56f7b9a); /* requirePre */ 
c_0x0000771f(0x088ea2b1fc11f466de1b159f8970145df4d81a5fc3f5061f94053b9a8b5f0a10); /* statement */ 
require(candidateContract.isDaiFunds());c_0x0000771f(0xa8457bcdb456f1f1b107383241ea5786143f78ece23c5beb5247ef6e90e160a9); /* requirePost */ 


c_0x0000771f(0x80b9446f1a7b27a7719a802160309adbbe26b23ad17c3189865300da4806b53e); /* line */ 
        c_0x0000771f(0x80d1878a942778e3fb7c895f0bfc0a13be1a030e742206dd54ef46cc74bca7e4); /* statement */ 
daiFunds = candidateContract;
    }

    /** @dev admin set daiToken contract address
     * @param _address daiToken contract address
     */
    function setDaiTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {c_0x0000771f(0x70f2cb71a5a9f1b03d0ec69083e8242daf9d412c9a7c8689e143b4783e5a7f94); /* function */ 

c_0x0000771f(0x7ea018e7876b98fc17364f1a010b020c74ff8543467cd08f39cc07a60d5c0957); /* line */ 
        c_0x0000771f(0xb0ba4cded8816022f9fec942cf5e51949ba1df41ff95aa96010f1da33e8bea79); /* statement */ 
IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
c_0x0000771f(0x58df3c89bb731d7e9c5941d475666fa5131f80daeed2e44c0803c18e1b835cdd); /* line */ 
        c_0x0000771f(0xc4136ff80f3b9d36b91ce5b8fd0e411f0c8d66cfcf928a399f18d3203b94a1ba); /* statement */ 
daiToken = candidateContract;
    }

    /**
     * @dev admin set FinancialModel contract address
     * @param _address set to the address of financialModel
     */
    function setFinancialModelAddress(address _address) external onlyAdmin {c_0x0000771f(0x1ebfc271ec429ddddbb2a61bbacbc3f591bf28364c0f413970c46d7df0282aab); /* function */ 

c_0x0000771f(0x3fcca32b18ab184958e1fd22f970a7d682dd4212d8036ade8244b108bfba7c23); /* line */ 
        c_0x0000771f(0x2caa63d4e94843de6212811fc1dc0ac0c8bbfc7f3f52d82b1c1453c2464c62e9); /* statement */ 
IFinancialModel candidateContract = IFinancialModel(_address);
c_0x0000771f(0x5b2ae765d43fe2b2f417000aa851eaf97766cb7d1fdbf65b2ae5e13fff2592f7); /* line */ 
        c_0x0000771f(0x785cdbb2ca65202d0f41c82cb0388be10b6f50a8fcb7a91af5047959166d99f2); /* requirePre */ 
c_0x0000771f(0x267b29961b69cf12f03adf21edf006337c17c6b406ae0cd2606dc54ba0a5a08e); /* statement */ 
require(candidateContract.isFinancialModel());c_0x0000771f(0x3ffccea9a4694b879f7b2f5344cf1c3b271c5046b5a34c457dddee4b26b1b009); /* requirePost */ 

c_0x0000771f(0x811e2703a5627c9a8687fc76f84c0abfd7b5ba000bef1c9f38dcceeea6e2a6f5); /* line */ 
        c_0x0000771f(0xca2abe5946e68728504b206fca0f4969e149dc477c06892e9535e377168b4d1f); /* statement */ 
financialModel = candidateContract;
    }

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     */
    function setPrice(uint256 _price) external onlyDataManager {c_0x0000771f(0xa208b0465f4a50d170a10c086ea61e791ca728d08d6563634668652f1682f790); /* function */ 

c_0x0000771f(0x4f0e9741d5186b5949e91e603bb2b310f383575d31482f1088cc42be5efb11cd); /* line */ 
        c_0x0000771f(0x27d67086d80ffe283a237a2296722b469df5d45829ab18dd9635b1a1360aa9f5); /* statement */ 
treePrice = _price;
c_0x0000771f(0xa3928f88a75e85d7148aae9c81292f2ddd738128733e89757e00fd7f31c09abc); /* line */ 
        c_0x0000771f(0xd6dc86a1e140a969f8bbaab8410427dd010808e8e21455afc2cdebdb467d5960); /* statement */ 
emit TreePriceUpdated(_price);
    }

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     */
    function requestTrees(uint256 _count) external {c_0x0000771f(0x90913c105c4b971e6ed5260b6de9572f3a24bdc82fd9fb40c3bd3bfa034345d7); /* function */ 

c_0x0000771f(0x4ffc033d6f876057ec3e829a6aebdd5b89708a2048c8afced782545537d35882); /* line */ 
        c_0x0000771f(0x42a0091489e1200a54578019fb8b3bf285a181486b64b39dc48a3811fae3f351); /* requirePre */ 
c_0x0000771f(0xec46c77b720e00b6fa7463ef83cbe737db4835ec2f2e49c8748d7539527fa923); /* statement */ 
require(_count > 0, "invalid count");c_0x0000771f(0xd7c7ca6d43f2540ee477bbe862ac20b08ebcccf3c0b6f1a38546eb9d3c36c9c1); /* requirePost */ 


c_0x0000771f(0x05e3036477c18ad2c9660cc69d2c348b32403dcd1f71d8887c93abccc462bee7); /* line */ 
        c_0x0000771f(0x4488b2a262da1405250b0857122cd4178738af858542a85a02e3b640a7bdeefb); /* statement */ 
uint256 amount = treePrice * _count;

c_0x0000771f(0x1f55ee0b599a7f272a8fdfc99f26ac3db514ab11dfe8a5177a39462fb6af7113); /* line */ 
        c_0x0000771f(0x9b25ba5f720c4730ef9c606c0ef9e9d69486c4bb64d8ba6732d1ed75b6e48dca); /* requirePre */ 
c_0x0000771f(0x7ab0a14e4d76f6b1c1a333d534fbeb6faa7511d9ea0ea2e1ea6ba0eba6f78f26); /* statement */ 
require(daiToken.balanceOf(_msgSender()) >= amount, "invalid amount");c_0x0000771f(0x07396f5c442831df93fc8df21b67544a573433160582281ced1381ca3081bf3a); /* requirePost */ 


c_0x0000771f(0xeffca71d41c82a7b90ef863aafccd9ef6bce687437da7304fd15d8f72d06a313); /* line */ 
        c_0x0000771f(0xeec87c32cbb27c396d06d5bac15af948f01468f567f6e7177ae18091b21967f2); /* statement */ 
uint256 tempLastRegularSold = lastSoldRegularTree;

c_0x0000771f(0xaa44561d9898ad6d0c1ccb27c08a62163833c53a05f22ac785155eeb320a55c2); /* line */ 
        c_0x0000771f(0x18a6d2fe4d2b985e847aa352a9e84ab7497c4258bf28244404c4e8e46eedb0aa); /* statement */ 
bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            amount
        );

c_0x0000771f(0x5f034d47f4beb3d41a96aab557a5fddba63ed76367de30e488aaf654fafe883a); /* line */ 
        c_0x0000771f(0x0c54ebc0bf97068ccd9839782ffa3116d0b389b63f016117e7a57f976bad9089); /* requirePre */ 
c_0x0000771f(0x5afe8473eb3a99eed62ad544fe3ef86e2b4eec81262540d96924850d0ec7e248); /* statement */ 
require(success, "unsuccessful transfer");c_0x0000771f(0x19dc33a225e2efd7da3705a1f59b1d30695548cec7ca95bb17d43f073db7c415); /* requirePost */ 


c_0x0000771f(0xb5079ccf7335cfa90bd3484f1f1d5aa3fb08284190649b9e90b7bbd1d78bea7d); /* line */ 
        c_0x0000771f(0x7302026c571c80efb48123b4e97ecf925fa99f75bcc30e7767bc9e6ecb79e375); /* statement */ 
emit RegularTreeRequsted(_count, _msgSender(), amount);

c_0x0000771f(0x8bea196cc0b68a5c50acbdcbffd0835762c2b4e027b0ad83643a6dc384e5a35d); /* line */ 
        c_0x0000771f(0x305d5c08ac013c991e2a6a8196dd8ad289e35664abfe0cb287faf7caef260f2f); /* statement */ 
for (uint256 i = 0; i < _count; i++) {
c_0x0000771f(0x25601d671679da57b61839020929b7563a0af8b160eaa1a453421f1c9be36c89); /* line */ 
            c_0x0000771f(0x2c421b45e78868a87b21dba8cdc2d30e98005ab6aa45289cfd1f63dd05f16c91); /* statement */ 
tempLastRegularSold = treeFactory.mintRegularTrees(
                tempLastRegularSold,
                _msgSender()
            );

c_0x0000771f(0x4dd6b5869c4b71338b96ba2e8d8f9fd331f8be2071f78fb48e7aea040a2655dc); /* line */ 
            c_0x0000771f(0x5676cf648649ee55841c23b0780f6db9a3ea60795b39308bc66f834675df473f); /* statement */ 
(
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = financialModel.findTreeDistribution(tempLastRegularSold);

c_0x0000771f(0x09ef5f754c012efec91266caedd5da2b4933c986906dea7f1d7f249e293fec29); /* line */ 
            c_0x0000771f(0x45cf68cda5f75fef38577d93a9d43200695e41ffc81ae6f0953e2093380cddbd); /* statement */ 
daiFunds.fundTree(
                tempLastRegularSold,
                treePrice,
                planterFund,
                referralFund,
                treeResearch,
                localDevelop,
                rescueFund,
                treejerDevelop,
                reserveFund1,
                reserveFund2
            );

c_0x0000771f(0xcb6deecf4e5a24edc841c5f35b07cf2a9aa1759ed6ea1e26d12e6a0ddd2a7547); /* line */ 
            c_0x0000771f(0xa28feadb2759e51453230d892c1d917999935e02ac608984b8e84e0388f2efaa); /* statement */ 
emit RegularMint(_msgSender(), tempLastRegularSold);
        }

c_0x0000771f(0x3a656afc69c6f4356d4aebf09304444a794b798dcfb00cbf1ab7db093dc195d9); /* line */ 
        c_0x0000771f(0x487a5fdb8e358274d2a7b4b2d53b1629de71b028d4f9a06f8985a758ec41089f); /* statement */ 
lastSoldRegularTree = tempLastRegularSold;
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to
     * make sure that has not been sold before
     * @param _treeId is the id of tree requested by user
     */
    function requestByTreeId(uint256 _treeId) external {c_0x0000771f(0xfbbe929214feddc269aa2c95f755ca1d2a4f9f11e4913430f34b7e18e4df8bd6); /* function */ 

c_0x0000771f(0xc5fcb5de0cb00af1bfd614d3a4f92e28e73dae81dc494fd1343a52ba2665c605); /* line */ 
        c_0x0000771f(0x3034c19348e702acf326312ef9a884356203a1133c3b8c06ded8d267a7efe45c); /* requirePre */ 
c_0x0000771f(0x19637d4a823cae61a09a18e7aeac48d265197fd660b53243506b4f1da6212b1d); /* statement */ 
require(_treeId > lastSoldRegularTree, "invalid tree");c_0x0000771f(0xaa218e29228d82a6b59dec7caec6b193f9032bc535549a4630d927d8e4084abd); /* requirePost */ 


c_0x0000771f(0xb584107655a177002a601ef720cc17cac536a734a2c76e6d176f613c6314e3ad); /* line */ 
        c_0x0000771f(0x64234afeb6af4c245830cbdd7ba310fd6be1b7baeeede007ca05080c2d2bb5ec); /* requirePre */ 
c_0x0000771f(0xc75d5f4a98b9c401afe5cec9dd9cb3e6d0b26749d77fdf36d481352004680836); /* statement */ 
require(
            daiToken.balanceOf(_msgSender()) >= treePrice,
            "invalid amount"
        );c_0x0000771f(0x2ee89793858b41a77745f69ddb2cec286eccecacd2a7e173406a25a22fde1c29); /* requirePost */ 


c_0x0000771f(0x58a2449b96eed783b33b0c347ddab0e29a457790779de5062a597175006db424); /* line */ 
        c_0x0000771f(0x4741e933d8d38a21ce569973a48e122cfb96a1245da73dbee511843d942306ea); /* statement */ 
bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            treePrice
        );

c_0x0000771f(0xb12b3137fa0cd18b6fc296caf34df59168fa07f011bef873b3ef2975cd5643e6); /* line */ 
        c_0x0000771f(0x1dfee0fc6379365e79274e7c1271d8fa11200304046a33085656bab56c9e759f); /* requirePre */ 
c_0x0000771f(0xa83643d04ab66f30eb04965a77947a11f7f20aed88d26c84b5ac936883792270); /* statement */ 
require(success, "unsuccessful transfer");c_0x0000771f(0xfd57223af4db1bc881897e45beb7120b3b87793748be0b313e83152646df62b2); /* requirePost */ 


c_0x0000771f(0x649e187c0e7bab8a25183b247aa8071772547f71c7928c976aa8a6eb9084f28b); /* line */ 
        c_0x0000771f(0x10b9d03731d6130fa1886f1ef801c5bd61d89566df243a6024066a22c0d57c60); /* statement */ 
treeFactory.requestRegularTree(_treeId, _msgSender());

c_0x0000771f(0xa2ff1b109e9e1a4d4fb417b27b62897e99e3565a3690862840d39a7709497836); /* line */ 
        c_0x0000771f(0x931b0d9801ad485a2820b0d274fab52e2348f413bc667816103a68e150f5e8e0); /* statement */ 
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

c_0x0000771f(0x9bed22ecdd6b38d03bea3ecdaedbb2c8067812573d6fa1457813248d7509b527); /* line */ 
        c_0x0000771f(0x3927667f68f22974677590e0cc4ef38d35aca699bdd6b615694f7ec667e4f5b2); /* statement */ 
daiFunds.fundTree(
            _treeId,
            treePrice,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

c_0x0000771f(0x3b884d2ce0777e1f98e81e39a04f466bcaf17a2dc08a3007342cd3d8b2f33249); /* line */ 
        c_0x0000771f(0x05b6fccd0e7a590c82755ea26f6b25b6fef6b57ee2a169f689207ec451b35fbb); /* statement */ 
emit RegularTreeRequstedById(_treeId, _msgSender(), treePrice);
    }
}
