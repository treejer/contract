require("dotenv").config();

const PlanterFund = artifacts.require("PlanterFund.sol");
const Planter = artifacts.require("PlanterV2.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let planterAddress = Planter.address;
  let daiTokenAddress;
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    daiTokenAddress = Dai.address;
  } else if (network == "mumbai") {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = eval(
      `process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call PlanterFund Methods...");
  await PlanterFund.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterContractAddress(planterAddress);
    await instance.setDaiTokenAddress(daiTokenAddress);
    // await instance.setOutgoingAddress(process.env.OUT_GOING_ADDRESS);
  });
};
