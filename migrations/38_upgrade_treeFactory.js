var TreeFactory = artifacts.require("TreeFactory.sol");
var TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");

const {
  upgradeProxy,
  prepareUpgrade,
} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer) {
  const treeFactory = "await TreeFactory.deployed()";

  // upgrade direct
  await upgradeProxy(treeFactory.address, TreeFactoryV2, {
    deployer,
  });
};
