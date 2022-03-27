require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const TreeBox = artifacts.require("TreeBox.sol");
// const Tree = artifacts.require("Tree.sol");
//Tree.address
module.exports = async function(deployer, network, accounts) {
  console.log("Deploying TreeBox...");

  await deployProxy(
    TreeBox,
    ["0x4912509b2482ba329203aD5d9AFc496CdcDC04Fb", accounts[0]],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true
    }
  ).then(() => {});
};
