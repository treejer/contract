require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSell = artifacts.require("RegularSell.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const O2_FACTORY_ROLE = web3.utils.soliditySha3("O2_FACTORY_ROLE");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let accessRestrictionAddress = AccessRestriction.address;
  let treeAddressAddress = Tree.address;
  let treeAuctionAddress = TreeAuction.address;
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

  console.log("Call UpdateFactory Methods...");
  await UpdateFactory.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setGBFactoryAddress(gbFactoryAddress);
    await instance.setTrustedForwarder(trustedForwarder);
  });

  console.log("Call AccessRestriction Methods...");
  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(SEED_FACTORY_ROLE, seedFactoryAddress);
    await instance.grantRole(TREE_FACTORY_ROLE, treeFactoryAddress);
    // await instance.grantRole(O2_FACTORY_ROLE, o2FactoryAddress);
  });

  console.log("Call WhitelistPaymaster Methods...");
  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.setWhitelistTarget(treeFactoryAddress);
    await instance.setWhitelistTarget(gbFactoryAddress);
    await instance.setWhitelistTarget(updateFactoryAddress);

    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });

  console.log("Fund Paymaster");
  if (!isLocal) {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: paymasterAddress,
      value: web3.utils.toWei("1"),
    });
  }
};
