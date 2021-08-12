require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeTokenAddress = Tree.address;
  const planterAddress = Planter.address;
  const planterFundAddress = PlanterFund.address;
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

  console.log("Call Tree Factory Methods...");

  await TreeFactory.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterFundAddress(planterFundAddress);
    await instance.setPlanterAddress(planterAddress);
    await instance.setTreeTokenAddress(treeTokenAddress);
  });
};
