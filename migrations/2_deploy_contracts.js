require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var GBFactory = artifacts.require("GBFactory.sol");
var TreeType = artifacts.require("TreeType.sol");
var Tree = artifacts.require("Tree.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var UpdateFactory = artifacts.require("UpdateFactory.sol");
var O2 = artifacts.require("O2.sol");
var O2Factory = artifacts.require("O2Factory.sol");
var Seed = artifacts.require("Seed.sol");
var SeedFactory = artifacts.require("SeedFactory.sol");
var ForestFactory = artifacts.require("ForestFactory.sol");
var TreeAuction = artifacts.require("TreeAuction.sol");
var GenesisTree = artifacts.require("GenesisTree.sol");
var IncrementalSell = artifacts.require("IncrementalSell.sol");
var RandomNumberConsumer = artifacts.require("RandomNumberConsumer.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");

//link
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')

//dai
var Dai = artifacts.require("Dai.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const O2_FACTORY_ROLE = web3.utils.soliditySha3("O2_FACTORY_ROLE");
const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const INCREMENTAL_SELL_ROLE = web3.utils.soliditySha3("INCREMENTAL_SELL_ROLE");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let accessRestrictionAddress;
  let treeTypeAddress;
  let treeFactoryAddress;
  let updateFactoryAddress;
  let gbFactoryAddress;
  let o2Address;
  let treeAddress;
  let seedAddress;
  let seedFactoryAddress;
  let o2FactoryAddress;
  let forestFactory;
  let daiTokenAddress;
  let treeAuctionAddress;
  let genesisTreeAddress;
  let incrementalSellAddress;

  let randomNumberConsumerAddress;
  let attributeAddress;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress;

  let defaultAccount = accounts[0];

  console.log(
    "Deploying on network '" + network + "' by account '" + defaultAccount + "'"
  );

  // Local (development) networks need their own deployment of the LINK
  // token and the Oracle contract
  if (!network.startsWith('kovan')) {
    console.log("RandomNumberConsumer only for Kovan right now!")
  } else {
    // For now, this is hard coded to Kovan
    const KOVAN_KEYHASH = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    const KOVAN_FEE = '100000000000000000'
    const KOVAN_LINK_TOKEN = '0xa36085F69e2889c224210F603D836748e7dC0088'
    const KOVAN_VRF_COORDINATOR = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9'
    deployer.deploy(RandomNumberConsumer, KOVAN_LINK_TOKEN, KOVAN_KEYHASH, KOVAN_VRF_COORDINATOR, KOVAN_FEE).then(() => {
      randomNumberConsumerAddress = RandomNumberConsumer.address;
    });
  }

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
    console.log("Deploying Dai...");
    await deployer.deploy(Dai, web3.utils.toWei("1000000")).then(() => {
      daiTokenAddress = Dai.address;
    });

    LinkToken.setProvider(deployer.provider)
    try {
      await deployer.deploy(LinkToken, { from: defaultAccount })
    } catch (err) {
      console.error(err)
    }

  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
    daiTokenAddress = process.env.DAI_ADDRESS;
  }

  console.log("Using forwarder: " + trustedForwarder + " RelyHub: " + relayHub);

  console.log("Deploying AccessRestriction...");

  await deployProxy(AccessRestriction, [defaultAccount], {
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

  console.log("Deploying Seed...");
  await deployProxy(Seed, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    seedAddress = Seed.address;
  });

  console.log("Deploying O2...");
  await deployProxy(O2, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    o2Address = O2.address;
  });

  console.log("Deploying GBFactory...");
  await deployProxy(GBFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    gbFactoryAddress = GBFactory.address;

    GBFactory.deployed().then(async (instance) => {
      await instance.setTrustedForwarder(trustedForwarder);
    });
  });

  console.log("Deploying TreeType...");
  await deployProxy(TreeType, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeTypeAddress = TreeType.address;
  });

  console.log("Deploying UpdateFactory...");
  await deployProxy(UpdateFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    updateFactoryAddress = UpdateFactory.address;
  });

  console.log("Deploying TreeFactory...");
  await deployProxy(TreeFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeFactoryAddress = TreeFactory.address;
    TreeFactory.deployed().then(async (instance) => {
      await instance.setGBFactoryAddress(gbFactoryAddress);
      await instance.setTreeTokenAddress(treeAddress);
      await instance.setUpdateFactoryAddress(updateFactoryAddress);
      await instance.setDaiTokenAddress(daiTokenAddress);

      await instance.setTrustedForwarder(trustedForwarder);
    });
  });

  console.log("Call UpdateFactory Methods...");
  await UpdateFactory.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setGBFactoryAddress(gbFactoryAddress);
    await instance.setTrustedForwarder(trustedForwarder);
  });

  console.log("Deploying TreeAuction...");
  await deployProxy(TreeAuction, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    treeAuctionAddress = TreeAuction.address;

    TreeAuction.deployed().then(async (instance) => { });
  });

  console.log("Deploying IncrementalSell...");
  await deployProxy(IncrementalSell, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    incrementalSellAddress = IncrementalSell.address;

    IncrementalSell.deployed().then(async (instance) => { });
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

  console.log("Deploying SeedFactory...");
  await deployProxy(SeedFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
  }).then(() => {
    seedFactoryAddress = SeedFactory.address;
    SeedFactory.deployed().then(async (instance) => {
      await instance.setSeedTokenAddress(seedAddress);
      await instance.setTreeTokenAddress(treeAddress);

      await instance.setTreeFactoryAddress(treeFactoryAddress);
    });
  });

  console.log("Deploying O2Factory...");
  await deployProxy(O2Factory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
  }).then(() => {
    o2FactoryAddress = O2Factory.address;

    O2Factory.deployed().then(async (instance) => {
      await instance.setTreeTypeAddress(treeTypeAddress);
      await instance.setTreeFactoryAddress(treeFactoryAddress);
      await instance.setUpdateFactoryAddress(updateFactoryAddress);

      await instance.setO2TokenAddress(o2Address);
      await instance.setTreeTokenAddress(treeAddress);
    });
  });

  console.log("Call AccessRestriction Methods...");
  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(SEED_FACTORY_ROLE, seedFactoryAddress);
    await instance.grantRole(TREE_FACTORY_ROLE, treeFactoryAddress);
    await instance.grantRole(O2_FACTORY_ROLE, o2FactoryAddress);
    await instance.grantRole(AUCTION_ROLE, treeAuctionAddress);
    await instance.grantRole(INCREMENTAL_SELL_ROLE, incrementalSellAddress);
  });

  console.log("Deploying ForestFactory...");
  await deployProxy(ForestFactory, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
  }).then(() => {
    forestFactory = ForestFactory.address;
    ForestFactory.deployed().then(async (instance) => {
      await instance.setTreeFactoryAddress(treeFactoryAddress);
      await instance.setDaiTokenAddress(daiTokenAddress);
    });
  });

  console.log("Deploying TreeAttribute...");
  await deployProxy(TreeAttribute, [accessRestrictionAddress], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true
  }).then(() => {
    attributeAddress = TreeAttribute.address;
    TreeAttribute.deployed().then(async (instance) => {
      await instance.setTreeAddress(treeAddress);
      if (!isLocal) {
        await instance.setRandomNumberConsumerAddress(daiTokenAddress);
      }
    });
  });





  console.log("Deploying WhitelistPaymaster...");
  await deployer
    .deploy(WhitelistPaymaster, accessRestrictionAddress)
    .then(() => {
      paymasterAddress = WhitelistPaymaster.address;
    });

  console.log("Running WhitelistPaymaster...");

  await WhitelistPaymaster.deployed().then(async (instance) => {
    await instance.setWhitelistTarget(treeFactoryAddress);
    await instance.setWhitelistTarget(gbFactoryAddress);
    await instance.setWhitelistTarget(updateFactoryAddress);

    await instance.setRelayHub(relayHub);
    await instance.setTrustedForwarder(trustedForwarder);
  });

  console.log("Fund Paymaster");
  if (!isLocal) {
    await web3.eth.sendTransaction({
      from: defaultAccount,
      to: paymasterAddress,
      value: web3.utils.toWei("1"),
    });
  }

  console.log("Deployed");

  console.log(`CONTRACT_AR_ADDRESS=${accessRestrictionAddress}
CONTRACT_GBFACTORY_ADDRESS=${gbFactoryAddress}
CONTRACT_TRRETYPE_ADDRESS=${treeTypeAddress}
CONTRACT_UPDATEFACTORY_ADDRESS=${updateFactoryAddress}
CONTRACT_TREEFACTORY_ADDRESS=${treeFactoryAddress}
CONTRACT_SEEDFACTORY_ADDRESS=${seedFactoryAddress}
CONTRACT_O2FACTORY_ADDRESS=${o2FactoryAddress}
CONTRACT_TREE_ADDRESS=${treeAddress}
CONTRACT_SEED_ADDRESS=${seedAddress}
CONTRACT_O2_ADDRESS=${o2Address}
CONTRACT_TREE_AUCTION_ADDRESS=${treeAuctionAddress}
CONTRACT_INCREAMENTAL_SELL_ADDRESS=${incrementalSellAddress}
CONTRACT_GENESIS_TREE_ADDRESS=${genesisTreeAddress}
CONTRACT_FORESTFACTORY_ADDRESS=${forestFactory}
CONTRACT_TREE_ATTRIBUTE_ADDRESS=${attributeAddress}
CONTRACT_PAYMASTER_ADDRESS=${paymasterAddress}`);
};
