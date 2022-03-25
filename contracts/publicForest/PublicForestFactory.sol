// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPublicForestFactory.sol";
import "./IPublicForest.sol";
import "./interfaces/ITreejerContract.sol";

/** @title Planter contract */
contract PublicForestFactory is Initializable, IPublicForestFactory {
    /** NOTE {isPublicForestFactory} set inside the initialize to {true} */
    bool public override isPublicForestFactory;

    address[] public override forests;

    mapping(address => address) public override forestToOwners;
    mapping(address => uint256) public override indexOf;
    mapping(address => bool) public override validTokens;

    address public override implementation;
    address public override treejerNftContractAddress;
    address public override baseTokenAddress;
    address public override wmaticAddress;
    address public override treejerContract;
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

    modifier validForestContract(address _forestContractAddress) {
        require(
            forestToOwners[_forestContractAddress] != address(0),
            "Invalid forest address"
        );
        _;
    }

    /** NOTE modifier for check if function is not paused */
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /** NOTE modifier for check msg.sender has TreejerContract role*/
    modifier checkTreejerContractAddress(address _nftContractAddress) {
        require(
            _nftContractAddress != treejerNftContractAddress,
            "Treejer contract"
        );
        _;
    }

    /// @inheritdoc IPublicForestFactory
    function initialize(
        address _accessRestrictionAddress,
        address _wmaticAddress,
        address _baseTokenAddress,
        address _treejerNftContractAddress
    ) external override initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPublicForestFactory = true;
        accessRestriction = candidateContract;

        wmaticAddress = _wmaticAddress;
        baseTokenAddress = _baseTokenAddress;
        treejerNftContractAddress = _treejerNftContractAddress;
    }

    /// @inheritdoc IPublicForestFactory
    function setImplementationAddress(address _implementation)
        external
        override
        onlyAdmin
    {
        implementation = _implementation;
    }

    /// @inheritdoc IPublicForestFactory
    function setBaseTokenAddress(address _baseTokenAddress)
        external
        override
        onlyAdmin
    {
        baseTokenAddress = _baseTokenAddress;
    }

    /// @inheritdoc IPublicForestFactory
    function setTreejerContractAddress(address _treejerContract)
        external
        override
        onlyAdmin
    {
        ITreejerContract candidateContract = ITreejerContract(_treejerContract);
        require(candidateContract.isRegularSale());
        treejerContract = address(candidateContract);
    }

    /// @inheritdoc IPublicForestFactory
    function setDexRouterAddress(address _dexRouter)
        external
        override
        onlyAdmin
    {
        dexRouter = _dexRouter;
    }

    /// @inheritdoc IPublicForestFactory
    function updateFactoryAddress(address _forest, address _factory)
        external
        override
        onlyDataManager
    {
        IPublicForest(_forest).updateFactoryAddress(_factory);
    }

    /// @inheritdoc IPublicForestFactory
    function updateValidTokens(address _token, bool _isValid)
        external
        override
        onlyDataManager
        validAddress(_token)
    {
        validTokens[_token] = _isValid;
    }

    /// @inheritdoc IPublicForestFactory
    function swapTokenToBaseToken(
        address _forest,
        address _token,
        uint256 _minBaseTokenOut
    ) external override validForestContract(_forest) {
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
        validForestContract(_forest)
    {
        IPublicForest(_forest).fundTrees(baseTokenAddress, treejerContract);
    }

    /// @inheritdoc IPublicForestFactory
    function externalTokenERC721Approve(
        address _forest,
        address _token,
        uint256 _tokenId
    )
        external
        override
        validForestContract(_forest)
        checkTreejerContractAddress(_token)
    {
        IPublicForest(_forest).externalTokenERC721Approve(
            _token,
            address(this),
            _tokenId
        );
    }

    /// @inheritdoc IPublicForestFactory
    function externalTokenERC1155Approve(address _forest, address _token)
        external
        override
        validForestContract(_forest)
        checkTreejerContractAddress(_token)
    {
        IPublicForest(_forest).externalTokenERC1155Approve(
            _token,
            address(this),
            true
        );
    }

    /// @inheritdoc IPublicForestFactory
    function createPublicForest(string memory _ipfsHash)
        external
        override
        validAddress(implementation)
    {
        address clone = ClonesUpgradeable.clone(implementation);

        forestToOwners[clone] = msg.sender;
        indexOf[clone] = forests.length;
        forests.push(clone);

        IPublicForest(clone).initialize(_ipfsHash, address(this));
    }

    /// @inheritdoc IPublicForestFactory
    function updateIpfsHash(address _forest, string memory _ipfsHash)
        external
        override
    {
        require(forestToOwners[_forest] == msg.sender, "Not forest owner");

        IPublicForest(_forest).updateIpfsHash(_ipfsHash);
    }
}
