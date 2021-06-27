// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";

contract RandomNumberConsumer is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    uint256 public lastRequestId;
    event RequestedRandomness(bytes32 requestId);

    /**
     * Constructor inherits VRFConsumerBase
     *
     * Network: Kovan
     * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
     */
    constructor(
        address _linkTokenAddress,
        bytes32 _keyHash,
        address _vrfCoordinatorAddress,
        uint256 _fee
    )
        public
        VRFConsumerBase(
            _vrfCoordinatorAddress, // VRF Coordinator
            _linkTokenAddress // LINK Token
        )
    {
        keyHash = _keyHash;
        fee = _fee;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber() public returns (bytes32 requestId) {
        requestId = requestRandomness(keyHash, fee);
        emit RequestedRandomness(requestId);
    }

    /**
     * Requests the address of the Chainlink Token on this network
     */
    function getChainlinkToken() public view returns (address) {
        return address(LINK);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        // 12 categories and 72 different values
        // All possibilities=9*3*3*12*3*8*3*3*8*5*10*4=334923200

        randomResult = randomness;
    }

    // function getExpandedResult(bytes32 requestId, uint256 n)
    //     external
    //     view
    //     returns (uint256[] memory expandedValues)
    // {
    //     return expand(randomResult, n);
    // }

    function expand(uint256 _randomValue, uint256 _n, uint256 _from, uint256 _to)
        public
        pure
        returns (uint256[] memory _expandedValues)
    {
        _expandedValues = new uint256[](_n);
        for (uint256 i = 0; i < _n; i++) {
            _expandedValues[i] = uint256(keccak256(abi.encode(_randomValue, i))).mod(_to).add(_from);
        }
        return _expandedValues;
    }
}
