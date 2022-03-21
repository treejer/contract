require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying Planter ...");
  await deployProxy(Planter, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
