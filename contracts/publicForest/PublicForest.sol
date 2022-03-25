// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "./IPublicForest.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./interfaces/IRegularSale.sol";
import "./interfaces/IdexRouter.sol";

/** @title PublicForest contract */
contract PublicForest is
    Initializable,
    IPublicForest,
    IERC721Receiver,
    IERC1155Receiver
{
    string public override ipfsHash;
    address public override factory;

    /** NOTE modifier to check msg.sender is factory */
    modifier onlyFactoryAddress() {
        require(msg.sender == factory, "Caller not factoryAddress");
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

    //TODO://sender is mg.sender
    //TODO add  ERC1155Received(address sender,address operator,address from,uint256 id, uint256 value,bytes calldata data)
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    //TODO://sender is mg.sender
    //TODO add  ERC1155BatchReceived(address sender,address operator,address from,uint256[] calldata ids,uint256[] calldata values ,bytes calldata data)
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    //TODO://sender is mg.sender
    //TODO add  ERC721Received(address sender,address operator,address from,uint256 tokenId,bytes calldata data)
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    //TODO://sender is mg.sender and value is msg.value
    //TODO add  Received(address sender,address value)
    receive() external payable {}

    /// @inheritdoc IPublicForest
    function initialize(string memory _ipfsHash, address _factory)
        external
        override
        initializer
    {
        ipfsHash = _ipfsHash;
        factory = _factory;
    }

    /// @inheritdoc IPublicForest
    function updateFactoryAddress(address _factory)
        external
        override
        onlyFactoryAddress
    {
        factory = _factory;
    }

    /// @inheritdoc IPublicForest
    function updateIpfsHash(string memory _ipfsHash)
        external
        override
        onlyFactoryAddress
    {
        ipfsHash = _ipfsHash;
    }

    /// @inheritdoc IPublicForest
    function swapTokenToBaseToken(
        address[] calldata _path,
        address _dexRouter,
        uint256 _minBaseTokenOut
    ) external override onlyFactoryAddress {
        uint256 amount = IERC20(_path[0]).balanceOf(address(this));

        bool success = IERC20(_path[0]).approve(_dexRouter, amount);

        require(success, "Unsuccessful approve");

        IdexRouter(_dexRouter).swapExactTokensForTokens(
            amount,
            _minBaseTokenOut,
            _path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }

    /// @inheritdoc IPublicForest
    function swapMainCoinToBaseToken(
        address[] calldata _path,
        address _dexRouter,
        uint256 _minBaseTokenOut
    ) external override onlyFactoryAddress {
        IdexRouter(_dexRouter).swapExactETHForTokens{
            value: address(this).balance
        }(
            _minBaseTokenOut,
            _path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }

    //TODO: get referral as input and move calculation to factory
    /// @inheritdoc IPublicForest
    function fundTrees(address _baseTokenAddress, address _treejerContract)
        external
        override
        onlyFactoryAddress
    {
        uint256 regularSalePrice = IRegularSale(_treejerContract).price();
        uint256 treeCount = IERC20(_baseTokenAddress).balanceOf(address(this)) /
            regularSalePrice;

        treeCount = treeCount > 50 ? 50 : treeCount;

        IERC20(_baseTokenAddress).approve(
            _treejerContract,
            treeCount * regularSalePrice
        );

        IRegularSale(_treejerContract).fundTree(
            treeCount,
            address(0),
            address(0)
        );
    }

    /// @inheritdoc IPublicForest
    function externalTokenERC721Approve(
        address _token,
        address _to,
        uint256 _tokenId
    ) external override onlyFactoryAddress {
        IERC721(_token).approve(_to, _tokenId);
    }

    /// @inheritdoc IPublicForest
    function externalTokenERC1155Approve(
        address _token,
        address _to,
        bool _approved
    ) external override onlyFactoryAddress {
        IERC1155(_token).setApprovalForAll(_to, _approved);
    }
}
