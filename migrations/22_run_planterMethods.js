require("dotenv").config();

const Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
  }

  console.log("Call Planter Methods...");
  await Planter.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
