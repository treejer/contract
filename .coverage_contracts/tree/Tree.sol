// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
function c_0x2e2bd7b6(bytes32 c__0x2e2bd7b6) pure {}


import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../access/IAccessRestriction.sol";

/** @title Tree Contract */
contract Tree is ERC721Upgradeable {
function c_0x548903a7(bytes32 c__0x548903a7) public pure {}

    /** NOTE {isTree} set inside the initialize to {true} */
    bool public isTree;

    IAccessRestriction public accessRestriction;
    string private baseURI;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x548903a7(0x6177e1484898e98fdc75b8e68711674e06be2bd872dc9721954e4eda3531a9c0); /* function */ 

c_0x548903a7(0xf55ab38d416ca14d23a729c14639d3cb13248839a841d9e9096c5e18bf22eaec); /* line */ 
        c_0x548903a7(0x5374865a65ea7eca40d231b2559395af49cdb3269c3b7cf3a010029a8c469406); /* statement */ 
accessRestriction.ifAdmin(msg.sender);
c_0x548903a7(0xaf6e88811c4924038790a097eab7af4a7320e81de92d9b0655038c90ca096e7f); /* line */ 
        _;
    }

    modifier onlyTreejerContract() {c_0x548903a7(0x6913a1ede33e4c2de04a4f3d8482be270b064c6a3f56df2f80c78455fc4c2c49); /* function */ 

c_0x548903a7(0xa491ceb5e9310cffbe1955203d3d6d6ab6e1e971b22aa36d5827a7f145d62112); /* line */ 
        c_0x548903a7(0xcbd8a71b19f76a3de9d504fc90a750a7a2be23a6b3233c176384073650d50931); /* statement */ 
accessRestriction.ifTreejerContract(msg.sender);
c_0x548903a7(0x6da9baadf3dc630c9ae967a4bea8c5b12772795c40bfc88596e28211f08c59a1); /* line */ 
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTree
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param baseURI_ initial baseURI
     */
    function initialize(
        address _accessRestrictionAddress,
        string calldata baseURI_
    ) external initializer {c_0x548903a7(0x5fef58e336aef5d201f9eea3d2236ba8f71730e4c71c03a5a6e9e77e5ff36aa2); /* function */ 

c_0x548903a7(0x25960732d828750c66d4547d5511ee5e50bfcb46b35ea7a8ad8d9a18402f0958); /* line */ 
        c_0x548903a7(0x3a468ab344423d8fd3b38d2f93057a62f7b684c44b9bd5ebf3e4d438c59d8b64); /* statement */ 
isTree = true;

c_0x548903a7(0x4837693b324cd6140a2e5771eee8a5932acfecca862ffdfce2699556e6fe1927); /* line */ 
        c_0x548903a7(0xb1485803dd36ebb91ac21e11542607844e821d701f3c6d340ffa11ebc2ea0f61); /* statement */ 
__ERC721_init("Tree", "TREE");

c_0x548903a7(0x95b102f002dcfdd398b011f68a3886a20b45d3d092c53c4033a0e528686c32cd); /* line */ 
        c_0x548903a7(0x7d79aaa567400d812dd93e6f5be3bf68abca9ed72a507d7a32b804304c09fc43); /* statement */ 
baseURI = baseURI_;

c_0x548903a7(0x81013c7fbde9bddd04cb548b0e665f341138976a80737784e75195102f7028df); /* line */ 
        c_0x548903a7(0x8eedf555f66e4ece75b43b822adacbd91806b691b4e9481471f401dc8172a2ca); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0x548903a7(0x9e562eebc7617d26ff0b34516a80f2d0dbae773ca3c2e47fc5be1382178d6852); /* line */ 
        c_0x548903a7(0xae955687de4a3901d211bf88f945f56edf4d0b8beae90114337657bd177d265a); /* requirePre */ 
c_0x548903a7(0x389a6d67caafe78b49673bc2b53110f5b92905b580204a760f57bd4abcfb2392); /* statement */ 
require(candidateContract.isAccessRestriction());c_0x548903a7(0xaeff7ce81947750e8f7cb521328ce08f7cef2a6e29249cc500ec96b93998a891); /* requirePost */ 

c_0x548903a7(0x51b0e026f681e290cefe2f0d13c67c72386d329afd7856ced5d4b2d4f01c8673); /* line */ 
        c_0x548903a7(0xab473250f9ca03131df78f9710417a149425995dc27c4782b27c4f3c5f273f35); /* statement */ 
accessRestriction = candidateContract;
    }

    /**
     * @dev admin set baseURI
     * @param baseURI_ baseURI value
     */
    function setBaseURI(string calldata baseURI_) external onlyAdmin {c_0x548903a7(0x6e4d75f05170abe8183d38e7885568114bc41d5ab0fa07d175d06a5963d26ad9); /* function */ 

c_0x548903a7(0x3a25c5b0ec34969fc388917d1f9d234bf78fa4e33ac27ba5fe929a9806028536); /* line */ 
        c_0x548903a7(0xf1d63d08c00d4f1b7e513b37b24d02fd0e6b93abc8d0246c5eeb0ada36750a33); /* statement */ 
baseURI = baseURI_;
    }

    /**
     * @dev mint {_tokenId} to {_to}
     * NOTE must call by TreeFactory
     */
    function safeMint(address _to, uint256 _tokenId)
        external
        onlyTreejerContract
    {c_0x548903a7(0xeb1b022c79af2281f318e1602eb2ffb8ea87b3b86992b4b5b602152cd7d5c130); /* function */ 

c_0x548903a7(0x92520bae6f6020b5e7d798d24a5bf61695da3cafae31fcef7b14cced0c86364c); /* line */ 
        c_0x548903a7(0xe8100a9516c987661d6eee9c50e87c0a3883ad98fd79532cbcca4436e9cc09c3); /* statement */ 
_safeMint(_to, _tokenId);
    }

    /**
     * @dev check that _tokenId exist or not
     * @param _tokenId id of token to check existance
     * @return true if {_tokenId} exist
     */
    function exists(uint256 _tokenId) external view returns (bool) {c_0x548903a7(0x022781ae5ba1df933c0fa365b2465512ada0dd111d1b2e0adae65f42757fb04b); /* function */ 

c_0x548903a7(0x73753e9ffe59b95856e0a24e5c277995993869535a97ab99c838cb9a7092d36c); /* line */ 
        c_0x548903a7(0x7875d8a64b4261200e34a432358f1a9e0be5d92977dcb132607e306442d2e1f7); /* statement */ 
return _exists(_tokenId);
    }

    /** @return return baseURI */
    function _baseURI() internal view virtual override returns (string memory) {c_0x548903a7(0x109a3c3532aed9272edc514c89fafb3697ec02a39fae5e5f97f80d35a60a87db); /* function */ 

c_0x548903a7(0xccf99cfe6a8e5ef1e43db2685a578012c633d5eaa12852f0325d52496a36bd2f); /* line */ 
        c_0x548903a7(0xa91909a42bf468c039bf82257cca2929adc6437604ffb7e25ebd084b05bb305f); /* statement */ 
return baseURI;
    }
}
