// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const MarketPlace = artifacts.require("MarketPlace");

const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSale = artifacts.require("RegularSaleV2");

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
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

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
      let initialLastReservePlant = Number(
        (await testMarketPlaceInstance.models(1)).lastReservePlant
      );
      await testMarketPlaceInstance.increaseLastReservePlant(1);

      let modelBefore = await testMarketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelBefore.lastReservePlant),
        initialLastReservePlant + 1,
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
        initialLastReservePlant,
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

      daiFundInstance = await DaiFund.new({
        from: deployerAccount,
      });

      await daiFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
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

      await marketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      await marketPlaceInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });
      await marketPlaceInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await marketPlaceInstance.setAllocationAddress(
        allocationInstance.address,
        { from: deployerAccount }
      );

      await marketPlaceInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        { from: deployerAccount }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await marketPlaceInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );
      await marketPlaceInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await marketPlaceInstance.setRegularSaleAddress(
        regularSaleInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount,
        { from: deployerAccount }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount,
        { from: deployerAccount }
      );

      await Common.prepareAttributeDex(
        UniswapV2Router02New,
        Factory,
        TestUniswap,
        Token,
        attributeInstance,
        deployerAccount
      );

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
    });
    it.only("fail to fundTree", async () => {
      const country = 1;
      const species = 10;
      const price = web3.utils.toWei("10");

      const funder = userAccount5;
      const recipient = userAccount6;
      const referrer = userAccount7;

      await marketPlaceInstance.addModel(country, species, price, 1, {
        from: userAccount1,
      });
      await marketPlaceInstance.addModel(country, species, price, 2, {
        from: userAccount1,
      });
      await marketPlaceInstance.addModel(country, species, price, 3, {
        from: userAccount1,
      });
      await marketPlaceInstance.addModel(country, species, price, 50, {
        from: userAccount1,
      });
      await marketPlaceInstance.addModel(country, species, price, 50, {
        from: userAccount1,
      });

      const input1 = [
        { modelId: 1, count: 1 },
        { modelId: 2, count: 3 },
      ];

      await marketPlaceInstance
        .fundTree(input1, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_COUNT);

      const input2 = [
        { modelId: 1, count: 1 },
        { modelId: 2, count: 1 },
        { modelId: 3, count: 1 },
        { modelId: 4, count: 49 },
        { modelId: 5, count: 49 },
      ];

      await marketPlaceInstance
        .fundTree(input2, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.TOTAL_COUNT_EXCEEDED);

      await marketPlaceInstance.deactiveModel(2, { from: userAccount1 });

      await marketPlaceInstance
        .fundTree(input1, referrer, recipient, {
          from: userAccount1,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_COUNT);
    });
    it("fund tree with referrer and with recipient", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;
      const funder = userAccount5;
      const recipient = userAccount6;
      const referrer = userAccount7;
      const amount = web3.utils.toWei("30");

      const modelId = 1;
      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      await regularSaleInstance.updateReferralTriggerCount(2, {
        from: dataManager,
      });

      const input = [{ modelId: 1, count: 3 }];

      await marketPlaceInstance
        .fundTree(input, recipient, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_REFERRER);

      await marketPlaceInstance
        .fundTree([{ modelId: 1, count: 51 }], referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INVALID_COUNT);

      await marketPlaceInstance
        .fundTree(input, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INSUFFICIENT_BALANCE);

      await daiInstance.setMint(funder, amount);

      await marketPlaceInstance
        .fundTree(input, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_APPROVE);

      await daiInstance.approve(marketPlaceInstance.address, amount, {
        from: funder,
      });

      const modelBeforeFund = await marketPlaceInstance.models(modelId);

      await marketPlaceInstance.fundTree(input, referrer, recipient, {
        from: funder,
      });

      ////-------------- check funder balance
      assert.equal(
        Number(await daiInstance.balanceOf(funder)),
        0,
        "funder balance is incorrect"
      );
      /////-------------- check daiFund balance
      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("14.4")),
        "daiFund balance not true"
      );

      /////-------------- check planterFund balance
      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("15.6")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      /////////// ------------------- check treeOwner and attributes
      let owner;
      let attributes;
      for (let i = 0; i < 2; i++) {
        owner = await treeTokenInstance.ownerOf(initialLastTreeAssigned + i);
        assert.equal(owner, recipient, "owner of tree is incorrect");

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(
          initialLastTreeAssigned + i
        );

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

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

      //check daiFund totalBalances treeId
      let totalBalances = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      ///---------------------check referrer balance
      assert.equal(
        Number(await regularSaleInstance.referrerCount(referrer)),
        1,
        "referrerCount is incorrect"
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(referrer),
        1,
        "referrerClaimableTreesDai is incorrect"
      );

      ////--------------------------check totalBalances planterFunds

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "totalFund ambassador funds invalid"
      );
      //////---------------------- check projected earnings
      for (let i = 1000000001; i < 1000000003; i++) {
        let planterFunds =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

        assert.equal(
          Number(planterFunds),
          Number(web3.utils.toWei("4")),
          "planterFund funds invalid"
        );

        assert.equal(
          Number(referralFunds),
          Number(web3.utils.toWei("1.2")),
          "referralFund funds invalid"
        );
      }
      //----------------------------- check lastFund model
      let modelAfterFund = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfterFund.lastFund),
        Math.add(Number(modelBeforeFund.lastFund), input[0].count),
        "lastFund is incorrect"
      );

      await daiInstance.resetAcc(planterFundsInstnce.address);
      await daiInstance.resetAcc(daiFundInstance.address);
      await daiInstance.resetAcc(funder);
    });
    it("Should request trees successfully (without recipient) (without referrer)", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;
      const funder = userAccount5;
      const referrer = userAccount7;
      const amount = web3.utils.toWei("20");
      const modelId = 1;
      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      const input = [{ modelId: 1, count: 2 }];

      await daiInstance.setMint(funder, amount);

      await daiInstance.approve(marketPlaceInstance.address, amount, {
        from: funder,
      });

      const modelBeforeFund = await marketPlaceInstance.models(modelId);

      await marketPlaceInstance.fundTree(input, zeroAddress, zeroAddress, {
        from: funder,
      });

      ////-------------- check funder balance
      assert.equal(
        Number(await daiInstance.balanceOf(funder)),
        0,
        "funder balance is incorrect"
      );
      /////-------------- check daiFund balance
      const daiFundBalanceAfter = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      assert.equal(
        Number(daiFundBalanceAfter),
        Number(web3.utils.toWei("9.6")),
        "daiFund balance not true"
      );

      /////-------------- check planterFund balance
      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(web3.utils.toWei("10.4")),
        "treeToPlanterProjectedEarnings balance not true"
      );

      /////////// ------------------- check treeOwner and attributes
      let owner;
      let attributes;
      for (let i = 0; i < 2; i++) {
        owner = await treeTokenInstance.ownerOf(initialLastTreeAssigned + i);
        assert.equal(owner, funder, "owner of tree is incorrect");

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(
          initialLastTreeAssigned + i
        );

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

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

      //check daiFund totalBalances treeId
      let totalBalances = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      ///---------------------check referrer balance
      assert.equal(
        Number(await regularSaleInstance.referrerCount(referrer)),
        0,
        "referrerCount is incorrect"
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(referrer),
        0,
        "referrerClaimableTreesDai is incorrect"
      );

      assert.equal(
        Number(await regularSaleInstance.referrerCount(zeroAddress)),
        0,
        "referrerCount is incorrect"
      );

      assert.equal(
        await regularSaleInstance.referrerClaimableTreesDai.call(zeroAddress),
        0,
        "referrerClaimableTreesDai is incorrect"
      );

      ////--------------------------check totalBalances planterFunds

      let planterTotalFund = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(planterTotalFund.planter),
        Number(expected.planterFund),
        "totalFund planterFund funds invalid"
      );

      assert.equal(
        Number(planterTotalFund.ambassador),
        Number(expected.referralFund),
        "totalFund ambassador funds invalid"
      );
      //////---------------------- check projected earnings
      for (let i = 1000000001; i < 1000000003; i++) {
        let planterFunds =
          await planterFundsInstnce.treeToPlanterProjectedEarning.call(i);
        let referralFunds =
          await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(i);

        assert.equal(
          Number(planterFunds),
          Number(web3.utils.toWei("4")),
          "planterFund funds invalid"
        );

        assert.equal(
          Number(referralFunds),
          Number(web3.utils.toWei("1.2")),
          "referralFund funds invalid"
        );
      }
      //----------------------------- check lastFund model
      let modelAfterFund = await marketPlaceInstance.models(modelId);

      assert.equal(
        Number(modelAfterFund.lastFund),
        Math.add(Number(modelBeforeFund.lastFund), input[0].count),
        "lastFund is incorrect"
      );

      await daiInstance.resetAcc(planterFundsInstnce.address);
      await daiInstance.resetAcc(daiFundInstance.address);
      await daiInstance.resetAcc(funder);
    });

    it("test fundTree with two model", async () => {
      const country1 = 1;
      const species1 = 10;
      const price1 = web3.utils.toWei("10");
      const count1 = 50;

      const country2 = 2;
      const species2 = 20;
      const price2 = web3.utils.toWei("20");
      const count2 = 100;

      const country3 = 3;
      const species3 = 30;
      const price3 = web3.utils.toWei("30");
      const count3 = 150;

      const funder = userAccount5;
      const recipient = userAccount6;
      const referrer = userAccount7;
      const amount = web3.utils.toWei("70");
      const amount1 = web3.utils.toWei("69");
      const amount2 = web3.utils.toWei("1");

      const modelId1 = 1;
      const modelId3 = 3;

      await marketPlaceInstance.addModel(country1, species1, price1, count1, {
        from: userAccount1,
      });

      await marketPlaceInstance.addModel(country2, species2, price2, count2, {
        from: userAccount1,
      });

      await marketPlaceInstance.addModel(country3, species3, price3, count3, {
        from: userAccount1,
      });

      const input = [
        { modelId: 1, count: 1 },
        { modelId: 3, count: 2 },
      ];

      await daiInstance.setMint(funder, amount1);

      await daiInstance.approve(marketPlaceInstance.address, amount1, {
        from: funder,
      });

      await marketPlaceInstance
        .fundTree(input, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.INSUFFICIENT_BALANCE);

      await daiInstance.setMint(funder, amount2);

      await marketPlaceInstance
        .fundTree(input, referrer, recipient, {
          from: funder,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_APPROVE);

      await daiInstance.approve(marketPlaceInstance.address, amount, {
        from: funder,
      });

      const model1BeforeFund = await marketPlaceInstance.models(modelId1);
      const model3BeforeFund = await marketPlaceInstance.models(modelId3);

      await marketPlaceInstance.fundTree(input, referrer, recipient, {
        from: funder,
      });

      const model1AfterFund = await marketPlaceInstance.models(modelId1);
      const model3AfterFund = await marketPlaceInstance.models(modelId3);

      assert.equal(
        Number(model1AfterFund.lastFund),
        Math.add(Number(model1BeforeFund.lastFund), input[0].count),
        "lastFund of model1 is incorrect"
      );

      assert.equal(
        Number(model3AfterFund.lastFund),
        Math.add(Number(model3BeforeFund.lastFund), input[1].count),
        "lastFund of model3 is incorrect"
      );

      /////////// ------------------- check treeOwner and attributes
      let owner;
      let attributes;

      for (let i = 1000000001; i < 1000000002; i++) {
        owner = await treeTokenInstance.ownerOf(i);
        assert.equal(owner, recipient, "owner of tree is incorrect");

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      for (let i = 1000000151; i < 1000000153; i++) {
        owner = await treeTokenInstance.ownerOf(i);
        assert.equal(owner, recipient, "owner of tree is incorrect");

        //////////// check attributes
        attributes = await treeTokenInstance.attributes.call(i);

        assert.equal(
          Number(attributes.generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }
    });
  });
});
