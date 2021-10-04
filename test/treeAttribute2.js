const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const Tree = artifacts.require("Tree.sol");
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

  /*
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
  */

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
      console.log("genertedCode.toString()", generatedCode1.toString());

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
      //TODO: starting line of comment

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

      // console.log("symbol", symbol1Data);
      //TODO: ending line of comment

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
  });
});
