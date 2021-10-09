// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITree.sol";

/** @title Attribute Contract */
contract Attribute is Initializable {
    using SafeCastUpgradeable for uint256;

    bool public isAttribute;
    IAccessRestriction public accessRestriction;
    ITree public treeToken;

    /** NOTE parameters of randomTreeGeneration*/

    struct SymbolStatus {
        uint128 generatedCount;
        uint128 status; // 0 free, 1 reserved , 2 set, 3 setByAdmin
    }

    uint8 public specialTreeCount;

    /** NOTE mapping from unique attributes id to number of generations */
    mapping(uint64 => uint32) public uniquenessFactorToGeneratedAttributesCount;

    /** NOTE mapping from unique symbol id to number of generations  */
    mapping(uint64 => SymbolStatus) public uniquenessFactorToSymbolStatus;

    event AttributeGenerated(uint256 treeId);
    event AttributeGenerationFailed(uint256 treeId);
    event SymbolReserved(uint64 uniquenessFactor);
    event ReservedSymbolReleased(uint64 uniquenessFactor);

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role */
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has data manager or treejer contract role */
    modifier onlyDataManagerOrTreejerContract() {
        accessRestriction.ifDataManagerOrTreejerContract(msg.sender);
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isAttribute
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isAttribute = true;
        specialTreeCount = 0;
        accessRestriction = candidateContract;
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _address set to the address of TreeToken contract
     */
    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);

        require(candidateContract.isTree());

        treeToken = candidateContract;
    }

    /**
     * @dev reserve a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     */
    function reserveSymbol(uint64 _uniquenessFactor)
        external
        onlyDataManagerOrTreejerContract
    {
        require(
            uniquenessFactorToSymbolStatus[_uniquenessFactor].status == 0,
            "the attributes are taken"
        );
        uniquenessFactorToSymbolStatus[_uniquenessFactor].status = 1;

        emit SymbolReserved(_uniquenessFactor);
    }

    /**
     * @dev free reservation of a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     */

    function releaseReservedSymbolByAdmin(uint64 _uniquenessFactor)
        external
        onlyDataManager
    {
        require(
            uniquenessFactorToSymbolStatus[_uniquenessFactor].status == 1,
            "the attributes not reserved"
        );

        uniquenessFactorToSymbolStatus[_uniquenessFactor].status = 0;

        emit ReservedSymbolReleased(_uniquenessFactor);
    }

    /**
     * @dev free reservation of a unique symbol
     * @param _uniquenessFactor unique symbol to reserve
     */
    //TODO: add test for this function
    function releaseReservedSymbol(uint64 _uniquenessFactor)
        external
        onlyTreejerContract
    {
        if (uniquenessFactorToSymbolStatus[_uniquenessFactor].status == 1) {
            uniquenessFactorToSymbolStatus[_uniquenessFactor].status = 0;
            emit ReservedSymbolReleased(_uniquenessFactor);
        }
    }

    /**
     * @dev admin assigns symbol to specified treeId
     * @param _treeId id of tree
     * @param _attributeUniquenessFactor unique symbol code to assign
     */
    function setAttribute(
        uint256 _treeId,
        uint64 _attributeUniquenessFactor,
        uint64 _symbolUniquenessFactor,
        uint8 _generationType
    ) external onlyDataManagerOrTreejerContract {
        require(
            uniquenessFactorToSymbolStatus[_symbolUniquenessFactor].status < 2,
            "the symbol is taken"
        );
        require(
            uniquenessFactorToGeneratedAttributesCount[
                _attributeUniquenessFactor
            ] == 0,
            "the attributes are taken"
        );
        uniquenessFactorToGeneratedAttributesCount[
            _attributeUniquenessFactor
        ] = 1;
        uniquenessFactorToSymbolStatus[_symbolUniquenessFactor].status = 3;
        uniquenessFactorToSymbolStatus[_symbolUniquenessFactor].generatedCount =
            uniquenessFactorToSymbolStatus[_symbolUniquenessFactor]
                .generatedCount +
            1;
        //
        // uint256 value = _symbolUniquenessFactor + 2 * (2**32) ; //TODO: MIX_WITH_BELOW
        uint256 uniquenessFactor = _attributeUniquenessFactor +
            uint256(_symbolUniquenessFactor + 2 * (2**32)) *
            (2**64);
        treeToken.setAttributes(_treeId, uniquenessFactor, _generationType);

        emit AttributeGenerated(_treeId);
    }

    /**
     * @dev generate a 256 bits random number as a base for attributes and slice it
     * in 28 bits parts
     * @param _treeId id of tree
     * @return if unique attribute generated successfully
     */
    function createSymbol(
        uint256 _treeId,
        bytes32 _randomValue,
        address _funder,
        uint8 _funderRank,
        uint8 _generationType
    ) external ifNotPaused onlyTreejerContract returns (bool) {
        if (!treeToken.attributeExists(_treeId)) {
            //TODO: flag true ==>false
            bool flag = false;
            uint64 tempRandomValue;

            for (uint256 j = 0; j < 10000; j++) {
                uint256 randomValue = uint256(
                    keccak256(
                        abi.encodePacked(
                            _funder,
                            _randomValue,
                            _generationType,
                            msg.sig,
                            _treeId,
                            j
                        )
                    )
                );

                for (uint256 i = 0; i < 4; i++) {
                    tempRandomValue = uint64(randomValue & type(uint64).max);

                    flag = _generateUniquenessFactor(
                        _treeId,
                        tempRandomValue,
                        _funderRank,
                        _generationType
                    );
                    if (flag) {
                        break;
                    }
                    randomValue = randomValue / (uint256(2)**64);
                }
                if (flag) {
                    break;
                }
            }
            if (flag) {
                emit AttributeGenerated(_treeId);
            } else {
                emit AttributeGenerationFailed(_treeId);
            }

            return flag;
        } else {
            return true;
        }
    }

    function createAttribute(uint256 _treeId)
        external
        ifNotPaused
        onlyTreejerContract
        returns (bool)
    {
        if (!treeToken.attributeExists(_treeId)) {
            (
                bool flag,
                uint64 uniquenessFactor //TODO:NAMING uniquenessFactor
            ) = _generateAttributeUniquenessFactor(_treeId);

            if (flag) {
                treeToken.setAttributes(_treeId, uniquenessFactor, 1);
                uniquenessFactorToGeneratedAttributesCount[
                    uniquenessFactor
                ] = 1;

                emit AttributeGenerated(_treeId);
            } else {
                emit AttributeGenerationFailed(_treeId);
            }

            return flag;
        } else {
            return true;
        }
    }

    function manageAttributeUniquenessFactor(
        uint256 _treeId,
        uint64 _uniquenessFactor
    ) external onlyTreejerContract returns (uint64) {
        if (
            uniquenessFactorToGeneratedAttributesCount[_uniquenessFactor] == 0
        ) {
            return _uniquenessFactor;
        } else {
            uniquenessFactorToGeneratedAttributesCount[_uniquenessFactor] =
                uniquenessFactorToGeneratedAttributesCount[_uniquenessFactor] +
                1;

            (
                bool flag,
                uint64 uniquenessFactor //TODO:NAMING uniquenessFactor
            ) = _generateAttributeUniquenessFactor(_treeId);

            require(flag, "unique attribute not fund");

            return uniquenessFactor;
        }
    }

    /**
     * @dev the function Tries to Calculate the rank of buyer based on transaction statistics of
     * his/her wallet
     * @param _funder address of funder
     */
    function getFunderRank(address _funder) external view returns (uint8) {
        uint256 ownedTrees = treeToken.balanceOf(_funder);

        if (ownedTrees > 10000) {
            return 3;
        } else if (ownedTrees > 1000) {
            return 2;
        } else if (ownedTrees > 100) {
            return 1;
        }

        return 0;
    }

    function _generateAttributeUniquenessFactor(uint256 _treeId)
        private
        returns (bool, uint64)
    {
        uint64 uniquenessFactor; //TODO:NAMING uniquenessFactor

        for (uint256 j = 0; j < 10000; j++) {
            uint256 randomValue = uint256(
                keccak256(abi.encodePacked(msg.sig, _treeId, j))
            );

            for (uint256 i = 0; i < 4; i++) {
                uniquenessFactor = uint64(randomValue & type(uint64).max);

                if (
                    uniquenessFactorToGeneratedAttributesCount[
                        uniquenessFactor
                    ] == 0
                ) {
                    return (true, uniquenessFactor);
                } else {
                    uniquenessFactorToGeneratedAttributesCount[
                        uniquenessFactor
                    ] =
                        uniquenessFactorToGeneratedAttributesCount[
                            uniquenessFactor
                        ] +
                        1;
                    randomValue = randomValue / (uint256(2)**64);
                }
            }
        }
        return (false, 0);
    }

    /**
     * @dev calculates the random attributes from random number
     * @param _treeId id of tree
     * @param _randomValue a 28 bits random attribute generator number
     * @return if generated random attribute is unique
     */
    function _generateUniquenessFactor(
        uint256 _treeId,
        uint64 _randomValue,
        uint8 _funderRank,
        uint8 _generationType
    ) private returns (bool) {
        if (uniquenessFactorToGeneratedAttributesCount[_randomValue] == 0) {
            uint8[] memory attributes = new uint8[](8); //TODO:NAMING attributes

            uint64 tempRandomValue = _randomValue;
            for (uint256 j = 0; j < 8; j++) {
                attributes[j] = uint8(tempRandomValue & 255);
                tempRandomValue = tempRandomValue / 256;
            }

            uint8 shape = _calcShape(
                uint16(_randomValue & ((2**13) - 1)),
                _funderRank
            );

            uint8 trunkColor;
            uint8 crownColor;

            if (shape < 128) {
                (trunkColor, crownColor) = _calcColors(
                    attributes[2],
                    attributes[3],
                    _funderRank
                );
            } else {
                (trunkColor, crownColor) = _setSpecialTreeColors(shape);
            }

            uint8 effect = _calcEffects(attributes[4], _funderRank);

            uint64 symbolUniquenessFactor = shape +
                (2**8) * //2**8
                trunkColor +
                (2**16) * //2**16
                crownColor +
                (2**24) * //2**24
                effect;

            if (
                uniquenessFactorToSymbolStatus[symbolUniquenessFactor].status >
                0
            ) {
                uniquenessFactorToSymbolStatus[symbolUniquenessFactor]
                    .generatedCount =
                    uniquenessFactorToSymbolStatus[symbolUniquenessFactor]
                        .generatedCount +
                    1;
                return false;
            }
            uint8 coefficient = _calcCoefficient(attributes[5], _funderRank);

            uint256 uniquenessFactor = uint256(_randomValue) +
                uint256(
                    uint256(symbolUniquenessFactor + (2**32) * coefficient) *
                        (2**64)
                );

            uniquenessFactorToSymbolStatus[symbolUniquenessFactor].status = 2;
            uniquenessFactorToSymbolStatus[symbolUniquenessFactor]
                .generatedCount = 1;
            uniquenessFactorToGeneratedAttributesCount[_randomValue] = 1;
            treeToken.setAttributes(_treeId, uniquenessFactor, _generationType);

            return true;
        } else {
            uniquenessFactorToGeneratedAttributesCount[_randomValue] =
                uniquenessFactorToGeneratedAttributesCount[_randomValue] +
                1;
            return false;
        }
    }

    function _calcShape(uint16 _randomValue, uint8 _funderRank)
        private
        returns (uint8)
    {
        uint16[9] memory probRank0 = [
            128,
            256,
            320,
            384,
            432,
            480,
            496,
            511,
            512
        ]; //TODO:NAMING probRank0
        uint16[9] memory probRank1 = [
            110,
            200,
            290,
            360,
            420,
            470,
            490,
            511,
            512
        ]; //TODO:NAMING probRank1
        uint16[9] memory probRank2 = [
            90,
            190,
            280,
            350,
            410,
            450,
            480,
            510,
            512
        ]; //TODO:NAMING probRank2
        uint16[9] memory probRank3 = [
            64,
            176,
            272,
            340,
            400,
            460,
            496,
            508,
            512
        ]; //TODO:NAMING probRank3
        uint16[9] memory selectedRankProb; //TODO:NAMING selectedRankProb

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        uint8 shape;

        uint8 randomValueFirstFourBit = uint8(_randomValue & 15); //TODO:NAMING _randomValueFirstFourBit

        uint16 probability = _randomValue / 16; //TODO:NAMING probability

        uint8 result = 0; //TODO:NAMING result

        for (uint8 j = 0; j < 9; j++) {
            if (probability < selectedRankProb[j]) {
                result = j;
                break;
            }
        }

        if (result == 8) {
            if (specialTreeCount < 16) {
                shape = 128 + specialTreeCount;
                specialTreeCount = specialTreeCount + 1;
            } else {
                shape = 112 + randomValueFirstFourBit;
            }
        } else {
            shape = result * 16 + randomValueFirstFourBit;
        }

        return shape;
    }

    function _calcColors(
        uint8 _randomValue1, //TODO:NAMING _randomValue1
        uint8 _randomValue2, //TODO:NAMING _randomValue2
        uint8 _funderRank
    ) private pure returns (uint8, uint8) {
        uint8[8] memory probRank0 = [6, 12, 18, 22, 26, 29, 31, 32];
        uint8[8] memory probRank1 = [5, 10, 15, 20, 24, 28, 31, 32];
        uint8[8] memory probRank2 = [5, 10, 15, 19, 23, 27, 30, 32];
        uint8[8] memory probRank3 = [4, 8, 12, 16, 20, 24, 28, 32];
        uint8[8] memory selectedRankProb;

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        uint8 probability1 = _randomValue1 & 31; //TODO:NAMING probability1
        uint8 randomValue1Last3Bit = _randomValue1 / 32; //change to  _a / 32 //TODO:NAMING _randomValue1Last3Bit
        uint8 probability2 = _randomValue2 & 31; //TODO:NAMING probability2
        uint8 randomValue2Last3Bit = _randomValue2 / 32; // change to _b / 32//TODO:NAMING _randomValue2Last3Bit
        uint8 result1 = 0; //TODO:NAMING result1
        uint8 result2 = 0; //TODO:NAMING result2

        for (uint8 i = 0; i < 8; i++) {
            if (probability1 < selectedRankProb[i]) {
                result1 = i;
                break;
            }
        }

        for (uint8 j = 0; j < 8; j++) {
            if (probability2 < selectedRankProb[j]) {
                result2 = j;
                break;
            }
        }

        return (
            result1 * 8 + randomValue1Last3Bit,
            result2 * 8 + randomValue2Last3Bit
        );
    }

    function _setSpecialTreeColors(uint8 _shape)
        private
        pure
        returns (uint8, uint8)
    {
        uint8[16] memory trunks = [
            6,
            12,
            18,
            22,
            26,
            29,
            31,
            32,
            6,
            12,
            18,
            22,
            26,
            29,
            31,
            32
        ];
        uint8[16] memory crowns = [
            5,
            10,
            15,
            20,
            24,
            28,
            31,
            32,
            6,
            12,
            18,
            22,
            26,
            29,
            31,
            32
        ];
        return (trunks[_shape - 128], crowns[_shape - 128]);
    }

    function _calcEffects(uint8 _randomValue, uint8 _funderRank)
        private
        pure
        returns (uint8)
    {
        uint8[16] memory probRank0 = [
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
            252,
            253,
            254,
            255
        ];
        uint8[16] memory probRank1 = [
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
            255
        ];
        uint8[16] memory probRank2 = [
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
            255
        ];
        uint8[16] memory probRank3 = [
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
            255
        ];

        uint8[16] memory selectedRankProb;

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        for (uint8 j = 0; j < 16; j++) {
            if (_randomValue <= selectedRankProb[j]) {
                return j;
            }
        }

        return 0;
    }

    function _calcCoefficient(uint8 _randomValue, uint8 _funderRank)
        private
        pure
        returns (uint8)
    {
        uint8[8] memory probRank0 = [190, 225, 235, 244, 250, 253, 254, 255];
        uint8[8] memory probRank1 = [175, 205, 225, 240, 248, 252, 254, 255];
        uint8[8] memory probRank2 = [170, 200, 218, 232, 245, 250, 253, 255];
        uint8[8] memory probRank3 = [128, 192, 210, 227, 240, 249, 252, 255];

        uint8[8] memory selectedRankProb;

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        for (uint8 j = 0; j < 8; j++) {
            if (_randomValue <= selectedRankProb[j]) {
                return j;
            }
        }

        return 0;
    }
}
