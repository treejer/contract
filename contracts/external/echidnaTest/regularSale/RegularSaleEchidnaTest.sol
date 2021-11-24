pragma solidity ^0.8.6;
import "./../../../regularSale/RegularSale.sol";

contract PlanterEchidnaTest {
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

    IAccessRestriction internal accessRestriction;
    ITreeFactory internal treeFactory;
    IAttribute internal attribute;
    IDaiFund internal daiFund;
    IAllocation internal allocation;
    IERC20Upgradeable internal daiToken;
    IPlanterFund internal planterFundContract;
    IWethFund internal wethFund;
}
