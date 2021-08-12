require("dotenv").config();

const TreeAuction = artifacts.require("TreeAuction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const WethFunds = artifacts.require("WethFunds.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Weth = artifacts.require("Weth.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactory.address;
  let financialModelAddress = FinancialModel.address;
  let wethFundsAddress = WethFunds.address;
  let wethTokenAddress;
  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
    wethTokenAddress = Weth.address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
    wethTokenAddress = process.env.WETH_ADDRESS;
  }

  console.log("Call TreeAuction Methods...");
  await TreeAuction.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setFinancialModelAddress(financialModelAddress);
    await instance.setWethFundsAddress(wethFundsAddress);
    await instance.setWethTokenAddress(wethTokenAddress);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
