// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.6;
function c_0x9059aa55(bytes32 c__0x9059aa55) pure {}

pragma abicoder v2;

import "./../external/gsn/forwarder/IForwarder.sol";
import "./../external/gsn/BasePaymaster.sol";

import "../access/IAccessRestriction.sol";

contract WhitelistPaymaster is BasePaymaster {
function c_0xd7468039(bytes32 c__0xd7468039) public pure {}

    mapping(address => bool) public funderTargetWhitelist;
    mapping(address => bool) public planterTargetWhitelist;

    //related contracts
    IAccessRestriction public accessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {c_0xd7468039(0x3e2cd78cc2aaf4e149db0b50d8480a9e8334574623c6f070898d907dd25c8498); /* function */ 

c_0xd7468039(0x0aaa0542a3be658cf51368cb1bbfc12e484cd19990cbe1139630c75bf4bb78b6); /* line */ 
        c_0xd7468039(0x78e1f579db513644211dbafe9836968a80d6d8663c36551ecb91d7ce13072a31); /* statement */ 
accessRestriction.ifAdmin(msg.sender);
c_0xd7468039(0x8b49ca584b2e39bad1dd51e4e10078b14089a5b446314ea2532b55bdaabfcca6); /* line */ 
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {c_0xd7468039(0x43b6bea470474f45e26094e9f90f858c1d9232a02ae849dbd37ebe2731da4b06); /* function */ 

c_0xd7468039(0xdddc016e9e71746ce8303c0a14703980afc29bc9555afe8440585bf7dbac8774); /* line */ 
        c_0xd7468039(0xc48a42f9ea7128810ba7f94601ab774441565688111ddf4de3514ae16564fcc8); /* requirePre */ 
c_0xd7468039(0x641532974d2cb2cc476fc8ad34f16b26574d6ced8e6b165d58350b5408dacbc4); /* statement */ 
require(_address != address(0), "invalid address");c_0xd7468039(0xc55878017a8ccc5b3da7bd37b75edfd0a848af025e4172efac98236796644be8); /* requirePost */ 

c_0xd7468039(0xaad3bdc755dce251309d24e6d0f9d85c9a1fce0c55a87be45c5b0dc6fac929d2); /* line */ 
        _;
    }

    constructor(address _accessRestrictionAddress) {c_0xd7468039(0xd8663dbc0f7989ad62b7f44e473609fde43fc99528d3109d82e1a2b353434bd5); /* function */ 

c_0xd7468039(0x2193b01793eab5df2a3beb37a7760e3bb8af7d281e9ae6338207aa0191a3da70); /* line */ 
        c_0xd7468039(0xc880c22c94e7d4aa127179bc68a3d9aa75cfa81c8cb7e02c760ced14d83f35ff); /* statement */ 
IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
c_0xd7468039(0x0b02ca029ec126631e9bb786a4568fd6e9cf488ac15497d8786beaadf9a15c14); /* line */ 
        c_0xd7468039(0x42bb2a32d78c5ee124b1aad06e9291ca87515720c2ae317d4f46aed547616654); /* requirePre */ 
c_0xd7468039(0x1220d4c8d49e6f739e51dd7bcb19c224ffc5e9876642ff2141b21ed50e8c443a); /* statement */ 
require(candidateContract.isAccessRestriction());c_0xd7468039(0xb6a037dc239cbf161f1e73c596bc25525c3cdf63b53a51ccb85211c37cb81fb9); /* requirePost */ 

c_0xd7468039(0xe7086e261d740f19a7a6da97ef4641d9ab473ceaf8477fa7175e0cb651996df8); /* line */ 
        c_0xd7468039(0x517d75a092d64c67c052fc6580e674287c48ae5908c834716ca7d22618112f41); /* statement */ 
accessRestriction = candidateContract;
    }

    function addPlanterWhitelistTarget(address _target)
        external
        onlyAdmin
        validAddress(_target)
    {c_0xd7468039(0x9bc62fe64b6b487560e121da42911091dbaa82398e040be75b701e29ec681a6a); /* function */ 

c_0xd7468039(0xb1883a88628baa8cd3dcc11a6b08ac3f923bc071a638797543a88901165bc9d2); /* line */ 
        c_0xd7468039(0xde1e8bfe1889d6cc6f1d8a6a5a6bad02d9fa2d601a1f9fd2d2aecd088bf95fcf); /* statement */ 
planterTargetWhitelist[_target] = true;
    }

    function removePlanterWhitelistTarget(address _target) external onlyAdmin {c_0xd7468039(0x01b80dbeece401aed3d787b96c463b931d763e7359e0dc44b7a5d5146614e707); /* function */ 

c_0xd7468039(0xcded970474fe9ad90490ff7b38271c1b7099eb82d82e5ffc825430b3a764b3ef); /* line */ 
        c_0xd7468039(0xe7857bd656d96dd04a02f39ae431853d212fdef4c1e4f64fddd0d3b361576178); /* requirePre */ 
c_0xd7468039(0x36e3290e31eddd0160e748d9a8918c3b377e5eba670ac1ad71bc89a615abbd2b); /* statement */ 
require(
            planterTargetWhitelist[_target],
            "Target not exists in white list"
        );c_0xd7468039(0x7dc79e1043ee0e5ed7033791ce077f8783fd4c7abe9071abfa33c728396a7644); /* requirePost */ 


c_0xd7468039(0x379b3ea7e7632456c4c73798c3d3bf5b0be6b150deff2cfada3fe0b8bf704e56); /* line */ 
        c_0xd7468039(0x3a9d9273b696ff988e63c54f6f019e0859c2d6e11e619e40e0f7a19febd9c14c); /* statement */ 
planterTargetWhitelist[_target] = false;
    }

    function addFunderWhitelistTarget(address _target)
        external
        onlyAdmin
        validAddress(_target)
    {c_0xd7468039(0xffe5cff1f5f6cabf82f6d92ea48b46f73ec52f49d2a4e3a6be60fe59b58cab24); /* function */ 

c_0xd7468039(0x7a5c61512f49e53cee20354d2865a2d226db14cb768a81ae32b925016933bd74); /* line */ 
        c_0xd7468039(0x6b9813435b5c82648e9d64f1ba0cbc6ea64ff3515292e29b62fe9abd91ca94b9); /* statement */ 
funderTargetWhitelist[_target] = true;
    }

    function removeFunderWhitelistTarget(address _target) external onlyAdmin {c_0xd7468039(0x5c513ee31e58ecd5692eb00365f8d581c1eb536063b767c039ffb28fdfb07a96); /* function */ 

c_0xd7468039(0xf1c490302ff6a063f343426e5a5028456f9811fcfe3d96e12c1308d2025c83ec); /* line */ 
        c_0xd7468039(0x431f95d758fd1023dbbd6a645c8e5463340fef30c6bd3f668d4d775c4fd9ba54); /* requirePre */ 
c_0xd7468039(0x0cf670de6b09e84992c91e8ef7bebdddf957cf71cc7caf170e798b35c3356f33); /* statement */ 
require(
            funderTargetWhitelist[_target],
            "Target not exists in white list"
        );c_0xd7468039(0x592ff6ab2b7048067d20267c0099a225e20afa8441d758fa464be848c50c74c5); /* requirePost */ 


c_0xd7468039(0xc5abde6cf715795b8982b70578779ebed533df00ad7a7d8405b193290ad93fa6); /* line */ 
        c_0xd7468039(0xe15839e31ada7ce34451c2541c93b290907cf8afb6a28f83b29085c8ab4c7235); /* statement */ 
funderTargetWhitelist[_target] = false;
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
        external
        virtual
        override
        returns (bytes memory context, bool revertOnRecipientRevert)
    {c_0xd7468039(0x4c5d4bca8eeee6b9f13e022934418c2974a33126ad71089e3db91eb8211b9d1c); /* function */ 

c_0xd7468039(0x800faedecb3d0cd2f38e3894f798a388b890703bbd26f26141ce49fb909dbf0b); /* line */ 
        (relayRequest, signature, approvalData, maxPossibleGas);

c_0xd7468039(0x42a4374e115a3309bcdb622f6ce2e840ec97b230ea4361ac83a0d09d046390d8); /* line */ 
        c_0xd7468039(0x8727668aabce97ae68cd5e6d5894b1c3abdfed24492f462a069f0c77db71e712); /* statement */ 
_verifyForwarder(relayRequest);

c_0xd7468039(0xc5f9231cb76f894f47759c938c42e76fabb3c3017ec0a3b8fee515219bcf2f15); /* line */ 
        (relayRequest, signature, approvalData, maxPossibleGas);

c_0xd7468039(0x34bbd92abc227869e71c9c9140bff616ae5be4eda62f97ddae73146f893c0447); /* line */ 
        c_0xd7468039(0x5f6dd0317d43ad66b637e89f262a697e7da94fd53a36058bc9e4b28738722c51); /* statement */ 
if (planterTargetWhitelist[relayRequest.request.to]) {c_0xd7468039(0xeb40efe0c4204d6dcad19423fdbfc477532c951516f04cbb94f2495864e851bb); /* branch */ 

c_0xd7468039(0x4c74939c1495a172a71f58b63616d5ad8d9c80ca33b3fcb2472789f4e4edf9ab); /* line */ 
            c_0xd7468039(0xbcb74717f4a727d1a2767c171933875d28d5c4d38c82d0049594a786d407938f); /* statement */ 
accessRestriction.ifPlanter(relayRequest.request.from);

c_0xd7468039(0x09c70c003de7f526f4080367b1caceb0525420ef694a52f88091f7ceaa4d21f1); /* line */ 
            c_0xd7468039(0x4c6570db8b83b3c0983b365c1ed8c97855910c908b8a6a7d077347ea4b0635ba); /* statement */ 
return ("", false);
        }else { c_0xd7468039(0x013923a5fd8f827cffc6e5999e0fc38a9ea928aed6f8757f02c5dfddff94ef28); /* branch */ 
}

c_0xd7468039(0x92104a675de92a9135e411382fca8fa2d7568d9ba0908c8d1169b6abd787e775); /* line */ 
        c_0xd7468039(0xad4be4f7f9c23e414cc4b153d94ac43ad9c824193efe20eebc8e45df0bd087bb); /* requirePre */ 
c_0xd7468039(0x716a99fd329031b9708fc3c3f05ef03dc238aa30ba3bcfca66e3ed63efe6da4a); /* statement */ 
require(
            funderTargetWhitelist[relayRequest.request.to],
            "Target not exists in white list"
        );c_0xd7468039(0x8797ecb6621f5862ddadc919d429b0577414fdab09967e595adb828ff0f4c192); /* requirePost */ 


c_0xd7468039(0xa544d4bc778fd0a89d76f0933442929dcdb2d0ce250d728cce9adfb202874069); /* line */ 
        c_0xd7468039(0x797f71778464480e1269133e4d69137a9260ad9a728504247b4ee38a7d7a0ae2); /* statement */ 
return ("", false);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {c_0xd7468039(0xaa1766bd8e9498b85c110a33e4ee2384e3e9a66796596a87d84c43c440d5d268); /* function */ 

c_0xd7468039(0x90ee1778970289ac77f07fc2c561f4334d9c95baee8066e21366aa61b6629436); /* line */ 
        (context, success, gasUseWithoutPost, relayData);
    }

    function versionPaymaster()
        external
        view
        virtual
        override
        returns (string memory)
    {c_0xd7468039(0x2b0e44911b3d03074a74e62df6db8c08fd2182a80c06057d34e9e1be1f5bc3d1); /* function */ 

c_0xd7468039(0xcc6d9897a4fbd5b9f9338ac73cdc0c00798e98e6c63cf5b349a7d6ea70729eee); /* line */ 
        c_0xd7468039(0xb8d86e34f8a5b9167908a2dc3fc65a589c9d53c34de0c54337c7c7b6ea802cec); /* statement */ 
return "2.2.0+treejer.whitelist.ipaymaster";
    }
}
