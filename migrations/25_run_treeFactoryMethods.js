require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const TreeFactory = artifacts.require("TreeFactoryV2.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Planter = artifacts.require("PlanterV2.sol");

const MarketPlace = artifacts.require("MarketPlace.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = ["development", "mumbai"].includes(network);

  const treeTokenAddress = Tree.address;
  const planterAddress = Planter.address;
  const planterFundAddress = PlanterFund.address;

  const marketPlaceAddress = MarketPlace.address;

  //gsn
  const trustedForwarder = isLocal
    ? require("../build/gsn/Forwarder.json").address
    : eval(`process.env.GSN_FORWARDER_${network.toUpperCase()}`);

  console.log("Call Tree Factory Methods...");
  await TreeFactory.deployed().then(async (instance) => {
    await instance.setMarketPlaceAddress(marketPlaceAddress);
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterFundAddress(planterFundAddress);
    await instance.setPlanterContractAddress(planterAddress);
    await instance.setTreeTokenAddress(treeTokenAddress);
  });
};
