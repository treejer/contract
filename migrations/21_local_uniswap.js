var Factory = artifacts.require("Factory.sol");
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

module.exports = async function (deployer, network, accounts) {
  // const isLocal = network === "development";
  // let factoryAddress;
  // let WETHAddress;
  // let uniswapV2Router02NewAddress;
  // let DAIAddress;
  // if (isLocal) {
  //   await deployer
  //     .deploy(Factory, accounts[2], {
  //       from: accounts[0],
  //     })
  //     .then((err) => {
  //       factoryAddress = Factory.address;
  //     });
  //   await deployer
  //     .deploy(Weth, "WETH", "weth", {
  //       from: accounts[0],
  //     })
  //     .then((err) => {
  //       WETHAddress = Weth.address;
  //     });
  //   await deployer
  //     .deploy(Dai, "DAI", "dai", {
  //       from: accounts[0],
  //     })
  //     .then((err) => {
  //       DAIAddress = Dai.address;
  //     });
  //   await deployer
  //     .deploy(UniswapV2Router02New, factoryAddress, WETHAddress, {
  //       from: accounts[0],
  //     })
  //     .then((err) => {
  //       uniswapV2Router02NewAddress = UniswapV2Router02New.address;
  //     });
  //   await deployer
  //     .deploy(
  //       TestUniswap,
  //       uniswapV2Router02NewAddress,
  //       DAIAddress,
  //       WETHAddress,
  //       {
  //         from: accounts[0],
  //       }
  //     )
  //     .then((err) => {
  //       testUniswapAddress = TestUniswap.address;
  //     });
  // }
  // // await testUniswap.addLiquidity();
  // console.log("DAIAddress", DAIAddress);
  // console.log("WETHAddress", WETHAddress);
  // console.log("testUniswapAddress", testUniswapAddress);
  // console.log("factoryAddress", factoryAddress);
  // console.log("uniswapV2Router02NewAddress", uniswapV2Router02NewAddress);
};
