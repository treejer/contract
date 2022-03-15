// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface IPublicForestFactory {
    /**
     * @dev initialize AccessRestriction contract and set true for isPublicForestFactory
     * @param _accessRestrictionAddress set to the address of AccessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) external;

    /**
     * @return true in case of PublicForestFactory contract has been initialized
     */
    function isPublicForestFactory() external view returns (bool);

    function externalTokenERC721Approve(
        address _contractAddress,
        address nftContractAddress,
        uint256 _tokenId
    ) external;

    function externalTokenERC1155Approve(
        address _contractAddress,
        address nftContractAddress
    ) external;
}
