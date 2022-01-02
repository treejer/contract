pragma solidity ^0.8.6;

import "./../../../regularSale/RegularSale.sol";

import "./../../uniswap/Dai.sol";

import "./../../../tree/ITree.sol";

import "./../../testContract/TestRegularSell.sol";

contract RegularSaleEchidnaTest {
    address internal trustedForwarder;

    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 research;
        uint256 localDevelopment;
        uint256 insurance;
        uint256 treasury;
        uint256 reserve1;
        uint256 reserve2;
    }

    uint256 internal lastFundedTreeId;
    uint256 internal price;

    uint256 internal maxTreeSupply;

    /** NOTE {isRegularSale} set inside the initialize to {true} */
    bool internal isRegularSale;

    /** NOTE referralTreePaymentToPlanter amount */
    uint256 internal referralTreePaymentToPlanter;

    /** NOTE referralTreePaymentToAmbassador amount */
    uint256 internal referralTreePaymentToAmbassador;
    /** NOTE referralTriggerCount   */
    uint256 internal referralTriggerCount;
    /** NOTE mapping of referrer address to claimableTreesWeth */
    mapping(address => uint256) internal referrerClaimableTreesWeth;
    /** NOTE mapping of referrer address to claimableTreesDai */
    mapping(address => uint256) internal referrerClaimableTreesDai;
    /** NOTE mapping of referrer address to referrerCount */
    mapping(address => uint256) internal referrerCount;

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    IAccessRestriction internal accessRestriction =
        IAccessRestriction(0x871DD7C2B4b25E1Aa18728e9D5f2Af4C4e431f5c);
    ITreeFactory internal treeFactory =
        ITreeFactory(0x4112f5fc3f737e813ca8cC1A48D1da3dc8719435);
    IAttribute internal attribute =
        IAttribute(0x04B5dAdd2c0D6a261bfafBc964E0cAc48585dEF3);
    IDaiFund internal daiFund =
        IDaiFund(0x10aDd991dE718a69DeC2117cB6aA28098836511B);
    IAllocation internal allocation =
        IAllocation(0x131855DDa0AaFF096F6854854C55A4deBF61077a);
    IERC20Upgradeable internal daiToken =
        IERC20Upgradeable(address(new Dai("DAI", "dai")));
    // IERC20Upgradeable(0x6346e3A22D2EF8feE3B3c2171367490e52d81C52);
    IPlanterFund internal planterFundContract =
        IPlanterFund(0xE86bB98fcF9BFf3512C74589B78Fb168200CC546);
    IWethFund internal wethFund =
        IWethFund(0xb7C9b454221E26880Eb9C3101B3295cA7D8279EF);

    TestRegularSale internal regularSale = new TestRegularSale();

    Dai internal daiContract = Dai(address(daiToken));

    ITree internal treeContract =
        ITree(0x32EeCaF51DFEA9618e9Bc94e9fBFDdB1bBdcbA15);

    //Dai(0x6346e3A22D2EF8feE3B3c2171367490e52d81C52);

    bytes32 internal constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");

    bytes32 internal constant DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");

    constructor() {
        isRegularSale = true;
        lastFundedTreeId = 10000;
        maxTreeSupply = 1000000;

        referralTriggerCount = 20;
        price = 7 * 10**18;

        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, address(this));

        accessRestriction.grantRole(DATA_MANAGER_ROLE, address(this));

        referralTreePaymentToPlanter = 2 * 10**18;
        referralTreePaymentToAmbassador = 3 * 10**18;

        daiFund.setDaiTokenAddress(address(daiContract));
        planterFundContract.setDaiTokenAddress(address(daiContract));
    }

    bool private invalidReferal;

    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) public {
        uint256 count = (_count % 50);
        uint256 randomMint = uint256(
            keccak256(abi.encodePacked(msg.sender, _count))
        ) % 10;
        uint256 randomApprove = uint256(
            keccak256(abi.encodePacked(_referrer, _count, _recipient))
        ) % 10;
        if (randomMint != 0) {
            daiContract.setMint(msg.sender, count * price);
        }
        if (randomApprove != 0) {
            daiContract.setApprove(msg.sender, address(this), count * price);
        }
        uint256 planterFundAmountBefore = daiContract.balanceOf(
            address(planterFundContract)
        );
        uint256 daiFundBefore = daiContract.balanceOf(address(daiFund));
        uint256 lastFundedTreeIdLocal = lastFundedTreeId;
        uint256 referrerCountTemp = referrerCount[_referrer];
        uint256 referrerClaimableTreesDaiTemp = referrerClaimableTreesDai[
            _referrer
        ];
        (bool success1, bytes memory data1) = address(regularSale).delegatecall(
            abi.encodeWithSignature(
                "fundTree(uint256,address,address)",
                count,
                _referrer,
                _recipient
            )
        );

        address owner = _recipient != address(0) ? _recipient : msg.sender;
        invalidReferal = owner == _referrer;

        if (success1) {
            //--------------check msg.sender balance

            uint256 newPlanterFundAmount = 0;

            for (
                uint256 i = lastFundedTreeIdLocal + 1;
                i <= lastFundedTreeIdLocal + count;
                i++
            ) {
                //----------------check tree minted
                assert(treeContract.exists(i));
                address recipient = treeContract.ownerOf(i);
                assert(recipient == owner);
                //----------------check attribute generated
                assert(treeContract.attributeExists(i));
                //--------------------check planter fund
                (
                    uint16 planterShare,
                    uint16 ambassadorShare,
                    ,
                    ,
                    ,
                    ,
                    ,

                ) = allocation.findAllocationData(i);
                uint256 ambassadorFund = planterFundContract
                    .treeToAmbassadorProjectedEarning(i);
                uint256 planterFund = planterFundContract
                    .treeToPlanterProjectedEarning(i);
                assert(ambassadorFund == (price * ambassadorShare) / 10000);
                assert(planterFund == (price * planterShare) / 10000);
                newPlanterFundAmount +=
                    (price * (ambassadorShare + planterShare)) /
                    10000;
            }
            //---------------balanceOf planterFund
            assert(
                planterFundAmountBefore + newPlanterFundAmount ==
                    daiContract.balanceOf(address(planterFundContract))
            );
            //---------------balanceOf daiFund
            assert(
                daiFundBefore + ((price * count) - newPlanterFundAmount) ==
                    daiContract.balanceOf(address(daiFund))
            );
            //-------------- referral
            _calculateReferrerCount(
                _referrer,
                referrerCountTemp,
                referrerClaimableTreesDaiTemp,
                count
            );
        } else {
            _checkErrorFundTree(data1, count, randomMint, randomApprove);
        }
    }

    function claimReferralReward(uint256 _countDai, uint256 _countWeth) public {
        uint256 countDai = _countDai % 5;
        uint256 countWeth = _countWeth % 5;
        uint256 count = 0;

        uint256 randomForReferralTreePaymentToPlanter = ((uint256(
            keccak256(abi.encodePacked(msg.sender, countDai))
        ) % 30) + 1) * 10**18;

        uint256 randomForReferralTreePaymentToAmbassador = ((uint256(
            keccak256(abi.encodePacked(msg.sender, countWeth))
        ) % 30) + 1) * 10**18;

        if (countDai % 3 == 0) {
            referralTreePaymentToPlanter = randomForReferralTreePaymentToPlanter;
        }

        if (countWeth % 3 == 0) {
            referralTreePaymentToAmbassador = randomForReferralTreePaymentToAmbassador;
        }

        if (countDai + countWeth < 50) {
            count = countDai + countWeth;
        } else {
            count = 50;
        }

        if (countDai != 0) {
            daiContract.setMint(
                address(daiFund),
                countDai *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador) +
                    (1 * (10**18))
            );

            daiFund.fundTreeBatch(
                1 * (10**18),
                0,
                0,
                0,
                0,
                countDai *
                    (referralTreePaymentToPlanter +
                        referralTreePaymentToAmbassador),
                0,
                0
            );

            daiContract.burnAcc(address(planterFundContract), 1 * (10**18));

            (bool success1, ) = address(regularSale).delegatecall(
                abi.encodeWithSignature(
                    "updateRegularReferrerGift(address,uint256)",
                    msg.sender,
                    countDai
                )
            );

            assert(success1);
        }

        if (countWeth != 0) {
            (bool success1, ) = address(regularSale).delegatecall(
                abi.encodeWithSignature(
                    "updateReferrerClaimableTreesWeth2(address,uint256)",
                    msg.sender,
                    countWeth
                )
            );

            assert(success1);
        }

        uint256 userDaiTreeBefore = referrerClaimableTreesDai[msg.sender];

        uint256 userWethTreeBefore = referrerClaimableTreesWeth[msg.sender];

        uint256 lastFundedTreeIdLocal = lastFundedTreeId;

        uint256 planterFundAmountBefore = daiContract.balanceOf(
            address(planterFundContract)
        );

        uint256 totalDaiDebtBefore = wethFund.totalDaiDebtToPlanterContract();

        //---call function

        (bool success2, bytes memory data2) = address(regularSale).delegatecall(
            abi.encodeWithSignature("claimReferralReward()")
        );

        uint256 useDaiTree = 0;

        uint256 useWethTree = 0;

        if (success2) {
            int256 diffrence = int256(userDaiTreeBefore) - 50;

            if (diffrence >= 0) {
                assert(
                    referrerClaimableTreesDai[msg.sender] == uint256(diffrence)
                );

                assert(
                    referrerClaimableTreesWeth[msg.sender] == userWethTreeBefore
                );

                useDaiTree = 50;
                useWethTree = 0;
            } else {
                assert(referrerClaimableTreesDai[msg.sender] == 0);

                uint256 freeSpace = (50 - userDaiTreeBefore);

                assert(
                    referrerClaimableTreesWeth[msg.sender] ==
                        userWethTreeBefore -
                            (
                                freeSpace >= userWethTreeBefore
                                    ? userWethTreeBefore
                                    : freeSpace
                            )
                );

                useDaiTree = userDaiTreeBefore;

                useWethTree = freeSpace >= userWethTreeBefore
                    ? userWethTreeBefore
                    : freeSpace;
            }

            for (
                uint256 i = lastFundedTreeIdLocal + 1;
                i <= lastFundedTreeIdLocal + count;
                i++
            ) {
                //----------------check tree minted
                assert(treeContract.exists(i));

                address recipient = treeContract.ownerOf(i);

                assert(recipient == msg.sender);

                //----------------check attribute generated

                assert(treeContract.attributeExists(i));

                uint256 ambassadorFund = planterFundContract
                    .treeToAmbassadorProjectedEarning(i);
                uint256 planterFund = planterFundContract
                    .treeToPlanterProjectedEarning(i);

                assert(ambassadorFund == referralTreePaymentToAmbassador);
                assert(planterFund == referralTreePaymentToPlanter);
            }

            assert(
                planterFundAmountBefore +
                    (useDaiTree *
                        (referralTreePaymentToPlanter +
                            referralTreePaymentToAmbassador)) ==
                    daiContract.balanceOf(address(planterFundContract))
            );

            assert(
                wethFund.totalDaiDebtToPlanterContract() ==
                    totalDaiDebtBefore +
                        (useWethTree *
                            (referralTreePaymentToPlanter +
                                referralTreePaymentToAmbassador))
            );
        } else {
            _checkClaimReferralReward(
                data2,
                userDaiTreeBefore,
                userWethTreeBefore
            );
        }
    }

    function _checkClaimReferralReward(
        bytes memory _data,
        uint256 userDaiTreeBefore,
        uint256 userWethTreeBefore
    ) private pure {
        if (_data.length < 68) {
            assert(false);
        }

        assembly {
            _data := add(_data, 0x04)
        }

        string memory result = abi.decode(_data, (string));

        if (userDaiTreeBefore == 0 && userWethTreeBefore == 0) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("invalid gift owner")))
            );
        } else {
            assert(false);
        }
    }

    function _checkErrorFundTree(
        bytes memory _data,
        uint256 count,
        uint256 randomMint,
        uint256 randomApprove
    ) private {
        if (_data.length < 68) {
            assert(false);
        }

        assembly {
            _data := add(_data, 0x04)
        }

        string memory result = abi.decode(_data, (string));

        if (count == 0) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("invalid count")))
            );
        } else if (invalidReferal) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("Invalid referal address")))
            );
        } else if (randomMint == 0) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("invalid amount")))
            );
        } else if (randomApprove == 0) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(
                        abi.encodePacked(
                            ("ERC20: transfer amount exceeds allowance")
                        )
                    )
            );
        } else {
            assert(false);
        }
    }

    function _calculateReferrerCount(
        address _referrer,
        uint256 _referrerCount,
        uint256 _referrerClaimableTreesDai,
        uint256 _count
    ) private view {
        if (_referrer != address(0)) {
            uint256 tempReferrerCount = _referrerCount + _count;

            uint256 tempReferrerClaimableTreesDai = _referrerClaimableTreesDai;

            if (tempReferrerCount >= referralTriggerCount) {
                uint256 toClaimCount = tempReferrerCount / referralTriggerCount;
                tempReferrerCount -= toClaimCount * referralTriggerCount;
                tempReferrerClaimableTreesDai += toClaimCount;
            }

            assert(
                referrerClaimableTreesDai[_referrer] ==
                    tempReferrerClaimableTreesDai
            );

            assert(referrerCount[_referrer] == tempReferrerCount);
        } else {
            assert(referrerClaimableTreesDai[_referrer] == 0);
            assert(referrerCount[_referrer] == 0);
        }
    }
}
