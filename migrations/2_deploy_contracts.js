var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2Factory = artifacts.require("O2Factory.sol");

module.exports = async function(deployer) {

  let treeTypeAddress;
  let treeAddress;
  let updateAddress;

  await deployer.deploy(AccessRestriction);

  await deployer.deploy(GBFactory);

  await deployer.deploy(TreeType)
    .then(() => { treeTypeAddress = TreeType.address; });

  await deployer.deploy(TreeFactory)
    .then(() => { treeAddress = TreeFactory.address; });  

  await deployer.deploy(UpdateFactory)
    .then(() => { updateAddress = UpdateFactory.address; }); 

  await deployer.deploy(O2Factory, treeTypeAddress, treeAddress, updateAddress);


};
