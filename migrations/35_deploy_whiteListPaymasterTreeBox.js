require("dotenv").config();

const TreeBox = artifacts.require("TreeBox.sol");

const WhitelistPaymasterTreeBox = artifacts.require(
  "WhitelistPaymasterTreeBox.sol"
);

module.exports = async function (deployer, network, accounts) {
  let treeBoxAddress = TreeBox.address;

  console.log("Deploying WhitelistPaymasterTreeBox...");

  await deployer
    .deploy(WhitelistPaymasterTreeBox, treeBoxAddress)
    .then(() => {});
};
