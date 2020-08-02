var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var TreeSale = artifacts.require("TreeSale.sol");
var Fund = artifacts.require("Fund.sol");
var O1Factory = artifacts.require("O1Factory.sol");

module.exports = async function(deployer) {

  let treeTypeAddress;
  let treeAddress;
  let updateAddress;
  let treeSaleAddress;

  await deployer.deploy(AccessRestriction);

  await deployer.deploy(GBFactory);

  await deployer.deploy(TreeType)
    .then(() => { treeTypeAddress = TreeType.address; });

  await deployer.deploy(TreeFactory)
    .then(() => { treeAddress = TreeFactory.address; });  

  await deployer.deploy(UpdateFactory)
    .then(() => { updateAddress = UpdateFactory.address; }); 

  await deployer.deploy(O2Factory, treeTypeAddress, treeAddress, updateAddress);

  await deployer.deploy(TreeSale, treeAddress)
    .then(() => { treeSaleAddress = TreeSale.address; }); 

  await deployer.deploy(Fund, treeAddress, treeSaleAddress); 

  await deployer.deploy(O1Factory, treeAddress);

};
