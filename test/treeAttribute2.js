const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const Tree = artifacts.require("Tree.sol");
const TestTree = artifacts.require("TestTree.sol");
//treasury section
const WethFund = artifacts.require("WethFund.sol");

const PlanterFund = artifacts.require("PlanterFund.sol");
const Weth = artifacts.require("Weth.sol");
const Math = require("./math");

//uniswap
let Factory;
var Dai = artifacts.require("Dai.sol");
let UniswapV2Router02New;
let TestUniswap;

if (process.env.COVERAGE) {
  UniswapV2Router02New = artifacts.require("UniSwapMini.sol");
} else {
  Factory = artifacts.require("Factory.sol");
  UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
  TestUniswap = artifacts.require("TestUniswap.sol");
}

//test

const TestTreeAttributes = artifacts.require("TestTreeAttributes.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, TreeAttributeErrorMsg } = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("TreeAttribute", (accounts) => {
  let iSaleInstance;
  let arInstance;

  let treeAttributeInstance;
  let wethFundInstance;
  let planterFundsInstnce;
  let wethInstance;
  let daiInstance;
  let treeTokenInstance;
  let factoryInstance;
  let uniswapRouterInstance;
  let testUniswapInstance;
  let WETHAddress;
  let DAIAddress;
  let uniswapV2Router02NewAddress;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const buyerRank = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const randTree = web3.utils.soliditySha3(10000, 0, "", 0, zeroAddress, "");

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ////--------------------------uniswap deploy
    if (!process.env.COVERAGE) {
      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;
      wethInstance = await Weth.new("WETH", "weth", { from: accounts[0] });
      WETHAddress = wethInstance.address;
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
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
    } else {
      wethInstance = await Weth.new("WETH", "weth", {
        from: accounts[0],
      });
      WETHAddress = wethInstance.address;
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
      DAIAddress = daiInstance.address;
      uniswapRouterInstance = await UniswapV2Router02New.new(
        DAIAddress,
        WETHAddress,
        { from: deployerAccount }
      );
      uniswapV2Router02NewAddress = uniswapRouterInstance.address;
      await wethInstance.setMint(
        uniswapV2Router02NewAddress,
        web3.utils.toWei("125000", "Ether")
      );
      await daiInstance.setMint(
        uniswapV2Router02NewAddress,
        web3.utils.toWei("250000000", "Ether")
      );
    }

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
    await Common.addScriptRole(arInstance, buyerRank, deployerAccount);
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );
    });

    it("deploys successfully", async () => {
      const address = treeAttributeInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    ///////////////---------------------------------test reserveTreeAttributes function--------------------------------------------------------
    it("Should reserveTreeAttributes work successfully", async () => {
      ////------------Should reserveTreeAttributes rejec because caller must be admin or communityGifts
      const generatedCode1 = 12500123;

      await treeAttributeInstance
        .reserveTreeAttributes(generatedCode1, { from: userAccount7 })
        .should.be.rejectedWith(
          CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
        );

      //////////////////// reserve attribute and check data

      const eventTx1 = await treeAttributeInstance.reserveTreeAttributes(
        generatedCode1,
        {
          from: dataManager,
        }
      );

      const uniqueSymbol1 = await treeAttributeInstance.uniqueSymbol.call(
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
        return ev.generatedCode == generatedCode1;
      });

      //////// ------------Should reserveTreeAttributes rejec because generatedCode has been reserved before
      await treeAttributeInstance
        .reserveTreeAttributes(generatedCode1, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_TAKEN);

      // ////// ----------------------- test 2

      let generatedCode2 = 0;

      await Common.addTreejerContractRole(
        arInstance,
        userAccount2,
        deployerAccount
      );

      const eventTx2 = await treeAttributeInstance.reserveTreeAttributes(
        generatedCode2,
        {
          from: userAccount2,
        }
      );

      const uniqueSymbol2 = await treeAttributeInstance.uniqueSymbol.call(
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
        return ev.generatedCode == generatedCode2;
      });
    });

    ///////////////---------------------------------test freeReserveTreeAttributes function--------------------------------------------------------

    it("Should freeReserveTreeAttributes work successfully", async () => {
      /////----------------Should freeReserveTreeAttributes rejec because generatedCode hasn't been reserved before
      let generatedCode1 = 12500123;

      await treeAttributeInstance
        .freeReserveTreeAttributes(generatedCode1, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_NOT_RESERVED);

      /////----------------Should freeReserveTreeAttributes rejec because caller must be admin or communityGifts

      await treeAttributeInstance.reserveTreeAttributes(generatedCode1, {
        from: dataManager,
      });

      ////////////////// --------------- check data after reserve

      const uniqueSymbol1AfterReserve =
        await treeAttributeInstance.uniqueSymbol.call(generatedCode1);

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

      await treeAttributeInstance
        .freeReserveTreeAttributes(generatedCode1, { from: userAccount7 })
        .should.be.rejectedWith(
          CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
        );
      ///////////////// ------------- free reserve
      const eventTx1 = await treeAttributeInstance.freeReserveTreeAttributes(
        generatedCode1,
        {
          from: dataManager,
        }
      );

      const uniqueSymbol1AfterFreeReserve =
        await treeAttributeInstance.uniqueSymbol.call(generatedCode1);

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

      truffleAssert.eventEmitted(eventTx1, "ReservedSymbolFreed", (ev) => {
        return ev.generatedCode == generatedCode1;
      });

      //////------------------------test 2

      let generatedCode2 = 0;

      await Common.addTreejerContractRole(
        arInstance,
        userAccount2,
        deployerAccount
      );

      await treeAttributeInstance.reserveTreeAttributes(generatedCode2, {
        from: userAccount2,
      });

      const eventTx2 = await treeAttributeInstance.freeReserveTreeAttributes(
        generatedCode2,
        {
          from: userAccount2,
        }
      );

      const uniqueSymbol2AfterFreeReserve =
        await treeAttributeInstance.uniqueSymbol.call(generatedCode2);

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

      truffleAssert.eventEmitted(eventTx2, "ReservedSymbolFreed", (ev) => {
        return ev.generatedCode == generatedCode2;
      });
    });
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await treeAttributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        { from: deployerAccount }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );
    });

    it("set attributes by admin", async () => {
      const treeId1 = 1000;
      const generatedCode1 = await web3.utils.toBN(18446744070000000000); // 2 ** 64 - 2 ** 25;

      const generatedSymbol1 = 10;
      const generationType1 = 18;

      //////////////// fail because caller is invalid
      await treeAttributeInstance
        .setTreeAttributesByAdmin(
          treeId1,
          generatedCode1,
          generatedSymbol1,
          generationType1,
          { from: userAccount7 }
        )
        .should.be.rejectedWith(
          CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
        );

      /////////////// add successfully and check data

      const eventTx1 = await treeAttributeInstance.setTreeAttributesByAdmin(
        treeId1,
        generatedCode1,
        generatedSymbol1,
        generationType1,
        { from: dataManager }
      );

      const generatedAttributes1 =
        await treeAttributeInstance.generatedAttributes.call(generatedCode1);

      const uniqueSymbol1 = await treeAttributeInstance.uniqueSymbol.call(
        generatedSymbol1
      );

      assert.equal(
        Number(generatedAttributes1),
        1,
        "generatedAttributes is incorrect"
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

      truffleAssert.eventEmitted(eventTx1, "SymbolSetByAdmin", (ev) => {
        return Number(ev.treeId) == treeId1;
      });

      ////// cehck symbol and attribute struct data

      ///// -------- check attribute

      // generatedCode1 value = 18446744070000000000
      //generatedCode binary = 11111111,11111111,11111111,11111111,00100010,11100100,10111100,00000000

      const attribute1Data = await treeTokenInstance.treeAttributes.call(
        treeId1
      );

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
        treeShape: 10,
        trunkColor: 0,
        crownColor: 0,
        effects: 0,
        coefficient: 2,
        generationType: 18,
      };

      const symbol1Data = await treeTokenInstance.treeSymbols.call(treeId1);

      assert.equal(
        symbol1Data.treeShape,
        expectedSymbolValue.treeShape,
        "treeShape is incorrect"
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
        symbol1Data.effects,
        expectedSymbolValue.effects,
        "effects is incorrect"
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

      //////////////////////// ------------- fail to set

      await treeAttributeInstance
        .setTreeAttributesByAdmin(
          treeId1,
          generatedCode1,
          generatedSymbol1,
          generationType1,
          { from: dataManager }
        )
        .should.be.rejectedWith(TreeAttributeErrorMsg.SYMBOL_IS_TAKEN);
    });
    /*
    it("should _calcRandSymbol work successfully", async () => {
      ///////////// ------------------- check 1

      const treeId = 100;
      const rand = await web3.utils.toBN(18446744070000000000); // 2 ** 64 - 2 ** 25;
      const generationType1 = 18;

      await treeAttributeInstance._calcRandSymbol(
        userAccount2,
        treeId,
        rand,
        generationType1
      );

      const attribute1Data = await treeTokenInstance.treeAttributes.call(
        treeId
      );

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

      const expectedSymbolValue = {
        treeShape: 80,
        trunkColor: 7,
        crownColor: 1,
        effects: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol1Data = await treeTokenInstance.treeSymbols.call(treeId);

      assert.equal(
        symbol1Data.treeShape,
        expectedSymbolValue.treeShape,
        "treeShape is incorrect"
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
        symbol1Data.effects,
        expectedSymbolValue.effects,
        "effects is incorrect"
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

      await treeAttributeInstance._calcRandSymbol(
        userAccount2,
        treeId2,
        rand2,
        generationType1
      );

      let uniqueSymbol1 = await treeAttributeInstance.uniqueSymbol.call(
        1054484
      );

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

      const attribute2Data = await treeTokenInstance.treeAttributes.call(
        treeId2
      );

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
        treeShape: 20,
        trunkColor: 23,
        crownColor: 16,
        effects: 0,
        coefficient: 0,
        generationType: 18,
      };

      const symbol2Data = await treeTokenInstance.treeSymbols.call(treeId2);

      // console.log("1", symbol2Data.treeShape.toString());
      // console.log("2", symbol2Data.trunkColor.toString());
      // console.log("3", symbol2Data.crownColor.toString());
      // console.log("4", symbol2Data.effects.toString());
      // console.log("5", symbol2Data.coefficient.toString());
      // console.log("6", symbol2Data.generationType.toString());
      //treeShape 010011010,0100
      assert.equal(
        symbol2Data.treeShape,
        expectedSymbolValue2.treeShape,
        "treeShape is incorrect"
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
        symbol2Data.effects,
        expectedSymbolValue2.effects,
        "effects is incorrect"
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

      await treeAttributeInstance._calcRandSymbol(
        userAccount2,
        treeId3,
        rand3,
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

      const attribute3Data = await treeTokenInstance.treeAttributes.call(
        treeId3
      );

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
        treeShape: 128,
        trunkColor: 6,
        crownColor: 5,
        effects: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol3Data = await treeTokenInstance.treeSymbols.call(treeId3);

      // console.log("1", symbol3Data.treeShape.toString());
      // console.log("2", symbol3Data.trunkColor.toString());
      // console.log("3", symbol3Data.crownColor.toString());
      // console.log("4", symbol3Data.effects.toString());
      // console.log("5", symbol3Data.coefficient.toString());
      // console.log("6", symbol3Data.generationType.toString());
      //treeShape 010011010,0100

      assert.equal(
        symbol3Data.treeShape,
        expectedSymbolValue3.treeShape,
        "treeShape is incorrect"
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
        symbol3Data.effects,
        expectedSymbolValue3.effects,
        "effects is incorrect"
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

      await treeAttributeInstance._calcRandSymbol(
        userAccount2,
        treeId4,
        rand4,
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

      const attribute4Data = await treeTokenInstance.treeAttributes.call(
        treeId4
      );

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
        treeShape: 129,
        trunkColor: 12,
        crownColor: 10,
        effects: 15,
        coefficient: 7,
        generationType: 18,
      };

      const symbol4Data = await treeTokenInstance.treeSymbols.call(treeId4);

      // console.log("1", symbol4Data.treeShape.toString());
      // console.log("2", symbol4Data.trunkColor.toString());
      // console.log("3", symbol4Data.crownColor.toString());
      // console.log("4", symbol3Data.effects.toString());
      // console.log("5", symbol3Data.coefficient.toString());
      // console.log("6", symbol3Data.generationType.toString());
      //treeShape 010011010,0100

      assert.equal(
        symbol4Data.treeShape,
        expectedSymbolValue4.treeShape,
        "treeShape is incorrect"
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
        symbol3Data.effects,
        expectedSymbolValue3.effects,
        "effects is incorrect"
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

      await treeAttributeInstance._calcRandSymbol(
        userAccount2,
        treeId5,
        rand5,
        generationType1
      );

      let uniqueSymbol2 = await treeAttributeInstance.uniqueSymbol.call(
        1054484
      );

      assert.equal(
        Number(uniqueSymbol2.generatedCount),
        2,
        "generatedCount is incorrect"
      );
    });

    
    ////--------------------------test calc treeShape (private function) -------------------------

    it("Check calc treeShape", async () => {
      ///-------------------------- test special treeShape --------------------------
      // 111111111 111 == 2 ** 13 -1
      let result1 = await treeAttributeInstance._calcTreeShape.call(
        2 ** 13 - 1,
        0,
        {
          from: userAccount3,
        }
      );

      assert.equal(Number(result1), 128, "result1 not true");

      for (let i = 1; i < 17; i++) {
        await treeAttributeInstance._calcTreeShape(2 ** 13 - 1, 0, {
          from: userAccount3,
        });
        assert.equal(Number(await treeAttributeInstance.specialCount()), i);
      }

      let result6 = await treeAttributeInstance._calcTreeShape.call(
        2 ** 13 - 15,
        0,
        {
          from: userAccount3,
        }
      );

      assert.equal(Number(result6), 113, "result6 not true");

      await treeAttributeInstance._calcTreeShape(2 ** 13 - 3, 0, {
        from: userAccount3,
      });
      assert.equal(Number(await treeAttributeInstance.specialCount()), 16);

      ///-------------------------- test treeShape --------------------------

      ////----test2

      // 1101110 0000 == 1760
      let result2 = await treeAttributeInstance._calcTreeShape.call(1760, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result2), 16, "result2 not true");

      ////----test3

      // 1101101 1111 == 1759
      let result3 = await treeAttributeInstance._calcTreeShape.call(1759, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result3), 15, "result3 not true");

      ////----test4

      // 111000001 1000 == 7192
      let result4 = await treeAttributeInstance._calcTreeShape.call(7192, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result4), 88, "result4 not true");

      ////----test5

      // 101010100 1010 == 5450
      let result5 = await treeAttributeInstance._calcTreeShape.call(5450, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result5), 74, "result5 not true");
    });

    ////--------------------------test calc colors (private function) -------------------------

    it("Check calc colors", async () => {
      ///-------------------------- test calcColors --------------------------

      ////----test1
      // a == 111 11111 255
      // b == 111 11111 255
      let result1 = await treeAttributeInstance._calcColors.call(255, 255, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1[0]), 63, "result1 trunkColor not true");
      assert.equal(Number(result1[1]), 63, "result1 crownColor not true");

      ////----test2
      // a == 000 00000 0
      // b == 000 00000 0
      let result2 = await treeAttributeInstance._calcColors.call(0, 0, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result2[0]), 0, "result2 trunkColor not true");
      assert.equal(Number(result2[1]), 0, "result2 crownColor not true");

      ////----test3
      // a == 101 00000 160
      // b == 011 00000 96
      let result3 = await treeAttributeInstance._calcColors.call(160, 96, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result3[0]), 5, "result3 trunkColor not true");
      assert.equal(Number(result3[1]), 3, "result3 crownColor not true");

      ////----test4
      // a == 101 10100 20
      // b == 101 10101 21
      let result4 = await treeAttributeInstance._calcColors.call(180, 181, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result4[0]), 45, "result4 trunkColor not true");
      assert.equal(Number(result4[1]), 45, "result4 crownColor not true");

      ////----test5
      // a == 001 00110 38
      // b == 000 01011 11
      let result5 = await treeAttributeInstance._calcColors.call(38, 11, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result5[0]), 9, "result5 trunkColor not true");
      assert.equal(Number(result5[1]), 16, "result5 crownColor not true");
    });

    ////--------------------------test _setColors (private function) -------------------------

    it("Check _setColors", async () => {
      ///-------------------------- test _setColors --------------------------

      let result1 = await treeAttributeInstance._setColors.call(128, {
        from: userAccount3,
      });

      assert.equal(Number(result1[0]), 6, "result1 trunkColor not true");
      assert.equal(Number(result1[1]), 5, "result1 trunkColor not true");

      let result2 = await treeAttributeInstance._setColors.call(143, {
        from: userAccount3,
      });

      assert.equal(Number(result2[0]), 32, "result2 trunkColor not true");
      assert.equal(Number(result2[1]), 32, "result2 trunkColor not true");

      let result3 = await treeAttributeInstance._setColors.call(130, {
        from: userAccount3,
      });

      assert.equal(Number(result3[0]), 18, "result3 trunkColor not true");
      assert.equal(Number(result3[1]), 15, "result3 trunkColor not true");
    });

    ////--------------------------test _calcEffects (private function) -------------------------

    it("Check _calcEffects", async () => {
      ///-------------------------- test _calcEffects --------------------------

      let result1 = await treeAttributeInstance._calcEffects.call(255, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1), 15, "calcEffects not true");

      let result2 = await treeAttributeInstance._calcEffects.call(50, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result2), 0, "calcEffects not true");

      let result3 = await treeAttributeInstance._calcEffects.call(50, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result3), 1, "calcEffects not true");

      let result4 = await treeAttributeInstance._calcEffects.call(241, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result4), 12, "calcEffects not true");
    });

    ////--------------------------test _calcCoefficient (private function) -------------------------

    it("Check _calcCoefficient", async () => {
      ///-------------------------- test _calcCoefficient --------------------------

      let result1 = await treeAttributeInstance._calcCoefficient.call(190, 0, {
        from: userAccount3,
      });

      assert.equal(Number(result1), 0, "_calcCoefficient not true");

      let result2 = await treeAttributeInstance._calcCoefficient.call(190, 1, {
        from: userAccount3,
      });

      assert.equal(Number(result2), 1, "_calcCoefficient not true");

      let result3 = await treeAttributeInstance._calcCoefficient.call(254, 2, {
        from: userAccount3,
      });

      assert.equal(Number(result3), 7, "_calcCoefficient not true");

      let result4 = await treeAttributeInstance._calcCoefficient.call(241, 3, {
        from: userAccount3,
      });

      assert.equal(Number(result4), 5, "_calcCoefficient not true");
    });
    */
  });

  describe("createTreeSymbol", () => {
    beforeEach(async () => {
      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await treeAttributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        { from: deployerAccount }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
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

    //   await treeAttributeInstance
    //     .createTreeSymbol(treeId1, randTree1, userAccount2,0, generationType, {
    //       from: userAccount7,
    //     })
    //     .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    //   await treeAttributeInstance.createTreeSymbol(
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
    //     await treeAttributeInstance.generatedAttributes.call(
    //       web3.utils.toBN("15485305705186275445")
    //     );

    //   assert.equal(
    //     generatedAttributes1,
    //     1,
    //     "generatedAttributes is not correct"
    //   );

    //   const uniqueSymbol1 = await treeAttributeInstance.uniqueSymbol.call(
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

    //   const attribute1Data = await treeTokenInstance.treeAttributes.call(
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
    //     treeShape: 37,
    //     trunkColor: 31,
    //     crownColor: 4,
    //     effects: 2,
    //     coefficient: 1,
    //     generationType: 18,
    //   };

    //   const symbol1Data = await treeTokenInstance.treeSymbols.call(treeId1);
    //   // console.log("1", symbol1Data.treeShape.toString());
    //   // console.log("2", symbol1Data.trunkColor.toString());
    //   // console.log("3", symbol1Data.crownColor.toString());
    //   // console.log("4", symbol1Data.effects.toString());
    //   // console.log("5", symbol1Data.coefficient.toString());
    //   // console.log("6", symbol1Data.generationType.toString());

    //   assert.equal(
    //     symbol1Data.treeShape,
    //     expectedSymbolValue1.treeShape,
    //     "treeShape is incorrect"
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
    //     symbol1Data.effects,
    //     expectedSymbolValue1.effects,
    //     "effects is incorrect"
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

    //   let yy = await treeAttributeInstance.createTreeSymbol(
    //     treeId2,
    //     randTree1,
    //     userAccount2,
    //     0,
    //     generationType,
    //     {
    //       from: treejerContract,
    //     }
    //   );

    //   const attribute2Data = await treeTokenInstance.treeAttributes.call(
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
    //     treeShape: 54,
    //     trunkColor: 46,
    //     crownColor: 0,
    //     effects: 1,
    //     coefficient: 3,
    //     generationType: 18,
    //   };

    //   const symbol2Data = await treeTokenInstance.treeSymbols.call(treeId2);
    //   console.log("1", symbol2Data.treeShape.toString());
    //   console.log("2", symbol2Data.trunkColor.toString());
    //   console.log("3", symbol2Data.crownColor.toString());
    //   console.log("4", symbol2Data.effects.toString());
    //   console.log("5", symbol2Data.coefficient.toString());
    //   console.log("6", symbol2Data.generationType.toString());

    //   assert.equal(
    //     symbol2Data.treeShape,
    //     expectedSymbolValue2.treeShape,
    //     "treeShape is incorrect"
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
    //     symbol2Data.effects,
    //     expectedSymbolValue2.effects,
    //     "effects is incorrect"
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
    //     await treeAttributeInstance.generatedAttributes.call(
    //       web3.utils.toBN("4468963121357845846")
    //     );

    //   assert.equal(
    //     generatedAttributes2,
    //     1,
    //     "generatedAttributes is not correct"
    //   );

    //   const uniqueSymbol2 = await treeAttributeInstance.uniqueSymbol.call(
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

    //   // const result = await treeAttributeInstance.createTreeSymbol.call(
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

      await treeAttributeInstance
        .createTreeSymbol(treeId1, randTree1, userAccount2, 0, generationType, {
          from: userAccount7,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      const eventTx1 = await treeAttributeInstance.createTreeSymbol(
        treeId1,
        randTree1,
        userAccount2,
        0,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx1, "TreeAttributesGenerated");

      const eventTx2 = await treeAttributeInstance.createTreeSymbol(
        treeId2,
        randTree1,
        userAccount2,
        1,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx2, "TreeAttributesGenerated");

      const eventTx3 = await treeAttributeInstance.createTreeSymbol(
        treeId3,
        randTree1,
        userAccount2,
        2,
        generationType,
        {
          from: treejerContract,
        }
      );

      truffleAssert.eventEmitted(eventTx3, "TreeAttributesGenerated");

      const result = await treeAttributeInstance.createTreeSymbol.call(
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
    //////////////////////////////////////////////////////////////////////////////////////////////
    /*
    it("test generated attributes when call createTreeAttributes", async () => {
      ///---------------test1
      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
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

      await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      let attribute10001 = await treeTokenInstance.treeAttributes(10001);

      assert.equal(
        await treeAttributeInstance.generatedAttributes(
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
        treeAttributeInstance.address,
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

      await treeAttributeInstance.createTreeAttributes(115, {
        from: deployerAccount,
      });

      let attribute153 = await treeTokenInstance.treeAttributes(115);

      assert.equal(
        await treeAttributeInstance.generatedAttributes(
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

    it("test generated attributes when call createTreeAttributes", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree.new({
        from: deployerAccount,
      });

      await testInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await treeAttributeInstance.setTreeTokenAddress(testInstance.address, {
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
        treeAttributeInstance.address,
        deployerAccount
      );

      //1900751594994632129  11010 01100000 11010011 10000001 01001001 11101001 10000101 11000001

      await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      assert.equal(
        await treeAttributeInstance.generatedAttributes(
          web3.utils.toBN("1900751594994632129")
        ),
        1,
        "result is not correct"
      );

      await testInstance.test(10001);

      await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      assert.equal(
        await treeAttributeInstance.generatedAttributes(
          web3.utils.toBN("1900751594994632129")
        ),
        2,
        "result is not correct"
      );
    });

    */
    it("should createTreeAttributes work successfully", async () => {
      await treeAttributeInstance
        .createTreeAttributes(10001, { from: userAccount6 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );

      let eventTx1 = await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      truffleAssert.eventEmitted(eventTx1, "TreeAttributesGenerated");
      truffleAssert.eventNotEmitted(eventTx1, "TreeAttributesNotGenerated");

      await treeTokenInstance.treeAttributes(10001);

      let eventTx2 = await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      truffleAssert.eventNotEmitted(eventTx2, "TreeAttributesGenerated");
      truffleAssert.eventNotEmitted(eventTx2, "TreeAttributesNotGenerated");
    });

    it("should testTree work successfully", async () => {
      ////------------------ deploy testTree ------------------------------

      testInstance = await TestTree.new({
        from: deployerAccount,
      });

      await testInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await treeAttributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );

      await treeAttributeInstance.createTreeAttributes(10001, {
        from: deployerAccount,
      });

      await testInstance.test(10001);

      await treeAttributeInstance.createTreeAttributes(10001, {
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

      await treeAttributeInstance.setTreeTokenAddress(testInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
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

      await treeAttributeInstance.createTreeSymbol(
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

      await treeAttributeInstance.createTreeSymbol(
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
});
