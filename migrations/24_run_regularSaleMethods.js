require("dotenv").config();
const RegularSale = artifacts.require("RegularSaleV2.sol");
const TreeFactory = artifacts.require("TreeFactoryV2.sol");
const DaiFund = artifacts.require("DaiFund.sol");
const Dai = artifacts.require("Dai.sol");
const Allocation = artifacts.require("Allocation.sol");
const WethFund = artifacts.require("WethFund.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Attribute = artifacts.require("Attribute.sol");
module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const referralTreePaymentToPlanter = web3.utils.toWei("5.5");
  const referralTreePaymentToAmbassador = web3.utils.toWei("0.5");
  const treeFactoryAddress = TreeFactory.address;
  const daiFundAddress = DaiFund.address;
  const allocationAddress = Allocation.address;
  const wethFundAddress = WethFund.address;
  const planterFundsAddress = PlanterFund.address;
  const attributeAddress = Attribute.address;
  let daiTokenAddress;

  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    daiTokenAddress = Dai.address;
  } else if (network == "mumbai") {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
    daiTokenAddress = eval(
      `process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call RegularSale Methods...");
  await RegularSale.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setDaiFundAddress(daiFundAddress);
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setAllocationAddress(allocationAddress);
    await instance.setPlanterFundAddress(planterFundsAddress);
    await instance.setWethFundAddress(wethFundAddress);
    await instance.setAttributesAddress(attributeAddress);
    await instance.updateReferralTreePayments(
      referralTreePaymentToPlanter,
      referralTreePaymentToAmbassador,
      {
        from: accounts[0],
      }
    );
  });
};
