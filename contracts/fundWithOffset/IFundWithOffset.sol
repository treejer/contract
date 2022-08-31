// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

/** @title IFundWithOffset */

interface IFundWithOffset {
    /** @dev emitted when offset funded
     * @param sender who pay for offset
     * @param recipient who receive offset
     * @param offsetPrice amount of dai token want to swap to carbon token
     * @param dexRouter dexRouter address
     * @param path swap path from dai -> carbon token
     * @param minDaiOut minimum expected amount to recieve
     */
    event OffsetFunded(
        address sender,
        address recipient,
        uint256 offsetPrice,
        address dexRouter,
        address[] path,
        uint256 minDaiOut
    );

    /** @dev emitted when regular trees funded with offset
     * @param sender who pay for total price of trees + offset
     * @param recipient who receive trees and offset
     * @param amount total amount of trees + offset that {sender} pays
     */
    event TreeFundedWithOffset(
        address sender,
        address recipient,
        uint256 amount
    );

    /**
     * @dev initialize accessRestriction contract and set true for isFundWithOffset
     * @param _accessRestrictionAddress is address of accessRestriction contract
     */
    function initialize(address _accessRestrictionAddress) external;

    /** @dev admin set RegularSale contract address
     *  @param _address is address of RegularSale contract
     */
    function setRegularSaleAddress(address _address) external;

    /** @dev admin set DaiToken contract address
     *  @param _daiTokenAddress is address of DaiToken contract
     */
    function setDaiTokenAddress(address _daiTokenAddress) external;

    function setAggregatorAddress(address _aggregator) external;

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
    ) external;

    /** @return true in case of FundWithOffset contract have been initialized */
    function isFundWithOffset() external view returns (bool);
}
