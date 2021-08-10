const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

//treasury section
const WethFunds = artifacts.require("WethFunds.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Weth = artifacts.require("Weth.sol");

//uniswap
var Factory = artifacts.require("Factory.sol");
var Dai = artifacts.require("Dai.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

contract("IncrementalSell", (accounts) => {
  let iSellInstance;
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let treasuryInstance;
  let treeTokenInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const treasuryAddress = accounts[9];

  const ipfsHash = "some ipfs hash here";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
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

    ////--------------------------uniswap deploy

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

    /////---------------------------addLiquidity-------------------------

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

    /////-------------------------handle address here-----------------

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------wethFundsInstance

    await wethFundsInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await wethFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await wethFundsInstance.setUniswapRouterAddress(
      uniswapV2Router02NewAddress,
      {
        from: deployerAccount,
      }
    );

    await wethFundsInstance.setWethTokenAddress(WETHAddress, {
      from: deployerAccount,
    });

    await wethFundsInstance.setDaiAddress(DAIAddress, {
      from: deployerAccount,
    });

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );
    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, WethFunds.address, deployerAccount);

    /////----------------add distributionModel

    await fModel.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
  });
  afterEach(async () => {});

  it("deploys successfully", async () => {
    const address = iSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ///////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set tree factory address", async () => {
    await iSellInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      treeFactoryInstance.address,
      await iSellInstance.treeFactory.call(),
      "address set incorect"
    );
  });

  /////////////////---------------------------------set weth funds address--------------------------------------------------------
  it("Set weth funds address", async () => {
    await iSellInstance
      .setWethFundsAddress(wethFundsInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      wethFundsInstance.address,
      await iSellInstance.wethFunds.call(),
      "weth funds address set incorect"
    );
  });

  /////////////////---------------------------------set weth token address--------------------------------------------------------
  it("Set weth token address", async () => {
    await iSellInstance
      .setWethTokenAddress(wethInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      wethInstance.address,
      await iSellInstance.wethToken.call(),
      "weth token address set incorect"
    );
  });

  /////////////////---------------------------------set financialModel address--------------------------------------------------------
  it("Set financial Model address", async () => {
    await iSellInstance
      .setFinancialModelAddress(fModel.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    assert.equal(
      fModel.address,
      await iSellInstance.financialModel.call(),
      "financial model address set incorect"
    );
  });

  it("added incrementalSell should has positive tree Count", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 0, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_TO_SELL); //must be faild because treeCount is zero
  });

  it("added incrementalSell should has startTreeId>100", async () => {
    await iSellInstance
      .addTreeSells(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.OCCUPIED_TREES); //treeStartId should be >100
  });

  it("added incrementalSell should has steps of price change>0", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 0, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS); // steps of price change should be >0
  });
  it("added incrementalSell should have equivalant fund distribution model", async () => {
    await fModel.assignTreeFundDistributionModel(105, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
  });

  it("added incrementalSell should have equivalant fund distribution model", async () => {
    await fModel.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await fModel.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(110, 10000, 1, {
      from: deployerAccount,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
  });
  it("incrementalSell all trees should be availabe to sell", async () => {
    treeAuctionInstance = await deployProxy(TreeAuction, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    await treeAuctionInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await fModel.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await fModel.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 1, {
      from: deployerAccount,
    });

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(107, ipfsHash, { from: deployerAccount });

    await treeAuctionInstance.createAuction(
      107,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_PROVIDED_BEFORE); // trees shouldnot be on other provides
  });

  it("buyed Tree should be in incremental sell", async () => {
    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await fModel.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    let eventTx = await iSellInstance.addTreeSells(
      105,
      web3.utils.toWei("0.01"),
      250,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    truffleAssert.eventEmitted(eventTx, "IncrementalSellUpdated", (ev) => {
      return true;
    });

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(102, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);
  });

  it("low price paid for the tree", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      250,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.009"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.009"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(110, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
  });

  it("check discount timeout", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    let funderBalance1 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance1),
      web3.utils.toWei("0"),
      "1-funder balance not true"
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    let expectedSwapTokenAmountTreeid101 =
      await uniswapRouterInstance.getAmountsOut.call(
        web3.utils.toWei("0.0042", "Ether"),
        [wethInstance.address, daiInstance.address]
      );

    await iSellInstance.buyTree(101, {
      from: userAccount3,
    });

    ////////-------------Check PlanterFund and wethFund data after buy tree (treeId==101)

    const wethFundsBalanceAfter = await wethInstance.balanceOf(
      wethFundsInstance.address
    );

    const planterFundsBalanceAfter = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const iSellBalanceAfter = await wethInstance.balanceOf(
      iSellInstance.address
    );

    assert.equal(
      Number(wethFundsBalanceAfter),
      Number(web3.utils.toWei(".0058")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter),
      Number(expectedSwapTokenAmountTreeid101[1]),
      "planterFunds balance not true"
    );

    assert.equal(Number(iSellBalanceAfter), 0, "iSell balance not true");

    ////--------------------------check weth fund
    let amount = Number(web3.utils.toWei("0.01"));

    let expected = {
      planterFund: (30 * amount) / 100,
      referralFund: (12 * amount) / 100,
      treeResearch: (12 * amount) / 100,
      localDevelop: (12 * amount) / 100,
      rescueFund: (12 * amount) / 100,
      treejerDevelop: (22 * amount) / 100,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    //check wethFund totalFunds
    let totalFunds = await wethFundsInstance.totalFunds();

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

    let totalPlanterFund = await planterFundsInstnce.totalFunds.call();

    let planterFunds = await planterFundsInstnce.planterFunds.call(101);
    let referralFunds = await planterFundsInstnce.referralFunds.call(101);

    assert.equal(
      Number(totalPlanterFund.planterFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).times(3000).div(4200)
      ),
      "totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalPlanterFund.referralFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).times(1200).div(4200)
      ),
      "totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).times(3000).div(4200)
      ),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).times(1200).div(4200)
      ),
      "referralFund funds invalid"
    );

    ////------------check planter fund contract balance
    let contractBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(contractBalance),
      Number(expectedSwapTokenAmountTreeid101[1]),
      "Contract balance not true"
    );

    ////////////////////////////////////////////

    await Common.travelTime(TimeEnumes.minutes, 7);

    let funderBalance2 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance2),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.009"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.009"),
      {
        from: userAccount3,
      }
    );

    let expectedSwapTokenAmountTreeid120 =
      await uniswapRouterInstance.getAmountsOut.call(
        web3.utils.toWei("0.00378", "Ether"),
        [wethInstance.address, daiInstance.address]
      );

    await iSellInstance.buyTree(120, {
      from: userAccount3,
    });

    let funderBalance3 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance3),
      web3.utils.toWei("0"),
      "3-funder balance not true"
    );

    ////////-------------Check PlanterFund and wethFund data after buy tree (treeId==120)

    const wethFundsBalanceAfter2 = await wethInstance.balanceOf(
      wethFundsInstance.address
    );

    const planterFundsBalanceAfter2 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const iSellBalanceAfter2 = await wethInstance.balanceOf(
      iSellInstance.address
    );

    assert.equal(
      Number(wethFundsBalanceAfter2),
      Math.add(
        Number(web3.utils.toWei(".0058")),
        Number(web3.utils.toWei("0.00522"))
      ),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter2),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).plus(
          expectedSwapTokenAmountTreeid120[1]
        )
      ),
      "planterFunds balance not true"
    );

    assert.equal(Number(iSellBalanceAfter2), 0, "iSell balance not true");

    ////--------------------------check weth fund
    let amount2 = Number(web3.utils.toWei("0.009"));

    let expected2 = {
      planterFund: (30 * amount2) / 100,
      referralFund: (12 * amount2) / 100,
      treeResearch: (12 * amount2) / 100,
      localDevelop: (12 * amount2) / 100,
      rescueFund: (12 * amount2) / 100,
      treejerDevelop: (22 * amount2) / 100,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    //check wethFund totalFunds
    let totalFunds2 = await wethFundsInstance.totalFunds();

    assert.equal(
      Number(totalFunds2.treeResearch),
      Math.add(Number(expected2.treeResearch), Number(expected.treeResearch)),
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop),
      Math.add(Number(expected2.localDevelop), Number(expected.localDevelop)),
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund),
      Math.add(Number(expected2.rescueFund), Number(expected.rescueFund)),
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop),
      Math.add(
        Number(expected2.treejerDevelop),
        Number(expected.treejerDevelop)
      ),
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund1),
      Math.add(Number(expected2.reserveFund1), Number(expected.reserveFund1)),
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund2),
      Math.add(Number(expected2.reserveFund2), Number(expected.reserveFund2)),
      "reserveFund2 funds invalid"
    );

    ////--------------------------check fund planter

    let totalPlanterFund2 = await planterFundsInstnce.totalFunds.call();

    let planterFunds2 = await planterFundsInstnce.planterFunds.call(120);
    let referralFunds2 = await planterFundsInstnce.referralFunds.call(120);

    assert.equal(
      Number(totalPlanterFund2.planterFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1])
          .times(3000)
          .div(4200)
          .plus(
            Math.Big(expectedSwapTokenAmountTreeid120[1]).times(3000).div(4200)
          )
      ),
      "totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalPlanterFund2.referralFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1])
          .times(1200)
          .div(4200)
          .plus(
            Math.Big(expectedSwapTokenAmountTreeid120[1]).times(1200).div(4200)
          )
      ),
      "totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds2),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid120[1]).times(3000).div(4200)
      ),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds2),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid120[1]).times(1200).div(4200)
      ),
      "referralFund funds invalid"
    );

    ////------------check planter fund contract balance
    let contractBalance2 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(contractBalance2),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid120[1]).plus(
          expectedSwapTokenAmountTreeid101[1]
        )
      ),
      "Contract balance not true"
    );

    ////////////////////////////////////////////

    /////---------------- step2 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0209"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.0209"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(121, {
      from: userAccount3,
    });

    let funderBalance4 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance4),
      web3.utils.toWei("0.0099"),
      "4-funder balance not true"
    );

    await iSellInstance.buyTree(140, {
      from: userAccount3,
    });

    let funderBalance5 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance5),
      web3.utils.toWei("0"),
      "5-funder balance not true"
    );

    /////---------------- step3 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0228"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.0228"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(141, {
      from: userAccount3,
    });

    let funderBalance6 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance6),
      web3.utils.toWei("0.0108"),
      "6-funder balance not true"
    );

    await Common.travelTime(TimeEnumes.minutes, 12);

    await iSellInstance
      .buyTree(160, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);

    let funderBalance7 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance7),
      web3.utils.toWei("0.0108"),
      "7-funder balance not true"
    );

    /////---------------- step4 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0032"));

    let funderBalance8 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance8),
      web3.utils.toWei("0.014"),
      "8-funder balance not true"
    );

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.014"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(200, { from: userAccount3 });

    let funderBalance9 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance9),
      web3.utils.toWei("0"),
      "9-funder balance not true"
    );

    ////--------------------step5------------------------

    await iSellInstance
      .buyTree(201, { value: web3.utils.toWei("0.0099"), from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);
  });

  it("check discount usage", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(110, {
      from: userAccount3,
    });

    await Common.travelTime(TimeEnumes.minutes, 1);

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.009"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.009"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(119, {
      from: userAccount3,
    });

    await Common.travelTime(TimeEnumes.minutes, 5);

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.009"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.009"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(145, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
  });

  it("Should updateIncrementalEnd succesfully", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    let incrementalPrice = await iSellInstance.incrementalPrice();

    assert.equal(Number(incrementalPrice.startTree), 101, "startTree not true");

    assert.equal(Number(incrementalPrice.endTree), 201, "startTree not true");

    assert.equal(
      Number(incrementalPrice.initialPrice),
      Number(web3.utils.toWei("0.01")),
      "initialPrice not true"
    );

    assert.equal(
      Number(incrementalPrice.increaseStep),
      100,
      "increaseStep not true"
    );

    assert.equal(
      Number(incrementalPrice.increaseRatio),
      1000,
      "increaseRatio not true"
    );

    const eventTx = await iSellInstance.updateIncrementalEnd(100, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(eventTx, "IncrementalSellUpdated", (ev) => {
      return true;
    });

    let incrementalPrice1 = await iSellInstance.incrementalPrice();

    assert.equal(Number(incrementalPrice1.endTree), 301, "startTree not true");
  });

  it("Should updateIncrementalEnd reject()", async () => {
    treeAuctionInstance = await deployProxy(TreeAuction, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeAuctionInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await iSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(217, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance.createAuction(
      217,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await iSellInstance
      .updateIncrementalEnd(100, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_PROVIDED_BEFORE);
  });
});
