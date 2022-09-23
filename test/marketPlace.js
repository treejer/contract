// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const MarketPlace = artifacts.require("MarketPlace");

const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSale = artifacts.require("RegularSale");

const TreeFactory = artifacts.require("TreeFactoryV2");
const Attribute = artifacts.require("Attribute");
const PlanterFund = artifacts.require("PlanterFund");
const DaiFund = artifacts.require("DaiFund");
const Allocation = artifacts.require("Allocation");
const Dai = artifacts.require("Dai");
const TestMarketPlace = artifacts.require("TestMarketPlace");

const Tree = artifacts.require("Tree");
const Planter = artifacts.require("Planter");
const WethFund = artifacts.require("WethFund");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");
const Math = require("./math");
//uniswap
const Factory = artifacts.require("Factory.sol");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");
const Token = artifacts.require("Weth");

//gsn
// const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
// const Gsn = require("@opengsn/provider");
// const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
// const ethers = require("ethers");

const {
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  RegularSaleErrors,
  TreasuryManagerErrorMsg,
  TimeEnumes,
  erc20ErrorMsg,
  MarketPlaceErrorMsg,
  SafeMathErrorMsg,
} = require("./enumes");

const FakeToken = artifacts.require("FakeToken");
const FakeAttribute = artifacts.require("FakeAttribute");

contract("marketPlace", (accounts) => {
  let marketPlaceInstance;
  let regularSaleInstance;
  let treeFactoryInstance;
  let arInstance;

  let treeTokenInstance;
  let attributeInstance;
  let planterInstance;
  let allocationInstance;
  let daiFundInstance;
  let planterFundsInstnce;
  let daiInstance;
  let wethFundInstance;
  let fakeTokenInstance;
  let fakeAttributeInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2]; //individual planter
  const userAccount2 = accounts[3]; //organization planter
  const userAccount3 = accounts[4]; //member of organization planter
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7]; //not data manager or treejerContract
  const userAccount7 = accounts[8];
  const treejerContract = accounts[9]; // treejerContract role

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const initialLastTreeAssigned = 1000000001;

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

    fakeTokenInstance = await FakeToken.new({ from: deployerAccount });

    fakeAttributeInstance = await FakeAttribute.new({ from: deployerAccount });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    await Common.addVerifierRole(arInstance, dataManager, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      treejerContract,
      deployerAccount
    );

    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
  });

  describe("deployment and set addresses", () => {
    before(async () => {
      marketPlaceInstance = await MarketPlace.new({ from: deployerAccount });

      await marketPlaceInstance.initialize(arInstance.address, {
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

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundsInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundsInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

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

      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    //////////////////************************************ deploy successfully ***************************************
    it("deploys successfully", async () => {
      const address = marketPlaceInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
      //-------------- check accessRestriction in initialize
      assert.equal(
        await marketPlaceInstance.accessRestriction(),
        arInstance.address,
        "access restriction address is incorrect"
      );
    });

    it("set marketPlace contract addresses and fail in invalid situation", async () => {
      //////--------------- set daiToken address
      await marketPlaceInstance
        .setDaiTokenAddress(daiInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance
        .setDaiTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await marketPlaceInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiInstance.address,
        await marketPlaceInstance.daiToken(),
        "dai token address set incorect"
      );

      //////--------------- set daiFund address

      await marketPlaceInstance
        .setDaiFundAddress(daiFundInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setDaiFundAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiFundInstance.address,
        await marketPlaceInstance.daiFund(),
        "dai funds address set incorect"
      );

      //////--------------- set allocation address

      await marketPlaceInstance
        .setAllocationAddress(allocationInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setAllocationAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        allocationInstance.address,
        await marketPlaceInstance.allocation(),
        "dai funds address set incorect"
      );

      //////--------------- set treeFactory address

      await regularSaleInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setTreeFactoryAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

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

      //////--------------- set attribute address

      await marketPlaceInstance
        .setAttributesAddress(attributeInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setAttributesAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setAttributesAddress(
        attributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        attributeInstance.address,
        await marketPlaceInstance.attribute(),
        "allocation address set incorect"
      );

      //////--------------- set planterFundContract address

      await marketPlaceInstance
        .setPlanterFundAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setPlanterFundAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        planterFundsInstnce.address,
        await marketPlaceInstance.planterFundContract(),
        "allocation address set incorect"
      );

      /////------------------set regularSale address

      await marketPlaceInstance
        .setRegularSaleAddress(regularSaleInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setRegularSaleAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setRegularSaleAddress(
        regularSaleInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        regularSaleInstance.address,
        await marketPlaceInstance.regularSale(),
        "allocation address set incorect"
      );

      /////------------------set planter address

      await marketPlaceInstance
        .setPlanterAddress(planterInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await marketPlaceInstance.setPlanterAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await marketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        planterInstance.address,
        await marketPlaceInstance.planter(),
        "allocation address set incorect"
      );
    });
  });

  describe("without financial section", () => {
    before(async () => {
      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await planterInstance.join(1, 1, 1, 1, zeroAddress, zeroAddress, {
        from: userAccount1,
      });

      await planterInstance.joinOrganization(
        userAccount2,
        1,
        1,
        1,
        100,
        zeroAddress,
        { from: dataManager }
      );

      await planterInstance.join(3, 1, 1, 1, zeroAddress, userAccount2, {
        from: userAccount3,
      });

      await planterInstance.acceptPlanterByOrganization(userAccount3, true, {
        from: userAccount2,
      });
    });
    beforeEach(async () => {
      marketPlaceInstance = await MarketPlace.new({
        from: deployerAccount,
      });

      await marketPlaceInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await marketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });
    });
    it("add model", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const country2 = 2;
      const species2 = 20;
      const price2 = web3.utils.toWei("20");
      const count2 = 100;

      // await marketPlaceInstance
      //   .addModel(country, species, price, count)
      //   .should.be.rejectedWith(MarketPlaceErrorMsg.INVAILD_PLANTER);
      //failed because member of organization planter
      await marketPlaceInstance
        .addModel(country1, species1, price1, count1, {
          from: userAccount3,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVAILD_PLANTER);

      //faild because not planter
      await marketPlaceInstance
        .addModel(country1, species1, price1, count1, {
          from: userAccount5,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVAILD_PLANTER);

      await marketPlaceInstance
        .addModel(country1, species1, price1, 0, {
          from: userAccount1,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_COUNT);

      await marketPlaceInstance
        .addModel(country1, species1, price1, 10002, {
          from: userAccount1,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_COUNT);

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      let model1 = await marketPlaceInstance.models(1);

      assert.equal(Number(model1.country), country1, "country is incorrect");
      assert.equal(Number(model1.species), species1, "species is incorrect");
      assert.equal(Number(model1.deactive), 0, "deactive is incorrect");
      assert.equal(model1.planter, userAccount1, "planter is incorrect");
      assert.equal(Number(model1.price), Number(price1), "price is incorrect");
      assert.equal(Number(model1.count), count1, "count is incorrect");
      assert.equal(
        Number(model1.start),
        initialLastTreeAssigned,
        "start is incorrect"
      );
      assert.equal(
        Number(model1.lastFund),
        initialLastTreeAssigned - 1,
        "lastFunded is incorrect"
      );
      assert.equal(
        Number(model1.lastPlant),
        initialLastTreeAssigned - 1,
        "lastPlanted is incorrect"
      );

      //TODO://check this
      // assert.equal(
      //   Number(model1.lastReservePlant),
      //   count1,
      //   "count is incorrect"
      // );

      ///////------------------- check LastTreeAssigned

      assert.equal(
        Number(await marketPlaceInstance.lastTreeAssigned()),
        initialLastTreeAssigned + count1,
        "lastTreeAssigned is incorrect"
      );

      await marketPlaceInstance.addModel(country2, species2, price2, count2, {
        from: userAccount2,
      });

      let model2 = await marketPlaceInstance.models(2);

      assert.equal(Number(model2.country), country2, "country is incorrect");
      assert.equal(Number(model2.species), species2, "species is incorrect");
      assert.equal(Number(model2.deactive), 0, "deactive is incorrect");
      assert.equal(model2.planter, userAccount2, "planter is incorrect");
      assert.equal(Number(model2.price), Number(price2), "price is incorrect");
      assert.equal(Number(model2.count), count2, "count is incorrect");
      assert.equal(
        Number(model2.start),
        initialLastTreeAssigned + count1,
        "start is incorrect"
      );
      assert.equal(
        Number(model2.lastFund),
        initialLastTreeAssigned + count1 - 1,
        "lastFunded is incorrect"
      );
      assert.equal(
        Number(model2.lastPlant),
        initialLastTreeAssigned + count1 - 1,
        "lastPlanted is incorrect"
      );

      //TODO://check this
      // assert.equal(
      //   Number(model2.lastReservePlant),
      //   count2,
      //   "count is incorrect"
      // );

      ///////------------------- check LastTreeAssigned

      assert.equal(
        Number(await marketPlaceInstance.lastTreeAssigned()),
        initialLastTreeAssigned + count1 + count2,
        "lastTreeAssigned is incorrect"
      );
    });
    it("fail to updateModelData", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const country2 = 2;
      const species2 = 20;

      const modelId = 1;

      const testMarketPlaceInstance = await TestMarketPlace.new({
        from: deployerAccount,
      });

      await testMarketPlaceInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await testMarketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      await testMarketPlaceInstance.addModel(
        country1,
        species1,
        price1,
        count1,
        {
          from: userAccount1,
        }
      );

      await testMarketPlaceInstance
        .updateModelData(modelId, species2, country2, { from: userAccount2 })
        .should.be.rejectedWith(MarketPlaceErrorMsg.ACCESS_DENIED);

      await testMarketPlaceInstance.setLastFunded(1, 1);
      /////----------- fail because lastPlanted != lastFunded
      await testMarketPlaceInstance
        .updateModelData(modelId, species2, country2, { from: userAccount1 })
        .should.be.rejectedWith(MarketPlaceErrorMsg.TREE_PLANTER_OR_FUNDED);

      await testMarketPlaceInstance.setLastPlanted(1, 1);

      /////----------- fail because lastPlanted increased
      await testMarketPlaceInstance
        .updateModelData(modelId, species2, country2, { from: userAccount1 })
        .should.be.rejectedWith(MarketPlaceErrorMsg.TREE_PLANTER_OR_FUNDED);
    });

    it("test updateModelData", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const country2 = 2;
      const species2 = 20;

      const modelId = 1;

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      let modelBeforeUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelBeforeUpdate.country),
        country1,
        "count is incorrect"
      );
      assert.equal(
        Number(modelBeforeUpdate.species),
        species1,
        "species is incorrect"
      );

      await marketPlaceInstance.updateModelData(modelId, species2, country2, {
        from: userAccount1,
      });

      let modelAfterUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfterUpdate.country),
        country2,
        "count is incorrect"
      );
      assert.equal(
        Number(modelAfterUpdate.species),
        species2,
        "species is incorrect"
      );
    });

    it("test updatePrice", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const price2 = web3.utils.toWei("20");

      const modelId = 1;

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      let modelBeforeUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelBeforeUpdate.price),
        price1,
        "price is incorrect"
      );

      await marketPlaceInstance
        .updatePrice(modelId, price2, { from: userAccount2 })
        .should.be.rejectedWith(MarketPlaceErrorMsg.ACCESS_DENIED);

      await marketPlaceInstance.updatePrice(modelId, price2, {
        from: userAccount1,
      });

      let modelAfterUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfterUpdate.price),
        price2,
        "price is incorrect"
      );
    });
    it("test updateLastPlantedOfModel", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const modelId = 1;

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      let modelBeforeUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelBeforeUpdate.lastPlant),
        1000000000,
        "lastPlant is incorrect"
      );

      await marketPlaceInstance
        .updateLastPlantedOfModel(modelId, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await marketPlaceInstance.updateLastPlantedOfModel(modelId, {
        from: treejerContract,
      });

      let modelAfterUpdate = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfterUpdate.lastPlant),
        1000000001,
        "lastPlant is incorrect"
      );
    });

    it("test reduceLastReservePlantedOfModel", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const modelId = 1;

      const testMarketPlaceInstance = await TestMarketPlace.new({
        from: deployerAccount,
      });

      await testMarketPlaceInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await testMarketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      await testMarketPlaceInstance.addModel(
        country1,
        species1,
        price1,
        count1,
        {
          from: userAccount1,
        }
      );

      await testMarketPlaceInstance
        .reduceLastReservePlantedOfModel(modelId, {
          from: treejerContract,
        })
        .should.be.rejectedWith(SafeMathErrorMsg.OVER_FLOW);

      await testMarketPlaceInstance.setLastReservePlant(1, 30);

      let modelBefore = await testMarketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelBefore.lastReservePlant),
        30,
        "lastReservePlant is incorrect"
      );

      await testMarketPlaceInstance
        .reduceLastReservePlantedOfModel(modelId, { from: userAccount2 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await testMarketPlaceInstance.reduceLastReservePlantedOfModel(modelId, {
        from: treejerContract,
      });

      let modelAfter = await testMarketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfter.lastReservePlant),
        29,
        "lastReservePlant is incorrect"
      );

      // await testMarketPlaceInstance.setLastFunded(1, 1);
      // /////----------- fail because lastPlanted != lastFunded
      // await testMarketPlaceInstance
      //   .updateModelData(modelId, species2, country2, { from: userAccount1 })
      //   .should.be.rejectedWith(MarketPlaceErrorMsg.TREE_PLANTER_OR_FUNDED);
    });

    it("test updateLastReservePlantedOfModel", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 1;

      const country2 = 2;
      const species2 = 20;
      const price2 = web3.utils.toWei("10");
      const count2 = 1;

      const modelId1 = 1;
      const modelId2 = 2;

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      // fail because caller is not treejerContract
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount1, 1, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      //fail because marketPlace is not treejerContract
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount1, 1, {
          from: treejerContract,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount
      );

      // an account that is not planter
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(dataManager, 1, {
          from: treejerContract,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      // incorrect planter want to plant
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount2, 1, {
          from: treejerContract,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      const model1BeforeUpdate = await marketPlaceInstance.models(modelId1);
      await marketPlaceInstance.updateLastReservePlantedOfModel(
        userAccount1,
        1,
        {
          from: treejerContract,
        }
      );

      const model1AfterUpdate = await marketPlaceInstance.models(modelId1);

      assert.equal(
        Number(model1BeforeUpdate.lastReservePlant),
        Number(model1BeforeUpdate.start - 1),
        "lastReservePlant is incorrect"
      );

      assert.equal(
        model1AfterUpdate.lastReservePlant,
        Number(model1BeforeUpdate.start),
        "lastReservePlant is incorrect"
      );

      // all trees planted
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount1, 1, {
          from: treejerContract,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.ALL_TREE_PLANTED);

      await marketPlaceInstance.addModel(country2, species2, price2, count2, {
        from: userAccount2,
      });

      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount1, 2, {
          from: treejerContract,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      await planterInstance.updateSupplyCap(userAccount3, 1, {
        from: dataManager,
      });

      const model2BeforeUpdate = await marketPlaceInstance.models(modelId2);

      await marketPlaceInstance.updateLastReservePlantedOfModel(
        userAccount3,
        2,
        {
          from: treejerContract,
        }
      );
      const model2AfterUpdate = await marketPlaceInstance.models(modelId2);

      assert.equal(
        Number(model2BeforeUpdate.lastReservePlant),
        Number(model2BeforeUpdate.start - 1),
        "lastReservePlant is incorrect"
      );

      assert.equal(
        model2AfterUpdate.lastReservePlant,
        Number(model2BeforeUpdate.start),
        "lastReservePlant is incorrect"
      );

      //planter reached maximum supplyCap
      await marketPlaceInstance
        .updateLastReservePlantedOfModel(userAccount3, 2, {
          from: treejerContract,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);
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

      await regularSaleInstance.setPlanterFundAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await regularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );
    });
  });
});
