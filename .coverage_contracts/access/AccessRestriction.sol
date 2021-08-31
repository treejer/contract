// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
function c_0x48bbb7fd(bytes32 c__0x48bbb7fd) pure {}


import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/** @title AccessRestriction contract */

contract AccessRestriction is AccessControlUpgradeable, PausableUpgradeable {
function c_0x1040b2e3(bytes32 c__0x1040b2e3) public pure {}

    bytes32 public constant PLANTER_ROLE = keccak256("PLANTER_ROLE");
    bytes32 public constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");
    bytes32 public constant DATA_MANAGER_ROLE = keccak256("DATA_MANAGER_ROLE");
    bytes32 public constant BUYER_RANK_ROLE = keccak256("BUYER_RANK_ROLE");

    /** NOTE {isAccessRestriction} set inside the initialize to {true} */
    bool public isAccessRestriction;

    /**
     * @dev initialize accessRestriction contract and set true for {isAccessRestriction}
     * @param _deployer address of the deployer that DEFAULT_ADMIN_ROLE set to it
     */
    function initialize(address _deployer) external initializer {c_0x1040b2e3(0xc20d0354ac98c1922d3e3a414d8e24d997e0a2d2f80e9d8d62a1fa3df5751ec7); /* function */ 

c_0x1040b2e3(0x49670a5e18a3f8539a13a5aa7adc565b719c825bf8186398c788878c6f627749); /* line */ 
        c_0x1040b2e3(0x623a37f8c8fdab7115dab882d480cb26e309ed6b5b997ead5fa321527cbfa0c7); /* statement */ 
AccessControlUpgradeable.__AccessControl_init();
c_0x1040b2e3(0xb776f8c9ff0debd7b70e041d4b4a6f492bb12080ebd5e1cf9957f5ad586bf4b6); /* line */ 
        c_0x1040b2e3(0x02176240fe2023088066702b3de2b50ede3e29efa7b5c0ebf7107c5ff2addcee); /* statement */ 
PausableUpgradeable.__Pausable_init();

c_0x1040b2e3(0x6945e58089d7311bd987732728025573644716c4cfef6d6132ef0f2f6da2b8f0); /* line */ 
        c_0x1040b2e3(0xb915aa9afd4e9b1475d4bff4a0239360f05065c2a39a9475f9fc501eb91b3eda); /* statement */ 
isAccessRestriction = true;

c_0x1040b2e3(0x8895f04460036023c0ec1f42d20853bd033aa3d29686587243504fc507a46fa4); /* line */ 
        c_0x1040b2e3(0x67e8d8e3b5859982087ab1b5af547c801966000cde606025b1d4e4bcf9b8ca59); /* statement */ 
if (!hasRole(DEFAULT_ADMIN_ROLE, _deployer)) {c_0x1040b2e3(0x09dd60a64f05a2208ca067f031e6394ff69c7dc8058a7bc3f57d4a366180ec16); /* branch */ 

c_0x1040b2e3(0xc9943c368ed2acec8844f8f34e65a22962c39c77651f5a5a36948f4bbe706814); /* line */ 
            c_0x1040b2e3(0x32b2e0d5f8e9b9670491ffbd74f20a66addd59375c51c2fb04483d5681497371); /* statement */ 
_setupRole(DEFAULT_ADMIN_ROLE, _deployer);
        }else { c_0x1040b2e3(0xd3b1159ffe075f18d4587ee360388ffb75c5d0a3e26e910743ce67a1ecc5008e); /* branch */ 
}
    }

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0x1040b2e3(0x928b33f1cae6cd3b43a06496659439ecf0472bdca6eb8abc9af204de5327f171); /* function */ 

c_0x1040b2e3(0x30e8d875d9f1dcadcb29b606cf6a20574780f7b02861b13d2ba515cd50570c08); /* line */ 
        c_0x1040b2e3(0xcb216dfe95c67051fc52801afaf71f66268641078f348c3c4de03cb735ee210e); /* requirePre */ 
c_0x1040b2e3(0x3c8b2ef3d9db556ce5dfdd6b77f96c39d31359ee088e091e537ffc1a8dcc4edf); /* statement */ 
require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");c_0x1040b2e3(0x278f17e68de7eed8fbec355914de843971fa746adcc9c76cc34e3cab3ce23479); /* requirePost */ 

c_0x1040b2e3(0xcc89ee7058d366baf93342c354e91472e7720352d2e051599a2b96c67e492e82); /* line */ 
        _;
    }

    /**
     * @dev check if given address is planter
     * @param _address input address
     */
    function ifPlanter(address _address) external view {c_0x1040b2e3(0x85276447fb7d5c8c0b15a1df2667542debef16560f282c9b27ad4571f3cef19d); /* function */ 

c_0x1040b2e3(0x2a4aa2fa54061a2e3f8925a42195117ebddd900b428b306d853517169c3bd4cc); /* line */ 
        c_0x1040b2e3(0x8d44637029e5a69ddc46e058e3a106c0c7a85bf82693b07a3016e7a0a2d0fecd); /* requirePre */ 
c_0x1040b2e3(0x26d445a7882057ee6ce39a4a91ed9eff39a7c0d9c681c29f79f866c4e4dc28dd); /* statement */ 
require(isPlanter(_address), "Caller is not a planter");c_0x1040b2e3(0xf3d2721b0e27bcc4be09ee78e7b207129f88c4bbb418f1e9bc86a54c9e9dda3f); /* requirePost */ 

    }

    /**
     * @dev check if given address has planter role
     * @param _address input address
     * @return if given address has planter role
     */
    function isPlanter(address _address) public view returns (bool) {c_0x1040b2e3(0x473b0b37efd6fe37c22a21951aa308f586dd55f12dce3ad0ae2195044a08a4d7); /* function */ 

c_0x1040b2e3(0xecc2376ad846034715426681b1e9ab378ec0c42d903d26f338434125014c31ba); /* line */ 
        c_0x1040b2e3(0xd360df30db42469b37450fdfa34178d5dab36488e1e051b777df394c3cb0fdf8); /* statement */ 
return hasRole(PLANTER_ROLE, _address);
    }

    /**
     * @dev check if given address is admin
     * @param _address input address
     */
    function ifAdmin(address _address) external view {c_0x1040b2e3(0x458717a363f0ac3ead6883edbfdc1b5631019e85e9ae94399e02935579472042); /* function */ 

c_0x1040b2e3(0x9c4e6cd9930cdd98bd8752b92c945d10d6502ce7f493b5f8b271046be7165ad2); /* line */ 
        c_0x1040b2e3(0x12c26521da8a53567e3425791e8cf7a88b16491c1233b82afc4dacc10bf80556); /* requirePre */ 
c_0x1040b2e3(0xf4caa6ebe2f14225032c1b90ba89cebcfe97b4a610043706317bf1c28f772cc9); /* statement */ 
require(isAdmin(_address), "Caller is not admin");c_0x1040b2e3(0x44bb39ef6b7e09ed71fe3bafb97439c5342df8549bcb5fbf95a578081241d03e); /* requirePost */ 

    }

    /**
     * @dev check if given address has admin role
     * @param _address input address
     * @return if given address has admin role
     */
    function isAdmin(address _address) public view returns (bool) {c_0x1040b2e3(0x6cdea5f34714a66d6e013548fa9adf9425c263b0c640525ffcc59c8d7cd99b73); /* function */ 

c_0x1040b2e3(0x1ff1797797849e67e72a8b90d1a129ada75d39866196cd56992942a23e15f3a9); /* line */ 
        c_0x1040b2e3(0x4be40b6beba871b2c3075c74ff7c3341223436df72b406e39d999883d24ec569); /* statement */ 
return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /** @dev check if functionality is not puased */
    function ifNotPaused() external view {c_0x1040b2e3(0x2e950f6c322b4e274be20365dce774b1a9d7e49a2db9312524eb498e39870866); /* function */ 

c_0x1040b2e3(0xf00c4d9a1002146c714314180f20d80fb01edeaa6059640b5e9343cbc99ccbaf); /* line */ 
        c_0x1040b2e3(0x0f7205ff7f0b59b2d1208dde789619e082ebcbfe701588bfd282adac7124cf34); /* requirePre */ 
c_0x1040b2e3(0x7010b80d0a54fcf084f2d5f0aa9b9c3adc278f04c7a765de4bafb4973acb7873); /* statement */ 
require(!paused(), "Pausable: paused");c_0x1040b2e3(0x0132ed1bbe9b2d063bdad822083c113c51366014b91efab637ca6707aa9ce01c); /* requirePost */ 

    }

    /** @dev check if functionality is puased */
    function ifPaused() external view {c_0x1040b2e3(0x642942a1e0790757b0ae2d1a078d8153217b4e83e495c6a1fbc6d8bf82fecc04); /* function */ 

c_0x1040b2e3(0x9ef42a0d2bace9d910854b66aaa596a1c2bde88ac520af1e381f74a1f86e771b); /* line */ 
        c_0x1040b2e3(0x7147021eaf0000acf349a719cc99a75df8551296cbffdd7af062bc17aabd9f72); /* requirePre */ 
c_0x1040b2e3(0x0c5a3e66c55120f3a6f8a348fe892ae81b797c1bb6b6997b357a640173ee45da); /* statement */ 
require(paused(), "Pausable: not paused");c_0x1040b2e3(0x98b5801de899df9dc77807bf8a118940382da2ecb23a070253c6e04c8b3f423c); /* requirePost */ 

    }

    /** @dev pause functionality */
    function pause() external onlyAdmin {c_0x1040b2e3(0xc40dfb43a9fce6db98d9a1e1bd11c66bff779f59d11f6c7f51bd5deba00a27f4); /* function */ 

c_0x1040b2e3(0x9fc1718247ff09d07e0f767910210ffc9984b75c34f4799e3913aa318d283e93); /* line */ 
        c_0x1040b2e3(0xc51ffe1a74b21117444775207c1c360f1dd266a16ec2eaae4dad16f8067a5b77); /* statement */ 
_pause();
    }

    /** @dev unpause functionality */
    function unpause() external onlyAdmin {c_0x1040b2e3(0x111216741baf912a8cf908edc594759d6802ce32fc1548790c64bfd399b97a80); /* function */ 

c_0x1040b2e3(0x056a6b506086ae06d497fe20ebf3e03cd6a8608a2f6697324ea5a2ffecbd8e11); /* line */ 
        c_0x1040b2e3(0xde0f0bbdc7f2a23b84699bb693ab9abf6b87757b4becc290d0661e5ae60ef9c6); /* statement */ 
_unpause();
    }

    /**
     * @dev check if given address is Treejer contract
     * @param _address input address
     */
    function ifTreejerContract(address _address) external view {c_0x1040b2e3(0xaf394e9b308b77ff9578225f463115cfec473bd2be69d96811a99d8c2918971a); /* function */ 

c_0x1040b2e3(0x48aa70ce78c43370fd7f98eeedd54a02693f8529a12194e1b4821abc962ec2cc); /* line */ 
        c_0x1040b2e3(0x3b251863c74498476ed2687aff8c0e6819b3222471c956ee232ef751e8b36f59); /* requirePre */ 
c_0x1040b2e3(0x54226bd9a06cbd44adc648f805b6845b385b7f8088cd9b0ff326281eaf4b3d56); /* statement */ 
require(isTreejerContract(_address), "caller is not treejer contract");c_0x1040b2e3(0x20f2237d44ffd4b6f7d0f4b352b6b42697019aa0a793f22799b6024e5be616b4); /* requirePost */ 

    }

    /**
     * @dev check if given address has Treejer contract role
     * @param _address input address
     * @return if given address has Treejer contract role
     */
    function isTreejerContract(address _address) public view returns (bool) {c_0x1040b2e3(0x958714ef19eb677eaa4eb291ffd690ea30f7b04cb1d0d416d2978af93b140c57); /* function */ 

c_0x1040b2e3(0xa667b479c72fa86eee2f5f30c0e9554059272ed0426ac19a7fb9fc27fa5ee750); /* line */ 
        c_0x1040b2e3(0x628df16c669e16e1658ccd3921928e66689ccb7653c88f1be8036f559b43343d); /* statement */ 
return hasRole(TREEJER_CONTRACT_ROLE, _address);
    }

    /**
     * @dev check if given address is data manager
     * @param _address input address
     */
    function ifDataManager(address _address) external view {c_0x1040b2e3(0xeb2f558caa9fffdf27fcc6e8897f49f8b03dd7bce888db6d34c685d2360f8a79); /* function */ 

c_0x1040b2e3(0xae84247444d0585633b869697d9099e721a25547537cffd95b6bb0f61383a3b6); /* line */ 
        c_0x1040b2e3(0x91e64e3328f94c3eb942155067d25a56b8a43171eb9217b393fbdde341c69630); /* requirePre */ 
c_0x1040b2e3(0xa76becb85a7e8486372ba37535a3868917a48ca2e097b05f897dd56b627cc486); /* statement */ 
require(isDataManager(_address), "caller is not data manager");c_0x1040b2e3(0x93d96054bd6a26b6be9f2c9a19ef66ff5187ba1f3b6ce018433297cdfa249fff); /* requirePost */ 

    }

    /**
     * @dev check if given address has data manager role
     * @param _address input address
     * @return if given address has data manager role
     */
    function isDataManager(address _address) public view returns (bool) {c_0x1040b2e3(0xc54b3e56d8d3462c2519d987cb01f023439b71a9e2d48f7185cb9ff1cc449ce5); /* function */ 

c_0x1040b2e3(0x67fb175ae40a46c976364b46a410bad7cf2709a490424c4003338ea83ad31379); /* line */ 
        c_0x1040b2e3(0x4a2126e5ebf1130bde941a3913ea928cb8e32804ed1ed8e033719d053c069249); /* statement */ 
return hasRole(DATA_MANAGER_ROLE, _address);
    }

    /**
     * @dev check if given address is buyer rank
     * @param _address input address
     */
    function ifBuyerRank(address _address) external view {c_0x1040b2e3(0x98d6e7e01668b35ee79d53b74da521239e075720a2564e5f28fc74887855c2b0); /* function */ 

c_0x1040b2e3(0xe2b5288153adce0862ff3373b4c7d242fe50c414b819005a40387d14e5a209cd); /* line */ 
        c_0x1040b2e3(0x57e4a2fe0ce1ab86ef4f804ccfc42a74b373b0b94af10ebe2e64ba5ca5413888); /* requirePre */ 
c_0x1040b2e3(0xf28e39b634dcd36d022824d124fcbf458d9d985526ca2707b8bea9db3c8f5c2f); /* statement */ 
require(isBuyerRank(_address), "caller is not buyer rank");c_0x1040b2e3(0xe86c201f280383d3d74ac21cf0aaa7e6943cfacd632927caf80012e13690a8b7); /* requirePost */ 

    }

    /**
     * @dev check if given address has buyer rank role
     * @param _address input address
     * @return if given address has buyer rank role
     */
    function isBuyerRank(address _address) public view returns (bool) {c_0x1040b2e3(0x52a8c20e120be74f05df614209115ba08d3986b8ad5d703962f531354745aba4); /* function */ 

c_0x1040b2e3(0x57eedb24e3734fd0ad9249c3653e1954ca78c1b06286b20c068b51b913f23c29); /* line */ 
        c_0x1040b2e3(0x415e3ded09ebcfc026e74538be01574eeca3aae63b3581f44305d2b615541ef9); /* statement */ 
return hasRole(BUYER_RANK_ROLE, _address);
    }

    /**
     * @dev check if given address is DataManager or Treejer contract
     * @param _address input address
     */
    function ifDataManagerOrTreejerContract(address _address) external view {c_0x1040b2e3(0xb50960c46195e8a556abc9639370dcb4e612d58b841674224145cc9f3a6470b8); /* function */ 

c_0x1040b2e3(0xc8d56cfd8e242a79048b3aff101e0c5bc4892c88c42484ca8cda02635537d500); /* line */ 
        c_0x1040b2e3(0x4a08298456718d41c046ff7f56549e5860b326c57a247c0b3a85083fbd973bdb); /* requirePre */ 
c_0x1040b2e3(0x695dfbf0b6b59ee19877fb8b428c77bcf2e24f1c2712621961fbe1fc80913bb3); /* statement */ 
require(
            isDataManager(_address) || isTreejerContract(_address),
            "not Data Manager or Treejer Contract"
        );c_0x1040b2e3(0xd8c57be192a50e5c9338d6f0e15543195eb42488c8d51436fe4796cbc356fc72); /* requirePost */ 

    }
}
