require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
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
    : process.env.GSN_FORWARDER;

  console.log("Call Tree Factory Methods...");
  await TreeFactory.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterFundAddress(planterFundAddress);
    await instance.setPlanterContractAddress(planterAddress);
    await instance.setTreeTokenAddress(treeTokenAddress);
  });
};
