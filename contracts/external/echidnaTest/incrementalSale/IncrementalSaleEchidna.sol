pragma solidity ^0.8.6;
import "./../../../incrementalSale/IncrementalSale.sol";
// import "./../../../regularSale/RegularSale.sol";
import "./../../uniswap/Weth.sol";

import "./../../../tree/ITree.sol";

contract IncrementalSaleEchidnaTest {
    address internal trustedForwarder;

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

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

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
        IERC20Upgradeable(address(new Weth("WETH", "weth")));

    IncrementalSale internal incrementalSaleContract = new IncrementalSale();

    Weth internal wethContract = Weth(address(wethToken));

    ITree internal treeContract =
        ITree(0x32EeCaF51DFEA9618e9Bc94e9fBFDdB1bBdcbA15);

    bytes32 internal constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");

    bytes32 internal constant DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");

    constructor() {
        isIncrementalSale = true;

        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, address(this));

        accessRestriction.grantRole(DATA_MANAGER_ROLE, address(this));

        // daiFund.setDaiTokenAddress(address(daiContract));
    }

    function check_createIncrementalSale(
        uint256 _startTreeId,
        uint256 _initialPrice,
        uint64 _treeCount,
        uint64 _increments,
        uint64 _priceJump
    ) public {
        _treeCount = _treeCount % 100 == 0 ? 0 : _treeCount % 50;
        _increments = _increments % 100 == 0 ? 0 : _increments;

        bool reserveTree = _startTreeId % 50 < 40 &&
            _treeCount > 5 &&
            _startTreeId > 200 &&
            _increments > 0;

        accessRestriction.grantRole(DATA_MANAGER_ROLE, msg.sender);

        if (reserveTree) {
            treeFactory.manageSaleTypeBatch(
                _startTreeId + 1,
                _startTreeId + 4,
                1
            );

            (, , , uint32 saleType1, , , , ) = treeFactory.trees(
                _startTreeId + 2
            );
            assert(saleType1 == 1);
        }

        (bool success1, bytes memory data1) = address(incrementalSaleContract)
            .delegatecall(
            abi.encodeWithSignature(
                "createIncrementalSale(uint256,uint256,uint64,uint64,uint64)",
                _startTreeId,
                _initialPrice,
                _treeCount,
                _increments,
                _priceJump
            )
        );

        //require(success1);

        if (success1) {
            assert(incrementalSaleData.startTreeId == _startTreeId);
            assert(incrementalSaleData.initialPrice == _initialPrice);
            assert(incrementalSaleData.endTreeId == _startTreeId + _treeCount);
            assert(incrementalSaleData.increments == _increments);
            assert(incrementalSaleData.priceJump == _priceJump);
            assert(lastSold == _startTreeId - 1);
            for (
                uint256 start = _startTreeId;
                start < _startTreeId + _treeCount;
                start++
            ) {
                (, , , uint32 saleType, , , , ) = treeFactory.trees(start);

                assert(saleType == 2);
            }
        } else {
            assembly {
                data1 := add(data1, 0x04)
            }

            if (data1.length < 68) revert();

            string memory errorMsg;

            if (_treeCount == 0) {
                errorMsg = "assign at least one tree";
                assert(
                    keccak256(
                        abi.encodePacked((abi.decode(data1, (string))))
                    ) == keccak256(abi.encodePacked((errorMsg)))
                );
            } else if (_startTreeId < 100) {
                errorMsg = "trees are under Auction";
                assert(
                    keccak256(
                        abi.encodePacked((abi.decode(data1, (string))))
                    ) == keccak256(abi.encodePacked((errorMsg)))
                );
            } else if (_increments == 0) {
                errorMsg = "incremental period should be positive";
                assert(
                    keccak256(
                        abi.encodePacked((abi.decode(data1, (string))))
                    ) == keccak256(abi.encodePacked((errorMsg)))
                );
            } else if (reserveTree) {
                errorMsg = "trees are not available for sell";
                assert(
                    keccak256(
                        abi.encodePacked((abi.decode(data1, (string))))
                    ) == keccak256(abi.encodePacked((errorMsg)))
                );
            }
        }
    }
}
