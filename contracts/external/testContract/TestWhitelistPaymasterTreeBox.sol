// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;
import "./ITestWhitelistPaymaster.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./../../external/gsn/forwarder/IForwarder.sol";

contract TestWhitelistPaymasterTreeBox is Initializable {
    
    function test(address _address) external {
        ITestWhitelistPaymaster test1 = ITestWhitelistPaymaster(_address);
        bytes memory context;
        bool success = false;
        uint256 gasUseWithoutPost = 110;
        GsnTypes.RelayData memory s;
        test1.postRelayedCall(context, success, gasUseWithoutPost, s);
    }

    function testPreRelayedCall(
        address _address,
        address _toAddress,
        address _fromAddress
    ) external {
        ITestWhitelistPaymaster test1 = ITestWhitelistPaymaster(_address);

        GsnTypes.RelayRequest memory relayRequest;

        relayRequest.request.to = _toAddress;

        if (_fromAddress != address(0)) {
            relayRequest.request.from = _fromAddress;
        }

        bytes memory signature;
        bytes memory approvalData;
        uint256 maxPossibleGas = 110;

        test1.preRelayedCall(
            relayRequest,
            signature,
            approvalData,
            maxPossibleGas
        );
    }

 
}
