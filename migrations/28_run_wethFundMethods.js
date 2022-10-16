require("dotenv").config();

// local uniswap
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniSwapMini.sol");

//deployed contracts
const WethFund = artifacts.require("WethFund.sol");
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
  } else if (network == "mumbai") {
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

  console.log("Call WethFund Methods...");

  await WethFund.deployed().then(async (instance) => {
    await instance.setDaiAddress(daiAddress);
    await instance.setWethTokenAddress(wethAddress);
    await instance.setDexRouterAddress(UniswapV2RouterAddress);
    await instance.setPlanterFundContractAddress(planterFundAddress);
  });
};
