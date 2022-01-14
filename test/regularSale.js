// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSale = artifacts.require("RegularSale");

const TestRegularSale = artifacts.require("TestRegularSale");
const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");
const Planter = artifacts.require("Planter");
const WethFund = artifacts.require("WethFund");
const Attribute = artifacts.require("Attribute");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");
const Math = require("./math");

//treasury section
const DaiFund = artifacts.require("DaiFund");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const Dai = artifacts.require("Dai");

//uniswap
const Factory = artifacts.require("Factory.sol");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");
const Token = artifacts.require("Weth");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

const {
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  RegularSaleErrors,
  TreasuryManagerErrorMsg,
  TimeEnumes,
} = require("./enumes");

contract("regularSale", (accounts) => {
  let regularSaleInstance;
  let treeFactoryInstance;
  let arInstance;

  let treeTokenInstance;
  let attributeInstance;

  let allocationInstance;
  let daiFundInstance;
  let planterFundsInstnce;
  let daiInstance;
  let wethFundInstance;

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

    await Common.addVerifierRole(arInstance, dataManager, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount8,
      deployerAccount
    );
  });

  describe("deployment and set addresses", () => {
    before(async () => {
      regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      daiFundInstance = await DaiFund.new({
        from: deployerAccount,
      });

      await daiFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    //////////////////************************************ deploy successfully ***************************************
    it("deploys successfully", async () => {
      const address = regularSaleInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("set regularSale address and fail in invalid situation", async () => {
      /////------------------set trust forwarder address

      await regularSaleInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await regularSaleInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await regularSaleInstance.trustedForwarder(),
        "address set incorect"
      );

      /////------------------set tree factory address

      await regularSaleInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        treeFactoryInstance.address,
        await regularSaleInstance.treeFactory(),
        "address set incorect"
      );

      ////---------------------------------set dai funds address--------------

      await regularSaleInstance
        .setDaiFundAddress(daiFundInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiFundInstance.address,
        await regularSaleInstance.daiFund(),
        "dai funds address set incorect"
      );

      ////---------------------------------Set dai token address--------------

      await regularSaleInstance
        .setDaiTokenAddress(daiInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance
        .setDaiTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiInstance.address,
        await regularSaleInstance.daiToken(),
        "dai token address set incorect"
      );

      ////---------------------------------set Allocation Address--------------------------------------------------------

      await regularSaleInstance
        .setAllocationAddress(allocationInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        allocationInstance.address,
        await regularSaleInstance.allocation(),
        "allocation address set incorect"
      );

      ////---------------------------------set wethFund Address--------------------------------------------------------

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance
        .setWethFundAddress(wethFundInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        wethFundInstance.address,
        await regularSaleInstance.wethFund(),
        "address set incorect"
      );
    });
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    /////////////////---------------------------------update lastFundedTreeId--------------------------------------------------------

    it("update lastFundedTreeId", async () => {
      Common.addDataManager(arInstance, userAccount1, deployerAccount);

      await regularSaleInstance
        .updateLastFundedTreeId(500, {
          from: userAccount1,
        })
        .should.be.rejectedWith(
          RegularSaleErrors.INVALID_SET_LAST_REGULAR_TREE_SELL_INPUT
        );

      await regularSaleInstance
        .updateLastFundedTreeId(15000, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      let tx = await regularSaleInstance.updateLastFundedTreeId(15000, {
        from: userAccount1,
      });

      truffleAssert.eventEmitted(tx, "LastFundedTreeIdUpdated", (ev) => {
        return Number(ev.lastFundedTreeId) == 15000;
      });

      let lastRegularSaleTreeAfter =
        await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastRegularSaleTreeAfter),
        15000,
        "lastRegularSaleTreeAfter not true"
      );

      await regularSaleInstance
        .updateLastFundedTreeId(15000, {
          from: userAccount1,
        })
        .should.be.rejectedWith(
          RegularSaleErrors.INVALID_SET_LAST_REGULAR_TREE_SELL_INPUT
        );

      let tx2 = await regularSaleInstance.updateLastFundedTreeId(15001, {
        from: userAccount1,
      });

      truffleAssert.eventEmitted(tx2, "LastFundedTreeIdUpdated", (ev) => {
        return Number(ev.lastFundedTreeId) == 15001;
      });

      let lastRegularSaleTreeAfter2 =
        await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastRegularSaleTreeAfter2),
        15001,
        "2-lastRegularSaleTreeAfter not true"
      );
    });

    /////////////////---------------------------------update maxTreeSupply--------------------------------------------------------

    it("update maxTreeSupply", async () => {
      Common.addDataManager(arInstance, userAccount1, deployerAccount);

      await regularSaleInstance
        .updateMaxTreeSupply(9900, {
          from: userAccount1,
        })
        .should.be.rejectedWith(
          CommonErrorMsg.MAX_SUPPLY_MUST_GT_LAST_FUNDED_TREE
        );

      await regularSaleInstance.updateMaxTreeSupply(500000, {
        from: userAccount1,
      });

      await regularSaleInstance
        .updateMaxTreeSupply(1500000, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      let tx = await regularSaleInstance.updateMaxTreeSupply(1500000, {
        from: userAccount1,
      });

      truffleAssert.eventEmitted(tx, "MaxTreeSupplyUpdated", (ev) => {
        return Number(ev.maxTreeSupply) == 1500000;
      });

      let maxTreeSuuplyAfter = await regularSaleInstance.maxTreeSupply();

      assert.equal(
        Number(maxTreeSuuplyAfter),
        1500000,
        "maxTreeSuuplyAfter not true"
      );

      let tx2 = await regularSaleInstance.updateMaxTreeSupply(1500001, {
        from: userAccount1,
      });

      truffleAssert.eventEmitted(tx2, "MaxTreeSupplyUpdated", (ev) => {
        return Number(ev.maxTreeSupply) == 1500001;
      });

      let maxTreeSuuplyAfter2 = await regularSaleInstance.maxTreeSupply();

      assert.equal(
        Number(maxTreeSuuplyAfter2),
        1500001,
        "2-maxTreeSuuplyAfter not true"
      );
    });

    /////////////////------------------------------------- set price ------------------------------------------
    it("set price and check data", async () => {
      await regularSaleInstance
        .updatePrice(10, { from: userAccount6 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      let price1 = await regularSaleInstance.price.call();

      assert.equal(
        Number(price1),
        Number(web3.utils.toWei("7")),
        "priceInvalid"
      );

      let tx = await regularSaleInstance.updatePrice(100, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(tx, "PriceUpdated", (ev) => {
        return Number(ev.price) == 100;
      });

      const price2 = await regularSaleInstance.price.call();

      assert.equal(Number(price2), 100, "tree price is incorrect");
    });

    /////////////////------------------------------------- request trees ------------------------------------------

    it("Should request trees rejecet", async () => {
      let funder = userAccount3;

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      /////-----------------------------Should request trees rejecet(The count must be greater than zero)------------

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("7"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("7"),
        {
          from: funder,
        }
      );

      await regularSaleInstance
        .fundTree(1, userAccount3, userAccount3, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_REFERAL);

      await regularSaleInstance
        .fundTree(1, funder, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_REFERAL);

      await regularSaleInstance
        .fundTree(0, zeroAddress, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);

      await regularSaleInstance
        .fundTree(101, zeroAddress, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);

      await daiInstance.resetAcc(funder);

      ////--------------------- Should request trees rejece(The value we sent to the counter is incorrect) ------------------

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("14"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("14"),
        {
          from: funder,
        }
      );

      await regularSaleInstance
        .fundTree(3, zeroAddress, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_AMOUNT);

      ///----------------test2

      //mint dai for funder
      await daiInstance.setMint(userAccount4, web3.utils.toWei("32"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("14"),
        {
          from: userAccount4,
        }
      );

      await regularSaleInstance
        .fundTree(3, zeroAddress, zeroAddress, {
          from: userAccount4,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_APPROVE);

      ///----------------test3 (Max supply reached)

      //mint dai for funder
      await daiInstance.setMint(userAccount4, web3.utils.toWei("10000"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("10000"),
        {
          from: userAccount4,
        }
      );

      await regularSaleInstance.updateLastFundedTreeId(999980, {
        from: dataManager,
      });

      await regularSaleInstance
        .fundTree(21, zeroAddress, zeroAddress, {
          from: userAccount4,
        })
        .should.be.rejectedWith(RegularSaleErrors.MAX_SUPPLY);

      await regularSaleInstance.updateLastFundedTreeId(999990, {
        from: dataManager,
      });

      await regularSaleInstance
        .fundTree(11, zeroAddress, zeroAddress, {
          from: userAccount4,
        })
        .should.be.rejectedWith(RegularSaleErrors.MAX_SUPPLY);

      await regularSaleInstance.updateLastFundedTreeId(1000000, {
        from: dataManager,
      });

      await regularSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, {
          from: userAccount4,
        })
        .should.be.rejectedWith(RegularSaleErrors.MAX_SUPPLY);

      await daiInstance.resetAcc(funder);
      await daiInstance.resetAcc(userAccount4);
    });

    /////----------------request tree by Id-------------------------------

    it("should be reject request by tree id", async () => {
      const price = Units.convert("7", "eth", "wei");
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const ipfsHash = "some ipfs hash here";
      const treeId = 10001;

      let tx = await regularSaleInstance.updatePrice(price, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(tx, "PriceUpdated", (ev) => {
        return Number(ev.price) == Number(price);
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      /////////////// ---------------- fail beacuuse of Invalid treeId id

      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("14"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("14"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance
        .fundTreeById(treeId, userAccount1, zeroAddress, { from: userAccount1 })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_REFERAL);

      await regularSaleInstance
        .fundTreeById(treeId, userAccount3, userAccount3, {
          from: userAccount1,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_REFERAL);

      await regularSaleInstance
        .fundTreeById(2, zeroAddress, zeroAddress, { from: userAccount1 })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_TREE);

      await daiInstance.resetAcc(userAccount1);

      /////////////////// ------------------ fail because of Insufficient balance -----------------

      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("5"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("5"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance
        .fundTreeById(treeId, zeroAddress, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_AMOUNT);

      ////--------------test2
      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("10"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("2"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance
        .fundTreeById(treeId, zeroAddress, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(RegularSaleErrors.CommonErrorMsg);

      ////--------------test3
      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("10000"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("10000"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance
        .fundTreeById(1000010, zeroAddress, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_TREE);

      await daiInstance.resetAcc(userAccount1);
    });

    //////------------------------------------ test updateReferrerClaimableTreesWeth function

    it("should updateReferrerClaimableTreesWeth successfully", async () => {
      await regularSaleInstance
        .updateReferrerClaimableTreesWeth(userAccount1, 2, {
          from: userAccount6,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        userAccount8,
        deployerAccount
      );

      await regularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount1,
        4,
        {
          from: userAccount8,
        }
      );

      let user1GiftCount =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount1);

      assert.equal(
        Number(user1GiftCount),
        4,
        "user1 gift count is not correct"
      );

      await regularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount2,
        10,
        {
          from: userAccount8,
        }
      );

      let user2GiftCount =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount2);

      assert.equal(
        Number(user2GiftCount),
        10,
        "user2 gift count is not correct"
      );

      await regularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount1,
        3,
        {
          from: userAccount8,
        }
      );

      let user1GiftCount2 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount1);

      assert.equal(
        Number(user1GiftCount2),
        7,
        "user1 gift count is not correct"
      );
    });

    /////////////////-------------------------------------- updateReferralTreePayments ------------------------------------------------

    it("should updateReferralTreePayments successfully and check data to be ok", async () => {
      await regularSaleInstance
        .updateReferralTreePayments(100, 200, { from: userAccount6 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const planterFund1 = Units.convert("0.5", "eth", "wei");
      const referralFund1 = Units.convert("0.1", "eth", "wei");

      let tx = await regularSaleInstance.updateReferralTreePayments(
        planterFund1,
        referralFund1,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(tx, "ReferralTreePaymentsUpdated", (ev) => {
        return (
          Number(ev.referralTreePaymentToPlanter) == Number(planterFund1) &&
          Number(ev.referralTreePaymentToAmbassador) == Number(referralFund1)
        );
      });

      const settedPlanterFund1 =
        await regularSaleInstance.referralTreePaymentToPlanter.call();
      const settedReferralFund1 =
        await regularSaleInstance.referralTreePaymentToAmbassador.call();

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

      let tx2 = await regularSaleInstance.updateReferralTreePayments(
        planterFund2,
        referralFund2,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(tx2, "ReferralTreePaymentsUpdated", (ev) => {
        return (
          Number(ev.referralTreePaymentToPlanter) == Number(planterFund2) &&
          Number(ev.referralTreePaymentToAmbassador) == Number(referralFund2)
        );
      });

      const settedPlanterFund2 =
        await regularSaleInstance.referralTreePaymentToPlanter.call();
      const settedReferralFund2 =
        await regularSaleInstance.referralTreePaymentToAmbassador.call();

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

    ////--------------------------------------- test updateReferralTriggerCount -----------------------

    it("Should updateReferralTriggerCount successFully", async () => {
      ////----------------Should updateReferralTriggerCount reject (onlyDataManager)
      await regularSaleInstance
        .updateReferralTriggerCount(10, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      /////--------------------Should updateReferralTriggerCount successFully

      assert.equal(
        Number(await regularSaleInstance.referralTriggerCount()),
        20
      );

      await regularSaleInstance
        .updateReferralTriggerCount(0, {
          from: dataManager,
        })
        .should.be.rejectedWith(RegularSaleErrors.COUNT_MUST_BE_GT_ZERO);

      let tx = await regularSaleInstance.updateReferralTriggerCount(8, {
        from: dataManager,
      });

      assert.equal(Number(await regularSaleInstance.referralTriggerCount()), 8);

      truffleAssert.eventEmitted(tx, "ReferralTriggerCountUpdated", (ev) => {
        return Number(ev.count) == 8;
      });
    });

    /////----------------------------claim gift
    it("should fail claimReferralReward", async () => {
      await regularSaleInstance
        .claimReferralReward({ from: userAccount1 })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_GIFT_OWNER);
    });
  });

  describe("with financial section", () => {
    beforeEach(async () => {
      regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      daiFundInstance = await DaiFund.new({
        from: deployerAccount,
      });

      await daiFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundsInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundsInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await Common.prepareAttributeDex(
        UniswapV2Router02New,
        Factory,
        TestUniswap,
        Token,
        attributeInstance,
        deployerAccount
      );

      await regularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );
    });

    it("test regular initialize (set maxTreeSupply==10001) ==> regular stop", async () => {
      let funder = userAccount3;

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("10000"));

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(1, 1000000, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- fundTree --------------------------

      await regularSaleInstance.updateMaxTreeSupply(10001, {
        from: dataManager,
      });

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("10000"),
        {
          from: funder,
        }
      );

      await regularSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.MAX_SUPPLY);

      await regularSaleInstance
        .fundTreeById(10001, zeroAddress, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_TREE);
    });

    /////////////////---------------------------------set lastFundedTreeId address--------------------------------------------------------

    it("Should lastFundedTreeId work successfully", async () => {
      let funder = userAccount3;

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("10000"));

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(1, 1000000, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- handle referral referralTriggerCount ----------------

      await regularSaleInstance.updateReferralTriggerCount(10, {
        from: dataManager,
      });

      ///////////////////////--------------------- fundTree --------------------------

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("10000"),
        {
          from: funder,
        }
      );

      await regularSaleInstance.fundTree(7, userAccount5, zeroAddress, {
        from: funder,
      });

      // ///-------------------- check attributes

      let tokentOwner;
      let attributes;
      for (let i = 10001; i < 10008; i++) {
        ///////check token owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, funder, "funder not true " + i);
        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10000).should.be.rejected;
      await treeTokenInstance.ownerOf(10008).should.be.rejected;

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10007,
        "lastFundedTreeId not true"
      );

      Common.addDataManager(arInstance, userAccount1, deployerAccount);

      let tx = await regularSaleInstance.updateLastFundedTreeId(13333, {
        from: userAccount1,
      });

      truffleAssert.eventEmitted(tx, "LastFundedTreeIdUpdated", (ev) => {
        return Number(ev.lastFundedTreeId) == 13333;
      });

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount5),
        7
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount5),
        0
      );

      /////////////////////////

      await regularSaleInstance.fundTree(7, userAccount5, zeroAddress, {
        from: funder,
      });

      ///----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount5),
        4
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount5),
        1
      );

      for (let i = 13334; i < 13340; i++) {
        ///check owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, funder, "funder not true " + i);

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(13333).should.be.rejected;
      await treeTokenInstance.ownerOf(13341).should.be.rejected;

      let lastFundedTreeId2 = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId2),
        13340,
        "lastFundedTreeId not true"
      );

      ///--------------check Max supply reached

      await regularSaleInstance.updateLastFundedTreeId(999993, {
        from: dataManager,
      });

      await regularSaleInstance.fundTree(4, userAccount5, zeroAddress, {
        from: funder,
      });

      await regularSaleInstance
        .fundTree(4, userAccount5, zeroAddress, {
          from: funder,
        })
        .should.be.rejectedWith(RegularSaleErrors.MAX_SUPPLY);

      await regularSaleInstance.updateMaxTreeSupply(1000002, {
        from: dataManager,
      });

      await regularSaleInstance.fundTree(4, userAccount5, zeroAddress, {
        from: funder,
      });

      await daiInstance.resetAcc(funder);
    });

    /////////////////////// -------------------------------------- request trees ----------------------------------------------------
    it("Should request trees successfully", async () => {
      let funder = userAccount3;

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("49"));

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10007, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- fundTree --------------------------

      let funderBalanceBefore = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceBefore),
        web3.utils.toWei("49"),
        "1-funder balance not true"
      );

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("49"),
        {
          from: funder,
        }
      );

      let requestTx = await regularSaleInstance.fundTree(
        7,
        zeroAddress,
        zeroAddress,
        {
          from: funder,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      /////////////////////////////////////////////////////////

      for (let i = 10001; i <= 10007; i++) {
        truffleAssert.eventEmitted(requestTx, "RegularMint", (ev) => {
          return (
            ev.recipient == funder &&
            ev.treeId == i &&
            Number(ev.price) == Number(web3.utils.toWei("7"))
          );
        });
      }

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 7 &&
          ev.funder == funder &&
          ev.recipient == funder &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 7)
        );
      });

      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("23.52")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("25.48")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;
      for (let i = 10001; i < 10008; i++) {
        //////////// check tree owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, funder, "funder not true " + i);

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10000).should.be.rejected;
      await treeTokenInstance.ownerOf(10008).should.be.rejected;

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10007,
        "lastFundedTreeId not true"
      );

      let funderBalanceAfter = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      // check funds (planterFund && DaiFund)

      let amount = Number(web3.utils.toWei("49"));

      let expected = {
        planterFund: (40 * amount) / 100,
        referralFund: (12 * amount) / 100,
        research: (12 * amount) / 100,
        localDevelopment: (12 * amount) / 100,
        insurance: (12 * amount) / 100,
        treasury: (12 * amount) / 100,
        reserve1: (0 * amount) / 100,
        reserve2: (0 * amount) / 100,
      };

      //check wethFund totalBalances treeId2
      let totalBalances2 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        expected.research,
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        expected.localDevelopment,
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        expected.insurance,
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        expected.treasury,
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        expected.reserve1,
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        expected.reserve2,
        "2-reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "2-totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "2-totalFund ambassador funds invalid"
      );

      for (let i = 10001; i < 10008; i++) {
        let planterFunds2 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds2 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

    it("Should request trees successfully (recipient)", async () => {
      let funder = userAccount3;

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("49"));

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10007, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- fundTree --------------------------

      let funderBalanceBefore = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceBefore),
        web3.utils.toWei("49"),
        "1-funder balance not true"
      );

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("49"),
        {
          from: funder,
        }
      );

      let recipient = userAccount1;

      let requestTx = await regularSaleInstance.fundTree(
        7,
        zeroAddress,
        recipient,
        {
          from: funder,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      /////////////////////////////////////////////////////////

      for (let i = 10001; i <= 10007; i++) {
        truffleAssert.eventEmitted(requestTx, "RegularMint", (ev) => {
          return (
            ev.recipient == recipient &&
            ev.treeId == i &&
            Number(ev.price) == Number(web3.utils.toWei("7"))
          );
        });
      }

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 7 &&
          ev.funder == funder &&
          ev.recipient == recipient &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 7)
        );
      });

      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("23.52")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("25.48")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;
      for (let i = 10001; i < 10008; i++) {
        //////////// check tree owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, recipient, "recipient not true " + i);

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10000).should.be.rejected;
      await treeTokenInstance.ownerOf(10008).should.be.rejected;

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10007,
        "lastFundedTreeId not true"
      );

      let funderBalanceAfter = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      // check funds (planterFund && DaiFund)

      let amount = Number(web3.utils.toWei("49"));

      let expected = {
        planterFund: (40 * amount) / 100,
        referralFund: (12 * amount) / 100,
        research: (12 * amount) / 100,
        localDevelopment: (12 * amount) / 100,
        insurance: (12 * amount) / 100,
        treasury: (12 * amount) / 100,
        reserve1: (0 * amount) / 100,
        reserve2: (0 * amount) / 100,
      };

      //check wethFund totalBalances treeId2
      let totalBalances2 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        expected.research,
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        expected.localDevelopment,
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        expected.insurance,
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        expected.treasury,
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        expected.reserve1,
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        expected.reserve2,
        "2-reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "2-totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "2-totalFund ambassador funds invalid"
      );

      for (let i = 10001; i < 10008; i++) {
        let planterFunds2 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds2 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10007, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- handle referral  ----------------

      await regularSaleInstance.updateReferralTriggerCount(2, {
        from: dataManager,
      });

      ///////////////////////--------------------- fundTree --------------------------

      await regularSaleInstance.updatePrice(web3.utils.toWei("8"), {
        from: dataManager,
      });

      let funderBalanceBefore = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceBefore),
        web3.utils.toWei("56"),
        "1-funder balance not true"
      );

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("56"),
        {
          from: funder,
        }
      );

      let requestTx = await regularSaleInstance.fundTree(
        7,
        userAccount6,
        zeroAddress,
        {
          from: funder,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount6),
        1
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount6),
        3
      );

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 7 &&
          ev.funder == funder &&
          ev.recipient == funder &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("8"), 7)
        );
      });

      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("33.6")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("22.4")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;
      for (let i = 10001; i < 10008; i++) {
        ///////////// check token owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, funder, "funder not true " + i);

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10000).should.be.rejected;
      await treeTokenInstance.ownerOf(10008).should.be.rejected;

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10007,
        "lastFundedTreeId not true"
      );

      let funderBalanceAfter = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      // check funds (planterFund && DaiFund)

      let amount = Number(web3.utils.toWei("56"));

      let expected = {
        planterFund: (25 * amount) / 100,
        referralFund: (15 * amount) / 100,
        research: (12 * amount) / 100,
        localDevelopment: (12 * amount) / 100,
        insurance: (12 * amount) / 100,
        treasury: (12 * amount) / 100,
        reserve1: (12 * amount) / 100,
        reserve2: (0 * amount) / 100,
      };

      //check wethFund totalBalances treeId2
      let totalBalances2 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        expected.research,
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        expected.localDevelopment,
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        expected.insurance,
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        expected.treasury,
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        expected.reserve1,
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        expected.reserve2,
        "2-reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "2-totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "2-totalFund ambassador funds invalid"
      );

      for (let i = 10001; i < 10008; i++) {
        let planterFunds2 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds2 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

    it("2.should request trees successfully (recipient)", async () => {
      const price = Units.convert("7", "eth", "wei");
      const birthDate = parseInt(new Date().getTime() / 1000);
      const countryCode = 2;
      const planter = userAccount2;
      const ipfsHash = "some ipfs hash here";

      let funder = userAccount3;

      /////////////////////////-------------------- deploy contracts --------------------------
      let planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      //mint dai for funder
      await daiInstance.setMint(funder, web3.utils.toWei("56"));

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10007, 0, {
        from: dataManager,
      });

      ///------------------------------------------------------

      ///////////////////// ------------------- handle addresses here --------------------------

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///------------------------------ plant tree ------------------------

      await Common.plantTreeSuccess(
        arInstance,
        treeFactoryInstance,
        planterInstance,
        ipfsHash,
        birthDate,
        countryCode,
        planter,
        deployerAccount
      );

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      let travelTime = Math.add(Math.mul(4, 3600), Math.mul(7 * 24, 3600));

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      await treeFactoryInstance.updateTree(10001, ipfsHash, {
        from: planter,
      });

      await treeFactoryInstance.verifyUpdate(10001, true, {
        from: dataManager,
      });

      ///////////////////////--------------------- handle referral  ----------------

      await regularSaleInstance.updateReferralTriggerCount(2, {
        from: dataManager,
      });

      ///////////////////////--------------------- fundTree --------------------------

      await regularSaleInstance.updatePrice(web3.utils.toWei("8"), {
        from: dataManager,
      });

      let funderBalanceBefore = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceBefore),
        web3.utils.toWei("56"),
        "1-funder balance not true"
      );

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("56"),
        {
          from: funder,
        }
      );

      let recipient = userAccount7;

      let requestTx = await regularSaleInstance.fundTree(
        7,
        userAccount6,
        recipient,
        {
          from: funder,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount6),
        1
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount6),
        3
      );

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 7 &&
          ev.funder == funder &&
          ev.recipient == recipient &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("8"), 7)
        );
      });

      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("33.6")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("22.4")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;

      ////check tree status

      const tree10001 = await treeFactoryInstance.trees.call(10001);

      assert.equal(Number(tree10001.treeStatus), 172, "treeStatus not true");

      for (let i = 10001; i < 10008; i++) {
        ///////////// check token owner
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, recipient, "funder not true " + i);

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10000).should.be.rejected;
      await treeTokenInstance.ownerOf(10008).should.be.rejected;

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10007,
        "lastFundedTreeId not true"
      );

      let funderBalanceAfter = await daiInstance.balanceOf(funder);

      assert.equal(
        Number(funderBalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      // check funds (planterFund && DaiFund)

      let amount = Number(web3.utils.toWei("56"));

      let expected = {
        planterFund: (25 * amount) / 100,
        referralFund: (15 * amount) / 100,
        research: (12 * amount) / 100,
        localDevelopment: (12 * amount) / 100,
        insurance: (12 * amount) / 100,
        treasury: (12 * amount) / 100,
        reserve1: (12 * amount) / 100,
        reserve2: (0 * amount) / 100,
      };

      //check wethFund totalBalances treeId2
      let totalBalances2 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        expected.research,
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        expected.localDevelopment,
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        expected.insurance,
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        expected.treasury,
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        expected.reserve1,
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        expected.reserve2,
        "2-reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "2-totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "2-totalFund ambassador funds invalid"
      );

      for (let i = 10001; i < 10008; i++) {
        let planterFunds2 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds2 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10003, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- handle referral referralTriggerCount ----------------

      await regularSaleInstance.updateReferralTriggerCount(2, {
        from: dataManager,
      });

      ///////////////////////--------------------- fundTree --------------------------

      //mint dai for funder
      await daiInstance.setMint(funder1, web3.utils.toWei("7"));

      let funder1BalanceBefore = await daiInstance.balanceOf(funder1);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx1 = await regularSaleInstance.fundTree(
        1,
        userAccount1,
        zeroAddress,
        {
          from: funder1,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount1),
        1
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount1),
        0
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx1, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder1 &&
          ev.recipient == funder1 &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder1BalanceAfter = await daiInstance.balanceOf(funder1);

      assert.equal(
        Number(funder1BalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      const daiFundBalanceAfter1 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter1 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter1 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter1),
        Number(web3.utils.toWei("3.36")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter1),
        Number(web3.utils.toWei("3.64")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter1),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;

      ////// check tree owner
      tokentOwner = await treeTokenInstance.ownerOf(10001);
      assert.equal(tokentOwner, funder1, "funder1 not true " + 10001);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10001);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10001} is inccorect`
      );

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10001,
        "lastFundedTreeId not true"
      );

      ///------------- funder2 -----------------

      //mint dai for funder
      await daiInstance.setMint(funder2, web3.utils.toWei("7"));

      let funder2BalanceBefore = await daiInstance.balanceOf(funder2);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx2 = await regularSaleInstance.fundTree(
        1,
        zeroAddress,
        zeroAddress,
        {
          from: funder2,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx2, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder2 &&
          ev.recipient == funder2 &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder2BalanceAfter = await daiInstance.balanceOf(funder2);

      assert.equal(
        Number(funder2BalanceAfter),
        web3.utils.toWei("0"),
        "4-funder balance not true"
      );

      const daiFundBalanceAfter2 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter2 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter2),
        Number(web3.utils.toWei("6.72")),
        "2-daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter2),
        Number(web3.utils.toWei("7.28")),
        "2-treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter2),
        0,
        "2-regularSale balance not true"
      );

      tokentOwner = await treeTokenInstance.ownerOf(10002);
      assert.equal(tokentOwner, funder2, "funder2 not true " + 10002);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10002);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10002} is inccorect`
      );

      lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10002,
        "2.lastFundedTreeId not true"
      );

      ///------------- funder3 -----------------

      //mint dai for funder
      await daiInstance.setMint(funder3, web3.utils.toWei("7"));

      let funder3BalanceBefore = await daiInstance.balanceOf(funder3);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx = await regularSaleInstance.fundTree(
        1,
        userAccount1,
        zeroAddress,
        {
          from: funder3,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount1),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount1),
        1
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder3 &&
          ev.recipient == funder3 &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder3BalanceAfter = await daiInstance.balanceOf(funder3);

      assert.equal(
        Number(funder3BalanceAfter),
        web3.utils.toWei("0"),
        "3-funder balance not true"
      );

      const daiFundBalanceAfter3 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter3 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter3 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter3),
        Number(web3.utils.toWei("10.08")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter3),
        Number(web3.utils.toWei("10.92")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter3),
        0,
        "regularSale balance not true"
      );

      tokentOwner = await treeTokenInstance.ownerOf(10003);
      assert.equal(tokentOwner, funder3, "funder3 not true " + 10003);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10003);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10003} is inccorect`
      );

      lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10003,
        "3.lastFundedTreeId not true"
      );
      await daiInstance.resetAcc(funder1);
      await daiInstance.resetAcc(funder2);
      await daiInstance.resetAcc(funder3);
    });

    it("3.should request trees successfully (recipient) ", async () => {
      let funder1 = userAccount3;
      let funder2 = userAccount3;
      let funder3 = userAccount3;

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(10001, 10003, 0, {
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

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- handle referral referralTriggerCount ----------------

      await regularSaleInstance.updateReferralTriggerCount(2, {
        from: dataManager,
      });

      ///////////////////////--------------------- fundTree --------------------------

      //mint dai for funder
      await daiInstance.setMint(funder1, web3.utils.toWei("7"));

      let funder1BalanceBefore = await daiInstance.balanceOf(funder1);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let recipient = userAccount4;

      let requestTx1 = await regularSaleInstance.fundTree(
        1,
        userAccount1,
        recipient,
        {
          from: funder1,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount1),
        1
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount1),
        0
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx1, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder1 &&
          ev.recipient == recipient &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder1BalanceAfter = await daiInstance.balanceOf(funder1);

      assert.equal(
        Number(funder1BalanceAfter),
        web3.utils.toWei("0"),
        "2-funder balance not true"
      );

      const daiFundBalanceAfter1 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter1 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter1 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter1),
        Number(web3.utils.toWei("3.36")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter1),
        Number(web3.utils.toWei("3.64")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter1),
        0,
        "regularSale balance not true"
      );

      let tokentOwner;
      let attributes;

      ////// check tree owner
      tokentOwner = await treeTokenInstance.ownerOf(10001);
      assert.equal(tokentOwner, recipient, "funder1 not true " + 10001);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10001);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10001} is inccorect`
      );

      let lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10001,
        "lastFundedTreeId not true"
      );

      ///------------- funder2 -----------------

      let recipient2 = userAccount5;

      //mint dai for funder
      await daiInstance.setMint(funder2, web3.utils.toWei("7"));

      let funder2BalanceBefore = await daiInstance.balanceOf(funder2);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx2 = await regularSaleInstance.fundTree(
        1,
        zeroAddress,
        recipient2,
        {
          from: funder2,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx2, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder2 &&
          ev.recipient == recipient2 &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder2BalanceAfter = await daiInstance.balanceOf(funder2);

      assert.equal(
        Number(funder2BalanceAfter),
        web3.utils.toWei("0"),
        "4-funder balance not true"
      );

      const daiFundBalanceAfter2 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter2 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter2),
        Number(web3.utils.toWei("6.72")),
        "2-daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter2),
        Number(web3.utils.toWei("7.28")),
        "2-treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter2),
        0,
        "2-regularSale balance not true"
      );

      tokentOwner = await treeTokenInstance.ownerOf(10002);
      assert.equal(tokentOwner, recipient2, "recipient2 not true " + 10002);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10002);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10002} is inccorect`
      );

      lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10002,
        "2.lastFundedTreeId not true"
      );

      ///------------- funder3 -----------------

      //mint dai for funder
      await daiInstance.setMint(funder3, web3.utils.toWei("7"));

      let funder3BalanceBefore = await daiInstance.balanceOf(funder3);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let recipient3 = userAccount6;

      let requestTx = await regularSaleInstance.fundTree(
        1,
        userAccount1,
        recipient3,
        {
          from: funder3,
        }
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount1),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount1),
        1
      );

      /////////////////////////

      truffleAssert.eventEmitted(requestTx, "TreeFunded", (ev) => {
        return (
          Number(ev.count) == 1 &&
          ev.funder == funder3 &&
          ev.recipient == recipient3 &&
          Number(ev.amount) == Math.mul(web3.utils.toWei("7"), 1)
        );
      });

      let funder3BalanceAfter = await daiInstance.balanceOf(funder3);

      assert.equal(
        Number(funder3BalanceAfter),
        web3.utils.toWei("0"),
        "3-funder balance not true"
      );

      const daiFundBalanceAfter3 = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter3 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter3 = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter3),
        Number(web3.utils.toWei("10.08")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter3),
        Number(web3.utils.toWei("10.92")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter3),
        0,
        "regularSale balance not true"
      );

      tokentOwner = await treeTokenInstance.ownerOf(10003);
      assert.equal(tokentOwner, recipient3, "recipient3 not true " + 10003);

      //////////// check attributes
      attributes = await treeTokenInstance.attributes.call(10003);

      assert.equal(
        Number(attributes.generationType),
        1,
        `generationType for tree ${10003} is inccorect`
      );

      lastFundedTreeId = await regularSaleInstance.lastFundedTreeId();

      assert.equal(
        Number(lastFundedTreeId),
        10003,
        "3.lastFundedTreeId not true"
      );
      await daiInstance.resetAcc(funder1);
      await daiInstance.resetAcc(funder2);
      await daiInstance.resetAcc(funder3);
    });

    // ////--------------------------------gsn test--------------------------
    // it("test gsn [ @skip-on-coverage ]", async () => {
    //   ////////////// ------------------- handle allocation data ----------------------

    //   await allocationInstance.addAllocationData(
    //     4000,
    //     1200,
    //     1200,
    //     1200,
    //     1200,
    //     1200,
    //     0,
    //     0,
    //     {
    //       from: dataManager,
    //     }
    //   );

    //   await allocationInstance.assignAllocationToTree(10001, 10007, 0, {
    //     from: dataManager,
    //   });

    //   /////////////////////////-------------------- deploy contracts --------------------------

    //   let planterInstance = await Planter.new({
    //     from: deployerAccount,
    //   });

    //   await planterInstance.initialize(arInstance.address, {
    //     from: deployerAccount,
    //   });

    //   ///////////////////// ------------------- handle address here --------------------------

    //   await regularSaleInstance.setTreeFactoryAddress(
    //     treeFactoryInstance.address,
    //     { from: deployerAccount }
    //   );

    //   await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await regularSaleInstance.setAllocationAddress(
    //     allocationInstance.address,
    //     {
    //       from: deployerAccount,
    //     }
    //   );

    //   //-------------daiFundInstance

    //   await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await daiFundInstance.setPlanterFundContractAddress(
    //     planterFundsInstnce.address,
    //     {
    //       from: deployerAccount,
    //     }
    //   );

    //   //-------------treeFactoryInstance

    //   await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await treeFactoryInstance.setPlanterContractAddress(
    //     planterInstance.address,
    //     {
    //       from: deployerAccount,
    //     }
    //   );

    //   await regularSaleInstance.setAttributesAddress(
    //     attributeInstance.address,
    //     { from: deployerAccount }
    //   );

    //   await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
    //     from: deployerAccount,
    //   });

    //   ///////////////////////// -------------------- handle roles here ----------------

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     regularSaleInstance.address,
    //     deployerAccount
    //   );

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     treeFactoryInstance.address,
    //     deployerAccount
    //   );

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     daiFundInstance.address,
    //     deployerAccount
    //   );

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     attributeInstance.address,
    //     deployerAccount
    //   );

    //   ///////------------------------------handle gsn---------------------------------

    //   let env = await GsnTestEnvironment.startGsn("localhost");

    //   const { forwarderAddress, relayHubAddress } = env.contractsDeployment;

    //   await regularSaleInstance.setTrustedForwarder(forwarderAddress, {
    //     from: deployerAccount,
    //   });

    //   let paymaster = await WhitelistPaymaster.new(arInstance.address);

    //   await paymaster.setRelayHub(relayHubAddress);
    //   await paymaster.setTrustedForwarder(forwarderAddress);

    //   web3.eth.sendTransaction({
    //     from: accounts[0],
    //     to: paymaster.address,
    //     value: web3.utils.toWei("1"),
    //   });

    //   origProvider = web3.currentProvider;

    //   conf = { paymasterAddress: paymaster.address };

    //   gsnProvider = await Gsn.RelayProvider.newProvider({
    //     provider: origProvider,
    //     config: conf,
    //   }).init();

    //   provider = new ethers.providers.Web3Provider(gsnProvider);

    //   let signerFunder = provider.getSigner(3);

    //   let contractFunder = await new ethers.Contract(
    //     regularSaleInstance.address,
    //     regularSaleInstance.abi,
    //     signerFunder
    //   );

    //   //mint dai for funder
    //   await daiInstance.setMint(userAccount2, web3.utils.toWei("7"));

    //   await daiInstance.balanceOf(userAccount2);

    //   await daiInstance.approve(
    //     regularSaleInstance.address,
    //     web3.utils.toWei("7"),
    //     {
    //       from: userAccount2,
    //     }
    //   );

    //   let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

    //   await paymaster.addPlanterWhitelistTarget(regularSaleInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await contractFunder
    //     .fundTree(1, zeroAddress, zeroAddress, {
    //       from: userAccount2,
    //     })
    //     .should.be.rejectedWith(CommonErrorMsg.CHECK_PLANTER);

    //   await paymaster.removePlanterWhitelistTarget(
    //     regularSaleInstance.address,
    //     {
    //       from: deployerAccount,
    //     }
    //   );
    //   await paymaster.addFunderWhitelistTarget(regularSaleInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await contractFunder.fundTree(1, zeroAddress, zeroAddress, {
    //     from: userAccount2,
    //   });

    //   let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

    //   console.log("balanceAccountBefore", Number(balanceAccountBefore));
    //   console.log("balanceAccountAfter", Number(balanceAccountAfter));

    //   assert.equal(
    //     balanceAccountAfter,
    //     balanceAccountBefore,
    //     "Gsn not true work"
    //   );
    // });

    ////////////////////// ------------------------------------------- request tree by id ---------------------------------------------------
    it("should request tree by id successfully", async () => {
      const price = Units.convert("7", "eth", "wei");
      const birthDate = parseInt(new Date().getTime() / 1000);
      const countryCode = 2;
      const planter = userAccount2;
      const ipfsHash = "some ipfs hash here";

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(1, 100000, 0, {
        from: dataManager,
      });

      ///////////////////// ------------------------- handle tree price ------------------------

      let tx = await regularSaleInstance.updatePrice(price, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(tx, "PriceUpdated", (ev) => {
        return Number(ev.price) == Number(price);
      });
      /////////////////////////-------------------- deploy contracts --------------------------

      let planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      ///////////////////// ------------------- handle addresses here --------------------------

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      //////////////////-------------------------- plant regualar -----------------

      await Common.plantTreeSuccess(
        arInstance,
        treeFactoryInstance,
        planterInstance,
        ipfsHash,
        birthDate,
        countryCode,
        planter,
        deployerAccount
      );

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(1, true, {
        from: dataManager,
      });

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(2, true, {
        from: dataManager,
      });

      let travelTime = Math.add(Math.mul(4, 3600), Math.mul(7 * 24, 3600));

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      await treeFactoryInstance.updateTree(10001, ipfsHash, {
        from: planter,
      });

      await treeFactoryInstance.verifyUpdate(10001, true, {
        from: dataManager,
      });

      ///////////////////////////////////////////

      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("14"));

      let funder1BalanceBefore = await daiInstance.balanceOf(userAccount1);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx = await regularSaleInstance.fundTreeById(
        10001,
        userAccount7,
        zeroAddress,
        {
          from: userAccount1,
        }
      );

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(10001),
        userAccount1,
        "funder1 not true " + 10001
      );

      //////////// check attributes

      assert.equal(
        Number((await treeTokenInstance.attributes.call(10001)).generationType),
        1,
        `generationType for tree ${10001} is inccorect`
      );

      ////check tree status

      const tree10001 = await treeFactoryInstance.trees.call(10001);

      assert.equal(Number(tree10001.treeStatus), 172, "treeStatus not true");

      ///////////////////////
      await daiInstance.setMint(userAccount2, web3.utils.toWei("7"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("7"),
        {
          from: userAccount2,
        }
      );

      await regularSaleInstance.fundTreeById(10002, userAccount7, zeroAddress, {
        from: userAccount2,
      });

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(10002),
        userAccount2,
        "funder1 not true " + 10002
      );

      //////////// check attributes

      assert.equal(
        Number((await treeTokenInstance.attributes.call(10002)).generationType),
        1,
        `generationType for tree ${10002} is inccorect`
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount7),
        2
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount7),
        0
      );

      /////////////////////////////////////////////////////

      let funder1BalanceAfter = await daiInstance.balanceOf(userAccount1);

      assert.equal(
        Number(funder1BalanceAfter),
        web3.utils.toWei("7"),
        "2-funder balance not true"
      );

      truffleAssert.eventEmitted(requestTx, "TreeFundedById", (ev) => {
        return (
          Number(ev.treeId) == 10001 &&
          ev.funder == userAccount1 &&
          Number(ev.amount) == Number(web3.utils.toWei("7"))
        );
      });

      ///---------test supply

      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("1000"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance.updateLastFundedTreeId(1000000, {
        from: dataManager,
      });

      await regularSaleInstance
        .fundTreeById(1000001, userAccount7, zeroAddress, {
          from: userAccount2,
        })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_TREE);

      await regularSaleInstance.updateMaxTreeSupply(1000001, {
        from: dataManager,
      });

      await daiInstance.resetAcc(userAccount1);
      await daiInstance.resetAcc(userAccount2);
    });

    ////////////////////// ------------------------------------------- request tree by id ---------------------------------------------------
    it("should request tree by id successfully (with recipient)", async () => {
      const price = Units.convert("7", "eth", "wei");
      const birthDate = parseInt(new Date().getTime() / 1000);
      const countryCode = 2;
      const planter = userAccount2;
      const ipfsHash = "some ipfs hash here";

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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

      await allocationInstance.assignAllocationToTree(1, 100000, 0, {
        from: dataManager,
      });

      ///////////////////// ------------------------- handle tree price ------------------------

      let tx = await regularSaleInstance.updatePrice(price, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(tx, "PriceUpdated", (ev) => {
        return Number(ev.price) == Number(price);
      });
      /////////////////////////-------------------- deploy contracts --------------------------

      let planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      ///////////////////// ------------------- handle addresses here --------------------------

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      //////////////////-------------------------- plant regualar -----------------

      await Common.plantTreeSuccess(
        arInstance,
        treeFactoryInstance,
        planterInstance,
        ipfsHash,
        birthDate,
        countryCode,
        planter,
        deployerAccount
      );

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(1, true, {
        from: dataManager,
      });

      /////////////////////////////////////////////////////

      let recipient = userAccount3;

      await daiInstance.setMint(userAccount2, web3.utils.toWei("7"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("7"),
        {
          from: userAccount2,
        }
      );

      await regularSaleInstance.fundTreeById(10002, userAccount7, recipient, {
        from: userAccount2,
      });

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(10002),
        userAccount3,
        "funder1 not true " + 10002
      );

      //////////// check attributes

      assert.equal(
        Number((await treeTokenInstance.attributes.call(10002)).generationType),
        1,
        `generationType for tree ${10002} is inccorect`
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(userAccount7),
        1
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(userAccount7),
        0
      );

      ///////////////////////////////////////////

      let recipient2 = userAccount5;

      //mint dai for funder
      await daiInstance.setMint(userAccount1, web3.utils.toWei("14"));

      let funder1BalanceBefore = await daiInstance.balanceOf(userAccount1);

      await daiInstance.approve(
        regularSaleInstance.address,
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

      let requestTx = await regularSaleInstance.fundTreeById(
        10001,
        userAccount7,
        recipient2,
        {
          from: userAccount1,
        }
      );

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(10001),
        recipient2,
        "funder1 not true " + 10001
      );

      //////////// check attributes

      assert.equal(
        Number((await treeTokenInstance.attributes.call(10001)).generationType),
        1,
        `generationType for tree ${10001} is inccorect`
      );

      let funder1BalanceAfter = await daiInstance.balanceOf(userAccount1);

      assert.equal(
        Number(funder1BalanceAfter),
        web3.utils.toWei("7"),
        "2-funder balance not true"
      );

      truffleAssert.eventEmitted(requestTx, "TreeFundedById", (ev) => {
        return (
          Number(ev.treeId) == 10001 &&
          ev.funder == userAccount1 &&
          ev.recipient == recipient2 &&
          Number(ev.amount) == Number(web3.utils.toWei("7"))
        );
      });

      await daiInstance.resetAcc(userAccount1);
      await daiInstance.resetAcc(userAccount2);
    });

    it("should check data to be ok after request tree", async () => {
      const price = Units.convert("7", "eth", "wei");
      const birthDate = parseInt(new Date().getTime() / 1000);
      const countryCode = 2;
      const planter = userAccount2;
      const ipfsHash = "some ipfs hash here";
      const treeId = 10001;

      ////////////// ------------------- handle allocation data ----------------------

      await allocationInstance.addAllocationData(
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
        research: Math.divide(Math.mul(12, transferTreePrice), 100),
        localDevelopment: Math.divide(Math.mul(12, transferTreePrice), 100),
        insurance: Math.divide(Math.mul(12, transferTreePrice), 100),
        treasury: Math.divide(Math.mul(12, transferTreePrice), 100),
        reserve1: Math.divide(Math.mul(5, transferTreePrice), 100),
        reserve2: Math.divide(Math.mul(5, transferTreePrice), 100),
      };

      await allocationInstance.assignAllocationToTree(1, 100000, 0, {
        from: dataManager,
      });

      ///////////////////// ------------------------- handle tree price ------------------------

      let tx = await regularSaleInstance.updatePrice(price, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(tx, "PriceUpdated", (ev) => {
        return Number(ev.price) == Number(price);
      });

      ////////////// ---------------- handle deploy --------------------------

      let planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
      ///////////////////// ------------------- handle addresses here --------------------------

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------treeFactoryInstance

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////////////////--------------------- handle referral referralTriggerCount ----------------

      await regularSaleInstance.updateReferralTriggerCount(1, {
        from: dataManager,
      });

      //////////////////-------------------------- plant regualar -----------------

      await Common.plantTreeSuccess(
        arInstance,
        treeFactoryInstance,
        planterInstance,
        ipfsHash,
        birthDate,
        countryCode,
        planter,
        deployerAccount
      );

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(1, true, {
        from: dataManager,
      });

      ///////////////////////////////////////////

      /////////////--------------------- check total fund before request

      const totalBalancesBefore = await daiFundInstance.totalBalances();
      const totalPlanterFundsBefore = await planterFundsInstnce.totalBalances();

      assert.equal(
        Number(totalPlanterFundsBefore.planter),
        0,
        "invalid planter fund"
      );

      assert.equal(
        Number(totalPlanterFundsBefore.ambassador),
        0,
        "invalid ambassador fund"
      );

      assert.equal(
        Number(totalBalancesBefore.research),
        0,
        "invalid research fund"
      );

      assert.equal(
        Number(totalBalancesBefore.localDevelopment),
        0,
        "invalid local development fund"
      );
      assert.equal(
        Number(totalBalancesBefore.insurance),
        0,
        "invalid insurance fund"
      );

      assert.equal(
        Number(totalBalancesBefore.treasury),
        0,
        "Invalid treeIdjer develop fund"
      );

      assert.equal(
        Number(totalBalancesBefore.reserve1),
        0,
        "invalid other fund1"
      );

      assert.equal(
        Number(totalBalancesBefore.reserve2),
        0,
        "invalid other fund2"
      );

      ////////////////// ---------------- check tree before -----------------------

      const treeBefore = await treeFactoryInstance.trees.call(treeId);

      assert.equal(Number(treeBefore.treeStatus), 4, "Invalid treeId status");

      assert.equal(
        Number(treeBefore.saleType),
        4,
        "Invalid treeId provide status"
      );

      ///////////////////////////---------------------- check treasury and regular sell balance after request

      const daiFundBalanceBefore = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceBefore = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceBefore = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(Number(daiFundBalanceBefore), 0, "daiFund balance not true");

      assert.equal(
        Number(planterFundsBalanceBefore),
        0,
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceBefore),
        0,
        "regularSale balance not true"
      );

      ///////////////// ----------------- request tree -------------------------------------------

      await regularSaleInstance.updatePrice(web3.utils.toWei("10"), {
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
        regularSaleInstance.address,
        web3.utils.toWei("10"),
        {
          from: userAccount1,
        }
      );

      const requestTx = await regularSaleInstance.fundTreeById(
        treeId,
        userAccount3,
        zeroAddress,
        {
          from: userAccount1,
        }
      );

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(treeId),
        userAccount1,
        "funder1 not true " + treeId
      );

      //////////// check attributes

      assert.equal(
        Number(
          (await treeTokenInstance.attributes.call(treeId)).generationType
        ),
        1,
        `generationType for tree ${treeId} is inccorect`
      );

      /////----------------------------check referrer tree balance
      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      truffleAssert.eventEmitted(requestTx, "TreeFundedById", (ev) => {
        return (
          Number(ev.treeId) == treeId &&
          ev.funder == userAccount1 &&
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

      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const regularSaleBalanceAfter = await daiInstance.balanceOf(
        regularSaleInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("5.8")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("4.2")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      assert.equal(
        Number(regularSaleBalanceAfter),
        0,
        "regularSale balance not true"
      );

      ////////////////////// ----------------------- check token owner before

      const tokentOwnerAfter = await treeTokenInstance.ownerOf(treeId);

      assert.equal(tokentOwnerAfter, userAccount1, "invalid token owner");

      ////////////////// ---------------- check tree after request-----------------------

      const treeAfter = await treeFactoryInstance.trees.call(treeId);

      assert.equal(Number(treeAfter.treeStatus), 4, "Invalid treeId status");

      assert.equal(
        Number(treeAfter.saleType),
        0,
        "Invalid treeId provide status"
      );

      ////////////////// ---------------------- check total fund after request

      const totalBalancesAfter = await daiFundInstance.totalBalances();

      const totalPlanterFundsAfter = await planterFundsInstnce.totalBalances();

      assert.equal(
        Number(totalPlanterFundsAfter.planter),
        expected.planterFund,
        "invalid planter fund"
      );

      assert.equal(
        Number(totalPlanterFundsAfter.ambassador),
        expected.referralFund,
        "invalid ambassador fund"
      );

      assert.equal(
        Number(totalBalancesAfter.research),
        expected.research,
        "invalid research fund"
      );

      assert.equal(
        Number(totalBalancesAfter.localDevelopment),
        expected.localDevelopment,
        "invalid local development fund"
      );

      assert.equal(
        Number(totalBalancesAfter.insurance),
        expected.insurance,
        "invalid insurance fund"
      );

      assert.equal(
        Number(totalBalancesAfter.treasury),
        expected.treasury,
        "Invalid treeIdjer develop fund"
      );

      assert.equal(
        Number(totalBalancesAfter.reserve1),
        expected.reserve1,
        "invalid other fund1"
      );

      assert.equal(
        Number(totalBalancesAfter.reserve2),
        expected.reserve2,
        "invalid other fund2"
      );

      //tree2

      await daiInstance.setMint(userAccount1, web3.utils.toWei("10"));

      await daiInstance.approve(
        regularSaleInstance.address,
        web3.utils.toWei("10"),
        {
          from: userAccount1,
        }
      );

      await regularSaleInstance.fundTreeById(10002, zeroAddress, zeroAddress, {
        from: userAccount1,
      });

      ////// check tree owner

      assert.equal(
        await treeTokenInstance.ownerOf(10002),
        userAccount1,
        "funder1 not true " + 10002
      );

      //////////// check attributes

      assert.equal(
        Number((await treeTokenInstance.attributes.call(10002)).generationType),
        1,
        `generationType for tree ${10002} is inccorect`
      );

      assert.equal(
        await regularSaleInstance.referrerCount.call(zeroAddress),
        0
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0
      );

      await daiInstance.resetAcc(userAccount1);
    });

    /////-----------------------claimReferralReward

    it("should claimReferralReward less than 70 succuesfully", async () => {
      const planterShare = await web3.utils.toWei("2");
      const referralShare = await web3.utils.toWei("1");

      const price = Units.convert("7", "eth", "wei");

      ///////////// deploy TestRegularSale and set address

      testRegularSaleInstance = await TestRegularSale.new({
        from: deployerAccount,
      });

      await testRegularSaleInstance.initialize(arInstance.address, price, {
        from: deployerAccount,
      });

      ///////////// deploy weth funds and set address

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await testRegularSaleInstance.setWethFundAddress(
        wethFundInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await testRegularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      //////////////------------- setup

      await Common.addTreejerContractRole(
        arInstance,
        testRegularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      await testRegularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await testRegularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await testRegularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await daiInstance.setMint(
        daiFundInstance.address,
        web3.utils.toWei("1000")
      );

      await daiFundInstance.fundTreeBatch(
        web3.utils.toWei("1"),
        0,
        0,
        0,
        0,
        web3.utils.toWei("1000"),
        0,
        0,
        {
          from: deployerAccount,
        }
      );

      await daiInstance.resetAcc(planterFundsInstnce.address);

      let txPlanterFund =
        await testRegularSaleInstance.updateReferralTreePayments(
          planterShare,
          referralShare,
          { from: dataManager }
        );

      truffleAssert.eventEmitted(
        txPlanterFund,
        "ReferralTreePaymentsUpdated",
        (ev) => {
          return (
            Number(ev.referralTreePaymentToPlanter) == Number(planterShare) &&
            Number(ev.referralTreePaymentToAmbassador) == Number(referralShare)
          );
        }
      );

      /////////////// claim 25 tree with user1

      await testRegularSaleInstance.updateRegularReferrerGift(
        userAccount1,
        25,
        {
          from: userAccount8,
        }
      );

      assert.equal(
        Number(await wethFundInstance.totalDaiDebtToPlanterContract()),
        0,
        "user 1 gift after claim is not correct"
      );

      await testRegularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount1,
        25,
        {
          from: userAccount8,
        }
      );

      const user1GiftCountBeforeClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount1
        );

      assert.equal(
        Number(user1GiftCountBeforeClaim),
        25,
        "user 1 gift before claim is not correct"
      );

      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount1
          )
        ),
        25,
        "user 1 gift before claim is not correct"
      );

      await testRegularSaleInstance.claimReferralReward({ from: userAccount1 });

      //should fail no gift to claim
      await testRegularSaleInstance
        .claimReferralReward({ from: userAccount1 })
        .should.be.rejectedWith(RegularSaleErrors.INVALID_GIFT_OWNER);

      const user1GiftCountAfterClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount1
        );

      assert.equal(
        Number(user1GiftCountAfterClaim),
        0,
        "user 1 gift after claim is not correct"
      );

      ////-----------------check genesis referral-------------------
      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount1
          )
        ),
        0,
        "user 1 gift after claim is not correct"
      );

      assert.equal(
        Number(await wethFundInstance.totalDaiDebtToPlanterContract()),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 25),
        "user 1 gift after claim is not correct"
      );

      assert.equal(
        await daiInstance.balanceOf(planterFundsInstnce.address),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 25),
        "planterFund balance not true"
      );

      let tokentOwner;

      for (let i = 10001; i < 10051; i++) {
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, userAccount1, "funder not true " + i);
      }

      let lastTreeSold = await testRegularSaleInstance.lastFundedTreeId.call();

      assert.equal(lastTreeSold, 10050, "last sold is not correct");
      let planterFund;
      let referralFund;
      for (let i = 10001; i < 10051; i++) {
        planterFund =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        referralFund =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      let totalBalances = await planterFundsInstnce.totalBalances.call();
      assert.equal(
        Number(totalBalances.planter),
        Math.mul(50, Number(planterShare))
      );

      assert.equal(
        Number(totalBalances.ambassador),
        Math.mul(50, Number(referralShare))
      );

      /////////////// claim 10 tree with user2 (two tree is in use)
      await treeFactoryInstance.listTree(10053, "", { from: dataManager });
      await treeFactoryInstance.listTree(10055, "", { from: dataManager });

      await testRegularSaleInstance.updateRegularReferrerGift(
        userAccount2,
        10,
        {
          from: userAccount8,
        }
      );

      const user2GiftCountBeforeClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount2
        );

      assert.equal(
        Number(user2GiftCountBeforeClaim),
        10,
        "user 2 gift before claim is not correct"
      );

      await testRegularSaleInstance.claimReferralReward({ from: userAccount2 });

      const user2GiftCountAfterClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount2
        );

      assert.equal(
        Number(user2GiftCountAfterClaim),
        0,
        "user 1 gift after claim is not correct"
      );

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 35),
        "planterFund balance not true"
      );

      let tokentOwner2;

      for (let i = 10051; i < 10063; i++) {
        if ([10053, 10055].includes(i)) {
          await treeTokenInstance.ownerOf(i).should.be.rejected;
        } else {
          tokentOwner2 = await treeTokenInstance.ownerOf(i);
          assert.equal(tokentOwner2, userAccount2, "funder not true " + i);
        }
      }

      let lastTreeSold2 = await testRegularSaleInstance.lastFundedTreeId.call();

      assert.equal(lastTreeSold2, 10062, "last sold is not correct");
      let planterFund2;
      let referralFund2;
      for (let i = 10051; i < 10063; i++) {
        if ([10053, 10055].includes(i)) {
          planterFund2 =
            await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
          referralFund2 =
            await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

          assert.equal(Number(planterFund2), 0, "2-planterFund funds invalid");

          assert.equal(
            Number(referralFund2),
            0,
            "2-referralFund funds invalid"
          );
        } else {
          planterFund2 =
            await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
          referralFund2 =
            await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      let totalBalances2 = await planterFundsInstnce.totalBalances.call();
      assert.equal(
        Number(totalBalances2.planter),
        Math.mul(60, Number(planterShare))
      );

      assert.equal(
        Number(totalBalances2.ambassador),
        Math.mul(60, Number(referralShare))
      );

      // /////////////// -------------- claim 10 tree with new shares

      const planterShare2 = await web3.utils.toWei("3");
      const referralShare2 = await web3.utils.toWei("1.5");

      let txPlanterShare2 =
        await testRegularSaleInstance.updateReferralTreePayments(
          planterShare2,
          referralShare2,
          { from: dataManager }
        );

      truffleAssert.eventEmitted(
        txPlanterShare2,
        "ReferralTreePaymentsUpdated",
        (ev) => {
          return (
            Number(ev.referralTreePaymentToPlanter) == Number(planterShare2) &&
            Number(ev.referralTreePaymentToAmbassador) == Number(referralShare2)
          );
        }
      );

      await testRegularSaleInstance.updateRegularReferrerGift(
        userAccount3,
        10,
        {
          from: userAccount8,
        }
      );

      await testRegularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount3,
        50,
        {
          from: userAccount8,
        }
      );

      const user3GiftCountBeforeClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount3
        );

      assert.equal(
        Number(user3GiftCountBeforeClaim),
        10,
        "user 3 gift before claim is not correct"
      );

      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount3
          )
        ),
        50,
        "user 3 gift before claim is not correct"
      );

      await testRegularSaleInstance.claimReferralReward({ from: userAccount3 });

      const user3GiftCountAfterClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount3
        );

      assert.equal(
        Number(user3GiftCountAfterClaim),
        0,
        "user 3 gift after claim is not correct"
      );

      assert.equal(
        await daiInstance.balanceOf(planterFundsInstnce.address),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 35) +
          Math.mul(Math.add(Number(planterShare2), Number(referralShare2)), 10),
        "planterFund balance not true"
      );

      assert.equal(
        Number(await wethFundInstance.totalDaiDebtToPlanterContract()),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 25) +
          Math.mul(Math.add(Number(planterShare2), Number(referralShare2)), 40),
        "user 1 gift after claim is not correct"
      );

      let tokentOwner3;

      for (let i = 10063; i < 10113; i++) {
        tokentOwner3 = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner3, userAccount3, "funder not true " + i);
      }

      let lastTreeSold3 = await testRegularSaleInstance.lastFundedTreeId.call();

      assert.equal(lastTreeSold3, 10112, "last sold is not correct");
      let planterFund3;
      let referralFund3;
      for (let i = 10063; i < 10113; i++) {
        planterFund3 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        referralFund3 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      let totalBalances3 = await planterFundsInstnce.totalBalances.call();
      assert.equal(
        Number(totalBalances3.planter),
        Math.add(
          Math.mul(60, Number(planterShare)),
          Math.mul(50, Number(planterShare2))
        )
      );

      assert.equal(
        Number(totalBalances3.ambassador),
        Math.add(
          Math.mul(60, Number(referralShare)),
          Math.mul(50, Number(referralShare2))
        )
      );

      ////---------------step4

      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount3
          )
        ),
        10,
        "user 3 gift before claim is not correct"
      );

      await testRegularSaleInstance.claimReferralReward({ from: userAccount3 });

      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount3
          )
        ),
        0,
        "user 3 gift before claim is not correct"
      );

      assert.equal(
        await daiInstance.balanceOf(planterFundsInstnce.address),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 35) +
          Math.mul(Math.add(Number(planterShare2), Number(referralShare2)), 10),
        "planterFund balance not true"
      );

      assert.equal(
        Number(await wethFundInstance.totalDaiDebtToPlanterContract()),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 25) +
          Math.mul(Math.add(Number(planterShare2), Number(referralShare2)), 50),
        "user 1 gift after claim is not correct"
      );

      let tokentOwner4;

      for (let i = 10113; i < 10123; i++) {
        tokentOwner4 = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner4, userAccount3, "funder not true " + i);
      }

      let lastTreeSold4 = await testRegularSaleInstance.lastFundedTreeId.call();

      assert.equal(lastTreeSold4, 10122, "last sold is not correct");
      let planterFund4;
      let referralFund4;
      for (let i = 10113; i < 10123; i++) {
        planterFund4 =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        referralFund4 =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

        assert.equal(
          Number(planterFund4),
          Number(web3.utils.toWei("3")),
          "2-planterFund funds invalid"
        );

        assert.equal(
          Number(referralFund4),
          Number(web3.utils.toWei("1.5")),
          "2-referralFund funds invalid"
        );
      }

      let totalBalances4 = await planterFundsInstnce.totalBalances.call();
      assert.equal(
        Number(totalBalances4.planter),
        Math.add(
          Math.mul(60, Number(planterShare)),
          Math.mul(60, Number(planterShare2))
        )
      );

      assert.equal(
        Number(totalBalances4.ambassador),
        Math.add(
          Math.mul(60, Number(referralShare)),
          Math.mul(60, Number(referralShare2))
        )
      );
    });

    it("2-should claimReferralReward more than 70 succuesfully", async () => {
      const planterShare = await web3.utils.toWei("2");
      const referralShare = await web3.utils.toWei("1");

      const price = Units.convert("7", "eth", "wei");

      ///////////// deploy TestRegularSale and set address
      testRegularSaleInstance = await TestRegularSale.new({
        from: deployerAccount,
      });

      await testRegularSaleInstance.initialize(arInstance.address, price, {
        from: deployerAccount,
      });

      ///////////// deploy weth funds and set address
      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await testRegularSaleInstance.setWethFundAddress(
        wethFundInstance.address,
        {
          from: deployerAccount,
        }
      );

      //-------------daiFundInstance

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await testRegularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await testRegularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //////////////------------- setup

      await Common.addTreejerContractRole(
        arInstance,
        testRegularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      await testRegularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await testRegularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await testRegularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      let Tx = await testRegularSaleInstance.updateReferralTreePayments(
        planterShare,
        referralShare,
        { from: dataManager }
      );

      truffleAssert.eventEmitted(Tx, "ReferralTreePaymentsUpdated", (ev) => {
        return (
          Number(ev.referralTreePaymentToPlanter) == Number(planterShare) &&
          Number(ev.referralTreePaymentToAmbassador) == Number(referralShare)
        );
      });
      /////------------------- update daiInstance balance---------------------------
      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await daiInstance.setMint(
        daiFundInstance.address,
        web3.utils.toWei("1000")
      );

      await daiFundInstance.fundTreeBatch(
        web3.utils.toWei("1"),
        0,
        0,
        0,
        0,
        web3.utils.toWei("1000"),
        0,
        0,
        {
          from: deployerAccount,
        }
      );

      await daiInstance.resetAcc(planterFundsInstnce.address);

      ////////////////////

      await testRegularSaleInstance.updateRegularReferrerGift(
        userAccount3,
        90,
        {
          from: userAccount8,
        }
      );

      await testRegularSaleInstance.updateReferrerClaimableTreesWeth(
        userAccount3,
        25,
        {
          from: userAccount8,
        }
      );

      const user3GiftCountBeforeClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount3
        );

      assert.equal(
        Number(user3GiftCountBeforeClaim),
        90,
        "user 3 gift before claim is not correct"
      );

      await testRegularSaleInstance.claimReferralReward({ from: userAccount3 });

      const user3GiftCountAfterClaim =
        await testRegularSaleInstance.referrerClaimableTreesDai.call(
          userAccount3
        );

      assert.equal(
        Number(user3GiftCountAfterClaim),
        40,
        "user 3 gift after claim is not correct"
      );

      assert.equal(
        Number(
          await testRegularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount3
          )
        ),
        25,
        "user 3 gift before claim is not correct"
      );

      assert.equal(
        await daiInstance.balanceOf(planterFundsInstnce.address),
        Math.mul(Math.add(Number(planterShare), Number(referralShare)), 50),
        "planterFund balance not true"
      );

      let tokentOwner;

      for (let i = 10001; i < 10051; i++) {
        tokentOwner = await treeTokenInstance.ownerOf(i);
        assert.equal(tokentOwner, userAccount3, "funder not true " + i);
      }

      let lastTreeSold = await testRegularSaleInstance.lastFundedTreeId.call();

      assert.equal(lastTreeSold, 10050, "last sold is not correct");
      let planterFund;
      let referralFund;

      for (let i = 10001; i < 10051; i++) {
        planterFund =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        referralFund =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

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

      let totalBalances = await planterFundsInstnce.totalBalances.call();
      assert.equal(
        Number(totalBalances.planter),
        Math.mul(50, Number(planterShare))
      );

      assert.equal(
        Number(totalBalances.ambassador),
        Math.mul(50, Number(referralShare))
      );
    });
  });
});
