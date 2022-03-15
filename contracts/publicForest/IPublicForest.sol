// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPublicForest {
    function initialize(string memory _ipfsHash, address _factoryAddress)
        external;

    function updateFactoryAddress(address _factoryAddress) external;

    function updateIpfsHash(string memory _ipfsHash) external;

    function setRegularSaleAddress(address _address) external;

    function swapTokenToDAI(address _tokenAddress, uint256 _leastDai) external;

    function swapMainCoinToDAI(uint256 _leastDai) external;

    function fundTrees() external;

    function externalTokenERC721Approve(
        address _nftTokenAddress,
        uint256 _nftTokenId,
        address _destinationAddress
    ) external;

    function externalTokenERC1155Approve(
        address _nftTokenAddress,
        bool _approved,
        address _destinationAddress
    ) external;

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function ipfsHash() external view returns (string memory);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function factoryAddress() external view returns (address);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function daiAddress() external view returns (address);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function wmaticAddress() external view returns (address);
}
