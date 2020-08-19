var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var O1Factory = artifacts.require("O1Factory.sol");

module.exports = async function(deployer) {

  let accessRestrictionAddress;
  let treeTypeAddress;
  let treeAddress;
  let updateAddress;
  let gbAddress;

  await deployer.deploy(AccessRestriction)
    .then(() => { accessRestrictionAddress = AccessRestriction.address; }); 

  await deployer.deploy(GBFactory, accessRestrictionAddress)
    .then(() => { gbAddress = GBFactory.address; });

  await deployer.deploy(TreeType, accessRestrictionAddress)
    .then(() => { treeTypeAddress = TreeType.address; });

  await deployer.deploy(UpdateFactory, accessRestrictionAddress)
    .then(() => { updateAddress = UpdateFactory.address; }); 

  await deployer.deploy(TreeFactory, accessRestrictionAddress)
    .then(() => {
      treeAddress = TreeFactory.address;
      TreeFactory.deployed().then(async (instance) => {
        await instance.setGBAddress(gbAddress);
        await instance.setUpdateFactoryAddress(updateAddress);
      });
    });  

  await deployer.deploy(O2Factory, accessRestrictionAddress)
    .then(async () => {
      O2Factory.deployed().then(async (instance) => {
        await instance.setTreeTypeAddress(treeTypeAddress);
        await instance.setTreeFactoryAddress(treeAddress);
        await instance.setUpdateFactoryAddress(updateAddress);
      });
    }); 

  await deployer.deploy(O1Factory, accessRestrictionAddress)
    .then(async () => {
      O1Factory.deployed().then(async (instance) => {
        await instance.setTreeFactoryAddress(treeAddress);
      });
    }); 

};
