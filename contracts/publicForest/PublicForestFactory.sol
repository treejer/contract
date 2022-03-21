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
    address[] public override forests;
    mapping(address => address) public override forestToOwners;
    mapping(address => uint256) public override indexOf;
    mapping(address => bool) public override validTokens;
    mapping(address => address) public override forestCreators;
    address public override implementation;
    address public override treejerNftContractAddress;
    address public override daiAddress;
    address public override wmaticAddress;
    address public override treejerContract;
    address public override dexRouter;

    /** NOTE {isPublicForestFactory} set inside the initialize to {true} */
    bool public override isPublicForestFactory;

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

    /// @inheritdoc IPublicForestFactory
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isPublicForestFactory = true;
        accessRestriction = candidateContract;

        treejerNftContractAddress = 0x3aBbc23F3303EF36fd9f6CEC0e585b2C23e47FD9;
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

    function setDaiTokenAddress(address _daiTokenAddress)
        external
        override
        onlyAdmin
    {
        daiAddress = _daiTokenAddress;
    }

    function updateFactoryAddress(
        address _contractAddress,
        address _proxyAddress
    ) external override onlyDataManager {
        IPublicForest(_contractAddress).updateFactoryAddress(_proxyAddress);
    }

    function updateIpfsHash(address _contractAddress, string memory _ipfs)
        external
        override
    {
        IPublicForest(_contractAddress).updateIpfsHash(_ipfs);
    }

    function updateValidTokens(address _tokenAddress, bool _isValid)
        external
        override
        onlyDataManager
        validAddress(_tokenAddress)
    {
        validTokens[_tokenAddress] = _isValid;
    }

    function swapTokenToDai(
        address _contractAddress,
        address _tokenAddress,
        uint256 _leastDai
    ) external override {
        require(validTokens[_tokenAddress], "Invalid token");

        IPublicForest(_contractAddress).swapTokenToDAI(
            _tokenAddress,
            _leastDai > 2 ? _leastDai : 2,
            daiAddress,
            dexRouter
        );
    }

    function swapMainCoinToDai(address _contractAddress, uint256 _leastDai)
        external
        override
    {
        IPublicForest(_contractAddress).swapMainCoinToDAI(
            _leastDai > 2 ? _leastDai : 2,
            daiAddress,
            wmaticAddress,
            dexRouter
        );
    }

    function fundTrees(address _contractAddress) external override {
        IPublicForest(_contractAddress).fundTrees(daiAddress, treejerContract);
    }

    function externalTokenERC721Approve(
        address _contractAddress,
        address _nftContractAddress,
        uint256 _tokenId
    ) external override {
        require(
            _nftContractAddress != treejerNftContractAddress,
            "Treejer contract"
        );

        IPublicForest(_contractAddress).externalTokenERC721Approve(
            _nftContractAddress,
            _tokenId,
            address(this)
        );
    }

    function externalTokenERC1155Approve(
        address _contractAddress,
        address _nftContractAddress
    ) external override {
        IPublicForest(_contractAddress).externalTokenERC1155Approve(
            _nftContractAddress,
            true,
            address(this)
        );
    }

    function createPublicForest(string memory _ipfsHash) external override {
        address cloneAddress = ClonesUpgradeable.clone(implementation);

        IPublicForest(cloneAddress).initialize(_ipfsHash, address(this));
        _set(cloneAddress);
    }

    function _set(address _value) internal {
        forestToOwners[_value] = msg.sender;
        indexOf[_value] = forests.length;
        forests.push(_value);
    }
}
