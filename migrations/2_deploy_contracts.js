require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var Tree = artifacts.require("Tree.sol");
var TreeAuction = artifacts.require("TreeAuction.sol");
var GenesisTree = artifacts.require("GenesisTree.sol");
var Treasury = artifacts.require("Treasury.sol");
var Planter = artifacts.require("Planter.sol");
var RegularSell = artifacts.require("RegularSell.sol");

var IncrementalSell = artifacts.require("IncrementalSell.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");
//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let accessRestrictionAddress;
  let treeAddress;
  let treeAuctionAddress;
  let genesisTreeAddress;
  let treasuryAddress;
  let planterAddress;
  let regularSellAddress;
  let incrementalSellAddress;
  let treeAttributeAddress;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress;

  console.log(
    "Deploying on network '" + network + "' by account '" + accounts[0] + "'"
  );

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Using forwarder: " + trustedForwarder + " RelyHub: " + relayHub);

  console.log("Deploying AccessRestriction...");

  await deployProxy(AccessRestriction, [accounts[0]], {
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

  console.log("Deploying TreeAttribute ...");
  await deployProxy(TreeAttribute, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAttributeAddress = TreeAttribute.address;
  });

  console.log("Deploying TreeAuction...");
  await deployProxy(TreeAuction, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAuctionAddress = TreeAuction.address;

    TreeAuction.deployed().then(async (instance) => {});
  });

  console.log("Deploying IncrementalSell...");
  await deployProxy(IncrementalSell, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    incrementalSellAddress = IncrementalSell.address;

    IncrementalSell.deployed().then(async (instance) => {});
  });

  console.log("Deploying GenesisTree...");
  await deployProxy(GenesisTree, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    genesisTreeAddress = GenesisTree.address;

    GenesisTree.deployed().then(async (instance) => {
      await instance.setTrustedForwarder(trustedForwarder);
    });
  });

  console.log("Deploying Treasury...");
  await deployProxy(Treasury, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treasuryAddress = Treasury.address;
    Treasury.deployed().then(async (instance) => {
      await instance.setTrustedForwarder(trustedForwarder);
    });
  });
  console.log("Deploying Planter ...");
  await deployProxy(Planter, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    planterAddress = Planter.address;
    Planter.deployed().then(async (instance) => {
      await instance.setTrustedForwarder(trustedForwarder);
    });
  });

  console.log("Deploying RegularSell...");
  await deployProxy(
    RegularSell,
    [accessRestrictionAddress, Units.convert("1000000", "eth", "wei")],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {
    regularSellAddress = RegularSell.address;
  });

  console.log("Call AccessRestriction Methods...");
  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(AUCTION_ROLE, treeAuctionAddress);
  });

  console.log("Deploying WhitelistPaymaster...");
  await deployer
    .deploy(WhitelistPaymaster, accessRestrictionAddress)
    .then(() => {
      paymasterAddress = WhitelistPaymaster.address;
    });

  console.log("Running WhitelistPaymaster...");

  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });

  console.log("Fund Paymaster");
  if (!isLocal) {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: paymasterAddress,
      value: web3.utils.toWei("1"),
    });
  }

  console.log("Deployed");

  console.log(`CONTRACT_AR_ADDRESS=${accessRestrictionAddress}
CONTRACT_TREE_ADDRESS=${treeAddress}
CONTRACT_TREE_AUCTION_ADDRESS=${treeAuctionAddress}
CONTRACT_GENESIS_TREE_ADDRESS=${genesisTreeAddress}
CONTRACT_TREASURY_ADDRESS=${treasuryAddress}
CONTRACT_PLANTER_ADDRESS=${planterAddress}
CONTRACT_REGULAR_SELL_ADDRESS=${regularSellAddress}
CONTRACT_TREE_ATTRIBUTE_ADDRESS=${treeAttributeAddress}
CONTRACT_INCREMENTAL_SELL_ADDRESS=${incrementalSellAddress}
CONTRACT_PAYMASTER_ADDRESS=${paymasterAddress}`);
};
