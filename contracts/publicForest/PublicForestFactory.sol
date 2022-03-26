// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPublicForestFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPublicForest.sol";
import "./interfaces/IRegularSale.sol";

/** @title PublicForestFactory contract */
contract PublicForestFactory is Initializable, IPublicForestFactory {
    /** NOTE {isPublicForestFactory} set inside the initialize to {true} */
    bool public override isPublicForestFactory;

    /** NOTE forest address */
    address[] public override forests;

    /** NOTE mapping of forest address to forest creator */
    mapping(address => address) public override forestToCreators;
    /** NOTE mapping of forest address to its index in forests array */
    mapping(address => uint256) public override indexOf;
    /** NOTE mapping of token address to if it's valid or not*/
    mapping(address => bool) public override validTokens;

    address public override implementation;

    address public override treeTokenAddress;
    address public override baseTokenAddress;
    address public override wmaticAddress;
    address public override regularSaleAddress;
    address public override dexRouter;

    IAccessRestriction public accessRestriction;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /** NOTE modifier to check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier to check given address is a valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /** NOTE modifier to check given address is a valid forest address*/
    modifier validForestContract(address _forest) {
        require(
            forestToCreators[_forest] != address(0),
            "Invalid forest address"
        );
        _;
    }

    /** NOTE modifier to check given address is not treejerContraact address*/
    modifier checkTreeTokenAddress(address _token) {
        require(_token != treeTokenAddress, "Treejer contract");
        _;
    }

    /// @inheritdoc IPublicForestFactory
    function initialize(
        address _accessRestrictionAddress,
        address _wmaticAddress,
        address _baseTokenAddress,
        address _treeTokenAddress
    ) external override initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPublicForestFactory = true;
        accessRestriction = candidateContract;

        wmaticAddress = _wmaticAddress;
        baseTokenAddress = _baseTokenAddress;
        treeTokenAddress = _treeTokenAddress;
    }

    /// @inheritdoc IPublicForestFactory
    function setImplementationAddress(address _implementation)
        external
        override
        onlyAdmin
    {
        implementation = _implementation;
        emit ImplementationAddressUpdated(_implementation);
    }

    /// @inheritdoc IPublicForestFactory
    function setBaseTokenAddress(address _baseTokenAddress)
        external
        override
        onlyAdmin
    {
        baseTokenAddress = _baseTokenAddress;

        emit BaseTokenAddressUpdated(_baseTokenAddress);
    }

    /// @inheritdoc IPublicForestFactory
    function setRegularSaleAddress(address _regularSaleAddress)
        external
        override
        onlyAdmin
    {
        IRegularSale candidateContract = IRegularSale(_regularSaleAddress);
        require(candidateContract.isRegularSale());
        regularSaleAddress = address(candidateContract);
    }

    /// @inheritdoc IPublicForestFactory
    function setDexRouterAddress(address _dexRouter)
        external
        override
        onlyAdmin
    {
        dexRouter = _dexRouter;
        emit DexRouterAddressUpdated(_dexRouter);
    }

    /// @inheritdoc IPublicForestFactory
    function updateFactoryAddress(address _forest, address _factory)
        external
        override
        onlyAdmin
        validForestContract(_forest)
    {
        IPublicForest(_forest).updateFactoryAddress(_factory);
        emit FactoryAddressUpdated(_forest, _factory);
    }

    /// @inheritdoc IPublicForestFactory
    function updateValidTokens(address _token, bool _isValid)
        external
        override
        ifNotPaused
        onlyDataManager
        validAddress(_token)
    {
        validTokens[_token] = _isValid;
        emit ValidTokensUpdated(_token, _isValid);
    }

    /// @inheritdoc IPublicForestFactory
    function swapTokenToBaseToken(
        address _forest,
        address _token,
        uint256 _minBaseTokenOut
    ) external override ifNotPaused validForestContract(_forest) {
        require(validTokens[_token], "Invalid token");

        address[] memory path;
        path = new address[](2);

        path[0] = _token;
        path[1] = baseTokenAddress;

        IPublicForest(_forest).swapTokenToBaseToken(
            path,
            dexRouter,
            _minBaseTokenOut > 2 ether ? _minBaseTokenOut : 2 ether
        );
    }

    /// @inheritdoc IPublicForestFactory
    function swapMainCoinToBaseToken(address _forest, uint256 _minBaseTokenOut)
        external
        override
        ifNotPaused
        validForestContract(_forest)
    {
        address[] memory path;
        path = new address[](2);

        path[0] = wmaticAddress;
        path[1] = baseTokenAddress;

        IPublicForest(_forest).swapMainCoinToBaseToken(
            path,
            dexRouter,
            _minBaseTokenOut > 2 ether ? _minBaseTokenOut : 2 ether
        );
    }

    /// @inheritdoc IPublicForestFactory
    function fundTrees(address _forest)
        external
        override
        ifNotPaused
        validForestContract(_forest)
    {
        uint256 regularSalePrice = IRegularSale(regularSaleAddress).price();
        uint256 treeCount = IERC20(baseTokenAddress).balanceOf(_forest) /
            regularSalePrice;

        treeCount = treeCount > 50 ? 50 : treeCount;

        IPublicForest(_forest).fundTrees(
            baseTokenAddress,
            regularSaleAddress,
            treeCount,
            regularSalePrice,
            address(0)
        );
    }

    /// @inheritdoc IPublicForestFactory
    function externalTokenERC721Approve(
        address _forest,
        address _token,
        uint256 _tokenId
    )
        external
        override
        ifNotPaused
        validForestContract(_forest)
        checkTreeTokenAddress(_token)
    {
        IPublicForest(_forest).externalTokenERC721Approve(
            _token,
            address(this),
            _tokenId
        );
        emit ERC721Approved(_forest, _token, _tokenId);
    }

    /// @inheritdoc IPublicForestFactory
    function externalTokenERC1155Approve(address _forest, address _token)
        external
        override
        ifNotPaused
        validForestContract(_forest)
        checkTreeTokenAddress(_token)
    {
        IPublicForest(_forest).externalTokenERC1155Approve(
            _token,
            address(this),
            true
        );
        emit ERC1155Approved(_forest, _token);
    }

    /// @inheritdoc IPublicForestFactory
    function createPublicForest(string memory _ipfsHash)
        external
        override
        ifNotPaused
        validAddress(implementation)
    {
        address clone = ClonesUpgradeable.clone(implementation);

        forestToCreators[clone] = msg.sender;
        indexOf[clone] = forests.length;
        forests.push(clone);

        IPublicForest(clone).initialize(_ipfsHash, address(this));
        emit PublicForestCreated(clone, _ipfsHash);
    }

    /// @inheritdoc IPublicForestFactory
    function updateIpfsHash(address _forest, string memory _ipfsHash)
        external
        override
        ifNotPaused
    {
        require(forestToCreators[_forest] == msg.sender, "Not forest owner");

        IPublicForest(_forest).updateIpfsHash(_ipfsHash);
        emit IpfsHashUpdated(_forest, _ipfsHash);
    }
}
