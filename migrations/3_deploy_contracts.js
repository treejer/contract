require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

var AccessRestriction = artifacts.require("AccessRestriction.sol");

var TreeAuction = artifacts.require("TreeAuction.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

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
