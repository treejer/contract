// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

interface ICarbonRetirementAggregator {
    function retireCarbon(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage
    ) external;

    function retireCarbonSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon,
        address _beneficiaryAddress,
        string memory _retiringEntityString,
        string memory _beneficiaryString,
        string memory _retirementMessage,
        address[] memory _carbonList
    ) external;

    function getSourceAmount(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon
    ) external view returns (uint256);

    function getSourceAmountSpecific(
        address _sourceToken,
        address _poolToken,
        uint256 _amount,
        bool _amountInCarbon
    ) external view returns (uint256);
}
