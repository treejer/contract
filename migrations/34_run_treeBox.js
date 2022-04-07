require("dotenv").config();

const TreeBox = artifacts.require("TreeBox.sol");

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

  console.log("Call TreeBox Methods...");
  await TreeBox.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
