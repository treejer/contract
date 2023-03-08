require("dotenv").config();

const Auction = artifacts.require("Auction.sol");
const HonoraryTree = artifacts.require("HonoraryTree.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");
const PlanterV2 = artifacts.require("PlanterV2.sol");
const RegularSale = artifacts.require("RegularSale.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const auctionAddress = Auction.address;
  const honoraryTreeAddress = HonoraryTree.address;
  const incrementalSaleAddress = IncrementalSale.address;
  const planterAddress = PlanterV2.address;
  const regularSaleAddress = RegularSale.address;
  const planterFundAddress = PlanterFund.address;
  const treeFactoryAddress = TreeFactoryV2.address;

  //gsn
  let trustedForwarder;
  let relayHub;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    relayHub = eval(`process.env.GSN_RELAY_HUB_${network.toUpperCase()}`);
  }

  console.log("Call WhitelistPaymaster Methods...");
  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.addFunderWhitelistTarget(honoraryTreeAddress);
    await instance.addPlanterWhitelistTarget(planterAddress);
    await instance.addFunderWhitelistTarget(regularSaleAddress);
    await instance.addPlanterWhitelistTarget(planterFundAddress);
    await instance.addPlanterWhitelistTarget(treeFactoryAddress);
    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
