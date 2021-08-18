require("dotenv").config();

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSell = artifacts.require("RegularSell.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const WethFunds = artifacts.require("WethFunds.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");

const TREEJER_CONTRACT_ROLE = web3.utils.soliditySha3("TREEJER_CONTRACT_ROLE");

module.exports = async function (deployer, network, accounts) {
  let treeAuctionAddress = TreeAuction.address;
  let treeFactoryAddress = TreeFactory.address;
  let planterAddress = Planter.address;
  let regularSellAddress = RegularSell.address;
  let incrementalSellAddress = IncrementalSell.address;
  const communityGiftsAddress = CommunityGifts.address;
  const daiFundsAddress = DaiFunds.address;
  const wethFundAddress = WethFunds.address;

  console.log("Call AccessRestriction Methods...");
  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(TREEJER_CONTRACT_ROLE, planterAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, treeAuctionAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, treeFactoryAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, regularSellAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, incrementalSellAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, communityGiftsAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, daiFundsAddress);
    await instance.grantRole(TREEJER_CONTRACT_ROLE, wethFundAddress);
  });
};
