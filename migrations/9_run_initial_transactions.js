require("dotenv").config();

const Tree = artifacts.require("Tree.sol");

const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress = WhitelistPaymaster.address;

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

  console.log("Call Tree Methods...");

  await Tree.deployed().then((instance) => {});

  console.log("Call Tree Factory Methods...");

  await TreeFactory.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setTreasuryAddress(Treasury.address);
    await instance.setPlanterAddress(Planter.address);
    await instance.setTreeTokenAddress(Tree.address);
  });
};
