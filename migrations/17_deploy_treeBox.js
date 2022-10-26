require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const TreeBox = artifacts.require("TreeBox.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Tree = artifacts.require("Tree.sol");

module.exports = async function (deployer, network, accounts) {
  const accessRestrictionAddress = AccessRestriction.address;
  const treeAddress = Tree.address;

  console.log("Deploying TreeBox...");
  await deployProxy(TreeBox, [treeAddress, accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
