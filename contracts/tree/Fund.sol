// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./TreeSale.sol";
import "./TreeFactory.sol";
import "./UpdateFactory.sol";
import "../greenblock/GBFactory.sol";
import "../access/AccessRestriction.sol";

contract Fund is TreeFactory {
    
    event TreeFunded(uint256 treeId, uint256 planterBalance, uint256 ambassadorBalance, uint256 totalFund, address owner);
    event PlanterBalanceWithdrawn(address planter, uint amount);
    event AmbassadorBalanceWithdrawn(address ambassador, uint amount);

    event Debug(uint256 data);

    uint256 public lastFundedTreeIndex;

    // TreeFactory public treeFactory;
    TreeSale public treeSale;
    GBFactory public gbFactory;
    UpdateFactory public updateFactory;

    uint256 constant treejerPercentage = 25;
    uint256 constant planterPercentage = 40;
    uint256 constant ambassadorPercentage = 5;
    uint256 constant localDevelopmentFundPercentage = 15;
    uint256 constant rescueFundPercentage = 10;
    uint256 constant researchFundPercentage = 5;

    uint8 constant treejerIndex = 0;
    uint8 constant planterIndex = 1;
    uint8 constant ambassadorIndex = 2;
    uint8 constant localDevelopmentFundIndex = 3;
    uint8 constant rescueFundIndex = 4;
    uint8 constant researchFundIndex = 5;

    // i common year 31536000 seconds * 3 year 
    uint256 constant treeBalanceWithdrawnSeconds = 94608000;

    uint256[6] public balances;

    constructor(TreeSale _treeSaleAddress)
        public
    {
        treeSale = _treeSaleAddress;
    }

    function setGBAddress(address _address) external onlyAdmin {
        GBFactory candidateContract = GBFactory(_address);

        require(candidateContract.isGBFactory());

        // Set the new contract address
        gbFactory = candidateContract;
    }

    function setUpdateFactoryAddress(address _address) external onlyAdmin {
        UpdateFactory candidateContract = UpdateFactory(_address);

        require(candidateContract.isUpdateFactory());

        // Set the new contract address
        updateFactory = candidateContract;
    }

    function fund(uint256 _count) external payable {
        uint256 balance = msg.value / _count;

        //@todo check for treePrice
        require(balance >= price, "Balance is not sufficient");

        for (uint8 i = 0; i < _count; i++) {
            uint256 id = 0;
            uint256 planterBalance = _calculateBalance(planterPercentage, balance);
            uint256 ambassadorBalance = 0;
            bool hasAmbasador = false;

            if (notFundedTreesExists() == true) {
                id = getLastNotFundedTreeId();
                uint256 gbId = this.getTreeGB(id);
                address gbAmbassador = gbFactory.getGBAmbassador(gbId);

                if (gbAmbassador != address(0)) {
                    hasAmbasador = true;
                    ambassadorBalance =_calculateBalance(ambassadorPercentage, balance);
                }

                id = fundPlantedTress(msg.sender, planterBalance, _calculateBalancePerSecond(planterBalance),
                ambassadorBalance, _calculateBalancePerSecond(ambassadorBalance));

            } else {
                id = simpleFund(msg.sender, planterBalance, _calculateBalancePerSecond(planterBalance), 0, 0);
            }

            _updateBalances(balance, hasAmbasador);

            emit TreeFunded(id, planterBalance, ambassadorBalance, balance, msg.sender);
        }
    }

    function _calculateBalancePerSecond(uint256 _balance) private pure returns(uint256) {
        if(_balance == 0) {
            return 0;
        }
        return _balance / treeBalanceWithdrawnSeconds;
    }

    function _calculateBalance(uint256 _percentage, uint256 _balance)
        private
        pure
        returns (uint256)
    {
        return (_balance * _percentage) / 100;
    }

    function _updateBalances(uint256 _balance, bool _hasAmbasador) private {
        uint256 localDevelopmentFundBalance = _calculateBalance(
            localDevelopmentFundPercentage,
            _balance
        );
        uint256 ambassadorBalance = _calculateBalance(
            ambassadorPercentage,
            _balance
        );
        if (_hasAmbasador == false) {
            ambassadorBalance = 0;
            localDevelopmentFundBalance =
                localDevelopmentFundBalance +
                ambassadorBalance;
        }

        balances = [
            balances[0] + _calculateBalance(treejerPercentage, _balance),
            balances[1] + _calculateBalance(planterPercentage, _balance),
            balances[2] + ambassadorBalance,
            balances[3] + localDevelopmentFundBalance,
            balances[4] + _calculateBalance(rescueFundPercentage, _balance),
            balances[5] + _calculateBalance(researchFundPercentage, _balance)
        ];
    }

    function getBalances() external view returns (uint256[6] memory) {
        return balances;
    }

    function withdrawBalance(uint8 _index, address payable _to)
        external
        onlyAdmin
    {
        require(
            _index != 1 && _index != 2,
            "These indexes are autamtic and by request of planter and ambassador!"
        );

        require(balances[_index] > 0, "Balance is zero!");

        uint256 withdrawbleBalance = balances[_index];

        balances[_index] = 0;

        _to.transfer(withdrawbleBalance);
    }

    function withdrawPlanterBalance() external onlyPlanter {
        
        uint256 planterTreesCount = this.getPlanterTreesCount(msg.sender);

        require(
            planterTreesCount > 0,
            "Planter tree count is zero"
        );

        uint256 withdrawableBalance = 0;
        uint256[] memory treeIds = this.getPlanterTrees(msg.sender);

        for (
            uint256 i = 0;
            i < planterTreesCount;
            i++
        ) {
            uint256 treeId = treeIds[i];
            
            uint256[] memory treeUpdates = updateFactory.getTreeUpdates(treeId);
            uint256 totalSeconds = 0;

            if(treeToPlanterRemainingBalance[treeId] <= 0) {
                continue;
            }

            if (treeUpdates.length == 0) {
                continue;
            }

            if (updateFactory.isTreeLastUpdatePlanterBalanceWithdrawn(treeId) == true) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j - 1];

                if (updateFactory.getStatus(jUpdateId) != 1) {
                    continue;
                }

                if (updateFactory.isPlanterBalanceWithdrawn(jUpdateId) == true) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j - 2];

                    if (updateFactory.getStatus(jMinusUpdateId) != 1) {
                        continue;
                    }

                    totalSeconds =
                        totalSeconds +
                        updateFactory.getUpdateDate(jUpdateId) -
                        updateFactory.getUpdateDate(jMinusUpdateId);
                } else {
                    totalSeconds =
                        totalSeconds +
                        updateFactory.getUpdateDate(jUpdateId) -
                        getPlantedDate(treeId);
                }

                updateFactory.setPlanterBalanceWithdrawn(jUpdateId);
            }

            if(totalSeconds > 0) {
                withdrawableBalance = withdrawableBalance + (treeToPlanterBalancePerSecond[treeId] * totalSeconds);
                treeToPlanterRemainingBalance[treeId] = treeToPlanterRemainingBalance[treeId] - (treeToPlanterBalancePerSecond[treeId] * totalSeconds);

            }

        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        balances[1] = balances[1] - withdrawableBalance;

        msg.sender.transfer(withdrawableBalance);

        emit PlanterBalanceWithdrawn(msg.sender, withdrawableBalance);
    }

    function withdrawAmbassadorBalance() external onlyAmbassador {
        
        uint256 ambassadorGBCount = gbFactory.getAmbassadorGBCount(msg.sender);

        require(ambassadorGBCount > 0, "Ambassador gb count is zero");
        
        uint256[] memory gbIds = gbFactory.getAmbassadorGBs(msg.sender);

        uint256 withdrawableBalance = 0;

        for (uint256 k = 0; k < ambassadorGBCount; k++) {

            uint256 _gbId = gbIds[k];

            uint256 gbTreesCount = this.getGBTreesCount(_gbId);

            if(gbTreesCount == 0) {
                continue;
            }

            uint256[] memory treeIds = this.getGBTrees(_gbId);
        
            for (uint256 i = 0; i < gbTreesCount; i++) {

                uint256 treeId = treeIds[i];

                uint256[] memory treeUpdates = updateFactory.getTreeUpdates(treeId);
                uint256 totalSeconds = 0;

                if(treeToAmbassadorRemainingBalance[treeId] <= 0) {
                    continue;
                }

                if (treeUpdates.length == 0) {
                    continue;
                }

                if (updateFactory.isTreeLastUpdateAmbassadorBalanceWithdrawn(treeId) == true) {
                    continue;
                }

                for (uint256 j = treeUpdates.length; j > 0; j--) {
                    uint256 jUpdateId = treeUpdates[j - 1];

                    if (updateFactory.getStatus(jUpdateId) != 1) {
                        continue;
                    }

                    if (updateFactory.isAmbassadorBalanceWithdrawn(jUpdateId) == true) {
                        continue;
                    }

                    if (j > 1) {
                        uint256 jMinusUpdateId = treeUpdates[j - 2];

                        if (updateFactory.getStatus(jMinusUpdateId) != 1) {
                            continue;
                        }

                        totalSeconds =
                            totalSeconds +
                            updateFactory.getUpdateDate(jUpdateId) -
                            updateFactory.getUpdateDate(jMinusUpdateId);
                    } else {
                        totalSeconds =
                            totalSeconds +
                            updateFactory.getUpdateDate(jUpdateId) -
                            getPlantedDate(treeId);
                    }

                    updateFactory.setAmbassadorBalanceWithdrawn(jUpdateId);
                }

                if(totalSeconds > 0) {
                    withdrawableBalance = withdrawableBalance + (treeToAmbassadorBalancePerSecond[treeId] * totalSeconds);
                    treeToAmbassadorRemainingBalance[treeId] -= (treeToAmbassadorBalancePerSecond[treeId] * totalSeconds);
                }

            }
        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        balances[2] = balances[2] - withdrawableBalance;

        msg.sender.transfer(withdrawableBalance);

        emit AmbassadorBalanceWithdrawn(msg.sender, withdrawableBalance);
    }
}
