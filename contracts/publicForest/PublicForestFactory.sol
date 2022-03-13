// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "../access/IAccessRestriction.sol";
import "./IPublicForestFactory.sol";
import "./IPublicForest.sol";

/** @title Planter contract */
contract PublicForestFactory is Initializable, IPublicForestFactory {
    address[] public forests;
    mapping(address => address) public forestToOwners;
    mapping(address => uint256) public indexOf;
    mapping(address => bool) public validTokens;
    mapping(address => address) public forestCreators;

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
    }

    function updateFactoryAddress(
        address _contractAddress,
        address _proxyAddress
    ) external onlyDataManager {
        IPublicForest(_contractAddress).updateFactoryAddress(_proxyAddress);
    }

    function updateIpfsHash(address _contractAddress, string memory _ipfs)
        external
    {
        IPublicForest(_contractAddress).updateIpfsHash(_ipfs);
    }

    function updateValidTokens(address _tokenAddress, bool _isValid)
        external
        onlyDataManager
    {
        validTokens[_tokenAddress] = _isValid;
    }

    function swapTokenToDai(
        address _contractAddress,
        address _tokenAddress,
        uint256 _leastDai
    ) external {
        require(validTokens[_tokenAddress], "Invalid token");

        IPublicForest(_contractAddress).swapTokenToDAI(
            _tokenAddress,
            _leastDai > 2 ? _leastDai : 2
        );
    }

    function swapMainCoinToDai(
        address _contractAddress,
        uint256 _amount,
        uint256 _leastDai
    ) external {
        IPublicForest(_contractAddress).swapMainCoinToDAI(
            _leastDai > 2 ? _leastDai : 2
        );
    }

    function fundTrees(address _contractAddress) external {
        IPublicForest(_contractAddress).fundTrees();
    }

    function externalNFTApprove(
        address _contractAddress,
        uint8 _nftType,
        address nftContractAddress,
        uint256 _tokenId,
        uint256 _amount,
        address _destinationAddress
    ) external {}

    function createPublicForest(string memory _ipfsHash) external {
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
