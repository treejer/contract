require("dotenv").config();

const DaiFunds = artifacts.require("DaiFunds.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let planterFundAddress = PlanterFund.address;
  let daiTokenAddress = isLocal
    ? Dai.address
    : eval(`process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`);

  console.log("Call DaiFunds Methods...");

  await DaiFunds.deployed().then(async (instance) => {
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setPlanterFundContractAddress(planterFundAddress);

    await instance.setTreeResearchAddress(process.env.TREE_RESEARCH_ADDRESS);
    await instance.setLocalDevelopAddress(process.env.LOCAL_DEVELOP_ADDRESS);
    await instance.setRescueFundAddress(process.env.RESCUE_FUND_ADDRESS);
    await instance.setTreejerDevelopAddress(
      process.env.TREEJER_DEVELOP_ADDRESS
    );
    await instance.setReserveFund1Address(process.env.RESERVE_FUND_ADDRESS1);
    await instance.setReserveFund2Address(process.env.RESERVE_FUND_ADDRESS2);
  });
};
