require("dotenv").config();

const AccessRestriction = artifacts.require("AccessRestriction.sol");

const WhitelistPaymasterV3 = artifacts.require("WhitelistPaymasterV3.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying WhitelistPaymaster...");
  await deployer
    .deploy(WhitelistPaymasterV3, accessRestrictionAddress)
    .then(() => {});
};
