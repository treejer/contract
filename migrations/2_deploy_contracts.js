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

const SEED_FACTORY_ROLE = web3.utils.soliditySha3('SEED_FACTORY_ROLE');
const TREE_FACTORY_ROLE = web3.utils.soliditySha3('TREE_FACTORY_ROLE');
const O2_FACTORY_ROLE = web3.utils.soliditySha3('O2_FACTORY_ROLE');


module.exports = async function (deployer, network, accounts) {

  let accessRestrictionAddress;
  let treeTypeAddress;
  let treeFactoryAddress;
  let updateAddress;
  let gbAddress;
  let o2Address;
  let treeAddress;
  let seedAddress;
  let seedFactoryAddress;
  let o2FactoryAddress;
  let forestFactory;

  console.log("Deploying on network '" + network + "' by account '" + accounts[0] + "'");

  await deployProxy(AccessRestriction, [accounts[0]], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => {
      accessRestrictionAddress = AccessRestriction.address;
    });

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
      seedFactoryAddress = SeedFactory.address;
      SeedFactory.deployed().then(async (instance) => {
        await instance.setSeedTokenAddress(seedAddress);
        await instance.setTreeTokenAddress(treeAddress);

        await instance.setTreeFactoryAddress(treeFactoryAddress);
      });
    });


  await deployProxy(O2Factory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      o2FactoryAddress = O2Factory.address;

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
      forestFactory = ForestFactory.address;
      ForestFactory.deployed().then(async (instance) => {
        await instance.setTreeFactoryAddress(treeFactoryAddress);
      });
    });



  AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(SEED_FACTORY_ROLE, seedFactoryAddress);
    await instance.grantRole(TREE_FACTORY_ROLE, treeFactoryAddress);
    await instance.grantRole(O2_FACTORY_ROLE, o2FactoryAddress);
  });

  console.log("Deployed");

  console.log(`CONTRACT_AR_ADDRESS=${accessRestrictionAddress}
CONTRACT_GBFACTORY_ADDRESS=${gbAddress}
CONTRACT_TRRETYPE_ADDRESS=${treeTypeAddress}
CONTRACT_UPDATEFACTORY_ADDRESS=${updateAddress}
CONTRACT_TREEFACTORY_ADDRESS=${treeFactoryAddress}
CONTRACT_SEEDFACTORY_ADDRESS=${seedFactoryAddress}
CONTRACT_O2FACTORY_ADDRESS=${o2FactoryAddress}
CONTRACT_TREE_ADDRESS=${treeAddress}
CONTRACT_SEED_ADDRESS=${seedAddress}
CONTRACT_O2_ADDRESS=${o2Address}
CONTRACT_FORESTFACTORY_ADDRESS=${forestFactory}`);


};
