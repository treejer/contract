require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying AccessRestriction...");
  console.log("accounts[0]", accounts[0]);

  await deployProxy(AccessRestriction, [accounts[0]], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then((err) => {
    accessRestrictionAddress = AccessRestriction.address;
  });
};
