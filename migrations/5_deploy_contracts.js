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
  console.log("accounts[0]", accounts[0]);

  let accessRestrictionAddress = AccessRestriction.address;

  const deployerAccount =
    network === "development" ? accounts[0] : process.env.DEPLOYER;

  console.log("Deploying Treasury...");
  await deployProxy(Treasury, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treasuryAddress = Treasury.address;
  });
  console.log("Deploying Planter ...");
  await deployProxy(Planter, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    planterAddress = Planter.address;
  });
};
