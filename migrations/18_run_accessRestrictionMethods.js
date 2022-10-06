require("dotenv").config();

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Auction = artifacts.require("Auction.sol");
const TreeFactory = artifacts.require("TreeFactoryV2.sol");
const Planter = artifacts.require("PlanterV2.sol");
const RegularSale = artifacts.require("RegularSaleV2.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const HonoraryTree = artifacts.require("HonoraryTree.sol");
const WethFund = artifacts.require("WethFund.sol");
const DaiFund = artifacts.require("DaiFund.sol");
const Attribute = artifacts.require("Attribute.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");

const TREEJER_CONTRACT_ROLE = web3.utils.soliditySha3("TREEJER_CONTRACT_ROLE");
const DATA_MANAGER_ROLE = web3.utils.soliditySha3("DATA_MANAGER_ROLE");

module.exports = async function (deployer, network, accounts) {
  let auctionAddress = Auction.address;
  let treeFactoryAddress = TreeFactory.address;
  let planterAddress = Planter.address;
  let regularSaleAddress = RegularSale.address;
  let incrementalSaleAddress = IncrementalSale.address;
  const honoraryTreeAddress = HonoraryTree.address;
  const daiFundAddress = DaiFund.address;
  const wethFundAddress = WethFund.address;
  const attributeAddress = Attribute.address;
  const planterFundAddress = PlanterFund.address;

  console.log("Call AccessRestriction Methods...");
  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(DATA_MANAGER_ROLE, accounts[0]);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, planterAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, auctionAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, treeFactoryAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, regularSaleAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, incrementalSaleAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, honoraryTreeAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, daiFundAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, wethFundAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, attributeAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, planterFundAddress);
  });
};
