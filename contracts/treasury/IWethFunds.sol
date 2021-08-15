// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title WethFunds interfce */
interface IWethFunds {
    /**
     * @return true in case of WethFunds contract have been initialized
     */
    function isWethFunds() external view returns (bool);

    /**
     * @return AccessRestriction contract address
     */
    function accessRestriction() external view returns (address);

    /**
     * @return PlanterFund contract address
     */
    function planterFundContract() external view returns (address);

    /**
     * @return WethToken contract address
     */
    function wethToken() external view returns (address);

    /**
     * @return UniswapRouter contract address
     */
    function uniswapRouter() external view returns (address);

    /**
     * @return DaiToken address
     */
    function daiAddress() external view returns (address);

    /**
     * @dev return totalFunds struct data
     * @return treeResearch share
     * @return localDevelop share
     * @return rescueFund share
     * @return treejerDevelop share
     * @return reserveFund1 share
     * @return reserveFund2 share
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

    /**
     * @return treeResearch address
     */
    function treeResearchAddress() external view returns (address);

    /**
     * @return localDevelop address
     */
    function localDevelopAddress() external view returns (address);

    /**
     * @return rescueFund address
     */
    function rescueFundAddress() external view returns (address);

    /**
     * @return treejerDevelop address
     */
    function treejerDevelopAddress() external view returns (address);

    /**
     * @return reserveFund1 address
     */
    function reserveFundAddress1() external view returns (address);

    /**
     * @return reserveFund2 address
     */
    function reserveFundAddress2() external view returns (address);

    /** @dev set {_address} to DaiToken address */
    function setDaiAddress(address _daiAddress) external;

    /** @dev set {_address} to WethToken contract address */
    function setWethTokenAddress(address _wethTokenAddress) external;

    /** @dev set {_address} to UniswapRouter contract address */
    function setUniswapRouterAddress(address _uniswapRouterAddress) external;

    /** @dev set {_address} to PlanterFund contract address */
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
     * @dev fund a tree by  IncrementalSell or Auction contract and based on distribution
     * model of tree, shares divide beetwen (planter, referral, treeResearch,
     * localDevelop, rescueFund, treejerDevelop, reserveFund1 and reserveFund2)
     * and added to the totalFunds of each part,
     * @param _treeId id of a tree to fund
     * NOTE planterFund and referralFund share first swap to daiToken and then
     * transfer to PlanterFund contract and add to totalFund section there
     * NOTE emit a {TreeFunded} event
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
     * NOTE emit a {TreeResearchBalanceWithdrawn} event
     */
    function withdrawTreeResearch(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from localDevelop in {totalFunds} to localDevelopAddress
     * NOTE emit a {LocalDevelopBalanceWithdrawn} event
     */
    function withdrawLocalDevelop(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from rescueFund in {totalFunds} to rescueFundAddress
     * NOTE emit a {RescueBalanceWithdrawn} event
     */
    function withdrawRescueFund(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from treejerDevelop in {totalFunds} to treejerDevelopAddress
     * NOTE emit a {TreejerDevelopBalanceWithdrawn} event
     */
    function withdrawTreejerDevelop(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserveFund1 in {totalFunds} to reserveFundAddress1
     * NOTE emit a {ReserveBalanceWithdrawn1} event
     */
    function withdrawReserveFund1(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev trnasfer {_amount} from reserveFund2 in {totalFunds} to reserveFundAddress2
     * NOTE emit a {ReserveBalanceWithdrawn2} event
     */
    function withdrawReserveFund2(uint256 _amount, string calldata _reason)
        external;

    /**
     * @dev emitted when admin withdraw tree research balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event TreeResearchBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw local develop balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event LocalDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw rescue balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event RescueBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw treejer develop balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event TreejerDevelopBalanceWithdrawn(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw reserve balance1 balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event ReserveBalanceWithdrawn1(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when admin withdraw reserve balance2 balance
     * {amount} is the amount of withdraw balance to {account} with {reason} massage
     */
    event ReserveBalanceWithdrawn2(
        uint256 amount,
        address account,
        string reason
    );

    /**
     * @dev emitted when a tree funded with total amount of {amount} and with
     * planter share of {planterShare}
     * {treeId} is id of tree that is funded
     */
    event TreeFunded(uint256 treeId, uint256 amount, uint256 planterPart);
}
