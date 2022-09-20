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

  let allocationInstance;
  let daiFundInstance;
  let planterFundsInstnce;
  let daiInstance;
  let wethFundInstance;
  let fakeTokenInstance;
  let fakeAttributeInstance;

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

    fakeTokenInstance = await FakeToken.new({ from: deployerAccount });

    fakeAttributeInstance = await FakeAttribute.new({ from: deployerAccount });

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

      await regularSaleInstance.initialize(zeroAddress, web3.utils.toWei("7"), {
        from: deployerAccount,
      }).should.be.rejected;

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

      ////---------------------------------set dai funds address--------------

      await regularSaleInstance
        .setDaiFundAddress(daiFundInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await regularSaleInstance.setDaiFundAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

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

      await regularSaleInstance.setAllocationAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

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

      await regularSaleInstance.setWethFundAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

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
