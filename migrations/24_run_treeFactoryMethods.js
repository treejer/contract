require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const PlanterV2 = artifacts.require("PlanterV2.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = ["development", "mumbai"].includes(network);

  const treeTokenAddress = Tree.address;
  const planterAddress = PlanterV2.address;
  const planterFundAddress = PlanterFund.address;

  //gsn
  const trustedForwarder = isLocal
    ? require("../build/gsn/Forwarder.json").address
    : eval(`process.env.GSN_FORWARDER_${network.toUpperCase()}`);

  console.log("Call Tree Factory Methods...");
  await TreeFactoryV2.deployed().then(async (instance) => {
    await instance.setData(0, trustedForwarder);
    await instance.setData(1, planterFundAddress);
    await instance.setData(2, planterAddress);
    await instance.setData(3, treeTokenAddress);

    // for testing remove later
    await instance.listTree(10, "treeSpecs");

    await instance.assignTree(10, accounts[1]);

    // await instance.setTrustedForwarder(trustedForwarder);
    // await instance.setPlanterFundAddress(planterFundAddress);
    // await instance.setPlanterContractAddress(planterAddress);
    // await instance.setTreeTokenAddress(treeTokenAddress);
  });
};
