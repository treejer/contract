// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const IncrementalSale = artifacts.require("IncrementalSale");
const TreeFactory = artifacts.require("TreeFactory");
const Attribute = artifacts.require("Attribute");
const Tree = artifacts.require("Tree");
const TestTree = artifacts.require("TestTree");
const TestTree2 = artifacts.require("TestTree2");
const TestAttribute = artifacts.require("TestAttribute");

//treasury section
const WethFund = artifacts.require("WethFund");
const PlanterFund = artifacts.require("PlanterFund");
const Token = artifacts.require("Weth");
const Math = require("./math");

//uniswap
const UniSwapMini = artifacts.require("UniSwapMini");

const Factory = artifacts.require("Factory.sol");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, AttributeErrorMsg } = require("./enumes");

contract("Attribute", (accounts) => {
  let iSaleInstance;
  let arInstance;

  let attributeInstance;
  let wethFundInstance;
  let planterFundsInstnce;
  let wethInstance;
  let daiInstance;
  let treeTokenInstance;
  let testUniswapInstance;
  let WETHAddress;
  let DAIAddress;
  let uniSwapMiniAddress;

  //uniswap varible
  let dexRouterInstance;
  let factoryInstance;

  let wethDexInstance;
  let daiDexInstance;
  let bnbDexInstance;
  let adaDexInstance;
  let unsafeTokenDexInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const funderRank = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const randTree = web3.utils.soliditySha3(10000, 0, "", 0, zeroAddress, "");

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    ////--------------------------uniswap deploy

    wethInstance = await Token.new("WETH", "weth", {
      from: accounts[0],
    });
    WETHAddress = wethInstance.address;
    daiInstance = await Token.new("DAI", "dai", { from: accounts[0] });
    DAIAddress = daiInstance.address;
    dexRouterInstance = await UniswapV2Router02New.new(
      DAIAddress,
      WETHAddress,
      { from: deployerAccount }
    );
    uniSwapMiniAddress = dexRouterInstance.address;
    await wethInstance.setMint(
      uniSwapMiniAddress,
      web3.utils.toWei("125000", "Ether")
    );
    await daiInstance.setMint(
      uniSwapMiniAddress,
      web3.utils.toWei("250000000", "Ether")
    );

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
    await Common.addScriptRole(arInstance, funderRank, deployerAccount);
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("deploys successfully", async () => {
      const address = attributeInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    ///////////////---------------------------------test reserveSymbol function--------------------------------------------------------
    it("Should reserveSymbol work successfully", async () => {
      ////------------Should reserveSymbol rejec because caller must be admin or HonoraryTree
      const generatedCode1 = 119479171;
      await attributeInstance
        .reserveSymbol(generatedCode1, { from: userAccount7 })
        .should.be.rejectedWith(
          CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
        );

      //////////////////// reserve attribute and check data

      const eventTx1 = await attributeInstance.reserveSymbol(generatedCode1, {
        from: dataManager,
      });

      const uniqueSymbol1 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode1
        );

      assert.equal(
        Number(uniqueSymbol1.status),
        1,
        "reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx1, "SymbolReserved", (ev) => {
        return ev.uniquenessFactor == generatedCode1;
      });

      //////// ------------Should reserveSymbol rejec because generatedCode has been reserved before
      await attributeInstance
        .reserveSymbol(generatedCode1, {
          from: dataManager,
        })
        .should.be.rejectedWith(AttributeErrorMsg.ATTRIBUTE_TAKEN);

      // ////// ----------------------- test 2

      let generatedCode2 = 0;

      await Common.addTreejerContractRole(
        arInstance,
        userAccount2,
        deployerAccount
      );

      const eventTx2 = await attributeInstance.reserveSymbol(generatedCode2, {
        from: userAccount2,
      });

      const uniqueSymbol2 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode2
        );

      assert.equal(
        Number(uniqueSymbol2.status),
        1,
        "reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol2.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx2, "SymbolReserved", (ev) => {
        return ev.uniquenessFactor == generatedCode2;
      });
    });

    ///////////////---------------------------------test releaseReservedSymbolByAdmin function--------------------------------------------------------

    it("Should releaseReservedSymbolByAdmin work successfully", async () => {
      /////----------------Should releaseReservedSymbolByAdmin rejec because generatedCode hasn't been reserved before
      let generatedCode1 = 119479171;

      await attributeInstance
        .releaseReservedSymbolByAdmin(generatedCode1, {
          from: dataManager,
        })
        .should.be.rejectedWith(AttributeErrorMsg.ATTRIBUTE_NOT_RESERVED);

      /////----------------Should releaseReservedSymbolByAdmin rejec because caller must be admin or HonoraryTree

      await attributeInstance.reserveSymbol(generatedCode1, {
        from: dataManager,
      });

      ////////////////// --------------- check data after reserve

      const uniqueSymbol1AfterReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode1
        );

      assert.equal(
        Number(uniqueSymbol1AfterReserve.status),
        1,
        "reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1AfterReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      await attributeInstance
        .releaseReservedSymbolByAdmin(generatedCode1, { from: userAccount7 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
      ///////////////// ------------- free reserve
      const eventTx1 = await attributeInstance.releaseReservedSymbolByAdmin(
        generatedCode1,
        {
          from: dataManager,
        }
      );

      const uniqueSymbol1AfterFreeReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode1
        );

      assert.equal(
        Number(uniqueSymbol1AfterFreeReserve.status),
        0,
        "free reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1AfterFreeReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx1, "ReservedSymbolReleased", (ev) => {
        return ev.uniquenessFactor == generatedCode1;
      });

      //////------------------------test 2

      let generatedCode2 = 0;

      await Common.addTreejerContractRole(
        arInstance,
        userAccount2,
        deployerAccount
      );

      await attributeInstance.reserveSymbol(generatedCode2, {
        from: userAccount2,
      });

      const eventTx2 = await attributeInstance.releaseReservedSymbolByAdmin(
        generatedCode2,
        {
          from: dataManager,
        }
      );

      const uniqueSymbol2AfterFreeReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode2
        );

      assert.equal(
        Number(uniqueSymbol2AfterFreeReserve.status),
        0,
        "free reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol2AfterFreeReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx2, "ReservedSymbolReleased", (ev) => {
        return ev.uniquenessFactor == generatedCode2;
      });
    });

    ///////////////---------------------------------test releaseReservedSymbol function--------------------------------------------------------

    it("Should releaseReservedSymbol work successfully", async () => {
      let generatedCode1 = 119479171;

      /////----------------Should releaseReservedSymbol rejec because caller must be admin or HonoraryTree

      await attributeInstance.reserveSymbol(generatedCode1, {
        from: dataManager,
      });

      ////////////////// --------------- check data after reserve

      const uniqueSymbol1AfterReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode1
        );

      assert.equal(
        Number(uniqueSymbol1AfterReserve.status),
        1,
        "reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1AfterReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      await attributeInstance
        .releaseReservedSymbol(generatedCode1, {
          from: userAccount7,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
      ///////////////// ------------- free reserve

      await Common.addTreejerContractRole(
        arInstance,
        userAccount2,
        deployerAccount
      );

      const eventTx1 = await attributeInstance.releaseReservedSymbol(
        generatedCode1,
        {
          from: userAccount2,
        }
      );

      const uniqueSymbol1AfterFreeReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode1
        );

      assert.equal(
        Number(uniqueSymbol1AfterFreeReserve.status),
        0,
        "free reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1AfterFreeReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx1, "ReservedSymbolReleased", (ev) => {
        return ev.uniquenessFactor == generatedCode1;
      });

      //////------------------------test 2

      let generatedCode2 = 0;

      await attributeInstance.reserveSymbol(generatedCode2, {
        from: userAccount2,
      });

      const eventTx2 = await attributeInstance.releaseReservedSymbol(
        generatedCode2,
        {
          from: userAccount2,
        }
      );

      const uniqueSymbol2AfterFreeReserve =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedCode2
        );

      assert.equal(
        Number(uniqueSymbol2AfterFreeReserve.status),
        0,
        "free reserved proccess is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol2AfterFreeReserve.generatedCount),
        0,
        "genertedCount is incorrect"
      );

      truffleAssert.eventEmitted(eventTx2, "ReservedSymbolReleased", (ev) => {
        return ev.uniquenessFactor == generatedCode2;
      });
    });
  });

  describe("check dexRouter", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ////--------------------------uniswap deploy

      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;

      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0],
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0],
      });

      unsafeTokenDexInstance = await Token.new("UNSAFE", "unsafe", {
        from: accounts[0],
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount,
      });

      /////---------------------------addLiquidity-------------------------

      const testUniswapAddress = testUniswapInstance.address;

      await wethDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );

      await daiDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("1000000000", "Ether")
      );

      await bnbDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("500000", "Ether")
      );

      await adaDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wethDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        bnbDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("500000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );

      await factoryInstance.createPair(
        daiDexInstance.address,
        unsafeTokenDexInstance.address
      );

      //-------------------set address

      await attributeInstance.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });
    });

    it("Check setDexTokens function", async () => {
      await attributeInstance.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      let list = [
        wethDexInstance.address,
        bnbDexInstance.address,
        adaDexInstance.address,
      ];

      await attributeInstance.setDexTokens(list, {
        from: deployerAccount,
      });

      list.push(unsafeTokenDexInstance.address);
      await attributeInstance
        .setDexTokens([], {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AttributeErrorMsg.EMPTY_TOKEN_LIST);

      await attributeInstance
        .setDexTokens(list, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(
          AttributeErrorMsg.UNISWAP_INSUFFICIENT_LIQUIDITY
        );
    });
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
    });

    it("Check setTreeTokenAddress function", async () => {
      ////////////////////------------------------------------ tree token address ----------------------------------------//
      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance
        .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    });

    it("Check setTreeTokenAddress function", async () => {
      ////////////////////------------------------------------ tree token address ----------------------------------------//
      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance
        .setTreeTokenAddress(treeTokenInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    });

    it("Check setBaseTokenAddress function", async () => {
      let testAddress = userAccount5;

      await attributeInstance
        .setBaseTokenAddress(testAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await attributeInstance.setBaseTokenAddress(testAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await attributeInstance.baseTokenAddress(),
        testAddress,
        "baseTokenAddress not true set"
      );
    });

    it("Check setDexRouterAddress function", async () => {
      let testAddress = userAccount5;

      await attributeInstance
        .setDexRouterAddress(testAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await attributeInstance.setDexRouterAddress(testAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await attributeInstance.dexRouter(),
        testAddress,
        "dexRouter not true set"
      );
    });

    // ssssss;

    it("Check setTreeTokenAddress function", async () => {
      ////////////////////------------------------------------ tree token address ----------------------------------------//
      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance
        .setTreeTokenAddress(treeTokenInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    });

    it("set attributes by admin", async () => {
      const treeId1 = 1000;
      const generatedCode1 = await web3.utils.toBN(18446744070000000000); // 2 ** 64 - 2 ** 25;

      const generatedSymbol1 = 10;
      const generationType1 = 18;

      //////////////// fail because caller is invalid
      await attributeInstance
        .setAttribute(
          treeId1,
          generatedCode1,
          generatedSymbol1,
          generationType1,
          2,
          { from: userAccount7 }
        )
        .should.be.rejectedWith(
          CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
        );

      /////////////// add successfully and check data

      const eventTx1 = await attributeInstance.setAttribute(
        treeId1,
        generatedCode1,
        generatedSymbol1,
        generationType1,
        2,
        { from: dataManager }
      );

      const generatedAttributes1 =
        await attributeInstance.uniquenessFactorToGeneratedAttributesCount.call(
          generatedCode1
        );

      const uniqueSymbol1 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          generatedSymbol1
        );

      assert.equal(
        Number(generatedAttributes1),
        1,
        "uniquenessFactorToGeneratedAttributesCount is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1.status),
        3,
        "unique symbol status is incorrect"
      );

      assert.equal(
        Number(uniqueSymbol1.generatedCount),
        1,
        "generated count is incorrect"
      );

      truffleAssert.eventEmitted(eventTx1, "AttributeGenerated", (ev) => {
        return Number(ev.treeId) == treeId1;
      });

      ////// cehck symbol and attribute struct data

      ///// -------- check attribute

      // generatedCode1 value = 18446744070000000000
      //generatedCode binary = 11111111,11111111,11111111,11111111,00100010,11100100,10111100,00000000

      const attribute1Data = await treeTokenInstance.attributes.call(treeId1);

      let expectedAttributeValue = {
        attribute1: 0,
        attribute2: 188,
        attribute3: 228,
        attribute4: 34,
        attribute5: 255,
        attribute6: 255,
        attribute7: 255,
        attribute8: 255,
        generationType: 18,
      };

      assert.equal(
        attribute1Data.attribute1,
        expectedAttributeValue.attribute1,
        "attribute1 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute2,
        expectedAttributeValue.attribute2,
        "attribute2 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute3,
        expectedAttributeValue.attribute3,
        "attribute3 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute4,
        expectedAttributeValue.attribute4,
        "attribute4 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute5,
        expectedAttributeValue.attribute5,
        "attribute5 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute6,
        expectedAttributeValue.attribute6,
        "attribute6 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute7,
        expectedAttributeValue.attribute7,
        "attribute7 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute8,
        expectedAttributeValue.attribute8,
        "attribute8 is incorrect"
      );

      assert.equal(
        attribute1Data.generationType,
        expectedAttributeValue.generationType,
        "generation type is invlid"
      );

      //// ----------- chekc symbol

      // symbol value = 8589934602
      // symbol binary = 00000000,00000000,00000000,00000010,00000000,00000000,00000000,00001010
      const expectedSymbolValue = {
        shape: 10,
        trunkColor: 0,
        crownColor: 0,
        effect: 0,
        coefficient: 2,
        generationType: 18,
      };

      const symbol1Data = await treeTokenInstance.symbols.call(treeId1);

      assert.equal(
        Number(symbol1Data.shape),
        expectedSymbolValue.shape,
        "shape is incorrect"
      );

      assert.equal(
        Number(symbol1Data.trunkColor),
        expectedSymbolValue.trunkColor,
        "trunkColor is incorrect"
      );

      assert.equal(
        Number(symbol1Data.crownColor),
        expectedSymbolValue.crownColor,
        "crownColor is incorrect"
      );
      //TODO:EFFECT_DELETED
      // assert.equal(
      //   Number(symbol1Data.effect),
      //   expectedSymbolValue.effect,
      //   "effect is incorrect"
      // );
      assert.equal(
        Number(symbol1Data.coefficient),
        expectedSymbolValue.coefficient,
        "coefficient is incorrect"
      );
      assert.equal(
        Number(symbol1Data.generationType),
        expectedSymbolValue.generationType,
        "generationType is incorrect"
      );

      //////////////////////// ------------- fail to set

      await attributeInstance
        .setAttribute(
          treeId1,
          generatedCode1,
          generatedSymbol1,
          generationType1,
          2,
          { from: dataManager }
        )
        .should.be.rejectedWith(AttributeErrorMsg.SYMBOL_IS_TAKEN);
    });

    ////////////////////////////

    it("should getFunderRank work successfully", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree2.new({
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.getFunderRank(deployerAccount, {
        from: deployerAccount,
      });

      await testInstance.rank1(deployerAccount, {
        from: userAccount6,
      });

      await attributeInstance.getFunderRank(deployerAccount, {
        from: deployerAccount,
      });

      await testInstance.rank2(deployerAccount, {
        from: userAccount6,
      });

      await attributeInstance.getFunderRank(deployerAccount, {
        from: deployerAccount,
      });

      await testInstance.rank3(deployerAccount, {
        from: userAccount6,
      });

      await attributeInstance.getFunderRank(deployerAccount, {
        from: deployerAccount,
      });
    });
  });

  describe("createSymbol", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
      /////////////////////////////////////// uniswap
      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;

      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0],
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0],
      });

      unsafeTokenDexInstance = await Token.new("UNSAFE", "unsafe", {
        from: accounts[0],
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount,
      });

      /////---------------------------addLiquidity-------------------------

      const testUniswapAddress = testUniswapInstance.address;

      await wethDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );

      await daiDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("1000000000", "Ether")
      );

      await bnbDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("500000", "Ether")
      );

      await adaDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wethDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        bnbDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("500000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );

      //-------------------set address

      await attributeInstance.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setDexTokens(
        [
          wethDexInstance.address,
          bnbDexInstance.address,
          adaDexInstance.address,
        ],
        { from: deployerAccount }
      );
    });

    it("should addTreejerContractRole successfully", async () => {
      const treeId1 = 101;
      const treeId2 = 102;
      const treeId3 = 103;
      const treejerContract = userAccount1;

      await Common.addTreejerContractRole(
        arInstance,
        treejerContract,
        deployerAccount
      );

      // planterDai, referralDai, treePrice, _daiAmount;
      const randTree1 = web3.utils.soliditySha3(
        web3.utils.toWei("2"),
        web3.utils.toWei("2"),
        web3.utils.toWei("7"),
        web3.utils.toWei("5")
      );
      const generationType = 18;

      await attributeInstance
        .createSymbol(treeId1, randTree1, userAccount2, 0, generationType, {
          from: userAccount7,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      const eventTx1 = await attributeInstance.createSymbol(
        treeId1,
        randTree1,
        userAccount2,
        0,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx1, "AttributeGenerated");

      const eventTx2 = await attributeInstance.createSymbol(
        treeId2,
        randTree1,
        userAccount2,
        1,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx2, "AttributeGenerated");

      const eventTx3 = await attributeInstance.createSymbol(
        treeId3,
        randTree1,
        userAccount2,
        2,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx3, "AttributeGenerated");

      const result = await attributeInstance.createSymbol.call(
        treeId1,
        randTree1,
        userAccount2,
        0,
        generationType,
        {
          from: treejerContract,
        }
      );

      assert.equal(result, true, "result is incorrect");
    });

    it("should createAttribute work successfully", async () => {
      await attributeInstance
        .createAttribute(10001, 1, { from: userAccount6 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

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

      let eventTx1 = await attributeInstance.createAttribute(10001, 1, {
        from: deployerAccount,
      });

      truffleAssert.eventEmitted(eventTx1, "AttributeGenerated");
      truffleAssert.eventNotEmitted(eventTx1, "AttributeGenerationFailed");

      await treeTokenInstance.attributes(10001);

      let eventTx2 = await attributeInstance.createAttribute(10001, 1, {
        from: deployerAccount,
      });

      truffleAssert.eventNotEmitted(eventTx2, "AttributeGenerated");
      truffleAssert.eventNotEmitted(eventTx2, "AttributeGenerationFailed");
    });

    it("should testTree work successfully", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree.new({
        from: deployerAccount,
      });

      await testInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

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

      await attributeInstance.createAttribute(10001, 1, {
        from: deployerAccount,
      });

      await testInstance.test(10001);

      await attributeInstance.createAttribute(10001, 1, {
        from: deployerAccount,
      });
    });

    it("create tree symbol using test tree", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree.new({
        from: deployerAccount,
      });

      await testInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

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
      ///////////////////////////// ----------------------------

      const randTree = web3.utils.soliditySha3(
        10000,
        0,
        "",
        0,
        zeroAddress,
        ""
      );
      const funderRank = 3;
      const generationType = 17;

      await attributeInstance.createSymbol(
        10001,
        randTree,
        userAccount2,
        funderRank,
        generationType,
        {
          from: deployerAccount,
        }
      );

      await testInstance.test(10001);

      await attributeInstance.createSymbol(
        10001,
        randTree,
        userAccount2,
        funderRank,
        generationType,
        {
          from: deployerAccount,
        }
      );
    });
  });

  describe("RandAvailibity", () => {
    beforeEach(async () => {
      /////////////////////////////////////// uniswap
      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;

      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0],
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0],
      });

      unsafeTokenDexInstance = await Token.new("UNSAFE", "unsafe", {
        from: accounts[0],
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount,
      });

      /////---------------------------addLiquidity-------------------------

      const testUniswapAddress = testUniswapInstance.address;

      await wethDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );

      await daiDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("1000000000", "Ether")
      );

      await bnbDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("500000", "Ether")
      );

      await adaDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wethDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        bnbDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("500000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );
    });

    ////-------------------------------- manageAttributeUniquenessFactor ---------------------------------

    it("RandAvailibity work successfully", async () => {
      ////------------------ deploy testAttribute ------------------------------

      testAttributeInstance = await TestAttribute.new({
        from: deployerAccount,
      });

      await testAttributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      //-------------------set address

      await testAttributeInstance.setDexRouterAddress(
        dexRouterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await testAttributeInstance.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      await testAttributeInstance.setDexTokens(
        [
          wethDexInstance.address,
          bnbDexInstance.address,
          adaDexInstance.address,
        ],
        { from: deployerAccount }
      );

      await testAttributeInstance
        .manageAttributeUniquenessFactor(10001, {
          from: userAccount4,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await testAttributeInstance.manageAttributeUniquenessFactor(10001, {
        from: deployerAccount,
      });
    });
  });
  /*
  //TODO:check_private_functions
  describe("check private attribute generations based on dex router", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      ////--------------------------uniswap deploy

      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;

      wethDexInstance = await Token.new("WETH", "weth", {
        from: accounts[0],
      });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0],
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0],
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount,
      });

      /////---------------------------addLiquidity-------------------------

      const testUniswapAddress = testUniswapInstance.address;
      console.log("rr", testUniswapAddress);

      await wethDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );

      await daiDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("1000000000", "Ether")
      );

      await bnbDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("500000", "Ether")
      );

      await adaDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wethDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        bnbDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("500000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );

      //-------------------set address

      await attributeInstance.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setDexTokens(
        [
          wethDexInstance.address,
          bnbDexInstance.address,
          adaDexInstance.address,
        ],
        { from: deployerAccount }
      );
    });
  it("test get amount out", async () => {
    let bnbAmount = await attributeInstance._getAmountsOut(
      web3.utils.toWei("0.1"),
      bnbDexInstance.address
    );
    let wethAmount = await attributeInstance._getAmountsOut(
      web3.utils.toWei("0.1"),
      wethDexInstance.address
    );
    let adaAmount = await attributeInstance._getAmountsOut(
      web3.utils.toWei("0.1"),
      adaDexInstance.address
    );

    assert.isTrue(
      Number(wethAmount) < Number(bnbAmount) &&
        Number(bnbAmount) < Number(adaAmount),
      "swaping is not ok"
    );
  });
  it("test get dex amount", async () => {
    let tree1WithBnb = await attributeInstance._getDexAmount(
      1,
      bnbDexInstance.address
    );
    let tree2WithBnb = await attributeInstance._getDexAmount(
      2,
      bnbDexInstance.address
    );
    let tree2001WithBnb = await attributeInstance._getDexAmount(
      2001,
      bnbDexInstance.address
    );

    let tree1WithAda = await attributeInstance._getDexAmount(
      1,
      adaDexInstance.address
    );

    let tree2001WithAda = await attributeInstance._getDexAmount(
      2001,
      adaDexInstance.address
    );

    assert.isTrue(
      Number(tree2WithBnb) > Number(tree1WithBnb),
      "amount for tree 2 must be more than tree 1"
    );
    assert.isTrue(
      Number(tree1WithAda) > Number(tree1WithBnb),
      "amount for ada must be more than bnb for same tree"
    );
    assert.equal(
      Number(tree1WithAda),
      Number(tree2001WithAda),
      "amounts must bee euqal for tree 1 and 2001"
    );
    assert.equal(
      Number(tree1WithBnb),
      Number(tree2001WithBnb),
      "amounts must bee euqal for tree 1 and 2001"
    );

    // swap some dai tokens to ada (to get less amount of ada)
    const now = new Date();
    await daiDexInstance.setMint(userAccount3, web3.utils.toWei("50000"));

    await daiDexInstance.approve(
      dexRouterInstance.address,
      web3.utils.toWei("50000"),
      { from: userAccount3 }
    );

    await dexRouterInstance.swapExactTokensForTokens(
      web3.utils.toWei("50000"),
      0,
      [daiDexInstance.address, adaDexInstance.address],
      userAccount2,
      parseInt(now.getTime() / 1000) + 1800,
      { from: userAccount3 }
    );
    let tree1WithAdaAfterSwaping = await attributeInstance._getDexAmount(
      1,
      adaDexInstance.address
    );

    assert.isTrue(
      Number(tree1WithAda) > Number(tree1WithAdaAfterSwaping),
      "amounts are not true after swaping"
    );

    await adaDexInstance.resetAcc(userAccount2);
  });
  it("test _generateAttributeUniquenessFactor", async () => {
    const amount1 =
      await attributeInstance._generateAttributeUniquenessFactor.call(1);

    const amount2 =
      await attributeInstance._generateAttributeUniquenessFactor.call(2);
    console.log(amount1['1'].toString());
    console.log(amount2['1'].toString());
  });
  });
  */
  /*
  describe("without financial section", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
    });
  

    it("should _generateUniquenessFactor work successfully", async () => {
      ///////////// ------------------- check 1

      const treeId = 100;
      const rand = await web3.utils.toBN("18446744073709551615"); // 2 ** 64 - 2 ** 25;
      const generationType1 = 18;

      await attributeInstance._generateUniquenessFactor(
        treeId,
        rand,
        0,
        generationType1
      );

      const attribute1Data = await treeTokenInstance.attributes.call(treeId);

      let expectedAttributeValue = {
        attribute1: 255,
        attribute2: 255,
        attribute3: 255,
        attribute4: 255,
        attribute5: 255,
        attribute6: 255,
        attribute7: 255,
        attribute8: 255,
        generationType: 18,
      };

      assert.equal(
        attribute1Data.attribute1,
        expectedAttributeValue.attribute1,
        "attribute1 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute2,
        expectedAttributeValue.attribute2,
        "attribute2 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute3,
        expectedAttributeValue.attribute3,
        "attribute3 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute4,
        expectedAttributeValue.attribute4,
        "attribute4 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute5,
        expectedAttributeValue.attribute5,
        "attribute5 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute6,
        expectedAttributeValue.attribute6,
        "attribute6 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute7,
        expectedAttributeValue.attribute7,
        "attribute7 is incorrect"
      );
      assert.equal(
        attribute1Data.attribute8,
        expectedAttributeValue.attribute8,
        "attribute8 is incorrect"
      );

      assert.equal(
        attribute1Data.generationType,
        expectedAttributeValue.generationType,
        "generation type is invlid"
      );

      const expectedSymbolValue = {
        shape: 128,
        trunkColor: 6,
        crownColor: 5,
        effect: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol1Data = await treeTokenInstance.symbols.call(treeId);

      assert.equal(
        symbol1Data.shape,
        expectedSymbolValue.shape,
        "shape is incorrect"
      );

      assert.equal(
        symbol1Data.trunkColor,
        expectedSymbolValue.trunkColor,
        "trunkColor is incorrect"
      );

      assert.equal(
        symbol1Data.crownColor,
        expectedSymbolValue.crownColor,
        "crownColor is incorrect"
      );
      assert.equal(
        symbol1Data.effect,
        expectedSymbolValue.effect,
        "effect is incorrect"
      );
      assert.equal(
        symbol1Data.coefficient,
        expectedSymbolValue.coefficient,
        "coefficient is incorrect"
      );
      assert.equal(
        symbol1Data.generationType,
        expectedSymbolValue.generationType,
        "generationType is incorrect"
      );

 
      let rand2 = 233875876; //00000001,00000000,00000000,00000000,00001101,11110000,10101001,10100100
      const treeId2 = 101;

      await attributeInstance._generateUniquenessFactor(
        treeId2,
        rand2,
        0,
        generationType1
      );

      let uniqueSymbol1 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(1054484);

      assert.equal(
        Number(uniqueSymbol1.generatedCount),
        1,
        "generated count is incorrect"
      );

      //164
      //169
      //240
      //13
      //0
      //0
      //0
      //0

      const attribute2Data = await treeTokenInstance.attributes.call(treeId2);

      let expectedAttributeValue2 = {
        attribute1: 164,
        attribute2: 169,
        attribute3: 240,
        attribute4: 13,
        attribute5: 0,
        attribute6: 0,
        attribute7: 0,
        attribute8: 0,
        generationType: 18,
      };

      // console.log("1", attribute2Data.attribute1.toString());
      // console.log("2", attribute2Data.attribute2.toString());
      // console.log("3", attribute2Data.attribute3.toString());
      // console.log("4", attribute2Data.attribute4.toString());
      // console.log("5", attribute2Data.attribute5.toString());
      // console.log("6", attribute2Data.attribute6.toString());
      // console.log("7", attribute2Data.attribute7.toString());
      // console.log("8", attribute2Data.attribute8.toString());

      assert.equal(
        attribute2Data.attribute1,
        expectedAttributeValue2.attribute1,
        "attribute1 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute2,
        expectedAttributeValue2.attribute2,
        "attribute2 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute3,
        expectedAttributeValue2.attribute3,
        "attribute3 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute4,
        expectedAttributeValue2.attribute4,
        "attribute4 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute5,
        expectedAttributeValue2.attribute5,
        "attribute5 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute6,
        expectedAttributeValue2.attribute6,
        "attribute6 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute7,
        expectedAttributeValue2.attribute7,
        "attribute7 is incorrect"
      );
      assert.equal(
        attribute2Data.attribute8,
        expectedAttributeValue2.attribute8,
        "attribute8 is incorrect"
      );

      assert.equal(
        attribute2Data.generationType,
        expectedAttributeValue2.generationType,
        "generation type is invlid"
      );

      const expectedSymbolValue2 = {
        shape: 20,
        trunkColor: 23,
        crownColor: 16,
        effect: 0,
        coefficient: 0,
        generationType: 18,
      };

      const symbol2Data = await treeTokenInstance.symbols.call(treeId2);

      // console.log("1", symbol2Data.shape.toString());
      // console.log("2", symbol2Data.trunkColor.toString());
      // console.log("3", symbol2Data.crownColor.toString());
      // console.log("4", symbol2Data.effect.toString());
      // console.log("5", symbol2Data.coefficient.toString());
      // console.log("6", symbol2Data.generationType.toString());
      //shape 010011010,0100
      assert.equal(
        symbol2Data.shape,
        expectedSymbolValue2.shape,
        "shape is incorrect"
      );

      assert.equal(
        symbol2Data.trunkColor,
        expectedSymbolValue2.trunkColor,
        "trunkColor is incorrect"
      );

      assert.equal(
        symbol2Data.crownColor,
        expectedSymbolValue2.crownColor,
        "crownColor is incorrect"
      );
      assert.equal(
        symbol2Data.effect,
        expectedSymbolValue2.effect,
        "effect is incorrect"
      );
      assert.equal(
        symbol2Data.coefficient,
        expectedSymbolValue2.coefficient,
        "coefficient is incorrect"
      );
      assert.equal(
        symbol2Data.generationType,
        expectedSymbolValue2.generationType,
        "generationType is incorrect"
      );
      //////////////////////////////////////////////////////////////////////////////

      let rand3 = web3.utils.toBN("5764607523034234879"); //01001111,11111111,11111111,11111111,11111111,11111111,11111111,11111111
      const treeId3 = 102;

      await attributeInstance._generateUniquenessFactor(
        treeId3,
        rand3,
        0,
        generationType1
      );

      //164
      //169
      //240
      //13
      //0
      //0
      //0
      //0

      const attribute3Data = await treeTokenInstance.attributes.call(treeId3);

      let expectedAttributeValue3 = {
        attribute1: 255,
        attribute2: 255,
        attribute3: 255,
        attribute4: 255,
        attribute5: 255,
        attribute6: 255,
        attribute7: 255,
        attribute8: 79,
        generationType: 18,
      };

      // console.log("1", attribute3Data.attribute1.toString());
      // console.log("2", attribute3Data.attribute2.toString());
      // console.log("3", attribute3Data.attribute3.toString());
      // console.log("4", attribute3Data.attribute4.toString());
      // console.log("5", attribute3Data.attribute5.toString());
      // console.log("6", attribute3Data.attribute6.toString());
      // console.log("7", attribute3Data.attribute7.toString());
      // console.log("8", attribute3Data.attribute8.toString());

      assert.equal(
        attribute3Data.attribute1,
        expectedAttributeValue3.attribute1,
        "attribute1 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute2,
        expectedAttributeValue3.attribute2,
        "attribute2 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute3,
        expectedAttributeValue3.attribute3,
        "attribute3 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute4,
        expectedAttributeValue3.attribute4,
        "attribute4 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute5,
        expectedAttributeValue3.attribute5,
        "attribute5 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute6,
        expectedAttributeValue3.attribute6,
        "attribute6 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute7,
        expectedAttributeValue3.attribute7,
        "attribute7 is incorrect"
      );
      assert.equal(
        attribute3Data.attribute8,
        expectedAttributeValue3.attribute8,
        "attribute8 is incorrect"
      );

      assert.equal(
        attribute3Data.generationType,
        expectedAttributeValue3.generationType,
        "generation type is invlid"
      );

      const expectedSymbolValue3 = {
        shape: 128,
        trunkColor: 6,
        crownColor: 5,
        effect: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol3Data = await treeTokenInstance.symbols.call(treeId3);

      // console.log("1", symbol3Data.shape.toString());
      // console.log("2", symbol3Data.trunkColor.toString());
      // console.log("3", symbol3Data.crownColor.toString());
      // console.log("4", symbol3Data.effect.toString());
      // console.log("5", symbol3Data.coefficient.toString());
      // console.log("6", symbol3Data.generationType.toString());
      //shape 010011010,0100

      assert.equal(
        symbol3Data.shape,
        expectedSymbolValue3.shape,
        "shape is incorrect"
      );

      assert.equal(
        symbol3Data.trunkColor,
        expectedSymbolValue3.trunkColor,
        "trunkColor is incorrect"
      );

      assert.equal(
        symbol3Data.crownColor,
        expectedSymbolValue3.crownColor,
        "crownColor is incorrect"
      );
      assert.equal(
        symbol3Data.effect,
        expectedSymbolValue3.effect,
        "effect is incorrect"
      );
      assert.equal(
        symbol3Data.coefficient,
        expectedSymbolValue3.coefficient,
        "coefficient is incorrect"
      );
      assert.equal(
        symbol3Data.generationType,
        expectedSymbolValue3.generationType,
        "generationType is incorrect"
      );

      //////////////////////////////////////////////////////////////////////////////////////
      let rand4 = web3.utils.toBN("1152921504556253183"); //00001111,11111111,11111111,11111111,11111100,11111011,11111111,11111111
      const treeId4 = 103;

      await attributeInstance._generateUniquenessFactor(
        treeId4,
        rand4,
        0,
        generationType1
      );

      //164
      //169
      //240
      //13
      //0
      //0
      //0
      //0

      const attribute4Data = await treeTokenInstance.attributes.call(treeId4);

      let expectedAttributeValue4 = {
        attribute1: 255,
        attribute2: 255,
        attribute3: 251,
        attribute4: 252,
        attribute5: 255,
        attribute6: 255,
        attribute7: 255,
        attribute8: 15,
        generationType: 18,
      };

      // console.log("1", attribute3Data.attribute1.toString());
      // console.log("2", attribute3Data.attribute2.toString());
      // console.log("3", attribute3Data.attribute3.toString());
      // console.log("4", attribute3Data.attribute4.toString());
      // console.log("5", attribute3Data.attribute5.toString());
      // console.log("6", attribute3Data.attribute6.toString());
      // console.log("7", attribute3Data.attribute7.toString());
      // console.log("8", attribute3Data.attribute8.toString());

      assert.equal(
        attribute4Data.attribute1,
        expectedAttributeValue4.attribute1,
        "attribute1 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute2,
        expectedAttributeValue4.attribute2,
        "attribute2 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute3,
        expectedAttributeValue4.attribute3,
        "attribute3 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute4,
        expectedAttributeValue4.attribute4,
        "attribute4 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute5,
        expectedAttributeValue4.attribute5,
        "attribute5 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute6,
        expectedAttributeValue4.attribute6,
        "attribute6 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute7,
        expectedAttributeValue4.attribute7,
        "attribute7 is incorrect"
      );
      assert.equal(
        attribute4Data.attribute8,
        expectedAttributeValue4.attribute8,
        "attribute8 is incorrect"
      );

      assert.equal(
        attribute3Data.generationType,
        expectedAttributeValue3.generationType,
        "generation type is invlid"
      );

      const expectedSymbolValue4 = {
        shape: 129,
        trunkColor: 12,
        crownColor: 10,
        effect: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol4Data = await treeTokenInstance.symbols.call(treeId4);

      // console.log("1", symbol4Data.shape.toString());
      // console.log("2", symbol4Data.trunkColor.toString());
      // console.log("3", symbol4Data.crownColor.toString());
      // console.log("4", symbol3Data.effect.toString());
      // console.log("5", symbol3Data.coefficient.toString());
      // console.log("6", symbol3Data.generationType.toString());
      //shape 010011010,0100

      assert.equal(
        symbol4Data.shape,
        expectedSymbolValue4.shape,
        "shape is incorrect"
      );

      assert.equal(
        symbol4Data.trunkColor,
        expectedSymbolValue4.trunkColor,
        "trunkColor is incorrect"
      );

      assert.equal(
        symbol4Data.crownColor,
        expectedSymbolValue4.crownColor,
        "crownColor is incorrect"
      );
      assert.equal(
        symbol3Data.effect,
        expectedSymbolValue3.effect,
        "effect is incorrect"
      );
      assert.equal(
        symbol3Data.coefficient,
        expectedSymbolValue3.coefficient,
        "coefficient is incorrect"
      );
      assert.equal(
        symbol3Data.generationType,
        expectedSymbolValue3.generationType,
        "generationType is incorrect"
      );

      ////////////////// -------------------- should return false
      let rand5 = web3.utils.toBN("72057594271803812"); //00001111,11111111,11111111,11111111,11111111,11111111,11111111,11111111
      const treeId5 = 104;

      await attributeInstance._generateUniquenessFactor(
        treeId5,
        rand5,
        0,
        generationType1
      );

      let uniqueSymbol2 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(1054484);

      assert.equal(
        Number(uniqueSymbol2.generatedCount),
        2,
        "generatedCount is incorrect"
      );
    
    });

        ////--------------------------test _calcCoefficient (private function) -------------------------

    it("Check _calcCoefficient", async () => {
      ///-------------------------- test _calcCoefficient --------------------------

      let result1 = await attributeInstance._calcCoefficient.call(49152, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1), 2, "_calcCoefficient not true");

      let result1_1 = await attributeInstance._calcCoefficient.call(49153, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1_1), 3, "_calcCoefficient not true");

      let result2 = await attributeInstance._calcCoefficient.call(45877, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result2), 3, "_calcCoefficient not true");

      let result3 = await attributeInstance._calcCoefficient.call(63899, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result3), 6, "_calcCoefficient not true");

      let result4 = await attributeInstance._calcCoefficient.call(65535, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result4), 8, "_calcCoefficient not true");
    });

    ////--------------------------test calc shape (private function) -------------------------

    it("Check calc shape", async () => {
      ///-------------------------- test special shape --------------------------
      // 1111 == 15
      let result1 = await attributeInstance._calcShape.call(2, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1), 17, "result1 not true");

      for (let i = 1; i < 17; i++) {
        await attributeInstance._calcShape(15, 0, {
          from: userAccount3,
        });
        assert.equal(Number(await attributeInstance.specialTreeCount()), i);
      }

      let result6 = await attributeInstance._calcShape.call(0, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result6), 33, "result6 not true");

      await attributeInstance._calcShape(3, 0, {
        from: userAccount3,
      });
      assert.equal(Number(await attributeInstance.specialTreeCount()), 16);

      ///-------------------------- test shape --------------------------

      ////----test2

      // 100001011 1111 == 4287
      let result2 = await attributeInstance._calcShape.call(4287, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result2), 80, "result2 not true");

      ////----test3

      // 11 0000 == 3
      let result3 = await attributeInstance._calcShape.call(48, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result3), 33, "result3 not true");

      ////----test4

      // 110000101011 1000 == 3115
      let result4 = await attributeInstance._calcShape.call(49848, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result4), 137, "result4 not true");

      ////----test5

      // 111111111111 1111 == 4095
      let result5 = await attributeInstance._calcShape.call(65535, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result5), 144, "result5 not true");
    });

    ////--------------------------test calc colors (private function) -------------------------

    it("Check calc colors", async () => {
      ///-------------------------- test calcColors --------------------------

      ////----test1
      // a == 111111111111 1 111 4095
      // b == 111111111111 1 111 4095
      let result1 = await attributeInstance._calcColors.call(65535, 65535, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1[0]), 65, "result1 trunkColor not true");
      assert.equal(Number(result1[1]), 65, "result1 crownColor not true");

      ////----test2
      // a == 000 0000000000000 0
      // b == 000 0000000000000 0
      let result2 = await attributeInstance._calcColors.call(0, 0, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result2[0]), 2, "result2 trunkColor not true");
      assert.equal(Number(result2[1]), 2, "result2 crownColor not true");

      ////----test3
      // a == 1011100000 0 101 11781
      // b ==10010001101 0 011 18643
      let result3 = await attributeInstance._calcColors.call(11781, 18643, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result3[0]), 23, "result3 trunkColor not true");
      assert.equal(Number(result3[1]), 37, "result3 crownColor not true");

      ////----test4
      // a == 111101011 1 101
      // b == 1111010110 1 101
      let result4 = await attributeInstance._calcColors.call(7869, 15725, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result4[0]), 23, "result4 trunkColor not true");
      assert.equal(Number(result4[1]), 31, "result4 crownColor not true");

      ////----test5
      // a == 10000011 0 001  131
      // b == 10101101110 1 000
      let result5 = await attributeInstance._calcColors.call(2097, 22248, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result5[0]), 11, "result5 trunkColor not true");
      assert.equal(Number(result5[1]), 26, "result5 crownColor not true");
    });

  /*
  describe("createSymbol", () => {
    beforeEach(async () => {
      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        { from: deployerAccount }
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
    });

    // it("should addTreejerContractRole successfully", async () => {
    //   const treeId1 = 101;
    //   const treeId2 = 102;
    //   const treejerContract = userAccount1;

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     treejerContract,
    //     deployerAccount
    //   );

    //   // planterDai, referralDai, treePrice, _daiAmount;
    //   const randTree1 = web3.utils.soliditySha3(
    //     web3.utils.toWei("2"),
    //     web3.utils.toWei("1"),
    //     web3.utils.toWei("7"),
    //     web3.utils.toWei("9")
    //   );
    //   const generationType = 18;

    //   await attributeInstance
    //     .createSymbol(treeId1, randTree1, userAccount2,0, generationType, {
    //       from: userAccount7,
    //     })
    //     .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    //   await attributeInstance.createSymbol(
    //     treeId1,
    //     randTree1,
    //     userAccount2,
    //     0
    //     generationType,
    //     {
    //       from: treejerContract,
    //     }
    //   );

    //   let generatedAttributes1 =
    //     await attributeInstance.uniquenessFactorToGeneratedAttributesCount.call(
    //       web3.utils.toBN("15485305705186275445")
    //     );

    //   assert.equal(
    //     generatedAttributes1,
    //     1,
    //     "uniquenessFactorToGeneratedAttributesCount is not correct"
    //   );

    //   const uniqueSymbol1 = await attributeInstance.uniquenessFactorToSymbolStatus.call(
    //     33824549
    //   );
    //   assert.equal(
    //     Number(uniqueSymbol1.status),
    //     2,
    //     "symbol status is incorrect"
    //   );

    //   assert.equal(
    //     Number(uniqueSymbol1.generatedCount),
    //     1,
    //     "symbol generatedCount is incorrect"
    //   );

    //   const attribute1Data = await treeTokenInstance.attributes.call(
    //     treeId1
    //   );

    //   //11010110,11100110,11011011,01111110,10000011,11110101,00110000,01110101

    //   let expectedAttributeValue1 = {
    //     attribute1: 117,
    //     attribute2: 48,
    //     attribute3: 245,
    //     attribute4: 131,
    //     attribute5: 126,
    //     attribute6: 219,
    //     attribute7: 230,
    //     attribute8: 214,
    //     generationType: 18,
    //   };

    //   console.log("1", attribute1Data.attribute1.toString());
    //   console.log("2", attribute1Data.attribute2.toString());
    //   console.log("3", attribute1Data.attribute3.toString());
    //   console.log("4", attribute1Data.attribute4.toString());
    //   console.log("5", attribute1Data.attribute5.toString());
    //   console.log("6", attribute1Data.attribute6.toString());
    //   console.log("7", attribute1Data.attribute7.toString());
    //   console.log("8", attribute1Data.attribute8.toString());

    //   assert.equal(
    //     attribute1Data.attribute1,
    //     expectedAttributeValue1.attribute1,
    //     "attribute1 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute2,
    //     expectedAttributeValue1.attribute2,
    //     "attribute2 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute3,
    //     expectedAttributeValue1.attribute3,
    //     "attribute3 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute4,
    //     expectedAttributeValue1.attribute4,
    //     "attribute4 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute5,
    //     expectedAttributeValue1.attribute5,
    //     "attribute5 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute6,
    //     expectedAttributeValue1.attribute6,
    //     "attribute6 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute7,
    //     expectedAttributeValue1.attribute7,
    //     "attribute7 is incorrect"
    //   );
    //   assert.equal(
    //     attribute1Data.attribute8,
    //     expectedAttributeValue1.attribute8,
    //     "attribute8 is incorrect"
    //   );

    //   assert.equal(
    //     attribute1Data.generationType,
    //     expectedAttributeValue1.generationType,
    //     "generation type is invlid"
    //   );
    //   // 0101; // 5
    //   // 100000111; //263

    //   const expectedSymbolValue1 = {
    //     shape: 37,
    //     trunkColor: 31,
    //     crownColor: 4,
    //     effect: 2,
    //     coefficient: 1,
    //     generationType: 18,
    //   };

    //   const symbol1Data = await treeTokenInstance.symbols.call(treeId1);
    //   // console.log("1", symbol1Data.shape.toString());
    //   // console.log("2", symbol1Data.trunkColor.toString());
    //   // console.log("3", symbol1Data.crownColor.toString());
    //   // console.log("4", symbol1Data.effect.toString());
    //   // console.log("5", symbol1Data.coefficient.toString());
    //   // console.log("6", symbol1Data.generationType.toString());

    //   assert.equal(
    //     symbol1Data.shape,
    //     expectedSymbolValue1.shape,
    //     "shape is incorrect"
    //   );

    //   assert.equal(
    //     symbol1Data.trunkColor,
    //     expectedSymbolValue1.trunkColor,
    //     "trunkColor is incorrect"
    //   );

    //   assert.equal(
    //     symbol1Data.crownColor,
    //     expectedSymbolValue1.crownColor,
    //     "crownColor is incorrect"
    //   );
    //   assert.equal(
    //     symbol1Data.effect,
    //     expectedSymbolValue1.effect,
    //     "effect is incorrect"
    //   );
    //   assert.equal(
    //     symbol1Data.coefficient,
    //     expectedSymbolValue1.coefficient,
    //     "coefficient is incorrect"
    //   );
    //   assert.equal(
    //     symbol1Data.generationType,
    //     expectedSymbolValue1.generationType,
    //     "generationType is incorrect"
    //   );

    //   let yy = await attributeInstance.createSymbol(
    //     treeId2,
    //     randTree1,
    //     userAccount2,
    //     0,
    //     generationType,
    //     {
    //       from: treejerContract,
    //     }
    //   );

    //   const attribute2Data = await treeTokenInstance.attributes.call(
    //     treeId2
    //   );
    //   console.log("1", attribute2Data.attribute1.toString());
    //   console.log("2", attribute2Data.attribute2.toString());
    //   console.log("3", attribute2Data.attribute3.toString());
    //   console.log("4", attribute2Data.attribute4.toString());
    //   console.log("5", attribute2Data.attribute5.toString());
    //   console.log("6", attribute2Data.attribute6.toString());
    //   console.log("7", attribute2Data.attribute7.toString());
    //   console.log("8", attribute2Data.attribute8.toString());

    //   // binary 00111110,00000100,11110010,01001000,00000010,11011010,11110101,01010110

    //   let expectedAttributeValue2 = {
    //     attribute1: 86,
    //     attribute2: 245,
    //     attribute3: 218,
    //     attribute4: 2,
    //     attribute5: 72,
    //     attribute6: 242,
    //     attribute7: 4,
    //     attribute8: 62,
    //     generationType: 18,
    //   };

    //   assert.equal(
    //     attribute2Data.attribute1,
    //     expectedAttributeValue2.attribute1,
    //     "attribute1 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute2,
    //     expectedAttributeValue2.attribute2,
    //     "attribute2 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute3,
    //     expectedAttributeValue2.attribute3,
    //     "attribute3 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute4,
    //     expectedAttributeValue2.attribute4,
    //     "attribute4 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute5,
    //     expectedAttributeValue2.attribute5,
    //     "attribute5 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute6,
    //     expectedAttributeValue2.attribute6,
    //     "attribute6 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute7,
    //     expectedAttributeValue2.attribute7,
    //     "attribute7 is incorrect"
    //   );
    //   assert.equal(
    //     attribute2Data.attribute8,
    //     expectedAttributeValue2.attribute8,
    //     "attribute8 is incorrect"
    //   );

    //   assert.equal(
    //     attribute2Data.generationType,
    //     expectedAttributeValue2.generationType,
    //     "generation type is invlid"
    //   );
    //   // 0101; // 5
    //   // 100000111; //263

    //   const expectedSymbolValue2 = {
    //     shape: 54,
    //     trunkColor: 46,
    //     crownColor: 0,
    //     effect: 1,
    //     coefficient: 3,
    //     generationType: 18,
    //   };

    //   const symbol2Data = await treeTokenInstance.symbols.call(treeId2);
    //   console.log("1", symbol2Data.shape.toString());
    //   console.log("2", symbol2Data.trunkColor.toString());
    //   console.log("3", symbol2Data.crownColor.toString());
    //   console.log("4", symbol2Data.effect.toString());
    //   console.log("5", symbol2Data.coefficient.toString());
    //   console.log("6", symbol2Data.generationType.toString());

    //   assert.equal(
    //     symbol2Data.shape,
    //     expectedSymbolValue2.shape,
    //     "shape is incorrect"
    //   );

    //   assert.equal(
    //     symbol2Data.trunkColor,
    //     expectedSymbolValue2.trunkColor,
    //     "trunkColor is incorrect"
    //   );

    //   assert.equal(
    //     symbol2Data.crownColor,
    //     expectedSymbolValue2.crownColor,
    //     "crownColor is incorrect"
    //   );
    //   assert.equal(
    //     symbol2Data.effect,
    //     expectedSymbolValue2.effect,
    //     "effect is incorrect"
    //   );
    //   assert.equal(
    //     symbol2Data.coefficient,
    //     expectedSymbolValue2.coefficient,
    //     "coefficient is incorrect"
    //   );
    //   assert.equal(
    //     symbol2Data.generationType,
    //     expectedSymbolValue2.generationType,
    //     "generationType is incorrect"
    //   );

    //   let generatedAttributes2 =
    //     await attributeInstance.uniquenessFactorToGeneratedAttributesCount.call(
    //       web3.utils.toBN("4468963121357845846")
    //     );

    //   assert.equal(
    //     generatedAttributes2,
    //     1,
    //     "uniquenessFactorToGeneratedAttributesCount is not correct"
    //   );

    //   const uniqueSymbol2 = await attributeInstance.uniquenessFactorToSymbolStatus.call(
    //     16789046
    //   );
    //   assert.equal(
    //     Number(uniqueSymbol2.status),
    //     2,
    //     "symbol status is incorrect"
    //   );

    //   assert.equal(
    //     Number(uniqueSymbol2.generatedCount),
    //     1,
    //     "symbol generatedCount is incorrect"
    //   );

    //   console.log("attr2", generatedAttributes2.toString());

    //   // const result = await attributeInstance.createSymbol.call(
    //   //   treeId1,
    //   //   randTree1,
    //   //   userAccount2,
    //   //   0,
    //   //   generationType,
    //   //   {
    //   //     from: treejerContract,
    //   //   }
    //   // );

    //   // assert.equal(result, true, "result is incorrect");
    // });


    //////////////////////////////////////////////////////////////////////////////////////////////
    
    it("test generated attributes when call createAttribute", async () => {
      ///---------------test1
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

      //1900751594994632129  11010 01100000 11010011 10000001 01001001 11101001 10000101 11000001
      let expected10001 = {
        attribute1: 193,
        attribute2: 133,
        attribute3: 233,
        attribute4: 73,
        attribute5: 129,
        attribute6: 211,
        attribute7: 96,
        attribute8: 26,
        generationType: 1,
      };

      await attributeInstance.createAttribute(10001, {
        from: deployerAccount,
      });

      let attribute10001 = await treeTokenInstance.attributes(10001);

      assert.equal(
        await attributeInstance.uniquenessFactorToGeneratedAttributesCount(
          web3.utils.toBN("1900751594994632129")
        ),
        1,
        "result is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute1),
        Number(expected10001.attribute1),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute2),
        Number(expected10001.attribute2),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute3),
        Number(expected10001.attribute3),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute4),
        Number(expected10001.attribute4),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute5),
        Number(expected10001.attribute5),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute6),
        Number(expected10001.attribute6),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute7),
        Number(expected10001.attribute7),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.attribute8),
        Number(expected10001.attribute8),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute10001.generationType),
        Number(expected10001.generationType),
        "generationType is not correct"
      );

      ///---------------test1
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

      //733341636019015643  1010 00101101 01011010 01010101 00100001 11101010 11001111 11011011
      let expected153 = {
        attribute1: 219,
        attribute2: 207,
        attribute3: 234,
        attribute4: 33,
        attribute5: 85,
        attribute6: 90,
        attribute7: 45,
        attribute8: 10,
        generationType: 1,
      };

      await attributeInstance.createAttribute(115, {
        from: deployerAccount,
      });

      let attribute153 = await treeTokenInstance.attributes(115);

      assert.equal(
        await attributeInstance.uniquenessFactorToGeneratedAttributesCount(
          web3.utils.toBN("733341636019015643")
        ),
        1,
        "result is not correct"
      );

      assert.equal(
        Number(attribute153.attribute1),
        Number(expected153.attribute1),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute2),
        Number(expected153.attribute2),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute3),
        Number(expected153.attribute3),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute4),
        Number(expected153.attribute4),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute5),
        Number(expected153.attribute5),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute6),
        Number(expected153.attribute6),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute7),
        Number(expected153.attribute7),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.attribute8),
        Number(expected153.attribute8),
        "attributes is not correct"
      );

      assert.equal(
        Number(attribute153.generationType),
        Number(expected153.generationType),
        "generationType is not correct"
      );
    });

    it("test generated attributes when call createAttribute", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree.new({
        from: deployerAccount,
      });

      await testInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

      ///---------------test1
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

      //1900751594994632129  11010 01100000 11010011 10000001 01001001 11101001 10000101 11000001

      await attributeInstance.createAttribute(10001, {
        from: deployerAccount,
      });

      assert.equal(
        await attributeInstance.uniquenessFactorToGeneratedAttributesCount(
          web3.utils.toBN("1900751594994632129")
        ),
        1,
        "result is not correct"
      );

      await testInstance.test(10001);

      await attributeInstance.createAttribute(10001, {
        from: deployerAccount,
      });

      assert.equal(
        await attributeInstance.uniquenessFactorToGeneratedAttributesCount(
          web3.utils.toBN("1900751594994632129")
        ),
        2,
        "result is not correct"
      );
    });

  });
  */
});
