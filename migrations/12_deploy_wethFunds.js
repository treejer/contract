require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const WethFunds = artifacts.require("WethFunds.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying WethFunds...");

  await deployProxy(WethFunds, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
