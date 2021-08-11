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

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    function initialize(address _accessRestrictionAddress, uint256 _price)
        public
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

    function setTrustedForwarder(address _address) external onlyAdmin {
        trustedForwarder = _address;
    }

    /** @dev set treeFactory contract address
     * @param _address treeFactory contract address
     */
    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);

        require(candidateContract.isTreeFactory());

        treeFactory = candidateContract;
    }

    /** @dev set daiFunds contract address
     * @param _address daiFunds contract address
     */
    function setDaiFundsAddress(address _address) external onlyAdmin {
        IDaiFunds candidateContract = IDaiFunds(_address);

        require(candidateContract.isDaiFunds());

        daiFunds = candidateContract;
    }

    /** @dev set daiToken contract address
     * @param _address daiToken contract address
     */
    function setDaiTokenAddress(address _address) external onlyAdmin {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(_address);
        daiToken = candidateContract;
    }

    /**
     * @dev admin set FinancialModelAddress
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
    function setPrice(uint256 _price) external onlyAdmin {
        treePrice = _price;
        emit TreePriceUpdated(_price);
    }

    /** @dev request {_count} trees and the paid amount must be more than
     * {_count * treePrice }
     * @param _count is the number of trees requested by user
     */
    function requestTrees(uint256 _count, uint256 _amount) external {
        require(_count > 0, "invalid count");

        require(
            _amount >= treePrice * _count &&
                daiToken.balanceOf(_msgSender()) >= _amount,
            "invalid amount"
        );

        uint256 tempLastRegularSold = lastSoldRegularTree;

        uint256 transferAmount = _amount / _count;

        daiToken.transferFrom(_msgSender(), address(daiFunds), _amount);

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
                transferAmount,
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

        emit RegularTreeRequsted(_count, _msgSender(), _amount);
    }

    /** @dev request  tree with id {_treeId} and the paid amount must be more than
     * {treePrice} and the {_treeId} must be more than {lastSoldRegularTree} to make sure that
     * has not been sold before
     * @param _treeId is the id of tree requested by user
     */
    function requestByTreeId(uint256 _treeId, uint256 _amount) external {
        require(_treeId > lastSoldRegularTree, "invalid tree");

        require(
            _amount >= treePrice && daiToken.balanceOf(_msgSender()) >= _amount,
            "invalid amount"
        );

        daiToken.transferFrom(_msgSender(), address(daiFunds), _amount);

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
            _amount,
            planterFund,
            referralFund,
            treeResearch,
            localDevelop,
            rescueFund,
            treejerDevelop,
            reserveFund1,
            reserveFund2
        );

        emit RegularTreeRequstedById(_treeId, _msgSender(), _amount);
    }
}
