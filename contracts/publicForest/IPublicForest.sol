// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPublicForest {
    function initialize(string memory _ipfsHash, address _factory) external;

    function updateFactoryAddress(address _factoryAddress) external;

    function updateIpfsHash(string memory _ipfsHash) external;

    function swapTokenToBaseToken(
        address[] calldata path,
        address _dexRouter,
        uint256 _minBaseTokenOut
    ) external;

    function swapMainCoinToBaseToken(
        address[] calldata path,
        address _dexRouter,
        uint256 _minBaseTokenOut
    ) external;

    function fundTrees(address _baseTokenAddress, address _treejerContract)
        external;

    function externalTokenERC721Approve(
        address _token,
        address _to,
        uint256 _tokenId
    ) external;

    function externalTokenERC1155Approve(
        address _token,
        address _to,
        bool _approved
    ) external;

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function ipfsHash() external view returns (string memory);

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function factory() external view returns (address);
}
