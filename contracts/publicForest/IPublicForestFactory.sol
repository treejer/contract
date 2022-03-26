// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title PublicForestFactory interface */
interface IPublicForestFactory {
    /**
     * @dev emitted when implementation address updated
     * @param implementation address of new implementation
     */
    event ImplementationAddressUpdated(address implementation);

    /**
     * @dev emitted when baseToken address updated
     * @param baseTokenAddress address of new baseToken
     */
    event BaseTokenAddressUpdated(address baseTokenAddress);
    /**
     * @dev emitted when dexRouter address updated
     * @param dexRouter address of new dexRouter
     */
    event DexRouterAddressUpdated(address dexRouter);

    /**
     * @dev emitted when factory address of given forest updated
     * @param forest address of forest to update it's factory
     * @param factory address of new factory
     */

    event FactoryAddressUpdated(address forest, address factory);

    /**
     * @dev emitted when validation of a token updated
     * @param token address of token
     * @param isValid if the token is valid or not
     */
    event ValidTokensUpdated(address token, bool isValid);
    /**
     * @dev emitted when approve given to an erc721 token with id {tokenId}
     * @param forest address of forest
     * @param token address of token
     * @param tokenId id of token
     */
    event ERC721Approved(address forest, address token, uint256 tokenId);
    /**
     * @dev emitted when approve given to or revoking from an erc1155 token
     * @param forest address of forest
     * @param token address of token
     */
    event ERC1155Approved(address forest, address token);

    /**
     * @dev emitted when new forest created
     * @param forest address of created forest
     * @param ipfsHash ipfsHash of forest
     */
    event PublicForestCreated(address forest, string ipfsHash);

    /**
     * @dev emitted when ipfsHash of given forest updated
     * @param forest address of forest to update it's ipfsHash
     * @param ipfsHash new ipfsHash
     */
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

    /**
     * @dev set {_implementation} to implementation
     * NOTE emit an {ImplementationAddressUpdated} event
     */
    function setImplementationAddress(address _implementation) external;

    /**
     * @dev set {_baseTokenAddress} to baseTokenAddress
     * NOTE emit a {BaseTokenAddressUpdated} event
     */
    function setBaseTokenAddress(address _baseTokenAddress) external;

    /** @dev set {_regularSaleAddress} to regularSaleAddress */
    function setRegularSaleAddress(address _regularSaleAddress) external;

    /**
     * @dev set {_dexRouter} to dexRouter
     * NOTE emit a {DexRouterAddressUpdated} event
     */
    function setDexRouterAddress(address _dexRouter) external;

    /**
     * @dev update factory contract address for a given forest
     * NOTE emit a {FactoryAddressUpdated} event
     * @param _forest address of PublicForest contract
     * @param _factory address of new factory contract
     */
    function updateFactoryAddress(address _forest, address _factory) external;

    /**
     * @dev update validation of a specific token
     * NOTE emit a {ValidTokensUpdated} event
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
     * NOTE emit an {ERC721Approved} event
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
     * NOTE emit an {ERC1155Approved} event
     * @param _forest address of PublicForest contract
     * @param _token address of token
     */
    function externalTokenERC1155Approve(address _forest, address _token)
        external;

    /**
     * @dev create a forest with specific ipfsHash
     * NOTE emit a {PublicForestCreated} event
     * @param _ipfsHash ipfsHash of forest
     */
    function createPublicForest(string memory _ipfsHash) external;

    /**
     * @dev update ipfsHash for a given forest
     * NOTE emit an {IpfsHashUpdated} event
     * @param _forest address of PublicForest contract
     * @param _ipfsHash new ipfsHash
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
