require("dotenv").config();

const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("Call Fund Paymaster Methods...");

  let paymasterAddress = WhitelistPaymaster.address;

  if (!isLocal) {
    await web3.eth.sendTransaction(
      {
        from: accounts[0],
        to: paymasterAddress,
        value: web3.utils.toWei(".2"),
      },
      (err, res) => {
        console.log("err", err);
        console.log("res", res);
      }
    );
  }
};
