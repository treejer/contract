pragma solidity ^0.8.6;

import "./../../../treasury/PlanterFund.sol";

import "./../../uniswap/Dai.sol";

contract PlanterFundEchidnaTest {
    address private trustedForwarder;

    struct TotalBalances {
        uint256 planter;
        uint256 ambassador;
        uint256 localDevelopment;
    }

    /** NOTE {isPlanterFund} set inside the initialize to {true} */
    bool internal isPlanterFund;

    /** NOTE minimum withdrawable amount */
    uint256 internal minWithdrawable;

    address private localDevelopmentAddress;

    IAccessRestriction internal accessRestriction =
        IAccessRestriction(0x871DD7C2B4b25E1Aa18728e9D5f2Af4C4e431f5c);
    IPlanter internal planterContract;
    IERC20Upgradeable internal daiToken =
        IERC20Upgradeable(address(new Dai("DAI", "dai")));

    /** NOTE totalBalances keep total share of
     * planter, ambassador, localDevelopment
     */
    TotalBalances internal totalBalances;

    /** NOTE mapping of treeId to planterProjectedEarning*/
    mapping(uint256 => uint256) internal treeToPlanterProjectedEarning;

    /** NOTE mapping of treeId to ambassadorProjectedEarning*/
    mapping(uint256 => uint256) internal treeToAmbassadorProjectedEarning;

    /** NOTE mpping of treeId to treeToPlanterTotalClaimed balance*/
    mapping(uint256 => uint256) internal treeToPlanterTotalClaimed;

    /** NOTE mapping of planter address to planter balance*/
    mapping(address => uint256) internal balances;

    PlanterFund internal planterFundContract = new PlanterFund();

    Dai internal daiContract = Dai(address(daiToken));

    //Dai(0x6346e3A22D2EF8feE3B3c2171367490e52d81C52);

    bytes32 internal constant TREEJER_CONTRACT_ROLE =
        keccak256("TREEJER_CONTRACT_ROLE");

    bytes32 internal constant DATA_MANAGER_ROLE =
        keccak256("DATA_MANAGER_ROLE");

    constructor() {
        isPlanterFund = true;
        minWithdrawable = .5 ether;

        accessRestriction.grantRole(TREEJER_CONTRACT_ROLE, address(this));

        accessRestriction.grantRole(DATA_MANAGER_ROLE, address(this));
    }

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    function withdrawBalance(uint256 _amount) public {
        uint256 random = uint256(
            keccak256(abi.encodePacked(msg.sender, _amount))
        ) % 10;

        uint256 random2 = uint256(keccak256(abi.encodePacked(msg.sender))) % 50;

        uint256 amount = _amount;

        if (true) {
            daiContract.setMint(address(this), amount + (random2 * 10**18));
            balances[msg.sender] += (amount + (random2 * 10**18));
        } else if (random > 4) {
            daiContract.setMint(address(this), amount);
            balances[msg.sender] += amount;
        } else if (random > 2) {
            daiContract.setMint(address(this), .25 * 10**18);
            balances[msg.sender] += .25 * 10**18;
        }

        uint256 userDaiBefore = daiContract.balanceOf(address(msg.sender));
        uint256 contractDaiBefore = daiContract.balanceOf(address(this));

        (bool success1, bytes memory data1) = address(planterFundContract)
            .delegatecall(
                abi.encodeWithSignature("withdrawBalance(uint256)", amount)
            );

        if (success1) {
            uint256 userDaiAfter = daiContract.balanceOf(address(msg.sender));
            uint256 contractDaiAfter = daiContract.balanceOf(address(this));
            assert(userDaiAfter == userDaiBefore + amount);
            assert(contractDaiAfter + amount == contractDaiBefore);
        } else {
            _ErrorWithdrawBalance(data1, amount, userDaiBefore);
        }
    }

    function _ErrorWithdrawBalance(
        bytes memory _data,
        uint256 amount,
        uint256 userDaiBefore
    ) private {
        if (_data.length < 68) {
            assert(false);
        }

        assembly {
            _data := add(_data, 0x04)
        }

        string memory result = abi.decode(_data, (string));

        if (userDaiBefore < amount || amount < .5 * 10**18) {
            assert(
                keccak256(abi.encodePacked((result))) ==
                    keccak256(abi.encodePacked(("Invalid amount")))
            );
        } else {
            assert(false);
        }
    }
}
