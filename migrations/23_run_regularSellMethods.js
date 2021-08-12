require("dotenv").config();
const RegularSell = artifacts.require("RegularSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");
const Dai = artifacts.require("Dai.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactory.address;
  const daiFundsAddress = DaiFunds.address;
  const financialModelAddress = FinancialModel.address;
  let daiTokenAddress;

  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    daiTokenAddress = eval(
      `process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
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
