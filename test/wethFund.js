const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const WethFunds = artifacts.require("WethFunds");
const Factory = artifacts.require("Factory.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");

var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const Math = require("./math");

const { CommonErrorMsg, TreasuryManagerErrorMsg } = require("./enumes");

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

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const withdrawReason = "reason to withdraw";

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
      web3.utils.toWei("125000", "Ether")
    );

    await daiInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("250000000", "Ether")
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

  //-------------------------------setTreeResearchAddress test-------------------------------------------------------
  it("setTreeResearchAddress should be success", async () => {
    let treeResearchAddress = userAccount4;

    await wethFunds.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.treeResearchAddress(),
      treeResearchAddress,
      "Set treeResearchAddress address not true"
    );
  });

  it("setTreeResearchAddress should be fail (invalid access)", async () => {
    let treeResearchAddress = userAccount4;

    await wethFunds
      .setTreeResearchAddress(treeResearchAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setLocalDevelopAddress test-------------------------------------------------------
  it("setLocalDevelopAddress should be success", async () => {
    let localDevelopAddress = userAccount4;

    await wethFunds.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.localDevelopAddress(),
      localDevelopAddress,
      "Set localDevelopAddress address not true"
    );
  });

  it("setLocalDevelopAddress should be fail (invalid access)", async () => {
    let localDevelopAddress = userAccount4;

    await wethFunds
      .setLocalDevelopAddress(localDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setRescueFundAddress test-------------------------------------------------------
  it("setRescueFundAddress should be success", async () => {
    let rescueFundAddress = userAccount4;

    await wethFunds.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.rescueFundAddress(),
      rescueFundAddress,
      "Set rescueFundAddress address not true"
    );
  });

  it("setRescueFundAddress should be fail (invalid access)", async () => {
    let rescueFundAddress = userAccount4;

    await wethFunds
      .setRescueFundAddress(rescueFundAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setTreejerDevelopAddress test-------------------------------------------------------
  it("setTreejerDevelopAddress should be success", async () => {
    let treejerDevelopAddress = userAccount4;

    await wethFunds.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.treejerDevelopAddress(),
      treejerDevelopAddress,
      "Set treejerDevelopAddress address not true"
    );
  });

  it("setTreejerDevelopAddress should be fail (invalid access)", async () => {
    let treejerDevelopAddress = userAccount4;

    await wethFunds
      .setTreejerDevelopAddress(treejerDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setReserveFund1Address test-------------------------------------------------------
  it("setReserveFund1Address should be success", async () => {
    let reserveFundAddress1 = userAccount4;

    await wethFunds.setReserveFund1Address(reserveFundAddress1, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.reserveFundAddress1(),
      reserveFundAddress1,
      "Set reserveFundAddress1 address not true"
    );
  });

  it("setReserveFund1Address should be fail (invalid access)", async () => {
    let reserveFundAddress1 = userAccount4;

    await wethFunds
      .setReserveFund1Address(reserveFundAddress1, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setReserveFund2Address test-------------------------------------------------------
  it("setReserveFund2Address should be success", async () => {
    let reserveFundAddress2 = userAccount4;

    await wethFunds.setReserveFund2Address(reserveFundAddress2, {
      from: deployerAccount,
    });

    assert.equal(
      await wethFunds.reserveFundAddress2(),
      reserveFundAddress2,
      "Set reserveFundAddress2 address not true"
    );
  });

  it("setReserveFund2Address should be fail (invalid access)", async () => {
    let reserveFundAddress2 = userAccount4;

    await wethFunds
      .setReserveFund2Address(reserveFundAddress2, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////------------------------------------ fundTree function test ----------------------------------------//

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

    let expectedSwapTokenAmount =
      await uniswapRouterInstance.getAmountsOut.call(
        web3.utils.toWei(".6", "Ether"),
        [wethInstance.address, daiInstance.address]
      );

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

    ////--------------------------check fund planter

    let totalFund = await planterFundsInstnce.totalFunds.call();

    let planterFunds = await planterFundsInstnce.planterFunds.call(1);
    let referralFunds = await planterFundsInstnce.referralFunds.call(1);

    assert.equal(
      Number(totalFund.planterFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
      "totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalFund.referralFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
      "totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
      "referralFund funds invalid"
    );

    ////------------check planter fund contract balance
    let contractBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(contractBalance),
      Number(expectedSwapTokenAmount[1]),
      "Contract balance not true"
    );
  });

  it("2.Should fundTree work successfully", async () => {
    const treeId = 0;
    const treeId2 = 1;

    let amount = web3.utils.toWei(".531", "Ether");

    let amountTreeId2 = web3.utils.toWei("3.252", "Ether");

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

    await fModel.addFundDistributionModel(
      2000,
      1500,
      1200,
      1400,
      1600,
      1100,
      600,
      600,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await fModel.assignTreeFundDistributionModel(1, 1, 1, {
      from: deployerAccount,
    });

    ////---------------transfer weth for wethFunds-------------------
    await wethInstance.setMint(wethFunds.address, amount);
    await wethInstance.setMint(wethFunds.address, amountTreeId2);

    ////--------------------call fund tree by auction----------------

    let expectedSwapTokenAmount =
      await uniswapRouterInstance.getAmountsOut.call(
        web3.utils.toWei(".3186", "Ether"),
        [wethInstance.address, daiInstance.address]
      );

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

    //check wethFund totalFunds treeId1
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

    ////--------------------------check fund planter

    let totalFund = await planterFundsInstnce.totalFunds.call();

    let planterFunds = await planterFundsInstnce.planterFunds.call(0);
    let referralFunds = await planterFundsInstnce.referralFunds.call(0);

    assert.equal(
      Number(totalFund.planterFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
      "totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalFund.referralFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
      "totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
      "referralFund funds invalid"
    );

    ////------------check planter fund contract balance
    let contractBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(contractBalance),
      Number(expectedSwapTokenAmount[1]),
      "Contract balance not true"
    );

    ////--------------------call fund tree by auction(treeId2)----------------
    let expectedSwapTokenAmountTreeId2 =
      await uniswapRouterInstance.getAmountsOut.call(
        web3.utils.toWei("1.1382", "Ether"),
        [wethInstance.address, daiInstance.address]
      );

    await wethFunds.fundTree(
      treeId2,
      amountTreeId2,
      2000,
      1500,
      1200,
      1400,
      1600,
      1100,
      600,
      600,
      { from: userAccount3 }
    );

    let expectedTreeId = {
      planterFund: (20 * amountTreeId2) / 100,
      referralFund: (15 * amountTreeId2) / 100,
      treeResearch: (12 * amountTreeId2) / 100,
      localDevelop: (14 * amountTreeId2) / 100,
      rescueFund: (16 * amountTreeId2) / 100,
      treejerDevelop: (11 * amountTreeId2) / 100,
      reserveFund1: (6 * amountTreeId2) / 100,
      reserveFund2: (6 * amountTreeId2) / 100,
    };

    //check wethFund totalFunds treeId2
    let totalFunds2 = await wethFunds.totalFunds();

    assert.equal(
      Number(totalFunds2.treeResearch),
      Math.add(expected.treeResearch, expectedTreeId.treeResearch),
      "2-treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop),
      Math.add(expected.localDevelop, expectedTreeId.localDevelop),
      "2-localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund),
      Math.add(expected.rescueFund, expectedTreeId.rescueFund),
      "2-rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop),
      Math.add(expected.treejerDevelop, expectedTreeId.treejerDevelop),
      "2-treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund1),
      Math.add(expected.reserveFund1, expectedTreeId.reserveFund1),
      "2-reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund2),
      Math.add(expected.reserveFund2, expectedTreeId.reserveFund2),
      "2-reserveFund2 funds invalid"
    );

    ////--------------------------check fund planter

    let totalFund2 = await planterFundsInstnce.totalFunds.call();

    let planterFunds2 = await planterFundsInstnce.planterFunds.call(1);
    let referralFunds2 = await planterFundsInstnce.referralFunds.call(1);

    assert.equal(
      Number(totalFund2.planterFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeId2[1])
          .times(2000)
          .div(3500)
          .plus(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000))
      ),
      "2-totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalFund2.referralFund),
      Number(
        Math.Big(expectedSwapTokenAmount[1])
          .times(2000)
          .div(6000)
          .plus(
            Math.Big(expectedSwapTokenAmountTreeId2[1]).times(1500).div(3500)
          )
      ),
      "2-totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds2),
      Number(Math.Big(expectedSwapTokenAmountTreeId2[1]).times(2000).div(3500)),
      "2-planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds2),
      Number(Math.Big(expectedSwapTokenAmountTreeId2[1]).times(1500).div(3500)),
      "2-referralFund funds invalid"
    );

    ////------------check planter fund contract balance
    let contractBalance2 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(contractBalance2),
      Number(
        Math.Big(expectedSwapTokenAmount[1]).plus(
          expectedSwapTokenAmountTreeId2[1]
        )
      ),
      "2-Contract balance not true"
    );
  });

  it("fundTree should be fail (invalid access)", async () => {
    let amount = web3.utils.toWei(".531", "Ether");

    await fModel.addFundDistributionModel(
      2000,
      1500,
      1200,
      1400,
      1600,
      1100,
      600,
      600,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await wethFunds
      .fundTree(0, amount, 2000, 1500, 1200, 1400, 1600, 1100, 600, 600, {
        from: userAccount1,
      })
      .should.be.rejectedWith(
        TreasuryManagerErrorMsg.ONLY_AUCTION_OR_INCREAMENTAL_OR_REGULAR_SELL
      );
  });

  //////----------------------------------withdraw Tree Research test------------------------
  it("should withdraw Tree Research succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw Local Develop data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const treeResearchAddress = userAccount3;

    const totalTreeResearchFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treeResearch),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalTreeResearchFunded,
      Number(totalFunds1.treeResearch),
      "reserve fund1 total fund1 is not ok"
    );

    const treeResearchBalnance1 = await wethInstance.balanceOf(
      treeResearchAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawTreeResearch(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreeResearchWethBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == treeResearchAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const treeResearchBalnance2 = await wethInstance.balanceOf(
      treeResearchAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treeResearch),
        Number(totalFunds2.treeResearch)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(treeResearchBalnance2),
      Math.add(Number(treeResearchBalnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawTreeResearch(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(
      tx2,
      "TreeResearchWethBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == treeResearchAddress &&
          ev.reason == withdrawReason
        );
      }
    );

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const treeResearchBalnance3 = await wethInstance.balanceOf(
      treeResearchAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treeResearch),
        Number(totalFunds3.treeResearch)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalTreeResearchFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.treeResearch),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(treeResearchBalnance3),
      Math.add(Number(treeResearchBalnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail Tree Research withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setTreeResearchAddress(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawTreeResearch(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawTreeResearch(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawTreeResearch(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawTreeResearch(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawTreeResearch(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //////----------------------------------withdraw local Develop test------------------------
  it("should withdraw local Develop succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw Local Develop data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const localDevelopAddress = userAccount3;

    const totalLocalDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), localDevelop),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalLocalDevelopFunded,
      Number(totalFunds1.localDevelop),
      "reserve fund1 total fund1 is not ok"
    );

    const localDevelopBalnance1 = await wethInstance.balanceOf(
      localDevelopAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawLocalDevelop(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "LocalDevelopWethBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == localDevelopAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const localDevelopBalnance2 = await wethInstance.balanceOf(
      localDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.localDevelop),
        Number(totalFunds2.localDevelop)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(localDevelopBalnance2),
      Math.add(Number(localDevelopBalnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawLocalDevelop(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(
      tx2,
      "LocalDevelopWethBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == localDevelopAddress &&
          ev.reason == withdrawReason
        );
      }
    );

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const localDevelopBalnance3 = await wethInstance.balanceOf(
      localDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.localDevelop),
        Number(totalFunds3.localDevelop)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalLocalDevelopFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.localDevelop),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(localDevelopBalnance3),
      Math.add(Number(localDevelopBalnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail local Develop withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setLocalDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawLocalDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawLocalDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawLocalDevelop(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawLocalDevelop(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawLocalDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //////----------------------------------withdraw rescue fund test------------------------
  it("should withdraw rescue fund succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw rescue fund data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const rescueFundAddress = userAccount3;

    const totalRescueFundFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), rescueFund),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalRescueFundFunded,
      Number(totalFunds1.rescueFund),
      "reserve fund1 total fund1 is not ok"
    );

    const rescueFundBalnance1 = await wethInstance.balanceOf(rescueFundAddress);

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawRescueFund(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "RescueWethBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == rescueFundAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const rescueFundBalnance2 = await wethInstance.balanceOf(rescueFundAddress);

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.rescueFund),
        Number(totalFunds2.rescueFund)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(rescueFundBalnance2),
      Math.add(Number(rescueFundBalnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawRescueFund(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "RescueWethBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == rescueFundAddress &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const rescueFundBalnance3 = await wethInstance.balanceOf(rescueFundAddress);

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.rescueFund),
        Number(totalFunds3.rescueFund)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalRescueFundFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.rescueFund),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(rescueFundBalnance3),
      Math.add(Number(rescueFundBalnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail rescue fund withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setRescueFundAddress(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawRescueFund(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawRescueFund(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawRescueFund(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawRescueFund(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawRescueFund(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //////----------------------------------withdraw treejer develop test------------------------
  it("should withdraw treejer develop succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw treejer develop data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const treejerDevelopAddress = userAccount3;

    const totalTreejerDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treejerDevelop),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalTreejerDevelopFunded,
      Number(totalFunds1.treejerDevelop),
      "reserve fund1 total fund1 is not ok"
    );

    const treejerDevelopBalnance1 = await wethInstance.balanceOf(
      treejerDevelopAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawTreejerDevelop(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(
      tx,
      "TreejerDevelopWethBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == treejerDevelopAddress &&
          ev.reason == withdrawReason
        );
      }
    );
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const treejerDevelopBalnance2 = await wethInstance.balanceOf(
      treejerDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds2.treejerDevelop)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(treejerDevelopBalnance2),
      Math.add(Number(treejerDevelopBalnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawTreejerDevelop(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(
      tx2,
      "TreejerDevelopWethBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == treejerDevelopAddress &&
          ev.reason == withdrawReason
        );
      }
    );

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const treejerDevelopBalnance3 = await wethInstance.balanceOf(
      treejerDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds3.treejerDevelop)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalTreejerDevelopFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.treejerDevelop),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(treejerDevelopBalnance3),
      Math.add(Number(treejerDevelopBalnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail reserve1 fund withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setTreejerDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawTreejerDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawTreejerDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawTreejerDevelop(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawTreejerDevelop(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawTreejerDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //////----------------------------------withdraw reserve fund1 test------------------------
  it("should withdraw reserve fund1 succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 1000;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setReserveFund1Address(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawReserveFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw reserve fund1 data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const reserveFund1 = 1000;
    const reserveFund2 = 0;

    const reserveFund1Address = userAccount3;

    const totalReserveFund1Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), reserveFund1),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setReserveFund1Address(reserveFund1Address, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalReserveFund1Funded,
      Number(totalFunds1.reserveFund1),
      "reserve fund1 total fund1 is not ok"
    );

    const reserveFund1Balnance1 = await wethInstance.balanceOf(
      reserveFund1Address
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawReserveFund1(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "reserveWethBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == reserveFund1Address &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const reserveFund1Balnance2 = await wethInstance.balanceOf(
      reserveFund1Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund1),
        Number(totalFunds2.reserveFund1)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(reserveFund1Balnance2),
      Math.add(Number(reserveFund1Balnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawReserveFund1(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "reserveWethBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == reserveFund1Address &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const reserveFund1Balnance3 = await wethInstance.balanceOf(
      reserveFund1Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund1),
        Number(totalFunds3.reserveFund1)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalReserveFund1Funded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.reserveFund1),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(reserveFund1Balnance3),
      Math.add(Number(reserveFund1Balnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail reserve1 fund withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 1000;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setReserveFund1Address(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawReserveFund1(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setReserveFund1Address(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawReserveFund1(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawReserveFund1(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawReserveFund1(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawReserveFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawReserveFund1(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //////----------------------------------withdraw reserve fund2 test------------------------
  it("should withdraw reserve fund2 succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    //////// -------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    ////////////------------------- set addresses
    await wethFunds.setReserveFund2Address(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
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
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await wethFunds.withdrawReserveFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw reserve fund2 data to be ok", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    const reserveFund2Address = userAccount3;

    const totalReserveFund2Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), reserveFund2),
      10000
    );

    const wethFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);

    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);

    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);

    /////////// ------------------ set addresses
    await wethFunds.setReserveFund2Address(reserveFund2Address, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    ////////---------------fund trees-------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await wethInstance.balanceOf(
      wethFunds.address
    );

    const totalFunds1 = await wethFunds.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      wethFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalReserveFund2Funded,
      Number(totalFunds1.reserveFund2),
      "reserve fund2 total fund1 is not ok"
    );

    const reserveFund2Balnance1 = await wethInstance.balanceOf(
      reserveFund2Address
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await wethFunds.withdrawReserveFund2(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "reserveWethBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == reserveFund2Address &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const reserveFund2Balnance2 = await wethInstance.balanceOf(
      reserveFund2Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund2),
        Number(totalFunds2.reserveFund2)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(reserveFund2Balnance2),
      Math.add(Number(reserveFund2Balnance1), Number(withdrawBalance1)),
      "reserve fund2 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await wethFunds.withdrawReserveFund2(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "reserveWethBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == reserveFund2Address &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await wethFunds.totalFunds();

    const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
      wethFunds.address
    );

    const reserveFund2Balnance3 = await wethInstance.balanceOf(
      reserveFund2Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Math.subtract(
        wethFundContractShare,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      "contract balance after withdraw2 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund2),
        Number(totalFunds3.reserveFund2)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalReserveFund2Funded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.reserveFund2),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(reserveFund2Balnance3),
      Math.add(Number(reserveFund2Balnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail reserve fund2 withdraw", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    ///////////--------------------- add roles
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    await Common.addFundsRole(arInstance, wethFunds.address, deployerAccount);
    /////////////////------------------- set addresses
    await wethFunds.setReserveFund2Address(zeroAddress, {
      from: deployerAccount,
    });

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////---------------transfer weth for wethFunds-------------------

    await wethInstance.setMint(wethFunds.address, amount);

    await wethInstance.setMint(wethFunds.address, amount1);

    //////////--------------- fund tree -------------------

    await wethFunds.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await wethFunds.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    ///////////////////// should fail
    await wethFunds
      .withdrawReserveFund2(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await wethFunds.setReserveFund2Address(userAccount3, {
      from: deployerAccount,
    });

    await wethFunds
      .withdrawReserveFund2(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await wethFunds
      .withdrawReserveFund2(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await wethFunds
      .withdrawReserveFund2(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await wethFunds.withdrawReserveFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await wethFunds
      .withdrawReserveFund2(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });
});