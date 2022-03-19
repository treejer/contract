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
    address[] public forests;
    mapping(address => address) public forestToOwners;
    mapping(address => uint256) public indexOf;
    mapping(address => bool) public validTokens;
    mapping(address => address) public forestCreators;
    address public implementation;
    address public treejerNftContractAddress;
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

    function updateFactoryAddress(
        address _contractAddress,
        address _proxyAddress
    ) external override onlyDataManager {
        IPublicForest(_contractAddress).updateFactoryAddress(_proxyAddress);
    }

    function updateImplementationAddress(address _implementation)
        external
        onlyDataManager
    {
        implementation = _implementation;
    }

    function setTreejerContractAddress(address _address)
        external
        override
        onlyDataManager
    {
        ITreejerContract candidateContract = ITreejerContract(_address);
        require(candidateContract.isRegularSale());
        treejerContract = address(candidateContract);
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
            treejerContract
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
            treejerContract
        );
    }

    function fundTrees(address _contractAddress) external override {
        IPublicForest(_contractAddress).fundTrees(daiAddress, treejerContract);
    }

    function externalTokenERC721Approve(
        address _contractAddress,
        address nftContractAddress,
        uint256 _tokenId
    ) external override {
        IPublicForest(_contractAddress).externalTokenERC721Approve(
            nftContractAddress,
            _tokenId,
            address(this)
        );
    }

    function externalTokenERC1155Approve(
        address _contractAddress,
        address nftContractAddress
    ) external override {
        IPublicForest(_contractAddress).externalTokenERC1155Approve(
            nftContractAddress,
            true,
            address(this)
        );
    }

    function createPublicForest(string memory _ipfsHash) external override {
        address cloneAddress = ClonesUpgradeable.clone(
            address(accessRestriction)
        );
        IPublicForest(cloneAddress).initialize(_ipfsHash, address(this));
        _set(cloneAddress);
    }

    function _set(address _value) internal {
        forestToOwners[_value] = msg.sender;
        indexOf[_value] = forests.length;
        forests.push(_value);
    }
}
