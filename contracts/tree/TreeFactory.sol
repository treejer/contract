// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../access/IAccessRestriction.sol";
import "../greenblock/IGBFactory.sol";
import "./IUpdateFactory.sol";
import "./ITree.sol";
import "../gsn/RelayRecipient.sol";

contract TreeFactory is Initializable, RelayRecipient {
    using SafeMathUpgradeable for uint256;
    using SafeMathUpgradeable for uint16;

    event PriceChanged(uint256 price);
    event TreePlanted(
        uint256 id,
        string latitude,
        string longitude,
        uint256 plantedDate
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
    event TreejerFundWithdrawn(address to, uint256 amount, address by);
    event LocalDevelopmentFundWithdrawn(address to, uint256 amount, address by);
    event RescueFundWithdrawn(address to, uint256 amount, address by);
    event ResearchFundWithdrawn(address to, uint256 amount, address by);

    bool public isTreeFactory;

    struct Tree {
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
    uint256 public notFundedTreesLastIndex;
    uint256 public notFundedTreesUsedIndex;

    mapping(uint256 => uint256) public notPlantedTrees;
    uint256 public notPlantedTreesLastIndex;
    uint256 public notPlantedTreesUsedIndex;

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

    // 100 percentages basis points = 1 percentage
    uint16 public treejerPercentage;
    uint16 public plantersPercentage;
    uint16 public ambassadorsPercentage;
    uint16 public localDevelopmentFundPercentage;
    uint16 public rescueFundPercentage;
    uint16 public researchFundPercentage;

    uint256 public treejerFund;
    uint256 public plantersFund;
    uint256 public ambassadorsFund;
    uint256 public localDevelopmentFund;
    uint256 public rescueFund;
    uint256 public researchFund;

    mapping(uint256 => bool) public updateToPlanterBalanceWithdrawn;
    mapping(uint256 => bool) public updateToAmbassadorBalanceWithdrawn;

    // 1 common year 31536000 seconds * 3 year
    uint256 constant treeBalanceWithdrawnSeconds = 94608000;

    //related contrects
    IAccessRestriction public accessRestriction;
    IGBFactory public gbFactory;
    IUpdateFactory public updateFactory;
    ITree public treeToken;
    IERC20 public daiToken;

    function initialize(address _accessRestrictionAddress) public initializer {
        isTreeFactory = true;

        IAccessRestriction candidateContract =
            IAccessRestriction(_accessRestrictionAddress);
        require(candidateContract.isAccessRestriction());
        accessRestriction = candidateContract;

        //set default percentages
        treejerPercentage = 2500;
        plantersPercentage = 4000;
        ambassadorsPercentage = 500;
        localDevelopmentFundPercentage = 1500;
        rescueFundPercentage = 1000;
        researchFundPercentage = 500;
    }

    function setTrustedForwarder(address _address) external {
        accessRestriction.ifAdmin(_msgSender());

        trustedForwarder = _address;
    }

    function setGBFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());

        IGBFactory candidateContract = IGBFactory(_address);
        require(candidateContract.isGBFactory());
        gbFactory = candidateContract;
    }

    function setUpdateFactoryAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());

        IUpdateFactory candidateContract = IUpdateFactory(_address);
        require(candidateContract.isUpdateFactory());
        updateFactory = candidateContract;
    }

    function setTreeTokenAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());

        ITree candidateContract = ITree(_address);
        require(candidateContract.isTree());
        treeToken = candidateContract;
    }

    function setDaiTokenAddress(address _address) external {
        accessRestriction.ifAdmin(_msgSender());
        IERC20 candidateContract = IERC20(_address);
        daiToken = candidateContract;
    }

    function plant(
        uint8 _typeId,
        string[] calldata _stringParams,
        uint8[] calldata _uintParams
    ) external {
        accessRestriction.ifNotPaused();
        accessRestriction.ifPlanter(_msgSender());

        uint256 gbId = gbFactory.planterGB(_msgSender());

        uint256 id = 0;

        if (notPlantedTreesLastIndex > notPlantedTreesUsedIndex) {
            id = notPlantedTrees[notPlantedTreesUsedIndex];
            notPlantedTreesUsedIndex++;

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
            treeToken.safeMint(_msgSender(), id);
        }

        bytes memory uriStringByte = bytes(_stringParams[0]);
        if (uriStringByte.length > 0) {
            treeToken.setTokenURI(id, _stringParams[0]);
        }

        treeToGB[id] = gbId;
        gbTreeCount[gbId]++;
        gbTrees[gbId].push(id);

        treeToType[id] = _typeId;
        typeTreeCount[_typeId]++;
        typeTrees[_typeId].push(id);

        treeToPlanter[id] = _msgSender();
        planterTreeCount[_msgSender()]++;
        planterTrees[_msgSender()].push(id);

        emit TreePlanted(
            id,
            _stringParams[1],
            _stringParams[2],
            block.timestamp
        );
    }

    function simpleFund(
        address _account,
        uint256 _planterBalance,
        uint256 _planterBalancePerSecond,
        uint256 _ambassadorBalance,
        uint256 _ambassadorBalancePerSecond
    ) internal returns (uint256) {
        trees.push(Tree("", "", 0, 0, block.timestamp, 0, 0));
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

        treeToken.safeMint(_account, id);

        return id;
    }

    function fundPlantedTress(
        address _account,
        uint256 _planterBalance,
        uint256 _planterBalancePerSecond,
        uint256 _ambassadorBalance,
        uint256 _ambassadorBalancePerSecond
    ) internal returns (uint256) {
        require(
            notFundedTreesLastIndex > notFundedTreesUsedIndex,
            "There is not funded trees"
        );

        uint256 treeId = notFundedTrees[notFundedTreesUsedIndex];
        notFundedTreesUsedIndex++;

        trees[treeId].fundedDate = block.timestamp;

        if (_planterBalance > 0) {
            treeToPlanterRemainingBalance[treeId] = _planterBalance;
            treeToPlanterBalancePerSecond[treeId] = _planterBalancePerSecond;
        }

        if (_ambassadorBalance > 0) {
            treeToAmbassadorRemainingBalance[treeId] = _ambassadorBalance;
            treeToAmbassadorBalancePerSecond[
                treeId
            ] = _ambassadorBalancePerSecond;
        }

        treeToken.safeTransferExtra(
            treeToken.ownerOf(treeId),
            _account,
            treeId
        );

        delete notFundedTrees[notFundedTreesUsedIndex.sub(1)];

        return treeId;
    }

    function setPrice(uint256 _price) external {
        accessRestriction.ifAdmin(_msgSender());

        price = _price;
        emit PriceChanged(_price);
    }

    function fund(uint256 _count) external payable {
        require(_count > 0, "count must bigger than 0");

        uint256 totalPrice = price.mul(_count);

        require(
            daiToken.balanceOf(_msgSender()) >= totalPrice,
            "Balance is not sufficient"
        );

        bool success =
            daiToken.transferFrom(_msgSender(), address(this), totalPrice);
        require(success, "Transfer From sender failed");

        for (uint8 i = 0; i < _count; i++) {
            uint256 id = 0;
            uint256 planterBalance = _calculateShare(plantersPercentage, price);
            uint256 ambassadorBalance = 0;
            bool hasAmbassador = false;

            //check for
            if (notFundedTreesLastIndex > notFundedTreesUsedIndex) {
                id = notFundedTrees[notFundedTreesUsedIndex];
                uint256 gbId = treeToGB[id];
                address gbAmbassador = gbFactory.gbToAmbassador(gbId);

                if (gbAmbassador != address(0)) {
                    hasAmbassador = true;
                    ambassadorBalance = _calculateShare(
                        ambassadorsPercentage,
                        price
                    );
                }

                id = fundPlantedTress(
                    _msgSender(),
                    planterBalance,
                    _calculateSharePerSecond(planterBalance),
                    ambassadorBalance,
                    _calculateSharePerSecond(ambassadorBalance)
                );
            } else {
                id = simpleFund(
                    _msgSender(),
                    planterBalance,
                    _calculateSharePerSecond(planterBalance),
                    0,
                    0
                );
            }

            _updateBalances(price, hasAmbassador);

            emit TreeFunded(
                id,
                planterBalance,
                ambassadorBalance,
                price,
                _msgSender()
            );
        }
    }

    function _calculateSharePerSecond(uint256 _amount)
        private
        pure
        returns (uint256)
    {
        if (_amount == 0) {
            return 0;
        }

        return _amount.div(treeBalanceWithdrawnSeconds);
    }

    function _calculateShare(uint256 _percentage, uint256 _amount)
        private
        pure
        returns (uint256)
    {
        if (_percentage == 0 || _amount == 0) {
            return 0;
        }

        require((_amount.div(10000)).mul(10000) == _amount, "Too small");

        return (_amount.mul(_percentage)).div(10000);
    }

    function _updateBalances(uint256 _balance, bool _hasAmbassador) private {
        uint256 ambassadorBalance = 0;

        uint256 localDevelopmentFundBalance =
            _calculateShare(localDevelopmentFundPercentage, _balance);

        if (_hasAmbassador == true) {
            ambassadorBalance = _calculateShare(
                ambassadorsPercentage,
                _balance
            );
        } else {
            localDevelopmentFundBalance = localDevelopmentFundBalance.add(
                _calculateShare(ambassadorsPercentage, _balance)
            );
        }

        treejerFund = treejerFund.add(
            _calculateShare(treejerPercentage, _balance)
        );
        plantersFund = plantersFund.add(
            _calculateShare(plantersPercentage, _balance)
        );
        ambassadorsFund = ambassadorsFund.add(ambassadorBalance);
        localDevelopmentFund = localDevelopmentFund.add(
            localDevelopmentFundBalance
        );
        rescueFund = rescueFund.add(
            _calculateShare(rescueFundPercentage, _balance)
        );
        researchFund = researchFund.add(
            _calculateShare(researchFundPercentage, _balance)
        );
    }

    function withdrawTreejerFund(address payable _to, uint256 _amount)
        external
    {
        accessRestriction.ifAdmin(_msgSender());

        require(treejerFund > 0, "treejerFund balance is zero!");
        require(_amount <= treejerFund, "Not more treejerFund!");

        treejerFund = treejerFund.sub(_amount);

        bool success = daiToken.transfer(_to, _amount);
        require(success, "withdraw failed");

        emit TreejerFundWithdrawn(_to, _amount, _msgSender());
    }

    function withdrawLocalDevelopmentFund(address payable _to, uint256 _amount)
        external
    {
        accessRestriction.ifAdmin(_msgSender());

        require(
            localDevelopmentFund > 0,
            "localDevelopmentFund balance is zero!"
        );
        require(
            _amount <= localDevelopmentFund,
            "Not more localDevelopmentFund!"
        );

        localDevelopmentFund = localDevelopmentFund.sub(_amount);

        bool success = daiToken.transfer(_to, _amount);
        require(success, "withdraw failed");

        emit LocalDevelopmentFundWithdrawn(_to, _amount, _msgSender());
    }

    function withdrawRescueFund(address payable _to, uint256 _amount) external {
        accessRestriction.ifAdmin(_msgSender());

        require(rescueFund > 0, "rescueFund balance is zero!");
        require(_amount <= rescueFund, "Not more rescueFund!");

        rescueFund = rescueFund.sub(_amount);

        bool success = daiToken.transfer(_to, _amount);
        require(success, "withdraw failed");

        emit RescueFundWithdrawn(_to, _amount, _msgSender());
    }

    function withdrawResearchFund(address payable _to, uint256 _amount)
        external
    {
        accessRestriction.ifAdmin(_msgSender());

        require(researchFund > 0, "researchFund balance is zero!");
        require(_amount <= researchFund, "Not more researchFund!");

        researchFund = researchFund.sub(_amount);

        bool success = daiToken.transfer(_to, _amount);
        require(success, "withdraw failed");

        emit ResearchFundWithdrawn(_to, _amount, _msgSender());
    }

    function withdrawPlanterBalance() external {
        accessRestriction.ifPlanter(_msgSender());

        uint256 planterTreesCount = planterTreeCount[_msgSender()];

        require(planterTreesCount > 0, "Planter tree count is zero");

        uint256 withdrawableBalance = 0;
        uint256[] memory treeIds = planterTrees[_msgSender()];

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
                updateToPlanterBalanceWithdrawn[
                    updateFactory.getTreeLastUpdateId(treeId)
                ] == true
            ) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j - 1];

                (, , uint256 jUpdateDate, bool jUpdateStatus) =
                    updateFactory.updates(jUpdateId);

                if (jUpdateStatus != true) {
                    continue;
                }

                if (updateToPlanterBalanceWithdrawn[jUpdateId] == true) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j - 2];

                    (, , uint256 jMUpdateDate, bool jMUpdateStatus) =
                        updateFactory.updates(jMinusUpdateId);

                    if (jMUpdateStatus != true) {
                        continue;
                    }

                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(jMUpdateDate)
                    );
                } else {
                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(trees[treeId].plantedDate)
                    );
                }

                updateToPlanterBalanceWithdrawn[jUpdateId] = true;
            }

            if (totalSeconds > 0) {
                withdrawableBalance = withdrawableBalance.add(
                    treeToPlanterBalancePerSecond[treeId].mul(totalSeconds)
                );
                treeToPlanterRemainingBalance[
                    treeId
                ] = treeToPlanterRemainingBalance[treeId].sub(
                    treeToPlanterBalancePerSecond[treeId].mul(totalSeconds)
                );
            }
        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        plantersFund = plantersFund.sub(withdrawableBalance);

        bool success = daiToken.transfer(_msgSender(), withdrawableBalance);
        require(success, "withdraw failed");

        emit PlanterBalanceWithdrawn(_msgSender(), withdrawableBalance);
    }

    function withdrawAmbassadorBalance() external {
        accessRestriction.ifAmbassador(_msgSender());

        uint256 ambassadorGBCount = gbFactory.ambassadorGBCount(_msgSender());

        require(ambassadorGBCount > 0, "Ambassador gb count is zero");

        uint256[] memory gbIds = gbFactory.getAmbassadorGBs(_msgSender());

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

                uint256[] memory treeUpdates =
                    updateFactory.getTreeUpdates(treeId);
                uint256 totalSeconds = 0;

                if (treeToAmbassadorRemainingBalance[treeId] <= 0) {
                    continue;
                }

                if (treeUpdates.length == 0) {
                    continue;
                }

                if (
                    updateToAmbassadorBalanceWithdrawn[
                        updateFactory.getTreeLastUpdateId(treeId)
                    ] == true
                ) {
                    continue;
                }

                for (uint256 j = treeUpdates.length; j > 0; j--) {
                    uint256 jUpdateId = treeUpdates[j - 1];

                    (, , uint256 jUpdateDate, bool jUpdateStatus) =
                        updateFactory.updates(jUpdateId);

                    if (jUpdateStatus != true) {
                        continue;
                    }

                    if (updateToAmbassadorBalanceWithdrawn[jUpdateId] == true) {
                        continue;
                    }

                    if (j > 1) {
                        uint256 jMinusUpdateId = treeUpdates[j - 2];
                        (, , uint256 jMUpdateDate, bool jMUpdateStatus) =
                            updateFactory.updates(jMinusUpdateId);

                        if (jMUpdateStatus != true) {
                            continue;
                        }

                        totalSeconds = totalSeconds.add(
                            jUpdateDate.sub(jMUpdateDate)
                        );
                    } else {
                        totalSeconds = totalSeconds.add(
                            jUpdateDate.sub(trees[treeId].plantedDate)
                        );
                    }

                    updateToAmbassadorBalanceWithdrawn[jUpdateId] = true;
                }

                if (totalSeconds > 0) {
                    withdrawableBalance = withdrawableBalance.add(
                        treeToAmbassadorBalancePerSecond[treeId].mul(
                            totalSeconds
                        )
                    );
                    treeToAmbassadorRemainingBalance[
                        treeId
                    ] = treeToAmbassadorRemainingBalance[treeId].sub(
                        treeToAmbassadorBalancePerSecond[treeId].mul(
                            totalSeconds
                        )
                    );
                }
            }
        }

        require(withdrawableBalance > 0, "withdrawableBalance is zero");

        ambassadorsFund = ambassadorsFund.sub(withdrawableBalance);

        bool success = daiToken.transfer(_msgSender(), withdrawableBalance);
        require(success, "withdraw failed");

        emit AmbassadorBalanceWithdrawn(_msgSender(), withdrawableBalance);
    }

    function setAllPercentages(
        uint16 _treejerPercentage,
        uint16 _plantersPercentage,
        uint16 _ambassadorsPercentage,
        uint16 _localDevelopmentFundPercentage,
        uint16 _rescueFundPercentage,
        uint16 _researchFundPercentage
    ) external {
        accessRestriction.ifAdmin(_msgSender());

        require(
            _treejerPercentage
                .add(_plantersPercentage)
                .add(_ambassadorsPercentage)
                .add(_localDevelopmentFundPercentage)
                .add(_rescueFundPercentage)
                .add(_researchFundPercentage) == 10000,
            "Percentages sum must equal to 10000"
        );

        treejerPercentage = _treejerPercentage;
        plantersPercentage = _plantersPercentage;
        ambassadorsPercentage = _ambassadorsPercentage;
        localDevelopmentFundPercentage = _localDevelopmentFundPercentage;
        rescueFundPercentage = _rescueFundPercentage;
        researchFundPercentage = _researchFundPercentage;
    }

    function getPlanterWithdrawableBalance(address _account)
        external
        view
        returns (uint256)
    {
        accessRestriction.ifPlanter(_account);

        uint256 planterTreesCount = planterTreeCount[_account];

        if (planterTreesCount == 0) {
            return 0;
        }

        uint256 withdrawableBalance = 0;
        uint256[] memory treeIds = planterTrees[_account];

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
                updateToPlanterBalanceWithdrawn[
                    updateFactory.getTreeLastUpdateId(treeId)
                ] == true
            ) {
                continue;
            }

            for (uint256 j = treeUpdates.length; j > 0; j--) {
                uint256 jUpdateId = treeUpdates[j - 1];

                (, , uint256 jUpdateDate, bool jUpdateStatus) =
                    updateFactory.updates(jUpdateId);

                if (jUpdateStatus != true) {
                    continue;
                }

                if (updateToPlanterBalanceWithdrawn[jUpdateId] == true) {
                    continue;
                }

                if (j > 1) {
                    uint256 jMinusUpdateId = treeUpdates[j - 2];

                    (, , uint256 jMUpdateDate, bool jMUpdateStatus) =
                        updateFactory.updates(jMinusUpdateId);

                    if (jMUpdateStatus != true) {
                        continue;
                    }

                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(jMUpdateDate)
                    );
                } else {
                    totalSeconds = totalSeconds.add(
                        jUpdateDate.sub(trees[treeId].plantedDate)
                    );
                }
            }

            if (totalSeconds > 0) {
                withdrawableBalance = withdrawableBalance.add(
                    treeToPlanterBalancePerSecond[treeId].mul(totalSeconds)
                );
            }
        }

        return withdrawableBalance;
    }

    function getAmbassadorWithdrawableBalance(address _account)
        external
        view
        returns (uint256)
    {
        accessRestriction.ifAmbassador(_account);

        uint256 ambassadorGBCount = gbFactory.ambassadorGBCount(_account);

        if (ambassadorGBCount == 0) {
            return 0;
        }

        uint256[] memory gbIds = gbFactory.getAmbassadorGBs(_account);

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

                uint256[] memory treeUpdates =
                    updateFactory.getTreeUpdates(treeId);
                uint256 totalSeconds = 0;

                if (treeToAmbassadorRemainingBalance[treeId] <= 0) {
                    continue;
                }

                if (treeUpdates.length == 0) {
                    continue;
                }

                if (
                    updateToAmbassadorBalanceWithdrawn[
                        updateFactory.getTreeLastUpdateId(treeId)
                    ] == true
                ) {
                    continue;
                }

                for (uint256 j = treeUpdates.length; j > 0; j--) {
                    uint256 jUpdateId = treeUpdates[j - 1];

                    (, , uint256 jUpdateDate, bool jUpdateStatus) =
                        updateFactory.updates(jUpdateId);

                    if (jUpdateStatus != true) {
                        continue;
                    }

                    if (updateToAmbassadorBalanceWithdrawn[jUpdateId] == true) {
                        continue;
                    }

                    if (j > 1) {
                        uint256 jMinusUpdateId = treeUpdates[j - 2];
                        (, , uint256 jMUpdateDate, bool jMUpdateStatus) =
                            updateFactory.updates(jMinusUpdateId);

                        if (jMUpdateStatus != true) {
                            continue;
                        }

                        totalSeconds = totalSeconds.add(
                            jUpdateDate.sub(jMUpdateDate)
                        );
                    } else {
                        totalSeconds = totalSeconds.add(
                            jUpdateDate.sub(trees[treeId].plantedDate)
                        );
                    }
                }

                if (totalSeconds > 0) {
                    withdrawableBalance = withdrawableBalance.add(
                        treeToAmbassadorBalancePerSecond[treeId].mul(
                            totalSeconds
                        )
                    );
                }
            }
        }

        return withdrawableBalance;
    }
}
