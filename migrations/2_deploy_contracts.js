const { deployProxy } = require('@openzeppelin/truffle-upgrades');

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var SeedFactory = artifacts.require("SeedFactory.sol");
var ForestFactory = artifacts.require("ForestFactory.sol");
var SeedFactory = artifacts.require("SeedFactory.sol");


module.exports = async function (deployer, network, accounts) {

  let accessRestrictionAddress;
  let treeTypeAddress;
  let treeAddress;
  let updateAddress;
  let gbAddress;

  await deployProxy(AccessRestriction, [accounts[0]], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { accessRestrictionAddress = AccessRestriction.address; });


  await deployProxy(GBFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { gbAddress = GBFactory.address; });

  await deployProxy(TreeType, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { treeTypeAddress = TreeType.address; });

  await deployProxy(UpdateFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => { updateAddress = UpdateFactory.address; });


  await deployProxy(TreeFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize', unsafeAllowCustomTypes: true })
    .then(() => {
      treeAddress = TreeFactory.address;
      TreeFactory.deployed().then(async (instance) => {
        await instance.setGBAddress(gbAddress);
        await instance.setUpdateFactoryAddress(updateAddress);
      });

    });

  UpdateFactory.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeAddress);
  });  

  await deployProxy(SeedFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      SeedFactory.deployed().then(async (instance) => {
        await instance.setTreeFactoryAddress(treeAddress);
      });
    });


  await deployProxy(O2Factory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      O2Factory.deployed().then(async (instance) => {
        await instance.setTreeTypeAddress(treeTypeAddress);
        await instance.setTreeFactoryAddress(treeAddress);
        await instance.setUpdateFactoryAddress(updateAddress);
      });
    });

  await deployProxy(ForestFactory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      ForestFactory.deployed().then(async (instance) => {
        await instance.setTreeFactoryAddress(treeAddress);
      });
    });  


};
