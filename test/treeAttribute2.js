const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSale = artifacts.require("IncrementalSale.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const Tree = artifacts.require("Tree.sol");
//treasury section
const WethFund = artifacts.require("WethFund.sol");

const PlanterFund = artifacts.require("PlanterFund.sol");
const Weth = artifacts.require("Weth.sol");

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

      await treeAttributeInstance.reserveTreeAttributes(generatedCode3, {
        from: dataManager,
      });

      const uniqueSymbol1 = await treeAttributeInstance.uniqueSymbol.call(
        generatedCode1
      );

      console.log("uniqueSymbol1", uniqueSymbol1);

      // ////------------Should reserveTreeAttributes rejec because generatedCode has been reserved before
      // await treeAttributeInstance
      //   .reserveTreeAttributes(generatedCode3, {
      //     from: dataManager,
      //   })
      //   .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_TAKEN);

      // ///////------------------------------------------------------------------------------

      // let generatedCode = 2 ** 32 - 1;

      // const eventTx1 = await treeAttributeInstance.reserveTreeAttributes(
      //   generatedCode,
      //   {
      //     from: dataManager,
      //   }
      // );

      // let generatedAttribute = await treeAttributeInstance.generatedAttributes(
      //   generatedCode
      // );

      // let reservedAttribute = await treeAttributeInstance.reservedAttributes(
      //   generatedCode
      // );

      // assert.equal(generatedAttribute, 1, "generatedAttribute not true");

      // assert.equal(reservedAttribute, 1, "reservedAttribute not true");

      // truffleAssert.eventEmitted(eventTx1, "SymbolReserved", (ev) => {
      //   return ev.generatedCode == generatedCode;
      // });

      // //////test 2

      // let generatedCode2 = 0;

      // await Common.addTreejerContractRole(
      //   arInstance,
      //   userAccount2,
      //   deployerAccount
      // );

      // const eventTx2 = await treeAttributeInstance.reserveTreeAttributes(
      //   generatedCode2,
      //   {
      //     from: userAccount2,
      //   }
      // );

      // let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
      //   generatedCode2
      // );

      // let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
      //   generatedCode2
      // );

      // truffleAssert.eventEmitted(eventTx2, "SymbolReserved", (ev) => {
      //   return ev.generatedCode == generatedCode2;
      // });

      // assert.equal(generatedAttribute2, 1, "2 - generatedAttribute not true");

      // assert.equal(reservedAttribute2, 1, "2 - reservedAttribute not true");
    });

    // ///////////////---------------------------------test freeReserveTreeAttributes function--------------------------------------------------------

    // it("Should freeReserveTreeAttributes work successfully", async () => {
    //   /////----------------Should freeReserveTreeAttributes rejec because generatedCode hasn't been reserved before
    //   let generatedCode4 = 12500123;

    //   await treeAttributeInstance
    //     .freeReserveTreeAttributes(generatedCode4, {
    //       from: dataManager,
    //     })
    //     .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_NOT_RESERVED);

    //   /////----------------Should freeReserveTreeAttributes rejec because caller must be admin or communityGifts

    //   let generatedCode3 = 12500123;

    //   await treeAttributeInstance.reserveTreeAttributes(generatedCode3, {
    //     from: dataManager,
    //   });

    //   await treeAttributeInstance
    //     .freeReserveTreeAttributes(generatedCode3, { from: userAccount7 })
    //     .should.be.rejectedWith(
    //       CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
    //     );

    //   //////////////
    //   let generatedCode = 2 ** 32 - 1;

    //   await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
    //     from: dataManager,
    //   });

    //   const eventTx1 = await treeAttributeInstance.freeReserveTreeAttributes(
    //     generatedCode,
    //     {
    //       from: dataManager,
    //     }
    //   );

    //   let generatedAttribute = await treeAttributeInstance.generatedAttributes(
    //     generatedCode
    //   );

    //   let reservedAttribute = await treeAttributeInstance.reservedAttributes(
    //     generatedCode
    //   );

    //   assert.equal(generatedAttribute, 0, "generatedAttribute not true");

    //   assert.equal(reservedAttribute, 0, "reservedAttribute not true");

    //   truffleAssert.eventEmitted(eventTx1, "ReservedSymbolFreed", (ev) => {
    //     return ev.generatedCode == generatedCode;
    //   });

    //   //////test 2

    //   let generatedCode2 = 0;

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     userAccount2,
    //     deployerAccount
    //   );

    //   await treeAttributeInstance.reserveTreeAttributes(generatedCode2, {
    //     from: userAccount2,
    //   });

    //   const eventTx2 = await treeAttributeInstance.freeReserveTreeAttributes(
    //     generatedCode2,
    //     {
    //       from: userAccount2,
    //     }
    //   );

    //   let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
    //     generatedCode2
    //   );

    //   let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
    //     generatedCode2
    //   );

    //   assert.equal(generatedAttribute2, 0, "2 - generatedAttribute not true");

    //   assert.equal(reservedAttribute2, 0, "2 - reservedAttribute not true");

    //   truffleAssert.eventEmitted(eventTx2, "ReservedSymbolFreed", (ev) => {
    //     return ev.generatedCode == generatedCode2;
    //   });
    // });
  });
});
