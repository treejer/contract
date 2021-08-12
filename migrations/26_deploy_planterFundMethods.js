require("dotenv").config();

const PlanterFund = artifacts.require("PlanterFund.sol");
const Planter = artifacts.require("Planter.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let planterAddress = Planter.address;
  let daiTokenAddress;
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
  console.log("Call PlaanterFund Methods...");

  await PlanterFund.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterContractAddress(planterAddress);
    await instance.setDaiTokenAddress;
    daiTokenAddress;
  });
};
