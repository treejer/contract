// local uniswap
var Factory = artifacts.require("Factory.sol");
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var Wmatic = artifacts.require("Wmatic.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

//deployed contracts

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Auction = artifacts.require("Auction.sol");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");
const Planter = artifacts.require("Planter.sol");
const RegularSale = artifacts.require("RegularSale.sol");
const DaiFund = artifacts.require("DaiFund.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const WethFund = artifacts.require("WethFund.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");

//gsn

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development" || network === "mumbai";

  if (isLocal) {
    let factoryAddress;
    let wethAddress;
    let uniswapV2Router02NewAddress;
    let daiAddress;
    let wmaticAddress;

    await deployer
      .deploy(Factory, accounts[1], {
        from: accounts[0],
      })
      .then((err) => {
        factoryAddress = Factory.address;
      });

    await deployer
      .deploy(Weth, "WETH", "weth", {
        from: accounts[0],
      })
      .then((err) => {
        wethAddress = Weth.address;
      });

    await deployer
      .deploy(Dai, "DAI", "dai", {
        from: accounts[0],
      })
      .then((err) => {
        daiAddress = Dai.address;
      });

    await deployer
      .deploy(Wmatic, "WMATIC", "wmatic", {
        from: accounts[0],
      })
      .then((err) => {
        wmaticAddress = Wmatic.address;
      });

    await deployer
      .deploy(UniswapV2Router02New, factoryAddress, wmaticAddress, {
        from: accounts[0],
      })
      .then((err) => {
        uniswapV2Router02NewAddress = UniswapV2Router02New.address;
      });

    await deployer
      .deploy(
        TestUniswap,
        uniswapV2Router02NewAddress,
        daiAddress,
        wethAddress,
        {
          from: accounts[0],
        }
      )
      .then((err) => {
        testUniswapAddress = TestUniswap.address;
      });

    let testUniswapInstance = await TestUniswap.deployed();
    let wethInstance = await Weth.deployed();
    let daiInstance = await Dai.deployed();

    await wethInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("125000", "Ether")
    );

    await daiInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("250000000", "Ether")
    );

    await testUniswapInstance.addLiquidity();

    console.log("daiAddress=", daiAddress);
    console.log("wethAddress=", wethAddress);
    console.log("wmaticAddress=", wmaticAddress);
    console.log("testUniswapAddress=", testUniswapAddress);
    console.log("factoryAddress=", factoryAddress);
    console.log("uniswapV2Router02NewAddress=", uniswapV2Router02NewAddress);
  }

  const accessRestrictionAddress = AccessRestriction.address;
  const auctionAddress = Auction.address;
  const communityGiftsAddress = CommunityGifts.address;
  const incrementalSaleAddress = IncrementalSale.address;
  const paymasterAddress = WhitelistPaymaster.address;
  const planterAddress = Planter.address;
  const regularSaleAddress = RegularSale.address;
  const daiFundAddress = DaiFund.address;
  const allocationAddress = Allocation.address;
  const planterFundAddress = PlanterFund.address;
  const wethFundAddress = WethFund.address;
  const treeAddress = Tree.address;
  const treeAttributeAddress = TreeAttribute.address;
  const treeFactoryAddress = TreeFactory.address;

  console.log(`
  CONTRACT_AR_ADDRESS=${accessRestrictionAddress}
  CONTRACT_TREE_AUCTION_ADDRESS=${auctionAddress}
  CONTRACT_COMMUNITY_GIFTS_ADDRESS=${communityGiftsAddress}
  CONTRACT_INCREMENTAL_SELL_ADDRESS=${incrementalSaleAddress}
  CONTRACT_PAYMASTER_ADDRESS=${paymasterAddress}
  CONTRACT_PLANTER_ADDRESS=${planterAddress}
  CONTRACT_REGULAR_SELL_ADDRESS=${regularSaleAddress}
  CONTRACT_DAI_FUNDS_ADDRESS=${daiFundAddress}
  CONTRACT_FINANCIAL_MODEL_ADDRESS=${allocationAddress}
  CONTRACT_PLANTER_FUND_ADDRESS=${planterFundAddress}
  CONTRACT_WETH_FUNDS_ADDRESS=${wethFundAddress}
  CONTRACT_TREE_ADDRESS=${treeAddress}
  CONTRACT_TREE_ATTRIBUTE_ADDRESS=${treeAttributeAddress}
  CONTRACT_TREE_FACTORY_ADDRESS=${treeFactoryAddress}
  `);
};
