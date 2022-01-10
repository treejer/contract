// // SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITree.sol";
import "./IAttribute.sol";
import "../treasury/interfaces/IUniswapV2Router02New.sol";

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

    IUniswapV2Router02New public dexRouter;

    address[] public override dexTokens;

    address public override baseTokenAddress;

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

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
     * @dev admin set Dai contract address
     * @param _baseTokenAddress set to the address of Dai contract
     */
    function setBaseTokenAddress(address _baseTokenAddress)
        external
        override
        onlyAdmin
        validAddress(_baseTokenAddress)
    {
        baseTokenAddress = _baseTokenAddress;
    }

    /**
     * @dev admin set DexRouter contract address
     * @param _dexRouterAddress set to the address of DexRouter contract
     */

    function setDexRouterAddress(address _dexRouterAddress)
        external
        override
        onlyAdmin
        validAddress(_dexRouterAddress)
    {
        IUniswapV2Router02New candidateContract = IUniswapV2Router02New(
            _dexRouterAddress
        );

        dexRouter = candidateContract;
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _tokens an array of tokens in dex exchange with high liquidity
     */
    function setDexTokens(address[] calldata _tokens)
        external
        override
        onlyAdmin
    {
        require(_tokens.length > 0, "tokens should not be empty");
        bool flag = true;
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (!_isValidToken(_tokens[i])) {
                flag = false;
                break;
            }
        }
        require(flag, "invalid pair address");
        dexTokens = _tokens;
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
            _checkValidSymbol(_uniquenessFactor),
            "invalid symbol to reserve"
        );
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
            _checkValidSymbol(_symbolUniquenessFactor),
            "invalid symbol to reserve"
        );
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
            .generatedCount = 1;

        uint256 uniquenessFactor = _attributeUniquenessFactor +
            ((uint256(_symbolUniquenessFactor) + (_coefficient << 24)) << 64);

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

            for (uint256 j = 0; j < 10; j++) {
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
     * @param _generationType generation type
     * @return if unique attribute generated successfully
     */
    function createAttribute(uint256 _treeId, uint8 _generationType)
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
                treeToken.setAttributes(
                    _treeId,
                    uniquenessFactor,
                    _generationType
                );
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
     * @return a unique random value
     */
    function manageAttributeUniquenessFactor(uint256 _treeId)
        external
        override
        onlyTreejerContract
        returns (uint64)
    {
        (
            bool flag,
            uint64 uniquenessFactor
        ) = _generateAttributeUniquenessFactor(_treeId);

        require(flag, "unique attribute not fund");

        return uniquenessFactor;
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

        if (ownedTrees > 1000) {
            return 3;
        } else if (ownedTrees > 100) {
            return 2;
        } else if (ownedTrees > 10) {
            return 1;
        }

        return 0;
    }

    address selectedDexToken1;

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

        uint256 seed = uint256(
            keccak256(abi.encodePacked(_treeId, block.timestamp))
        );

        uint256 selectorDexToken = seed % dexTokens.length;

        address selectedDexToken = dexTokens[selectorDexToken];

        selectedDexToken1 = dexTokens[selectorDexToken];

        uint256 amount = _getDexAmount(_treeId, selectedDexToken);

        for (uint256 j = 0; j < 10; j++) {
            uint256 randomValue = uint256(
                keccak256(
                    abi.encodePacked(
                        msg.sig,
                        _treeId,
                        amount,
                        selectedDexToken,
                        seed,
                        j
                    )
                )
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
            uint16[] memory attributes = new uint16[](4);

            uint64 tempRandomValue = _randomValue;
            for (uint256 j = 0; j < 4; j++) {
                attributes[j] = uint16(tempRandomValue & type(uint16).max);

                tempRandomValue >>= 16;
            }

            uint8 shape = _calcShape(attributes[0], _funderRank);

            uint8 trunkColor;
            uint8 crownColor;

            if (shape > 32) {
                (trunkColor, crownColor) = _calcColors(
                    attributes[1],
                    attributes[2],
                    _funderRank
                );
            } else {
                trunkColor = 1;
                crownColor = 1;
            }

            uint64 symbolUniquenessFactor = shape +
                (uint64(trunkColor) << 8) +
                (uint64(crownColor) << 16);

            if (
                uniquenessFactorToSymbolStatus[symbolUniquenessFactor].status >
                0
            ) {
                uniquenessFactorToSymbolStatus[symbolUniquenessFactor]
                    .generatedCount += 1;

                return false;
            }
            uint8 coefficient = _calcCoefficient(attributes[3], _funderRank);

            uint256 uniquenessFactor = _randomValue +
                ((symbolUniquenessFactor + (uint256(coefficient) << 24)) << 64);

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
     * @dev admin set TreeToken contract address
     * @param _token token in dex exchange with high liquidity
     */
    function _isValidToken(address _token) private view returns (bool) {
        return _getAmountsOut(2000 * 10**18, _token) > 0;
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _amount dai price to get the
     * @param _token token in dex exchange with high liquidity
     */
    function _getDexAmount(uint256 _amount, address _token)
        private
        view
        returns (uint256)
    {
        uint256 amount = ((_amount % 2000) + 1) * 10**18;
        return _getAmountsOut(amount, _token);
    }

    function _getAmountsOut(uint256 _amount, address _token)
        private
        view
        returns (uint256)
    {
        address[] memory path;
        path = new address[](2);

        path[0] = baseTokenAddress;
        path[1] = _token;

        uint256[] memory amounts = dexRouter.getAmountsOut(_amount, path);

        return amounts[1];
    }

    /**
     * @dev admin set TreeToken contract address
     * @param _symbol symbol to check its validity
     */
    function _checkValidSymbol(uint64 _symbol) private pure returns (bool) {
        uint8[] memory symbs = new uint8[](8);
        for (uint256 i = 0; i < 8; i++) {
            symbs[i] = uint8(_symbol & 255);
            _symbol >>= 8;
        }

        if (
            symbs[0] > 144 ||
            symbs[1] > 65 ||
            symbs[2] > 65 ||
            symbs[3] > 8 ||
            (symbs[4] + symbs[5] + symbs[6] + symbs[7] != 0)
        ) {
            return false;
        }
        return true;
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
        uint16[7] memory probRank0 = [2782, 1797, 987, 459, 194, 62, 1];
        uint16[7] memory probRank1 = [2985, 2065, 1191, 596, 266, 101, 2];
        uint16[7] memory probRank2 = [3114, 2264, 1389, 729, 333, 135, 3];
        uint16[7] memory probRank3 = [3246, 2462, 1656, 931, 468, 203, 5];
        uint16[7] memory selectedRankProb;

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

        for (uint8 j = 0; j < 7; j++) {
            if (probability > selectedRankProb[j]) {
                result = 7 - j;
                break;
            }
        }

        if (result == 0) {
            if (specialTreeCount < 16) {
                shape = 17 + specialTreeCount;
                specialTreeCount += 1;
            } else {
                shape = 33 + randomValueFirstFourBit;
            }
        } else {
            shape = (result + 1) * 16 + 1 + randomValueFirstFourBit;
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
        uint16 _randomValue1,
        uint16 _randomValue2,
        uint8 _funderRank
    ) private pure returns (uint8, uint8) {
        uint16[7] memory probRank0 = [3112, 2293, 1637, 1064, 671, 343, 97];
        uint16[7] memory probRank1 = [3440, 2540, 1818, 1162, 736, 375, 113];
        uint16[7] memory probRank2 = [3603, 2947, 2128, 1391, 818, 408, 130];
        uint16[7] memory probRank3 = [3767, 3276, 2620, 1637, 981, 490, 162];
        uint16[7] memory selectedRankProb;

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        uint8 randomValue1Last3Bit = uint8(_randomValue1 & 7);
        uint16 probability1 = _randomValue1 >> 4;
        uint8 randomValue2Last3Bit = uint8(_randomValue2 & 7);
        uint16 probability2 = _randomValue2 >> 4;

        uint8 result1 = 0;
        uint8 result2 = 0;

        for (uint8 i = 0; i < 7; i++) {
            if (probability1 > selectedRankProb[i]) {
                result1 = 7 - i;
                break;
            }
        }

        for (uint8 j = 0; j < 7; j++) {
            if (probability2 > selectedRankProb[j]) {
                result2 = 7 - j;
                break;
            }
        }

        return (
            result1 * 8 + 2 + randomValue1Last3Bit,
            result2 * 8 + 2 + randomValue2Last3Bit
        );
    }

    /**
     * @dev generate statistical coefficient value based on {_randomValue} and {_funderRank}
     * @param _randomValue base random value
     * @param _funderRank rank of funder based on trees owned in treejer
     * @return coefficient value
     */
    function _calcCoefficient(uint16 _randomValue, uint8 _funderRank)
        private
        pure
        returns (uint8)
    {
        uint16[6] memory probRank0 = [49153, 58985, 62916, 64554, 65210, 65472];
        uint16[6] memory probRank1 = [45877, 57345, 62261, 64227, 65112, 65437];
        uint16[6] memory probRank2 = [39323, 54069, 60622, 63899, 65013, 65406];
        uint16[6] memory probRank3 = [26216, 45877, 58985, 63571, 64882, 65374];

        uint16[6] memory selectedRankProb;

        if (_funderRank == 3) {
            selectedRankProb = probRank3;
        } else if (_funderRank == 2) {
            selectedRankProb = probRank2;
        } else if (_funderRank == 1) {
            selectedRankProb = probRank1;
        } else {
            selectedRankProb = probRank0;
        }

        for (uint8 j = 0; j < 6; j++) {
            if (_randomValue < selectedRankProb[j]) {
                return j + 2;
            }
        }

        return 8;
    }
}
