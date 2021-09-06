const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
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

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
  GsnErrorMsg,
  TreeAttributeErrorMsg,
} = require("./enumes");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("IncrementalSell", (accounts) => {
  let iSellInstance;
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let treeTokenInstance;
  let WETHAddress;
  let DAIAddress;
  let uniswapV2Router02NewAddress;
  let wethFundsInstance;
  let fModel;
  let planterFundsInstnce;
  let treeAttributeInstance;

  const dataManager = accounts[0];
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

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    ////--------------------------uniswap deploy

    factoryInstance = await Factory.new(accounts[2], { from: deployerAccount });
    const factoryAddress = factoryInstance.address;

    wethInstance = await Weth.new("WETH", "weth", { from: accounts[0] });
    WETHAddress = wethInstance.address;

    daiInstance = await Weth.new("DAI", "dai", { from: accounts[0] });
    DAIAddress = daiInstance.address;

    uniswapRouterInstance = await UniswapV2Router02New.new(
      factoryAddress,
      WETHAddress,
      { from: deployerAccount }
    );

    uniswapV2Router02NewAddress = uniswapRouterInstance.address;

    testUniswapInstance = await TestUniswap.new(
      uniswapV2Router02NewAddress,
      DAIAddress,
      WETHAddress,
      { from: deployerAccount }
    );

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    /////---------------------------addLiquidity-------------------------

    const testUniswapAddress = testUniswapInstance.address;

    await wethInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("1000000000000000", "Ether")
    );

    await daiInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("1000000000000000", "Ether")
    );

    await testUniswapInstance.addLiquidity2();
  });

  beforeEach(async () => {
    treeAttributeInstance = await TreeAttribute.new({
      from: deployerAccount,
    });

    await treeAttributeInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    iSellInstance = await IncrementalSell.new({
      from: deployerAccount,
    });

    await iSellInstance.initialize(arInstance.address, {
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

    wethFundsInstance = await WethFunds.new({
      from: deployerAccount,
    });

    await wethFundsInstance.initialize(arInstance.address, {
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

    /////-------------------------handle address here-----------------

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethTokenAddress(WETHAddress, {
      from: deployerAccount,
    });

    await iSellInstance.setFinancialModelAddress(fModel.address, {
      from: deployerAccount,
    });

    //-------------wethFundsInstance

    await wethFundsInstance.setWethTokenAddress(WETHAddress, {
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

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      wethFundsInstance.address,
      deployerAccount
    );

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
        from: dataManager,
      }
    );
  });

  afterEach(async () => {});

  it("check discount timeout", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
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

    await iSellInstance.buyTree(1, {
      from: userAccount3,
    });

    ////////// check last buy
    // const lastBuy1 = await iSellInstance.lastBuy.call(userAccount3);

    // assert.isTrue(Number(lastBuy1) > 0, "last buy is not ok");

    //////////--------------check tree owner
    let addressGetToken101 = await treeTokenInstance.ownerOf(101);

    assert.equal(addressGetToken101, userAccount3, "1.mint not true");

    let tree101 = await treeFactoryInstance.treeData(101);

    assert.equal(Number(tree101.provideStatus), 0);

    await treeTokenInstance.ownerOf(102).should.be.rejected;

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

    ////////////////////////////////////////////

    let funderBalance2 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance2),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.201"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.201"),
      {
        from: userAccount3,
      }
    );

    let expectedSwapTokenAmountForBuy20Tree = web3.utils.toWei(
      "140277899999978339000",
      "wei"
    );

    let expectedSwapTokenAmountTreeid121 = web3.utils.toWei(
      "7676899999997795000",
      "wei"
    );

    let tx = await iSellInstance.buyTree(20, {
      from: userAccount3,
    });

    truffleAssert.eventEmitted(tx, "IncrementalTreeSold", (ev) => {
      return (
        ev.buyer.toString() === userAccount3.toString() &&
          Number(ev.startId) === 102,
        20
      );
    });

    //////////--------------check tree owner
    let addressGetToken102 = await treeTokenInstance.ownerOf(102);

    assert.equal(addressGetToken102, userAccount3, "2.1-mint not true");

    let tree102 = await treeFactoryInstance.treeData(102);

    assert.equal(Number(tree102.provideStatus), 0);

    /////-----------------buy 110

    let addressGetToken110 = await treeTokenInstance.ownerOf(110);

    assert.equal(addressGetToken110, userAccount3, "2.2-mint not true");

    let tree110 = await treeFactoryInstance.treeData(110);

    assert.equal(Number(tree110.provideStatus), 0);

    /////-----------------buy 120

    let addressGetToken120 = await treeTokenInstance.ownerOf(120);

    assert.equal(addressGetToken120, userAccount3, "2.3-mint not true");

    let tree120 = await treeFactoryInstance.treeData(120);

    assert.equal(Number(tree120.provideStatus), 0);

    /////-----------------buy 121

    let addressGetToken121 = await treeTokenInstance.ownerOf(121);

    assert.equal(addressGetToken121, userAccount3, "2.4-mint not true");

    let tree121 = await treeFactoryInstance.treeData(121);

    assert.equal(Number(tree121.provideStatus), 0);

    ///////////////////

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
        Number(web3.utils.toWei("0.11658"))
      ),
      "daiFunds balance not true"
    );

    assert.equal(
      Number(planterFundsBalanceAfter2),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1]).plus(
          expectedSwapTokenAmountForBuy20Tree
        )
      ),
      "planterFunds balance not true"
    );

    assert.equal(Number(iSellBalanceAfter2), 0, "iSell balance not true");

    ////--------------------------check weth fund
    let amount2 = Number(web3.utils.toWei("0.201"));

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

    let planterFunds2 = await planterFundsInstnce.planterFunds.call(121);
    let referralFunds2 = await planterFundsInstnce.referralFunds.call(121);

    assert.equal(
      Number(totalPlanterFund2.planterFund),
      Number(Math.Big(planterFundsBalanceAfter2).div(4200).times(3000)),
      "totalFund planterFund funds invalid"
    );

    assert.equal(
      Number(totalPlanterFund2.referralFund),
      Number(
        Math.Big(expectedSwapTokenAmountTreeid101[1])
          .times(1200)
          .div(4200)
          .plus(
            Math.Big(expectedSwapTokenAmountForBuy20Tree).times(1200).div(4200)
          )
      ),
      "totalFund referralFund funds invalid"
    );

    assert.equal(
      Number(planterFunds2),
      Number(Math.Big(expectedSwapTokenAmountTreeid121).times(3000).div(4200)),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(referralFunds2),
      Number(Math.Big(expectedSwapTokenAmountTreeid121).times(1200).div(4200)),
      "referralFund funds invalid"
    );

    // /////---------------- step2 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount4, web3.utils.toWei("0.209"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.209"),
      {
        from: userAccount4,
      }
    );

    let tx2 = await iSellInstance.buyTree(19, {
      from: userAccount4,
    });

    truffleAssert.eventEmitted(tx2, "IncrementalTreeSold", (ev) => {
      return (
        ev.buyer.toString() === userAccount4.toString() &&
          Number(ev.startId) === 122,
        19
      );
    });

    let funderBalance5 = await wethInstance.balanceOf(userAccount4);

    assert.equal(
      Number(funderBalance5),
      web3.utils.toWei("0"),
      "5-funder balance not true"
    );

    let lastSold = await iSellInstance.lastSold();

    assert.equal(lastSold, 140, "Step 2 lastSold not true");

    // /////---------------- step3 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.18"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.18"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(15, {
      from: userAccount3,
    });

    let funderBalance6 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance6),
      web3.utils.toWei("0"),
      "6-funder balance not true"
    );

    let lastSold2 = await iSellInstance.lastSold();

    assert.equal(lastSold2, 155, "Step 3 lastSold not true");

    // /////---------------- step 3, 4 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.125"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.125"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(10, {
      from: userAccount3,
    });

    let funderBalance7 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance7),
      web3.utils.toWei("0"),
      "7-funder balance not true"
    );

    let lastSold3 = await iSellInstance.lastSold();

    assert.equal(lastSold3, 165, "Step 3 lastSold not true");

    // /////---------------- step4 ---------------------------

    //mint weth for funder
    await wethInstance.setMint(userAccount4, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount4,
      }
    );

    await iSellInstance.buyTree(20, {
      from: userAccount4,
    });
    await iSellInstance.buyTree(14, {
      from: userAccount4,
    });

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.1"));

    let funderBalance8 = await wethInstance.balanceOf(userAccount3);

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.014"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(1, { from: userAccount3 });

    let funderBalance9 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance9),
      web3.utils.toWei("0.086"),
      "9-funder balance not true"
    );

    // ////--------------------step6------------------------

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
      .buyTree(1, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    await wethInstance.resetAcc(userAccount3);
    await wethInstance.resetAcc(userAccount4);
  });

  ////////////////-------------------------------------------- gsn ------------------------------------------------
  it("test gsn [ @skip-on-coverage ]", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    ///////------------------------------handle gsn---------------------------------

    let env = await GsnTestEnvironment.startGsn("localhost");

    const { forwarderAddress, relayHubAddress, paymasterAddress } =
      env.contractsDeployment;

    await iSellInstance.setTrustedForwarder(forwarderAddress, {
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
      iSellInstance.address,
      iSellInstance.abi,
      signerFunder
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount2, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount2,
      }
    );

    let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

    await contractFunder
      .buyTree(1)
      .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    await paymaster.addFunderWhitelistTarget(iSellInstance.address, {
      from: deployerAccount,
    });

    await contractFunder.buyTree(1);

    //////////--------------check tree owner
    let addressGetToken = await treeTokenInstance.ownerOf(101);

    assert.equal(addressGetToken, userAccount2, "1.mint not true");

    let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

    console.log("balanceAccountBefore", Number(balanceAccountBefore));
    console.log("balanceAccountAfter", Number(balanceAccountAfter));

    assert.equal(
      balanceAccountAfter,
      balanceAccountBefore,
      "Gsn not true work"
    );
  });

  it("deploys successfully", async () => {
    const address = iSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ///////////////---------------------------------set trust forwarder address--------------------------------------------------------
  it("set trust forwarder address", async () => {
    await iSellInstance
      .setTrustedForwarder(userAccount2, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance
      .setTrustedForwarder(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await iSellInstance.setTrustedForwarder(userAccount2, {
      from: deployerAccount,
    });

    assert.equal(
      userAccount2,
      await iSellInstance.trustedForwarder(),
      "address set incorect"
    );
  });

  ///////////////---------------------------------set TreeAttributes address--------------------------------------------------------
  it("set trust forwarder address", async () => {
    await iSellInstance
      .setTreeAttributesAddress(treeAttributeInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await iSellInstance.setTreeAttributesAddress(
      treeAttributeInstance.address,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      treeAttributeInstance.address,
      await iSellInstance.treeAttribute(),
      "address set incorect"
    );
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

    await iSellInstance
      .setWethTokenAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

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

  /////////////////---------------------------------test addTreeSells function--------------------------------------------------------

  it("added incrementalSell should has positive tree Count", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 0, 100, 400, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_TO_SELL); //must be faild because treeCount is zero
  });

  it("added incrementalSell should has startTreeId>100", async () => {
    await iSellInstance
      .addTreeSells(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.OCCUPIED_TREES); //treeStartId should be >100
  });

  it("added incrementalSell should reject becuase caller has not admin role", async () => {
    await iSellInstance
      .addTreeSells(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });

  it("added incrementalSell should has steps of price change>0", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 0, 400, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS); // steps of price change should be >0
  });

  it("added incrementalSell should have equivalant fund distribution model", async () => {
    await fModel.assignTreeFundDistributionModel(105, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: dataManager,
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
        from: dataManager,
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(110, 10000, 1, {
      from: dataManager,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: dataManager,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
  });

  it("incrementalSell all trees should be availabe to sell", async () => {
    treeAuctionInstance = await TreeAuction.new({
      from: deployerAccount,
    });

    await treeAuctionInstance.initialize(arInstance.address, {
      from: deployerAccount,
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
        from: dataManager,
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 1, {
      from: dataManager,
    });

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await Common.addTreejerContractRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(107, ipfsHash, { from: dataManager });

    await treeAuctionInstance.createAuction(
      107,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: dataManager }
    );
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_PROVIDED_BEFORE); // trees shouldnot be on other provides
  });

  it("addTreeSells should be work successfully", async () => {
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    let eventTx = await iSellInstance.addTreeSells(
      105,
      web3.utils.toWei("0.01"),
      150,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    truffleAssert.eventEmitted(eventTx, "IncrementalSellUpdated", (ev) => {
      return true;
    });

    let incrementalPrice = await iSellInstance.incrementalPrice();
    let lastSold = await iSellInstance.lastSold();

    assert.equal(Number(incrementalPrice.startTree), 105, "startTree not true");
    assert.equal(Number(incrementalPrice.endTree), 255, "endTree not true");
    assert.equal(
      Number(incrementalPrice.initialPrice),
      web3.utils.toWei("0.01"),
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
    assert.equal(Number(lastSold), 104, "lastSold not true");

    //check tree data

    let tree105 = await treeFactoryInstance.treeData(105);

    assert.equal(Number(tree105.provideStatus), 2);

    let tree150 = await treeFactoryInstance.treeData(254);

    assert.equal(Number(tree150.provideStatus), 2);

    let tree151 = await treeFactoryInstance.treeData(255);

    assert.equal(Number(tree151.provideStatus), 0);

    await iSellInstance.addTreeSells(
      135,
      web3.utils.toWei("0.01"),
      150,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    let incrementalPrice2 = await iSellInstance.incrementalPrice();
    let lastSold2 = await iSellInstance.lastSold();

    assert.equal(
      Number(incrementalPrice2.startTree),
      135,
      "startTree not true"
    );

    assert.equal(Number(incrementalPrice2.endTree), 285, "endTree not true");

    assert.equal(
      Number(incrementalPrice2.initialPrice),
      web3.utils.toWei("0.01"),
      "initialPrice not true"
    );

    assert.equal(
      Number(incrementalPrice2.increaseStep),
      100,
      "increaseStep not true"
    );

    assert.equal(
      Number(incrementalPrice2.increaseRatio),
      1000,
      "increaseRatio not true"
    );

    assert.equal(Number(lastSold2), 134, "lastSold not true");

    let tree105_2 = await treeFactoryInstance.treeData(105);

    assert.equal(Number(tree105_2.provideStatus), 0);

    let tree134 = await treeFactoryInstance.treeData(134);

    assert.equal(Number(tree134.provideStatus), 0);

    let tree135 = await treeFactoryInstance.treeData(135);

    assert.equal(Number(tree135.provideStatus), 2);

    let tree284 = await treeFactoryInstance.treeData(284);

    assert.equal(Number(tree284.provideStatus), 2);

    let tree285 = await treeFactoryInstance.treeData(285);

    assert.equal(Number(tree285.provideStatus), 0);
  });

  ////////////// -------------------------------- freeIncrementalSell ---------------------------------
  it("Should freeIncrementalSell succesfully", async () => {
    await iSellInstance
      .freeIncrementalSell(400)
      .should.be.rejectedWith(
        IncrementalSellErrorMsg.FREE_INCREMENTALSELL_FAIL
      );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      200,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    for (let i = 0; i < 5; i++) {
      await iSellInstance.updateIncrementalEnd(200, {
        from: dataManager,
      });
    }

    let incrementalPrice = await iSellInstance.incrementalPrice();

    let lastSold = await await iSellInstance.lastSold();

    assert.equal(Number(incrementalPrice.startTree), 101, "startTree not true");

    assert.equal(Number(lastSold), 100, "lastSold not true");

    assert.equal(Number(incrementalPrice.endTree), 1301, "endTree not true");

    ////////// check tree data

    const tree101_1 = await treeFactoryInstance.treeData.call(101);
    const tree1300_1 = await treeFactoryInstance.treeData.call(1300);
    const tree1301_1 = await treeFactoryInstance.treeData.call(1301);

    assert.equal(
      Number(tree101_1.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree1300_1.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree1301_1.provideStatus),
      0,
      "provide status is not correct"
    );

    await iSellInstance
      .freeIncrementalSell(500, {
        from: userAccount4,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    await iSellInstance.freeIncrementalSell(500);

    let incrementalPrice2 = await iSellInstance.incrementalPrice();

    assert.equal(
      Number(incrementalPrice2.startTree),
      601,
      "2startTree not true"
    );

    assert.equal(
      Number(await iSellInstance.lastSold()),
      600,
      "2lastSold not true"
    );

    assert.equal(Number(incrementalPrice2.endTree), 1301, "2endTree not true");

    const tree101_2 = await treeFactoryInstance.treeData.call(101);
    const tree300_2 = await treeFactoryInstance.treeData.call(300);
    const tree600_2 = await treeFactoryInstance.treeData.call(600);
    const tree601_2 = await treeFactoryInstance.treeData.call(601);

    assert.equal(
      Number(tree101_2.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree300_2.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree600_2.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree601_2.provideStatus),
      2,
      "2provide status is not correct"
    );

    await iSellInstance.freeIncrementalSell(400);

    let incrementalPrice3 = await iSellInstance.incrementalPrice();

    assert.equal(
      Number(incrementalPrice3.startTree),
      1001,
      "3startTree not true"
    );

    assert.equal(
      Number(await iSellInstance.lastSold()),
      1000,
      "3lastSold not true"
    );

    assert.equal(Number(incrementalPrice3.endTree), 1301, "3endTree not true");

    const tree601_3 = await treeFactoryInstance.treeData.call(601);
    const tree800_3 = await treeFactoryInstance.treeData.call(800);
    const tree1000_3 = await treeFactoryInstance.treeData.call(1000);
    const tree1001_3 = await treeFactoryInstance.treeData.call(1001);

    assert.equal(
      Number(tree601_3.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree800_3.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree1000_3.provideStatus),
      0,
      "2provide status is not correct"
    );

    assert.equal(
      Number(tree1001_3.provideStatus),
      2,
      "2provide status is not correct"
    );

    await iSellInstance
      .freeIncrementalSell(400)
      .should.be.rejectedWith(
        IncrementalSellErrorMsg.FREE_INCREMENTALSELL_FAIL
      );

    await iSellInstance.freeIncrementalSell(300);

    let incrementalPrice4 = await iSellInstance.incrementalPrice();

    assert.equal(
      Number(incrementalPrice4.startTree),
      1301,
      "3startTree not true"
    );

    assert.equal(
      Number(await iSellInstance.lastSold()),
      1300,
      "4lastSold not true"
    );

    assert.equal(Number(incrementalPrice4.endTree), 1301, "3endTree not true");

    const tree1001_4 = await treeFactoryInstance.treeData.call(1001);
    const tree1200_4 = await treeFactoryInstance.treeData.call(1200);
    const tree1300_4 = await treeFactoryInstance.treeData.call(1300);
    const tree1301_4 = await treeFactoryInstance.treeData.call(1301);

    assert.equal(
      Number(tree1001_4.provideStatus),
      0,
      "3provide status is not correct"
    );

    assert.equal(
      Number(tree1200_4.provideStatus),
      0,
      "3provide status is not correct"
    );

    assert.equal(
      Number(tree1300_4.provideStatus),
      0,
      "3provide status is not correct"
    );

    assert.equal(
      Number(tree1301_4.provideStatus),
      0,
      "3provide status is not correct"
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

    await iSellInstance
      .buyTree(1, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    await iSellInstance.addTreeSells(
      15000,
      web3.utils.toWei("0.01"),
      200,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    await wethInstance.resetAcc(userAccount3);
  });

  ///////////// --------------------------------- updateIncrementalEnd --------------------------------
  it("Should updateIncrementalEnd succesfully", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      100,
      1000,
      {
        from: dataManager,
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

    ////////// check tree data

    const tree101_1 = await treeFactoryInstance.treeData.call(101);
    const tree150_1 = await treeFactoryInstance.treeData.call(150);
    const tree200_1 = await treeFactoryInstance.treeData.call(200);
    const tree250_1 = await treeFactoryInstance.treeData.call(250);

    assert.equal(
      Number(tree101_1.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree150_1.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree200_1.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree250_1.provideStatus),
      0,
      "provide status is not correct"
    );

    const eventTx = await iSellInstance.updateIncrementalEnd(100, {
      from: dataManager,
    });

    truffleAssert.eventEmitted(eventTx, "IncrementalSellUpdated", (ev) => {
      return true;
    });

    let incrementalPrice1 = await iSellInstance.incrementalPrice();

    assert.equal(Number(incrementalPrice1.endTree), 301, "startTree not true");

    ///// check tree data
    const tree101_2 = await treeFactoryInstance.treeData.call(101);
    const tree150_2 = await treeFactoryInstance.treeData.call(150);
    const tree201_2 = await treeFactoryInstance.treeData.call(201);
    const tree250_2 = await treeFactoryInstance.treeData.call(250);
    const tree300 = await treeFactoryInstance.treeData.call(300);

    assert.equal(
      Number(tree101_2.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree150_2.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree201_2.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree250_2.provideStatus),
      2,
      "provide status is not correct"
    );

    assert.equal(
      Number(tree300.provideStatus),
      2,
      "provide status is not correct"
    );
  });

  it("updateIncrementalEnd shoul reject because caller is not admin", async () => {
    await iSellInstance
      .updateIncrementalEnd(100, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });

  it("updateIncrementalEnd shoul reject because caller is not admin", async () => {
    await iSellInstance
      .updateIncrementalEnd(100, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS);
  });

  it("updateIncrementalEnd Should reject because a tree is not available", async () => {
    treeAuctionInstance = await TreeAuction.new({
      from: deployerAccount,
    });

    await treeAuctionInstance.initialize(arInstance.address, {
      from: deployerAccount,
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
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await Common.addTreejerContractRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(217, ipfsHash, {
      from: dataManager,
    });

    await treeAuctionInstance.createAuction(
      217,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: dataManager }
    );

    await iSellInstance
      .updateIncrementalEnd(100, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_PROVIDED_BEFORE);
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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    let eventTx = await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      40,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    truffleAssert.eventEmitted(eventTx, "IncrementalSellUpdated", (ev) => {
      return true;
    });

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(20, { from: userAccount3 });

    await iSellInstance.buyTree(20, { from: userAccount3 });

    let lastSold = await iSellInstance.lastSold();

    assert.equal(Number(lastSold), 140, "lastSold not true");
    await iSellInstance
      .buyTree(1, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    await wethInstance.resetAcc(userAccount3);
  });

  it("low price paid for the tree without discount", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      250,
      100,
      1000,
      {
        from: dataManager,
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
      .buyTree(1, { from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);

    await wethInstance.resetAcc(userAccount3);
  });

  it("buyTree work successfully", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      20,
      1,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
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
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.39"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.39"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(20, {
      from: userAccount3,
    });

    let funderBalance2 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance2),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    await wethInstance.resetAcc(userAccount3);
  });

  it("buyTree should be reject (INVALID_COUNT)", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      150,
      50,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
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
    await wethInstance.setMint(userAccount3, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(120, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_COUNT);

    await wethInstance.resetAcc(userAccount3);
  });

  it("buyTree should be reject (INVALID_TREE)", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      20,
      50,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(21, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    await iSellInstance.buyTree(5, {
      from: userAccount3,
    });

    await iSellInstance
      .buyTree(16, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    await wethInstance.resetAcc(userAccount3);
  });

  it("check discount usage", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
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
      .buyTree(1, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);

    await wethInstance.resetAcc(userAccount3);

    await wethInstance.setMint(userAccount4, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount4,
      }
    );

    await iSellInstance.buyTree(10, {
      from: userAccount4,
    });

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.11"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.11"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(11, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);

    await wethInstance.resetAcc(userAccount3);
    await wethInstance.resetAcc(userAccount4);
  });

  ////----------------------------------------------------test updateIncrementalRates------------------------------

  it("updateIncrementalRates should be work successfully", async () => {
    let eventTx = await iSellInstance.updateIncrementalRates(
      web3.utils.toWei("0.01"),
      20,
      1000,
      {
        from: dataManager,
      }
    );

    let incrementalPrice = await iSellInstance.incrementalPrice();

    assert.equal(
      Number(incrementalPrice.initialPrice),
      Number(web3.utils.toWei("0.01")),
      "initialPrice not true"
    );

    assert.equal(
      Number(incrementalPrice.increaseStep),
      20,
      "increaseStep not true"
    );

    assert.equal(
      Number(incrementalPrice.increaseRatio),
      1000,
      "increaseRatio not true"
    );

    truffleAssert.eventEmitted(eventTx, "IncrementalRatesUpdated", (ev) => {
      return true;
    });
  });

  it("updateIncrementalRates should be work successfully", async () => {
    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
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

    await iSellInstance.buyTree(1, {
      from: userAccount3,
    });

    let funderBalance2 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance2),
      web3.utils.toWei("0"),
      "2-funder balance not true"
    );

    /////---------------- step2 ---------------------------

    await wethInstance.setMint(userAccount4, web3.utils.toWei("0.04"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.04"),
      {
        from: userAccount4,
      }
    );

    await iSellInstance.buyTree(4, {
      from: userAccount4,
    });

    assert.equal(
      Number(await wethInstance.balanceOf(userAccount4)),
      web3.utils.toWei("0"),
      "userAccount4 balance not true"
    );

    ////---------- update price and steps ---------------------

    await iSellInstance.updateIncrementalRates(
      web3.utils.toWei("0.03"),
      10,
      1000,
      {
        from: dataManager,
      }
    );

    await wethInstance.setMint(userAccount4, web3.utils.toWei(".516"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei(".516"),
      {
        from: userAccount4,
      }
    );

    await iSellInstance.buyTree(16, {
      from: userAccount4,
    });

    assert.equal(
      Number(await wethInstance.balanceOf(userAccount4)),
      web3.utils.toWei("0"),
      "2-userAccount4 balance not true"
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0209"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.0209"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance
      .buyTree(1, {
        from: userAccount3,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0475"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.0684"),
      {
        from: userAccount3,
      }
    );

    await iSellInstance.buyTree(1, {
      from: userAccount3,
    });

    let funderBalance4 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance4),
      web3.utils.toWei("0.0324"),
      "4-funder balance not true"
    );

    ////---------- update price and steps ---------------------

    await iSellInstance.updateIncrementalRates(
      web3.utils.toWei("0.1"),
      70,
      10000,
      {
        from: dataManager,
      }
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount4, web3.utils.toWei("1000"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("1000"),
      {
        from: userAccount4,
      }
    );

    await iSellInstance.buyTree(20, {
      from: userAccount4,
    });
    await iSellInstance.buyTree(20, {
      from: userAccount4,
    });
    await iSellInstance.buyTree(9, {
      from: userAccount4,
    });

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.2"));

    await wethInstance.approve(iSellInstance.address, web3.utils.toWei("0.2"), {
      from: userAccount3,
    });

    await iSellInstance.buyTree(1, { from: userAccount3 });

    let funderBalance7 = await wethInstance.balanceOf(userAccount3);

    assert.equal(
      Number(funderBalance7),
      web3.utils.toWei("0.0324"),
      "7-funder balance not true"
    );
  });

  it("updateIncrementalRates should reject becuase caller has not admin role", async () => {
    await iSellInstance
      .updateIncrementalRates(web3.utils.toWei("0.1"), 70, 10000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });

  it("updateIncrementalRates should reject becuase step must be gt zero", async () => {
    await iSellInstance
      .updateIncrementalRates(web3.utils.toWei("0.1"), 0, 10000, {
        from: dataManager,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS);
  });

  ///-------------------------------------------------------- claimTreeAttributes ---------------------------------------

  it("claimTreeAttributes should be rejec (owner) ", async () => {
    await iSellInstance.setTreeAttributesAddress(
      treeAttributeInstance.address,
      {
        from: deployerAccount,
      }
    );

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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.005"),
      100,
      100,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
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

    await Common.addTreejerContractRole(
      arInstance,
      wethFundsInstance.address,
      deployerAccount
    );

    await iSellInstance.buyTree(1, {
      from: userAccount3,
    });

    await iSellInstance
      .claimTreeAttributes(101, 1, {
        from: userAccount6,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);

    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeTokenInstance.safeMint(userAccount5, 103, {
      from: deployerAccount,
    });

    await iSellInstance
      .claimTreeAttributes(103, 1, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });

  it("claimTreeAttributes should be work successfully ", async () => {
    await iSellInstance.setTreeAttributesAddress(
      treeAttributeInstance.address,
      {
        from: deployerAccount,
      }
    );

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
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(100, 10000, 0, {
      from: dataManager,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      100,
      20,
      1000,
      {
        from: dataManager,
      }
    );

    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount2, web3.utils.toWei("0.05"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.05"),
      {
        from: userAccount2,
      }
    );

    await iSellInstance.buyTree(5, {
      from: userAccount2,
    });

    let treeAttributeTemp;

    for (let i = 101; i < 106; i++) {
      treeAttributeTemp = await treeAttributeInstance.treeAttributes(i);
      assert.equal(
        Number(treeAttributeTemp.exists),
        0,
        i + " - Exists not true"
      );
    }

    await iSellInstance.claimTreeAttributes(101, 5, {
      from: userAccount2,
    });

    for (let i = 101; i < 106; i++) {
      treeAttributeTemp = await treeAttributeInstance.treeAttributes(i);
      assert.equal(
        Number(treeAttributeTemp.exists),
        1,
        i + " - Exists not true"
      );
    }
    treeAttributeTemp = await treeAttributeInstance.treeAttributes(106);
    assert.equal(Number(treeAttributeTemp.exists), 0, "106 - Exists not true");

    //mint weth for funder
    await wethInstance.setMint(userAccount2, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount2,
      }
    );

    await iSellInstance.buyTree(1, {
      from: userAccount2,
    });

    await iSellInstance.claimTreeAttributes(106, 1, {
      from: userAccount2,
    });

    treeAttributeTemp = await treeAttributeInstance.treeAttributes(106);
    assert.equal(Number(treeAttributeTemp.exists), 1, "106 - Exists not true");
  });
});
