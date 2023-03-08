var TreeFactoryV3 = artifacts.require("TreeFactoryV3.sol");

const {
  upgradeProxy,
  prepareUpgrade,
} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer) {
  const treeFactory = "0xad113f88922F2d865705c9Ef0Db9275518b6C50F";

  // upgrade direct
  await upgradeProxy(treeFactory, TreeFactoryV3, {
    deployer,
  });
};
