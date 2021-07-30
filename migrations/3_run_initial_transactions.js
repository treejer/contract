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

//role
const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");
const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const TREASURY_ROLE = web3.utils.soliditySha3("TREASURY_ROLE");
const REGULAR_SELL_ROLE = web3.utils.soliditySha3("REGULAR_SELL_ROLE");
const INCREMENTAL_SELL_ROLE = web3.utils.soliditySha3("INCREMENTAL_SELL_ROLE");

module.exports = async function (deployer, network, accounts) {
  // const isLocal = network === "development";
  // let accessRestrictionAddress = AccessRestriction.address;
  // let treeAddressAddress = Tree.address;
  // let treeAuctionAddress = TreeAuction.address;
  // let treeFactoryAddress = TreeFactory.address;
  // let treasuryAddress = Treasury.address;
  // let planterAddress = Planter.address;
  // let regularSellAddress = RegularSell.address;
  // let incrementalSellAddress = IncrementalSell.address;
  // let treeAttributeAddress = TreeAttribute.address;
  // //gsn
  // let trustedForwarder;
  // let relayHub;
  // let paymasterAddress = WhitelistPaymaster.address;
  // if (isLocal) {
  //   trustedForwarder = require("../build/gsn/Forwarder.json").address;
  //   relayHub = require("../build/gsn/RelayHub.json").address;
  // } else {
  //   trustedForwarder = process.env.GSN_FORWARDER;
  //   relayHub = process.env.GSN_RELAY_HUB;
  // }
  // console.log("Call AccessRestriction Methods...");
  // await AccessRestriction.deployed().then(async (instance) => {
  //   await instance.grantRole(PLANTER_ROLE, planterAddress);
  //   await instance.grantRole(AUCTION_ROLE, treeAuctionAddress);
  //   await instance.grantRole(TREE_FACTORY_ROLE, treeFactoryAddress);
  //   await instance.grantRole(TREASURY_ROLE, treasuryAddress);
  //   await instance.grantRole(REGULAR_SELL_ROLE, regularSellAddress);
  //   await instance.grantRole(INCREMENTAL_SELL_ROLE, incrementalSellAddress);
  // });
  // console.log("Call WhitelistPaymaster Methods...");
  // await WhitelistPaymaster.deployed().then(async (instance) => {
  //   await instance.setWhitelistTarget(planterAddress);
  //   await instance.setWhitelistTarget(treasuryAddress);
  //   await instance.setWhitelistTarget(treeFactoryAddress);
  //   await instance.setRelayHub(relayHub);
  //   await instance.setTrustedForwarder(trustedForwarder);
  // });
  // console.log("Call TreeAuction Methods...");
  // await TreeAuction.deployed().then(async (instance) => {
  //   await instance.setTreeFactoryAddress(treeFactoryAddress);
  //   await instance.setTreasuryAddress(treasuryAddress);
  // });
  // console.log("Call RegularSell Methods...");
  // await RegularSell.deployed().then(async (instance) => {
  //   await instance.setTreeFactoryAddress(treeFactoryAddress);
  //   await instance.setTreasuryAddress(treasuryAddress);
  // });
  // console.log("Fund Paymaster");
  // if (!isLocal) {
  //   await web3.eth.sendTransaction({
  //     from: accounts[0],
  //     to: paymasterAddress,
  //     value: web3.utils.toWei("1"),
  //   });
  // }
  // console.log("Call Planter Methods...");
  // await Planter.deployed().then(async (instance) => {
  //   await instance.setTrustedForwarder(trustedForwarder);
  // });
  // console.log("Call Tree Methods...");
  // await Tree.deployed().then((instance) => {});
  // console.log("Call Tree Factory Methods...");
  // await TreeFactory.deployed().then(async (instance) => {
  //   await instance.setTrustedForwarder(trustedForwarder);
  //   await instance.setTreasuryAddress(Treasury.address);
  //   await instance.setPlanterAddress(Planter.address);
  //   await instance.setTreeTokenAddress(Tree.address);
  // });
  // console.log("Call Tree Attribute Methods...");
  // await TreeAttribute.deployed().then(async (instance) => {
  //   await instance.setTreeFactoryAddress(TreeFactory.address);
  // });
  // console.log("Call Treasury Methods...");
  // await Treasury.deployed().then(async (instance) => {
  //   await instance.setTrustedForwarder(trustedForwarder);
  //   await instance.setPlanterContractAddress(Planter.address);
  //   await instance.setTreeResearchAddress(process.env.TREE_RESEARCH_ADDRESS);
  //   await instance.setLocalDevelopAddress(process.env.LOCAL_DEVELOP_ADDRESS);
  //   await instance.setRescueFundAddress(process.env.RESCUE_FUND_ADDRESS);
  //   await instance.setTreejerDevelopAddress(
  //     process.env.TREEJER_DEVELOP_ADDRESS
  //   );
  //   await instance.setReserveFund1Address(process.env.RESERVE_FUND_ADDRESS1);
  //   await instance.setReserveFund2Address(process.env.RESERVE_FUND_ADDRESS2);
  //   await instance.addFundDistributionModel(
  //     4500,
  //     500,
  //     500,
  //     1000,
  //     1000,
  //     2500,
  //     0,
  //     0,
  //     {
  //       from: accounts[0],
  //     }
  //   );
  //   await instance.assignTreeFundDistributionModel(0, 0, 0, {
  //     from: accounts[0],
  //   });
  //   await instance.assignTreeFundDistributionModel(1, 9, 0, {
  //     from: accounts[0],
  //   });
  //   await instance.assignTreeFundDistributionModel(10, 99, 0, {
  //     from: accounts[0],
  //   });
  //   await instance.assignTreeFundDistributionModel(100, 10000, 0, {
  //     from: accounts[0],
  //   });
  // });
  // console.log("Call IncrementalSell Methods...");
  // await IncrementalSell.deployed().then(async (instance) => {
  //   await instance.setTreeFactoryAddress(treeFactoryAddress);
  //   await instance.setTreasuryAddress(treasuryAddress);
  //   await instance.addTreeSells(101, web3.utils.toWei("0.01"), 100, 10, 1000, {
  //     from: accounts[0],
  //   });
  // });
};
