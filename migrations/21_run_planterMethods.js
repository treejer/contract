require("dotenv").config();

const PlanterV2 = artifacts.require("PlanterV2.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
  }

  console.log("Call PlanterV2 Methods...");
  await PlanterV2.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);

    // for testing remove later
    await instance.join(
      1,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      { from: accounts[1] }
    );
  });
};
