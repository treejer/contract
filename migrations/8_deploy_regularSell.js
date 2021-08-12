require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const RegularSell = artifacts.require("RegularSell.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying RegularSell...");
  await deployProxy(
    RegularSell,
    [accessRestrictionAddress, Units.convert("0.001", "eth", "wei")],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {});
};
