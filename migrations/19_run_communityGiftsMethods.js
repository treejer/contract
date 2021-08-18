require("dotenv").config();

const CommunityGifts = artifacts.require("CommunityGifts.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactory.address;
  const planterFundsAddress = PlanterFund.address;
  const treeAttributeAddress = TreeAttribute.address;

  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
  }

  console.log("Call CommunityGifts Methods...");
  await CommunityGifts.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setTreeAttributesAddress(treeAttributeAddress);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setPlanterFundAddress(planterFundsAddress);
  });
};
