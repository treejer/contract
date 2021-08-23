//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../treasury/IDaiFunds.sol";
import "../treasury/IFinancialModel.sol";
import "../gsn/RelayRecipient.sol";

/** @title RegularSell contract */
contract RegularSell is Initializable, RelayRecipient {
    uint256 public lastSoldRegularTree;
    uint256 public treePrice;

    /** NOTE {isRegularSell} set inside the initialize to {true} */
    bool public isRegularSell;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IDaiFunds public daiFunds;
    IFinancialModel public financialModel;
    IERC20Upgradeable public daiToken;

    event TreePriceUpdated(uint256 price);
    event RegularTreeRequsted(uint256 count, address buyer, uint256 amount);
    event RegularMint(address buyer, uint256 treeId);
    event RegularTreeRequstedById(
        uint256 treeId,
        address buyer,
        uint256 amount
    );

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isRegularSell
     * set {_price} to tree price and set 10000 to lastSoldRegularTree
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _price initial tree price
     */
    function initialize(address _accessRestrictionAddress, uint256 _price)
        external
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        isRegularSell = true;
        lastSoldRegularTree = 10000;
        treePrice = _price;
        emit TreePriceUpdated(_price);
    }

    /**
     * @dev admin set trusted forwarder address
     * @param _address set to {trustedForwarder}
     */
    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    //TODO: ADD_COMMENTS
    function setLastSoldRegularTree(uint256 _lastSoldRegularTree)
        external
        onlyDataManager
    {
        require(
            _lastSoldRegularTree >= lastSoldRegularTree,
            "Input must be gt last tree sold"
        );

        lastSoldRegularTree = _lastSoldRegularTree;
    }

    /** @dev admin set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev admin set daiFunds contract address
     * @param _address daiFunds contract address
     */
    function setDaiFundsAddress(address _address) external onlyAdmin {
        IDaiFunds candidateContract = IDaiFunds(_address);

        require(candidateContract.isDaiFunds());

        daiFunds = candidateContract;
    }

    /** @dev admin set daiToken contract address
     * @param _address daiToken contract address
     */
    function setDaiTokenAddress(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /**
     * @dev admin set FinancialModel contract address
     * @param _address set to the address of financialModel
     */
    function setFinancialModelAddress(address _address) external onlyAdmin {
        IFinancialModel candidateContract = IFinancialModel(_address);
        require(candidateContract.isFinancialModel());
        financialModel = candidateContract;
    }

    /** @dev admin set the price of trees that are sold regular
     * @param _price price of tree
     */
    function setPrice(uint256 _price) external onlyDataManager {
        treePrice = _price;
        emit TreePriceUpdated(_price);
    }

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     */
    function requestTrees(uint256 _count) external {
        require(_count > 0, "invalid count");

        uint256 amount = treePrice * _count;

        require(daiToken.balanceOf(_msgSender()) >= amount, "invalid amount");

        uint256 tempLastRegularSold = lastSoldRegularTree;

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            amount
        );

        require(success, "unsuccessful transfer");

        emit RegularTreeRequsted(_count, _msgSender(), amount);

        for (uint256 i = 0; i < _count; i++) {
            tempLastRegularSold = treeFactory.mintRegularTrees(
                tempLastRegularSold,
                _msgSender()
            );

            (
                uint16 planterFund,
                uint16 referralFund,
                uint16 treeResearch,
                uint16 localDevelop,
                uint16 rescueFund,
                uint16 treejerDevelop,
                uint16 reserveFund1,
                uint16 reserveFund2
            ) = financialModel.findTreeDistribution(tempLastRegularSold);

            daiFunds.fundTree(
                tempLastRegularSold,
                treePrice,
                planterFund,
                referralFund,
                treeResearch,
                localDevelop,
                rescueFund,
                treejerDevelop,
                reserveFund1,
                reserveFund2
            );

            emit RegularMint(_msgSender(), tempLastRegularSold);
        }

        lastSoldRegularTree = tempLastRegularSold;
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to
     * make sure that has not been sold before
     * @param _treeId is the id of tree requested by user
     */
    function requestByTreeId(uint256 _treeId) external {
        require(_treeId > lastSoldRegularTree, "invalid tree");

        require(
            daiToken.balanceOf(_msgSender()) >= treePrice,
            "invalid amount"
        );

        bool success = daiToken.transferFrom(
            _msgSender(),
            address(daiFunds),
            treePrice
        );

        require(success, "unsuccessful transfer");

        treeFactory.requestRegularTree(_treeId, _msgSender());

        (
            uint16 planterFund,
            uint16 referralFund,
            uint16 treeResearch,
            uint16 localDevelop,
            uint16 rescueFund,
            uint16 treejerDevelop,
            uint16 reserveFund1,
            uint16 reserveFund2
        ) = financialModel.findTreeDistribution(_treeId);

        daiFunds.fundTree(
            _treeId,
            treePrice,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

        emit RegularTreeRequstedById(_treeId, _msgSender(), treePrice);
    }
}
