require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var Tree = artifacts.require("Tree.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2 = artifacts.require("O2.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var Seed = artifacts.require("Seed.sol");
var SeedFactory = artifacts.require("SeedFactory.sol");
var ForestFactory = artifacts.require("ForestFactory.sol");
var Dai = artifacts.require("Dai.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const O2_FACTORY_ROLE = web3.utils.soliditySha3("O2_FACTORY_ROLE");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let accessRestrictionAddress = AccessRestriction.address;
  let treeTypeAddress = TreeType.address;
  let treeFactoryAddress = TreeFactory.address;
  let updateFactoryAddress = UpdateFactory.address;
  let gbFactoryAddress = GBFactory.address;
  // let o2Address = O2Factory.address;
  let treeAddress = Tree.address;
  let seedAddress = Seed.address;
  let seedFactoryAddress = SeedFactory.address;
  // let o2FactoryAddress = O2Factory.address;
  // let forestFactory = ForestFactory.address;
  let daiTokenAddress;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress = WhitelistPaymaster.address;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
    console.log("Deploying Dai...");
    await deployer.deploy(Dai, web3.utils.toWei("1000000")).then(() => {
      daiTokenAddress = Dai.address;
    });
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
    daiTokenAddress = process.env.DAI_ADDRESS;
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
