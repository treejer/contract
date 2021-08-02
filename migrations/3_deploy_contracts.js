require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

var AccessRestriction = artifacts.require("AccessRestriction.sol");

var TreeAuction = artifacts.require("TreeAuction.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("accounts[0]", accounts[0]);

  let accessRestrictionAddress = AccessRestriction.address;

  const deployerAccount =
    network === "development" ? accounts[0] : process.env.DEPLOYER;

  console.log("Deploying TreeAttribute ...");
  await deployProxy(TreeAttribute, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAttributeAddress = TreeAttribute.address;
  });

  console.log("Deploying TreeAuction...");
  await deployProxy(TreeAuction, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAuctionAddress = TreeAuction.address;
  });
};
