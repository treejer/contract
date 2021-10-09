const AccessRestriction = artifacts.require("AccessRestriction");
const HonoraryTree = artifacts.require("HonoraryTree.sol");
const Attribute = artifacts.require("Attribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Tree = artifacts.require("Tree.sol");
const Dai = artifacts.require("Dai.sol");
const TestHonoraryTree = artifacts.require("TestHonoraryTree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const Units = require("ethereumjs-units");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const math = require("./math");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

const {
  CommonErrorMsg,
  TimeEnumes,
  HonoraryTreeErrorMsg,

  erc20ErrorMsg,
  GsnErrorMsg,
} = require("./enumes");

contract("HonoraryTree", (accounts) => {
  let honoraryTreeInstance;
  let arInstance;
  let attributeInstance;
  let treeFactoryInstance;

  let treeTokenInstance;
  let planterFundsInstnce;
  let daiInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const initialReferralTreePaymentToPlanter = web3.utils.toWei("0.5");
  const initialReferralTreePaymentToAmbassador = web3.utils.toWei("0.1");

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  afterEach(async () => {});

  describe("deployment and set addresses", () => {
    beforeEach(async () => {
      honoraryTreeInstance = await deployProxy(
        HonoraryTree,
        [
          arInstance.address,
          initialReferralTreePaymentToPlanter,
          initialReferralTreePaymentToAmbassador,
        ],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      attributeInstance = await deployProxy(Attribute, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      planterFundsInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeFactoryInstance = await deployProxy(
        TreeFactory,
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

      daiInstance = await Dai.new("DAI", "dai", { from: deployerAccount });
    });
    it("deploys successfully and set addresses", async () => {
      //////////////////------------------------------------ deploy successfully ----------------------------------------//
      const address = honoraryTreeInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      ///////////////---------------------------------set trust forwarder address--------------------------------------------------------

      await honoraryTreeInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await honoraryTreeInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await honoraryTreeInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await honoraryTreeInstance.trustedForwarder(),
        "address set incorrect"
      );

      /////////////////---------------------------------set dai token address--------------------------------------------------------

      await honoraryTreeInstance
        .setDaiTokenAddress(daiInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await honoraryTreeInstance
        .setDaiTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await honoraryTreeInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiInstance.address,
        await honoraryTreeInstance.daiToken.call(),
        "address set incorect"
      );

      /////////////////---------------------------------set attribute address--------------------------------------------------------
      await honoraryTreeInstance
        .setAttributesAddress(attributeInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await honoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        attributeInstance.address,
        await honoraryTreeInstance.attribute.call(),
        "address set incorect"
      );

      /////////////////---------------------------------set tree factory address--------------------------------------------------------

      await honoraryTreeInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await honoraryTreeInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        treeFactoryInstance.address,
        await honoraryTreeInstance.treeFactory.call(),
        "address set incorect"
      );
      /////////////////---------------------------------set planter fund address--------------------------------------------------------

      await honoraryTreeInstance
        .setPlanterFundAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await honoraryTreeInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        planterFundsInstnce.address,
        await honoraryTreeInstance.planterFundContract.call(),
        "address set incorect"
      );
    });
  });

  describe("set price and add recipient update recipient", () => {
    beforeEach(async () => {
      honoraryTreeInstance = await deployProxy(
        HonoraryTree,
        [
          arInstance.address,
          initialReferralTreePaymentToPlanter,
          initialReferralTreePaymentToAmbassador,
        ],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );
    });

    /////////////////-------------------------------------- set price ------------------------------------------------

    it("should set price successfully and check data to be ok and fail in invalid situation", async () => {
      const referralTreePaymentToPlanter = Units.convert("0.5", "eth", "wei");
      const referralTreePaymentToAmbassador = Units.convert(
        "0.1",
        "eth",
        "wei"
      );

      ////////// --------------- fail because caller is not data manager
      await honoraryTreeInstance
        .updateReferralTreePayments(100, 200, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const eventTx = await honoraryTreeInstance.updateReferralTreePayments(
        referralTreePaymentToPlanter,
        referralTreePaymentToAmbassador,
        {
          from: dataManager,
        }
      );

      const settedReferralTreePaymentToPlanter =
        await honoraryTreeInstance.referralTreePaymentToPlanter.call();
      const settedReferralTreePaymentToAmbassador =
        await honoraryTreeInstance.referralTreePaymentToAmbassador.call();

      assert.equal(
        Number(settedReferralTreePaymentToPlanter),
        Number(referralTreePaymentToPlanter),
        "ReferralTreePaymentToPlanter is not correct"
      );

      assert.equal(
        Number(settedReferralTreePaymentToAmbassador),
        Number(referralTreePaymentToAmbassador),
        "ReferralTreePaymentToAmbassador is not correct"
      );

      truffleAssert.eventEmitted(
        eventTx,
        "ReferralTreePaymentsUpdated",
        (ev) => {
          return (
            Number(ev.referralTreePaymentToPlanter) ==
              Number(referralTreePaymentToPlanter) &&
            Number(ev.referralTreePaymentToAmbassador) ==
              Number(referralTreePaymentToAmbassador)
          );
        }
      );
    });

    /////////////////---------------------------------addRecipient--------------------------------------------------------
    it("should add recipient", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      const newStartDate = parseInt(new Date().getTime() / 1000) + 5 * 60 * 60;
      const newExpiryDate = parseInt(new Date().getTime() / 1000) + 9 * 60 * 60;

      await honoraryTreeInstance
        .addRecipient(userAccount1, startDate, expiryDate, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const addTx1 = await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(addTx1, "RecipientAdded", (ev) => {
        return ev.recipient == userAccount1;
      });

      const oldRecipient = await honoraryTreeInstance.recipients.call(
        userAccount1
      );

      assert.equal(Number(oldRecipient.status), 1, "status is incorrect");

      assert.equal(
        Number(oldRecipient.expiryDate),
        expiryDate,
        "expiry date is incorrect"
      );

      assert.equal(
        Number(oldRecipient.startDate),
        startDate,
        "start date is incorrect"
      );

      const addTx2 = await honoraryTreeInstance.addRecipient(
        userAccount1,
        newStartDate,
        newExpiryDate,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(addTx2, "RecipientAdded", (ev) => {
        return ev.recipient == userAccount1;
      });
      const newRecipient = await honoraryTreeInstance.recipients.call(
        userAccount1
      );

      assert.equal(Number(newRecipient.status), 1, "status is incorrect");

      assert.equal(
        Number(newRecipient.expiryDate),
        newExpiryDate,
        "expiry date is incorrect"
      );

      assert.equal(
        Number(newRecipient.startDate),
        newStartDate,
        "start date is incorrect"
      );
    });
    /////////////////---------------------------------editRecipient--------------------------------------------------------
    it("should edit recipient", async () => {
      const startDate1 = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expiryDate1 = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      const startDate2 =
        parseInt(new Date().getTime() / 1000) + 1 * 24 * 60 * 60;
      const expiryDate2 =
        parseInt(new Date().getTime() / 1000) + 2 * 24 * 60 * 60;

      await honoraryTreeInstance
        .updateRecipient(userAccount1, startDate1, expiryDate1, {
          from: userAccount8,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await honoraryTreeInstance
        .updateRecipient(userAccount1, startDate1, expiryDate1, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          HonoraryTreeErrorMsg.UPDATE_RECIPIENT_INVALID_STATUS
        );

      await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate1,
        expiryDate1,
        { from: dataManager }
      );

      const recipientAfterAdd = await honoraryTreeInstance.recipients.call(
        userAccount1
      );

      assert.equal(Number(recipientAfterAdd.status), 1, "status is incorrect");

      assert.equal(
        Number(recipientAfterAdd.expiryDate),
        expiryDate1,
        "expiry date is incorrect"
      );

      assert.equal(
        Number(recipientAfterAdd.startDate),
        startDate1,
        "start date is incorrect"
      );

      const updateTx = await honoraryTreeInstance.updateRecipient(
        userAccount1,
        startDate2,
        expiryDate2,
        {
          from: dataManager,
        }
      );
      truffleAssert.eventEmitted(updateTx, "RecipientUpdated", (ev) => {
        return ev.recipient == userAccount1;
      });

      const recipientAfterUpdate = await honoraryTreeInstance.recipients.call(
        userAccount1
      );

      assert.equal(
        Number(recipientAfterUpdate.status),
        1,
        "status is incorrect"
      );

      assert.equal(
        Number(recipientAfterUpdate.expiryDate),
        expiryDate2,
        "expiry date is incorrect"
      );

      assert.equal(
        Number(recipientAfterUpdate.startDate),
        startDate2,
        "start date is incorrect"
      );
    });
  });

  describe("reserveSymbol and freeReservedSymbol", () => {
    beforeEach(async () => {
      honoraryTreeInstance = await deployProxy(
        HonoraryTree,
        [
          arInstance.address,
          initialReferralTreePaymentToPlanter,
          initialReferralTreePaymentToAmbassador,
        ],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      attributeInstance = await deployProxy(Attribute, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await honoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );
    });

    it("should reserve symbol", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        honoraryTreeInstance.address,
        deployerAccount
      );

      const symbolsArray = [];
      for (let i = 0; i < 5; i++) {
        let rand = parseInt(Math.random() * 10e10);
        while (symbolsArray.includes(rand)) {
          rand = parseInt(Math.random() * 10e10);
        }
        symbolsArray[i] = rand;
      }

      await honoraryTreeInstance
        .reserveSymbol(symbolsArray[0], { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      for (i = 0; i < symbolsArray.length; i++) {
        await honoraryTreeInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await honoraryTreeInstance.symbols.call(i);
        const usedResult = await honoraryTreeInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol =
          await attributeInstance.uniquenessFactorToSymbolStatus.call(
            symbolsArray[i]
          );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }
      const lastSymbolValue = web3.utils.toBN("12345678987654321");
      await honoraryTreeInstance.reserveSymbol(lastSymbolValue, {
        from: dataManager,
      });

      const lastSymbolsResult = await honoraryTreeInstance.symbols.call(
        symbolsArray.length
      );
      const lastUsedResult = await honoraryTreeInstance.used.call(
        symbolsArray.length
      );

      assert.equal(
        Number(lastSymbolsResult),
        Number(lastSymbolValue),
        "last symbol result is incorrect"
      );
      assert.equal(lastUsedResult, false, "last used result is incorrect");
    });

    it("releaseReservedSymbol should work successfully", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        honoraryTreeInstance.address,
        deployerAccount
      );

      const symbolsArray = [];
      for (let i = 0; i < 5; i++) {
        let rand = parseInt(Math.random() * 10e10);
        while (symbolsArray.includes(rand)) {
          rand = parseInt(Math.random() * 10e10);
        }
        symbolsArray[i] = rand;
      }

      for (i = 0; i < symbolsArray.length; i++) {
        await honoraryTreeInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await honoraryTreeInstance.symbols.call(i);
        const usedResult = await honoraryTreeInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol =
          await attributeInstance.uniquenessFactorToSymbolStatus.call(
            symbolsArray[i]
          );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }

      await honoraryTreeInstance
        .releaseReservedSymbol({ from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await honoraryTreeInstance.releaseReservedSymbol({ from: dataManager });

      for (let i = 0; i < symbolsArray.length; i++) {
        await honoraryTreeInstance.symbols.call(i).should.be.rejected;
        await honoraryTreeInstance.used.call(i).should.be.rejected;
        const uniqueSymbol =
          await attributeInstance.uniquenessFactorToSymbolStatus.call(
            symbolsArray[i]
          );
        assert.equal(
          Number(uniqueSymbol.status),
          0,
          "uniqueSymbol status is incorrect"
        );
      }
    });

    it("releaseReservedSymbol should work successfully (some symbols are used and some symbols are setted by admin)", async () => {
      /////////////  -------------- deploy contracts

      let testHonoraryTreeInstance = await TestHonoraryTree.new({
        from: deployerAccount,
      });

      await testHonoraryTreeInstance.initialize(
        arInstance.address,
        initialReferralTreePaymentToPlanter,
        initialReferralTreePaymentToAmbassador,
        {
          from: deployerAccount,
        }
      );

      treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      /////////////////// ------------ handle roles
      await Common.addTreejerContractRole(
        arInstance,
        testHonoraryTreeInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      //////////////// ----------------- set addresses
      await testHonoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// ------------------- reserve symbols
      const symbolsArray = [];
      for (let i = 0; i < 5; i++) {
        let rand = parseInt(Math.random() * 10e10);
        while (symbolsArray.includes(rand)) {
          rand = parseInt(Math.random() * 10e10);
        }
        symbolsArray[i] = rand;
      }

      for (i = 0; i < symbolsArray.length; i++) {
        await testHonoraryTreeInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await testHonoraryTreeInstance.symbols.call(i);
        const usedResult = await testHonoraryTreeInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol =
          await attributeInstance.uniquenessFactorToSymbolStatus.call(
            symbolsArray[i]
          );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }

      ///////////////// --------------- change some data to test
      await testHonoraryTreeInstance.updateClaimedCount(3);
      await testHonoraryTreeInstance.updateUsed(1);

      await attributeInstance.setAttribute(
        101,
        123456789,
        symbolsArray[3],
        18,
        { from: dataManager }
      );

      assert.equal(
        Number(await testHonoraryTreeInstance.claimedCount.call()),
        3,
        "claimed count is incorrect before free"
      );

      await testHonoraryTreeInstance.releaseReservedSymbol({
        from: dataManager,
      });

      assert.equal(
        Number(await testHonoraryTreeInstance.claimedCount.call()),
        0,
        "claimed count is incorrect after free"
      );

      for (let i = 0; i < symbolsArray.length; i++) {
        await testHonoraryTreeInstance.symbols.call(i).should.be.rejected;
        await testHonoraryTreeInstance.used.call(i).should.be.rejected;
        const uniqueSymbol =
          await attributeInstance.uniquenessFactorToSymbolStatus.call(
            symbolsArray[i]
          );

        ////////// ---------- used is true and dont update status
        if (i == 1) {
          assert.equal(
            Number(uniqueSymbol.status),
            1,
            "uniqueSymbol status is incorrect"
          );
          ////////// ---------- this symbol is setted by admin and status is 3 and dont update status
        } else if (i == 3) {
          assert.equal(
            Number(uniqueSymbol.status),
            3,
            "uniqueSymbol status is incorrect"
          );
        } else {
          assert.equal(
            Number(uniqueSymbol.status),
            0,
            "uniqueSymbol status is incorrect"
          );
        }
      }
    });
  });

  describe("update recipients", () => {
    beforeEach(async () => {
      //------------------ deploy contracts

      honoraryTreeInstance = await deployProxy(
        HonoraryTree,
        [
          arInstance.address,
          initialReferralTreePaymentToPlanter,
          initialReferralTreePaymentToAmbassador,
        ],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      planterFundsInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeFactoryInstance = await deployProxy(
        TreeFactory,
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

      daiInstance = await Dai.new("DAI", "dai", { from: deployerAccount });

      //----------------- set cntract addresses

      await honoraryTreeInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //----------------add role to treejer contract role to treeFactoryInstance address
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //----------------add role to treejer contract role to honoraryTreeInstance address
      await Common.addTreejerContractRole(
        arInstance,
        honoraryTreeInstance.address,
        deployerAccount
      );
    });

    it("should setTreeRange  and releaseTreeRange succussfully", async () => {
      //------------------initial data

      const startTree = 11;
      const endTree = 21;

      const newStartTree = 31;
      const newEndTree = 41;

      const transferAmount = web3.utils.toWei("70");
      const adminWallet = userAccount8;

      //////////////// set price

      await honoraryTreeInstance.updateReferralTreePayments(
        await web3.utils.toWei("5"),
        await web3.utils.toWei("2"),
        {
          from: dataManager,
        }
      );

      ///////---------------- handle admin walllet

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(honoraryTreeInstance.address, transferAmount, {
        from: adminWallet,
      });

      const eventTx = await honoraryTreeInstance.setTreeRange(
        adminWallet,
        startTree,
        endTree,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "TreeRangeSet");
      for (let i = 11; i < 21; i++) {
        assert.equal(
          Number((await treeFactoryInstance.trees.call(i)).saleType),
          5,
          `saleType is not correct for tree ${i}`
        );
      }

      assert.equal(
        Number(startTree),
        Number(await honoraryTreeInstance.currentTreeId.call()),
        "toClaim is not correct"
      );

      assert.equal(
        Number(endTree),
        Number(await honoraryTreeInstance.upTo.call()),
        "upTo is not correct"
      );
      //////////////////// ---------------- check PlanterFund balance
      assert.equal(
        Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
        math.mul(10, web3.utils.toWei("7")),
        "planter balance is inccorect in range 1 set"
      );

      await honoraryTreeInstance
        .setTreeRange(adminWallet, newStartTree, newEndTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_SET_RANGE);

      await honoraryTreeInstance
        .releaseTreeRange({ from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
      const countBefore = await honoraryTreeInstance.prePaidTreeCount.call();
      const diffrence =
        Number(await honoraryTreeInstance.upTo.call()) -
        Number(await honoraryTreeInstance.currentTreeId.call());
      assert.equal(Number(countBefore), 0, "prePaidTreeCount is incorrect");

      const releaseTx = await honoraryTreeInstance.releaseTreeRange({
        from: dataManager,
      });

      truffleAssert.eventEmitted(releaseTx, "TreeRangeReleased");

      for (let i = 11; i < 21; i++) {
        assert.equal(
          Number((await treeFactoryInstance.trees.call(i)).saleType),
          0,
          `saleType is not correct for tree ${i}`
        );
      }

      assert.equal(
        Number(await honoraryTreeInstance.upTo.call()),
        0,
        "upTo after free reserve is inccorect"
      );
      assert.equal(
        Number(await honoraryTreeInstance.currentTreeId.call()),
        0,
        "currentTreeId after free reserve is inccorect"
      );

      const countAfter = await honoraryTreeInstance.prePaidTreeCount.call();

      assert.equal(
        Number(countAfter),
        diffrence,
        "prePaidTreeCount after is incorrect"
      );

      await honoraryTreeInstance.setTreeRange(
        adminWallet,
        newStartTree,
        newEndTree,
        {
          from: dataManager,
        }
      );

      for (let i = 31; i < 41; i++) {
        assert.equal(
          Number((await treeFactoryInstance.trees.call(i)).saleType),
          5,
          `saleType is not correct for tree ${i}`
        );
      }

      assert.equal(
        Number(newStartTree),
        Number(await honoraryTreeInstance.currentTreeId.call()),
        "toClaim is not correct"
      );

      assert.equal(
        Number(newEndTree),
        Number(await honoraryTreeInstance.upTo.call()),
        "upTo is not correct"
      );
    });

    it("should range complex (some trees claimed,first set smaller and then set bigger range)", async () => {
      //------------------initial data

      const startTree = 11;
      const endTree = 21;

      const newStartTree1 = 31;
      const newEndTree1 = 33;

      const newStartTree2 = 41;
      const newEndTree2 = 51;

      const startDate = await Common.timeInitial(TimeEnumes.seconds, 0);
      const expiryDate = await Common.timeInitial(TimeEnumes.hours, 5);

      const transferAmount = web3.utils.toWei("70");
      const adminWallet = userAccount8;

      ////////////// deploy contract
      attributeInstance = await deployProxy(Attribute, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      ////////////////// handle role
      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      ///////////// set address
      await honoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////////// set price

      await honoraryTreeInstance.updateReferralTreePayments(
        await web3.utils.toWei("5"),
        await web3.utils.toWei("2"),
        {
          from: dataManager,
        }
      );

      ///////---------------- handle admin walllet

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(honoraryTreeInstance.address, transferAmount, {
        from: adminWallet,
      });

      await honoraryTreeInstance.setTreeRange(adminWallet, startTree, endTree, {
        from: dataManager,
      });

      const symbolsArray = [];
      for (let i = 0; i < 10; i++) {
        let rand = parseInt(Math.random() * 10e10);
        while (symbolsArray.includes(rand)) {
          rand = parseInt(Math.random() * 10e10);
        }
        symbolsArray[i] = rand;
        await honoraryTreeInstance.reserveSymbol(rand, {
          from: dataManager,
        });
      }
      //////////////// --------------- add recipients
      await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        { from: dataManager }
      );
      await honoraryTreeInstance.addRecipient(
        userAccount2,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );
      await honoraryTreeInstance.addRecipient(
        userAccount3,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );
      ////////////// claim gift

      await honoraryTreeInstance.claim({ from: userAccount1 });
      await honoraryTreeInstance.claim({ from: userAccount2 });
      await honoraryTreeInstance.claim({ from: userAccount3 });

      /////////////////////////// check data

      assert.equal(
        Number(await honoraryTreeInstance.currentTreeId.call()),
        14,
        "current tree is incorrect"
      );
      await honoraryTreeInstance
        .setTreeRange(adminWallet, newStartTree1, newEndTree1, {
          from: dataManager,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_SET_RANGE);

      await honoraryTreeInstance.releaseTreeRange({ from: dataManager });

      assert.equal(
        Number(await honoraryTreeInstance.prePaidTreeCount.call()),
        7,
        "prePaidTreeCount after free1 is incorrect"
      );

      await honoraryTreeInstance.setTreeRange(
        adminWallet,
        newStartTree1,
        newEndTree1,
        {
          from: dataManager,
        }
      );

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
        Number(web3.utils.toWei("70")),
        "planterFund balance is incorrect"
      );

      assert.equal(
        Number(await honoraryTreeInstance.prePaidTreeCount.call()),
        5,
        "prePaidTreeCount after set range2 is incorrect"
      );

      await honoraryTreeInstance.addRecipient(
        userAccount4,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance.claim({ from: userAccount4 });

      await honoraryTreeInstance.releaseTreeRange({ from: dataManager });

      assert.equal(
        Number(await honoraryTreeInstance.prePaidTreeCount.call()),
        6,
        "prePaidTreeCount after free1 is incorrect"
      );

      await daiInstance.setMint(adminWallet, web3.utils.toWei("28"));

      await daiInstance.approve(
        honoraryTreeInstance.address,
        web3.utils.toWei("28"),
        {
          from: adminWallet,
        }
      );

      await honoraryTreeInstance.setTreeRange(
        adminWallet,
        newStartTree2,
        newEndTree2,
        {
          from: dataManager,
        }
      );

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
        Number(web3.utils.toWei("98")),
        "planterFund balance is incorrect"
      );

      assert.equal(
        Number(await honoraryTreeInstance.prePaidTreeCount.call()),
        0,
        "prePaidTreeCount after free1 is incorrect"
      );
    });

    it("fail to set gift range", async () => {
      //------------------initial data

      const startTree = 11;
      const endTree = 101;
      const planterShare = web3.utils.toWei("5");
      const referralShare = web3.utils.toWei("2");
      const transferAmount = web3.utils.toWei("630");
      const insufficientTransferAmount = web3.utils.toWei("629.9");
      const addminWalletWithInsufficientTransferAmount = userAccount6;
      const insufficientApprovalAmount = web3.utils.toWei("629");
      const adminWallet = userAccount8;
      const treeIdInAuction = 16;

      //////////////// set price

      await honoraryTreeInstance.updateReferralTreePayments(
        planterShare,
        referralShare,
        {
          from: dataManager,
        }
      );

      ///////////////// ---------------------- fail because caller is not data manager
      await honoraryTreeInstance
        .setTreeRange(adminWallet, startTree, endTree, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      ///////////----------------- fail because of invalid range
      await honoraryTreeInstance
        .setTreeRange(adminWallet, endTree, startTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.INVALID_RANGE);

      /////////////// fail because of insufficient approval amount

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(
        honoraryTreeInstance.address,
        insufficientApprovalAmount,
        {
          from: adminWallet,
        }
      );

      await honoraryTreeInstance
        .setTreeRange(
          adminWallet,
          startTree,
          endTree,

          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(erc20ErrorMsg.APPROVAL_ISSUE);

      //////////// fail because of insufficient admin account balance
      await daiInstance.setMint(
        addminWalletWithInsufficientTransferAmount,
        insufficientTransferAmount
      );

      await daiInstance.approve(honoraryTreeInstance.address, transferAmount, {
        from: addminWalletWithInsufficientTransferAmount,
      });

      await honoraryTreeInstance
        .setTreeRange(
          addminWalletWithInsufficientTransferAmount,
          startTree,
          endTree,

          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(erc20ErrorMsg.INSUFFICIENT_BALANCE);

      //////////////----------------- fail because of invalid admin account
      await honoraryTreeInstance
        .setTreeRange(zeroAddress, startTree, endTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(erc20ErrorMsg.ZERO_ADDRESS);

      //----------------- fail setTreeRange because a tree is not free

      await treeFactoryInstance.listTree(treeIdInAuction, "some ipfs hash", {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        userAccount7,
        deployerAccount
      );

      await treeFactoryInstance.manageSaleTypeBatch(
        treeIdInAuction,
        treeIdInAuction + 1,
        5,
        { from: userAccount7 }
      );

      await honoraryTreeInstance
        .setTreeRange(adminWallet, startTree, endTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.TREES_ARE_NOT_AVAILABLE);
    });
  });

  describe("claim", () => {
    beforeEach(async () => {
      const expiryDate = await Common.timeInitial(TimeEnumes.days, 30); //one month after now

      //------------------ deploy contracts

      honoraryTreeInstance = await deployProxy(
        HonoraryTree,
        [
          arInstance.address,
          initialReferralTreePaymentToPlanter,
          initialReferralTreePaymentToAmbassador,
        ],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      attributeInstance = await deployProxy(Attribute, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      planterFundsInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeFactoryInstance = await deployProxy(
        TreeFactory,
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

      daiInstance = await Dai.new("DAI", "dai", {
        from: deployerAccount,
      });

      //----------------- set cntract addresses

      await honoraryTreeInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //----------------add role to treejer contract role to treeFactoryInstance address
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //----------------add role to treejer contract role to honoraryTreeInstance address
      await Common.addTreejerContractRole(
        arInstance,
        honoraryTreeInstance.address,
        deployerAccount
      );

      //----------------add role to treejer contract role to attributeInstance address
      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
    });

    it("claim should be reject", async () => {
      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_CLAIM);

      const startDate = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_CLAIM);

      await honoraryTreeInstance.updateRecipient(userAccount1, 10, 500, {
        from: dataManager,
      });

      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_CLAIM);

      await honoraryTreeInstance.updateRecipient(userAccount1, 10, expiryDate, {
        from: dataManager,
      });

      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.TREES_ARE_NOT_AVAILABLE);

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        honoraryTreeInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setTreeRange(deployerAccount, 10, 13, {
        from: dataManager,
      });

      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.SYMBOL_NOT_EXIST);

      await honoraryTreeInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      await honoraryTreeInstance.claim({
        from: userAccount1,
      });
    });

    it("claim should be work successfully", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        honoraryTreeInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setTreeRange(deployerAccount, 10, 11, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      let eventTx1 = await honoraryTreeInstance.claim({
        from: userAccount1,
      });

      //check used
      const usedResult = await honoraryTreeInstance.used.call(0);
      assert.equal(usedResult, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(1050);
      assert.equal(Number(uniqueSymbol.status), 3, "status is not correct");
      assert.equal(
        Number(uniqueSymbol.generatedCount),
        1,
        "status is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(10)).generationType),
        18,
        "Symbols generationType is not correct"
      );

      //check RecipientData
      let recipientData = await honoraryTreeInstance.recipients.call(
        userAccount1
      );
      assert.equal(Number(recipientData.status), 0, "status is not correct");
      assert.equal(
        Number(recipientData.expiryDate),
        0,
        "expiryDate is not correct"
      );
      assert.equal(
        Number(recipientData.startDate),
        0,
        "startDate is not correct"
      );

      //check claimedCount
      assert.equal(
        Number(await honoraryTreeInstance.claimedCount()),
        1,
        "status is not correct"
      );

      //check currentTreeId
      assert.equal(
        Number(await honoraryTreeInstance.currentTreeId()),
        11,
        "status is not correct"
      );

      //check tree owner
      assert.equal(
        await treeTokenInstance.ownerOf(10),
        userAccount1,
        "result is not correct"
      );

      ///----------check planterFundContract

      const pFundAfter =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(10);

      const rFundAfter =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(10);

      assert.equal(
        Number(pFundAfter),
        Number(initialReferralTreePaymentToPlanter),
        "ReferralTreePaymentToPlanter is not ok"
      );

      assert.equal(
        Number(rFundAfter),
        Number(initialReferralTreePaymentToAmbassador),
        "ReferralTreePaymentToAmbassador is not ok"
      );

      const pfTotalFundAfter = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(pfTotalFundAfter.planter),
        Number(initialReferralTreePaymentToPlanter),
        "planter total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.ambassador),
        Number(initialReferralTreePaymentToAmbassador),
        "ambassador total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.localDevelopment),
        0,
        "local develop total fund is not ok"
      );

      //////////-------------- check event emitted

      truffleAssert.eventEmitted(eventTx1, "Claimed", (ev) => {
        return Number(ev.treeId) == 10;
      });

      await honoraryTreeInstance
        .claim({
          from: userAccount1,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.CANT_CLAIM);

      //////---------------------------------test2 (check ClaimFailed emit)

      await honoraryTreeInstance.addRecipient(
        userAccount2,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance
        .claim({
          from: userAccount2,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.TREES_ARE_NOT_AVAILABLE);

      await honoraryTreeInstance.setTreeRange(deployerAccount, 11, 13, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1055, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1058, {
        from: dataManager,
      });

      await attributeInstance.setAttribute(20, 100012, 1055, 20, {
        from: dataManager,
      });

      await attributeInstance.setAttribute(22, 2321321, 1058, 20, {
        from: dataManager,
      });

      let eventTx2 = await honoraryTreeInstance.claim({
        from: userAccount2,
      });

      truffleAssert.eventEmitted(eventTx2, "ClaimFailed", (ev) => {
        return ev.recipient == userAccount2;
      });
    });

    it("2-claim should be work successfully", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await honoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance.addRecipient(
        userAccount2,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance.addRecipient(
        userAccount3,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      await honoraryTreeInstance.addRecipient(
        userAccount4,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        honoraryTreeInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await honoraryTreeInstance.setTreeRange(deployerAccount, 10, 15, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1051, {
        from: dataManager,
      });
      await honoraryTreeInstance.reserveSymbol(1052, {
        from: dataManager,
      });

      let eventTx1 = await honoraryTreeInstance.claim({
        from: userAccount1,
      });

      let treeIdGeneratedForUser1;

      for (let i = 0; i < 3; i++) {
        if (await honoraryTreeInstance.used.call(i)) {
          treeIdGeneratedForUser1 = i;
          break;
        }
      }

      //check used
      const usedResult = await honoraryTreeInstance.used.call(
        treeIdGeneratedForUser1
      );
      assert.equal(usedResult, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          await honoraryTreeInstance.symbols.call(treeIdGeneratedForUser1)
        );
      assert.equal(Number(uniqueSymbol.status), 3, "status is not correct");
      assert.equal(
        Number(uniqueSymbol.generatedCount),
        1,
        "status is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(10)).generationType),
        18,
        "Symbols generationType is not correct"
      );

      //check RecipientData
      let recipientData = await honoraryTreeInstance.recipients.call(
        userAccount1
      );
      assert.equal(Number(recipientData.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await honoraryTreeInstance.claimedCount()),
        1,
        "status is not correct"
      );

      //check tree owner
      assert.equal(
        await treeTokenInstance.ownerOf(10),
        userAccount1,
        "result is not correct"
      );

      //////////-------------- check event emitted

      truffleAssert.eventEmitted(eventTx1, "Claimed", (ev) => {
        return Number(ev.treeId) == 10;
      });

      //
      //
      //

      ////---------------------------------- claim user2

      let eventTx2 = await honoraryTreeInstance.claim({
        from: userAccount2,
      });

      let treeIdGeneratedForUser2;

      for (let i = 0; i < 3; i++) {
        if (
          (await honoraryTreeInstance.used.call(i)) &&
          i != treeIdGeneratedForUser2
        ) {
          treeIdGeneratedForUser2 = i;
          break;
        }
      }

      //check used
      const usedResult2 = await honoraryTreeInstance.used.call(
        treeIdGeneratedForUser2
      );
      assert.equal(usedResult2, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol2 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          await honoraryTreeInstance.symbols.call(treeIdGeneratedForUser2)
        );
      assert.equal(Number(uniqueSymbol2.status), 3, "status is not correct");
      assert.equal(
        Number(uniqueSymbol2.generatedCount),
        1,
        "status is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(11)).generationType),
        18,
        "Symbols generationType is not correct"
      );

      //check RecipientData
      let recipientData2 = await honoraryTreeInstance.recipients.call(
        userAccount2
      );
      assert.equal(Number(recipientData2.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await honoraryTreeInstance.claimedCount()),
        2,
        "status is not correct"
      );

      //check tree owner
      assert.equal(
        await treeTokenInstance.ownerOf(11),
        userAccount2,
        "result is not correct"
      );

      //////////-------------- check event emitted

      truffleAssert.eventEmitted(eventTx2, "Claimed", (ev) => {
        return Number(ev.treeId) == 11;
      });

      ////---------------------------------- claim user2

      let eventTx3 = await honoraryTreeInstance.claim({
        from: userAccount3,
      });

      let treeIdGeneratedForUser3;

      for (let i = 0; i < 3; i++) {
        if (
          (await honoraryTreeInstance.used.call(i)) &&
          i != treeIdGeneratedForUser1 &&
          i != treeIdGeneratedForUser2
        ) {
          treeIdGeneratedForUser3 = i;
          break;
        }
      }

      //check used
      const usedResult3 = await honoraryTreeInstance.used.call(
        treeIdGeneratedForUser3
      );
      assert.equal(usedResult3, true, "used result is incorrect");

      //check uniquenessFactorToSymbolStatus
      let uniqueSymbol3 =
        await attributeInstance.uniquenessFactorToSymbolStatus.call(
          await honoraryTreeInstance.symbols.call(treeIdGeneratedForUser3)
        );
      assert.equal(Number(uniqueSymbol3.status), 3, "status is not correct");
      assert.equal(
        Number(uniqueSymbol3.generatedCount),
        1,
        "status is not correct"
      );

      assert.equal(
        Number((await treeTokenInstance.symbols(11)).generationType),
        18,
        "Symbols generationType is not correct"
      );

      //check RecipientData
      let recipientData3 = await honoraryTreeInstance.recipients.call(
        userAccount3
      );
      assert.equal(Number(recipientData3.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await honoraryTreeInstance.claimedCount()),
        3,
        "status is not correct"
      );

      //check tree owner
      assert.equal(
        await treeTokenInstance.ownerOf(12),
        userAccount3,
        "result is not correct"
      );

      //////////-------------- check event emitted

      truffleAssert.eventEmitted(eventTx3, "Claimed", (ev) => {
        return Number(ev.treeId) == 12;
      });

      ///----------check planterFundContract

      const pFundAfter =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(12);

      const rFundAfter =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(12);

      assert.equal(
        Number(pFundAfter),
        Number(initialReferralTreePaymentToPlanter),
        "ReferralTreePaymentToPlanter is not ok"
      );

      assert.equal(
        Number(rFundAfter),
        Number(initialReferralTreePaymentToAmbassador),
        "ReferralTreePaymentToAmbassador is not ok"
      );

      const pfTotalFundAfter = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(pfTotalFundAfter.planter),
        Number(initialReferralTreePaymentToPlanter) * 3,
        "planter total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.ambassador),
        Number(initialReferralTreePaymentToAmbassador) * 3,
        "ambassador total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.localDevelopment),
        0,
        "local develop total fund is not ok"
      );

      ////------------------gift 4
      await honoraryTreeInstance
        .claim({
          from: userAccount4,
        })
        .should.be.rejectedWith(HonoraryTreeErrorMsg.SYMBOL_NOT_EXIST);
    });

    it("claim in TestHonoraryTree", async () => {
      /////////////  -------------- deploy contracts

      let testHonoraryTreeInstance = await TestHonoraryTree.new({
        from: deployerAccount,
      });

      await testHonoraryTreeInstance.initialize(
        arInstance.address,
        initialReferralTreePaymentToPlanter,
        initialReferralTreePaymentToAmbassador,
        {
          from: deployerAccount,
        }
      );

      treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      /////////////////// ------------ handle roles
      await Common.addTreejerContractRole(
        arInstance,
        testHonoraryTreeInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

      //////////////// ----------------- set addresses
      await testHonoraryTreeInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await testHonoraryTreeInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await testHonoraryTreeInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await testHonoraryTreeInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////------------------------------------------------------------------------

      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await testHonoraryTreeInstance.addRecipient(
        userAccount1,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        testHonoraryTreeInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await testHonoraryTreeInstance.setTreeRange(deployerAccount, 10, 15, {
        from: dataManager,
      });

      await testHonoraryTreeInstance.reserveSymbol(1050, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1051, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1052, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1053, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1054, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1055, {
        from: dataManager,
      });
      await testHonoraryTreeInstance.reserveSymbol(1056, {
        from: dataManager,
      });

      await testHonoraryTreeInstance.testClaimGiftFor(17, {
        from: userAccount1,
      });

      //check used
      const usedResult = await testHonoraryTreeInstance.used.call(3);
      assert.equal(usedResult, true, "used result is incorrect");

      await testHonoraryTreeInstance.testClaimGiftFor(15, {
        from: userAccount1,
      });

      //check used
      const usedResult2 = await testHonoraryTreeInstance.used.call(4);
      assert.equal(usedResult2, true, "used result is incorrect");

      await attributeInstance.setAttribute(22, 2321321, 1050, 20, {
        from: dataManager,
      });

      let tx = await testHonoraryTreeInstance.testClaimGiftFor(20, {
        from: userAccount1,
      });

      // check used
      const usedResult3 = await testHonoraryTreeInstance.used.call(1);
      assert.equal(usedResult3, true, "used result is incorrect");
    });

    //////////////--------------------------------------------gsn------------------------------------------------
    it("test gsn [ @skip-on-coverage ]", async () => {
      let env = await GsnTestEnvironment.startGsn("localhost");

      const { forwarderAddress, relayHubAddress, paymasterAddress } =
        env.contractsDeployment;

      await honoraryTreeInstance.setTrustedForwarder(forwarderAddress, {
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

      let signerRecipient = provider.getSigner(3);

      let contractHonoraryTree = await new ethers.Contract(
        honoraryTreeInstance.address,
        honoraryTreeInstance.abi,
        signerRecipient
      );

      const recipient = userAccount2;
      const symbol = 1234554321;

      //////////--------------add recipient by admin

      const startTree = 11;
      const endTree = 13;

      const transferAmount = web3.utils.toWei("14");
      const adminWallet = userAccount8;

      ///////---------------- handle admin walllet

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(honoraryTreeInstance.address, transferAmount, {
        from: adminWallet,
      });

      ////////////////////////////////////////////////////////////////////////////////////////

      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expiryDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await honoraryTreeInstance.addRecipient(
        recipient,
        startDate,
        expiryDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------

      await honoraryTreeInstance.setTreeRange(adminWallet, startTree, endTree, {
        from: dataManager,
      });

      await honoraryTreeInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      await honoraryTreeInstance.updateReferralTreePayments(
        web3.utils.toWei("4.9"), //planter share
        web3.utils.toWei("2.1"), //ambassedor share
        { from: dataManager }
      );

      //////////////////////////////////////////////////////////////////////////////////////////

      let balanceAccountBefore = await web3.eth.getBalance(recipient);

      await contractHonoraryTree
        .claim({
          from: recipient,
        })
        .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

      await paymaster.addFunderWhitelistTarget(honoraryTreeInstance.address, {
        from: deployerAccount,
      });

      await contractHonoraryTree.claim({
        from: recipient,
      });

      let balanceAccountAfter = await web3.eth.getBalance(recipient);

      assert.equal(
        balanceAccountAfter,
        balanceAccountBefore,
        "gsn not true work"
      );
    });
  });
});
/////////
