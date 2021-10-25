require("dotenv").config();

// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const IncrementalSale = artifacts.require("IncrementalSale");
const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");
const Auction = artifacts.require("Auction");
const Attribute = artifacts.require("Attribute");
const RegularSale = artifacts.require("RegularSale");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

const Units = require("ethereumjs-units");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

//treasury section
const WethFund = artifacts.require("WethFund");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const Weth = artifacts.require("Weth");
var Dai = artifacts.require("Dai");

//uniswap
var Factory;
var Dai;
var UniswapV2Router02New;
var TestUniswap;

if (process.env.COVERAGE) {
  UniswapV2Router02New = artifacts.require("UniSwapMini");
} else {
  Factory = artifacts.require("Factory");
  UniswapV2Router02New = artifacts.require("UniswapV2Router02New");
  TestUniswap = artifacts.require("TestUniswap");
}

//gsn
// const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
// const Gsn = require("@opengsn/provider");
// const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
// const ethers = require("ethers");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSaleErrorMsg,
  TreasuryManagerErrorMsg,
  GsnErrorMsg,
} = require("./enumes");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("IncrementalSale", (accounts) => {
  let iSaleInstance;
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let treeTokenInstance;
  let WETHAddress;
  let DAIAddress;
  let uniswapV2Router02NewAddress;
  let wethFundInstance;
  let allocationInstance;
  let planterFundsInstnce;
  let attributeInstance;
  let regularSaleInstance;

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
  });

  describe("deployment and set addresses", () => {
    before(async () => {
      const treePrice = Units.convert("7", "eth", "wei");

      iSaleInstance = await IncrementalSale.new({
        from: deployerAccount,
      });

      await iSaleInstance.initialize(arInstance.address, {
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

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
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
    });

    it("deploys successfully", async () => {
      const address = iSaleInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("set incrementalSale address and fail in invalid situation", async () => {
      ///////////////---------------------------------set trust forwarder address--------------------------------------------------------

      await iSaleInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await iSaleInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await iSaleInstance.trustedForwarder(),
        "address set incorect"
      );

      ///////////////---------------------------------set Attributes address--------------------------------------------------------

      await iSaleInstance
        .setAttributesAddress(attributeInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance.setAttributesAddress(attributeInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        attributeInstance.address,
        await iSaleInstance.attribute(),
        "address set incorect"
      );

      ///////////////---------------------------------set tree factory address--------------------------------------------------------
      await iSaleInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        treeFactoryInstance.address,
        await iSaleInstance.treeFactory.call(),
        "address set incorect"
      );

      /////////////////---------------------------------set weth funds address--------------------------------------------------------

      await iSaleInstance
        .setWethFundAddress(wethFundInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        wethFundInstance.address,
        await iSaleInstance.wethFund.call(),
        "weth funds address set incorect"
      );

      /////////////////---------------------------------set weth token address--------------------------------------------------------
      await iSaleInstance
        .setWethTokenAddress(wethInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance
        .setWethTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await iSaleInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        wethInstance.address,
        await iSaleInstance.wethToken.call(),
        "weth token address set incorect"
      );

      /////////////////---------------------------------set allocation address--------------------------------------------------------
      await iSaleInstance
        .setAllocationAddress(allocationInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        allocationInstance.address,
        await iSaleInstance.allocation.call(),
        "allocation address set incorect"
      );
      /////////////////---------------------------------set regularSaleInstance address--------------------------------------------------------
      await iSaleInstance
        .setRegularSaleAddress(regularSaleInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await iSaleInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        regularSaleInstance.address,
        await iSaleInstance.regularSale.call(),
        "regularSale address set incorect"
      );
    });
  });

  describe("without financial section", () => {
    beforeEach(async () => {
      iSaleInstance = await IncrementalSale.new({
        from: deployerAccount,
      });

      await iSaleInstance.initialize(arInstance.address, {
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

      /////-------------------------handle address here-----------------
      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });
      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
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
        iSaleInstance.address,
        deployerAccount
      );

      /////----------------add allocation data
      await allocationInstance.addAllocationData(
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

    /////////////////---------------------------------test createIncrementalSale function--------------------------------------------------------

    it("Checks TreeSales function error", async () => {
      /////-----added incrementalSale should has positive tree Count
      await iSaleInstance
        .createIncrementalSale(101, web3.utils.toWei("0.005"), 0, 100, 400, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.TREE_TO_SELL); //must be faild because treeCount is zero

      /////-----added incrementalSale should has startTreeId>100

      await iSaleInstance
        .createIncrementalSale(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.OCCUPIED_TREES); //treeStartId should be >100

      /////-----added incrementalSale should reject becuase caller has not admin role

      await iSaleInstance
        .createIncrementalSale(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      /////-----added incrementalSale should has steps of price change>0

      await iSaleInstance
        .createIncrementalSale(101, web3.utils.toWei("0.005"), 9900, 0, 400, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.PRICE_CHANGE_PERIODS);

      /////-----added incrementalSale should have equivalant allocation data

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

      await allocationInstance.assignAllocationToTree(110, 10000, 1, {
        from: dataManager,
      });

      await iSaleInstance
        .createIncrementalSale(
          101,
          web3.utils.toWei("0.005"),
          9900,
          100,
          1000,
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
    });

    it("incrementalSale all trees should be availabe to sell", async () => {
      auctionInstance = await Auction.new({
        from: deployerAccount,
      });

      await auctionInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

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

      await allocationInstance.assignAllocationToTree(100, 10000, 1, {
        from: dataManager,
      });

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      await Common.addTreejerContractRole(
        arInstance,
        auctionInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.listTree(107, ipfsHash, { from: dataManager });

      await auctionInstance.createAuction(
        107,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: dataManager }
      );
      await iSaleInstance
        .createIncrementalSale(
          101,
          web3.utils.toWei("0.005"),
          9900,
          100,
          1000,
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(IncrementalSaleErrorMsg.TREE_PROVIDED_BEFORE); // trees shouldnot be on other provides
    });

    it("createIncrementalSale should be work successfully", async () => {
      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

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

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      let eventTx = await iSaleInstance.createIncrementalSale(
        105,
        web3.utils.toWei("0.01"),
        150,
        100,
        1000,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "IncrementalSaleUpdated", (ev) => {
        return true;
      });

      let incrementalSaleData = await iSaleInstance.incrementalSaleData();
      let lastSold = await iSaleInstance.lastSold();

      assert.equal(
        Number(incrementalSaleData.startTreeId),
        105,
        "startTreeId not true"
      );
      assert.equal(
        Number(incrementalSaleData.endTreeId),
        255,
        "endTreeId not true"
      );
      assert.equal(
        Number(incrementalSaleData.initialPrice),
        web3.utils.toWei("0.01"),
        "initialPrice not true"
      );
      assert.equal(
        Number(incrementalSaleData.increments),
        100,
        "increments not true"
      );
      assert.equal(
        Number(incrementalSaleData.priceJump),
        1000,
        "priceJump not true"
      );
      assert.equal(Number(lastSold), 104, "lastSold not true");

      //check tree data

      let tree105 = await treeFactoryInstance.trees(105);

      assert.equal(Number(tree105.saleType), 2);

      let tree150 = await treeFactoryInstance.trees(254);

      assert.equal(Number(tree150.saleType), 2);

      let tree151 = await treeFactoryInstance.trees(255);

      assert.equal(Number(tree151.saleType), 0);

      await iSaleInstance.createIncrementalSale(
        135,
        web3.utils.toWei("0.01"),
        150,
        100,
        1000,
        {
          from: dataManager,
        }
      );

      let IncrementalSaleData2 = await iSaleInstance.incrementalSaleData();
      let lastSold2 = await iSaleInstance.lastSold();

      assert.equal(
        Number(IncrementalSaleData2.startTreeId),
        135,
        "startTreeId not true"
      );

      assert.equal(
        Number(IncrementalSaleData2.endTreeId),
        285,
        "endTreeId not true"
      );

      assert.equal(
        Number(IncrementalSaleData2.initialPrice),
        web3.utils.toWei("0.01"),
        "initialPrice not true"
      );

      assert.equal(
        Number(IncrementalSaleData2.increments),
        100,
        "increments not true"
      );

      assert.equal(
        Number(IncrementalSaleData2.priceJump),
        1000,
        "priceJump not true"
      );

      assert.equal(Number(lastSold2), 134, "lastSold not true");

      let tree105_2 = await treeFactoryInstance.trees(105);

      assert.equal(Number(tree105_2.saleType), 0);

      let tree134 = await treeFactoryInstance.trees(134);

      assert.equal(Number(tree134.saleType), 0);

      let tree135 = await treeFactoryInstance.trees(135);

      assert.equal(Number(tree135.saleType), 2);

      let tree284 = await treeFactoryInstance.trees(284);

      assert.equal(Number(tree284.saleType), 2);

      let tree285 = await treeFactoryInstance.trees(285);

      assert.equal(Number(tree285.saleType), 0);
    });

    ////////////// -------------------------------- removeIncrementalSale ---------------------------------

    it("Should removeIncrementalSale succesfully", async () => {
      await iSaleInstance
        .removeIncrementalSale(400, { from: dataManager })
        .should.be.rejectedWith(
          IncrementalSaleErrorMsg.FREE_INCREMENTALSALE_FAIL
        );

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        await iSaleInstance.updateEndTreeId(200, {
          from: dataManager,
        });
      }

      let incrementalSaleData = await iSaleInstance.incrementalSaleData();

      let lastSold = await await iSaleInstance.lastSold();

      assert.equal(
        Number(incrementalSaleData.startTreeId),
        101,
        "startTreeId not true"
      );

      assert.equal(Number(lastSold), 100, "lastSold not true");

      assert.equal(
        Number(incrementalSaleData.endTreeId),
        1301,
        "endTreeId not true"
      );

      ////////// check tree data

      const tree101_1 = await treeFactoryInstance.trees.call(101);
      const tree1300_1 = await treeFactoryInstance.trees.call(1300);
      const tree1301_1 = await treeFactoryInstance.trees.call(1301);

      assert.equal(Number(tree101_1.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree1300_1.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree1301_1.saleType), 0, "sale type is not correct");

      await iSaleInstance
        .removeIncrementalSale(500, {
          from: userAccount4,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const eventTx1 = await iSaleInstance.removeIncrementalSale(500, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx1, "IncrementalSaleUpdated");

      let IncrementalSaleData2 = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(IncrementalSaleData2.startTreeId),
        601,
        "2 startTreeId not true"
      );

      assert.equal(
        Number(await iSaleInstance.lastSold()),
        600,
        "2 lastSold not true"
      );

      assert.equal(
        Number(IncrementalSaleData2.endTreeId),
        1301,
        "2 endTreeId not true"
      );

      const tree101_2 = await treeFactoryInstance.trees.call(101);
      const tree300_2 = await treeFactoryInstance.trees.call(300);
      const tree600_2 = await treeFactoryInstance.trees.call(600);
      const tree601_2 = await treeFactoryInstance.trees.call(601);

      assert.equal(Number(tree101_2.saleType), 0, "2 sale type is not correct");

      assert.equal(Number(tree300_2.saleType), 0, "2 sale type is not correct");

      assert.equal(Number(tree600_2.saleType), 0, "2 sale type is not correct");

      assert.equal(Number(tree601_2.saleType), 2, "2 sale type is not correct");

      const eventTx2 = await iSaleInstance.removeIncrementalSale(400, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx2, "IncrementalSaleUpdated");

      let IncrementalSaleData3 = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(IncrementalSaleData3.startTreeId),
        1001,
        "3 startTreeId not true"
      );

      assert.equal(
        Number(await iSaleInstance.lastSold()),
        1000,
        "3 lastSold not true"
      );

      assert.equal(
        Number(IncrementalSaleData3.endTreeId),
        1301,
        "3 endTreeId not true"
      );

      const tree601_3 = await treeFactoryInstance.trees.call(601);
      const tree800_3 = await treeFactoryInstance.trees.call(800);
      const tree1000_3 = await treeFactoryInstance.trees.call(1000);
      const tree1001_3 = await treeFactoryInstance.trees.call(1001);

      assert.equal(Number(tree601_3.saleType), 0, "2 sale type is not correct");

      assert.equal(Number(tree800_3.saleType), 0, "2 sale type is not correct");

      assert.equal(
        Number(tree1000_3.saleType),
        0,
        "2 sale type is not correct"
      );

      assert.equal(
        Number(tree1001_3.saleType),
        2,
        "2 sale type is not correct"
      );

      await iSaleInstance
        .removeIncrementalSale(400, { from: dataManager })
        .should.be.rejectedWith(
          IncrementalSaleErrorMsg.FREE_INCREMENTALSALE_FAIL
        );

      const eventTx3 = await iSaleInstance.removeIncrementalSale(300, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx3, "IncrementalSaleUpdated");

      let IncrementalSaleData4 = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(IncrementalSaleData4.startTreeId),
        1301,
        "3 startTreeId not true"
      );

      assert.equal(
        Number(await iSaleInstance.lastSold()),
        1300,
        "4 lastSold not true"
      );

      assert.equal(
        Number(IncrementalSaleData4.endTreeId),
        1301,
        "3 endTreeId not true"
      );

      const tree1001_4 = await treeFactoryInstance.trees.call(1001);
      const tree1200_4 = await treeFactoryInstance.trees.call(1200);
      const tree1300_4 = await treeFactoryInstance.trees.call(1300);
      const tree1301_4 = await treeFactoryInstance.trees.call(1301);

      assert.equal(
        Number(tree1001_4.saleType),
        0,
        "3 sale type is not correct"
      );

      assert.equal(
        Number(tree1200_4.saleType),
        0,
        "3 sale type is not correct"
      );

      assert.equal(
        Number(tree1300_4.saleType),
        0,
        "3 sale type is not correct"
      );

      assert.equal(
        Number(tree1301_4.saleType),
        0,
        "3 sale type is not correct"
      );

      await iSaleInstance.createIncrementalSale(
        15000,
        web3.utils.toWei("0.01"),
        200,
        100,
        1000,
        {
          from: dataManager,
        }
      );
    });

    ///////////// --------------------------------- updateEndTreeId --------------------------------
    it("Should updateEndTreeId succesfully", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.01"),
        100,
        100,
        1000,
        {
          from: dataManager,
        }
      );

      let incrementalSaleData = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(incrementalSaleData.startTreeId),
        101,
        "startTreeId not true"
      );

      assert.equal(
        Number(incrementalSaleData.endTreeId),
        201,
        "endTreeId not true"
      );

      assert.equal(
        Number(incrementalSaleData.initialPrice),
        Number(web3.utils.toWei("0.01")),
        "initialPrice not true"
      );

      assert.equal(
        Number(incrementalSaleData.increments),
        100,
        "increments not true"
      );

      assert.equal(
        Number(incrementalSaleData.priceJump),
        1000,
        "priceJump not true"
      );

      ////////// check tree data

      const tree101_1 = await treeFactoryInstance.trees.call(101);
      const tree150_1 = await treeFactoryInstance.trees.call(150);
      const tree200_1 = await treeFactoryInstance.trees.call(200);
      const tree250_1 = await treeFactoryInstance.trees.call(250);

      assert.equal(Number(tree101_1.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree150_1.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree200_1.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree250_1.saleType), 0, "sale type is not correct");

      const eventTx = await iSaleInstance.updateEndTreeId(100, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx, "IncrementalSaleUpdated", (ev) => {
        return true;
      });

      let IncrementalSaleData1 = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(IncrementalSaleData1.endTreeId),
        301,
        "endTreeId not true"
      );

      ///// check tree data
      const tree101_2 = await treeFactoryInstance.trees.call(101);
      const tree150_2 = await treeFactoryInstance.trees.call(150);
      const tree201_2 = await treeFactoryInstance.trees.call(201);
      const tree250_2 = await treeFactoryInstance.trees.call(250);
      const tree300 = await treeFactoryInstance.trees.call(300);

      assert.equal(Number(tree101_2.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree150_2.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree201_2.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree250_2.saleType), 2, "sale type is not correct");

      assert.equal(Number(tree300.saleType), 2, "sale type is not correct");
    });

    it("Check updateEndTreeId errors", async () => {
      ////----------updateEndTreeId should reject because caller is not admin
      await iSaleInstance
        .updateEndTreeId(100, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      ////----------updateEndTreeId should reject because caller is not admin
      await iSaleInstance
        .updateEndTreeId(100, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.PRICE_CHANGE_PERIODS);

      ////-------updateEndTreeId Should reject because a tree is not available

      auctionInstance = await Auction.new({
        from: deployerAccount,
      });

      await auctionInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        auctionInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.listTree(217, ipfsHash, {
        from: dataManager,
      });

      await auctionInstance.createAuction(
        217,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: dataManager }
      );

      await iSaleInstance
        .updateEndTreeId(100, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.TREE_PROVIDED_BEFORE);
    });

    ////----------------------------------------------------test updateIncrementalSaleData------------------------------

    it("updateIncrementalSaleData should be work successfully", async () => {
      let eventTx = await iSaleInstance.updateIncrementalSaleData(
        web3.utils.toWei("0.01"),
        20,
        1000,
        {
          from: dataManager,
        }
      );

      let incrementalSaleData = await iSaleInstance.incrementalSaleData();

      assert.equal(
        Number(incrementalSaleData.initialPrice),
        Number(web3.utils.toWei("0.01")),
        "initialPrice not true"
      );

      assert.equal(
        Number(incrementalSaleData.increments),
        20,
        "increments not true"
      );

      assert.equal(
        Number(incrementalSaleData.priceJump),
        1000,
        "priceJump not true"
      );

      truffleAssert.eventEmitted(
        eventTx,
        "IncrementalSaleDataUpdated",
        (ev) => {
          return true;
        }
      );
    });

    it("check updateIncrementalSaleData errors", async () => {
      ////------updateIncrementalSaleData should reject becuase caller has not admin role
      await iSaleInstance
        .updateIncrementalSaleData(web3.utils.toWei("0.1"), 70, 10000, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      ////------updateIncrementalSaleData should reject becuase step must be gt zero

      await iSaleInstance
        .updateIncrementalSaleData(web3.utils.toWei("0.1"), 0, 10000, {
          from: dataManager,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.PRICE_CHANGE_PERIODS);
    });
  });
  describe("with financial section", () => {
    beforeEach(async () => {
      const treePrice = Units.convert("7", "eth", "wei");

      iSaleInstance = await IncrementalSale.new({
        from: deployerAccount,
      });

      await iSaleInstance.initialize(arInstance.address, {
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

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
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

      /////-------------------------handle address here-----------------
      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });
      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setPlanterFundAddress(planterFundsInstnce.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setAttributesAddress(attributeInstance.address, {
        from: deployerAccount,
      });

      //-------------wethFundInstance
      await wethFundInstance.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });
      await wethFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );
      await wethFundInstance.setUniswapRouterAddress(
        uniswapV2Router02NewAddress,
        {
          from: deployerAccount,
        }
      );
      await wethFundInstance.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });
      await wethFundInstance.setDaiAddress(DAIAddress, {
        from: deployerAccount,
      });
      //-------------treeFactoryInstance
      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //--------------attributeInstance

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
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
        iSaleInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        wethFundInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
      /////----------------add allocation data
      await allocationInstance.addAllocationData(
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

    it("check discount timeout", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.01"),
        100,
        20,
        1000,
        {
          from: dataManager,
        }
      );

      assert.equal(await iSaleInstance.lastSold(), 100, "lastSold not true");

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
        iSaleInstance.address,
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

      await iSaleInstance.fundTree(1, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      //////////--------------check tree owner
      let addressGetToken101 = await treeTokenInstance.ownerOf(101);

      assert.equal(addressGetToken101, userAccount3, "1.mint not true");

      let tree101 = await treeFactoryInstance.trees(101);

      assert.equal(Number(tree101.saleType), 0);

      await treeTokenInstance.ownerOf(102).should.be.rejected;

      ////////-------------Check PlanterFund and wethFund data after fund tree (treeId==101)

      const wethFundBalanceAfter = await wethInstance.balanceOf(
        wethFundInstance.address
      );

      const planterFundsBalanceAfter = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const iSaleBalanceAfter = await wethInstance.balanceOf(
        iSaleInstance.address
      );

      assert.equal(
        Number(wethFundBalanceAfter),
        Number(web3.utils.toWei(".0058")),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter),
        Number(expectedSwapTokenAmountTreeid101[1]),
        "planterFundsBalanceAfter balance not true"
      );

      assert.equal(Number(iSaleBalanceAfter), 0, "iSale balance not true");

      ////--------------------------check weth fund
      let amount = Number(web3.utils.toWei("0.01"));

      let expected = {
        planterAmount: (30 * amount) / 100,
        ambassadorAmount: (12 * amount) / 100,
        research: (12 * amount) / 100,
        localDevelopment: (12 * amount) / 100,
        insurance: (12 * amount) / 100,
        treasury: (22 * amount) / 100,
        reserve1: 0,
        reserve2: 0,
      };

      //check wethFund totalBalances
      let totalBalances = await wethFundInstance.totalBalances();

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

      ////--------------------------check fund planter

      let totalPlanterFund = await planterFundsInstnce.totalBalances.call();

      let treeToPlanterProjectedEarnings =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(101);
      let treeToReferrerProjectedEarnings =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(101);

      assert.equal(
        Number(totalPlanterFund.planter),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1]).times(3000).div(4200)
        ),
        "totalFund planter funds invalid"
      );

      assert.equal(
        Number(totalPlanterFund.ambassador),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1]).times(1200).div(4200)
        ),
        "totalFund ambassador funds invalid"
      );

      assert.equal(
        Number(treeToPlanterProjectedEarnings),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1]).times(3000).div(4200)
        ),
        "planter funds invalid"
      );

      assert.equal(
        Number(treeToReferrerProjectedEarnings),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1]).times(1200).div(4200)
        ),
        "ambassador funds invalid"
      );

      ////--------------------------check last sold---------------------

      assert.equal(
        await iSaleInstance.lastSold(),
        101,
        "Step 0 lastSold not true"
      );

      ////--------------------------- check  attributes

      assert.equal(
        Number((await treeTokenInstance.attributes(101)).generationType),
        16,
        "Attributes generationType is not correct"
      );

      ////--------------------------- check tree Symbols

      assert.equal(
        Number((await treeTokenInstance.symbols(101)).generationType),
        16,
        "Symbols generationType is not correct"
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
        iSaleInstance.address,
        web3.utils.toWei("0.201"),
        {
          from: userAccount3,
        }
      );

      let expectedSwapTokenAmountForBuy20Tree =
        await uniswapRouterInstance.getAmountsOut.call(
          web3.utils.toWei("0.08442", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      let expectedSwapTokenAmountTreeid102 = Math.Big(
        expectedSwapTokenAmountForBuy20Tree[1]
      )
        .times(0.0042)
        .div(0.08442);

      let expectedSwapTokenAmountTreeid110 = Math.Big(
        expectedSwapTokenAmountForBuy20Tree[1]
      )
        .times(0.0042)
        .div(0.08442);

      let expectedSwapTokenAmountTreeid121 = Math.Big(
        expectedSwapTokenAmountForBuy20Tree[1]
      )
        .times(0.00462)
        .div(0.08442);

      let tx = await iSaleInstance.fundTree(15, userAccount6, zeroAddress, {
        from: userAccount3,
      });

      await iSaleInstance.fundTree(5, userAccount6, zeroAddress, {
        from: userAccount3,
      });

      ///----------------------check attribute generated for tree

      for (let i = 102; i < 122; i++) {
        assert.equal(
          Number((await treeTokenInstance.attributes(i)).generationType),
          16,
          "Attributes generationType is not correct"
        );

        assert.equal(
          Number((await treeTokenInstance.symbols(i)).generationType),
          16,
          "Symbols generationType is not correct"
        );
      }

      assert.equal(
        Number((await treeTokenInstance.attributes(122)).generationType),
        0,
        "Attributes generationType is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(122)).generationType),
        0,
        "Symbols generationType is not correct"
      );

      ///////////////

      truffleAssert.eventEmitted(tx, "TreeFunded", (ev) => {
        return (
          ev.funder === userAccount3 &&
          ev.recipient === userAccount3 &&
          Number(ev.startTreeId) === 102 &&
          ev.referrer == userAccount6 &&
          Number(ev.count) == 15
        );
      });

      //////////--------------check tree owner
      let addressGetToken102 = await treeTokenInstance.ownerOf(102);

      assert.equal(addressGetToken102, userAccount3, "2.1-mint not true");

      let tree102 = await treeFactoryInstance.trees(102);

      assert.equal(Number(tree102.saleType), 0);

      /////-----------------fund 110

      let addressGetToken110 = await treeTokenInstance.ownerOf(110);

      assert.equal(addressGetToken110, userAccount3, "2.2-mint not true");

      let tree110 = await treeFactoryInstance.trees(110);

      assert.equal(Number(tree110.saleType), 0);

      /////-----------------fund 120

      let addressGetToken120 = await treeTokenInstance.ownerOf(120);

      assert.equal(addressGetToken120, userAccount3, "2.3-mint not true");

      let tree120 = await treeFactoryInstance.trees(120);

      assert.equal(Number(tree120.saleType), 0);

      /////-----------------fund 121

      let addressGetToken121 = await treeTokenInstance.ownerOf(121);

      assert.equal(addressGetToken121, userAccount3, "2.4-mint not true");

      let tree121 = await treeFactoryInstance.trees(121);

      assert.equal(Number(tree121.saleType), 0);

      /////-----------------not fund 122

      await treeTokenInstance.ownerOf(122).should.be.rejected;

      let tree122 = await treeFactoryInstance.trees(122);

      assert.equal(Number(tree122.saleType), 2);

      ///////////////////

      let funderBalance3 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance3),
        web3.utils.toWei("0"),
        "3-funder balance not true"
      );

      ////////-------------Check PlanterFund and wethFund data after fund tree (treeId==120)

      const wethFundBalanceAfter2 = await wethInstance.balanceOf(
        wethFundInstance.address
      );

      const planterFundsBalanceAfter2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      const iSaleBalanceAfter2 = await wethInstance.balanceOf(
        iSaleInstance.address
      );

      assert.equal(
        Number(wethFundBalanceAfter2),
        Math.add(
          Number(web3.utils.toWei(".0058")),
          Number(web3.utils.toWei("0.11658"))
        ),
        "daiFund balance not true"
      );

      assert.equal(
        Number(planterFundsBalanceAfter2),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1]).plus(
            expectedSwapTokenAmountForBuy20Tree[1]
          )
        ),
        "planterFundsBalanceAfter2 not true"
      );

      assert.equal(Number(iSaleBalanceAfter2), 0, "iSale balance not true");

      ////--------------------------check weth fund
      let amount2 = Number(web3.utils.toWei("0.201"));

      let expected2 = {
        planterAmount: (30 * amount2) / 100,
        ambassadorAmount: (12 * amount2) / 100,
        research: (12 * amount2) / 100,
        localDevelopment: (12 * amount2) / 100,
        insurance: (12 * amount2) / 100,
        treasury: (22 * amount2) / 100,
        reserve1: 0,
        reserve2: 0,
      };

      //check wethFund totalBalances
      let totalBalances2 = await wethFundInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        Math.add(Number(expected2.research), Number(expected.research)),
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        Math.add(
          Number(expected2.localDevelopment),
          Number(expected.localDevelopment)
        ),
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        Math.add(Number(expected2.insurance), Number(expected.insurance)),
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        Math.add(Number(expected2.treasury), Number(expected.treasury)),
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        Math.add(Number(expected2.reserve1), Number(expected.reserve1)),
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        Math.add(Number(expected2.reserve2), Number(expected.reserve2)),
        "reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let totalPlanterFund2 = await planterFundsInstnce.totalBalances.call();

      let planterFunds2 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(121);
      let ambassadorFunds2 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(121);

      let planterFunds3 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(102);
      let ambassadorFunds3 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(102);

      let planterFunds4 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(110);
      let ambassadorFunds4 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(110);

      assert.equal(
        Number(totalPlanterFund2.planter),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1])
            .times(3000)
            .div(4200)
            .plus(
              Math.Big(expectedSwapTokenAmountForBuy20Tree[1])
                .times(3000)
                .div(4200)
            )
        ),
        "totalFund planter funds invalid"
      );

      assert.equal(
        Number(totalPlanterFund2.ambassador),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid101[1])
            .times(1200)
            .div(4200)
            .plus(
              Math.Big(expectedSwapTokenAmountForBuy20Tree[1])
                .times(1200)
                .div(4200)
            )
        ),
        "totalFund ambassador funds invalid"
      );

      assert.equal(
        Number(planterFunds2),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid121).times(3000).div(4200)
        ),
        "planter funds invalid"
      );

      assert.equal(
        Number(ambassadorFunds2),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid121).times(1200).div(4200)
        ),
        "ambassador funds invalid"
      );

      assert.equal(
        Number(planterFunds3),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid102).times(3000).div(4200)
        ),
        "planter funds invalid"
      );

      assert.equal(
        Number(ambassadorFunds3),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid102).times(1200).div(4200)
        ),
        "ambassador funds invalid"
      );

      assert.equal(
        Number(planterFunds4),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid110).times(3000).div(4200)
        ),
        "planter funds invalid"
      );

      assert.equal(
        Number(ambassadorFunds4),
        Number(
          Math.Big(expectedSwapTokenAmountTreeid110).times(1200).div(4200)
        ),
        "ambassador funds invalid"
      );

      ////--------------------check referral---------------------

      let referralCount =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount6);

      assert.equal(Number(referralCount), 20, "Referral not true");

      ////--------------------------check last sold---------------------

      assert.equal(
        await iSaleInstance.lastSold(),
        121,
        "Step 0 lastSold not true"
      );

      // /////---------------- step2 ---------------------------

      //mint weth for funder
      await wethInstance.setMint(userAccount4, web3.utils.toWei("0.209"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.209"),
        {
          from: userAccount4,
        }
      );

      let tx2 = await iSaleInstance.fundTree(19, zeroAddress, zeroAddress, {
        from: userAccount4,
      });

      truffleAssert.eventEmitted(tx2, "TreeFunded", (ev) => {
        return (
          ev.funder === userAccount4 &&
          ev.recipient === userAccount4 &&
          Number(ev.startTreeId) === 122 &&
          ev.referrer == zeroAddress &&
          Number(ev.count) == 19
        );
      });

      let funderBalance5 = await wethInstance.balanceOf(userAccount4);

      assert.equal(
        Number(funderBalance5),
        web3.utils.toWei("0"),
        "5-funder balance not true"
      );

      let lastSold = await iSaleInstance.lastSold();

      assert.equal(lastSold, 140, "Step 2 lastSold not true");

      // /////---------------- step3 ---------------------------

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.18"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.18"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(15, userAccount6, zeroAddress, {
        from: userAccount3,
      });

      ////--------------------check referral---------------------

      let referralCount2 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount6);

      assert.equal(Number(referralCount2), 35, "Referral not true");

      let funderBalance6 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance6),
        web3.utils.toWei("0"),
        "6-funder balance not true"
      );

      let lastSold2 = await iSaleInstance.lastSold();

      assert.equal(lastSold2, 155, "Step 3 lastSold not true");

      // /////---------------- step 3, 4 ---------------------------

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.125"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.125"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(10, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      ////--------------------check referral---------------------

      let referralCount3 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(zeroAddress);

      assert.equal(Number(referralCount3), 0, "3-Referral not true");

      let funderBalance7 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance7),
        web3.utils.toWei("0"),
        "7-funder balance not true"
      );

      let lastSold3 = await iSaleInstance.lastSold();

      assert.equal(lastSold3, 165, "Step 3 lastSold not true");

      // /////---------------- step4 ---------------------------

      //mint weth for funder
      await wethInstance.setMint(userAccount4, web3.utils.toWei("1000"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount4,
        }
      );

      await iSaleInstance.fundTree(15, userAccount5, zeroAddress, {
        from: userAccount4,
      });
      await iSaleInstance.fundTree(5, userAccount5, zeroAddress, {
        from: userAccount4,
      });

      await iSaleInstance.fundTree(14, userAccount5, zeroAddress, {
        from: userAccount4,
      });

      ////--------------------check referral---------------------

      let referralCount4 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(userAccount5);

      assert.equal(Number(referralCount4), 34, "4-Referral not true");

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.1"));

      let funderBalance8 = await wethInstance.balanceOf(userAccount3);

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.014"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(1, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

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
        iSaleInstance.address,
        web3.utils.toWei("0.01"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, { from: userAccount3 })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_TREE);

      await wethInstance.resetAcc(userAccount3);
      await wethInstance.resetAcc(userAccount4);
    });
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    it("fundTree with recipient", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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

      ////////////////////////////////////////////

      let funderBalance1 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance1),
        web3.utils.toWei("0"),
        "1-funder balance not true"
      );

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.2"));
      await wethInstance.setMint(userAccount7, web3.utils.toWei("1"));
      await wethInstance.setMint(userAccount5, web3.utils.toWei("1"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.2"),
        {
          from: userAccount3,
        }
      );

      let tx1 = await iSaleInstance.fundTree(15, userAccount6, userAccount7, {
        from: userAccount3,
      });

      let tx2 = await iSaleInstance.fundTree(5, userAccount6, userAccount5, {
        from: userAccount3,
      });

      ///----------------------check attribute generated for tree

      for (let i = 101; i < 121; i++) {
        assert.equal(
          Number((await treeTokenInstance.attributes(i)).generationType),
          16,
          "Attributes generationType is not correct"
        );

        assert.equal(
          Number((await treeTokenInstance.symbols(i)).generationType),
          16,
          "Symbols generationType is not correct"
        );
        if (i < 116) {
          assert.equal(
            await treeTokenInstance.ownerOf(i),
            userAccount7,
            `mint not true for tree ${i}`
          );
        } else {
          assert.equal(
            await treeTokenInstance.ownerOf(i),
            userAccount5,
            `mint not true for tree ${i}`
          );
        }

        assert.equal(
          Number((await treeFactoryInstance.trees(i)).saleType),
          0,
          `saleType is not true for tree ${i}`
        );
      }

      /////////////// event emitted

      truffleAssert.eventEmitted(tx1, "TreeFunded", (ev) => {
        return (
          ev.funder === userAccount3 &&
          ev.recipient === userAccount7 &&
          Number(ev.startTreeId) === 101 &&
          ev.referrer == userAccount6 &&
          Number(ev.count) == 15
        );
      });

      truffleAssert.eventEmitted(tx2, "TreeFunded", (ev) => {
        return (
          ev.funder === userAccount3 &&
          ev.recipient === userAccount5 &&
          Number(ev.startTreeId) === 116 &&
          ev.referrer == userAccount6 &&
          Number(ev.count) == 5
        );
      });

      ///////////////////

      let funderBalance3 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance3),
        web3.utils.toWei("0"),
        "3-funder balance not true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(userAccount7)),
        web3.utils.toWei("1"),
        "recipient1 balance is not true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(userAccount5)),
        web3.utils.toWei("1"),
        "recipient2 balance is not true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(iSaleInstance.address)),
        0,
        "iSale balance not true"
      );

      await wethInstance.resetAcc(userAccount3);
      await wethInstance.resetAcc(userAccount4);
      await wethInstance.resetAcc(userAccount5);
      await wethInstance.resetAcc(userAccount7);
    });

    ////----------------------------------------------------test updateIncrementalSaleData------------------------------

    it("updateIncrementalSaleData should be work successfully", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        iSaleInstance.address,
        web3.utils.toWei("0.01"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(1, zeroAddress, zeroAddress, {
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
        iSaleInstance.address,
        web3.utils.toWei("0.04"),
        {
          from: userAccount4,
        }
      );

      await iSaleInstance.fundTree(4, zeroAddress, zeroAddress, {
        from: userAccount4,
      });

      assert.equal(
        Number(await wethInstance.balanceOf(userAccount4)),
        web3.utils.toWei("0"),
        "userAccount4 balance not true"
      );

      ////---------- update price and steps ---------------------

      await iSaleInstance.updateIncrementalSaleData(
        web3.utils.toWei("0.03"),
        10,
        1000,
        {
          from: dataManager,
        }
      );

      await wethInstance.setMint(userAccount4, web3.utils.toWei(".516"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei(".516"),
        {
          from: userAccount4,
        }
      );

      await iSaleInstance.fundTree(16, zeroAddress, zeroAddress, {
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
        iSaleInstance.address,
        web3.utils.toWei("0.0209"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.LOW_PRICE_PAID);

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.0475"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.0684"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(1, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      let funderBalance4 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance4),
        web3.utils.toWei("0.0324"),
        "4-funder balance not true"
      );

      ////---------- update price and steps ---------------------

      await iSaleInstance.updateIncrementalSaleData(
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
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount4,
        }
      );

      await iSaleInstance.fundTree(15, zeroAddress, zeroAddress, {
        from: userAccount4,
      });
      await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, {
        from: userAccount4,
      });
      await iSaleInstance.fundTree(15, zeroAddress, zeroAddress, {
        from: userAccount4,
      });
      await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, {
        from: userAccount4,
      });
      await iSaleInstance.fundTree(9, zeroAddress, zeroAddress, {
        from: userAccount4,
      });

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.2"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.2"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(1, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      let funderBalance7 = await wethInstance.balanceOf(userAccount3);

      assert.equal(
        Number(funderBalance7),
        web3.utils.toWei("0.0324"),
        "7-funder balance not true"
      );
    });

    ////////////////-----------------------------check fund tree function

    it("funded Tree should be in incremental sell", async () => {
      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

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

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      let eventTx = await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.01"),
        30,
        100,
        1000,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "IncrementalSaleUpdated", (ev) => {
        return true;
      });

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("1000"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(15, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      await iSaleInstance.fundTree(15, userAccount3, zeroAddress, {
        from: userAccount3,
      });

      ///----------------------check attribute generated for tree

      for (let i = 101; i < 131; i++) {
        assert.equal(
          Number((await treeTokenInstance.attributes(i)).generationType),
          16,
          "Attributes generationType is not correct"
        );

        assert.equal(
          Number((await treeTokenInstance.symbols(i)).generationType),
          16,
          "Symbols generationType is not correct"
        );
      }

      assert.equal(
        Number((await treeTokenInstance.attributes(131)).generationType),
        0,
        "Attributes generationType is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(131)).generationType),
        0,
        "Symbols generationType is not correct"
      );

      assert.equal(
        Number(
          await regularSaleInstance.referrerClaimableTreesWeth.call(
            userAccount3
          )
        ),
        15,
        "Referral not true"
      );

      assert.equal(
        Number(
          await regularSaleInstance.referrerClaimableTreesWeth.call(zeroAddress)
        ),
        0,
        "2-Referral not true"
      );

      let lastSold = await iSaleInstance.lastSold();

      assert.equal(Number(lastSold), 130, "lastSold not true");
      await iSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, { from: userAccount3 })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_TREE);

      await wethInstance.resetAcc(userAccount3);
    });

    it("low price paid for the tree without discount", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });
      await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.01"),
        220,
        100,
        1000,
        {
          from: dataManager,
        }
      );

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.009"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.009"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, { from: userAccount3 })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.LOW_PRICE_PAID);

      await iSaleInstance
        .fundTree(1, userAccount3, zeroAddress, { from: userAccount3 })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.LOW_PRICE_PAID);

      await wethInstance.resetAcc(userAccount3);
    });

    it("fundTree work successfully(1 tree => 1 step)", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        iSaleInstance.address,
        web3.utils.toWei("0.39"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(15, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, {
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

    it("fundTree should be reject (INVALID_COUNT)", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(120, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_COUNT);

      await iSaleInstance
        .fundTree(120, userAccount2, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_COUNT);

      await wethInstance.resetAcc(userAccount3);
    });

    it("fundTree should be reject (INVALID_TREE)", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(21, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_TREE);

      await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, {
        from: userAccount3,
      });

      await iSaleInstance
        .fundTree(16, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.INVALID_TREE);

      await wethInstance.resetAcc(userAccount3);
    });

    it("check discount usage", async () => {
      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.createIncrementalSale(
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
        iSaleInstance.address,
        web3.utils.toWei("0.009"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(1, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.LOW_PRICE_PAID);

      await wethInstance.resetAcc(userAccount3);

      await wethInstance.setMint(userAccount4, web3.utils.toWei("1000"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("1000"),
        {
          from: userAccount4,
        }
      );

      await iSaleInstance.fundTree(10, zeroAddress, zeroAddress, {
        from: userAccount4,
      });

      //mint weth for funder
      await wethInstance.setMint(userAccount3, web3.utils.toWei("0.11"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("0.11"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance
        .fundTree(11, zeroAddress, zeroAddress, {
          from: userAccount3,
        })
        .should.be.rejectedWith(IncrementalSaleErrorMsg.LOW_PRICE_PAID);

      await wethInstance.resetAcc(userAccount3);
      await wethInstance.resetAcc(userAccount4);
    });

    ////////////////-------------------------------------------- gsn ------------------------------------------------
    // it("test gsn [ @skip-on-coverage ]", async () => {
    //   await allocationInstance.assignAllocationToTree(100, 10000, 0, {
    //     from: dataManager,
    //   });

    //   await iSaleInstance.createIncrementalSale(
    //     101,
    //     web3.utils.toWei("0.01"),
    //     100,
    //     20,
    //     1000,
    //     {
    //       from: dataManager,
    //     }
    //   );

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     treeFactoryInstance.address,
    //     deployerAccount
    //   );

    //   ///////------------------------------handle gsn---------------------------------

    //   let env = await GsnTestEnvironment.startGsn("localhost");

    //   const { forwarderAddress, relayHubAddress, paymasterAddress } =
    //     env.contractsDeployment;

    //   await iSaleInstance.setTrustedForwarder(forwarderAddress, {
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
    //     iSaleInstance.address,
    //     iSaleInstance.abi,
    //     signerFunder
    //   );

    //   //mint weth for funder
    //   await wethInstance.setMint(userAccount2, web3.utils.toWei("0.01"));

    //   await wethInstance.approve(
    //     iSaleInstance.address,
    //     web3.utils.toWei("0.01"),
    //     {
    //       from: userAccount2,
    //     }
    //   );

    //   let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

    //   await contractFunder
    //     .fundTree(1, zeroAddress, zeroAddress)
    //     .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    //   await paymaster.addFunderWhitelistTarget(iSaleInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await contractFunder.fundTree(1, zeroAddress, zeroAddress);

    //   //////////--------------check tree owner
    //   let addressGetToken = await treeTokenInstance.ownerOf(101);

    //   assert.equal(addressGetToken, userAccount2, "1.mint not true");

    //   let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

    //   console.log("balanceAccountBefore", Number(balanceAccountBefore));
    //   console.log("balanceAccountAfter", Number(balanceAccountAfter));

    //   assert.equal(
    //     balanceAccountAfter,
    //     balanceAccountBefore,
    //     "Gsn not true work"
    //   );
    // });
  });
});
