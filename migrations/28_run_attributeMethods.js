require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const Attribute = artifacts.require("Attribute.sol");

module.exports = async function (deployer, network, accounts) {
  const treeAddress = Tree.address;

  console.log("Call Attribute Methods...");
  await Attribute.deployed().then(async (instance) => {
    await instance.setTreeTokenAddress(treeAddress);
  });
};
