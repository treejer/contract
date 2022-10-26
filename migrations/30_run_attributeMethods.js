require("dotenv").config();

const Tree = artifacts.require("Tree.sol");
const Attribute = artifacts.require("Attribute.sol");

// local uniswap
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
// var Uni = artifacts.require("Uni.sol");
var UniswapV2Router02New = artifacts.require("UniSwapMini.sol");

module.exports = async function (deployer, network, accounts) {
  const treeAddress = Tree.address;

  const isLocal = network === "development";

  let UniswapV2RouterAddress;
  let daiAddress;
  let wethAddress;
  let sandAddress;
  let wmaticAddress;
  let usdtAddress;
  let usdcAddress;
  let quickAddress;
  let baseToken;
  if (isLocal) {
    UniswapV2RouterAddress = UniswapV2Router02New.address;
    daiAddress = Dai.address;
    wethAddress = Weth.address;
    baseToken = Weth.address;
  } else if (network == "mumbai") {
    UniswapV2RouterAddress = UniswapV2Router02New.address;
    daiAddress = Dai.address;
    wethAddress = Weth.address;
    baseToken = Weth.address;
  } else if (network == "matic") {
    UniswapV2RouterAddress = eval(
      `process.env.UNISWAP_ROUTER_V2_ADDRESS_${network.toUpperCase()}`
    );
    daiAddress = eval(`process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`);
    wethAddress = eval(
      `process.env.WETH_TOKEN_ADDRESS_${network.toUpperCase()}`
    );

    sandAddress = eval(
      `process.env.SAND_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
    wmaticAddress = eval(
      `process.env.WMATIC_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
    usdtAddress = eval(
      `process.env.USDT_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
    usdcAddress = eval(
      `process.env.USDC_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
    quickAddress = eval(
      `process.env.QUICK_TOKEN_ADDRESS_${network.toUpperCase()}`
    );

    baseToken = eval(
      `process.env.WMATIC_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
  } else {
    UniswapV2RouterAddress = eval(
      `process.env.UNISWAP_ROUTER_V2_ADDRESS_${network.toUpperCase()}`
    );
    daiAddress = eval(`process.env.DAI_TOKEN_ADDRESS_${network.toUpperCase()}`);
    wethAddress = eval(
      `process.env.WETH_TOKEN_ADDRESS_${network.toUpperCase()}`
    );

    usdtAddress = eval(
      `process.env.USDT_TOKEN_ADDRESS_${network.toUpperCase()}`
    );
    usdcAddress = eval(
      `process.env.USDC_TOKEN_ADDRESS_${network.toUpperCase()}`
    );

    baseToken = eval(`process.env.WETH_TOKEN_ADDRESS_${network.toUpperCase()}`);
  }

  console.log("Call Attribute Methods...");

  await Attribute.deployed().then(async (instance) => {
    await instance.setTreeTokenAddress(treeAddress);
    await instance.setBaseTokenAddress(baseToken);
    await instance.setDexRouterAddress(UniswapV2RouterAddress);
    await instance.setDexTokens([usdtAddress, usdcAddress]);
  });
};
