require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var Tree = artifacts.require("Tree.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress;

  console.log("Deploying AccessRestriction...");

  const deployerAccount =
    network === "development" ? accounts[0] : process.env.DEPLOYER;

  await deployProxy(AccessRestriction, [deployerAccount], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then((err) => {
    accessRestrictionAddress = AccessRestriction.address;
  });

  console.log("Deploying Tree...");
  await deployProxy(Tree, [accessRestrictionAddress, process.env.BASE_URI], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAddress = Tree.address;
  });
};
