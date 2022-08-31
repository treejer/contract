// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IFundWithOffset.sol";
import "../access/IAccessRestriction.sol";
import "../regularSale/IRegularSale.sol";
import "./../treasury/interfaces/IUniswapV2Router02New.sol";

import "../aggregator/interfaces/ICarbonRetirementAggregator.sol";

/** @title FundWithOffset */

contract FundWithOffset is IFundWithOffset, Initializable {
    IAccessRestriction public accessRestriction;
    IRegularSale public regularSale;
    IERC20Upgradeable public daiToken;
    ICarbonRetirementAggregator public aggregator;

    /// @inheritdoc IFundWithOffset
    bool public override isFundWithOffset;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(msg.sender);
        _;
    }

    /// @inheritdoc IFundWithOffset
    function initialize(address _accessRestrictionAddress)
        external
        override
        initializer
    {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );

        require(candidateContract.isAccessRestriction());

        isFundWithOffset = true;

        accessRestriction = candidateContract;
    }

    /// @inheritdoc IFundWithOffset
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        override
        onlyAdmin
        validAddress(_daiTokenAddress)
    {
        daiToken = IERC20Upgradeable(_daiTokenAddress);
    }

    function setAggregatorAddress(address _aggregator)
        external
        override
        onlyAdmin
        validAddress(_aggregator)
    {
        ICarbonRetirementAggregator candidateContract = ICarbonRetirementAggregator(
                _aggregator
            );

        if (address(aggregator) != address(0)) {
            bool approveRevoked = daiToken.approve(address(aggregator), 0);
            require(approveRevoked, "success");
        }

        aggregator = candidateContract;

        bool approveSet = daiToken.approve(
            address(aggregator),
            type(uint256).max
        );
        require(approveSet, "success");
    }

    /// @inheritdoc IFundWithOffset
    function setRegularSaleAddress(address _address)
        external
        override
        onlyAdmin
    {
        IRegularSale candidateContract = IRegularSale(_address);

        require(candidateContract.isRegularSale());

        if (address(regularSale) != address(0)) {
            bool approveRevoked = daiToken.approve(address(regularSale), 0);
            require(approveRevoked, "success");
        }

        regularSale = candidateContract;

        bool approveSet = daiToken.approve(
            address(regularSale),
            type(uint256).max
        );
        require(approveSet, "success");
    }

    /// @inheritdoc IFundWithOffset
    function fundTreeWithOffset(
        uint256 _count,
        address _referrer,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        string memory _retiringEntityString
    ) external override {
        uint256 sourceAmount = aggregator.getSourceAmount(
            address(daiToken),
            _poolToken,
            _amount,
            _amountInCarbon
        );
        uint256 total = regularSale.price() * _count + sourceAmount;
        require(
            daiToken.balanceOf(msg.sender) >= total,
            "Offset: Insufficient balance"
        );
        bool success = daiToken.transferFrom(msg.sender, address(this), total);
        require(success, "Offset: Unsuccessful transfer");
        address beneficiaryAddress = _beneficiaryAddress != address(0)
            ? _beneficiaryAddress
            : msg.sender;
        regularSale.fundTree(_count, _referrer, beneficiaryAddress);
        aggregator.retireCarbon(
            address(daiToken),
            _poolToken,
            _amount,
            _amountInCarbon,
            beneficiaryAddress,
            _retiringEntityString,
            _beneficiaryString,
            _retirementMessage
        );
    }

    function fundTreeWithSpecialOffset(
        uint256 _count,
        address _referrer,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        string memory _retiringEntityString,
        address[] memory _carbonList
    ) external {
        uint256 sourceAmount = aggregator.getSourceAmountSpecific(
            address(daiToken),
            _poolToken,
            _amount,
            _amountInCarbon
        );

        uint256 total = regularSale.price() * _count + sourceAmount;

        require(
            daiToken.balanceOf(msg.sender) >= total,
            "Offset: Insufficient balance"
        );

        bool success = daiToken.transferFrom(msg.sender, address(this), total);

        require(success, "Offset: Unsuccessful transfer");

        address beneficiaryAddress = _beneficiaryAddress != address(0)
            ? _beneficiaryAddress
            : msg.sender;

        regularSale.fundTree(_count, _referrer, beneficiaryAddress);

        aggregator.retireCarbonSpecific(
            address(daiToken),
            _poolToken,
            _amount,
            _amountInCarbon,
            beneficiaryAddress,
            _retiringEntityString,
            _beneficiaryString,
            _retirementMessage,
            _carbonList
        );
    }
}
