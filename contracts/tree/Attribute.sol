// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITree.sol";
import "./IAttribute.sol";

/** @title Attribute Contract */
contract Attribute is Initializable, IAttribute {
    using SafeCastUpgradeable for uint256;

    struct SymbolStatus {
        uint128 generatedCount;
        uint128 status; // 0 free, 1 reserved , 2 set, 3 setByAdmin
    }

    /** NOTE {isAttribute} set inside the initialize to {true} */
    bool public override isAttribute;

    /** NOTE total number of special tree created */
    uint8 public override specialTreeCount;

    IAccessRestriction public accessRestriction;
    ITree public treeToken;

    /** NOTE mapping from generated attributes to count of generations */
    mapping(uint64 => uint32)
        public
        override uniquenessFactorToGeneratedAttributesCount;

    /** NOTE mapping from unique symbol id to SymbolStatus struct */
    mapping(uint64 => SymbolStatus)
        public
        override uniquenessFactorToSymbolStatus;

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
     * @dev initialize AccessRestriction contract and set true for isAttribute and
     * specialTreeCount to 0
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress)
        external
        override
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
    function setTreeTokenAddress(address _address) external override onlyAdmin {
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
        override
        ifNotPaused
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
     * @dev release reservation of a unique symbol by admin
     * @param _uniquenessFactor unique symbol to release reservation
     */
    function releaseReservedSymbolByAdmin(uint64 _uniquenessFactor)
        external
        override
        ifNotPaused
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
     * @dev release reservation of a unique symbol
     * @param _uniquenessFactor unique symbol to release reservation
     */
    function releaseReservedSymbol(uint64 _uniquenessFactor)
        external
        override
        onlyTreejerContract
    {
        if (uniquenessFactorToSymbolStatus[_uniquenessFactor].status == 1) {
            uniquenessFactorToSymbolStatus[_uniquenessFactor].status = 0;
            emit ReservedSymbolReleased(_uniquenessFactor);
        }
    }

    /**
     * @dev admin assigns symbol and attribute to the specified treeId
     * @param _treeId id of tree
     * @param _attributeUniquenessFactor unique attribute code to assign
     * @param _symbolUniquenessFactor unique symbol to assign
     * @param _generationType type of attribute assignement
     * @param _coefficient coefficient value
     */
    function setAttribute(
        uint256 _treeId,
        uint64 _attributeUniquenessFactor,
        uint64 _symbolUniquenessFactor,
        uint8 _generationType,
        uint64 _coefficient
    ) external override ifNotPaused onlyDataManagerOrTreejerContract {
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
        uniquenessFactorToSymbolStatus[_symbolUniquenessFactor]
            .generatedCount += 1;

        uint256 uniquenessFactor = _attributeUniquenessFactor +
            ((uint256(_symbolUniquenessFactor) + (_coefficient << 32)) << 64);

        treeToken.setAttributes(_treeId, uniquenessFactor, _generationType);

        emit AttributeGenerated(_treeId);
    }

    /**
     * @dev generate a random unique symbol using tree attributes 64 bit value
     * @param _treeId id of tree
     * @param _randomValue base random value
     * @param _funder address of funder
     * @param _funderRank rank of funder based on trees owned in treejer
     * @param _generationType type of attribute assignement
     * @return if unique symbol generated successfully
     */
    function createSymbol(
        uint256 _treeId,
        bytes32 _randomValue,
        address _funder,
        uint8 _funderRank,
        uint8 _generationType
    ) external override onlyTreejerContract returns (bool) {
        if (!treeToken.attributeExists(_treeId)) {
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

                    randomValue >>= 64;
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

    /**
     * @dev generate a random unique attribute using tree attributes 64 bit value
     * @param _treeId id of tree
     * @return if unique attribute generated successfully
     */
    function createAttribute(uint256 _treeId)
        external
        override
        onlyTreejerContract
        returns (bool)
    {
        if (!treeToken.attributeExists(_treeId)) {
            (
                bool flag,
                uint64 uniquenessFactor
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

    /**
     * @dev check and generate random attributes for honorary trees
     * @param _treeId id of tree
     * @param _uniquenessFactor random to check existance
     * @return a unique random value
     */
    function manageAttributeUniquenessFactor(
        uint256 _treeId,
        uint64 _uniquenessFactor
    ) external override onlyTreejerContract returns (uint64) {
        if (
            uniquenessFactorToGeneratedAttributesCount[_uniquenessFactor] == 0
        ) {
            return _uniquenessFactor;
        } else {
            uniquenessFactorToGeneratedAttributesCount[_uniquenessFactor] += 1;

            (
                bool flag,
                uint64 uniquenessFactor
            ) = _generateAttributeUniquenessFactor(_treeId);

            require(flag, "unique attribute not fund");

            return uniquenessFactor;
        }
    }

    /**
     * @dev the function tries to calculate the rank of funder based trees owned in Treejer
     * @param _funder address of funder
     */
    function getFunderRank(address _funder)
        external
        view
        override
        returns (uint8)
    {
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

    /**
     * @dev create a unique 64 bit random number
     * @param _treeId id of tree
     * @return true when uniquenessFactor is unique and false otherwise
     * @return uniquenessFactor
     */
    function _generateAttributeUniquenessFactor(uint256 _treeId)
        private
        returns (bool, uint64)
    {
        uint64 uniquenessFactor;

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
                    ] += 1;

                    randomValue >>= 64;
                }
            }
        }
        return (false, 0);
    }

    /**
     * @dev calculates the random symbol parameters
     * @param _treeId id of tree
     * @param _randomValue base random value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @param _generationType type of attribute assignement
     * @return if generated random symbol is unique
     */
    function _generateUniquenessFactor(
        uint256 _treeId,
        uint64 _randomValue,
        uint8 _funderRank,
        uint8 _generationType
    ) private returns (bool) {
        if (uniquenessFactorToGeneratedAttributesCount[_randomValue] == 0) {
            uint8[] memory attributes = new uint8[](8);

            uint64 tempRandomValue = _randomValue;
            for (uint256 j = 0; j < 8; j++) {
                attributes[j] = uint8(tempRandomValue & 255);

                tempRandomValue >>= 8;
            }

            uint8 shape = _calcShape(uint16(_randomValue & 8191), _funderRank); //8191 = 2^13-1

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
                (uint64(trunkColor) << 8) +
                (uint64(crownColor) << 16) +
                (uint64(effect) << 24);

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

            uint256 uniquenessFactor = _randomValue +
                ((symbolUniquenessFactor + (uint256(coefficient) << 32)) << 64);

            uniquenessFactorToSymbolStatus[symbolUniquenessFactor].status = 2;
            uniquenessFactorToSymbolStatus[symbolUniquenessFactor]
                .generatedCount = 1;
            uniquenessFactorToGeneratedAttributesCount[_randomValue] = 1;
            treeToken.setAttributes(_treeId, uniquenessFactor, _generationType);

            return true;
        } else {
            uniquenessFactorToGeneratedAttributesCount[_randomValue] += 1;
            return false;
        }
    }

    /**
     * @dev generate statistical shape based on {_randomValue} and {_funderRank}
     * @param _randomValue base random value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @return shape type id
     */
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
        ];
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
        ];
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
        ];
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
        ];
        uint16[9] memory selectedRankProb;

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

        uint8 randomValueFirstFourBit = uint8(_randomValue & 15);

        uint16 probability = _randomValue >> 4;

        uint8 result = 0;

        for (uint8 j = 0; j < 9; j++) {
            if (probability < selectedRankProb[j]) {
                result = j;
                break;
            }
        }

        if (result == 8) {
            if (specialTreeCount < 16) {
                shape = 128 + specialTreeCount;
                specialTreeCount += 1;
            } else {
                shape = 112 + randomValueFirstFourBit;
            }
        } else {
            shape = result * 16 + randomValueFirstFourBit;
        }

        return shape;
    }

    /**
     * @dev generate statistical colors based on {_randomValue1} and {_randomValue2} and
     * {_funderRank}
     * @param _randomValue1 base random1 value
     * @param _randomValue2 base random2 value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @return trunk color id
     * @return crown color id
     */
    function _calcColors(
        uint8 _randomValue1,
        uint8 _randomValue2,
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

        uint8 probability1 = _randomValue1 & 31;

        uint8 randomValue1Last3Bit = _randomValue1 >> 5;
        uint8 probability2 = _randomValue2 & 31;

        uint8 randomValue2Last3Bit = _randomValue2 >> 5;
        uint8 result1 = 0;
        uint8 result2 = 0;

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

    /**
     * @dev set trunk color and crown color id base on special shape
     * @param _shape shape type id
     * @return trunk color id
     * @return crown color id
     */
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

    /**
     * @dev generate statistical effect based on {_randomValue} and {_funderRank}
     * @param _randomValue base random value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @return effect id
     */
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

    /**
     * @dev generate statistical coefficient value based on {_randomValue} and {_funderRank}
     * @param _randomValue base random value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @return coefficient value
     */
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
