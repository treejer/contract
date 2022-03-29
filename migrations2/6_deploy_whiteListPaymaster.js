require("dotenv").config();

const AccessRestriction = artifacts.require("AccessRestriction.sol");

const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying WhitelistPaymaster...");
  await deployer
    .deploy(WhitelistPaymaster, accessRestrictionAddress)
    .then(() => {});
};
