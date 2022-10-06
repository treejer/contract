require("dotenv").config();

const Auction = artifacts.require("Auction.sol");
const TreeFactory = artifacts.require("TreeFactoryV2.sol");
const Allocation = artifacts.require("Allocation.sol");
const WethFund = artifacts.require("WethFund.sol");
const Weth = artifacts.require("Weth.sol");
const RegularSale = artifacts.require("RegularSaleV2.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactory.address;
  const allocationAddress = Allocation.address;
  const wethFundAddress = WethFund.address;
  const regularSaleAddress = RegularSale.address;
  let wethTokenAddress;

  if (isLocal) {
    wethTokenAddress = Weth.address;
  } else if (network == "mumbai") {
    wethTokenAddress = Weth.address;
  } else {
    wethTokenAddress = eval(
      `process.env.WETH_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call Auction Methods...");
  await Auction.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setAllocationAddress(allocationAddress);
    await instance.setWethFundAddress(wethFundAddress);
    await instance.setRegularSaleAddress(regularSaleAddress);
    await instance.setWethTokenAddress(wethTokenAddress);
  });
};
