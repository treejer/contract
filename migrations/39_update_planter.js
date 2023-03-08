var PlanterV2 = artifacts.require("PlanterV2.sol");

const {
  upgradeProxy,
  prepareUpgrade,
} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer) {
  const planter = "await TreeFactory.deployed()";

  await upgradeProxy(planter.address, PlanterV2, {
    deployer,
  });
};
