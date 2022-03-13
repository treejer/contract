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

    function externalNFTApprove(
        uint8 _nftType,
        address _nftTokenAddress,
        uint256 _nftTokenId,
        address _destinationAddress
    ) external;
}
