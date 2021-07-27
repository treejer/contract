// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";

contract TreeAttribute is Initializable {
    using SafeCastUpgradeable for uint256;
    bool public isTreeAttribute;
    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    //parameters of randomTreeGeneration
    struct Attributes {
        uint32 treeType;
        uint32 groundType;
        uint32 trunkColor;
        uint32 crownColor;
        uint32 groundColor;
        uint32 specialEffects;
        uint32 universalCode;
        uint32 exists;
    }

    //maping from buyer address to his/her rank
    mapping(address => uint8) public rankOf;
    // mapping from treeId to tree attributes
    mapping(uint256 => Attributes) public treeAttributes;
    // mapping from unique attributes id to number of generations
    mapping(uint32 => uint32) public generatedAttributes;
    mapping(uint32 => uint8) public reservedAttributes;

    event BuyerRankSet(address buyer, uint8 rank);
    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    function initialize(address _accessRestrictionAddress) public initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isTreeAttribute = true;
        accessRestriction = candidateContract;
    }

    function reserveTreeAttributes(uint32 generatedCode) external onlyAdmin {
        require(
            generatedAttributes[generatedCode] == 0,
            "the tree attributes are taken"
        );
        generatedAttributes[generatedCode] = 1;
        reservedAttributes[generatedCode] = 1;
    }

    function setTreeAttributesByAdmin(uint256 treeId, uint32 generatedCode)
        external
        onlyAdmin
    {
        require(
            generatedAttributes[generatedCode] == 0 ||
                reservedAttributes[generatedCode] == 1,
            "the tree attributes are taken"
        );
        require(
            treeAttributes[treeId].universalCode == 0,
            "tree attributes are set before"
        );
        generatedAttributes[generatedCode] = 1;
        reservedAttributes[generatedCode] = 0;
        uint8[6] memory bitCounts = [6, 3, 4, 4, 3, 4];
        uint32[] memory results = new uint32[](6);

        uint32 tempGeneratedCode = generatedCode;

        for (uint32 i = 0; i < bitCounts.length; i++) {
            results[i] = getFirstN32(tempGeneratedCode, bitCounts[i]);

            tempGeneratedCode = tempGeneratedCode / uint32(2)**bitCounts[i];
        }
        treeAttributes[treeId] = Attributes(
            results[0],
            results[1],
            results[2],
            results[3],
            results[4],
            results[5],
            generatedCode,
            1
        );
    }

    function calcRandAttributes(
        address buyer,
        uint256 treeId,
        uint32 rand
    ) private returns (bool) {
        uint8[6] memory bitCounts = [6, 3, 4, 4, 3, 8];
        uint32[] memory results = new uint32[](6);
        for (uint32 i = 0; i < bitCounts.length; i++) {
            results[i] = getFirstN32(rand, bitCounts[i]);
            rand = rand / (uint32(2)**bitCounts[i]);
        }
        if (treeId > 100) {
            results[5] = getSpecialEffect(buyer, 0, results[5]);
        } else if (treeId > 50) {
            results[5] = getSpecialEffect(buyer, 2, results[5]);
        } else {
            results[5] = getSpecialEffect(buyer, 3, results[5]);
        }

        //check Uniqueness
        uint32 generatedCode = results[0] +
            results[1] *
            64 +
            results[2] *
            512 +
            results[3] *
            8192 +
            results[4] *
            131072 +
            results[5] *
            1048576;
        if (generatedAttributes[generatedCode] == 0) {
            generatedAttributes[generatedCode] = 1;
            treeAttributes[treeId] = Attributes(
                results[0],
                results[1],
                results[2],
                results[3],
                results[4],
                results[5],
                generatedCode,
                1
            );
            rankOf[buyer] = 0;
            return true;
        }
        generatedAttributes[generatedCode] += 1;
        return false;
    }

    //the function creates
    function createTreeAttributes(uint256 treeId, uint256 paidAmount)
        external
        returns (bool)
    {
        require(
            treeAttributes[treeId].exists == 0,
            "tree attributes are set before"
        );

        require(
            treeFactory.checkMintStatus(treeId, msg.sender),
            "no need to tree attributes"
        );

        bool flag = true;
        for (uint256 j = 0; j < 10000; j++) {
            uint256 rand = uint256(
                keccak256(
                    abi.encodePacked(
                        msg.sender,
                        keccak256(
                            abi.encodePacked(block.number, msg.sig, paidAmount)
                        ),
                        treeId,
                        j
                    )
                )
            );
            for (uint256 i = 0; i < 9; i++) {
                flag = calcRandAttributes(
                    msg.sender,
                    treeId,
                    getFirstN(rand, 28)
                );
                if (flag) {
                    break;
                }
                rand = rand / (uint256(2)**28);
            }
            if (flag) {
                break;
            }
        }
        if (flag) {
            emit TreeAttributesGenerated(treeId);
        } else {
            emit TreeAttributesNotGenerated(treeId);
        }

        return flag;
    }

    //to get n lowest bits of a uint256
    function getFirstN(uint256 rnd, uint16 n) private pure returns (uint32) {
        uint256 x = rnd & ((uint256(2)**n) - 1);

        return x.toUint32();
    }

    //to get n lowest bits of a uint32
    function getFirstN32(uint32 rnd, uint8 n) private pure returns (uint32) {
        uint32 firN = (uint32(2)**n) - 1;
        return rnd & firN;
    }

    // the function Tries to Calculate the rank of buyer based on transaction statistics of his/her wallet
    function setBuyerRank(
        address buyer,
        uint256 treejerSpent,
        uint256 walletSpent,
        uint64 treesOwned,
        uint64 walletSpentCount
    ) external onlyAdmin {
        uint256 points;
        //each 0.004 ether spent in treejer has 10 points
        points += (treejerSpent / (4 * 1 wei)) * 10;
        //each 1 ether spent of wallet(sent or withdraw) has 2 points
        points += (walletSpent / (1 * 1 ether)) * 2;
        // each 1 send or withdraw of wallet has 1 point
        points += walletSpentCount;
        //each tree owned by buyer has 10 points
        points += treesOwned * 10;
        //points under 31 is rank of zero

        if (points > 30 && points < 61) {
            rankOf[buyer] = 1; //points under 61  is rank 1
        } else if (points < 201) {
            rankOf[buyer] = 2; //points under 201 is rank 2
        } else if (points < 1001) {
            rankOf[buyer] = 3; //points under 1001 is rank 3
        } else {
            rankOf[buyer] = 4; //points above 1000 is rank 4 or VIP
        }
    }

    // The function manipulates probability of rare special effects based on rank of buyer
    function getSpecialEffect(
        address buyer,
        uint8 bonusRank,
        uint32 n
    ) private view returns (uint32) {
        uint16[16] memory specialEffectsRank0 = [
            50,
            100,
            150,
            200,
            210,
            220,
            230,
            235,
            240,
            245,
            248,
            251,
            253,
            254,
            255,
            256
        ];
        uint16[16] memory specialEffectsRank1 = [
            42,
            84,
            126,
            168,
            181,
            194,
            207,
            216,
            225,
            234,
            240,
            246,
            250,
            252,
            254,
            256
        ];
        uint16[16] memory specialEffectsRank2 = [
            40,
            80,
            120,
            160,
            173,
            186,
            199,
            208,
            217,
            226,
            233,
            240,
            244,
            248,
            252,
            256
        ];
        uint16[16] memory specialEffectsRank3 = [
            32,
            64,
            95,
            126,
            141,
            156,
            171,
            183,
            195,
            207,
            217,
            227,
            235,
            242,
            249,
            256
        ];
        uint16[16] memory specialEffectsVIP = [
            25,
            50,
            75,
            100,
            115,
            130,
            145,
            156,
            167,
            178,
            188,
            198,
            214,
            228,
            242,
            256
        ];
        uint16[16] memory suitedEffectStatistics;
        uint8 rank = rankOf[buyer] + bonusRank; //bonus rank for special trees at auction
        if (rank == 0) {
            suitedEffectStatistics = specialEffectsRank0;
        } else if (rank == 1) {
            suitedEffectStatistics = specialEffectsRank1;
        } else if (rank == 2) {
            suitedEffectStatistics = specialEffectsRank2;
        } else if (rank == 3) {
            suitedEffectStatistics = specialEffectsRank3;
        } else {
            suitedEffectStatistics = specialEffectsVIP;
        }
        for (uint32 i = 0; i < suitedEffectStatistics.length; i++) {
            if (n < suitedEffectStatistics[i]) {
                return i;
            }
        }
        return 0;
    }
}
