require("dotenv").config();
const TreeFactory = artifacts.require("TreeFactory.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactory.address;
  const financialModelAddress = FinancialModel.address;
  const daiFundsAddress = DaiFunds.address;
  let daiTokenAddress;

  //gsn
  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
    daiTokenAddress = process.env.DAI_ADDRESS;
  }

  console.log("Call RegularSell Methods...");
  await RegularSell.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setDaiFundsAddress(daiFundsAddress);
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setFinancialModelAddress(financialModelAddress);
  });
};
