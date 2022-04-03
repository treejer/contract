require("dotenv").config();

const WhitelistPaymasterTreeBox = artifacts.require(
  "WhitelistPaymasterTreeBox.sol"
);

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  //gsn
  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    relayHub = eval(`process.env.GSN_RELAY_HUB_${network.toUpperCase()}`);
  }

  console.log("Call WhitelistPaymasterTreeBox Methods...");
  await WhitelistPaymasterTreeBox.deployed().then(async (instance) => {
    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
