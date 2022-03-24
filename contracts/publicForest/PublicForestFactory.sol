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
    modifier onlyTreejerContract() {
        accessRestriction.ifTreejerContract(msg.sender);
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

    function setTreejerContractAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreejerContract candidateContract = ITreejerContract(_address);
        require(candidateContract.isRegularSale());
        treejerContract = address(candidateContract);
    }

    function setImplementationAddress(address _implementation)
        external
        override
        onlyAdmin
    {
        implementation = _implementation;
    }

    function setDexRouterAddress(address _dexRouter)
        external
        override
        onlyAdmin
    {
        dexRouter = _dexRouter;
    }

    function setBaseTokenAddress(address _baseTokenAddress)
        external
        override
        onlyAdmin
    {
        baseTokenAddress = _baseTokenAddress;
    }

    function updateFactoryAddress(
        address _contractAddress,
        address _proxyAddress
    ) external override onlyDataManager {
        IPublicForest(_contractAddress).updateFactoryAddress(_proxyAddress);
    }

    function updateValidTokens(address _tokenAddress, bool _isValid)
        external
        override
        onlyDataManager
        validAddress(_tokenAddress)
    {
        validTokens[_tokenAddress] = _isValid;
    }

    function swapTokenToBaseToken(
        address _contractAddress,
        address _tokenAddress,
        uint256 _minBaseTokenOut
    ) external override validForestContract(_contractAddress) {
        require(validTokens[_tokenAddress], "Invalid token");

        IPublicForest(_contractAddress).swapTokenToBaseToken(
            dexRouter,
            _tokenAddress,
            baseTokenAddress,
            _minBaseTokenOut > 2 ether ? _minBaseTokenOut : 2 ether
        );
    }

    function swapMainCoinToBaseToken(
        address _contractAddress,
        uint256 _minBaseTokenOut
    ) external override validForestContract(_contractAddress) {
        IPublicForest(_contractAddress).swapMainCoinToBaseToken(
            dexRouter,
            wmaticAddress,
            baseTokenAddress,
            _minBaseTokenOut > 2 ether ? _minBaseTokenOut : 2 ether
        );
    }

    function fundTrees(address _contractAddress)
        external
        override
        validForestContract(_contractAddress)
    {
        IPublicForest(_contractAddress).fundTrees(
            baseTokenAddress,
            treejerContract
        );
    }

    function externalTokenERC721Approve(
        address _forest,
        address _tokenAddress,
        uint256 _tokenId
    )
        external
        override
        validForestContract(_forest)
        checkTreejerContractAddress(_tokenAddress)
    {
        IPublicForest(_forest).externalTokenERC721Approve(
            _tokenAddress,
            address(this),
            _tokenId
        );
    }

    function externalTokenERC1155Approve(address _forest, address _tokenAddress)
        external
        override
        validForestContract(_forest)
        checkTreejerContractAddress(_tokenAddress)
    {
        IPublicForest(_forest).externalTokenERC1155Approve(
            _tokenAddress,
            address(this),
            true
        );
    }

    function createPublicForest(string memory _ipfsHash)
        external
        override
        validAddress(implementation)
    {
        address cloneAddress = ClonesUpgradeable.clone(implementation);

        IPublicForest(cloneAddress).initialize(_ipfsHash, address(this));
        _set(cloneAddress);
    }

    function updateIpfsHash(address _contractAddress, string memory _ipfs)
        external
        override
    {
        IPublicForest(_contractAddress).updateIpfsHash(_ipfs);
    }

    function _set(address _value) internal {
        forestToOwners[_value] = msg.sender;
        indexOf[_value] = forests.length;
        forests.push(_value);
    }
}
