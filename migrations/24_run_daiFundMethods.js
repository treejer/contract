require("dotenv").config();

const DaiFund = artifacts.require("DaiFund.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Dai = artifacts.require("Dai.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = ["development", "mumbai"].includes(network);

  let planterFundAddress = PlanterFund.address;
  let daiTokenAddress = isLocal
    ? Dai.address
    : eval(`process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`);

  console.log("Call DaiFund Methods...");

  await DaiFund.deployed().then(async (instance) => {
    await instance.setDaiTokenAddress(daiTokenAddress);
    await instance.setPlanterFundContractAddress(planterFundAddress);
  });
};
