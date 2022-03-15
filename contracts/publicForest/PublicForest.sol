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
import "./../regularSale/IRegularSale.sol";
import "../treasury/interfaces/IUniswapV2Router02New.sol";

/** @title PublicForest contract */
contract PublicForest is
    Initializable,
    IPublicForest,
    IERC721Receiver,
    IERC1155Receiver
{
    string public override ipfsHash;
    address public override factoryAddress;
    address public override daiAddress;
    address public override wmaticAddress;

    IUniswapV2Router02New public dexRouter;

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

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {}

    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {}

    receive() external payable {}

    function initialize(string memory _ipfsHash, address _factoryAddress)
        external
        override
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
    {
        _swapExactTokensForTokens(_tokenAddress, _leastDai);
    }

    function swapMainCoinToDAI(uint256 _leastDai)
        external
        override
        onlyFactoryAddress
    {
        _swapExactETHForTokens(_leastDai);
    }

    function fundTrees() external override onlyFactoryAddress {
        uint256 regularSalePrice = regularSale.price();
        uint256 treeCount = IERC20(daiAddress).balanceOf(address(this)) /
            regularSalePrice;

        treeCount = treeCount > 50 ? 50 : treeCount;

        IERC721(daiAddress).approve(
            address(regularSale),
            treeCount * regularSalePrice
        );

        regularSale.fundTree(treeCount, address(0), address(0));
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
        uint256 _minDaiOut
    ) private {
        address[] memory path;
        path = new address[](2);

        path[0] = _tokenAddress;
        path[1] = daiAddress;

        uint256 amount = IERC20(_tokenAddress).balanceOf(_tokenAddress);

        bool success = IERC20(_tokenAddress).approve(
            address(dexRouter),
            amount
        );

        require(success, "Unsuccessful approve");

        dexRouter.swapExactTokensForTokens(
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
    function _swapExactETHForTokens(uint256 _minDaiOut) private {
        address[] memory path;
        path = new address[](2);

        path[0] = wmaticAddress;
        path[1] = daiAddress;

        dexRouter.swapExactETHForTokens{value: address(this).balance}(
            _minDaiOut,
            path,
            address(this),
            block.timestamp + 1800 // 30 * 60 (30 min)
        );
    }
}
