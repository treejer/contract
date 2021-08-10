require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var Tree = artifacts.require("Tree.sol");
var TreeAuction = artifacts.require("TreeAuction.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var Treasury = artifacts.require("Treasury.sol");
var Planter = artifacts.require("Planter.sol");
var RegularSell = artifacts.require("RegularSell.sol");
var IncrementalSell = artifacts.require("IncrementalSell.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  console.log("Deploying IncrementalSell...");
  await deployProxy(IncrementalSell, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    incrementalSellAddress = IncrementalSell.address;
  });

  console.log("Deploying TreeFactory...");
  await deployProxy(TreeFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeFactoryAddress = TreeFactory.address;
  });
};
