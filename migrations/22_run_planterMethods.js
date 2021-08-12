require("dotenv").config();

const Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  //gsn
  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Call Planter Methods...");
  await Planter.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
