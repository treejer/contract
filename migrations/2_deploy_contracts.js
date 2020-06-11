var TreeType = artifacts.require("./TreeType.sol");
var GBFactory = artifacts.require("./GBFactory.sol");
var TreeFactory = artifacts.require("./TreeFactory.sol");

module.exports = function(deployer) {
  deployer.deploy(TreeType);
  deployer.deploy(GBFactory);
  deployer.deploy(TreeFactory);
};
