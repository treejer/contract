const { DAI, WBTC, WBTC_WHALE, WETH_WHALE, WETH } = require("./config");

const IERC20 = artifacts.require("IERC20");
const WethFunds = artifacts.require("WethFunds");
const Factory = artifacts.require("Factory.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Common = require("./common");
const Units = require("ethereumjs-units");
contract("WethFunds", (accounts) => {
  const WHALE = WETH_WHALE;
  const AMOUNT_IN = web3.utils.toWei("1");
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
  let factoryInstance;
  let wethInstance;
  let daiInstance;
  let uniswapRouterInstance;
  let testUniswapInstance;
  let planterFundsInstnce;
  beforeEach(async () => {
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

    planterFundsInstnce = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    factoryInstance = await Factory.new(accounts[2], { from: deployerAccount });
    const factoryAddress = factoryInstance.address;

    factoryInstance.INIT_CODE_PAIR_HASH();

    wethInstance = await Weth.new("WETH", "weth", { from: accounts[0] });
    const WETHAddress = wethInstance.address;

    daiInstance = await Weth.new("DAI", "dai", { from: accounts[0] });
    const DAIAddress = daiInstance.address;
    console.log("DAIAddress", DAIAddress);

    uniswapRouterInstance = await UniswapV2Router02New.new(
      factoryAddress,
      WETHAddress,
      { from: deployerAccount }
    );
    const uniswapV2Router02NewAddress = uniswapRouterInstance.address;

    testUniswapInstance = await TestUniswap.new(
      uniswapV2Router02NewAddress,
      DAIAddress,
      WETHAddress,
      { from: deployerAccount }
    );

    const testUniswapAddress = testUniswapInstance.address;

    await wethInstance.setMint(testUniswapAddress);

    await daiInstance.setMint(testUniswapAddress);

    await testUniswapInstance.addLiquidity();

    await wethFunds.setUniswapRouterAddress(uniswapV2Router02NewAddress, {
      from: deployerAccount,
    });
    await wethFunds.setWethTokenAddress(WETHAddress, { from: deployerAccount });

    await wethFunds.setDaiAddress(DAIAddress, { from: deployerAccount });
    console.log("planterFundsInstnce.address", planterFundsInstnce.address);

    await wethFunds.setPlanterFundContractAddress(planterFundsInstnce.address, {
      from: deployerAccount,
    });
  });

  it("should pass", async () => {
    const x = await wethFunds.uniswapRouter.call();
    console.log("x", x);
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

    await wethInstance.setMint(wethFunds.address);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

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
      0,
      { from: planter1Account }
    );

    let contractBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );
    console.log(`in ${web3.utils.fromWei(AMOUNT_IN.toString())}`);
    console.log(`out ${web3.utils.fromWei(contractBalance.toString())}`);

    let totalFund = await planterFundsInstnce.totalFunds.call();
    let planterFund = totalFund.planterFund;
    let referralFund = totalFund.referralFund;

    let total = Number(planterFund) + Number(referralFund);

    console.log("total", total);
    console.log("planterFund", web3.utils.fromWei(planterFund.toString()));
    console.log("referal", web3.utils.fromWei(referralFund.toString()));
  });
});
