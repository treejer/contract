const { DAI, WBTC, WBTC_WHALE, WETH_WHALE, WETH } = require("./config");

const IERC20 = artifacts.require("IERC20");
const WethFunds = artifacts.require("WethFunds");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Common = require("./common");
contract("WethFunds", (accounts) => {
  const WHALE = WETH_WHALE;
  const AMOUNT_IN = 100000000;
  const AMOUNT_OUT_MIN = 1;
  const TOKEN_IN = WETH;
  const TOKEN_OUT = DAI;
  const TO = accounts[5];
  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  const ambassadorAccount = accounts[2];
  const planter1Account = accounts[3];
  const planter2Account = accounts[4];
  const adminAccount = accounts[8];

  let testUniswap;
  let tokenIn;
  let tokenOut;
  let arInstance;
  let wethFunds;
  let fModel;
  beforeEach(async () => {
    tokenIn = await IERC20.at(TOKEN_IN);
    tokenOut = await IERC20.at(TOKEN_OUT);

    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    wethFunds = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    fModel = await deployProxy(FinancialModel, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    // make sure WHALE has enough ETH to send tx
    // await sendEther(web3, accounts[0], WHALE, 1);
    await tokenIn.approve(wethFunds.address, AMOUNT_IN, { from: WHALE });
  });

  it("should pass", async () => {
    await wethFunds.setUniswapRouterAddress(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      { from: deployerAccount }
    );

    await wethFunds.setWethTokenAddress(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      { from: deployerAccount }
    );

    const treeId = 1;

    await fModel.addFundDistributionModel(
      4000,
      2000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await Common.addAuctionRole(arInstance, planter1Account, deployerAccount);

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await wethFunds.fundTree(
      treeId,
      AMOUNT_IN,
      4000,
      2000,
      1000,
      1000,
      1000,
      1000,
      0,
      0
    );

    console.log(`in ${AMOUNT_IN}`);
    console.log(`out ${await tokenOut.balanceOf(TO)}`);
  });
});
