// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/IAttribute.sol";
import "../treasury/IPlanterFund.sol";
import "../gsn/RelayRecipient.sol";
import "./IHonoraryTree.sol";

/** @title HonoraryTree */

contract HonoraryTree is Initializable, RelayRecipient, IHonoraryTree {
    struct Recipient {
        uint64 expiryDate;
        uint64 startDate;
        uint64 coefficient;
    }

    /** NOTE {isHonoraryTree} set inside the initialize to {true} */
    bool public override isHonoraryTree;

    uint256 public override claimedCount;
    uint256 public override currentTreeId;
    uint256 public override upTo;
    uint256 public override prePaidTreeCount;

    /**NOTE {referralTreePaymentToPlanter} is share of planter when a tree claimed for someone*/
    uint256 public override referralTreePaymentToPlanter;
    /**NOTE {referralTreePaymentToAmbassador} is share of ambassador when a tree claimed for someone*/
    uint256 public override referralTreePaymentToAmbassador;

    /** NOTE mapping of recipient address to Recipient struct */
    mapping(address => Recipient) public override recipients;
    /** NOTE array of symbols */
    uint64[] public override symbols;
    /** array of bool to show a symbol is used or not*/
    bool[] public override used;

    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IPlanterFund public planterFundContract;
    IAttribute public attribute;
    IERC20Upgradeable public daiToken;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(_msgSender());
        _;
    }

    /** NOTE modifier to check msg.sender has data manager role */
    modifier onlyDataManager() {
        accessRestriction.ifDataManager(_msgSender());
        _;
    }

    /** NOTE modifier for check if function is not paused*/
    modifier ifNotPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /** NOTE modifier for check valid address */
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /// @inheritdoc IHonoraryTree
    function initialize(
        address _accessRestrictionAddress,
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external override initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isHonoraryTree = true;
        accessRestriction = candidateContract;
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;
    }

    /// @inheritdoc IHonoraryTree
    function setTrustedForwarder(address _address)
        external
        override
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /// @inheritdoc IHonoraryTree
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        override
        onlyAdmin
        validAddress(_daiTokenAddress)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
        daiToken = candidateContract;
    }

    /// @inheritdoc IHonoraryTree
    function setAttributesAddress(address _address)
        external
        override
        onlyAdmin
    {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    /// @inheritdoc IHonoraryTree
    function setTreeFactoryAddress(address _address)
        external
        override
        onlyAdmin
    {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /// @inheritdoc IHonoraryTree
    function setPlanterFundAddress(address _address)
        external
        override
        onlyAdmin
    {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    /// @inheritdoc IHonoraryTree
    function setTreeRange(
        address _sponsor,
        uint256 _startTreeId,
        uint256 _upTo
    ) external override ifNotPaused onlyDataManager {
        require(_upTo > _startTreeId, "Invalid range");
        require(upTo == currentTreeId, "Cant set range");

        bool isAvailable = treeFactory.manageSaleTypeBatch(
            _startTreeId,
            _upTo,
            5
        );
        require(isAvailable, "Tree not available");

        currentTreeId = _startTreeId;
        upTo = _upTo;

        int256 extraPrePaid = int256(_upTo - _startTreeId) -
            int256(prePaidTreeCount);

        if (extraPrePaid > 0) {
            bool success = daiToken.transferFrom(
                _sponsor,
                address(planterFundContract),
                uint256(extraPrePaid) *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador)
            );

            require(success, "Unsuccessful transfer");

            prePaidTreeCount = 0;
        } else {
            prePaidTreeCount = uint256(-extraPrePaid);
        }

        emit TreeRangeSet();
    }

    /// @inheritdoc IHonoraryTree
    function releaseTreeRange() external override ifNotPaused onlyDataManager {
        treeFactory.resetSaleTypeBatch(currentTreeId, upTo, 5);
        prePaidTreeCount += upTo - currentTreeId;
        upTo = 0;
        currentTreeId = 0;
        emit TreeRangeReleased();
    }

    /// @inheritdoc IHonoraryTree
    function reserveSymbol(uint64 _uniquenessFactor)
        external
        override
        ifNotPaused
        onlyDataManager
    {
        attribute.reserveSymbol(_uniquenessFactor);
        symbols.push(_uniquenessFactor);
        used.push(false);
    }

    /// @inheritdoc IHonoraryTree
    function releaseReservedSymbol()
        external
        override
        ifNotPaused
        onlyDataManager
    {
        for (uint256 i = 0; i < symbols.length; i++) {
            if (!used[i]) {
                attribute.releaseReservedSymbol(symbols[i]);
            }
        }

        delete symbols;
        delete used;
        claimedCount = 0;
    }

    /// @inheritdoc IHonoraryTree
    function addRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate,
        uint64 _coefficient
    ) external override ifNotPaused onlyDataManager {
        Recipient storage recipientData = recipients[_recipient];

        recipientData.expiryDate = _expiryDate;
        recipientData.startDate = _startDate;
        recipientData.coefficient = _coefficient;

        emit RecipientAdded(_recipient);
    }

    /// @inheritdoc IHonoraryTree
    function updateRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate,
        uint64 _coefficient
    ) external override ifNotPaused onlyDataManager {
        Recipient storage recipientData = recipients[_recipient];

        require(recipientData.startDate > 0, "Recipient not exist");

        recipientData.expiryDate = _expiryDate;
        recipientData.startDate = _startDate;
        recipientData.coefficient = _coefficient;
        emit RecipientUpdated(_recipient);
    }

    /// @inheritdoc IHonoraryTree
    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external override ifNotPaused onlyDataManager {
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;

        emit ReferralTreePaymentsUpdated(
            _referralTreePaymentToPlanter,
            _referralTreePaymentToAmbassador
        );
    }

    /// @inheritdoc IHonoraryTree
    function claim() external override ifNotPaused {
        Recipient storage recipientData = recipients[_msgSender()];

        require(
            recipientData.expiryDate > block.timestamp &&
                recipientData.startDate < block.timestamp &&
                recipientData.startDate > 0,
            "Cant claim"
        );

        require(currentTreeId < upTo, "Tree not available");
        require(claimedCount < symbols.length, "Insufficient symbol");

        bool flag = false;

        uint256 randomValue = uint256(
            keccak256(
                abi.encode(
                    recipientData.expiryDate,
                    recipientData.startDate,
                    msg.data,
                    currentTreeId
                )
            )
        );

        uint64 selectedSymbol = 0;
        uint256 remainedSymbolCount;
        uint256 selectedFreeSymbolIndex;
        uint256 index;

        for (uint256 i = 0; i < symbols.length; i++) {
            remainedSymbolCount = symbols.length - claimedCount;
            selectedFreeSymbolIndex = remainedSymbolCount > 0
                ? randomValue % remainedSymbolCount
                : 0;
            index = 0;

            for (uint256 j = 0; j < symbols.length; j++) {
                if (!used[j]) {
                    if (index == selectedFreeSymbolIndex) {
                        claimedCount += 1;
                        used[j] = true;

                        (, uint128 status) = attribute
                            .uniquenessFactorToSymbolStatus(symbols[j]);

                        if (status == 1) {
                            selectedSymbol = symbols[j];
                            flag = true;
                        }

                        break;
                    }
                    index += 1;
                }
            }
            if (flag) {
                break;
            }
        }

        if (flag) {
            uint64 uniquenessFactor = attribute.manageAttributeUniquenessFactor(
                currentTreeId
            );

            attribute.setAttribute(
                currentTreeId,
                uniquenessFactor,
                selectedSymbol,
                18,
                recipientData.coefficient
            );

            planterFundContract.updateProjectedEarnings(
                currentTreeId,
                referralTreePaymentToPlanter,
                referralTreePaymentToAmbassador
            );

            treeFactory.mintAssignedTree(currentTreeId, _msgSender());

            emit Claimed(currentTreeId);

            currentTreeId += 1;

            delete recipients[_msgSender()];
        } else {
            emit ClaimFailed(_msgSender());
        }
    }
}
