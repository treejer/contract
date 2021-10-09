const AccessRestriction = artifacts.require("AccessRestriction");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Tree = artifacts.require("Tree.sol");
const Dai = artifacts.require("Dai.sol");
const TestCommunityGifts = artifacts.require("TestCommunityGifts.sol");
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
  CommunityGiftErrorMsg,
  TreeAttributeErrorMsg,
  erc20ErrorMsg,
  GsnErrorMsg,
} = require("./enumes");

contract("CommunityGifts", (accounts) => {
  let communityGiftsInstance;
  let arInstance;
  let treeAttributeInstance;
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
  const initialPlanterFund = web3.utils.toWei("0.5");
  const initialReferralFund = web3.utils.toWei("0.1");

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  afterEach(async () => {});

  ////////////////--------------------------------------------gsn------------------------------------------------
  // it("test gsn [ @skip-on-coverage ]", async () => {
  //   let env = await GsnTestEnvironment.startGsn("localhost");

  //   const { forwarderAddress, relayHubAddress, paymasterAddress } =
  //     env.contractsDeployment;

  //   await communityGiftsInstance.setTrustedForwarder(forwarderAddress, {
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

  //   let signerGiftee = provider.getSigner(3);

  //   let contractCommunityGift = await new ethers.Contract(
  //     communityGiftsInstance.address,
  //     communityGiftsInstance.abi,
  //     signerGiftee
  //   );

  //   const giftee = userAccount2;
  //   const symbol = 1234554321;

  //   //////////--------------add giftee by admin

  //   const startTree = 11;
  //   const endTree = 13;
  //   const planterShare = web3.utils.toWei("5");
  //   const referralShare = web3.utils.toWei("2");
  //   const transferAmount = web3.utils.toWei("14");
  //   const adminWallet = userAccount8;
  //   const expireDate = await Common.timeInitial(TimeEnumes.days, 30);

  //   ///////---------------- handle admin walllet

  //   await daiInstance.setMint(adminWallet, transferAmount);

  //   await daiInstance.approve(communityGiftsInstance.address, transferAmount, {
  //     from: adminWallet,
  //   });

  //   //////////--------------add giftee by admin

  //   await communityGiftsInstance.setGiftsRange(
  //     startTree,
  //     endTree,
  //     planterShare,
  //     referralShare,
  //     Number(expireDate),
  //     adminWallet,
  //     {
  //       from: dataManager,
  //     }
  //   );

  //   await communityGiftsInstance.updateGiftees(giftee, symbol, {
  //     from: dataManager,
  //   });

  //   await communityGiftsInstance.setPrice(
  //     web3.utils.toWei("4.9"), //planter share
  //     web3.utils.toWei("2.1"), //referral share
  //     { from: dataManager }
  //   );

  //   let balanceAccountBefore = await web3.eth.getBalance(giftee);

  //   await contractCommunityGift
  //     .claimTree({
  //       from: giftee,
  //     })
  //     .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

  //   await paymaster.addFunderWhitelistTarget(communityGiftsInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await contractCommunityGift.claimTree({
  //     from: giftee,
  //   });

  //   let balanceAccountAfter = await web3.eth.getBalance(giftee);

  //   assert.equal(
  //     balanceAccountAfter,
  //     balanceAccountBefore,
  //     "gsn not true work"
  //   );
  // });

  describe("deployment and set addresses", () => {
    beforeEach(async () => {
      communityGiftsInstance = await deployProxy(
        CommunityGifts,
        [arInstance.address, initialPlanterFund, initialReferralFund],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
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
    });
    it("deploys successfully and set addresses", async () => {
      //////////////////------------------------------------ deploy successfully ----------------------------------------//
      const address = communityGiftsInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      ///////////////---------------------------------set trust forwarder address--------------------------------------------------------

      await communityGiftsInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await communityGiftsInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await communityGiftsInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await communityGiftsInstance.trustedForwarder(),
        "address set incorrect"
      );

      /////////////////---------------------------------set dai token address--------------------------------------------------------

      await communityGiftsInstance
        .setDaiTokenAddress(daiInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await communityGiftsInstance
        .setDaiTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await communityGiftsInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiInstance.address,
        await communityGiftsInstance.daiToken.call(),
        "address set incorect"
      );

      /////////////////---------------------------------set tree attribute address--------------------------------------------------------
      await communityGiftsInstance
        .setTreeAttributesAddress(treeAttributeInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await communityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        treeAttributeInstance.address,
        await communityGiftsInstance.treeAttribute.call(),
        "address set incorect"
      );

      /////////////////---------------------------------set tree factory address--------------------------------------------------------

      await communityGiftsInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await communityGiftsInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        treeFactoryInstance.address,
        await communityGiftsInstance.treeFactory.call(),
        "address set incorect"
      );
      /////////////////---------------------------------set planter fund address--------------------------------------------------------

      await communityGiftsInstance
        .setPlanterFundAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await communityGiftsInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        planterFundsInstnce.address,
        await communityGiftsInstance.planterFundContract.call(),
        "address set incorect"
      );
    });
  });

  describe("set price and add giftee update giftee", () => {
    beforeEach(async () => {
      communityGiftsInstance = await deployProxy(
        CommunityGifts,
        [arInstance.address, initialPlanterFund, initialReferralFund],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );
    });

    /////////////////-------------------------------------- set price ------------------------------------------------

    it("should set price successfully and check data to be ok and fail in invalid situation", async () => {
      const planterFund = Units.convert("0.5", "eth", "wei");
      const referralFund = Units.convert("0.1", "eth", "wei");

      ////////// --------------- fail because caller is not data manager
      await communityGiftsInstance
        .setPrice(100, 200, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const eventTx = await communityGiftsInstance.setPrice(
        planterFund,
        referralFund,
        {
          from: dataManager,
        }
      );

      const settedPlanterFund = await communityGiftsInstance.planterFund.call();
      const settedReferralFund =
        await communityGiftsInstance.referralFund.call();

      assert.equal(
        Number(settedPlanterFund),
        Number(planterFund),
        "planter fund is not correct"
      );

      assert.equal(
        Number(settedReferralFund),
        Number(referralFund),
        "referral fund is not correct"
      );

      truffleAssert.eventEmitted(eventTx, "CommunityGiftPlanterFund", (ev) => {
        return (
          Number(ev.planterFund) == Number(planterFund) &&
          Number(ev.referralFund) == Number(referralFund)
        );
      });
    });

    /////////////////---------------------------------addGiftee--------------------------------------------------------
    it("should add giftee", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expireDate = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      const newStartDate = parseInt(new Date().getTime() / 1000) + 5 * 60 * 60;
      const newExpireDate = parseInt(new Date().getTime() / 1000) + 9 * 60 * 60;

      await communityGiftsInstance
        .addGiftee(userAccount1, startDate, expireDate, { from: userAccount2 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      const oldGiftee = await communityGiftsInstance.giftees.call(userAccount1);

      assert.equal(Number(oldGiftee.status), 1, "status is incorrect");

      assert.equal(
        Number(oldGiftee.expireDate),
        expireDate,
        "expire date is incorrect"
      );

      assert.equal(
        Number(oldGiftee.startDate),
        startDate,
        "start date is incorrect"
      );

      await communityGiftsInstance.addGiftee(
        userAccount1,
        newStartDate,
        newExpireDate,
        {
          from: dataManager,
        }
      );

      const newGiftee = await communityGiftsInstance.giftees.call(userAccount1);

      assert.equal(Number(newGiftee.status), 1, "status is incorrect");

      assert.equal(
        Number(newGiftee.expireDate),
        newExpireDate,
        "expire date is incorrect"
      );

      assert.equal(
        Number(newGiftee.startDate),
        newStartDate,
        "start date is incorrect"
      );
    });
    /////////////////---------------------------------editGiftee--------------------------------------------------------
    it("should edit giftee", async () => {
      const startDate1 = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expireDate1 = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      const startDate2 =
        parseInt(new Date().getTime() / 1000) + 1 * 24 * 60 * 60;
      const expireDate2 =
        parseInt(new Date().getTime() / 1000) + 2 * 24 * 60 * 60;

      await communityGiftsInstance
        .updateGiftee(userAccount1, startDate1, expireDate1, {
          from: userAccount8,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await communityGiftsInstance
        .updateGiftee(userAccount1, startDate1, expireDate1, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          CommunityGiftErrorMsg.UPDATE_GIFTEE_INVALID_STATUS
        );

      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate1,
        expireDate1,
        { from: dataManager }
      );

      const gifteeAfterAdd = await communityGiftsInstance.giftees.call(
        userAccount1
      );

      assert.equal(Number(gifteeAfterAdd.status), 1, "status is incorrect");

      assert.equal(
        Number(gifteeAfterAdd.expireDate),
        expireDate1,
        "expire date is incorrect"
      );

      assert.equal(
        Number(gifteeAfterAdd.startDate),
        startDate1,
        "start date is incorrect"
      );

      await communityGiftsInstance.updateGiftee(
        userAccount1,
        startDate2,
        expireDate2,
        {
          from: dataManager,
        }
      );

      const gifteeAfterUpdate = await communityGiftsInstance.giftees.call(
        userAccount1
      );

      assert.equal(Number(gifteeAfterUpdate.status), 1, "status is incorrect");

      assert.equal(
        Number(gifteeAfterUpdate.expireDate),
        expireDate2,
        "expire date is incorrect"
      );

      assert.equal(
        Number(gifteeAfterUpdate.startDate),
        startDate2,
        "start date is incorrect"
      );
    });
  });

  describe("reserveSymbol and freeReservedSymbol", () => {
    beforeEach(async () => {
      communityGiftsInstance = await deployProxy(
        CommunityGifts,
        [arInstance.address, initialPlanterFund, initialReferralFund],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      await communityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        { from: deployerAccount }
      );
    });

    it("should reserve symbol", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        communityGiftsInstance.address,
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

      await communityGiftsInstance
        .reserveSymbol(symbolsArray[0], { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      for (i = 0; i < symbolsArray.length; i++) {
        await communityGiftsInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await communityGiftsInstance.symbols.call(i);
        const usedResult = await communityGiftsInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
          symbolsArray[i]
        );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }
      const lastSymbolValue = web3.utils.toBN("12345678987654321");
      await communityGiftsInstance.reserveSymbol(lastSymbolValue, {
        from: dataManager,
      });

      const lastSymbolsResult = await communityGiftsInstance.symbols.call(
        symbolsArray.length
      );
      const lastUsedResult = await communityGiftsInstance.used.call(
        symbolsArray.length
      );

      assert.equal(
        Number(lastSymbolsResult),
        Number(lastSymbolValue),
        "last symbol result is incorrect"
      );
      assert.equal(lastUsedResult, false, "last used result is incorrect");
    });

    it("removeReservedSymbol should work successfully", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        communityGiftsInstance.address,
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
        await communityGiftsInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await communityGiftsInstance.symbols.call(i);
        const usedResult = await communityGiftsInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
          symbolsArray[i]
        );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }

      await communityGiftsInstance
        .removeReservedSymbol({ from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await communityGiftsInstance.removeReservedSymbol({ from: dataManager });

      for (let i = 0; i < symbolsArray.length; i++) {
        await communityGiftsInstance.symbols.call(i).should.be.rejected;
        await communityGiftsInstance.used.call(i).should.be.rejected;
        const uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
          symbolsArray[i]
        );
        assert.equal(
          Number(uniqueSymbol.status),
          0,
          "uniqueSymbol status is incorrect"
        );
      }
    });

    it("removeReservedSymbol should work successfully (some symbols are used and some symbols are setted by admin)", async () => {
      /////////////  -------------- deploy contracts

      let testCommunityGiftsInstance = await TestCommunityGifts.new({
        from: deployerAccount,
      });

      await testCommunityGiftsInstance.initialize(
        arInstance.address,
        initialPlanterFund,
        initialReferralFund,
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
        testCommunityGiftsInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );

      //////////////// ----------------- set addresses
      await testCommunityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        { from: deployerAccount }
      );

      await treeAttributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        { from: deployerAccount }
      );

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
        await testCommunityGiftsInstance.reserveSymbol(symbolsArray[i], {
          from: dataManager,
        });
      }

      for (let i = 0; i < symbolsArray.length; i++) {
        const symbolsResult = await testCommunityGiftsInstance.symbols.call(i);
        const usedResult = await testCommunityGiftsInstance.used.call(i);
        assert.equal(
          Number(symbolsResult),
          symbolsArray[i],
          "symbol result is incorrect"
        );
        assert.equal(usedResult, false, "used result is incorrect");
        const uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
          symbolsArray[i]
        );

        assert.equal(
          Number(uniqueSymbol.status),
          1,
          "uniqueSymbol status is incorrect"
        );
      }

      ///////////////// --------------- change some data to test
      await testCommunityGiftsInstance.updateClaimedCount(3);
      await testCommunityGiftsInstance.updateUsed(1);

      await treeAttributeInstance.setTreeAttributesByAdmin(
        101,
        123456789,
        symbolsArray[3],
        18,
        { from: dataManager }
      );

      assert.equal(
        Number(await testCommunityGiftsInstance.claimedCount.call()),
        3,
        "claimed count is incorrect before free"
      );

      await testCommunityGiftsInstance.removeReservedSymbol({
        from: dataManager,
      });

      assert.equal(
        Number(await testCommunityGiftsInstance.claimedCount.call()),
        0,
        "claimed count is incorrect after free"
      );

      for (let i = 0; i < symbolsArray.length; i++) {
        await testCommunityGiftsInstance.symbols.call(i).should.be.rejected;
        await testCommunityGiftsInstance.used.call(i).should.be.rejected;
        const uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
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

  describe("update giftees", () => {
    beforeEach(async () => {
      //------------------ deploy contracts

      communityGiftsInstance = await deployProxy(
        CommunityGifts,
        [arInstance.address, initialPlanterFund, initialReferralFund],
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

      await communityGiftsInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setDaiTokenAddress(daiInstance.address, {
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

      //----------------add role to treejer contract role to communityGiftsInstance address
      await Common.addTreejerContractRole(
        arInstance,
        communityGiftsInstance.address,
        deployerAccount
      );
    });

    it("should setGiftRange  and freeGiftRange succussfully", async () => {
      //------------------initial data

      const startTree = 11;
      const endTree = 21;

      const newStartTree = 31;
      const newEndTree = 41;

      const transferAmount = web3.utils.toWei("70");
      const adminWallet = userAccount8;

      //////////////// set price

      await communityGiftsInstance.setPrice(
        await web3.utils.toWei("5"),
        await web3.utils.toWei("2"),
        {
          from: dataManager,
        }
      );

      ///////---------------- handle admin walllet

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(
        communityGiftsInstance.address,
        transferAmount,
        {
          from: adminWallet,
        }
      );

      const eventTx = await communityGiftsInstance.setGiftRange(
        adminWallet,
        startTree,
        endTree,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "CommuintyGiftSet");
      for (let i = 11; i < 21; i++) {
        assert.equal(
          Number((await treeFactoryInstance.trees.call(i)).saleType),
          5,
          `saleType is not correct for tree ${i}`
        );
      }

      assert.equal(
        Number(startTree),
        Number(await communityGiftsInstance.currentTree.call()),
        "toClaim is not correct"
      );

      assert.equal(
        Number(endTree),
        Number(await communityGiftsInstance.upTo.call()),
        "upTo is not correct"
      );
      //////////////////// ---------------- check planterFund balance
      assert.equal(
        Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
        math.mul(10, web3.utils.toWei("7")),
        "planter balance is inccorect in range 1 set"
      );

      await communityGiftsInstance
        .setGiftRange(adminWallet, newStartTree, newEndTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_SET_RANGE);

      await communityGiftsInstance
        .freeGiftRange({ from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
      const countBefore = await communityGiftsInstance.count.call();
      const diffrence =
        Number(await communityGiftsInstance.upTo.call()) -
        Number(await communityGiftsInstance.currentTree.call());
      assert.equal(Number(countBefore), 0, "count is incorrect");

      await communityGiftsInstance.freeGiftRange({ from: dataManager });

      for (let i = 11; i < 21; i++) {
        assert.equal(
          Number((await treeFactoryInstance.trees.call(i)).saleType),
          0,
          `saleType is not correct for tree ${i}`
        );
      }

      assert.equal(
        Number(await communityGiftsInstance.upTo.call()),
        0,
        "upTo after free reserve is inccorect"
      );
      assert.equal(
        Number(await communityGiftsInstance.currentTree.call()),
        0,
        "currentTree after free reserve is inccorect"
      );

      const countAfter = await communityGiftsInstance.count.call();

      assert.equal(Number(countAfter), diffrence, "count after is incorrect");

      await communityGiftsInstance.setGiftRange(
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
        Number(await communityGiftsInstance.currentTree.call()),
        "toClaim is not correct"
      );

      assert.equal(
        Number(newEndTree),
        Number(await communityGiftsInstance.upTo.call()),
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
      const expireDate = await Common.timeInitial(TimeEnumes.hours, 5);

      const transferAmount = web3.utils.toWei("70");
      const adminWallet = userAccount8;

      ////////////// deploy contract
      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      ////////////////// handle role
      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );

      ///////////// set address
      await communityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeAttributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        { from: deployerAccount }
      );

      //////////////// set price

      await communityGiftsInstance.setPrice(
        await web3.utils.toWei("5"),
        await web3.utils.toWei("2"),
        {
          from: dataManager,
        }
      );

      ///////---------------- handle admin walllet

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(
        communityGiftsInstance.address,
        transferAmount,
        {
          from: adminWallet,
        }
      );

      await communityGiftsInstance.setGiftRange(
        adminWallet,
        startTree,
        endTree,
        {
          from: dataManager,
        }
      );

      const symbolsArray = [];
      for (let i = 0; i < 10; i++) {
        let rand = parseInt(Math.random() * 10e10);
        while (symbolsArray.includes(rand)) {
          rand = parseInt(Math.random() * 10e10);
        }
        symbolsArray[i] = rand;
        await communityGiftsInstance.reserveSymbol(rand, {
          from: dataManager,
        });
      }
      //////////////// --------------- add giftees
      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        { from: dataManager }
      );
      await communityGiftsInstance.addGiftee(
        userAccount2,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );
      await communityGiftsInstance.addGiftee(
        userAccount3,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );
      ////////////// claim gift

      await communityGiftsInstance.claimGift({ from: userAccount1 });
      await communityGiftsInstance.claimGift({ from: userAccount2 });
      await communityGiftsInstance.claimGift({ from: userAccount3 });

      /////////////////////////// check data

      assert.equal(
        Number(await communityGiftsInstance.currentTree.call()),
        14,
        "current tree is incorrect"
      );
      await communityGiftsInstance
        .setGiftRange(adminWallet, newStartTree1, newEndTree1, {
          from: dataManager,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_SET_RANGE);

      await communityGiftsInstance.freeGiftRange({ from: dataManager });

      assert.equal(
        Number(await communityGiftsInstance.count.call()),
        7,
        "count after free1 is incorrect"
      );

      await communityGiftsInstance.setGiftRange(
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
        Number(await communityGiftsInstance.count.call()),
        5,
        "count after set range2 is incorrect"
      );

      await communityGiftsInstance.addGiftee(
        userAccount4,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance.claimGift({ from: userAccount4 });

      await communityGiftsInstance.freeGiftRange({ from: dataManager });

      assert.equal(
        Number(await communityGiftsInstance.count.call()),
        6,
        "count after free1 is incorrect"
      );

      await daiInstance.setMint(adminWallet, web3.utils.toWei("28"));

      await daiInstance.approve(
        communityGiftsInstance.address,
        web3.utils.toWei("28"),
        {
          from: adminWallet,
        }
      );

      await communityGiftsInstance.setGiftRange(
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
        Number(await communityGiftsInstance.count.call()),
        0,
        "count after free1 is incorrect"
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

      await communityGiftsInstance.setPrice(planterShare, referralShare, {
        from: dataManager,
      });

      ///////////////// ---------------------- fail because caller is not data manager
      await communityGiftsInstance
        .setGiftRange(adminWallet, startTree, endTree, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      ///////////----------------- fail because of invalid range
      await communityGiftsInstance
        .setGiftRange(adminWallet, endTree, startTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.INVALID_RANGE);

      /////////////// fail because of insufficient approval amount

      await daiInstance.setMint(adminWallet, transferAmount);

      await daiInstance.approve(
        communityGiftsInstance.address,
        insufficientApprovalAmount,
        {
          from: adminWallet,
        }
      );

      await communityGiftsInstance
        .setGiftRange(
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

      await daiInstance.approve(
        communityGiftsInstance.address,
        transferAmount,
        {
          from: addminWalletWithInsufficientTransferAmount,
        }
      );

      await communityGiftsInstance
        .setGiftRange(
          addminWalletWithInsufficientTransferAmount,
          startTree,
          endTree,

          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(erc20ErrorMsg.INSUFFICIENT_BALANCE);

      //////////////----------------- fail because of invalid admin account
      await communityGiftsInstance
        .setGiftRange(zeroAddress, startTree, endTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(erc20ErrorMsg.ZERO_ADDRESS);

      //----------------- fail setGiftRange because a tree is not free

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

      await communityGiftsInstance
        .setGiftRange(adminWallet, startTree, endTree, {
          from: dataManager,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.TREES_ARE_NOT_AVAILABLE);
    });
  });

  describe("claimGift", () => {
    beforeEach(async () => {
      const expireDate = await Common.timeInitial(TimeEnumes.days, 30); //one month after now

      //------------------ deploy contracts

      communityGiftsInstance = await deployProxy(
        CommunityGifts,
        [arInstance.address, initialPlanterFund, initialReferralFund],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      treeAttributeInstance = await deployProxy(
        TreeAttribute,
        [arInstance.address],
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

      daiInstance = await Dai.new("DAI", "dai", {
        from: deployerAccount,
      });

      //----------------- set cntract addresses

      await communityGiftsInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeAttributeInstance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      //----------------add role to treejer contract role to treeFactoryInstance address
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //----------------add role to treejer contract role to communityGiftsInstance address
      await Common.addTreejerContractRole(
        arInstance,
        communityGiftsInstance.address,
        deployerAccount
      );

      //----------------add role to treejer contract role to treeAttributeInstance address
      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );
    });

    it("claimGift should be reject", async () => {
      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_CLAIM);

      const startDate = parseInt(new Date().getTime() / 1000) + 60 * 60;
      const expireDate = parseInt(new Date().getTime() / 1000) + 2 * 60 * 60;

      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_CLAIM);

      await communityGiftsInstance.updateGiftee(userAccount1, 10, 500, {
        from: dataManager,
      });

      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_CLAIM);

      await communityGiftsInstance.updateGiftee(userAccount1, 10, expireDate, {
        from: dataManager,
      });

      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.TREES_ARE_NOT_AVAILABLE);

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        communityGiftsInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setGiftRange(deployerAccount, 10, 13, {
        from: dataManager,
      });

      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.SYMBOL_NOT_EXIST);

      await communityGiftsInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      await communityGiftsInstance.claimGift({
        from: userAccount1,
      });
    });

    it("claimGift should be work successfully", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expireDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        communityGiftsInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setGiftRange(deployerAccount, 10, 11, {
        from: dataManager,
      });

      await communityGiftsInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      let eventTx1 = await communityGiftsInstance.claimGift({
        from: userAccount1,
      });

      //check used
      const usedResult = await communityGiftsInstance.used.call(0);
      assert.equal(usedResult, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(1050);
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

      //check GifteeData
      let gifteeData = await communityGiftsInstance.giftees.call(userAccount1);
      assert.equal(Number(gifteeData.status), 0, "status is not correct");
      assert.equal(
        Number(gifteeData.expireDate),
        0,
        "expireDate is not correct"
      );
      assert.equal(Number(gifteeData.startDate), 0, "startDate is not correct");

      //check claimedCount
      assert.equal(
        Number(await communityGiftsInstance.claimedCount()),
        1,
        "status is not correct"
      );

      //check currentTree
      assert.equal(
        Number(await communityGiftsInstance.currentTree()),
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
        Number(initialPlanterFund),
        "planter fund is not ok"
      );

      assert.equal(
        Number(rFundAfter),
        Number(initialReferralFund),
        "referral fund is not ok"
      );

      const pfTotalFundAfter = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(pfTotalFundAfter.planter),
        Number(initialPlanterFund),
        "planter total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.ambassador),
        Number(initialReferralFund),
        "ambassador total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.localDevelopment),
        0,
        "local develop total fund is not ok"
      );

      //////////-------------- check event emitted

      truffleAssert.eventEmitted(eventTx1, "TreeClaimed", (ev) => {
        return Number(ev.treeId) == 10;
      });

      await communityGiftsInstance
        .claimGift({
          from: userAccount1,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.CANT_CLAIM);

      //////---------------------------------test2 (check TreeNotClaimed emit)

      await communityGiftsInstance.addGiftee(
        userAccount2,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance
        .claimGift({
          from: userAccount2,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.TREES_ARE_NOT_AVAILABLE);

      await communityGiftsInstance.setGiftRange(deployerAccount, 11, 13, {
        from: dataManager,
      });

      await communityGiftsInstance.reserveSymbol(1055, {
        from: dataManager,
      });

      await communityGiftsInstance.reserveSymbol(1058, {
        from: dataManager,
      });

      await treeAttributeInstance.setTreeAttributesByAdmin(
        20,
        100012,
        1055,
        20,
        { from: dataManager }
      );

      await treeAttributeInstance.setTreeAttributesByAdmin(
        22,
        2321321,
        1058,
        20,
        { from: dataManager }
      );

      let eventTx2 = await communityGiftsInstance.claimGift({
        from: userAccount2,
      });

      truffleAssert.eventEmitted(eventTx2, "TreeNotClaimed", (ev) => {
        return ev.giftee == userAccount2;
      });
    });

    it("2-claimGift should be work successfully", async () => {
      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expireDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await communityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance.addGiftee(
        userAccount2,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance.addGiftee(
        userAccount3,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      await communityGiftsInstance.addGiftee(
        userAccount4,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        communityGiftsInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await communityGiftsInstance.setGiftRange(deployerAccount, 10, 15, {
        from: dataManager,
      });

      await communityGiftsInstance.reserveSymbol(1050, {
        from: dataManager,
      });

      await communityGiftsInstance.reserveSymbol(1051, {
        from: dataManager,
      });
      await communityGiftsInstance.reserveSymbol(1052, {
        from: dataManager,
      });

      let eventTx1 = await communityGiftsInstance.claimGift({
        from: userAccount1,
      });

      let treeIdGeneratedForUser1;

      for (let i = 0; i < 3; i++) {
        if (await communityGiftsInstance.used.call(i)) {
          treeIdGeneratedForUser1 = i;
          break;
        }
      }

      //check used
      const usedResult = await communityGiftsInstance.used.call(
        treeIdGeneratedForUser1
      );
      assert.equal(usedResult, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol = await treeAttributeInstance.uniqueSymbol.call(
        await communityGiftsInstance.symbols.call(treeIdGeneratedForUser1)
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

      //check GifteeData
      let gifteeData = await communityGiftsInstance.giftees.call(userAccount1);
      assert.equal(Number(gifteeData.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await communityGiftsInstance.claimedCount()),
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

      truffleAssert.eventEmitted(eventTx1, "TreeClaimed", (ev) => {
        return Number(ev.treeId) == 10;
      });

      //
      //
      //

      ////---------------------------------- claim user2

      let eventTx2 = await communityGiftsInstance.claimGift({
        from: userAccount2,
      });

      let treeIdGeneratedForUser2;

      for (let i = 0; i < 3; i++) {
        if (
          (await communityGiftsInstance.used.call(i)) &&
          i != treeIdGeneratedForUser2
        ) {
          treeIdGeneratedForUser2 = i;
          break;
        }
      }

      //check used
      const usedResult2 = await communityGiftsInstance.used.call(
        treeIdGeneratedForUser2
      );
      assert.equal(usedResult2, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol2 = await treeAttributeInstance.uniqueSymbol.call(
        await communityGiftsInstance.symbols.call(treeIdGeneratedForUser2)
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

      //check GifteeData
      let gifteeData2 = await communityGiftsInstance.giftees.call(userAccount2);
      assert.equal(Number(gifteeData2.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await communityGiftsInstance.claimedCount()),
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

      truffleAssert.eventEmitted(eventTx2, "TreeClaimed", (ev) => {
        return Number(ev.treeId) == 11;
      });

      ////---------------------------------- claim user2

      let eventTx3 = await communityGiftsInstance.claimGift({
        from: userAccount3,
      });

      let treeIdGeneratedForUser3;

      for (let i = 0; i < 3; i++) {
        if (
          (await communityGiftsInstance.used.call(i)) &&
          i != treeIdGeneratedForUser1 &&
          i != treeIdGeneratedForUser2
        ) {
          treeIdGeneratedForUser3 = i;
          break;
        }
      }

      //check used
      const usedResult3 = await communityGiftsInstance.used.call(
        treeIdGeneratedForUser3
      );
      assert.equal(usedResult3, true, "used result is incorrect");

      //check uniqueSymbol
      let uniqueSymbol3 = await treeAttributeInstance.uniqueSymbol.call(
        await communityGiftsInstance.symbols.call(treeIdGeneratedForUser3)
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

      //check GifteeData
      let gifteeData3 = await communityGiftsInstance.giftees.call(userAccount3);
      assert.equal(Number(gifteeData3.status), 0, "status is not correct");

      //check claimedCount
      assert.equal(
        Number(await communityGiftsInstance.claimedCount()),
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

      truffleAssert.eventEmitted(eventTx3, "TreeClaimed", (ev) => {
        return Number(ev.treeId) == 12;
      });

      ///----------check planterFundContract

      const pFundAfter =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(12);

      const rFundAfter =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(12);

      assert.equal(
        Number(pFundAfter),
        Number(initialPlanterFund),
        "planter fund is not ok"
      );

      assert.equal(
        Number(rFundAfter),
        Number(initialReferralFund),
        "referral fund is not ok"
      );

      const pfTotalFundAfter = await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(pfTotalFundAfter.planter),
        Number(initialPlanterFund) * 3,
        "planter total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.ambassador),
        Number(initialReferralFund) * 3,
        "ambassador total fund is not ok"
      );

      assert.equal(
        Number(pfTotalFundAfter.localDevelopment),
        0,
        "local develop total fund is not ok"
      );

      ////------------------gift 4
      await communityGiftsInstance
        .claimGift({
          from: userAccount4,
        })
        .should.be.rejectedWith(CommunityGiftErrorMsg.SYMBOL_NOT_EXIST);
    });

    it("claimGift in TestCommunityGifts", async () => {
      /////////////  -------------- deploy contracts

      let testCommunityGiftsInstance = await TestCommunityGifts.new({
        from: deployerAccount,
      });

      await testCommunityGiftsInstance.initialize(
        arInstance.address,
        initialPlanterFund,
        initialReferralFund,
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
        testCommunityGiftsInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeAttributeInstance.address,
        deployerAccount
      );

      //////////////// ----------------- set addresses
      await testCommunityGiftsInstance.setTreeAttributesAddress(
        treeAttributeInstance.address,
        { from: deployerAccount }
      );

      await testCommunityGiftsInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await testCommunityGiftsInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await testCommunityGiftsInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////------------------------------------------------------------------------

      const startDate = parseInt(new Date().getTime() / 1000) - 60 * 60;
      const expireDate = parseInt(new Date().getTime() / 1000) + 10 * 60 * 60;

      await testCommunityGiftsInstance.addGiftee(
        userAccount1,
        startDate,
        expireDate,
        {
          from: dataManager,
        }
      );

      ///------------------------------------------- set mint ----------------------------------------------------------
      await daiInstance.setMint(deployerAccount, web3.utils.toWei("1000"));

      await daiInstance.approve(
        testCommunityGiftsInstance.address,
        web3.utils.toWei("1000"),
        {
          from: deployerAccount,
        }
      );

      await testCommunityGiftsInstance.setGiftRange(deployerAccount, 10, 15, {
        from: dataManager,
      });

      await testCommunityGiftsInstance.reserveSymbol(1050, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1051, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1052, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1053, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1054, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1055, {
        from: dataManager,
      });
      await testCommunityGiftsInstance.reserveSymbol(1056, {
        from: dataManager,
      });

      await testCommunityGiftsInstance.testClaimGiftFor(17, {
        from: userAccount1,
      });

      //check used
      const usedResult = await testCommunityGiftsInstance.used.call(3);
      assert.equal(usedResult, true, "used result is incorrect");

      await testCommunityGiftsInstance.testClaimGiftFor(15, {
        from: userAccount1,
      });

      //check used
      const usedResult2 = await testCommunityGiftsInstance.used.call(4);
      assert.equal(usedResult2, true, "used result is incorrect");

      await treeAttributeInstance.setTreeAttributesByAdmin(
        22,
        2321321,
        1050,
        20,
        { from: dataManager }
      );

      let tx = await testCommunityGiftsInstance.testClaimGiftFor(20, {
        from: userAccount1,
      });

      // check used
      const usedResult3 = await testCommunityGiftsInstance.used.call(1);
      assert.equal(usedResult3, true, "used result is incorrect");
    });
  });
});
