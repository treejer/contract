// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./IPublicForest.sol";

// import "@openzeppelin/contracts/utils/introspection/ERC165CheckerUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./../regularSale/IRegularSale.sol";

/** @title PublicForest contract */
contract PublicForest is
    Initializable,
    IPublicForest,
    IERC721Receiver,
    IERC1155Receiver
{
    string public ipfsHash;
    address public factoryAddress;

    IRegularSale public regularSale;

    /** NOTE modifier to check msg.sender is factoryAddress */
    modifier onlyFactoryAddress() {
        require(msg.sender == factoryAddress, "Caller not factoryAddress");
        _;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}

    function initialize(string memory _ipfsHash, address _factoryAddress)
        external
        initializer
        onlyFactoryAddress
    {
        ipfsHash = _ipfsHash;
        factoryAddress = _factoryAddress;
    }

    function updateFactoryAddress(address _factoryAddress)
        external
        override
        onlyFactoryAddress
    {
        factoryAddress = _factoryAddress;
    }

    function updateIpfsHash(string memory _ipfsHash)
        external
        override
        onlyFactoryAddress
    {
        ipfsHash = _ipfsHash;
    }

    function setRegularSaleAddress(address _address)
        external
        override
        onlyFactoryAddress
    {
        IRegularSale candidateContract = IRegularSale(_address);
        require(candidateContract.isRegularSale());
        regularSale = candidateContract;
    }

    function swapTokenToDAI(address _tokenAddress, uint256 _leastDai)
        external
        override
        onlyFactoryAddress
    {}

    function swapMainCoinToDAI(uint256 _leastDai)
        external
        override
        onlyFactoryAddress
    {}

    function fundTrees() external override onlyFactoryAddress {}

    function externalNFTApprove(
        uint8 _nftType,
        address _nftTokenAddress,
        uint256 _nftTokenId,
        address _destinationAddress
    ) external override onlyFactoryAddress {}
}
