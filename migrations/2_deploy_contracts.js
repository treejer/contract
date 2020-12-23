require('dotenv').config();
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

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


module.exports = async function (deployer, network, accounts) {

  let accessRestrictionAddress;
  let treeTypeAddress;
  let treeFactoryAddress;
  let updateAddress;
  let gbAddress;
  let o2Address;
  let treeAddress;
  let seedAddress;

  console.log("Deploying on network '" + network + "' by account '" + accounts[0] + "'");

  await deployProxy(AccessRestriction, [accounts[0]], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { accessRestrictionAddress = AccessRestriction.address; });

  await deployProxy(Tree, [accessRestrictionAddress, process.env.BASE_URI], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { treeAddress = Tree.address; });

  await deployProxy(Seed, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { seedAddress = Seed.address; });
  
  await deployProxy(O2, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { o2Address = O2.address; });

  await deployProxy(GBFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { gbAddress = GBFactory.address; });

  await deployProxy(TreeType, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { treeTypeAddress = TreeType.address; });

  await deployProxy(UpdateFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { updateAddress = UpdateFactory.address; });

  await deployProxy(TreeFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => {
      treeFactoryAddress = TreeFactory.address;
      TreeFactory.deployed().then(async (instance) => {
        await instance.setGBFactoryAddress(gbAddress);
        await instance.setTreeTokenAddress(treeAddress);
        await instance.setUpdateFactoryAddress(updateAddress);
      });

    });


  UpdateFactory.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setGBFactoryAddress(gbAddress);
  });  

  await deployProxy(SeedFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      SeedFactory.deployed().then(async (instance) => {
        await instance.setSeedTokenAddress(seedAddress);
        await instance.setTreeTokenAddress(treeAddress);

        await instance.setTreeFactoryAddress(treeFactoryAddress);
      });
    });


  await deployProxy(O2Factory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      O2Factory.deployed().then(async (instance) => {
        await instance.setTreeTypeAddress(treeTypeAddress);
        await instance.setTreeFactoryAddress(treeFactoryAddress);
        await instance.setUpdateFactoryAddress(updateAddress);

        await instance.setO2TokenAddress(o2Address);
        await instance.setTreeTokenAddress(treeAddress);
      });
    });

  await deployProxy(ForestFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      ForestFactory.deployed().then(async (instance) => {
        await instance.setTreeFactoryAddress(treeFactoryAddress);
      });
    });  

  console.log("Deployed");
};
