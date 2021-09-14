require("dotenv").config();

const TreeAttribute = artifacts.require("TreeAttribute.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
  }

  console.log("Call Tree Attribute Methods...");
  await TreeAttribute.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
