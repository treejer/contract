var TreeType = artifacts.require("./TreeType.sol");
var TreeFactory = artifacts.require("./TreeFactory.sol");

module.exports = function(deployer) {
  deployer.deploy(TreeType);
  deployer.deploy(TreeFactory);
};
