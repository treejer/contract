require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const TreeBox = artifacts.require("TreeBox.sol");
const Tree = artifacts.require("Tree.sol");
module.exports = async function (deployer, network, accounts) {
  console.log("Deploying TreeBox...");
  const treeAddress = Tree.address;

  await deployProxy(TreeBox, [treeAddress, accounts[0]], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {});
};
