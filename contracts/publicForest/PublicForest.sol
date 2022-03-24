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

/** @title PublicForest contract */
contract PublicForest is
    Initializable,
    IPublicForest,
    IERC721Receiver,
    IERC1155Receiver
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
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
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

    function swapTokenToBaseToken(
        address _dexRouter,
        address _tokenAddress,
        address _baseTokenAddress,
        uint256 _minBaseTokenOut
    ) external override onlyFactoryAddress {
        _swapExactTokensForTokens(
            _dexRouter,
            _tokenAddress,
            _baseTokenAddress,
            _minBaseTokenOut
        );
    }

    function swapMainCoinToBaseToken(
        address _dexRouter,
        address _wmaticAddress,
        address _baseTokenAddress,
        uint256 _minBaseTokenOut
    ) external override onlyFactoryAddress {
        _swapExactETHForTokens(
            _dexRouter,
            _wmaticAddress,
            _baseTokenAddress,
            _minBaseTokenOut
        );
    }

    function fundTrees(
        address _baseTokenAddress,
        address _treejerContractAddress
    ) external override onlyFactoryAddress {
        uint256 regularSalePrice = ITreejerContract(_treejerContractAddress)
            .price();
        uint256 treeCount = IERC20(_baseTokenAddress).balanceOf(address(this)) /
            regularSalePrice;

        treeCount = treeCount > 50 ? 50 : treeCount;

        IERC20(_baseTokenAddress).approve(
            _treejerContractAddress,
            treeCount * regularSalePrice
        );

        ITreejerContract(_treejerContractAddress).fundTree(
            treeCount,
            address(0),
            address(0)
        );
    }

    function externalTokenERC721Approve(
        address _tokenAddress,
        address _to,
        uint256 _tokenId
    ) external override onlyFactoryAddress {
        IERC721(_tokenAddress).approve(_to, _tokenId);
    }

    function externalTokenERC1155Approve(
        address _tokenAddress,
        address _to,
        bool _approved
    ) external override onlyFactoryAddress {
        IERC1155(_tokenAddress).setApprovalForAll(_to, _approved);
    }

    /**
     * @dev swap weth token to dai token
     */
    function _swapExactTokensForTokens(
        address _dexRouter,
        address _tokenAddress,
        address _baseTokenAddress,
        uint256 _minBaseTokenOut
    ) private {
        address[] memory path;
        path = new address[](2);

        path[0] = _tokenAddress;
        path[1] = _baseTokenAddress;

        uint256 amount = IERC20(_tokenAddress).balanceOf(address(this));

        bool success = IERC20(_tokenAddress).approve(_dexRouter, amount);

        require(success, "Unsuccessful approve");

        IdexRouter(_dexRouter).swapExactTokensForTokens(
            amount,
            _minBaseTokenOut,
            path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }

    /**
     * @dev swap main token to dai token
     */
    function _swapExactETHForTokens(
        address _dexRouter,
        address _wmaticAddress,
        address _baseTokenAddress,
        uint256 _minBaseTokenOut
    ) private {
        address[] memory path;
        path = new address[](2);

        path[0] = _wmaticAddress;
        path[1] = _baseTokenAddress;

        IdexRouter(_dexRouter).swapExactETHForTokens{
            value: address(this).balance
        }(
            _minBaseTokenOut,
            path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }
}
