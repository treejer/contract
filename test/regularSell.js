const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSell = artifacts.require("RegularSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Tree = artifacts.require("Tree.sol");
const Planter = artifacts.require("Planter.sol");
const WethFunds = artifacts.require("WethFunds.sol");

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

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

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
  let wethFundsInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7]; //not data manager or treejerContract
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount8,
      deployerAccount
    );
  });

  beforeEach(async () => {
    const treePrice = Units.convert("7", "eth", "wei"); // 7 dai

    regularSellInstance = await RegularSell.new({
      from: deployerAccount,
    });

    await regularSellInstance.initialize(arInstance.address, treePrice, {
      from: deployerAccount,
    });

    treeFactoryInstance = await TreeFactory.new({
      from: deployerAccount,
    });

    await treeFactoryInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    treeTokenInstance = await Tree.new({
      from: deployerAccount,
    });

    await treeTokenInstance.initialize(arInstance.address, "", {
      from: deployerAccount,
    });

    daiFundsInstance = await DaiFunds.new({
      from: deployerAccount,
    });

    await daiFundsInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    fModel = await FinancialModel.new({
      from: deployerAccount,
    });

    await fModel.initialize(arInstance.address, {
      from: deployerAccount,
    });

    planterFundsInstnce = await PlanterFund.new({
      from: deployerAccount,
    });

    await planterFundsInstnce.initialize(arInstance.address, {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});
  /*
  ////////////////--------------------------------------------gsn------------------------------------------------
  it("test gsn [ @skip-on-coverage ]", async () => {
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10007, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ///////------------------------------handle gsn---------------------------------

    let env = await GsnTestEnvironment.startGsn("localhost");

    const { forwarderAddress, relayHubAddress } = env.contractsDeployment;

    await regularSellInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setRelayHub(relayHubAddress);
    await paymaster.setTrustedForwarder(forwarderAddress);

    web3.eth.sendTransaction({
      from: accounts[0],
      to: paymaster.address,
      value: web3.utils.toWei("1"),
    });

    origProvider = web3.currentProvider;

    conf = { paymasterAddress: paymaster.address };

    gsnProvider = await Gsn.RelayProvider.newProvider({
      provider: origProvider,
      config: conf,
    }).init();

    provider = new ethers.providers.Web3Provider(gsnProvider);

    let signerFunder = provider.getSigner(3);

    let contractFunder = await new ethers.Contract(
      regularSellInstance.address,
      regularSellInstance.abi,
      signerFunder
    );

    //mint dai for funder
    await daiInstance.setMint(userAccount2, web3.utils.toWei("7"));

    await daiInstance.balanceOf(userAccount2);

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("7"),
      {
        from: userAccount2,
      }
    );

    let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

    await paymaster.addPlanterWhitelistTarget(regularSellInstance.address, {
      from: deployerAccount,
    });

    await contractFunder
      .requestTrees(1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_PLANTER);

    await paymaster.removePlanterWhitelistTarget(regularSellInstance.address, {
      from: deployerAccount,
    });
    await paymaster.addFunderWhitelistTarget(regularSellInstance.address, {
      from: deployerAccount,
    });

    await contractFunder.requestTrees(1, {
      from: userAccount2,
    });

    let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

    console.log("balanceAccountBefore", Number(balanceAccountBefore));
    console.log("balanceAccountAfter", Number(balanceAccountAfter));

    assert.equal(
      balanceAccountAfter,
      balanceAccountBefore,
      "Gsn not true work"
    );
  });

  //////////////////************************************ deploy successfully ***************************************
  it("deploys successfully", async () => {
    const address = regularSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  ///////////////---------------------------------set trust forwarder address--------------------------------------------------------
  it("set trust forwarder address", async () => {
    await regularSellInstance
      .setTrustedForwarder(userAccount2, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance
      .setTrustedForwarder(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await regularSellInstance.setTrustedForwarder(userAccount2, {
      from: deployerAccount,
    });

    assert.equal(
      userAccount2,
      await regularSellInstance.trustedForwarder(),
      "address set incorect"
    );
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
      await regularSellInstance.treeFactory(),
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
      await regularSellInstance.daiFunds(),
      "dai funds address set incorect"
    );
  });

  /////////////////---------------------------------set dai token address--------------------------------------------------------
  it("Set dai token address", async () => {
    await regularSellInstance
      .setDaiTokenAddress(daiInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance
      .setDaiTokenAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      daiInstance.address,
      await regularSellInstance.daiToken(),
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
      await regularSellInstance.financialModel(),
      "financial model address set incorect"
    );
  });

  ///////////////---------------------------------set weth funds address--------------------------------------------------------
  it("set weth funds address", async () => {
    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await regularSellInstance
      .setWethFundsAddress(wethFundsInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      wethFundsInstance.address,
      await regularSellInstance.wethFunds(),
      "address set incorect"
    );
  });


  /////////////////---------------------------------set lastSoldRegularTree address--------------------------------------------------------
  it("set lastSoldRegularTree address", async () => {
    Common.addDataManager(arInstance, userAccount1, deployerAccount);

    await regularSellInstance
      .setLastSoldRegularTree(500, {
        from: userAccount1,
      })
      .should.be.rejectedWith(
        RegularSellErrors.INVALID_SET_LAST_REGULAR_TREE_SELL_INPUT
      );

    await regularSellInstance
      .setLastSoldRegularTree(15000, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    let tx = await regularSellInstance.setLastSoldRegularTree(15000, {
      from: userAccount1,
    });

    truffleAssert.eventEmitted(tx, "LastSoldRegularTreeUpdated", (ev) => {
      return Number(ev.lastSoldRegularTree) == 15000;
    });

    let lastRegularSellTreeAfter =
      await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastRegularSellTreeAfter),
      15000,
      "lastRegularSellTreeAfter not true"
    );

    await regularSellInstance
      .setLastSoldRegularTree(15000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(
        RegularSellErrors.INVALID_SET_LAST_REGULAR_TREE_SELL_INPUT
      );

    let tx2 = await regularSellInstance.setLastSoldRegularTree(15001, {
      from: userAccount1,
    });

    truffleAssert.eventEmitted(tx2, "LastSoldRegularTreeUpdated", (ev) => {
      return Number(ev.lastSoldRegularTree) == 15001;
    });

    let lastRegularSellTreeAfter2 =
      await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastRegularSellTreeAfter2),
      15001,
      "2-lastRegularSellTreeAfter not true"
    );
  });

  it("Should lastSoldRegularTree work successfully", async () => {
    let funder = userAccount3;

    //mint dai for funder
    await daiInstance.setMint(funder, web3.utils.toWei("10000"));

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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(1, 1000000, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ///////////////////////--------------------- requestTrees --------------------------

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("10000"),
      {
        from: funder,
      }
    );

    await regularSellInstance.requestTrees(7, {
      from: funder,
    });

    let tokentOwner;
    for (let i = 10001; i < 10008; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(i);
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

    Common.addDataManager(arInstance, userAccount1, deployerAccount);

    let tx = await regularSellInstance.setLastSoldRegularTree(13333, {
      from: userAccount1,
    });

    truffleAssert.eventEmitted(tx, "LastSoldRegularTreeUpdated", (ev) => {
      return Number(ev.lastSoldRegularTree) == 13333;
    });

    await regularSellInstance.requestTrees(7, {
      from: funder,
    });

    for (let i = 13334; i < 13340; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner, funder, "funder not true " + i);
    }

    await treeTokenInstance.ownerOf(13333).should.be.rejected;
    await treeTokenInstance.ownerOf(13341).should.be.rejected;

    let lastSoldRegularTree2 = await regularSellInstance.lastSoldRegularTree();

    assert.equal(
      Number(lastSoldRegularTree2),
      13340,
      "lastSoldRegularTree not true"
    );

    await daiInstance.resetAcc(funder);
  });

  /////////////////------------------------------------- set price ------------------------------------------
  it("set price and check data", async () => {
    let treePrice1 = await regularSellInstance.treePrice.call();

    assert.equal(
      Number(treePrice1),
      Number(web3.utils.toWei("7")),
      "treePriceInvalid"
    );

    let tx = await regularSellInstance.setPrice(100, { from: dataManager });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == 100;
    });

    const treePrice2 = await regularSellInstance.treePrice.call();

    assert.equal(Number(treePrice2), 100, "tree price is incorrect");
  });

  it("should fail set price", async () => {
    await regularSellInstance
      .setPrice(10, { from: userAccount6 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10007, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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

    let requestTx = await regularSellInstance.requestTrees(7, {
      from: funder,
    });

    for (let i = 10001; i <= 10007; i++) {
      truffleAssert.eventEmitted(requestTx, "RegularMint", (ev) => {
        return ev.buyer == funder && ev.treeId == i;
      });
    }

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
      tokentOwner = await treeTokenInstance.ownerOf(i);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10007, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ///////////////////////--------------------- requestTrees --------------------------

    await regularSellInstance.setPrice(web3.utils.toWei("8"), {
      from: dataManager,
    });

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

    let requestTx = await regularSellInstance.requestTrees(7, {
      from: funder,
    });

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
      tokentOwner = await treeTokenInstance.ownerOf(i);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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

    let requestTx1 = await regularSellInstance.requestTrees(1, {
      from: funder1,
    });

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

    let requestTx2 = await regularSellInstance.requestTrees(1, {
      from: funder2,
    });

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

    let requestTx = await regularSellInstance.requestTrees(1, {
      from: funder3,
    });

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
    await daiInstance.resetAcc(funder1);
    await daiInstance.resetAcc(funder2);
    await daiInstance.resetAcc(funder3);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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
      .requestTrees(0, {
        from: funder,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_COUNT);

    await daiInstance.resetAcc(funder);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(10001, 10003, 0, {
      from: dataManager,
    });

    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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
      .requestTrees(3, {
        from: funder,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    ///----------------test2

    //mint dai for funder
    await daiInstance.setMint(userAccount4, web3.utils.toWei("32"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("14"),
      {
        from: userAccount4,
      }
    );

    await regularSellInstance
      .requestTrees(3, {
        from: userAccount4,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_APPROVE);

    await daiInstance.resetAcc(funder);
    await daiInstance.resetAcc(userAccount4);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(1, 100000, 0, {
      from: dataManager,
    });

    ///////////////////// ------------------------- handle tree price ------------------------

    let tx = await regularSellInstance.setPrice(treePrice, {
      from: dataManager,
    });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == Number(treePrice);
    });
    /////////////////////////-------------------- deploy contracts --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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
      from: dataManager,
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

    let requestTx = await regularSellInstance.requestByTreeId(10001, {
      from: userAccount1,
    });

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

    await daiInstance.resetAcc(userAccount1);
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
        from: dataManager,
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
      from: dataManager,
    });

    ///////////////////// ------------------------- handle tree price ------------------------

    let tx = await regularSellInstance.setPrice(treePrice, {
      from: dataManager,
    });

    truffleAssert.eventEmitted(tx, "TreePriceUpdated", (ev) => {
      return Number(ev.price) == Number(treePrice);
    });

    ////////////// ---------------- handle deploy --------------------------

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

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
      from: dataManager,
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

    await regularSellInstance.setPrice(web3.utils.toWei("10"), {
      from: dataManager,
    });

    ///////////////////// ------------------------- handle tree price ------------------------

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

    const requestTx = await regularSellInstance.requestByTreeId(treeId, {
      from: userAccount1,
    });

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

    await daiInstance.resetAcc(userAccount1);
  });

  it("should be reject request by tree id", async () => {
    const price = Units.convert("7", "eth", "wei");
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";
    const treeId = 10001;

    let tx = await regularSellInstance.setPrice(price, {
      from: dataManager,
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
      .requestByTreeId(2, { from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_TREE);

    /////////////////// ------------------ fail because of invalid amount -----------------

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

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
      .requestByTreeId(treeId, {
        from: userAccount1,
      })
      .should.be.rejectedWith(RegularSellErrors.ZERO_ADDRESS);

    ////--------------test2
    //mint dai for funder
    await daiInstance.setMint(userAccount1, web3.utils.toWei("10"));

    await daiInstance.approve(
      regularSellInstance.address,
      web3.utils.toWei("2"),
      {
        from: userAccount1,
      }
    );

    await regularSellInstance
      .requestByTreeId(treeId, {
        from: userAccount1,
      })
      .should.be.rejectedWith(RegularSellErrors.ZERO_ADDRESS);

    ////////////////////////// ----------------- fail because treeFactory address not set

    await regularSellInstance.requestByTreeId(treeId, {
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

    await regularSellInstance.requestByTreeId(treeId, {
      from: userAccount1,
    }).should.be.rejected;

    ///////////////------------------ add regular sell Role

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    ////////////////// ----------------- fail because tree is not planted -------------------

    await regularSellInstance.requestByTreeId(treeId, {
      from: userAccount1,
    }).should.be.rejected;

    // ///////////////// -----------------------  plant regualar tree

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    let planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
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
      from: dataManager,
    });

    ///////////////////////// ---------------- end plant regular tree-------------------------

    //////////--------------------------- fail because daiFunds address not set

    await regularSellInstance.requestByTreeId(treeId, {
      from: userAccount1,
    }).should.be.rejected;

    await regularSellInstance.setDaiFundsAddress(daiFundsInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.requestByTreeId(treeId, {
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(1, 100000, 0, {
      from: dataManager,
    });

    await daiInstance.resetAcc(userAccount1);
  });
  */
  /*
  it("should mint referral tree", async () => {
    // await Common.addTreejerContractRole(
    //   arInstance,
    //   userAccount8,
    //   deployerAccount
    // );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      planterFundsInstnce.address,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      { from: deployerAccount }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");
    const treeCount = 3;

    await regularSellInstance.mintReferralTree(
      treeCount,
      userAccount7,
      planterShare,
      referralShare,
      { from: userAccount8 }
    );

    let tokentOwner;
    for (let i = 10001; i < 10004; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner, userAccount7, "funder not true " + i);
    }
    let lastTreeSold = await regularSellInstance.lastSoldRegularTree.call();
    assert.equal(lastTreeSold, 10003, "last sold is not correct");
    let planterFund;
    let referralFund;
    for (let i = 10001; i < 10004; i++) {
      planterFund = await planterFundsInstnce.planterFunds.call(i);
      referralFund = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFund),
        Number(web3.utils.toWei("2")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFund),
        Number(web3.utils.toWei("1")),
        "2-referralFund funds invalid"
      );
    }

    let totalFunds = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds.planterFund),
      Math.mul(treeCount, Number(planterShare))
    );

    assert.equal(
      Number(totalFunds.referralFund),
      Math.mul(treeCount, Number(referralShare))
    );
  });
****
  it("should mint referral tree2", async () => {
    await treeFactoryInstance.addTree(10002, "", { from: dataManager });
    await treeFactoryInstance.addTree(10004, "", { from: dataManager });

    // await Common.addTreejerContractRole(
    //   arInstance,
    //   userAccount8,
    //   deployerAccount
    // );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      planterFundsInstnce.address,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");
    const treeCount = 4;

    await regularSellInstance.mintReferralTree(
      treeCount,
      userAccount7,
      planterShare,
      referralShare,
      { from: userAccount8 }
    );

    let tokentOwner;
    for (let i = 10001; i < 10006; i++) {
      if ([10002, 10004].includes(i)) continue;

      tokentOwner = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner, userAccount7, "funder not true " + i);
    }
    let lastTreeSold = await regularSellInstance.lastSoldRegularTree.call();
    assert.equal(lastTreeSold, 10006, "last sold is not correct");
    let planterFund;
    let referralFund;
    for (let i = 10001; i < 10006; i++) {
      if ([10002, 10004].includes(i)) continue;

      planterFund = await planterFundsInstnce.planterFunds.call(i);
      referralFund = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFund),
        Number(web3.utils.toWei("2")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFund),
        Number(web3.utils.toWei("1")),
        "2-referralFund funds invalid"
      );
    }

    let totalFunds = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds.planterFund),
      Math.mul(treeCount, Number(planterShare))
    );

    assert.equal(
      Number(totalFunds.referralFund),
      Math.mul(treeCount, Number(referralShare))
    );
  });
  it("should fail mint referral tree invalid count", async () => {
    // await Common.addTreejerContractRole(
    //   arInstance,
    //   userAccount8,
    //   deployerAccount
    // );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      planterFundsInstnce.address,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");
    const treeCount = 0;

    await regularSellInstance
      .mintReferralTree(treeCount, userAccount7, planterShare, referralShare, {
        from: userAccount8,
      })
      .should.be.rejectedWith(RegularSellErrors.INVALID_COUNT);
  });
  it("should fail mint referral tree not treejer contract", async () => {
    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");
    const treeCount = 2;

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance
      .mintReferralTree(treeCount, userAccount7, planterShare, referralShare, {
        from: userAccount8,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    // await Common.addTreejerContractRole(
    //   arInstance,
    //   userAccount8,
    //   deployerAccount
    // );
    await regularSellInstance
      .mintReferralTree(treeCount, userAccount7, planterShare, referralShare, {
        from: userAccount8,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await regularSellInstance
      .mintReferralTree(treeCount, userAccount7, planterShare, referralShare, {
        from: userAccount8,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await regularSellInstance.mintReferralTree(
      treeCount,
      userAccount7,
      planterShare,
      referralShare,
      {
        from: userAccount8,
      }
    );

    // await Common.addTreejerContractRole(
    //   arInstance,
    //   planterFundsInstnce.address,
    //   deployerAccount
    // );
  });
  */
  /*
  it("should updateReferrerGiftCount successfully", async () => {
    await Common.addTreejerContractRole(
      arInstance,
      userAccount8,
      deployerAccount
    );

    await regularSellInstance.updateReferrerGiftCount(userAccount1, 4, {
      from: userAccount8,
    });

    let user1GiftCount = await regularSellInstance.referrerGifts.call(
      userAccount1
    );

    assert.equal(Number(user1GiftCount), 4, "user1 gift count is not correct");

    await regularSellInstance.updateReferrerGiftCount(userAccount2, 10, {
      from: userAccount8,
    });

    let user2GiftCount = await regularSellInstance.referrerGifts.call(
      userAccount2
    );

    assert.equal(Number(user2GiftCount), 10, "user2 gift count is not correct");

    await regularSellInstance.updateReferrerGiftCount(userAccount1, 3, {
      from: userAccount8,
    });

    let user1GiftCount2 = await regularSellInstance.referrerGifts.call(
      userAccount1
    );

    assert.equal(Number(user1GiftCount2), 7, "user1 gift count is not correct");
  });

  it("should fail updateReferrerGiftCount", async () => {
    await regularSellInstance
      .updateReferrerGiftCount(userAccount1, 2, { from: userAccount6 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
  });
  /////////////////-------------------------------------- set price ------------------------------------------------

  it("should setRegularPlanterFund successfully and check data to be ok", async () => {
    const planterFund1 = Units.convert("0.5", "eth", "wei");
    const referralFund1 = Units.convert("0.1", "eth", "wei");

    await regularSellInstance.setRegularPlanterFund(
      planterFund1,
      referralFund1,
      {
        from: dataManager,
      }
    );

    const settedPlanterFund1 =
      await regularSellInstance.regularPlanterFund.call();
    const settedReferralFund1 =
      await regularSellInstance.regularReferralFund.call();

    assert.equal(
      Number(settedPlanterFund1),
      planterFund1,
      "planter fund is not correct"
    );

    assert.equal(
      Number(settedReferralFund1),
      referralFund1,
      "referral fund is not correct"
    );
    /////////////////////////////////////////////////////////////////////////

    const planterFund2 = Units.convert("0.5", "eth", "wei");
    const referralFund2 = Units.convert("0.1", "eth", "wei");

    await regularSellInstance.setRegularPlanterFund(
      planterFund2,
      referralFund2,
      {
        from: dataManager,
      }
    );

    const settedPlanterFund2 =
      await regularSellInstance.regularPlanterFund.call();
    const settedReferralFund2 =
      await regularSellInstance.regularReferralFund.call();

    assert.equal(
      Number(settedPlanterFund2),
      planterFund2,
      "planter fund is not correct"
    );

    assert.equal(
      Number(settedReferralFund2),
      referralFund2,
      "referral fund is not correct"
    );
  });

  it("should fail to setRegularPlanterFund", async () => {
    await regularSellInstance
      .setRegularPlanterFund(100, 200, { from: userAccount6 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });
  */

  it("should claim gifts less than 70 succuesfully", async () => {
    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");

    ///////////// deploy weth funds and set address
    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await regularSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });
    //////////////------------- setup

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setRegularPlanterFund(
      planterShare,
      referralShare,
      { from: dataManager }
    );

    /////////////// claim 25 tree with user1

    await regularSellInstance.updateReferrerGiftCount(userAccount1, 25, {
      from: userAccount8,
    });

    const user1GiftCountBeforeClaim =
      await regularSellInstance.referrerGifts.call(userAccount1);

    assert.equal(
      Number(user1GiftCountBeforeClaim),
      25,
      "user 1 gift before claim is not correct"
    );

    const totalDaiToPlanterSwap1 =
      await wethFundsInstance.totalDaiToPlanterSwap.call();

    assert.equal(
      Number(totalDaiToPlanterSwap1),
      0,
      "totalDaiToPlanterSwap1 is not correct"
    );

    await regularSellInstance.claimGifts({ from: userAccount1 });

    //should fail no gift to claim
    await regularSellInstance
      .claimGifts({ from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_GIFT_OWNER);

    const user1GiftCountAfterClaim =
      await regularSellInstance.referrerGifts.call(userAccount1);

    assert.equal(
      Number(user1GiftCountAfterClaim),
      0,
      "user 1 gift after claim is not correct"
    );

    const totalDaiToPlanterSwap2 =
      await wethFundsInstance.totalDaiToPlanterSwap.call();

    assert.equal(
      Number(totalDaiToPlanterSwap2),
      Math.mul(Math.add(Number(planterShare), Number(referralShare)), 25),
      "totalDaiToPlanterSwap1 is not correct"
    );

    let tokentOwner;

    for (let i = 10001; i < 10026; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner, userAccount1, "funder not true " + i);
    }

    let lastTreeSold = await regularSellInstance.lastSoldRegularTree.call();

    console.log("lastTreeSold.toString()", lastTreeSold.toString());

    assert.equal(lastTreeSold, 10025, "last sold is not correct");
    let planterFund;
    let referralFund;
    for (let i = 10001; i < 10026; i++) {
      planterFund = await planterFundsInstnce.planterFunds.call(i);
      referralFund = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFund),
        Number(web3.utils.toWei("2")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFund),
        Number(web3.utils.toWei("1")),
        "2-referralFund funds invalid"
      );
    }

    let totalFunds = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds.planterFund),
      Math.mul(25, Number(planterShare))
    );

    assert.equal(
      Number(totalFunds.referralFund),
      Math.mul(25, Number(referralShare))
    );

    /////////////// claim 10 tree with user2 (two tree is in use)
    await treeFactoryInstance.addTree(10028, "", { from: dataManager });
    await treeFactoryInstance.addTree(10030, "", { from: dataManager });

    await regularSellInstance.updateReferrerGiftCount(userAccount2, 10, {
      from: userAccount8,
    });

    const user2GiftCountBeforeClaim =
      await regularSellInstance.referrerGifts.call(userAccount2);

    assert.equal(
      Number(user2GiftCountBeforeClaim),
      10,
      "user 2 gift before claim is not correct"
    );

    await regularSellInstance.claimGifts({ from: userAccount2 });

    const user2GiftCountAfterClaim =
      await regularSellInstance.referrerGifts.call(userAccount2);

    assert.equal(
      Number(user2GiftCountAfterClaim),
      0,
      "user 1 gift after claim is not correct"
    );

    const totalDaiToPlanterSwap3 =
      await wethFundsInstance.totalDaiToPlanterSwap.call();

    assert.equal(
      Number(totalDaiToPlanterSwap3),
      Math.mul(Math.add(Number(planterShare), Number(referralShare)), 35),
      "totalDaiToPlanterSwap1 is not correct"
    );

    let tokentOwner2;

    for (let i = 10026; i < 10038; i++) {
      if ([10028, 10030].includes(i)) {
        await treeTokenInstance.ownerOf(i).should.be.rejected;
      } else {
        tokentOwner2 = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner2, userAccount2, "funder not true " + i);
      }
    }

    let lastTreeSold2 = await regularSellInstance.lastSoldRegularTree.call();

    assert.equal(lastTreeSold2, 10037, "last sold is not correct");
    let planterFund2;
    let referralFund2;
    for (let i = 10026; i < 10038; i++) {
      if ([10028, 10030].includes(i)) {
        planterFund2 = await planterFundsInstnce.planterFunds.call(i);
        referralFund2 = await planterFundsInstnce.referralFunds.call(i);

        assert.equal(Number(planterFund2), 0, "2-planterFund funds invalid");

        assert.equal(Number(referralFund2), 0, "2-referralFund funds invalid");
      } else {
        planterFund2 = await planterFundsInstnce.planterFunds.call(i);
        referralFund2 = await planterFundsInstnce.referralFunds.call(i);

        assert.equal(
          Number(planterFund2),
          Number(web3.utils.toWei("2")),
          "2-planterFund funds invalid"
        );

        assert.equal(
          Number(referralFund2),
          Number(web3.utils.toWei("1")),
          "2-referralFund funds invalid"
        );
      }
    }

    let totalFunds2 = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds2.planterFund),
      Math.mul(35, Number(planterShare))
    );

    assert.equal(
      Number(totalFunds2.referralFund),
      Math.mul(35, Number(referralShare))
    );

    /////////////// -------------- claim 10 tree with new shares

    const planterShare2 = await web3.utils.toWei("3");
    const referralShare2 = await web3.utils.toWei("1.5");

    await regularSellInstance.setRegularPlanterFund(
      planterShare2,
      referralShare2,
      { from: dataManager }
    );

    await regularSellInstance.updateReferrerGiftCount(userAccount3, 10, {
      from: userAccount8,
    });

    const user3GiftCountBeforeClaim =
      await regularSellInstance.referrerGifts.call(userAccount3);

    assert.equal(
      Number(user3GiftCountBeforeClaim),
      10,
      "user 3 gift before claim is not correct"
    );

    await regularSellInstance.claimGifts({ from: userAccount3 });

    const user3GiftCountAfterClaim =
      await regularSellInstance.referrerGifts.call(userAccount3);

    assert.equal(
      Number(user3GiftCountAfterClaim),
      0,
      "user 3 gift after claim is not correct"
    );

    const totalDaiToPlanterSwap4 =
      await wethFundsInstance.totalDaiToPlanterSwap.call();

    assert.equal(
      Number(totalDaiToPlanterSwap4),
      Math.add(
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 35),
        Math.mul(Math.add(Number(planterShare2), Number(referralShare2)), 10)
      ),
      "totalDaiToPlanterSwap4 is not correct"
    );

    let tokentOwner3;

    for (let i = 10038; i < 10048; i++) {
      tokentOwner3 = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner3, userAccount3, "funder not true " + i);
    }

    let lastTreeSold3 = await regularSellInstance.lastSoldRegularTree.call();

    console.log("lastTreeSold.toString()", lastTreeSold3.toString());

    assert.equal(lastTreeSold3, 10047, "last sold is not correct");
    let planterFund3;
    let referralFund3;
    for (let i = 10038; i < 10048; i++) {
      planterFund3 = await planterFundsInstnce.planterFunds.call(i);
      referralFund3 = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFund3),
        Number(web3.utils.toWei("3")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFund3),
        Number(web3.utils.toWei("1.5")),
        "2-referralFund funds invalid"
      );
    }

    let totalFunds3 = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds3.planterFund),
      Math.add(
        Math.mul(35, Number(planterShare)),
        Math.mul(10, Number(planterShare2))
      )
    );

    assert.equal(
      Number(totalFunds3.referralFund),
      Math.add(
        Math.mul(35, Number(referralShare)),
        Math.mul(10, Number(referralShare2))
      )
    );
  });

  it("should claim gifts more than 70 succuesfully", async () => {
    const planterShare = await web3.utils.toWei("2");
    const referralShare = await web3.utils.toWei("1");

    ///////////// deploy weth funds and set address
    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await regularSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });
    //////////////------------- setup

    await Common.addTreejerContractRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await regularSellInstance.setPlanterFundAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.setRegularPlanterFund(
      planterShare,
      referralShare,
      { from: dataManager }
    );

    await regularSellInstance.updateReferrerGiftCount(userAccount3, 85, {
      from: userAccount8,
    });

    const user3GiftCountBeforeClaim =
      await regularSellInstance.referrerGifts.call(userAccount3);

    assert.equal(
      Number(user3GiftCountBeforeClaim),
      85,
      "user 3 gift before claim is not correct"
    );

    await regularSellInstance.claimGifts({ from: userAccount3 });

    const user3GiftCountAfterClaim =
      await regularSellInstance.referrerGifts.call(userAccount3);

    assert.equal(
      Number(user3GiftCountAfterClaim),
      35,
      "user 3 gift after claim is not correct"
    );

    const totalDaiToPlanterSwap1 =
      await wethFundsInstance.totalDaiToPlanterSwap.call();

    assert.equal(
      Number(totalDaiToPlanterSwap1),
      Math.mul(Math.add(Number(planterShare), Number(referralShare)), 50),
      "totalDaiToPlanterSwap1 is not correct"
    );

    let tokentOwner;

    for (let i = 10001; i < 10051; i++) {
      tokentOwner = await treeTokenInstance.ownerOf(i);
      assert.equal(tokentOwner, userAccount3, "funder not true " + i);
    }

    let lastTreeSold = await regularSellInstance.lastSoldRegularTree.call();

    console.log("lastTreeSold3.toString()", lastTreeSold.toString());

    assert.equal(lastTreeSold, 10050, "last sold is not correct");
    let planterFund;
    let referralFund;
    for (let i = 10001; i < 10051; i++) {
      planterFund = await planterFundsInstnce.planterFunds.call(i);
      referralFund = await planterFundsInstnce.referralFunds.call(i);

      assert.equal(
        Number(planterFund),
        Number(web3.utils.toWei("2")),
        "2-planterFund funds invalid"
      );

      assert.equal(
        Number(referralFund),
        Number(web3.utils.toWei("1")),
        "2-referralFund funds invalid"
      );
    }

    let totalFunds = await planterFundsInstnce.totalFunds.call();
    assert.equal(
      Number(totalFunds.planterFund),
      Math.mul(50, Number(planterShare))
    );

    assert.equal(
      Number(totalFunds.referralFund),
      Math.mul(50, Number(referralShare))
    );
  });
});
