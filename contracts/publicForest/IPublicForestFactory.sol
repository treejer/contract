// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPublicForestFactory {
    /**
     * @dev initialize AccessRestriction contract and set true for isPublicForestFactory
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(
        address _accessRestrictionAddress,
        address _wmaticAddress,
        address _baseTokenAddress,
        address _treejerNftContractAddress
    ) external;

    function setTreejerContractAddress(address _address) external;

    function setImplementationAddress(address _implementation) external;

    function setDexRouterAddress(address _dexRouter) external;

    function setBaseTokenAddress(address _baseTokenAddress) external;

    function updateFactoryAddress(
        address _contractAddress,
        address _proxyAddress
    ) external;

    function updateIpfsHash(address _contractAddress, string memory _ipfs)
        external;

    function updateValidTokens(address _tokenAddress, bool _isValid) external;

    function swapTokenToBaseToken(
        address _contractAddress,
        address _tokenAddress,
        uint256 _minBaseTokenOut
    ) external;

    function swapMainCoinToBaseToken(
        address _contractAddress,
        uint256 _minBaseTokenOut
    ) external;

    function fundTrees(address _contractAddress) external;

    function createPublicForest(string memory _ipfsHash) external;

    function externalTokenERC721Approve(
        address _forest,
        address _tokenAddress,
        uint256 _tokenId
    ) external;

    function externalTokenERC1155Approve(address _forest, address _tokenAddress)
        external;

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function isPublicForestFactory() external view returns (bool);

    function forests(uint256 _index) external returns (address);

    function forestToOwners(address _forest)
        external
        view
        returns (address owner);

    function indexOf(address _forest) external view returns (uint256 index);

    function validTokens(address _token) external view returns (bool);

    function implementation() external view returns (address);

    function treejerNftContractAddress() external view returns (address);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function baseTokenAddress() external view returns (address);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function wmaticAddress() external view returns (address);

    function treejerContract() external view returns (address);

    function dexRouter() external view returns (address);
}
