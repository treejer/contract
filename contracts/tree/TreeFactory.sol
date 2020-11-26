// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../../node_modules/@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../access/AccessRestriction.sol";
import "../greenblock/GBFactory.sol";
import "./TreeType.sol";
import "./UpdateFactory.sol";

contract TreeFactory is ERC721UpgradeSafe {
    using Address for address;
    using SafeMath for uint256;

    event PriceChanged(uint256 price);
    event TreePlanted(
        uint256 id,
        string name,
        string latitude,
        string longitude
    );
    event TreeFunded(
        uint256 treeId,
        uint256 planterBalance,
        uint256 ambassadorBalance,
        uint256 totalFund,
        address owner
    );
    event PlanterBalanceWithdrawn(address planter, uint256 amount);
    event AmbassadorBalanceWithdrawn(address ambassador, uint256 amount);

    bool public isTreeFactory;

    struct Tree {
        string name;
        string latitude;
        string longitude;
        uint256 plantedDate;
        uint256 birthDate;
        uint256 fundedDate;
        uint8 height;
        uint8 diameter;
    }
    Tree[] public trees;

    uint256 public price;

    mapping(uint256 => uint256) public notFundedTrees;
    uint256 notFundedTreesLastIndex;
    uint256 notFundedTreesUsedIndex;

    mapping(uint256 => uint256) public notPlantedTrees;
    uint256 notPlantedTreesLastIndex;
    uint256 notPlantedTreesUsedIndex;

    mapping(uint256 => uint8) public treeToType;
    mapping(uint256 => uint256) public treeToGB;
    mapping(uint256 => address) public treeToPlanter;
    mapping(address => uint256) public planterTreeCount;
    mapping(address => uint256[]) public planterTrees;
    mapping(uint256 => uint256) public typeTreeCount;
    mapping(uint256 => uint256) public gbTreeCount;
    mapping(uint256 => uint256[]) public gbTrees;
    mapping(uint256 => uint256[]) public typeTrees;

    mapping(uint256 => uint256) public treeToPlanterRemainingBalance;
    mapping(uint256 => uint256) public treeToPlanterBalancePerSecond;

    mapping(uint256 => uint256) public treeToAmbassadorRemainingBalance;
    mapping(uint256 => uint256) public treeToAmbassadorBalancePerSecond;

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

    // 1 common year 31536000 seconds * 3 year
    uint256 constant treeBalanceWithdrawnSeconds = 94608000;

    uint256[6] public balances;

    AccessRestriction public accessRestriction;
    GBFactory public gbFactory;
    UpdateFactory public updateFactory;

    function initialize(address _accessRestrictionAddress) public initializer {
        isTreeFactory = true;

        ERC721UpgradeSafe.__ERC721_init("Tree", "TREE");

        AccessRestriction candidateContract = AccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;
    }

    function setGBAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        GBFactory candidateContract = GBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    function setUpdateFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(msg.sender);

        UpdateFactory candidateContract = UpdateFactory(_address);
        require(candidateContract.isUpdateFactory());
        updateFactory = candidateContract;
    }

    function plant(
        uint8 _typeId,
        uint256 _gbId,
        string[] calldata _stringParams,
        uint8[] calldata _uintParams
    ) external {
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanter(msg.sender);

        // require tree type exists
        //gb exists and planter in gb

        uint256 id = 0;

        if (notPlantedTreesExists() == true) {
            id = notPlantedTrees[notPlantedTreesUsedIndex];
            notPlantedTreesUsedIndex++;

            trees[id].name = _stringParams[0];
            trees[id].latitude = _stringParams[1];
            trees[id].longitude = _stringParams[2];
            trees[id].plantedDate = block.timestamp;
            trees[id].birthDate = block.timestamp;
            trees[id].height = _uintParams[0];
            trees[id].diameter = _uintParams[1];

            delete notPlantedTrees[notPlantedTreesUsedIndex.sub(1)];
        } else {
            trees.push(
                Tree(
                    _stringParams[0],
                    _stringParams[1],
                    _stringParams[2],
                    block.timestamp,
                    block.timestamp,
                    0,
                    _uintParams[0],
                    _uintParams[1]
                )
            );
            id = trees.length.sub(1);

            notFundedTrees[notFundedTreesLastIndex] = id;
            notFundedTreesLastIndex++;
            _mint(msg.sender, id);
        }

        treeToGB[id] = _gbId;
        gbTreeCount[_gbId]++;
        gbTrees[_gbId].push(id);

        treeToType[id] = _typeId;
        typeTreeCount[_typeId]++;
        typeTrees[_typeId].push(id);

        treeToPlanter[id] = msg.sender;
        planterTreeCount[msg.sender]++;
        planterTrees[msg.sender].push(id);

        emit TreePlanted(
            id,
            _stringParams[0],
            _stringParams[1],
            _stringParams[2]
        );
    }

    function simpleFund(
        address _account,
        uint256 _planterBalance,
        uint256 _planterBalancePerSecond,
        uint256 _ambassadorBalance,
        uint256 _ambassadorBalancePerSecond
    ) internal returns (uint256) {
        string memory name = string("types name trees.length");

        trees.push(Tree(name, "", "", 0, 0, block.timestamp, 0, 0));
        uint256 id = trees.length.sub(1);

        notPlantedTrees[notPlantedTreesLastIndex] = id;
        notPlantedTreesLastIndex++;

        if (_planterBalance > 0) {
            treeToPlanterRemainingBalance[id] = _planterBalance;
            treeToPlanterBalancePerSecond[id] = _planterBalancePerSecond;
        }

        if (_ambassadorBalance > 0) {
            treeToAmbassadorRemainingBalance[id] = _ambassadorBalance;
            treeToAmbassadorBalancePerSecond[id] = _ambassadorBalancePerSecond;
        }

        _mint(_account, id);

        return id;
    }

    function fundPlantedTress(
        address _account,
        uint256 _planterBalance,
        uint256 _planterBalancePerSecond,
        uint256 _ambassadorBalance,
        uint256 _ambassadorBalancePerSecond
    ) internal returns (uint256) {
        require(notFundedTreesExists(), "There is not funded trees");

        uint256 treeId = notFundedTrees[notFundedTreesUsedIndex];
        notFundedTreesUsedIndex++;

        trees[treeId].fundedDate = block.timestamp;

        if (_planterBalance > 0) {
            treeToPlanterRemainingBalance[treeId] = _planterBalance;
            treeToPlanterBalancePerSecond[treeId] = _planterBalancePerSecond;
        }

        if (_ambassadorBalance > 0) {
            treeToAmbassadorRemainingBalance[treeId] = _ambassadorBalance;
            treeToAmbassadorBalancePerSecond[treeId] = _ambassadorBalancePerSecond;
        }

        _transfer(ownerOf(treeId), _account, treeId);

        delete notFundedTrees[notFundedTreesUsedIndex.sub(1)];

        return treeId;
    }

    function getLastNotFundedTreeId() public view returns (uint256) {
        return notFundedTrees[notFundedTreesUsedIndex];
    }

    function notFundedTreesExists() public view returns (bool) {
        return notFundedTreesLastIndex > notFundedTreesUsedIndex;
    }

    function notPlantedTreesExists() public view returns (bool) {
        return notPlantedTreesLastIndex > notPlantedTreesUsedIndex;
    }

    function ownerTreesCount(address _account) public view returns (uint256) {
        return balanceOf(_account);
    }

    function treeOwner(uint256 _treeId) public view returns (address) {
        return ownerOf(_treeId);
    }

    function getOwnerTrees(address _account)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_account);

        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        }

        uint256[] memory result = new uint256[](tokenCount);

        for (uint256 index = 0; index < tokenCount; index++) {
            result[index] = tokenOfOwnerByIndex(_account, index);
        }

        return result;
    }

    function setPrice(uint256 _price) external {
        accessRestriction.ifAdmin(msg.sender);

        price = _price;
        emit PriceChanged(_price);
    }

    function fund(uint256 _count) external payable {
        uint256 balance = msg.value.div(_count);

        //@todo check for treePrice
        require(balance >= price, "Balance is not sufficient");

        for (uint8 i = 0; i < _count; i++) {
            uint256 id = 0;
            uint256 planterBalance = _calculateBalance(
                planterPercentage,
                balance
            );
            uint256 ambassadorBalance = 0;
            bool hasAmbasador = false;

            if (notFundedTreesExists() == true) {
                id = getLastNotFundedTreeId();
                uint256 gbId = treeToGB[id];
                address gbAmbassador = gbFactory.getGBAmbassador(gbId);

                if (gbAmbassador != address(0)) {
                    hasAmbasador = true;
                    ambassadorBalance = _calculateBalance(
                        ambassadorPercentage,
                        balance
                    );
                }

                id = fundPlantedTress(
                    msg.sender,
                    planterBalance,
                    _calculateBalancePerSecond(planterBalance),
                    ambassadorBalance,
                    _calculateBalancePerSecond(ambassadorBalance)
                );
            } else {
                id = simpleFund(
                    msg.sender,
                    planterBalance,
                    _calculateBalancePerSecond(planterBalance),
                    0,
                    0
                );
            }

            _updateBalances(balance, hasAmbasador);

            emit TreeFunded(
                id,
                planterBalance,
                ambassadorBalance,
                balance,
                msg.sender
            );
        }
    }

    function _calculateBalancePerSecond(uint256 _balance)
        private
        pure
        returns (uint256)
    {
        if (_balance == 0) {
            return 0;
        }
        return _balance.div(treeBalanceWithdrawnSeconds);
    }

    function _calculateBalance(uint256 _percentage, uint256 _balance)
        private
        pure
        returns (uint256)
    {
        return (_balance.mul(_percentage)).div(100);
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
            localDevelopmentFundBalance = localDevelopmentFundBalance.add(
                ambassadorBalance
            );
        }

        balances = [
            balances[0].add(_calculateBalance(treejerPercentage, _balance)),
            balances[1].add(_calculateBalance(planterPercentage, _balance)),
            balances[2].add(ambassadorBalance),
            balances[3].add(localDevelopmentFundBalance),
            balances[4].add(_calculateBalance(rescueFundPercentage, _balance)),
            balances[5].add(_calculateBalance(researchFundPercentage, _balance))
        ];
    }

    function getBalances() external view returns (uint256[6] memory) {
        return balances;
    }

    function withdrawBalance(uint8 _index, address payable _to) external {
        accessRestriction.ifAdmin(msg.sender);

        require(
            _index != 1 && _index != 2,
            "These indexes are autamtic and by request of planter and ambassador!"
        );

        require(balances[_index] > 0, "Balance is zero!");

        uint256 withdrawableBalance = balances[_index];

        balances[_index] = 0;

        Address.sendValue(_to, withdrawableBalance);
    }

    function withdrawPlanterBalance() external {
        accessRestriction.ifPlanter(msg.sender);

        uint256 planterTreesCount = planterTreeCount[msg.sender];

        require(planterTreesCount > 0, "Planter tree count is zero");

        uint256 withdrawableBalance = 0;
        uint256[] memory treeIds = planterTrees[msg.sender];

        for (uint256 i = 0; i < planterTreesCount; i++) {
            uint256 treeId = treeIds[i];

            uint256[] memory treeUpdates = updateFactory.getTreeUpdates(treeId);
            uint256 totalSeconds = 0;

            if (treeToPlanterRemainingBalance[treeId] <= 0) {
                continue;
            }

            if (treeUpdates.length == 0) {
                continue;
            }

            if (
                updateFactory.isTreeLastUpdatePlanterBalanceWithdrawn(treeId) ==
                true
            ) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j.sub(1)];

                if (updateFactory.getStatus(jUpdateId) != 1) {
                    continue;
                }

                if (
                    updateFactory.isPlanterBalanceWithdrawn(jUpdateId) == true
                ) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j.sub(2)];

                    if (updateFactory.getStatus(jMinusUpdateId) != 1) {
                        continue;
                    }

                    totalSeconds = totalSeconds.add(
                        updateFactory.getUpdateDate(jUpdateId).sub(
                            updateFactory.getUpdateDate(jMinusUpdateId)
                        )
                    );
                } else {
                    totalSeconds = totalSeconds.add(
                        updateFactory.getUpdateDate(jUpdateId).sub(
                            trees[treeId].plantedDate
                        )
                    );
                }

                updateFactory.setPlanterBalanceWithdrawn(jUpdateId);
            }

            if (totalSeconds > 0) {
                withdrawableBalance = withdrawableBalance.add(
                    treeToPlanterBalancePerSecond[treeId].mul(totalSeconds)
                );
                treeToPlanterRemainingBalance[treeId] = treeToPlanterRemainingBalance[treeId]
                    .sub(
                    treeToPlanterBalancePerSecond[treeId].mul(totalSeconds)
                );
            }
        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        balances[1] = balances[1].sub(withdrawableBalance);

        Address.sendValue(msg.sender, withdrawableBalance);

        emit PlanterBalanceWithdrawn(msg.sender, withdrawableBalance);
    }

    function withdrawAmbassadorBalance() external {
        accessRestriction.ifAmbassador(msg.sender);

        uint256 ambassadorGBCount = gbFactory.getAmbassadorGBCount(msg.sender);

        require(ambassadorGBCount > 0, "Ambassador gb count is zero");

        uint256[] memory gbIds = gbFactory.getAmbassadorGBs(msg.sender);

        uint256 withdrawableBalance = 0;

        for (uint256 k = 0; k < ambassadorGBCount; k++) {
            uint256 _gbId = gbIds[k];

            uint256 gbTreesCount = gbTreeCount[_gbId];

            if (gbTreesCount == 0) {
                continue;
            }

            uint256[] memory treeIds = gbTrees[_gbId];

            for (uint256 i = 0; i < gbTreesCount; i++) {
                uint256 treeId = treeIds[i];

                uint256[] memory treeUpdates = updateFactory.getTreeUpdates(
                    treeId
                );
                uint256 totalSeconds = 0;

                if (treeToAmbassadorRemainingBalance[treeId] <= 0) {
                    continue;
                }

                if (treeUpdates.length == 0) {
                    continue;
                }

                if (
                    updateFactory.isTreeLastUpdateAmbassadorBalanceWithdrawn(
                        treeId
                    ) == true
                ) {
                    continue;
                }

                for (uint256 j = treeUpdates.length; j > 0; j--) {
                    uint256 jUpdateId = treeUpdates[j.sub(1)];

                    if (updateFactory.getStatus(jUpdateId) != 1) {
                        continue;
                    }

                    if (
                        updateFactory.isAmbassadorBalanceWithdrawn(jUpdateId) ==
                        true
                    ) {
                        continue;
                    }

                    if (j > 1) {
                        uint256 jMinusUpdateId = treeUpdates[j.sub(2)];

                        if (updateFactory.getStatus(jMinusUpdateId) != 1) {
                            continue;
                        }

                        totalSeconds = totalSeconds.add(
                            updateFactory.getUpdateDate(jUpdateId).sub(
                                updateFactory.getUpdateDate(jMinusUpdateId)
                            )
                        );
                    } else {
                        totalSeconds = totalSeconds.add(
                            updateFactory.getUpdateDate(jUpdateId).sub(
                                trees[treeId].plantedDate
                            )
                        );
                    }

                    updateFactory.setAmbassadorBalanceWithdrawn(jUpdateId);
                }

                if (totalSeconds > 0) {
                    withdrawableBalance = withdrawableBalance.add(
                        treeToAmbassadorBalancePerSecond[treeId].mul(
                            totalSeconds
                        )
                    );
                    treeToAmbassadorRemainingBalance[treeId] = treeToAmbassadorRemainingBalance[treeId]
                        .sub(
                        treeToAmbassadorBalancePerSecond[treeId].mul(
                            totalSeconds
                        )
                    );
                }
            }
        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        balances[2] = balances[2].sub(withdrawableBalance);

        Address.sendValue(msg.sender, withdrawableBalance);

        emit AmbassadorBalanceWithdrawn(msg.sender, withdrawableBalance);
    }
}
