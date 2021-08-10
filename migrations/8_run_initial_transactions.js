require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSell = artifacts.require("RegularSell.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactory.address;
  let treasuryAddress = Treasury.address;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress = WhitelistPaymaster.address;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Call TreeAuction Methods...");
  await TreeAuction.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setTreasuryAddress(treasuryAddress);
  });

  console.log("Call RegularSell Methods...");
  await RegularSell.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setTreasuryAddress(treasuryAddress);
  });

  console.log("Fund Paymaster");
  if (!isLocal) {
    await web3.eth.sendTransaction(
      {
        from: accounts[0],
        to: paymasterAddress,
        value: web3.utils.toWei("1"),
      },
      (err, res) => {
        console.log("err", err);
        console.log("res", res);
      }
    );
  }
};
