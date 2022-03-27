require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying IncrementalSale...");
  await deployProxy(IncrementalSale, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
