require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Attribute = artifacts.require("Attribute.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying Attribute ...");
  await deployProxy(Attribute, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    attributeAddress = Attribute.address;
  });
};
