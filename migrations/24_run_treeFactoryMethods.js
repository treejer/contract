require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = ["development", "mumbai"].includes(network);

  const treeTokenAddress = Tree.address;
  const planterAddress = Planter.address;
  const planterFundAddress = PlanterFund.address;

  //gsn
  const trustedForwarder = isLocal
    ? require("../build/gsn/Forwarder.json").address
    : eval(`process.env.GSN_FORWARDER_${network.toUpperCase()}`);

  console.log("Call Tree Factory Methods...");
  await TreeFactoryV2.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterFundAddress(planterFundAddress);
    await instance.setPlanterContractAddress(planterAddress);
    await instance.setTreeTokenAddress(treeTokenAddress);
  });
};
