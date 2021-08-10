require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

var AccessRestriction = artifacts.require("AccessRestriction.sol");

var Treasury = artifacts.require("Treasury.sol");
var Planter = artifacts.require("Planter.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying Treasury...");
  await deployProxy(Treasury, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treasuryAddress = Treasury.address;
  });
  console.log("Deploying Planter ...");
  await deployProxy(Planter, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    planterAddress = Planter.address;
  });
};
