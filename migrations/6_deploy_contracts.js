require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Units = require("ethereumjs-units");

var AccessRestriction = artifacts.require("AccessRestriction.sol");
var Tree = artifacts.require("Tree.sol");
var TreeAuction = artifacts.require("TreeAuction.sol");
var TreeFactory = artifacts.require("TreeFactory.sol");
var Treasury = artifacts.require("Treasury.sol");
var Planter = artifacts.require("Planter.sol");
var RegularSell = artifacts.require("RegularSell.sol");
var IncrementalSell = artifacts.require("IncrementalSell.sol");
var TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;
  let treeAddress = Tree.address;
  let treeAuctionAddress = TreeAuction.address;
  let treeFactoryAddress = TreeFactory.address;
  let treasuryAddress = Treasury.address;
  let planterAddress = Planter.address;
  let regularSellAddress;
  let incrementalSellAddress = IncrementalSell.address;
  let treeAttributeAddress = TreeAttribute.address;

  console.log("Deploying AccessRestriction...");

  console.log("Deploying RegularSell...");

  await deployProxy(
    RegularSell,
    [accessRestrictionAddress, Units.convert("0.001", "eth", "wei")],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {
    regularSellAddress = RegularSell.address;
  });

  console.log("Deploying WhitelistPaymaster...");
  await deployer
    .deploy(WhitelistPaymaster, accessRestrictionAddress)
    .then(() => {
      paymasterAddress = WhitelistPaymaster.address;
    });

  console.log(`CONTRACT_AR_ADDRESS=${accessRestrictionAddress}
  CONTRACT_TREE_ADDRESS=${treeAddress}
  CONTRACT_TREE_AUCTION_ADDRESS=${treeAuctionAddress}
  CONTRACT_TREE_FACTORY_ADDRESS=${treeFactoryAddress}
  CONTRACT_TREASURY_ADDRESS=${treasuryAddress}
  CONTRACT_PLANTER_ADDRESS=${planterAddress}
  CONTRACT_REGULAR_SELL_ADDRESS=${regularSellAddress}
  CONTRACT_TREE_ATTRIBUTE_ADDRESS=${treeAttributeAddress}
  CONTRACT_INCREMENTAL_SELL_ADDRESS=${incrementalSellAddress}
  CONTRACT_PAYMASTER_ADDRESS=${paymasterAddress}`);
};
