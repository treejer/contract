require("dotenv").config();

const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");

module.exports = async function (deployer, network, accounts) {
  let treeFactoryAddress = TreeFactory.address;

  console.log("Call Tree Attribute Methods...");
  await TreeAttribute.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
  });
};
