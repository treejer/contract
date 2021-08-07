const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const WethFunds = artifacts.require("WethFunds");
const Factory = artifacts.require("Factory.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  TreeAuctionErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const Common = require("./common");

contract("WethFunds", (accounts) => {
  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

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

    await wethInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("10000", "Ether")
    );

    await daiInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("10000", "Ether")
    );

    await testUniswapInstance.addLiquidity();

    await wethFunds.setUniswapRouterAddress(uniswapV2Router02NewAddress, {
      from: deployerAccount,
    });
    await wethFunds.setWethTokenAddress(WETHAddress, { from: deployerAccount });

    await wethFunds.setDaiAddress(DAIAddress, { from: deployerAccount });

    await wethFunds.setPlanterFundContractAddress(planterFundsInstnce.address, {
      from: deployerAccount,
    });
  });

  /*ssss

  /////////////------------------------------------ set Dai Token address ----------------------------------------//

  it("set dai token address", async () => {
    await wethFunds.setDaiAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await wethFunds
      .setDaiAddress(daiInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////------------------------------------ set Weth Token address ----------------------------------------//

  it("set weth token address", async () => {
    await wethFunds.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await wethFunds
      .setWethTokenAddress(wethInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////------------------------------------ set Uniswap Router address ----------------------------------------//

  it("set uniswap router address", async () => {
    await wethFunds.setUniswapRouterAddress(uniswapRouterInstance.address, {
      from: deployerAccount,
    });

    await wethFunds
      .setUniswapRouterAddress(uniswapRouterInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//

  it("set uniswap router address", async () => {
    await wethFunds.setPlanterFundContractAddress(planterFundsInstnce.address, {
      from: deployerAccount,
    });

    await wethFunds
      .setPlanterFundContractAddress(planterFundsInstnce.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////------------------------------------ fundTree function test ----------------------------------------//

  ssss*/

  it("Should fundTree work successfully", async () => {
    const treeId = 1;
    let amount = web3.utils.toWei("1", "Ether");

    ////--------------check set role----------------
    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////--------------add and assign DistributionModel for tree
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

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    ////---------------transfer weth for wethFunds-------------------
    await wethInstance.setMint(wethFunds.address, amount);

    ////--------------------call fund tree by auction----------------
    await wethFunds.fundTree(
      treeId,
      amount,
      4000,
      2000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      { from: userAccount3 }
    );

    let expected = {
      planterFund: (40 * amount) / 100,
      referralFund: (20 * amount) / 100,
      treeResearch: (10 * amount) / 100,
      localDevelop: (10 * amount) / 100,
      rescueFund: (10 * amount) / 100,
      treejerDevelop: (10 * amount) / 100,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    //check wethFund totalFunds
    let totalFunds = await wethFunds.totalFunds();

    assert.equal(
      Number(totalFunds.treeResearch),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds.localDevelop),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.rescueFund),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treejerDevelop),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.reserveFund1),
      expected.reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.reserveFund2),
      expected.reserveFund2,
      "reserveFund2 funds invalid"
    );

    //check fund planter

    let totalFund = await planterFundsInstnce.totalFunds.call();

    let planterFund = totalFund.planterFund;
    let referralFund = totalFund.referralFund;

    // let contractBalance = await daiInstance.balanceOf(
    //   planterFundsInstnce.address
    // );

    // console.log(`out ${web3.utils.fromWei(contractBalance.toString())}`);

    // let totalFund = await planterFundsInstnce.totalFunds.call();
    // let planterFund = totalFund.planterFund;
    // let referralFund = totalFund.referralFund;

    // let total = Number(planterFund) + Number(referralFund);

    // console.log("total", total);
    // console.log("planterFund", web3.utils.fromWei(planterFund.toString()));
    // console.log("referal", web3.utils.fromWei(referralFund.toString()));
  });
});
