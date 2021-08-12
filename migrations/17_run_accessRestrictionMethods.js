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

//role
const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");
const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");

const REGULAR_SELL_ROLE = web3.utils.soliditySha3("REGULAR_SELL_ROLE");
const INCREMENTAL_SELL_ROLE = web3.utils.soliditySha3("INCREMENTAL_SELL_ROLE");
const COMMUNITY_GIFTS_ROLE = web3.utils.soliditySha3("COMMUNITY_GIFTS_ROLE");
const FUNDS_ROLE = web3.utils.soliditySha3("FUNDS_ROLE");

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
    await instance.grantRole(PLANTER_ROLE, planterAddress);
    await instance.grantRole(AUCTION_ROLE, treeAuctionAddress);
    await instance.grantRole(TREE_FACTORY_ROLE, treeFactoryAddress);
    await instance.grantRole(REGULAR_SELL_ROLE, regularSellAddress);
    await instance.grantRole(INCREMENTAL_SELL_ROLE, incrementalSellAddress);
    await instance.grantRole(COMMUNITY_GIFTS_ROLE, communityGiftsAddress);
    await instance.grantRole(FUNDS_ROLE, daiFundsAddress);
    await instance.grantRole(FUNDS_ROLE, wethFundAddress);
  });
};
