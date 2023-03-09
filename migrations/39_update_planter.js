var PlanterV3 = artifacts.require("PlanterV3.sol");

const {
  upgradeProxy,
  prepareUpgrade,
} = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer) {
  const planter = "0xdF591702da4425a4617764c107E201BE509C978c";
  await upgradeProxy(planter, PlanterV3, {
    deployer,
  });
};
