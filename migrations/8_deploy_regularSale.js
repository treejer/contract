require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const RegularSale = artifacts.require("RegularSaleV2.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying RegularSaleV2...");
  await deployProxy(
    RegularSale,
    [accessRestrictionAddress, Units.convert("10", "eth", "wei")],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {});
};
