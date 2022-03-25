// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title PublicForestFactory interface */
interface IPublicForestFactory {
    event ImplementationAddressUpdated(address implementation);
    event BaseTokenAddressUpdated(address baseTokenAddress);
    event DexRouterAddressUpdated(address dexRouter);
    event FactoryAddressUpdated(address forest, address factory);
    event ValidTokensUpdated(address token, bool isValid);
    event ERC721Approved(address forest, address token, uint256 tokenId);
    event ERC1155Approved(address forest, address token);
    event PublicForestCreated(address forest, string ipfsHash);
    event IpfsHashUpdated(address forest, string ipfsHash);

    /**
     * @dev initialize AccessRestriction contract and set true for isPublicForestFactory
     * and set wmaticAddress and baseTokenAddress and treeTokenAddress
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     * @param _wmaticAddress wmatic address
     * @param _baseTokenAddress base token address
     * @param _treeTokenAddress address of Tree contract
     */
    function initialize(
        address _accessRestrictionAddress,
        address _wmaticAddress,
        address _baseTokenAddress,
        address _treeTokenAddress
    ) external;

    /** @dev set {_implementation} to implementation */
    function setImplementationAddress(address _implementation) external;

    /** @dev set {_baseTokenAddress} to baseTokenAddress */
    function setBaseTokenAddress(address _baseTokenAddress) external;

    /** @dev set {_regularSaleAddress} to regularSaleAddress */
    function setRegularSaleAddress(address _regularSaleAddress) external;

    /** @dev set {_dexRouter} to dexRouter */
    function setDexRouterAddress(address _dexRouter) external;

    /**
     * @dev update factory contract address for a given forest
     * @param _forest address of PublicForest contract
     * @param _factory address of new factory contract
     */
    function updateFactoryAddress(address _forest, address _factory) external;

    /**
     * @dev update validation of a specific token
     * @param _token address of token
     * @param _isValid is valid token or not
     */
    function updateValidTokens(address _token, bool _isValid) external;

    /**
     * @dev swap all balance of a given token in a forest to baseToken
     * @param _forest address of PublicForest contract
     * @param _token address of token to swap
     * @param _minBaseTokenOut minimum expected base token
     */
    function swapTokenToBaseToken(
        address _forest,
        address _token,
        uint256 _minBaseTokenOut
    ) external;

    /**
     * @dev swap all balance of wmatic token in a forest to baseToken
     * @param _forest address of PublicForest contract
     * @param _minBaseTokenOut minimum expected base token
     */
    function swapMainCoinToBaseToken(address _forest, uint256 _minBaseTokenOut)
        external;

    /**
     * @dev fund token for a specific forest
     * NOTE based on dai balance of a forest, number of trees that forest can fund calculated
     * and funded to that forest.
     * NOTE up to 50 tree can fund in each call which means that if the calculated amount exceed
     * 50, up to 50 tree fund and the remaining amount must be fund in another transaction.
     * @param _forest address of PublicForest contract
     */
    function fundTrees(address _forest) external;

    /**
     * @dev give approve to factory contract for an erc721 token with id of {_tokenId} in a
     * specific forest
     * @param _forest address of PublicForest contract
     * @param _token address of token
     * @param _tokenId id of token
     */
    function externalTokenERC721Approve(
        address _forest,
        address _token,
        uint256 _tokenId
    ) external;

    /**
     * @dev give approve to factory contract for an erc1155 token in a specific forest
     * @param _forest address of PublicForest contract
     * @param _token address of token
     */
    function externalTokenERC1155Approve(address _forest, address _token)
        external;

    /**
     * @dev create a forest with specific ipfsHash
     * @param _ipfsHash ipfsHash of forest
     */
    function createPublicForest(string memory _ipfsHash) external;

    /**
     * @dev update ipfsHash for a given forest
     * @param _forest address of PublicForest contract
     * @param _ipfsHash new ipfs hash
     */
    function updateIpfsHash(address _forest, string memory _ipfsHash) external;

    /** @return true in case of PublicForestFactory contract has been initialized */
    function isPublicForestFactory() external view returns (bool);

    /** @return forest address of given index */
    function forests(uint256 _index) external returns (address);

    /** @return creator of given forest */
    function forestToCreators(address _forest) external view returns (address);

    /** @return index of given forest */
    function indexOf(address _forest) external view returns (uint256);

    /** @return true if the given token is valid */
    function validTokens(address _token) external view returns (bool);

    /** @return implementation address */
    function implementation() external view returns (address);

    /** @return treeTokenAddress address */
    function treeTokenAddress() external view returns (address);

    /** @return baseTokenAddress address */
    function baseTokenAddress() external view returns (address);

    /** @return wmatic address */
    function wmaticAddress() external view returns (address);

    /** @return regularSaleAddress address */
    function regularSaleAddress() external view returns (address);

    /** @return dexRouter address */
    function dexRouter() external view returns (address);
}
