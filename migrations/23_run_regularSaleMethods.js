require("dotenv").config();
const RegularSale = artifacts.require("RegularSale.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const DaiFund = artifacts.require("DaiFund.sol");
const Dai = artifacts.require("Dai.sol");
const Allocation = artifacts.require("Allocation.sol");
const WethFund = artifacts.require("WethFund.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  const referralTreePaymentToPlanter = web3.utils.toWei("0.5");
  const referralTreePaymentToAmbassador = web3.utils.toWei("0.1");
  const treeFactoryAddress = TreeFactory.address;
  const daiFundAddress = DaiFund.address;
  const allocationAddress = Allocation.address;
  const wethFundAddress = WethFund.address;
  const planterFundsAddress = PlanterFund.address;
  let daiTokenAddress;

  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    daiTokenAddress = Dai.address;
  } else if (network == "mumbai") {
    trustedForwarder = process.env.GSN_FORWARDER;
    daiTokenAddress = Dai.address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
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

    await instance.updateReferralTreePayments(
      referralTreePaymentToPlanter,
      referralTreePaymentToAmbassador,
      {
        from: accounts[0],
      }
    );
  });
};
