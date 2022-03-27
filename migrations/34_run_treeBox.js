require("dotenv").config();

const TreeBox = artifacts.require("TreeBox.sol");

const TREEBOX_SCRIPT = web3.utils.soliditySha3("TREEBOX_SCRIPT");

module.exports = async function (deployer, network, accounts) {
  console.log("Call TreeBox Methods...");
  await TreeBox.deployed().then(async (instance) => {
    await instance.grantRole(
      TREEBOX_SCRIPT,
      process.env.TREE_BOX_SCRIPT_ADDRESS
    );
  });
};
