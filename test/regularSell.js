const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSell = artifacts.require("RegularSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Tree = artifacts.require("Tree.sol");
const Planter = artifacts.require("Planter.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");
const Math = require("./math");

//treasury section
const DaiFunds = artifacts.require("DaiFunds.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Dai = artifacts.require("Dai.sol");

const {
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  RegularSellErrors,
  TreasuryManagerErrorMsg,
} = require("./enumes");

contract("regularSell", (accounts) => {
  let regularSellInstance;
  let treeFactoryInstance;
  let arInstance;

  let treeTokenInstance;
  let treasuryInstance;

  let fModel;
  let daiFundsInstance;
  let planterFundsInstnce;
  let daiInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    const treePrice = Units.convert("7", "eth", "wei"); // 7 dai

    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    regularSellInstance = await deployProxy(
      RegularSell,
      [arInstance.address, treePrice],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

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

    daiFundsInstance = await deployProxy(DaiFunds, [arInstance.address], {
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

    daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
  });

  afterEach(async () => {});

  //////////////////************************************ deploy successfully ***************************************
  it("deploys successfully", async () => {
    const address = regularSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ///////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set tree factory address", async () => {
    await regularSellInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      treeFactoryInstance.address,
      await regularSellInstance.treeFactory.call(),
      "address set incorect"
    );
  });

  /////////////////---------------------------------set dai funds address--------------------------------------------------------
  it("Set dai funds address", async () => {
    await regularSellInstance
      .setDaiFundsAddress(daiFundsInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      daiFundsInstance.address,
      await regularSellInstance.daiFunds.call(),
      "dai funds address set incorect"
    );
  });

  /////////////////---------------------------------set dai token address--------------------------------------------------------
  it("Set dai funds address", async () => {
    await regularSellInstance
      .setDaiTokenAddress(daiInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      daiInstance.address,
      await regularSellInstance.daiToken.call(),
      "dai token address set incorect"
    );
  });

  /////////////////---------------------------------set financialModel address--------------------------------------------------------
  it("Set financial Model address", async () => {
    await regularSellInstance
      .setFinancialModelAddress(fModel.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    assert.equal(
      fModel.address,
      await regularSellInstance.financialModel.call(),
      "financial model address set incorect"
    );
  });

  /////////////////------------------------------------- set price ------------------------------------------
  it("set price and check data", async () => {
    let treePrice1 = await regularSellInstance.treePrice.call();

    assert.equal(
      Number(treePrice1),
      Number(web3.utils.toWei("7")),
      "treePriceInvalid"
    );

    let tx = await regularSellInstance.setPrice(100, { from: deployerAccount });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == 100;
    });

    const treePrice2 = await regularSellInstance.treePrice.call();

    assert.equal(Number(treePrice2), 100, "tree price is incorrect");
  });

  it("should fail set price", async () => {
    await regularSellInstance
      .setPrice(10, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////////////// -------------------------------------- request trees ----------------------------------------------------
  it("Should request trees successfully", async () => {
    let funder = userAccount3;

    //mint dai for funder
    await daiInstance.setMint(funder, web3.utils.toWei("49"));

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(10001, 10007, 0, {
      from: deployerAccount,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle address here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    ///////////////////////--------------------- requestTrees --------------------------

    let funderBalanceBefore = await daiInstance.balanceOf(funder);

    assert.equal(
      Number(funderBalanceBefore),
      web3.utils.toWei("49"),
      "1-funder balance not true"
    );

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("49"),
      {
        from: funder,
      }
    );

    let requestTx = await regularSellInstance.requestTrees(
      7,
      web3.utils.toWei("49"),
      {
        from: funder,
      }
    );

    truffleAssert.eventEmitted(requestTx, "RegularTreeRequsted", (ev) => {
      return (
        Number(ev.count) == 7 &&
        ev.buyer == funder &&
        Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 7)
      );
    });

    const daiFundsBalanceAfter = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter),
      Number(web3.utils.toWei("23.52")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter),
      Number(web3.utils.toWei("25.48")),
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter),
      0,
      "regularSell balance not true"
    );

    let tokentOwner;
    for (let i = 10001; i < 10008; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(10001);
      assert.equal(tokentOwner, funder, "funder not true " + i);
    }

    await treeTokenInstance.ownerOf(10000).should.be.rejected;
    await treeTokenInstance.ownerOf(10008).should.be.rejected;

    let lastSoldRegularTree = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree),
      10007,
      "lastSoldRegularTree not true"
    );

    let funderBalanceAfter = await daiInstance.balanceOf(funder);

    assert.equal(
      Number(funderBalanceAfter),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    // check funds (planterFund && DaiFunds)

    let amount = Number(web3.utils.toWei("49"));

    let expected = {
      planterFund: (40 * amount) / 100,
      referralFund: (12 * amount) / 100,
      treeResearch: (12 * amount) / 100,
      localDevelop: (12 * amount) / 100,
      rescueFund: (12 * amount) / 100,
      treejerDevelop: (12 * amount) / 100,
      reserveFund1: (0 * amount) / 100,
      reserveFund2: (0 * amount) / 100,
    };

    //check wethFund totalFunds treeId2
    let totalFunds2 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(totalFunds2.treeResearch),
      expected.treeResearch,
      "2-treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop),
      expected.localDevelop,
      "2-localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund),
      expected.rescueFund,
      "2-rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop),
      expected.treejerDevelop,
      "2-treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund1),
      expected.reserveFund1,
      "2-reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund2),
      expected.reserveFund2,
      "2-reserveFund2 funds invalid"
    );

    ////--------------------------check fund planter

    let planterTotalFund = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(planterTotalFund.planterFund),
      Number(expected.planterFund),
      "2-totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(planterTotalFund.referralFund),
      Number(expected.referralFund),
      "2-totalFund referralFund funds invalid"
    );

    for (let i = 10001; i < 10008; i++) {
      let planterFunds2 = await planterFundsInstnce.planterFunds.call(i);
      let referralFunds2 = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFunds2),
        Number(web3.utils.toWei("2.8")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFunds2),
        Number(web3.utils.toWei(".84")),
        "2-referralFund funds invalid"
      );
    }
  });

  it("2.should request trees successfully", async () => {
    let funder = userAccount3;

    //mint dai for funder
    await daiInstance.setMint(funder, web3.utils.toWei("56"));

    ////////////// ------------------- handle fund distribution model ----------------------

    await fModel.addFundDistributionModel(
      2500,
      1500,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10007, 0, {
      from: deployerAccount,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    ///////////////////////--------------------- requestTrees --------------------------

    let funderBalanceBefore = await daiInstance.balanceOf(funder);

    assert.equal(
      Number(funderBalanceBefore),
      web3.utils.toWei("56"),
      "1-funder balance not true"
    );

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("56"),
      {
        from: funder,
      }
    );

    let requestTx = await regularSellInstance.requestTrees(
      7,
      web3.utils.toWei("56"),
      {
        from: funder,
      }
    );

    truffleAssert.eventEmitted(requestTx, "RegularTreeRequsted", (ev) => {
      return (
        Number(ev.count) == 7 &&
        ev.buyer == funder &&
        Number(ev.amount) == Math.mul(web3.utils.toWei("8"), 7)
      );
    });

    const daiFundsBalanceAfter = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter),
      Number(web3.utils.toWei("33.6")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter),
      Number(web3.utils.toWei("22.4")),
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter),
      0,
      "regularSell balance not true"
    );

    let tokentOwner;
    for (let i = 10001; i < 10008; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(10001);
      assert.equal(tokentOwner, funder, "funder not true " + i);
    }

    await treeTokenInstance.ownerOf(10000).should.be.rejected;
    await treeTokenInstance.ownerOf(10008).should.be.rejected;

    let lastSoldRegularTree = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree),
      10007,
      "lastSoldRegularTree not true"
    );

    let funderBalanceAfter = await daiInstance.balanceOf(funder);

    assert.equal(
      Number(funderBalanceAfter),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    // check funds (planterFund && DaiFunds)

    let amount = Number(web3.utils.toWei("56"));

    let expected = {
      planterFund: (25 * amount) / 100,
      referralFund: (15 * amount) / 100,
      treeResearch: (12 * amount) / 100,
      localDevelop: (12 * amount) / 100,
      rescueFund: (12 * amount) / 100,
      treejerDevelop: (12 * amount) / 100,
      reserveFund1: (12 * amount) / 100,
      reserveFund2: (0 * amount) / 100,
    };

    //check wethFund totalFunds treeId2
    let totalFunds2 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(totalFunds2.treeResearch),
      expected.treeResearch,
      "2-treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop),
      expected.localDevelop,
      "2-localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund),
      expected.rescueFund,
      "2-rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop),
      expected.treejerDevelop,
      "2-treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund1),
      expected.reserveFund1,
      "2-reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.reserveFund2),
      expected.reserveFund2,
      "2-reserveFund2 funds invalid"
    );

    ////--------------------------check fund planter

    let planterTotalFund = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(planterTotalFund.planterFund),
      Number(expected.planterFund),
      "2-totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(planterTotalFund.referralFund),
      Number(expected.referralFund),
      "2-totalFund referralFund funds invalid"
    );

    for (let i = 10001; i < 10008; i++) {
      let planterFunds2 = await planterFundsInstnce.planterFunds.call(i);
      let referralFunds2 = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFunds2),
        Number(web3.utils.toWei("2")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFunds2),
        Number(web3.utils.toWei("1.2")),
        "2-referralFund funds invalid"
      );
    }
  });

  it("3.should request trees successfully", async () => {
    let funder1 = userAccount3;
    let funder2 = userAccount3;
    let funder3 = userAccount3;

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: deployerAccount,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    ///////////////////////--------------------- requestTrees --------------------------

    //mint dai for funder
    await daiInstance.setMint(funder1, web3.utils.toWei("7"));

    let funder1BalanceBefore = await daiInstance.balanceOf(funder1);

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: funder1,
      }
    );

    assert.equal(
      Number(funder1BalanceBefore),
      web3.utils.toWei("7"),
      "1-funder balance not true"
    );

    let requestTx1 = await regularSellInstance.requestTrees(
      1,
      web3.utils.toWei("7"),
      {
        from: funder1,
      }
    );

    truffleAssert.eventEmitted(requestTx1, "RegularTreeRequsted", (ev) => {
      return (
        Number(ev.count) == 1 &&
        ev.buyer == funder1 &&
        Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
      );
    });

    let funder1BalanceAfter = await daiInstance.balanceOf(funder1);

    assert.equal(
      Number(funder1BalanceAfter),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    const daiFundsBalanceAfter1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter1 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter1 = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter1),
      Number(web3.utils.toWei("3.36")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter1),
      Number(web3.utils.toWei("3.64")),
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter1),
      0,
      "regularSell balance not true"
    );

    let tokentOwner;

    tokentOwner = await treeTokenInstance.ownerOf(10001);
    assert.equal(tokentOwner, funder1, "funder1 not true " + 10001);

    let lastSoldRegularTree = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree),
      10001,
      "lastSoldRegularTree not true"
    );

    ///------------- funder2 -----------------

    //mint dai for funder
    await daiInstance.setMint(funder2, web3.utils.toWei("7"));

    let funder2BalanceBefore = await daiInstance.balanceOf(funder2);

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: funder2,
      }
    );

    assert.equal(
      Number(funder2BalanceBefore),
      web3.utils.toWei("7"),
      "3-funder balance not true"
    );

    let requestTx2 = await regularSellInstance.requestTrees(
      1,
      web3.utils.toWei("7"),
      {
        from: funder2,
      }
    );

    truffleAssert.eventEmitted(requestTx2, "RegularTreeRequsted", (ev) => {
      return (
        Number(ev.count) == 1 &&
        ev.buyer == funder2 &&
        Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
      );
    });

    let funder2BalanceAfter = await daiInstance.balanceOf(funder2);

    assert.equal(
      Number(funder2BalanceAfter),
      web3.utils.toWei("0"),
      "4-funder balance not true"
    );

    const daiFundsBalanceAfter2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter2 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter2 = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter2),
      Number(web3.utils.toWei("6.72")),
      "2-daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter2),
      Number(web3.utils.toWei("7.28")),
      "2-planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter2),
      0,
      "2-regularSell balance not true"
    );

    tokentOwner = await treeTokenInstance.ownerOf(10002);
    assert.equal(tokentOwner, funder2, "funder2 not true " + 10002);

    lastSoldRegularTree = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree),
      10002,
      "2.lastSoldRegularTree not true"
    );

    ///------------- funder3 -----------------

    //mint dai for funder
    await daiInstance.setMint(funder3, web3.utils.toWei("7"));

    let funder3BalanceBefore = await daiInstance.balanceOf(funder3);

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: funder3,
      }
    );

    assert.equal(
      Number(funder3BalanceBefore),
      web3.utils.toWei("7"),
      "3-funder balance not true"
    );

    let requestTx = await regularSellInstance.requestTrees(
      1,
      web3.utils.toWei("7"),
      {
        from: funder3,
      }
    );

    truffleAssert.eventEmitted(requestTx, "RegularTreeRequsted", (ev) => {
      return (
        Number(ev.count) == 1 &&
        ev.buyer == funder3 &&
        Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
      );
    });

    const txFee = await Common.getTransactionFee(requestTx);

    console.log("2.test fee", web3.utils.fromWei(txFee.toString()));

    let funder3BalanceAfter = await daiInstance.balanceOf(funder3);

    assert.equal(
      Number(funder3BalanceAfter),
      web3.utils.toWei("0"),
      "3-funder balance not true"
    );

    const daiFundsBalanceAfter3 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter3 = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter3 = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter3),
      Number(web3.utils.toWei("10.08")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter3),
      Number(web3.utils.toWei("10.92")),
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter3),
      0,
      "regularSell balance not true"
    );

    tokentOwner = await treeTokenInstance.ownerOf(10003);
    assert.equal(tokentOwner, funder3, "funder3 not true " + 10003);

    lastSoldRegularTree = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree),
      10003,
      "3.lastSoldRegularTree not true"
    );
  });

  it("Should request trees rejecet(The count must be greater than zero)", async () => {
    let funder = userAccount3;

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: deployerAccount,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    ///////////////////////--------------------- requestTrees --------------------------

    //mint dai for funder
    await daiInstance.setMint(funder, web3.utils.toWei("7"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: funder,
      }
    );

    await regularSellInstance
      .requestTrees(0, web3.utils.toWei("7"), {
        from: funder,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_COUNT);
  });

  it("Should request trees rejece(The value we sent to the counter is incorrect)", async () => {
    let funder = userAccount3;

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: deployerAccount,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    ///////////////////////--------------------- requestTrees --------------------------

    //mint dai for funder
    await daiInstance.setMint(funder, web3.utils.toWei("14"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("14"),
      {
        from: funder,
      }
    );

    await regularSellInstance
      .requestTrees(3, web3.utils.toWei("14"), {
        from: funder,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    ///----------------test2

    //mint dai for funder
    await daiInstance.setMint(userAccount4, web3.utils.toWei("32"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("32"),
      {
        from: userAccount4,
      }
    );

    await regularSellInstance
      .requestTrees(3, web3.utils.toWei("14"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);
  });

  ////////////////////// ------------------------------------------- request tree by id ---------------------------------------------------
  it("should request tree by id successfully", async () => {
    const treePrice = Units.convert("7", "eth", "wei");
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(1, 100000, 0, {
      from: deployerAccount,
    });

    ///////////////////// ------------------------- handle tree price ------------------------

    let tx = await regularSellInstance.setPrice(treePrice, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == Number(treePrice);
    });
    /////////////////////////-------------------- deploy contracts --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    //////////////////-------------------------- plant regualar -----------------

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    ///////////////////////////////////////////

    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("14"));

    let funder1BalanceBefore = await daiInstance.balanceOf(userAccount1);

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: userAccount1,
      }
    );

    assert.equal(
      Number(funder1BalanceBefore),
      web3.utils.toWei("14"),
      "1-funder balance not true"
    );

    let requestTx = await regularSellInstance.requestByTreeId(
      10001,
      web3.utils.toWei("7"),
      {
        from: userAccount1,
      }
    );

    let funder1BalanceAfter = await daiInstance.balanceOf(userAccount1);

    assert.equal(
      Number(funder1BalanceAfter),
      web3.utils.toWei("7"),
      "2-funder balance not true"
    );

    truffleAssert.eventEmitted(requestTx, "RegularTreeRequstedById", (ev) => {
      return (
        Number(ev.treeId) == 10001 &&
        ev.buyer == userAccount1 &&
        Number(ev.amount) == Number(web3.utils.toWei("7"))
      );
    });
  });

  it("should check data to be ok after request tree", async () => {
    const treePrice = Units.convert("7", "eth", "wei");
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";
    const treeId = 10001;

    ////////////// ------------------- handle fund distribution model ----------------------

    await fModel.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      1200,
      500,
      500,
      {
        from: deployerAccount,
      }
    );

    const transferTreePrice = Units.convert("10", "eth", "wei");
    let expected = {
      planterFund: Math.divide(Math.mul(30, transferTreePrice), 100),
      referralFund: Math.divide(Math.mul(12, transferTreePrice), 100),
      treeResearch: Math.divide(Math.mul(12, transferTreePrice), 100),
      localDevelop: Math.divide(Math.mul(12, transferTreePrice), 100),
      rescueFund: Math.divide(Math.mul(12, transferTreePrice), 100),
      treejerDevelop: Math.divide(Math.mul(12, transferTreePrice), 100),
      reserveFund1: Math.divide(Math.mul(5, transferTreePrice), 100),
      reserveFund2: Math.divide(Math.mul(5, transferTreePrice), 100),
    };

    await fModel.assignTreeFundDistributionModel(1, 100000, 0, {
      from: deployerAccount,
    });

    ///////////////////// ------------------------- handle tree price ------------------------

    let tx = await regularSellInstance.setPrice(treePrice, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == Number(treePrice);
    });

    ////////////// ---------------- handle deploy --------------------------

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ///////////////////// ------------------- handle addresses here --------------------------

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------daiFundsInstance

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    //-------------treeFactoryInstance

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    ///////////////////////// -------------------- handle roles here ----------------

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addFundsRole(arInstance, DaiFunds.address, deployerAccount);

    //////////////////-------------------------- plant regualar -----------------

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    ///////////////////////////////////////////

    /////////////--------------------- check total fund before request

    const totalFundsBefore = await daiFundsInstance.totalFunds();
    const totalPlanterFundsBefore = await planterFundsInstnce.totalFunds();

    assert.equal(
      Number(totalPlanterFundsBefore.planterFund),
      0,
      "invalid planter fund"
    );

    assert.equal(
      Number(totalPlanterFundsBefore.referralFund),
      0,
      "invalid refferal fund"
    );

    assert.equal(
      Number(totalFundsBefore.treeResearch),
      0,
      "invalid tree research fund"
    );

    assert.equal(
      Number(totalFundsBefore.localDevelop),
      0,
      "invalid local develop fund"
    );
    assert.equal(Number(totalFundsBefore.rescueFund), 0, "invalid rescue fund");

    assert.equal(
      Number(totalFundsBefore.treejerDevelop),
      0,
      "invalid treejer develop fund"
    );

    assert.equal(
      Number(totalFundsBefore.reserveFund1),
      0,
      "invalid other fund1"
    );

    assert.equal(
      Number(totalFundsBefore.reserveFund2),
      0,
      "invalid other fund2"
    );

    ////////////////// ---------------- check tree before -----------------------

    const treeBefore = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(Number(treeBefore.treeStatus), 4, "invalid tree status");

    assert.equal(
      Number(treeBefore.provideStatus),
      4,
      "invalid tree provide status"
    );

    ///////////////////////////---------------------- check treasury and regular sell balance after request

    const daiFundsBalanceBefore = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceBefore = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceBefore = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(Number(daiFundsBalanceBefore), 0, "daiFunds balance not true");

    assert.equal(
      Number(planterFundsBalanceBefore),
      0,
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceBefore),
      0,
      "regularSell balance not true"
    );

    ///////////////// ----------------- request tree -------------------------------------------

    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("40"));

    let funderBalanceBefore = await daiInstance.balanceOf(userAccount1);

    assert.equal(
      Number(funderBalanceBefore),
      web3.utils.toWei("40"),
      "1-funder balance not true"
    );

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("10"),
      {
        from: userAccount1,
      }
    );

    const requestTx = await regularSellInstance.requestByTreeId(
      treeId,
      web3.utils.toWei("10"),
      {
        from: userAccount1,
      }
    );

    truffleAssert.eventEmitted(requestTx, "RegularTreeRequstedById", (ev) => {
      return (
        Number(ev.treeId) == treeId &&
        ev.buyer == userAccount1 &&
        Number(ev.amount) == Number(web3.utils.toWei("10"))
      );
    });

    ///////////////------------------ check user balace to be correct ---------------------

    let funderBalanceAfter = await daiInstance.balanceOf(userAccount1);

    assert.equal(
      Number(funderBalanceAfter),
      web3.utils.toWei("30"),
      "2-funder balance not true"
    );

    ///////////////////////////---------------------- check treasury and regular sell balance after request

    const daiFundsBalanceAfter = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const planterFundsBalanceAfter = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    const regularSellBalanceAfter = await daiInstance.balanceOf(
      regularSellInstance.address
    );

    assert.equal(
      Number(daiFundsBalanceAfter),
      Number(web3.utils.toWei("5.8")),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter),
      Number(web3.utils.toWei("4.2")),
      "planterFunds balance not true"
    );

    assert.equal(
      Number(regularSellBalanceAfter),
      0,
      "regularSell balance not true"
    );

    ////////////////////// ----------------------- check token owner before

    const tokentOwnerAfter = await treeTokenInstance.ownerOf(treeId);

    assert.equal(tokentOwnerAfter, userAccount1, "invalid token owner");

    ////////////////// ---------------- check tree after request-----------------------

    const treeAfter = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(Number(treeAfter.treeStatus), 4, "invalid tree status");

    assert.equal(
      Number(treeAfter.provideStatus),
      0,
      "invalid tree provide status"
    );

    ////////////////// ---------------------- check total fund after request

    const totalFundsAfter = await daiFundsInstance.totalFunds();

    const totalPlanterFundsAfter = await planterFundsInstnce.totalFunds();

    assert.equal(
      Number(totalPlanterFundsAfter.planterFund),
      expected.planterFund,
      "invalid planter fund"
    );

    assert.equal(
      Number(totalPlanterFundsAfter.referralFund),
      expected.referralFund,
      "invalid refferal fund"
    );

    assert.equal(
      Number(totalFundsAfter.treeResearch),
      expected.treeResearch,
      "invalid tree research fund"
    );

    assert.equal(
      Number(totalFundsAfter.localDevelop),
      expected.localDevelop,
      "invalid local develop fund"
    );

    assert.equal(
      Number(totalFundsAfter.rescueFund),
      expected.rescueFund,
      "invalid rescue fund"
    );

    assert.equal(
      Number(totalFundsAfter.treejerDevelop),
      expected.treejerDevelop,
      "invalid treejer develop fund"
    );

    assert.equal(
      Number(totalFundsAfter.reserveFund1),
      expected.reserveFund1,
      "invalid other fund1"
    );

    assert.equal(
      Number(totalFundsAfter.reserveFund2),
      expected.reserveFund2,
      "invalid other fund2"
    );
  });

  it("should be reject request by tree id", async () => {
    const price = Units.convert("7", "eth", "wei");
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";
    const treeId = 10001;

    let tx = await regularSellInstance.setPrice(price, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == Number(price);
    });

    /////////////// ---------------- fail beacuuse of invalid tree id

    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("14"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("14"),
      {
        from: userAccount1,
      }
    );

    await regularSellInstance
      .requestByTreeId(2, web3.utils.toWei("14"), { from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_TREE);

    /////////////////// ------------------ fail because of invalid amount -----------------

    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("5"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("5"),
      {
        from: userAccount1,
      }
    );

    await regularSellInstance
      .requestByTreeId(treeId, web3.utils.toWei("5"), {
        from: userAccount1,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    ////--------------test2
    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("10"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("10"),
      {
        from: userAccount1,
      }
    );

    await regularSellInstance
      .requestByTreeId(treeId, web3.utils.toWei("3"), {
        from: userAccount1,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    ////////////////////////// ----------------- fail because treeFactory address not set

    await regularSellInstance.requestByTreeId(treeId, web3.utils.toWei("7"), {
      from: userAccount1,
    }).should.be.rejected;

    //////////////////------------- set tree factory address

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    ///////////////////////// ------------------ fail because caller is not Regular sell in TreeFactory

    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("10"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("10"),
      {
        from: userAccount1,
      }
    );

    await regularSellInstance.requestByTreeId(treeId, web3.utils.toWei("7"), {
      from: userAccount1,
    }).should.be.rejected;

    ///////////////------------------ add regular sell Role

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    ////////////////// ----------------- fail because tree is not planted -------------------

    await regularSellInstance.requestByTreeId(treeId, web3.utils.toWei("7"), {
      from: userAccount1,
    }).should.be.rejected;

    // ///////////////// -----------------------  plant regualar tree

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    ///////////////////////// ---------------- end plant regular tree-------------------------

    //////////--------------------------- fail because daiFunds address not set

    await regularSellInstance.requestByTreeId(treeId, web3.utils.toWei("7"), {
      from: userAccount1,
    }).should.be.rejected;

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.requestByTreeId(treeId, web3.utils.toWei("7"), {
      from: userAccount1,
    }).should.be.rejected;

    ////////////// ------------------- handle fund distribution model ----------------------

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

    await fModel.assignTreeFundDistributionModel(1, 100000, 0, {
      from: deployerAccount,
    });
  });
});
