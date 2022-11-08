require("dotenv").config();

const WhitelistPaymasterV3 = artifacts.require("WhitelistPaymasterV3.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  console.log("Call Fund Paymaster Methods...");

  let paymasterAddress = WhitelistPaymasterV3.address;
  console.log("paymasterAddress = ", paymasterAddress);

  if (!isLocal) {
    await web3.eth.sendTransaction(
      {
        from: accounts[0],
        to: paymasterAddress,
        value: web3.utils.toWei("0.1"),
      },
      (err, res) => {
        console.log("err", err);
        console.log("res", res);
      }
    );
  }
};
