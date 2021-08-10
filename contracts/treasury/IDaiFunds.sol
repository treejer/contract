// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title DaiFunds interfce */
interface IDaiFunds {
    /**
     * @dev return if DaiFunds contract initialize
     * @return true in case of DaiFunds contract have been initialized
     */
    function isDaiFunds() external view returns (bool);

    function maxAssignedIndex() external view returns (bool);

    /**
     * @dev return totalFunds struct data containing {plnaterFund} {referralFund}
     * {treeResearch} {localDevelop} {rescueFund} {treejerDevelop} {reserveFund1}
     * {reserveFund2}
     */
    function totalFunds()
        external
        view
        returns (
            uint256 treeResearch,
            uint256 localDevelop,
            uint256 rescueFund,
            uint256 treejerDevelop,
            uint256 reserveFund1,
            uint256 reserveFund2
        );

    function treeResearchAddress() external view returns (address);

    function localDevelopAddress() external view returns (address);

    function rescueFundAddress() external view returns (address);

    function treejerDevelopAddress() external view returns (address);

    function reserveFundAddress1() external view returns (address);

    function reserveFundAddress2() external view returns (address);

    function setDaiTokenAddress(address _daiTokenAddress) external;

    function setPlanterFundContractAddress(address _address) external;

    /**
     * @dev set {_address} to treeResearchAddress
     */
    function setTreeResearchAddress(address payable _address) external;

    /**
     * @dev set {_address} to localDevelopAddress
     */
    function setLocalDevelopAddress(address payable _address) external;

    /**
     * @dev set {_address} to rescueFundAddress
     */
    function setRescueFundAddress(address payable _address) external;

    /**
     * @dev set {_address} to treejerDevelopAddress
     */
    function setTreejerDevelopAddress(address payable _address) external;

    /**
     * @dev set {_address} to reserveFundAddress1
     */
    function setReserveFund1Address(address payable _address) external;

    /**
     * @dev set {_address} to reserveFundAddress2
     */
    function setReserveFund2Address(address payable _address) external;

    /**
     * @dev calculate shares based on fundDistributionModel of tree and add to related totalFunds
     * NOTE must call by Auctiion or RegularSell
     */
    function fundTree(
        uint256 _treeId,
        uint256 _amount,
        uint16 _planterFund,
        uint16 _referralFund,
        uint16 _treeResearch,
        uint16 _localDevelop,
        uint16 _rescueFund,
        uint16 _treejerDevelop,
        uint16 _reserveFund1,
        uint16 _reserveFund2
    ) external;

    /**
     * @dev trnasfer {_amount} from treeResearch in {totalFunds} to treeResearchAddress
     */
    function withdrawTreeResearch(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from localDevelop in {totalFunds} to localDevelopAddress
     */
    function withdrawLocalDevelop(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from rescueFund in {totalFunds} to rescueFundAddress
     */
    function withdrawRescueFund(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from treejerDevelop in {totalFunds} to treejerDevelopAddress
     */
    function withdrawTreejerDevelop(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserveFund1 in {totalFunds} to reserveFundAddress1
     */
    function withdrawReserveFund1(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserveFund2 in {totalFunds} to reserveFundAddress2
     */
    function withdrawReserveFund2(uint256 _amount, string calldata _reason)
        external;

    event TreeResearchBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event LocalDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event RescueBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event TreejerDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );
    event ReserveBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );
    event ReserveBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );
}