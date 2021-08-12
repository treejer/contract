require("dotenv").config();

const CommunityGifts = artifacts.require("CommunityGifts.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactory.address;
  let planterFundsAddress = PlanterFund.address;
  let treeAttributeAddress = TreeAttribute.address;

  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Call CommunityGifts Methods...");
  await CommunityGifts.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setTreeAttributesAddress(treeAttributeAddress);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setPlanterFundAddress(planterFundsAddress);
  });
};
