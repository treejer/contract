require("dotenv").config();

const TreeAuction = artifacts.require("TreeAuction.sol");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSell = artifacts.require("RegularSell.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeAuctionAddress = TreeAuction.address;
  const communityGiftsAddress = CommunityGifts.address;
  const incrementalSellAddress = IncrementalSell.address;
  const planterAddress = Planter.address;
  const regularSellAddress = RegularSell.address;
  const planterFundAddress = PlanterFund.address;
  const treeFactoryAddress = TreeFactory.address;

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

  console.log("Call WhitelistPaymaster Methods...");
  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.addFunderWhitelistTarget(treeAuctionAddress);
    await instance.addFunderWhitelistTarget(communityGiftsAddress);
    await instance.addFunderWhitelistTarget(incrementalSellAddress);
    await instance.addPlanterWhitelistTarget(planterAddress);
    await instance.addFunderWhitelistTarget(regularSellAddress);
    await instance.addPlanterWhitelistTarget(planterFundAddress);
    await instance.addPlanterWhitelistTarget(treeFactoryAddress);
    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
