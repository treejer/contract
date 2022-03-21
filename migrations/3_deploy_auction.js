require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Auction = artifacts.require("Auction.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying Auction...");
  await deployProxy(Auction, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
