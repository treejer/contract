require("dotenv").config();

// local uniswap
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");

//deployed contracts
const WethFunds = artifacts.require("WethFunds.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let UniswapV2RouterAddress;
  let daiAddress;
  let wethAddress;

  let planterFundAddress = PlanterFund.address;

  if (isLocal) {
    UniswapV2RouterAddress = UniswapV2Router02New.address;
    daiAddress = Dai.address;
    wethAddress = Weth.address;
  } else {
    UniswapV2RouterAddress = eval(
      `process.env.UNISWAP_ROUTER_V2_ADDRESS_${network.toUpperCase()}`
    );
    daiAddress = eval(`process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`);
    wethAddress = eval(
      `process.env.WETH_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  }

  console.log("Call WethFunds Methods...");

  await WethFunds.deployed().then(async (instance) => {
    await instance.setDaiAddress(daiAddress);
    await instance.setWethTokenAddress(wethAddress);
    await instance.setUniswapRouterAddress(UniswapV2RouterAddress);
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
