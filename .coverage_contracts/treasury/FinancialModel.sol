// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
function c_0x9bed025a(bytes32 c__0x9bed025a) pure {}


import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../access/IAccessRestriction.sol";

pragma abicoder v2;

/** @title FinancialModel Contract */

contract FinancialModel is Initializable {
function c_0xf991ed3a(bytes32 c__0xf991ed3a) public pure {}

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private fundDistributionCount;

    uint256 constant MAX_UINT256 = type(uint256).max;

    /** NOTE {isFinancialModel} set inside the initialize to {true} */
    bool public isFinancialModel;

    uint256 public maxAssignedIndex;

    IAccessRestriction public accessRestriction;

    struct FundDistribution {
        uint16 planterFund;
        uint16 referralFund;
        uint16 treeResearch;
        uint16 localDevelop;
        uint16 rescueFund;
        uint16 treejerDevelop;
        uint16 reserveFund1;
        uint16 reserveFund2;
        uint16 exists;
    }

    struct AssignModel {
        uint256 startingTreeId;
        uint256 distributionModelId;
    }

    AssignModel[] public assignModels;

    /** NOTE mapping of model id to FundDistribution*/
    mapping(uint256 => FundDistribution) public fundDistributions;

    event DistributionModelAdded(uint256 modelId);

    event FundDistributionModelAssigned(uint256 assignModelsLength);

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {c_0xf991ed3a(0x0f05bf5f16383dc4d52bbd2ee8cb10649455d46be9b318dd01d04f5dfd6243cf); /* function */ 

c_0xf991ed3a(0x3c5a5f1f687399b667679893474fc19cfa51be60a0b49a5a530f126550386d44); /* line */ 
        c_0xf991ed3a(0x9bac25dbf04f99f2271cc6fd83e43163032911c4de7bd46a852447b2987d337b); /* statement */ 
accessRestriction.ifDataManager(msg.sender);
c_0xf991ed3a(0x05c46a7e0a7c56ad643a3518e325fae1aa07c4879340ef4aa26567cd90168f7d); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isFinancialModel
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {c_0xf991ed3a(0x598e625d2104d0c16d69fefe61b13a39f46320c2a381e2c31433d8bdd040a4f4); /* function */ 

c_0xf991ed3a(0x01fb27db870bd440c3ae28236ece0294840b53cf6a02dfcda796720d19ecbd78); /* line */ 
        c_0xf991ed3a(0x4b178e3386a09c537700fd7c9b44e8586a02b524939e6120d0b940910e1a8c7d); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

c_0xf991ed3a(0x905a614b7f3cd22de4bca0dcece9e90a442c7038b7c683a22fb2f1c46cb6bee7); /* line */ 
        c_0xf991ed3a(0x1d52f38dd704f2404bee57bcf5d002e951937ba8b3b6f075b7c4bf040be53a72); /* requirePre */ 
c_0xf991ed3a(0x805f00cf6f9f55dc87336dffb3a4cafcc30ba4d634c7711c1d045c46f7788b6f); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xf991ed3a(0x72027101570746687a8399598292f8b701f0e7bcaba32bc2850482eb6888a70a); /* requirePost */ 


c_0xf991ed3a(0x323710def96f1db41e103b92696e04f4db5f3f2f1feb449dcb1d802bf9aaa33a); /* line */ 
        c_0xf991ed3a(0xe1d20a72660006c1d8b2d6869d288c7b84fee66b7525979eb37415e6cd9caff1); /* statement */ 
isFinancialModel = true;
c_0xf991ed3a(0x7143c968f0b7f4e803dd4e5c5b6f80295877d87b685895ebd025771d84562801); /* line */ 
        c_0xf991ed3a(0x24f4ad4687c6a863b8d89d195b5b0fd71ad98754adbebb26f8c6b563863c1a32); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin add a model for funding distribution that sum of the
     * inputs must be 10000
     * @param _planter planter share
     * @param _referral referral share
     * @param _treeResearch tree research share
     * @param _localDevelop local develop share
     * @param _rescueFund rescue share
     * @param _treejerDevelop treejer develop share
     * @param _reserveFund1 reserve fund1 share
     * @param _reserveFund2 reserve fund2 share
     */
    function addFundDistributionModel(
        uint16 _planter,
        uint16 _referral,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external onlyDataManager {c_0xf991ed3a(0xb7cd2106e391417ec2c37ccfecd65640bc24347dfd6ecb6d3461475af1732072); /* function */ 

c_0xf991ed3a(0x120b29fa073ab483101b7ad272283ca193c5389760d84cf88de0470d80b0b8e9); /* line */ 
        c_0xf991ed3a(0x8c84ee81e6d4b668c834e51955201a9df76afc4edf5c4b4f47c182399acaa1e3); /* requirePre */ 
c_0xf991ed3a(0xb1777693137177286fcb1f24ddcb37a94756752d9a0e804e67d1a45bbf17a437); /* statement */ 
require(
            _planter +
                _referral +
                _treeResearch +
                _localDevelop +
                _rescueFund +
                _treejerDevelop +
                _reserveFund1 +
                _reserveFund2 ==
                10000,
            "sum must be 10000"
        );c_0xf991ed3a(0x4f5e3a2ddfae63bd735d0f193478ad9b26a3816cf552e7809ab603a7a55f7336); /* requirePost */ 


c_0xf991ed3a(0xf69164bc9d541836d2c3e5445eee387ce176504544e9b996e931b507e3111dbb); /* line */ 
        c_0xf991ed3a(0xdd21ca3bc739f10c4dec0e654e8590ad1c87dddca845615b01f1cb0c587ca20f); /* statement */ 
fundDistributions[fundDistributionCount.current()] = FundDistribution(
            _planter,
            _referral,
            _treeResearch,
            _localDevelop,
            _rescueFund,
            _treejerDevelop,
            _reserveFund1,
            _reserveFund2,
            1
        );

c_0xf991ed3a(0xad8d58fb6122c2ff78b2b65e7cc313fdc73d26773f09a3458f051d7de4c50add); /* line */ 
        c_0xf991ed3a(0xc11f18111096d0540e1d65660d2fbcf184c120f87a0bd7ae102efcd1d09b79e8); /* statement */ 
emit DistributionModelAdded(fundDistributionCount.current());

c_0xf991ed3a(0xf425e38728c758a141f758a3fabb5363b7b5c30463d070396820484114c0d7f8); /* line */ 
        c_0xf991ed3a(0x58939c0c8255fac72f71a3823da147a67146dbc9753b8a30e23de758447cddee); /* statement */ 
fundDistributionCount.increment();
    }

    /**
     * @dev admin assign a funding distribution model to trees starting from
     * {_startTreeId} and end at {_endTreeId}
     * @param _startTreeId strating tree id to assign distribution model to
     * @param _endTreeId ending tree id to assign distribution model to
     * @param _distributionModelId distribution model id to assign
     */
    function assignTreeFundDistributionModel(
        uint256 _startTreeId,
        uint256 _endTreeId,
        uint256 _distributionModelId
    ) external onlyDataManager {c_0xf991ed3a(0xa9effabe67ab3d7976a3ce6c252bd5f8fdc4cf410acfb197e7a1303c713f30fb); /* function */ 

c_0xf991ed3a(0x1d39f6f0af6a505c71aca735cc6534385e2a24e6c5385070c94e0f70cd56d3fa); /* line */ 
        c_0xf991ed3a(0x0b8635847ec34c8e4b2ffbd082987806a0771da1b0a89d4ddbb49a9848101227); /* requirePre */ 
c_0xf991ed3a(0x761d3bacc9b891c55501abf1d3d655878425178da533d38b4327d98b29c10a0b); /* statement */ 
require(
            fundDistributions[_distributionModelId].exists > 0,
            "Distribution model not found"
        );c_0xf991ed3a(0x9a69359db544948a572a8ac690f3741a207dfc73d06c8980cc1ba9d4d57a2d3f); /* requirePost */ 


c_0xf991ed3a(0x3a1fc73dd0ca462206808cafe321763b05512f2455699b08c36e5498b60d3875); /* line */ 
        c_0xf991ed3a(0x020141f97eca87bc47040cc0c30af5fde02e6a66f2781e24ebb77532dbd80ca7); /* statement */ 
AssignModel[] memory localAssigns = assignModels;

c_0xf991ed3a(0x297ce7fafa56387499b4ca0f394fd2ad3c542d307bf64c60887b0c6a0a480dde); /* line */ 
        delete assignModels;

c_0xf991ed3a(0x6ac16eba467de35c4e1aba712ec7b7c68355a70c8294e5e5d1507113a03b6785); /* line */ 
        c_0xf991ed3a(0x39fd4f24a9d4e4b46397ed55ed80e2ce0ebd5c3520c0ff23e519c9db41382814); /* statement */ 
uint256 checkFlag = 0;

c_0xf991ed3a(0x460ca0ad11fb28831784373a3b389335bf3c7526524a017d96cec7371ebe6618); /* line */ 
        c_0xf991ed3a(0x5f67d88317c61d441b29a71fc1ccd6a4c3088fedc7b0afbc2da5a431aa5aba22); /* statement */ 
for (uint256 i = 0; i < localAssigns.length; i++) {
c_0xf991ed3a(0x86b8d58b4564dc38e6cee7be429cd14566e378c0b80e304d524c8f81865435b9); /* line */ 
            c_0xf991ed3a(0xc1d24f493da5ae512e405201799d27a0fdb4ff6c9855be2c88e7b4e49be7494a); /* statement */ 
if (localAssigns[i].startingTreeId < _startTreeId) {c_0xf991ed3a(0x5812cdaa95d8afeda0ce79f4d0c197c376c8482194d400fcaa2bcddf8c18cc68); /* branch */ 

c_0xf991ed3a(0x34dd07213eefe3a5b5ccb557b23b8b2d57a9c46fd4eabc1bb2ba253c25367904); /* line */ 
                c_0xf991ed3a(0x4c8d720a77cae2ffd34885843baa3e3f29b08626e859021c3cc4ec741112f597); /* statement */ 
assignModels.push(localAssigns[i]);
            } else {c_0xf991ed3a(0x28727ec88aa587f702bf2d5a8e95b01b147dffa1fa86e881c63df100382fa6be); /* branch */ 

c_0xf991ed3a(0x465167d83fdcb49658bcab3585c8feefd970bba30d0cd90a0998922cc2b8ee18); /* line */ 
                c_0xf991ed3a(0x1428fb8c95213f92467fe73dff08d883003954bd903f719f1122a183d952aac1); /* statement */ 
if (checkFlag == 0) {c_0xf991ed3a(0x02f5822da6c678a493c872b0704aabc9b902c8798ce1f5b85557c206de6cdf28); /* branch */ 

c_0xf991ed3a(0x5e5f20d15bc2c2c198e8b2eb0bb6c6073cd8ae402a5fe37eab3b5921347bca9e); /* line */ 
                    c_0xf991ed3a(0x3949889ff81c9759e7cd1feb65883405e8c0a95a444237d0723fb4be1be8e96a); /* statement */ 
assignModels.push(
                        AssignModel(_startTreeId, _distributionModelId)
                    );
c_0xf991ed3a(0xe670a73a4f978a9c752c7de920ac2e1f7ab69b09d540f330409fa4235fe57ac9); /* line */ 
                    c_0xf991ed3a(0xdb656f5c5dc7df0ccd147c602d571cf2d94f365ef651d20d4b33d022663d6de4); /* statement */ 
checkFlag = 1;
                }else { c_0xf991ed3a(0x924325008b1bcd86882a6fee9d0fea32532c6c07c1828784a606ad922c34f3f2); /* branch */ 
}
c_0xf991ed3a(0x7f0c7c235e20a9b758812b29aa6e65acef6e62ab6b2d30e8d8f4c814c2014338); /* line */ 
                c_0xf991ed3a(0xacc96a4577626ad24d695ad57747945077b602ff24b82bae24fccd6d26cb47ea); /* statement */ 
if (checkFlag == 1) {c_0xf991ed3a(0xd3ac56a8da3467084596e91caeae6baf9d77ba3e23ff9fc9bc1ebf0b0ff4fbc5); /* branch */ 

c_0xf991ed3a(0xc916e610ac685933a156bc0018db0b468e5d0a2abaa27de63c3fdcc1b228b5e8); /* line */ 
                    c_0xf991ed3a(0xd66e574a4b02c0e269363db4a881c13a97f07bebb43a8997bc1ff85f6e9acd96); /* statement */ 
if (_endTreeId == 0 && _startTreeId != 0) {c_0xf991ed3a(0x39fd1b8e5cf5003b4df59cc21447ef823daa3622cf5bcd0103e183ba5e2edb2c); /* branch */ 

c_0xf991ed3a(0xf4f872601728c3e0cda1d8f5ca6c67fc6117647c459a6cc55b0447d9f41c383f); /* line */ 
                        c_0xf991ed3a(0x2814f49cf205ade19b32bbb9d1da32cd30dc722f2a78385e83a44fbfb6aae939); /* statement */ 
checkFlag = 5;
c_0xf991ed3a(0x5487173d896ea864897fce71979c474c324512c8f7a4ad114614ea929b2d6c5f); /* line */ 
                        break;
                    }else { c_0xf991ed3a(0xeb636923c9aa4841d6241ecdfc662a66c7add0e2597cce69741d218de2b8a15e); /* branch */ 
}
c_0xf991ed3a(0xc3abb56250ff18200a2aa5a59b8aaaf244d90d17c3b1ba32c804c6cfd1ddf6fc); /* line */ 
                    c_0xf991ed3a(0xde15d37f557cea497ca973b7cb0134cacf19e8299042cd96a3127af113273361); /* statement */ 
if (
                        i > 0 && _endTreeId + 1 < localAssigns[i].startingTreeId
                    ) {c_0xf991ed3a(0x19895cf6b7e4213102b93901be06e5b11f742be3c24d992518a5c2c71b69d705); /* branch */ 

c_0xf991ed3a(0xb242b39da981e3f049d844266134516f17cf6cc66e0f76c23d83e21af0314e62); /* line */ 
                        c_0xf991ed3a(0xc81254a5f785648f2cf5f4d4f51010029fe726e8567f7c3df7de52ba1a7f1e63); /* statement */ 
assignModels.push(
                            AssignModel(
                                _endTreeId + 1,
                                localAssigns[i - 1].distributionModelId
                            )
                        );
c_0xf991ed3a(0xc86b04753a8689f500c856231cfe9af1ac6cb2cc81eb9d178973dc3da8820af8); /* line */ 
                        c_0xf991ed3a(0x906b7d1d57ecd4dc0981a40610c5b011be912a24a680472e5a5667e48d8f78c9); /* statement */ 
checkFlag = 2;
                    }else { c_0xf991ed3a(0x696e58168eaa8054dfca746470415b0692f343c92d71fe19bb36fa8abf514bf4); /* branch */ 
}
                }else { c_0xf991ed3a(0xd041f4d16b7267bbfef2986fd5966e9df43491721f88d35dc70e694c815dd0ea); /* branch */ 
}
c_0xf991ed3a(0xe46bab13e6600361711ec126f4bb56c541a9d3433a770e10daba83396bdd334e); /* line */ 
                c_0xf991ed3a(0xbc5f3edc4ed94abdb314301bc79276225b873d61624afa70db7e6bf2a8525e83); /* statement */ 
if (checkFlag == 2) {c_0xf991ed3a(0x2f1df288b98dcf6145e5e14bd3cd3c7c404a4c9b6005ee8c068deef3f78d7cb8); /* branch */ 

c_0xf991ed3a(0x5db0d4dcde64fec39ddfffe222da07b7a67cf35ece3781ddb071c44f71758674); /* line */ 
                    c_0xf991ed3a(0x32d2316a8a152d399b0aa52fb3283cd761f208b838bfc688e44fe19df4e587db); /* statement */ 
assignModels.push(localAssigns[i]);
                }else { c_0xf991ed3a(0xc65a9c6794f4484a1399fccd5a5126930d3eade25eaac745693575db46f8f8f2); /* branch */ 
}
            }
        }

c_0xf991ed3a(0x29910ff246226faa52c4833e33b913549d0401130e3a3b5bc4ff44e424f177c7); /* line */ 
        c_0xf991ed3a(0x1008809c4ca7e6e5a4b3eecaac8f63c4ff9eabcaa14033cf5ff2e684eb4c9779); /* statement */ 
if (checkFlag == 0) {c_0xf991ed3a(0xb21487c13e3a140fc4dd01b368075881ab62dc7acbdc49f826d3a60c416c62f6); /* branch */ 

c_0xf991ed3a(0x15eec76ae10e4af8cca49a928415ae28ca80e08b7b962b1f154ce2e98084fcfa); /* line */ 
            c_0xf991ed3a(0xd8da713b53ecd768760ccc563be65eed4e2df12a403f806a0f48190c203e6c97); /* statement */ 
assignModels.push(AssignModel(_startTreeId, _distributionModelId));
c_0xf991ed3a(0x982b5a894fb2a6f3e4ca159fed7258708d269c97447695601d53accb4afe3904); /* line */ 
            c_0xf991ed3a(0x488b1ab040ebd4d95cd2fe6d3ee27333b7971f0ba91684eb16f27d3dd7cc1859); /* statement */ 
if (_endTreeId == 0 && _startTreeId != 0) {c_0xf991ed3a(0x411964b957895ccd5df8687f4352f6cb92ad3755ba6407f365fe4b7066555f41); /* branch */ 

c_0xf991ed3a(0x913136e1e3e04742df672966c58ec4f39ecb331c9c11d3409dd65c1be9908bbc); /* line */ 
                c_0xf991ed3a(0xccf87b2f3198cbef4b47739abde782dc9ef99826acb679d9889081c69a097213); /* statement */ 
checkFlag = 5;
            } else {c_0xf991ed3a(0xc7dfa72b4ec3f56d26a4c850ecbe5b0be1e81ee72039114f1d3ee8a8cd53cdef); /* branch */ 

c_0xf991ed3a(0x3978c1ffe0e248ede7e28a041b6292ab34ff046887e0f5f271a13a8da4a787ec); /* line */ 
                c_0xf991ed3a(0x86b96de4aa1f26d87fb0af3a8178cb5acb425d981b7ae1186a9ced0453f5a77a); /* statement */ 
checkFlag = 1;
            }
        }else { c_0xf991ed3a(0x436f5ec53790cf6b719049b2a807ca1de78950a3a7f8554db30e11139552a7af); /* branch */ 
}

c_0xf991ed3a(0x34f7c585d92ae008657ddbc7860a8ca8987dfd4d27ad9c8838e026b246cf0efe); /* line */ 
        c_0xf991ed3a(0x9f558b16c3b4593e698d0249ae740748af75491761eb8835711ac63aafbc0f54); /* statement */ 
if (checkFlag == 5) {c_0xf991ed3a(0xc072a2eecc4f0671db483464ed07eecea8e365744723b7043962e83d7efa2987); /* branch */ 

c_0xf991ed3a(0xc37bd1dc17ce72130dd789beac99b3915b029ad9af09fd9761d65a37463e20c4); /* line */ 
            c_0xf991ed3a(0x6d0a2411ff2cf3f13b74ee050db489070ac7e564aa58a67694cea1958313b526); /* statement */ 
maxAssignedIndex = MAX_UINT256;
        }else { c_0xf991ed3a(0xaa609869bb7b1bf331acdfff2c372093c3bdcce32c367b8b2ad45768f5ef2afa); /* branch */ 
}

c_0xf991ed3a(0xeb20c6efff4ee1cdf041025ebe13b7b33502af60d5425ec6be7858aec30f5d78); /* line */ 
        c_0xf991ed3a(0xb7152c38466bce39fecc89ef74c4ea13a2bf11186041356f34af53e141940b69); /* statement */ 
if (checkFlag == 1) {c_0xf991ed3a(0xc42bebc124da757593ead6597d8ec24e55f621ce1a68af773d36ea336aada7db); /* branch */ 

c_0xf991ed3a(0xd32349984e00f072c31f8997063c958f19ed555ced86229792512cc5387da42e); /* line */ 
            c_0xf991ed3a(0x56424dcbfc692071724eb9b47afbe64fed779dead504b94af44af70ae3d1afae); /* statement */ 
if (maxAssignedIndex < _endTreeId) {c_0xf991ed3a(0x55253c23c0be8f369c7f27c2dd893d7f5f710bf2cfa4221d4aa90ef511e9efb7); /* branch */ 

c_0xf991ed3a(0xdb723f17f3cc83a9e130c291e114599f1ca57498d94db2a95168ee53270c28a3); /* line */ 
                c_0xf991ed3a(0xbccb4371c57a5520923bf5c91230f593d5f1c16463dae208dbb1dd7e62bff420); /* statement */ 
maxAssignedIndex = _endTreeId;
            } else {c_0xf991ed3a(0xf7a8ee1268ad492b476c154a4ad8417c51f620bd07b9ed9815a92fbe843cd594); /* statement */ 
c_0xf991ed3a(0x7efb4a8523fd64bf3993169d66785d6c50f61a8c0c6dea940d1f980ee160d74d); /* branch */ 
if (localAssigns.length > 0) {c_0xf991ed3a(0xf4682f0f0a5a484ce2784d1203670ddf956d7e2f824a39cea95e57394bd39362); /* branch */ 

c_0xf991ed3a(0xa650deba8727a8bd036611eefca194ffeac6da56530f6ef199b09fee91c85c23); /* line */ 
                c_0xf991ed3a(0x6b8feaea9facc7c5474ff2e80b702d4874d87aad2c9c6b2707764125ee813337); /* statement */ 
assignModels.push(
                    AssignModel(
                        _endTreeId + 1,
                        localAssigns[localAssigns.length - 1]
                            .distributionModelId
                    )
                );
            }else { c_0xf991ed3a(0xe64e85a219d96d839348334f4662886f2f705cdf2e3488929765135715831d71); /* branch */ 
}}
        }else { c_0xf991ed3a(0xc00ff6f8653f42c8a29423b6b074589aab8eeb60b85b581333c9c6cad79cca55); /* branch */ 
}

c_0xf991ed3a(0xad912370b3efbadcd065736846a64799d7c545dd0356abc27e25e11b8e9d7038); /* line */ 
        c_0xf991ed3a(0x59cd0c2fe0f5af1ac21b2fb16a4322efb17450936e70833b6c3021968c52c74b); /* statement */ 
emit FundDistributionModelAssigned(assignModels.length);
    }

    /**
     * @dev check if there is distribution model for {_treeId} or not
     * @param _treeId id of a tree to check if there is a distributionModel
     * @return true in case of distributionModel existance for {_treeId} and false otherwise
     */

    function distributionModelExistance(uint256 _treeId)
        external
        view
        returns (bool)
    {c_0xf991ed3a(0x55aab49204a5a3e2ddbc23df625d30ead41f4c54f607be78fa6635a479a04d1a); /* function */ 

c_0xf991ed3a(0x409a813effd84d88eb7744d9c637f3aade61e3cd5d24e7c9562d5bade3f3065e); /* line */ 
        c_0xf991ed3a(0x0466914c5c56543aabdd91a0ed6d8f1e2fe9b8b4b4e36c92b7c90a3f54787307); /* statement */ 
if (assignModels.length == 0) {c_0xf991ed3a(0x92ffb7fd6b1b5a27ef9452e76ea9166e781799c05e0f4aa03049b86a5d2b1fad); /* branch */ 

c_0xf991ed3a(0x94cb7d02cb6a707003fe2072e8d76a10c4a6638a7ef4ca0967fd45018843c9e4); /* line */ 
            c_0xf991ed3a(0x310143797a662f9013604e7042ee1164eafbaf756f0a9b1a570d731d93139ae2); /* statement */ 
return false;
        }else { c_0xf991ed3a(0xa611fa2c56e99b3869813a3022998974d4b0bf7f2298e66df9ab4baa5b8a3176); /* branch */ 
}

c_0xf991ed3a(0x0b4e6a34eb6610200a163a0725b422f61239d269b9cc741567befd4b76799c6b); /* line */ 
        c_0xf991ed3a(0x9a8ebb4dd1c5b491556a644ceebe83a6bbf903a85d8ddc777bbd3bfb6c0c4ca3); /* statement */ 
return _treeId >= assignModels[0].startingTreeId;
    }

    /**
     * @dev return fundDistribution data of {_treeId}
     * @param _treeId id of tree to find fundDistribution data
     * @return planterFund share
     * @return referralFund share
     * @return treeResearch share
     * @return localDevelop share
     * @return rescueFund share
     * @return treejerDevelop share
     * @return reserveFund1 share
     * @return reserveFund2 share
     */
    function findTreeDistribution(uint256 _treeId)
        external
        view
        returns (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        )
    {c_0xf991ed3a(0xbe90e19f4a33ff5b84aaad82507b7d05c378cf97e617166f6caa883690a30c5a); /* function */ 

c_0xf991ed3a(0x744557769e9df4c0679d97e3ec57e6703d7664dcba5d2a336d6e8006ecd545eb); /* line */ 
        c_0xf991ed3a(0xd21e344fef46df41b7d0469b4e31e6e6c401cc7dcaf59755062b12e24d47b498); /* statement */ 
uint256 i = 0;

c_0xf991ed3a(0x590af388b78a40e7708d3fd016b7ba32d91d2a49258f2515a8447cb8abd4243e); /* line */ 
        c_0xf991ed3a(0x382fec2dde3379f26892e141a509b926cfee10475b6007310bdfe48a059ededc); /* statement */ 
FundDistribution storage fundDistribution;

c_0xf991ed3a(0x12f9fb4155f9ada6d0514ee0c63cac53d9b557cc90572c10fcf1c3c726fdd2da); /* line */ 
        c_0xf991ed3a(0xb28556414cb480cedfb7562220b1e285275aff9df5179cdcd80198b451c50d50); /* statement */ 
for (i; i < assignModels.length; i++) {
c_0xf991ed3a(0x8131c8b9bd34bd760ba1ad8b2c2d6e3bea44c27e515fbf07ddb9b81b7d276bc9); /* line */ 
            c_0xf991ed3a(0x78c03bc50d8324beffae099a36c299beeb9acf297e59ca5188e5a85da2bfba13); /* statement */ 
if (assignModels[i].startingTreeId > _treeId) {c_0xf991ed3a(0x91945d0b28c98db525618a1e4cd0036819bc0a1a9f211a1bf9611ed5e1205ec5); /* branch */ 

c_0xf991ed3a(0xaedc767c92d46283ef02657ae87514925712c4e5b51aa1fd9bb192ccc61ab87e); /* line */ 
                c_0xf991ed3a(0x16e27fcc228f33674cfb9d1cbe9914e2e344f1e4433c8d1acd5564008d5a58c1); /* requirePre */ 
c_0xf991ed3a(0x67fc88afaf107abfd15027f8c79878852bdea712c1a55de123adc1029c3714c4); /* statement */ 
require(i > 0, "invalid fund model");c_0xf991ed3a(0xfb9b22cf88df75d192ccc7af5cd46fa36bc83c5f8df3f7cb70b60faa276b696b); /* requirePost */ 


c_0xf991ed3a(0x8c85c91cc4eb7915ee11c7f8819d9e7daddf26629daa3376dea1b088261c3d7a); /* line */ 
                c_0xf991ed3a(0x12249c5435876c4725a5aace787a46c469b1232bf48aeb739b19407e66c37b3a); /* statement */ 
fundDistribution = fundDistributions[
                    assignModels[i - 1].distributionModelId
                ];

c_0xf991ed3a(0x8ef004bfd1bd04d5abeecf3a4616224dfba3f9652e2213356d245d9a509def1a); /* line */ 
                c_0xf991ed3a(0x82b5fd39f1ed19a28f11f6d74bb16f19886ac3dcc1f7fdb388193ffcabfe8b6a); /* statement */ 
return (
                    fundDistribution.planterFund,
                    fundDistribution.referralFund,
                    fundDistribution.treeResearch,
                    fundDistribution.localDevelop,
                    fundDistribution.rescueFund,
                    fundDistribution.treejerDevelop,
                    fundDistribution.reserveFund1,
                    fundDistribution.reserveFund2
                );
            }else { c_0xf991ed3a(0x5b0ec733fb310a8fec6e358ff496df0f58b264de9412ba159cec70fed0246d6c); /* branch */ 
}
        }

c_0xf991ed3a(0xe90b044c320c7ef23930b6cb7582702fddab19b4377f5d8402b55ac2a1948bd3); /* line */ 
        c_0xf991ed3a(0xe351fa0e8f2571cfe6cb34db6179bc91396f38f47dd2d621c3884e120e39250d); /* requirePre */ 
c_0xf991ed3a(0xd90e452006a6252303cf61c2373c07fb7472115ec53bf1342e34190f717fdf22); /* statement */ 
require(i > 0, "invalid fund model");c_0xf991ed3a(0x791afcaecadb8f12ac47a12846ead214ed2a8fe4eb38c7b5bc0aa4fe3c58ec55); /* requirePost */ 


c_0xf991ed3a(0xafce02be55fb8a5b65e10662dc4b5116044db1673e2263dc1b1ebfbf220617ff); /* line */ 
        c_0xf991ed3a(0x66752f8fdc8d02c7c66b13e5fdb58c649e19c3ad5f80b88faf72481c16311097); /* statement */ 
fundDistribution = fundDistributions[
            assignModels[i - 1].distributionModelId
        ];

c_0xf991ed3a(0xbf86a3df5445ed4bda232528199b4471ff7550b3073111535b7268ac4f2f8df0); /* line */ 
        c_0xf991ed3a(0xeb9dc3eb7f7076d00d5cdafc03744ec4cc0e8b845cd94c58b5b78d68f29e3d8b); /* statement */ 
return (
            fundDistribution.planterFund,
            fundDistribution.referralFund,
            fundDistribution.treeResearch,
            fundDistribution.localDevelop,
            fundDistribution.rescueFund,
            fundDistribution.treejerDevelop,
            fundDistribution.reserveFund1,
            fundDistribution.reserveFund2
        );
    }

    /**
     * @dev return fundDistribution id of {_treeId}
     * @param _treeId id of tree to find assignModels of it
     * @return id of fundDistiubution
     */
    function getFindDistributionModelId(uint256 _treeId)
        external
        view
        returns (uint256)
    {c_0xf991ed3a(0xd625ced62e63bb55071ab8b8f5aa857736ec76bab8f7230fe5eda6081317daa5); /* function */ 

c_0xf991ed3a(0x0762de3e32a57be60140cc9f32ae72f2f9e369a046a1cb7948e2ca84521f7b75); /* line */ 
        c_0xf991ed3a(0x8773f1730dc65732ab0a68a70316aeb768f7eca2e3329ac4763a288a6e9feb7e); /* statement */ 
uint256 i = 0;

c_0xf991ed3a(0xf7c890f2e6b82703bf230878a90b7af828dec80bccf1575fde40cc548bd9b88b); /* line */ 
        c_0xf991ed3a(0x8bfddef96879cc22d337a510b330c3f92a7122649865850e9c2f6640142fada7); /* statement */ 
for (i; i < assignModels.length; i++) {
c_0xf991ed3a(0x7e8d5ba0cd0b5b25ac15dbcee611f587dfd388a7e2c29107a51e1b980b90ab2c); /* line */ 
            c_0xf991ed3a(0x9d7dcaa63c42650794e93b1dc75340dea25408941c85b9725b7861ac2ee86e7c); /* statement */ 
if (assignModels[i].startingTreeId > _treeId) {c_0xf991ed3a(0x5d97a6eea7ba9ef086ee7774e52ae16d25285e67bd4afa5738920e78c83cf7bb); /* branch */ 

c_0xf991ed3a(0x8a14bede62fb845dd07e4b043e57866dfb805d0178021767778aa23c44a16a33); /* line */ 
                c_0xf991ed3a(0xe3996362754335f603fb0a01939e1af7ebfa965f17c7a14ec5df5bc58732547a); /* requirePre */ 
c_0xf991ed3a(0xc03c1f34f1c236df1b9613bd72ac2f24939880f91539e88cfd4fabeb635bcabf); /* statement */ 
require(i > 0, "invalid fund model");c_0xf991ed3a(0xa0f624de931e03cca7cca092d317ec6864e9cfca6d5568328561a59dbbe044b4); /* requirePost */ 

c_0xf991ed3a(0x559630913bad54e96ba524202ed7d5bfce0e6e172db683ea18a985b7e888cb27); /* line */ 
                c_0xf991ed3a(0xc4de203e228ce7410c0a60042077695ef11e77f21199c4fe182ca5fc3db8539e); /* statement */ 
return (assignModels[i - 1].distributionModelId);
            }else { c_0xf991ed3a(0x32035a13cdee1cbdf30c3aa5b8a5cd694ab2e52da88a3f10c0deca727bac206c); /* branch */ 
}
        }

c_0xf991ed3a(0x5662274be9134b7e600a95ea5b601bc06022e51bee18db5aa9b3ac6aab267fc6); /* line */ 
        c_0xf991ed3a(0x92ee761c61ca388f18d45c12ca9754d1a4460a23e47596633149a96de8fd8f97); /* requirePre */ 
c_0xf991ed3a(0x09b087a55227d006fa609b58ae6fa0619ff82d17eb13594408871468ef2fa74b); /* statement */ 
require(i > 0, "invalid fund model");c_0xf991ed3a(0xf85e776c5952260b208573ee1d31176ccc1a506aaa9fc1a81d5a1df411ca6769); /* requirePost */ 


c_0xf991ed3a(0xacfdeb990fcd24d61d7b4049dc16e04aadaaf9c45c129f43ba2b049c349fde9f); /* line */ 
        c_0xf991ed3a(0xc51f1fe62109fe026b99725882bc202d3932fdb87537bbff2c89ea6c9ca9c5ac); /* statement */ 
return (assignModels[i - 1].distributionModelId);
    }
}
