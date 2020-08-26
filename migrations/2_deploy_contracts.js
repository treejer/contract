const { deployProxy } = require('@openzeppelin/truffle-upgrades');

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var O1Factory = artifacts.require("O1Factory.sol");


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

  await deployProxy(O1Factory, [accessRestrictionAddress], { deployer, initializer: 'initialize' })
    .then(() => {
      O1Factory.deployed().then(async (instance) => {
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




};
