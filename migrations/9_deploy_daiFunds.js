require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying DaiFunds...");

  await deployProxy(DaiFunds, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
