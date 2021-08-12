require("dotenv").config();

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSell = artifacts.require("RegularSell.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const WethFunds = artifacts.require("WethFunds.sol");

const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactory.address;
  let treasuryAddress = Treasury.address;
  let planterAddress = Planter.address;
  let regularSellAddress = RegularSell.address;
  let incrementalSellAddress = IncrementalSell.address;
  let treeAttributeAddress = TreeAttribute.address;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress = WhitelistPaymaster.address;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Call WhitelistPaymaster Methods...");
  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.setWhitelistTarget(planterAddress);
    await instance.setWhitelistTarget(treasuryAddress);
    await instance.setWhitelistTarget(treeFactoryAddress);
    await instance.setWhitelistTarget(planterAddress);
    await instance.setWhitelistTarget(treasuryAddress);
    await instance.setWhitelistTarget(treeFactoryAddress);
    await instance.setWhitelistTarget(planterAddress);
    await instance.setWhitelistTarget(treasuryAddress);
    await instance.setWhitelistTarget(treeFactoryAddress);

    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
