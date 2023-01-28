require("dotenv").config();

const HonoraryTree = artifacts.require("HonoraryTree.sol");
const Attribute = artifacts.require("Attribute.sol");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactoryV2.address;
  const planterFundsAddress = PlanterFund.address;
  const attributeAddress = Attribute.address;
  let daiTokenAddress;
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    daiTokenAddress = Dai.address;
  } else if (network == "mumbai") {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = eval(
      `process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call HonoraryTree Methods...");
  await HonoraryTree.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setAttributesAddress(attributeAddress);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setPlanterFundAddress(planterFundsAddress);
  });
};
