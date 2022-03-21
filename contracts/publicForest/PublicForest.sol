// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./IPublicForest.sol";

// import "@openzeppelin/contracts/utils/introspection/ERC165CheckerUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./interfaces/ITreejerContract.sol";
import "./interfaces/IdexRouter.sol";

import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

/** @title PublicForest contract */
contract PublicForest is
    Initializable,
    IPublicForest,
    IERC721Receiver,
    IERC1155Receiver,
    IERC777Recipient
{
    string public override ipfsHash;
    address public override factoryAddress;

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
        override
        initializer
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

    function swapTokenToDAI(
        address _tokenAddress,
        uint256 _leastDai,
        address _daiAddress,
        address _dexRouter
    ) external override onlyFactoryAddress {
        _swapExactTokensForTokens(
            _tokenAddress,
            _leastDai,
            _daiAddress,
            _dexRouter
        );
    }

    function swapMainCoinToDAI(
        uint256 _leastDai,
        address _daiAddress,
        address _wmaticAddress,
        address _dexRouter
    ) external override onlyFactoryAddress {
        _swapExactETHForTokens(
            _leastDai,
            _daiAddress,
            _wmaticAddress,
            _dexRouter
        );
    }

    function fundTrees(address _daiAddress, address _regularSale)
        external
        override
        onlyFactoryAddress
    {
        uint256 regularSalePrice = ITreejerContract(_regularSale).price();
        uint256 treeCount = IERC20(_daiAddress).balanceOf(address(this)) /
            regularSalePrice;

        treeCount = treeCount > 50 ? 50 : treeCount;

        IERC721(_daiAddress).approve(
            _regularSale,
            treeCount * regularSalePrice
        );

        ITreejerContract(_regularSale).fundTree(
            treeCount,
            address(0),
            address(0)
        );
    }

    function externalTokenERC721Approve(
        address _nftTokenAddress,
        uint256 _nftTokenId,
        address _destinationAddress
    ) external override onlyFactoryAddress {
        IERC721(_nftTokenAddress).approve(_destinationAddress, _nftTokenId);
    }

    function externalTokenERC1155Approve(
        address _nftTokenAddress,
        bool _approved,
        address _destinationAddress
    ) external override onlyFactoryAddress {
        IERC1155(_nftTokenAddress).setApprovalForAll(
            _destinationAddress,
            _approved
        );
    }

    /**
     * @dev swap weth token to dai token
     */
    function _swapExactTokensForTokens(
        address _tokenAddress,
        uint256 _minDaiOut,
        address _daiAddress,
        address _dexRouter
    ) private {
        address[] memory path;
        path = new address[](2);

        path[0] = _tokenAddress;
        path[1] = _daiAddress;

        uint256 amount = IERC20(_tokenAddress).balanceOf(_tokenAddress);

        bool success = IERC20(_tokenAddress).approve(_dexRouter, amount);

        require(success, "Unsuccessful approve");

        IdexRouter(_dexRouter).swapExactTokensForTokens(
            amount,
            _minDaiOut,
            path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }

    /**
     * @dev swap main token to dai token
     */
    function _swapExactETHForTokens(
        uint256 _minDaiOut,
        address _daiAddress,
        address _wmaticAddress,
        address _dexRouter
    ) private {
        address[] memory path;
        path = new address[](2);

        path[0] = _wmaticAddress;
        path[1] = _daiAddress;

        IdexRouter(_dexRouter).swapExactETHForTokens{
            value: address(this).balance
        }(
            _minDaiOut,
            path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }
}
