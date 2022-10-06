require("dotenv").config();

const MarketPlace = artifacts.require("MarketPlace.sol");

const RegularSale = artifacts.require("RegularSaleV2.sol");
const TreeFactory = artifacts.require("TreeFactoryV2.sol");
const DaiFund = artifacts.require("DaiFund.sol");
const Dai = artifacts.require("Dai.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Attribute = artifacts.require("Attribute.sol");

const Planter = artifacts.require("PlanterV2.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const treeFactoryAddress = TreeFactory.address;
  const daiFundAddress = DaiFund.address;
  const allocationAddress = Allocation.address;
  const planterFundsAddress = PlanterFund.address;
  const attributeAddress = Attribute.address;
  const regularSaleAddress = RegularSale.address;
  const planterAddress = Planter.address;

  let daiTokenAddress;

  if (isLocal || network == "mumbai") {
    daiTokenAddress = Dai.address;
  } else {
    daiTokenAddress = eval(
      `process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call MarketPlace Methods...");
  await MarketPlace.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setDaiFundAddress(daiFundAddress);
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setAllocationAddress(allocationAddress);
    await instance.setPlanterFundAddress(planterFundsAddress);
    await instance.setAttributesAddress(attributeAddress);
    await instance.setRegularSaleAddress(regularSaleAddress);
    await instance.setPlanterAddress(planterAddress);
  });
};
