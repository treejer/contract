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
  let uniAddress;

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

    uniAddress = eval(`process.env.UNI_TOKEN_ADDRESS_${network.toUpperCase()}`);
  }

  console.log("Call Attribute Methods...");

  await Attribute.deployed().then(async (instance) => {
    await instance.setTreeTokenAddress(treeAddress);
    await instance.setBaseTokenAddress(daiAddress);
    await instance.setDexRouterAddress(UniswapV2RouterAddress);
    await instance.setDexTokens([wethAddress, uniAddress]);
  });
};
