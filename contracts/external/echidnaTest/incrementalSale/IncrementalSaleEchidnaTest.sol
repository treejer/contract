pragma solidity ^0.8.6;
import "./../../../incrementalSale/IncrementalSale.sol";
// import "./../../../regularSale/RegularSale.sol";
import "./../../uniswap/Weth.sol";

import "./../../../tree/ITree.sol";

import "./../../uniswap/Dai.sol";

import "./../../miniUniswap/UniSwapMini.sol";

contract IncrementalSaleEchidnaTest {
    struct IncrementalSaleData {
        uint256 startTreeId;
        uint256 endTreeId;
        uint256 initialPrice;
        uint64 increments;
        uint64 priceJump;
    }

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

    /** NOTE {isIncrementalSale} set inside the initialize to {true} */
    bool internal isIncrementalSale;
    /** NOTE last tree id sold in incremetal sale */
    uint256 internal lastSold;

    /** NOTE {incrementalSaleData} store startTreeId, endTreeId, initialPrice,
     *  increments, priceJump values
     */
    IncrementalSaleData internal incrementalSaleData;

    IAccessRestriction internal accessRestriction =
        IAccessRestriction(0x871DD7C2B4b25E1Aa18728e9D5f2Af4C4e431f5c);
    ITreeFactory internal treeFactory =
        ITreeFactory(0x4112f5fc3f737e813ca8cC1A48D1da3dc8719435);

    IWethFund internal wethFund =
        IWethFund(0xb7C9b454221E26880Eb9C3101B3295cA7D8279EF);

    IAllocation internal allocation =
        IAllocation(0x131855DDa0AaFF096F6854854C55A4deBF61077a);

    IAttribute internal attribute =
        IAttribute(0x04B5dAdd2c0D6a261bfafBc964E0cAc48585dEF3);

    IPlanterFund internal planterFundContract =
        IPlanterFund(0xE86bB98fcF9BFf3512C74589B78Fb168200CC546);

    IRegularSale internal regularSale =
        IRegularSale(0xcFC18CEc799fBD1793B5C43E773C98D4d61Cc2dB);

    IERC20Upgradeable internal wethToken =
        IERC20Upgradeable(address(new Dai("WETH", "weth")));

    IncrementalSale internal incrementalSaleContract = new IncrementalSale();

    Weth internal wethContract = Weth(address(wethToken));

    ITree internal treeContract =
        ITree(0x32EeCaF51DFEA9618e9Bc94e9fBFDdB1bBdcbA15);

    Dai internal daiContract = new Dai("DAI", "dai");

    UniSwapMini internal uniSwap =
        new UniSwapMini(address(daiContract), address(wethContract));

    bytes32 internal constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");

    bytes32 internal constant DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");

    constructor() {
        isIncrementalSale = true;

        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, address(this));

        accessRestriction.grantRole(DATA_MANAGER_ROLE, address(this));

        IncrementalSaleData storage incSaleData = incrementalSaleData;

        treeFactory.manageSaleTypeBatch(101, 10001, 2);

        incSaleData.startTreeId = 101;
        incSaleData.endTreeId = 10001;
        incSaleData.initialPrice = .01 * 10**18;
        incSaleData.increments = 10;
        incSaleData.priceJump = 1000;

        lastSold = 101 - 1;

        wethFund.setWethTokenAddress(address(wethContract));
        wethFund.setDexRouterAddress(address(uniSwap));

        daiContract.setMint(address(uniSwap), 1e15 * 10**18);
    }

    uint256 private randomApprove;
    bool private invalidReferal;

    function fundTreeEchidna(
        uint256 _count,
        address _referrer,
        address _recipient
    ) public {
        uint256 count = (_count % 50);
        address referrer = _referrer;
        address recipient = _recipient;

        uint256 randomMint = uint256(
            keccak256(abi.encodePacked(msg.sender, _count))
        ) % 10;

        randomApprove =
            uint256(keccak256(abi.encodePacked(referrer, _count, recipient))) %
            10;

        (
            uint256 totalAmount,
            uint256 totalPlanterShare,
            uint256 totalAmbassadorShare,
            uint256 totalPlanterFundDai
        ) = _calAountFund(count);

        totalPlanterFundDai = _getAmountOut(
            ((totalPlanterShare + totalAmbassadorShare) * totalAmount) /
                (count * 10000)
        );

        if (randomMint >= 3) {
            wethContract.setMint(msg.sender, totalAmount);
        }

        if (randomApprove >= 3) {
            wethContract.setApprove(msg.sender, address(this), totalAmount);
        }

        _callFunction(
            count,
            referrer,
            recipient,
            totalAmount,
            totalPlanterFundDai,
            totalPlanterShare,
            totalAmbassadorShare,
            randomMint
        );
    }

    function _callFunction(
        uint256 count,
        address referrer,
        address recipient,
        uint256 totalAmount,
        uint256 totalPlanterFundDai,
        uint256 totalPlanterShare,
        uint256 totalAmbassadorShare,
        uint256 randomMint
    ) private {
        uint256 planterFundAmountBefore = daiContract.balanceOf(
            address(planterFundContract)
        );

        uint256 wethFundBefore = wethContract.balanceOf(address(wethFund));

        uint256 lastSoldBefore = lastSold;

        (bool success1, bytes memory data1) = address(incrementalSaleContract)
            .delegatecall(
                abi.encodeWithSignature(
                    "fundTree(uint256,address,address,uint256)",
                    count,
                    referrer,
                    recipient,
                    0
                )
            );

        address owner = recipient != address(0) ? recipient : msg.sender;

        invalidReferal = owner == referrer;

        if (success1) {
            _checkSuccessFundTree(
                lastSoldBefore,
                count,
                totalPlanterFundDai,
                totalAmount,
                owner
            );

            //---------------balanceOf planterFund

            assert(
                planterFundAmountBefore + totalPlanterFundDai ==
                    daiContract.balanceOf(address(planterFundContract))
            );

            //---------------balanceOf daiFund

            assert(
                wethFundBefore +
                    (totalAmount -
                        ((totalPlanterShare + totalAmbassadorShare) *
                            totalAmount) /
                        (count * 10000)) ==
                    wethContract.balanceOf(address(wethFund))
            );

            //-------------- referral
        } else {
            _checkErrorFundTree(
                data1,
                count,
                randomMint,
                lastSoldBefore,
                totalAmount
            );
        }
    }

    function _calAountFund(uint256 count)
        private
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 totalAmount = 0;
        uint256 totalPlanterShare = 0;
        uint256 totalAmbassadorShare = 0;
        uint256 totalPlanterFundDai = 0;

        for (uint256 i = lastSold + 1; i <= lastSold + count; i++) {
            uint256 increament = (i - incrementalSaleData.startTreeId) /
                incrementalSaleData.increments;

            totalAmount += (incrementalSaleData.initialPrice +
                (incrementalSaleData.priceJump *
                    increament *
                    incrementalSaleData.initialPrice) /
                10000);

            (
                uint16 planterShareBefore,
                uint16 ambassadorShareBefore,
                ,
                ,
                ,
                ,
                ,

            ) = allocation.findAllocationData(i);

            totalPlanterShare += planterShareBefore;
            totalAmbassadorShare += ambassadorShareBefore;
        }

        return (
            totalAmount,
            totalPlanterShare,
            totalAmbassadorShare,
            totalPlanterFundDai
        );
    }

    function _checkSuccessFundTree(
        uint256 lastSoldBefore,
        uint256 count,
        uint256 totalPlanterFundDai,
        uint256 totalAmount,
        address owner
    ) private {
        //--------------check msg.sender balance

        for (uint256 i = lastSoldBefore + 1; i <= lastSoldBefore + count; i++) {
            //----------------check tree minted
            assert(treeContract.exists(i));
            address recipient = treeContract.ownerOf(i);
            assert(recipient == owner);

            //----------------check attribute generated

            (, , , , , , , , uint256 generationTypeAttr) = treeContract
                .attributes(i);

            assert(generationTypeAttr == 16);

            //----------------check symbol generated

            (, , , , uint256 generationTypeSmbol) = treeContract.symbols(i);

            assert(generationTypeSmbol == 16);

            // //--------------------check planter fund

            uint256 increament = (i - incrementalSaleData.startTreeId) /
                incrementalSaleData.increments;

            uint256 price = (incrementalSaleData.initialPrice +
                (incrementalSaleData.priceJump *
                    increament *
                    incrementalSaleData.initialPrice) /
                10000);

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

            assert(
                ambassadorFund ==
                    (totalPlanterFundDai * price * ambassadorShare) /
                        ((ambassadorShare + planterShare) * totalAmount)
            );

            assert(
                planterFund ==
                    (totalPlanterFundDai * price * planterShare) /
                        ((ambassadorShare + planterShare) * totalAmount)
            );
        }
    }

    function _checkErrorFundTree(
        bytes memory _data,
        uint256 count,
        uint256 randomMint,
        uint256 lastSoldBefore,
        uint256 totalAmount
    ) private view {
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
                    keccak256(abi.encodePacked(("Invalid count")))
            );
        } else if (lastSoldBefore + count >= incrementalSaleData.endTreeId) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(
                        abi.encodePacked(
                            ("Not enough tree in incremental sell")
                        )
                    )
            );
        } else if (invalidReferal) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("Invalid referal address")))
            );
        } else if (
            randomMint < 3 && wethContract.balanceOf(msg.sender) < totalAmount
        ) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("low price paid")))
            );
        } else if (randomApprove < 3) {
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

    function _getAmountOut(uint256 _amountIn)
        internal
        returns (uint256 amount)
    {
        address[] memory path;
        path = new address[](2);

        path[0] = address(wethContract);
        path[1] = address(daiContract);

        uint256[] memory amounts = uniSwap.getAmountsOut(_amountIn, path);

        return amounts[1];
    }
}
