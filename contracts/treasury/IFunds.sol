// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title Funds interfce */
interface IFunds {
    /**
     * @dev return if Funds contract initialize
     * @return true in case of Funds contract have been initialized
     */
    function isFunds() external view returns (bool);
}
