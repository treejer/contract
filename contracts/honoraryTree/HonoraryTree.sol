// // SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../access/IAccessRestriction.sol";
import "../tree/ITreeFactory.sol";
import "../tree/IAttribute.sol";
import "../treasury/IPlanterFund.sol";
import "../gsn/RelayRecipient.sol";

/** @title HonoraryTree */

contract HonoraryTree is Initializable, RelayRecipient {
    IAccessRestriction public accessRestriction;
    ITreeFactory public treeFactory;
    IPlanterFund public planterFundContract;
    IAttribute public attribute;
    IERC20Upgradeable public daiToken;

    struct Recipient {
        uint64 expiryDate;
        uint64 startDate;
        uint64 status;
    }

    mapping(address => Recipient) public recipients;

    uint64[] public symbols;
    bool[] public used;

    /** NOTE {isHonoraryTree} set inside the initialize to {true} */
    bool public isHonoraryTree;

    uint256 public claimedCount;
    uint256 public currentTreeId;
    uint256 public upTo;
    uint256 public prePaidTreeCount;

    /**NOTE {referralTreePaymentToPlanter} is share of plater when a tree claimed or transfered to someone*/
    uint256 public referralTreePaymentToPlanter;
    /**NOTE {referralTreePaymentToAmbassador} is share of referral when a tree claimed or transfered to someone*/
    uint256 public referralTreePaymentToAmbassador;

    ////////////////////////////////////////////////
    event TreeRangeSet();
    event TreeRangeReleased();

    event RecipientUpdated(address recipient);
    event RecipientAdded(address recipient);

    event ReferralTreePaymentsUpdated(
        uint256 referralTreePaymentToPlanter,
        uint256 referralTreePaymentToAmbassador
    );

    event Claimed(uint256 treeId);
    event ClaimFailed(address recipient);

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
        require(_address != address(0), "invalid address");
        _;
    }

    /**
     * @dev initialize accessRestriction contract and set true for isHonoraryTree
     * set expire date and referralTreePaymentToPlanter and referralTreePaymentToAmbassador initial value
     * @param _accessRestrictionAddress set to the address of accessRestriction contract
     * @param _referralTreePaymentToPlanter initial planter fund
     * @param _referralTreePaymentToAmbassador initial referral fund
     */
    function initialize(
        address _accessRestrictionAddress,
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external initializer {
        IAccessRestriction candidateContract = IAccessRestriction(
            _accessRestrictionAddress
        );
        require(candidateContract.isAccessRestriction());
        isHonoraryTree = true;
        accessRestriction = candidateContract;
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;
    }

    /**
     * @dev admin set the trustedForwarder adress
     * @param _address is the address of trusted forwarder
     */

    function setTrustedForwarder(address _address)
        external
        onlyAdmin
        validAddress(_address)
    {
        trustedForwarder = _address;
    }

    /**
     * @dev admin set DaiToken address
     * @param _daiTokenAddress set to the address of DaiToken
     */
    function setDaiTokenAddress(address _daiTokenAddress)
        external
        onlyAdmin
        validAddress(_daiTokenAddress)
    {
        IERC20Upgradeable candidateContract = IERC20Upgradeable(
            _daiTokenAddress
        );
        daiToken = candidateContract;
    }

    /**
     * @dev admin set AttributesAddress
     * @param _address set to the address of attribute
     */

    function setAttributesAddress(address _address) external onlyAdmin {
        IAttribute candidateContract = IAttribute(_address);
        require(candidateContract.isAttribute());
        attribute = candidateContract;
    }

    /**
     * @dev admin set TreeFactoryAddress
     * @param _address set to the address of treeFactory
     */

    function setTreeFactoryAddress(address _address) external onlyAdmin {
        ITreeFactory candidateContract = ITreeFactory(_address);
        require(candidateContract.isTreeFactory());
        treeFactory = candidateContract;
    }

    /**
     * @dev admin set PlanterFundAddress
     * @param _address set to the address of PlanterFund
     */

    function setPlanterFundAddress(address _address) external onlyAdmin {
        IPlanterFund candidateContract = IPlanterFund(_address);
        require(candidateContract.isPlanterFund());
        planterFundContract = candidateContract;
    }

    function setTreeRange(
        address _sponsor,
        uint256 _startTreeId,
        uint256 _upTo
    ) external onlyDataManager {
        require(_upTo > _startTreeId, "invalid range");
        require(upTo == currentTreeId, "cant set gift range");

        bool isAvailable = treeFactory.manageSaleTypeBatch(
            _startTreeId,
            _upTo,
            5
        );
        require(isAvailable, "trees are not available");

        currentTreeId = _startTreeId;
        upTo = _upTo;

        int256 extra = int256(_upTo - _startTreeId) - int256(prePaidTreeCount);

        if (extra > 0) {
            bool success = daiToken.transferFrom(
                _sponsor,
                address(planterFundContract),
                uint256(extra) *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador)
            );

            require(success, "unsuccessful transfer");

            prePaidTreeCount = 0;
        } else {
            prePaidTreeCount = uint256(-extra);
        }

        emit TreeRangeSet();
    }

    function releaseTreeRange() external onlyDataManager {
        treeFactory.resetSaleTypeBatch(currentTreeId, upTo, 5);
        prePaidTreeCount += upTo - currentTreeId;
        upTo = 0;
        currentTreeId = 0;
        emit TreeRangeReleased();
    }

    function reserveSymbol(uint64 _uniquenessFactor) external onlyDataManager {
        attribute.reserveSymbol(_uniquenessFactor);
        symbols.push(_uniquenessFactor);
        used.push(false);
    }

    function releaseReservedSymbol() external onlyDataManager {
        for (uint256 i = 0; i < symbols.length; i++) {
            if (!used[i]) {
                attribute.releaseReservedSymbol(symbols[i]);
            }
        }

        delete symbols;
        delete used;
        claimedCount = 0;
    }

    function addRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate
    ) external onlyDataManager {
        Recipient storage recipientData = recipients[_recipient];

        recipientData.expiryDate = _expiryDate;
        recipientData.startDate = _startDate;
        recipientData.status = 1;

        emit RecipientAdded(_recipient);
    }

    function updateRecipient(
        address _recipient,
        uint64 _startDate,
        uint64 _expiryDate
    ) external onlyDataManager {
        Recipient storage recipientData = recipients[_recipient];

        require(recipientData.status == 1, "Status must be one");

        recipientData.expiryDate = _expiryDate;
        recipientData.startDate = _startDate;
        emit RecipientUpdated(_recipient);
    }

    /** @dev admin can set planter and referral funds amount
     * @param _referralTreePaymentToPlanter is the planter fund amount
     * @param _referralTreePaymentToAmbassador is the referral fund amount
     */

    function updateReferralTreePayments(
        uint256 _referralTreePaymentToPlanter,
        uint256 _referralTreePaymentToAmbassador
    ) external onlyDataManager {
        referralTreePaymentToPlanter = _referralTreePaymentToPlanter;
        referralTreePaymentToAmbassador = _referralTreePaymentToAmbassador;

        emit ReferralTreePaymentsUpdated(
            _referralTreePaymentToPlanter,
            _referralTreePaymentToAmbassador
        );
    }

    function claim() external {
        Recipient storage recipientData = recipients[_msgSender()];

        require(
            recipientData.expiryDate > block.timestamp &&
                recipientData.startDate < block.timestamp &&
                recipientData.status == 1,
            "you cant claim tree"
        );

        require(currentTreeId < upTo, "trees are not available");
        require(claimedCount < symbols.length, "no symbol exists for gift");

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

        uint64 generatedSymbol; //TODO:NAMING
        uint256 diffrence; //TODO:NAMING
        uint256 symbolSec; //TODO:NAMING
        uint256 availableCount; //TODO:NAMING

        for (uint256 i = 0; i < symbols.length; i++) {
            diffrence = symbols.length - claimedCount;
            symbolSec = diffrence > 0 ? randomValue % diffrence : 0;
            availableCount = 0;

            for (uint256 j = 0; j < symbols.length; j++) {
                if (!used[j]) {
                    if (availableCount == symbolSec) {
                        claimedCount += 1;
                        used[j] = true;

                        (, uint128 status) = attribute
                            .uniquenessFactorToSymbolStatus(symbols[j]);

                        if (status == 1) {
                            generatedSymbol = symbols[j];
                            flag = true;
                        }

                        break;
                    }
                    availableCount += 1;
                }
            }
            if (flag) {
                break;
            }
        }

        if (flag) {
            uint64 generatedAttribute = attribute //TODO:NAMING
                .manageAttributeUniquenessFactor(
                    currentTreeId,
                    uint64(randomValue & type(uint64).max)
                );

            attribute.setAttribute(
                currentTreeId,
                generatedAttribute,
                generatedSymbol,
                18
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
