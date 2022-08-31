require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const FundWithOffset = artifacts.require("FundWithOffset.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = "0xef9ea011DBE73b9470270A36A3C036E0F5a7EA88";

  console.log("Deploying FundWithOffset...");

  await deployProxy(FundWithOffset, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
