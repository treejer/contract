require("dotenv").config();

const IncrementalSale = artifacts.require("IncrementalSale.sol");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");
const WethFund = artifacts.require("WethFund.sol");
const Allocation = artifacts.require("Allocation.sol");
const Weth = artifacts.require("Weth.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const RegularSale = artifacts.require("RegularSale.sol");
const Attribute = artifacts.require("Attribute.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactoryV2.address;
  let allocationAddress = Allocation.address;
  let wethFundAddress = WethFund.address;
  const planterFundAddress = PlanterFund.address;

  const regularSaleAddress = RegularSale.address;
  const attributeAddress = Attribute.address;
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

  console.log("Call IncrementalSale Methods...");
  await IncrementalSale.deployed().then(async (instance) => {
    await instance.setPlanterFundAddress(planterFundAddress);
    await instance.setRegularSaleAddress(regularSaleAddress);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setWethFundAddress(wethFundAddress);
    await instance.setWethTokenAddress(wethTokenAddress);
    await instance.setAllocationAddress(allocationAddress);
    await instance.setAttributesAddress(attributeAddress);
  });
};
