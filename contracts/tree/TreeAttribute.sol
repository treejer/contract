// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITree.sol";

/** @title TreeAttribute Contract */
contract TreeAttribute is Initializable {
    using SafeCastUpgradeable for uint256;

    bool public isTreeAttribute;
    IAccessRestriction public accessRestriction;
    ITree public treeToken;

    /** NOTE parameters of randomTreeGeneration*/

    struct SymbolStatus {
        uint128 generatedCount;
        uint128 status; // 0 free, 1 reserved , 2 set, 3 setByAdmin
    }

    //TODO: change this to uint8 from uint256
    uint8 public specialCount;

    /** NOTE mapping from unique attributes id to number of generations */
    mapping(uint64 => uint32) public generatedAttributes;

    /** NOTE mapping from unique symbol id to number of generations  */
    mapping(uint64 => SymbolStatus) public uniqueSymbol;

    event TreeAttributesGenerated(uint256 treeId);
    event TreeAttributesNotGenerated(uint256 treeId);
    event SymbolReserved(uint64 generatedCode); //TODO: input was uint32 before
    event ReservedSymbolFreed(uint64 generatedCode); //TODO: input was uint32 before
    event SymbolSetByAdmin(uint256 treeId);

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
     * @dev admin set TreeToken contract address
     * @param _address set to the address of TreeToken contract
     */
    function setTreeTokenAddress(address _address) external onlyAdmin {
        ITree candidateContract = ITree(_address);

        require(candidateContract.isTree());

        treeToken = candidateContract;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isTreeAttribute
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
        isTreeAttribute = true;
        specialCount = 0;
        accessRestriction = candidateContract;
    }

    /**
     * @dev reserve a unique symbol
     * @param _generatedSymbol unique symbol to reserve
     */
    function reserveSymbol(uint64 _generatedSymbol)
        external
        onlyDataManagerOrTreejerContract
    {
        require(
            uniqueSymbol[_generatedSymbol].status == 0,
            "the tree attributes are taken"
        );
        uniqueSymbol[_generatedSymbol].status = 1;

        emit SymbolReserved(_generatedSymbol);
    }

    /**
     * @dev free reservation of a unique symbol
     * @param _generatedSymbol unique symbol to reserve
     */
    //TODO: input was uint32 before
    function freeReserveSymbol(uint64 _generatedSymbol)
        external
        onlyDataManagerOrTreejerContract
    {
        require(
            uniqueSymbol[_generatedSymbol].status == 1,
            "the tree attributes not reserved"
        );

        uniqueSymbol[_generatedSymbol].status = 0;

        emit ReservedSymbolFreed(_generatedSymbol);
    }

    /**
     * @dev free reservation of a unique symbol
     * @param _generatedSymbol unique symbol to reserve
     */
    function freeReserveSymbolBool(uint64 _generatedSymbol)
        external
        onlyDataManagerOrTreejerContract
    {
        if (uniqueSymbol[_generatedSymbol].status == 1) {
            uniqueSymbol[_generatedSymbol].status = 0;
            emit ReservedSymbolFreed(_generatedSymbol);
        }
    }

    /**
     * @dev admin assigns symbol to specified treeId
     * @param treeId id of tree
     * @param generatedCode unique symbol code to assign
     */
    function setTreeAttributesByAdmin(
        uint256 treeId,
        uint64 generatedCode,
        uint64 generatedSymbol,
        uint8 generationType
    ) external onlyDataManagerOrTreejerContract {
        require(
            uniqueSymbol[generatedSymbol].status < 2,
            "the tree symbol is taken"
        );
        require(
            generatedAttributes[generatedCode] == 0,
            "the tree attributes are taken"
        );
        generatedAttributes[generatedCode] = 1;
        uniqueSymbol[generatedSymbol].status = 3;
        uniqueSymbol[generatedSymbol].generatedCount =
            uniqueSymbol[generatedSymbol].generatedCount +
            1;
        //
        uint256 value = generatedSymbol + 2 * (2**32);
        uint256 total = generatedCode + value * (2**64);
        treeToken.setTreeAttributes(treeId, total, generationType);

        emit SymbolSetByAdmin(treeId);
    }

    /**
     * @dev generate a 256 bits random number as a base for tree attributes and slice it
     * in 28 bits parts
     * @param treeId id of tree
     * @return if unique tree attribute generated successfully
     */
    function createTreeSymbol(
        uint256 treeId,
        bytes32 randTree,
        address buyer,
        uint8 funderRank,
        uint8 generationType
    ) external ifNotPaused onlyTreejerContract returns (bool) {
        //TODO:check treeSymbols instead of treeAttributes
        //TODO: ==false => !
        if (!treeToken.checkAttributeExists(treeId)) {
            //TODO: flag true ==>false
            bool flag = false;
            uint64 attrRand;

            for (uint256 j = 0; j < 10000; j++) {
                uint256 rand = uint256(
                    keccak256(
                        abi.encodePacked(
                            buyer,
                            randTree,
                            generationType,
                            msg.sig,
                            treeId,
                            j
                        )
                    )
                );

                for (uint256 i = 0; i < 4; i++) {
                    attrRand = uint64(rand & type(uint64).max);

                    flag = _calcRandSymbol(
                        treeId,
                        attrRand,
                        funderRank,
                        generationType
                    );
                    if (flag) {
                        break;
                    }
                    rand = rand / (uint256(2)**64);
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
        } else {
            return true;
        }
    }

    function createTreeAttributes(uint256 _treeId)
        external
        ifNotPaused
        onlyTreejerContract
        returns (bool)
    {
        //TODO:check treeSymbols instead of treeAttributes

        if (!treeToken.checkAttributeExists(_treeId)) {
            (bool flag, uint64 generatedAttribute) = _createUniqueAttribute(
                _treeId
            );

            if (flag) {
                treeToken.setTreeAttributes(_treeId, generatedAttribute, 1);
                generatedAttributes[generatedAttribute] = 1;

                emit TreeAttributesGenerated(_treeId);
            } else {
                emit TreeAttributesNotGenerated(_treeId);
            }

            return flag;
        } else {
            return true;
        }
    }

    function randAvailibity(uint256 _treeId, uint64 _rand)
        external
        onlyTreejerContract
        returns (uint64)
    {
        if (generatedAttributes[_rand] == 0) {
            return _rand;
        } else {
            generatedAttributes[_rand] = generatedAttributes[_rand] + 1;

            (bool flag, uint64 generatedAttribute) = _createUniqueAttribute(
                _treeId
            );

            require(flag, "unique attribute not fund");

            return generatedAttribute;
        }
    }

    /**
     * @dev the function Tries to Calculate the rank of buyer based on transaction statistics of
     * his/her wallet
     * @param _funder address of funder
     */
    function getFunderRank(address _funder) external view returns (uint8) {
        //TODO: remove rank varible

        uint256 ownedTrees = treeToken.balanceOf(_funder);

        if (ownedTrees > 10000) {
            return 3;
        } else if (ownedTrees > 2000) {
            return 2;
        } else if (ownedTrees > 500) {
            return 1;
        }

        return 0;
    }

    function _createUniqueAttribute(uint256 _treeId)
        private
        returns (bool, uint64)
    {
        uint64 generatedAttribute;

        for (uint256 j = 0; j < 10000; j++) {
            uint256 _rand = uint256(
                keccak256(abi.encodePacked(msg.sig, _treeId, j))
            );

            for (uint256 i = 0; i < 4; i++) {
                generatedAttribute = uint64(_rand & type(uint64).max);

                if (generatedAttributes[generatedAttribute] == 0) {
                    return (true, generatedAttribute);
                } else {
                    generatedAttributes[generatedAttribute] =
                        generatedAttributes[generatedAttribute] +
                        1;
                    _rand = _rand / (uint256(2)**64);
                }
            }
        }
        return (false, 0);
    }

    /**
     * @dev calculates the random attributes from random number
     * @param treeId id of tree
     * @param _rand a 28 bits random attribute generator number
     * @return if generated random attribute is unique
     */
    function _calcRandSymbol(
        uint256 treeId,
        uint64 _rand,
        uint8 funderRank,
        uint8 generationType
    ) private returns (bool) {
        if (generatedAttributes[_rand] == 0) {
            uint8[] memory results = new uint8[](8);

            //TODO: create tempRand
            uint64 tempRand = _rand;
            for (uint256 j = 0; j < 8; j++) {
                results[j] = uint8(tempRand & 255);
                tempRand = tempRand / 256;
            }

            uint8 treeShape = _calcTreeShape(
                uint16(_rand & ((2**13) - 1)),
                funderRank
            );

            uint8 trunkColor;
            uint8 crownColor;

            if (treeShape < 128) {
                (trunkColor, crownColor) = _calcColors(
                    results[2],
                    results[3],
                    funderRank
                );
            } else {
                (trunkColor, crownColor) = _setColors(treeShape);
            }

            uint8 effects = _calcEffects(results[4], funderRank);

            uint64 symbolCode = treeShape +
                (2**8) * //2**8
                trunkColor +
                (2**16) * //2**16
                crownColor +
                (2**24) * //2**24
                effects;

            if (uniqueSymbol[symbolCode].status > 0) {
                uniqueSymbol[symbolCode].generatedCount =
                    uniqueSymbol[symbolCode].generatedCount +
                    1;
                return false;
            }
            uint8 coefficient = _calcCoefficient(results[5], funderRank);

            uint256 total = uint256(_rand) +
                uint256(uint256(symbolCode + (2**32) * coefficient) * (2**64));

            uniqueSymbol[symbolCode].status = 2;
            uniqueSymbol[symbolCode].generatedCount = 1;
            generatedAttributes[_rand] = 1;
            treeToken.setTreeAttributes(treeId, total, generationType);
            //TODO: there waas no return here we add return true
            return true;
        } else {
            generatedAttributes[_rand] = generatedAttributes[_rand] + 1;
            return false;
        }
    }

    function _calcTreeShape(uint16 _rand, uint8 _funderRank)
        private
        returns (uint8)
    {
        //TODO: variables was uint8 before
        uint16[9] memory rank0 = [128, 256, 320, 384, 432, 480, 496, 511, 512];
        uint16[9] memory rank1 = [110, 200, 290, 360, 420, 470, 490, 511, 512];
        uint16[9] memory rank2 = [90, 190, 280, 350, 410, 450, 480, 510, 512];
        uint16[9] memory rank3 = [64, 176, 272, 340, 400, 460, 496, 508, 512];
        uint16[9] memory probabilities;

        if (_funderRank == 3) {
            probabilities = rank3;
        } else if (_funderRank == 2) {
            probabilities = rank2;
        } else if (_funderRank == 1) {
            probabilities = rank1;
        } else {
            probabilities = rank0;
        }

        uint8 treeShape;
        //TODO: change this to uint8 from uint16
        uint8 base16 = uint8(_rand & 15);

        uint16 selector = _rand / 16;

        uint8 res = 0;

        //TODO: j was uint256 before
        for (uint8 j = 0; j < 9; j++) {
            if (selector < probabilities[j]) {
                res = j;
                break;
            }
        }

        if (res == 8) {
            if (specialCount < 16) {
                treeShape = 128 + specialCount;
                specialCount = specialCount + 1;
            } else {
                treeShape = 112 + base16;
            }
        } else {
            treeShape = res * 16 + base16;
        }

        return treeShape;
    }

    function _calcColors(
        uint8 _a,
        uint8 _b,
        uint8 _funderRank
    ) private pure returns (uint8, uint8) {
        uint8[8] memory rank0 = [6, 12, 18, 22, 26, 29, 31, 32];
        uint8[8] memory rank1 = [5, 10, 15, 20, 24, 28, 31, 32];
        uint8[8] memory rank2 = [5, 10, 15, 19, 23, 27, 30, 32];
        uint8[8] memory rank3 = [4, 8, 12, 16, 20, 24, 28, 32];
        uint8[8] memory probabilities;

        if (_funderRank == 3) {
            probabilities = rank3;
        } else if (_funderRank == 2) {
            probabilities = rank2;
        } else if (_funderRank == 1) {
            probabilities = rank1;
        } else {
            probabilities = rank0;
        }

        uint8 a1 = _a & 31;
        uint8 a2 = _a / 32; //change to  _a / 32
        uint8 b1 = _b & 31;
        uint8 b2 = _b / 32; // change to _b / 32
        uint8 ar = 0;
        uint8 br = 0;

        //TODO: j was uint256 before |  ar & br not true set
        for (uint8 i = 0; i < 8; i++) {
            if (a1 < probabilities[i]) {
                ar = i;
                break;
            }
        }

        for (uint8 j = 0; j < 8; j++) {
            if (b1 < probabilities[j]) {
                br = j;
                break;
            }
        }

        return (ar * 8 + a2, br * 8 + b2);
    }

    function _setColors(uint8 _treeShape) private pure returns (uint8, uint8) {
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
        return (trunks[_treeShape - 128], crowns[_treeShape - 128]);
    }

    function _calcEffects(uint8 _rand, uint8 _funderRank)
        private
        pure
        returns (uint8)
    {
        //TODO: change this to uint16 from uint8
        uint8[16] memory rank0 = [
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
        uint8[16] memory rank1 = [
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
        uint8[16] memory rank2 = [
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
        uint8[16] memory rank3 = [
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

        uint8[16] memory probabilities;

        if (_funderRank == 3) {
            probabilities = rank3;
        } else if (_funderRank == 2) {
            probabilities = rank2;
        } else if (_funderRank == 1) {
            probabilities = rank1;
        } else {
            probabilities = rank0;
        }

        //TODO: change j to uint8 from uint256
        for (uint8 j = 0; j < 16; j++) {
            //TODO: j must be < 16
            if (_rand <= probabilities[j]) {
                return j;
            }
        }

        return 0;
    }

    function _calcCoefficient(uint8 _rand, uint8 _funderRank)
        private
        pure
        returns (uint8)
    {
        //TODO: what is this func
        //TODO:change this to uint16 from uint8

        uint8[8] memory rank0 = [190, 225, 235, 244, 250, 253, 254, 255];
        uint8[8] memory rank1 = [175, 205, 225, 240, 248, 252, 254, 255];
        uint8[8] memory rank2 = [170, 200, 218, 232, 245, 250, 253, 255];
        uint8[8] memory rank3 = [128, 192, 210, 227, 240, 249, 252, 255];

        uint8[8] memory probabilities;

        if (_funderRank == 3) {
            probabilities = rank3;
        } else if (_funderRank == 2) {
            probabilities = rank2;
        } else if (_funderRank == 1) {
            probabilities = rank1;
        } else {
            probabilities = rank0;
        }

        // //TODO: dont understnd this part
        for (uint8 j = 0; j < 8; j++) {
            if (_rand <= probabilities[j]) {
                return j;
            }
        }

        return 0;
    }
}
