pragma solidity ^0.8.6;
import "./../../../regularSale/RegularSale.sol";

import "./../../uniswap/Dai.sol";

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
        IERC20Upgradeable(0x6346e3A22D2EF8feE3B3c2171367490e52d81C52);
    IPlanterFund internal planterFundContract =
        IPlanterFund(0xE86bB98fcF9BFf3512C74589B78Fb168200CC546);
    IWethFund internal wethFund =
        IWethFund(0xb7C9b454221E26880Eb9C3101B3295cA7D8279EF);

    RegularSale internal regularSale = new RegularSale();

    Dai internal daiContract = Dai(0x6346e3A22D2EF8feE3B3c2171367490e52d81C52);

    constructor() {
        isRegularSale = true;
        lastFundedTreeId = 10000;
        maxTreeSupply = 1000000;

        referralTriggerCount = 20;
        price = 7 * 10**18;
    }

    function fundTree(
        uint256 _count,
        address _referrer,
        address _recipient
    ) public {
        uint256 count = (_count % 101) + 1;

        daiContract.setMint(msg.sender, count * price);

        daiContract.setApprove(msg.sender, address(regularSale), count * price);

        (bool success1, bytes memory data1) = address(regularSale).delegatecall(
            abi.encodeWithSignature(
                "fundTree(uint256,address,address)",
                count,
                _referrer,
                _recipient
            )
        );

        // require(success1, "regularSale fundTree problem");

        assert(false);
    }
}
