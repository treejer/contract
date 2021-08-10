const AccessRestriction = artifacts.require("AccessRestriction");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const Tree = artifacts.require("Tree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const Units = require("ethereumjs-units");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

const {
  CommonErrorMsg,
  TimeEnumes,
  CommunityGiftErrorMsg,
  TreeAttributeErrorMsg,
} = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("CommunityGifts", (accounts) => {
  let communityGiftsInstance;
  let arInstance;
  let treeAttributeInstance;
  let treeFactoryInstance;

  let treeTokenInstance;
  let planterFundsInstnce;
  let financialModelInstance;

  const ownerAccount = accounts[0];
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

  beforeEach(async () => {
    const expireDate = await Common.timeInitial(TimeEnumes.days, 30); //one month after now

    //------------------ deploy contracts

    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    communityGiftsInstance = await deployProxy(
      CommunityGifts,
      [arInstance.address, expireDate],
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

    planterFundsInstnce = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    financialModelInstance = await deployProxy(
      FinancialModel,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
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

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    //----------------add role to treeFactory
    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //---------------- add role to communityGist
    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => {});
  // //////////////////------------------------------------ deploy successfully ----------------------------------------//

  it("deploys successfully", async () => {
    const address = communityGiftsInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  /////////////////---------------------------------set tree attribute address--------------------------------------------------------
  it("set tree attribute address", async () => {
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
  });
  /////////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set tree factory address", async () => {
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
  });
  /////////////////---------------------------------set planter fund address--------------------------------------------------------
  it("set planter fund address", async () => {
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
  /////////////////---------------------------------set gift range--------------------------------------------------------

  it("set gift range successfully and check data", async () => {
    //------------------initial data

    const startTree = 11;
    const endTree = 101;

    await communityGiftsInstance.setGiftsRange(startTree, endTree, {
      from: deployerAccount,
    });

    const treeId11 = await treeFactoryInstance.treeData.call(11);
    const treeId21 = await treeFactoryInstance.treeData.call(21);
    const treeId41 = await treeFactoryInstance.treeData.call(41);
    const treeId51 = await treeFactoryInstance.treeData.call(51);
    const treeId100 = await treeFactoryInstance.treeData.call(100);

    assert.equal(
      Number(treeId11.provideStatus),
      5,
      "provideStatus is not correct"
    );
    assert.equal(
      Number(treeId21.provideStatus),
      5,
      "provideStatus is not correct"
    );
    assert.equal(
      Number(treeId41.provideStatus),
      5,
      "provideStatus is not correct"
    );
    assert.equal(
      Number(treeId51.provideStatus),
      5,
      "provideStatus is not correct"
    );
    assert.equal(
      Number(treeId100.provideStatus),
      5,
      "provideStatus is not correct"
    );
  });

  it("fail to set gift range", async () => {
    //------------------initial data

    const startTree = 11;
    const endTree = 101;
    const treeIdInAuction = 16;
    const startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    const endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await communityGiftsInstance
      .setGiftsRange(startTree, endTree, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    ////------------------ deploy tree auction

    const treeAuctionInstance = await deployProxy(
      TreeAuction,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    //----------------- add tree and create auction for it

    await treeFactoryInstance.addTree(treeIdInAuction, "some ipfs hash", {
      from: deployerAccount,
    });

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 150, 0, {
      from: deployerAccount,
    });

    await treeAuctionInstance.createAuction(
      treeIdInAuction,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    //----------------- fail setGiftsRange because a tree is in auction

    await communityGiftsInstance
      .setGiftsRange(startTree, endTree, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.NOT_AVAILABLE_TREE_EXIST);
  });

  /////////////////---------------------------------set expire date--------------------------------------------------------
  it("should set expire date successfully and check data to be ok", async () => {
    const expireDate = await Common.timeInitial(TimeEnumes.days, 10);

    await communityGiftsInstance.setExpireDate(Number(expireDate), {
      from: deployerAccount,
    });

    let settedExpireDate = await communityGiftsInstance.expireDate.call();

    assert.equal(
      Number(settedExpireDate),
      Number(expireDate),
      "expire date is not correct"
    );
  });

  it("should fail to set expire date", async () => {
    await communityGiftsInstance
      .setExpireDate(100, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  /////////////////-------------------------------------- set price ------------------------------------------------

  it("should set price successfully and check data to be ok", async () => {
    const planterFund = Units.convert("0.5", "eth", "wei");
    const referralFund = Units.convert("0.1", "eth", "wei");

    await communityGiftsInstance.setPrice(planterFund, referralFund, {
      from: deployerAccount,
    });

    const settedPlanterFund = await communityGiftsInstance.planterFund.call();
    const settedReferralFund = await communityGiftsInstance.referralFund.call();

    assert.equal(
      Number(settedPlanterFund),
      planterFund,
      "planter fund is not correct"
    );

    assert.equal(
      Number(settedReferralFund),
      referralFund,
      "referral fund is not correct"
    );
  });

  it("should fail to set price", async () => {
    await communityGiftsInstance
      .setPrice(100, 200, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  ////////////////////// -------------------------------- update giftees ----------------------------------------

  it("should update giftees succesfully and check data to be ok", async () => {
    const giftee1 = userAccount1;
    const giftee2 = userAccount2;
    const symbol1 = 1234554321;
    const symbol2 = 1357997531;

    const giftCountBefore = await communityGiftsInstance.giftCount.call();

    //////////---------------------- give symbol1 to giftee1

    const eventTx1 = await communityGiftsInstance.updateGiftees(
      giftee1,
      symbol1,
      {
        from: deployerAccount,
      }
    );

    //////////-------------- check event emitted

    truffleAssert.eventEmitted(eventTx1, "GifteeUpdated", (ev) => {
      return ev.giftee == giftee1;
    });

    //////////---------------- check communityGift data

    const communityGift1 = await communityGiftsInstance.communityGifts.call(
      giftee1
    );

    assert.equal(
      Number(communityGift1.symbol),
      symbol1,
      "symbol is not correct"
    );

    assert.equal(communityGift1.exist, true, "exist is not correct");

    assert.equal(communityGift1.claimed, false, "claimed is not correct");

    //////////-------------- check gift count

    const giftCountAfter1 = await communityGiftsInstance.giftCount.call();

    assert.equal(
      Number(giftCountBefore),
      0,
      "gift count before update giftee is not correct"
    );

    assert.equal(
      Number(giftCountAfter1),
      1,
      "gift count after update giftee is not correct"
    );

    ///////////---------------- check attribute code

    const generatedAttr1Symbol1 =
      await treeAttributeInstance.generatedAttributes.call(symbol1);

    const reservedAttr1Symbol1 =
      await treeAttributeInstance.reservedAttributes.call(symbol1);

    assert.equal(
      Number(generatedAttr1Symbol1),
      1,
      "generated code is not correct"
    );

    assert.equal(
      Number(reservedAttr1Symbol1),
      1,
      "reserved code is not correct"
    );

    ///////////---------------------- give symbol2 to giftee1

    const eventTx2 = await communityGiftsInstance.updateGiftees(
      giftee1,
      symbol2,
      {
        from: deployerAccount,
      }
    );

    //-------------- check event emitted

    truffleAssert.eventEmitted(eventTx2, "GifteeUpdated", (ev) => {
      return ev.giftee == giftee1;
    });

    //////////---------------- check communityGift data

    const communityGift2 = await communityGiftsInstance.communityGifts.call(
      giftee1
    );

    assert.equal(
      Number(communityGift2.symbol),
      symbol2,
      "symbol is not correct"
    );

    assert.equal(communityGift2.exist, true, "exist is not correct");

    assert.equal(communityGift2.claimed, false, "claimed is not correct");

    //////////-------------- check gift count

    const giftCountAfter2 = await communityGiftsInstance.giftCount.call();

    assert.equal(
      Number(giftCountAfter2),
      1,
      "gift count after update giftee is not correct"
    );

    ///////////---------------- check attribute code for symbol 1 that must be free

    const generatedAttr2Symbol1 =
      await treeAttributeInstance.generatedAttributes.call(symbol1);

    const reservedAttr2Symbol1 =
      await treeAttributeInstance.reservedAttributes.call(symbol1);

    assert.equal(
      Number(generatedAttr2Symbol1),
      0,
      "generated code is not correct"
    );

    assert.equal(
      Number(reservedAttr2Symbol1),
      0,
      "reserved code is not correct"
    );

    ///////////---------------- check attribute code for symbol 2 that must be reserved

    const generatedAttr1Symbol2 =
      await treeAttributeInstance.generatedAttributes.call(symbol2);

    const reservedAttr1Symbol2 =
      await treeAttributeInstance.reservedAttributes.call(symbol2);

    assert.equal(
      Number(generatedAttr1Symbol2),
      1,
      "generated code is not correct"
    );

    assert.equal(
      Number(reservedAttr1Symbol2),
      1,
      "reserved code is not correct"
    );

    ///////------------------ give symbol1 to giftee2

    const eventTx3 = await communityGiftsInstance.updateGiftees(
      giftee2,
      symbol1,
      {
        from: deployerAccount,
      }
    );

    //-------------- check event emitted

    truffleAssert.eventEmitted(eventTx3, "GifteeUpdated", (ev) => {
      return ev.giftee == giftee2;
    });

    //////////---------------- check communityGift data

    const communityGift3 = await communityGiftsInstance.communityGifts.call(
      giftee2
    );

    assert.equal(
      Number(communityGift3.symbol),
      symbol1,
      "symbol is not correct"
    );

    assert.equal(communityGift3.exist, true, "exist is not correct");

    assert.equal(communityGift3.claimed, false, "claimed is not correct");

    //////////-------------- check gift count

    const giftCountAfter3 = await communityGiftsInstance.giftCount.call();

    assert.equal(
      Number(giftCountAfter3),
      2,
      "gift count after update giftee is not correct"
    );

    ///////////---------------- check attribute code for symbol 1 that must be reserved

    const generatedAttr3Symbol1 =
      await treeAttributeInstance.generatedAttributes.call(symbol1);

    const reservedAttr3Symbol1 =
      await treeAttributeInstance.reservedAttributes.call(symbol1);

    assert.equal(
      Number(generatedAttr3Symbol1),
      1,
      "generated code is not correct"
    );

    assert.equal(
      Number(reservedAttr3Symbol1),
      1,
      "reserved code is not correct"
    );
  });

  it("should fail to update giftees", async () => {
    const giftee1 = userAccount1;
    const giftee2 = userAccount2;
    const symbol1 = 1234554321;
    const symbol2 = 1357997531;
    const expireDate = await Common.timeInitial(TimeEnumes.days, 10);

    //////////////////---------------- set expire date

    await communityGiftsInstance.setExpireDate(Number(expireDate), {
      from: deployerAccount,
    });

    /////// ---------------should fail admin access
    await communityGiftsInstance
      .updateGiftees(giftee1, symbol1, { from: userAccount3 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    ///////////////// ------------ should fail becuse giftee claimed before
    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    await communityGiftsInstance.claimTree({
      from: giftee1,
    });

    await communityGiftsInstance
      .updateGiftees(giftee1, symbol2, { from: deployerAccount })
      .should.be.rejectedWith(CommunityGiftErrorMsg.CLAIMED_BEFORE);

    /////////------------------------- should fail because of cuplicate symbol

    await communityGiftsInstance
      .updateGiftees(giftee2, symbol1, { from: deployerAccount })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });

  it("should fail because gift count is not less than 90", async () => {
    const symbol = 123456789;

    for (i = 0; i < 90; i++) {
      let address = await Common.getNewAccountPublicKey();
      await communityGiftsInstance.updateGiftees(address, i, {
        from: deployerAccount,
      });
    }

    await communityGiftsInstance
      .updateGiftees(userAccount1, symbol, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.MAX_GIFT_AMOUNT_REACHED);
  });

  ////////////////////// -------------------------------- claim tree ----------------------------------------

  it("1-should claimTree succesfully and check data to be ok", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    let claimedCountBefore = await communityGiftsInstance.claimedCount();

    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    const treeId = 11; //id of tree to be claimed

    //////// ----------------- check plnter fund before

    const pFundBefore = await planterFundsInstnce.planterFunds.call(treeId);

    const rFundBefore = await planterFundsInstnce.referralFunds.call(treeId);

    assert.equal(Number(pFundBefore), 0, "planter fund is not ok");

    assert.equal(Number(rFundBefore), 0, "referral fund is not ok");

    const pfTotalFundBefore = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundBefore.planterFund),
      0,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.referralFund),
      0,
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------claim tree by giftee1

    let eventTx1 = await communityGiftsInstance.claimTree({
      from: giftee1,
    });

    let claimedCountAfter = await communityGiftsInstance.claimedCount();

    let giftee = await communityGiftsInstance.communityGifts(giftee1);

    assert.equal(Number(giftee.symbol), symbol1, "1.symbol not true updated");

    assert.equal(giftee.claimed, true, "1.claimed not true updated");

    assert.equal(
      Number(claimedCountAfter),
      Number(claimedCountBefore) + 1,
      "1.claimedCount not true updated"
    );

    //////////--------------check tree owner
    let addressGetToken = await treeTokenInstance.ownerOf(treeId);

    assert.equal(addressGetToken, giftee1, "1.mint not true");

    //////////--------------check provide status

    let genTree = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      Number(genTree.provideStatus),
      0,
      "provideStatus is not correct"
    );

    //////////--------------check treeAttribute
    let treeAttribute = await treeAttributeInstance.treeAttributes(treeId);

    assert.equal(treeAttribute.exists, 1, "treeAttribute is not true update");

    //////////////// ---------------- check planter fund values after claim

    const pFundAfter = await planterFundsInstnce.planterFunds.call(treeId);

    const rFundAfter = await planterFundsInstnce.referralFunds.call(treeId);

    assert.equal(
      Number(pFundAfter),
      Number(planterShareOfTree),
      "planter fund is not ok"
    );

    assert.equal(
      Number(rFundAfter),
      Number(referralShareOfTree),
      "referral fund is not ok"
    );

    const pfTotalFundAfter = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundAfter.planterFund),
      Number(planterShareOfTree),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfter.referralFund),
      Number(referralShareOfTree),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfter.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////-------------- check event emitted

    truffleAssert.eventEmitted(eventTx1, "TreeClaimed", (ev) => {
      return Number(ev.treeId) == treeId;
    });
  });
  it("2-should claimTree succesfully and check data to be ok", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    const giftee2 = userAccount2;
    const symbol2 = 1234554322;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee2, symbol2, {
      from: deployerAccount,
    });

    let claimedCountBefore = await communityGiftsInstance.claimedCount();

    const treeId1 = 11; // first tree to be claimed
    const treeId2 = 12; //2nd tree to be claimed

    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////// ----------------- check plnter fund before

    const pFundBeforeTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundBeforeTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundBeforeTree1),
      0,
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundBeforeTree1),
      0,
      "referral fund is not ok for tree1"
    );

    const pFundBeforeTree2 = await planterFundsInstnce.planterFunds.call(
      treeId2
    );

    const rFundBeforeTree2 = await planterFundsInstnce.referralFunds.call(
      treeId2
    );

    assert.equal(
      Number(pFundBeforeTree2),
      0,
      "planter fund is not ok for tree2"
    );

    assert.equal(
      Number(rFundBeforeTree2),
      0,
      "referral fund is not ok for tree 2"
    );

    const pfTotalFundBefore = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundBefore.planterFund),
      0,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.referralFund),
      0,
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------claim tree by giftee1

    let eventTx1 = await communityGiftsInstance.claimTree({
      from: giftee1,
    });

    //////// ----------------- check plnter fund after claim

    const pFundAfterTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundAfterTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundAfterTree1),
      Number(planterShareOfTree),
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundAfterTree1),
      Number(referralShareOfTree),
      "referral fund is not ok for tree1"
    );

    const pfTotalFundAfterTree1 = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundAfterTree1.planterFund),
      Number(planterShareOfTree),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfterTree1.referralFund),
      Number(referralShareOfTree),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfterTree1.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------claim tree by giftee2
    let eventTx2 = await communityGiftsInstance.claimTree({
      from: giftee2,
    });

    let claimedCountAfter = await communityGiftsInstance.claimedCount();

    //////////-------------- check claimed tree data
    let giftee1Data = await communityGiftsInstance.communityGifts(giftee1);

    let giftee2Data = await communityGiftsInstance.communityGifts(giftee2);

    assert.equal(
      Number(giftee1Data.symbol),
      symbol1,
      "1.symbol not true updated"
    );

    assert.equal(giftee1Data.claimed, true, "1.claimed not true updated");

    assert.equal(
      Number(giftee2Data.symbol),
      symbol2,
      "2.symbol not true updated"
    );

    assert.equal(giftee2Data.claimed, true, "2.claimed not true updated");

    assert.equal(
      Number(claimedCountAfter),
      Number(claimedCountBefore) + 2,
      "claimedCount not true updated"
    );

    //////////--------------check tree owner
    let addressGetToken = await treeTokenInstance.ownerOf(11);

    assert.equal(addressGetToken, giftee1, "1.mint not true");

    let addressGetToken2 = await treeTokenInstance.ownerOf(12);

    assert.equal(addressGetToken2, giftee2, "2.mint not true");

    //////////--------------check provide status

    let genTree = await treeFactoryInstance.treeData.call(11);

    assert.equal(
      Number(genTree.provideStatus),
      0,
      "provideStatus is not correct"
    );

    let genTree2 = await treeFactoryInstance.treeData.call(12);

    assert.equal(
      Number(genTree2.provideStatus),
      0,
      "provideStatus is not correct"
    );

    //////////--------------check treeAttribute
    let treeAttribute = await treeAttributeInstance.treeAttributes(11);
    assert.equal(treeAttribute.exists, 1, "treeAttribute is not true update");

    let treeAttribute2 = await treeAttributeInstance.treeAttributes(12);
    assert.equal(treeAttribute2.exists, 1, "treeAttribute is not true update");

    //////// ----------------- check plnter fund after final claim

    const pFundFinalTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundFinalTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundFinalTree1),
      Number(planterShareOfTree),
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundFinalTree1),
      Number(referralShareOfTree),
      "referral fund is not ok for tree1"
    );

    const pFundFinalTree2 = await planterFundsInstnce.planterFunds.call(
      treeId2
    );

    const rFundFinalTree2 = await planterFundsInstnce.referralFunds.call(
      treeId2
    );

    assert.equal(
      Number(pFundFinalTree2),
      Number(planterShareOfTree),
      "planter fund is not ok for tree 2"
    );

    assert.equal(
      Number(rFundFinalTree2),
      Number(referralShareOfTree),
      "referral fund is not ok for tree2"
    );

    const pfTotalFundFinal = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundFinal.planterFund),
      Math.mul(Number(planterShareOfTree), 2),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundFinal.referralFund),
      Math.mul(Number(referralShareOfTree), 2),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundFinal.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////-------------- check event emitted

    truffleAssert.eventEmitted(eventTx1, "TreeClaimed", (ev) => {
      return Number(ev.treeId) == treeId1;
    });

    truffleAssert.eventEmitted(eventTx2, "TreeClaimed", (ev) => {
      return Number(ev.treeId) == treeId2;
    });
  });

  it("Should claimTree reject(expireDate reach)", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    ////////////// ----------- prepare for claim
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////////--------------claim with expire date error

    await communityGiftsInstance
      .claimTree({
        from: giftee1,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.EXPIREDATE_REACHED);
  });

  it("Should claimTree reject(User not exist)", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    ////////////// ----------- prepare for claim
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////////--------------claim with error
    await communityGiftsInstance
      .claimTree({
        from: userAccount3,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.USER_NOT_EXIST);
  });

  it("Should claimTree reject(Claimed before)", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    ////////////// ----------- prepare for claim
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////////--------------claim tree by giftee1 for first time and it's not problem

    await communityGiftsInstance.claimTree({
      from: giftee1,
    });

    //////////--------------claim with error
    await communityGiftsInstance
      .claimTree({
        from: giftee1,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.CLAIMED_BEFORE);
  });

  ////////////////////// -------------------------------- transfer tree ----------------------------------------

  it("1-should transferTree succesfully and check data to be ok", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    let claimedCountBefore = await communityGiftsInstance.claimedCount();

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    ////////////// ----------- prepare for transfer
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );
    const treeId = 11; //tree to be claimed

    ////////////// check planter fund values before claim
    const pFundBefore = await planterFundsInstnce.planterFunds.call(treeId);

    const rFundBefore = await planterFundsInstnce.referralFunds.call(treeId);

    assert.equal(Number(pFundBefore), 0, "planter fund is not ok");

    assert.equal(Number(rFundBefore), 0, "referral fund is not ok");

    const pfTotalFundBefore = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundBefore.planterFund),
      0,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.referralFund),
      0,
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------call transferTree by admin(owner=>userAccount3)

    let eventTx1 = await communityGiftsInstance.transferTree(
      userAccount3,
      1234554321,
      {
        from: deployerAccount,
      }
    );

    let claimedCountAfter = await communityGiftsInstance.claimedCount();

    assert.equal(
      Number(claimedCountAfter),
      Number(claimedCountBefore) + 1,
      "1.claimedCount not true updated"
    );

    //////////--------------check tree owner
    let addressGetToken = await treeTokenInstance.ownerOf(treeId);

    assert.equal(addressGetToken, userAccount3, "1.mint not true");

    //////////--------------check provide status

    let genTree = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      Number(genTree.provideStatus),
      0,
      "provideStatus is not correct"
    );

    //////////--------------check treeAttribute
    let treeAttribute = await treeAttributeInstance.treeAttributes(treeId);
    assert.equal(treeAttribute.exists, 1, "treeAttribute is not true update");

    ////////////// check planter fund values after transfer
    const pFundAfter = await planterFundsInstnce.planterFunds.call(treeId);

    const rFundAfter = await planterFundsInstnce.referralFunds.call(treeId);

    assert.equal(
      Number(pFundAfter),
      Number(planterShareOfTree),
      "planter fund is not ok"
    );

    assert.equal(
      Number(rFundAfter),
      Number(referralShareOfTree),
      "referral fund is not ok"
    );

    const pfTotalFundAfter = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundAfter.planterFund),
      Number(planterShareOfTree),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfter.referralFund),
      Number(referralShareOfTree),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfter.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////-------------- check event emitted

    truffleAssert.eventEmitted(eventTx1, "TreeTransfered", (ev) => {
      return Number(ev.treeId) == 11;
    });
  });

  it("2-should transferTree succesfully and check data to be ok", async () => {
    const giftee1 = userAccount1;
    const giftee2 = userAccount2;
    const symbol1 = 1234554321;
    const symbol2 = 1234567890;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 15, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee2, symbol2, {
      from: deployerAccount,
    });

    let claimedCountBefore = await communityGiftsInstance.claimedCount();

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    ////////////// ----------- prepare for transfer
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    const treeId1 = 11;
    const treeId2 = 12;

    //////// ----------------- check plnter fund before transfer

    const pFundBeforeTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundBeforeTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundBeforeTree1),
      0,
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundBeforeTree1),
      0,
      "referral fund is not ok for tree1"
    );

    const pFundBeforeTree2 = await planterFundsInstnce.planterFunds.call(
      treeId2
    );

    const rFundBeforeTree2 = await planterFundsInstnce.referralFunds.call(
      treeId2
    );

    assert.equal(
      Number(pFundBeforeTree2),
      0,
      "planter fund is not ok for tree2"
    );

    assert.equal(
      Number(rFundBeforeTree2),
      0,
      "referral fund is not ok for tree 2"
    );

    const pfTotalFundBefore = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundBefore.planterFund),
      0,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.referralFund),
      0,
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------call transferTree by admin(owner=>userAccount3)

    const eventTx1 = await communityGiftsInstance.transferTree(
      userAccount3,
      symbol1,
      {
        from: deployerAccount,
      }
    );

    const claimedCountAfter1 = await communityGiftsInstance.claimedCount();

    //////// ----------------- check plnter fund after transfer11

    const pFundAfterTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundAfterTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundAfterTree1),
      Number(planterShareOfTree),
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundAfterTree1),
      Number(referralShareOfTree),
      "referral fund is not ok for tree1"
    );

    const pfTotalFundAfterTree1 = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundAfterTree1.planterFund),
      Number(planterShareOfTree),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfterTree1.referralFund),
      Number(referralShareOfTree),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundAfterTree1.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////--------------call transferTree by admin(owner=>userAccount4)

    const eventTx2 = await communityGiftsInstance.transferTree(
      userAccount4,
      symbol2,
      {
        from: deployerAccount,
      }
    );
    const claimedCountAfter2 = await communityGiftsInstance.claimedCount();

    assert.equal(
      Number(claimedCountAfter1),
      Number(claimedCountBefore) + 1,
      "1.claimedCount not true updated"
    );

    assert.equal(
      Number(claimedCountAfter2),
      Number(claimedCountBefore) + 2,
      "1.claimedCount not true updated"
    );

    //////////--------------check tree owner
    let addressGetToken1 = await treeTokenInstance.ownerOf(treeId1);
    let addressGetToken2 = await treeTokenInstance.ownerOf(treeId2);

    assert.equal(addressGetToken1, userAccount3, "1.mint not true");

    assert.equal(addressGetToken2, userAccount4, "1.mint not true");

    //////////--------------check provide status

    let genTree1 = await treeFactoryInstance.treeData.call(treeId1);
    let genTree2 = await treeFactoryInstance.treeData.call(treeId2);

    assert.equal(
      Number(genTree1.provideStatus),
      0,
      "provideStatus is not correct"
    );

    assert.equal(
      Number(genTree2.provideStatus),
      0,
      "provideStatus is not correct"
    );

    //////////--------------check treeAttribute
    let treeAttribute1 = await treeAttributeInstance.treeAttributes(treeId1);
    let treeAttribute2 = await treeAttributeInstance.treeAttributes(treeId2);

    assert.equal(treeAttribute1.exists, 1, "treeAttribute is not true update");
    assert.equal(treeAttribute2.exists, 1, "treeAttribute is not true update");

    //////// ----------------- check plnter fund after both transfer

    const pFundFinalTree1 = await planterFundsInstnce.planterFunds.call(
      treeId1
    );

    const rFundFinalTree1 = await planterFundsInstnce.referralFunds.call(
      treeId1
    );

    assert.equal(
      Number(pFundFinalTree1),
      Number(planterShareOfTree),
      "planter fund is not ok for tree1"
    );

    assert.equal(
      Number(rFundFinalTree1),
      Number(referralShareOfTree),
      "referral fund is not ok for tree1"
    );

    const pFundFinalTree2 = await planterFundsInstnce.planterFunds.call(
      treeId2
    );

    const rFundFinalTree2 = await planterFundsInstnce.referralFunds.call(
      treeId2
    );

    assert.equal(
      Number(pFundFinalTree2),
      Number(planterShareOfTree),
      "planter fund is not ok for tree2"
    );

    assert.equal(
      Number(rFundFinalTree2),
      Number(referralShareOfTree),
      "referral fund is not ok for tree 2"
    );

    const pfTotalFundFinal = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(pfTotalFundFinal.planterFund),
      Math.mul(Number(planterShareOfTree), 2),
      "planter total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundFinal.referralFund),
      Math.mul(Number(referralShareOfTree), 2),
      "referral total fund is not ok"
    );

    assert.equal(
      Number(pfTotalFundBefore.localDevelop),
      0,
      "local develop total fund is not ok"
    );

    //////////-------------- check event emitted

    truffleAssert.eventEmitted(eventTx1, "TreeTransfered", (ev) => {
      return Number(ev.treeId) == treeId1;
    });

    truffleAssert.eventEmitted(eventTx2, "TreeTransfered", (ev) => {
      return Number(ev.treeId) == treeId2;
    });
  });

  it("Should transferTree reject (only admin call)", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    ////////////// ----------- prepare for transfer
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////////--------------call transferTree by user
    await communityGiftsInstance
      .transferTree(userAccount3, 1234554321, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("Should transferTree reject (expireDate not reach)", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    ////////////// ----------- prepare for transfer
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    //////////--------------expire time does not reach
    await communityGiftsInstance
      .transferTree(userAccount3, 1234554321, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.EXPIREDATE_NOT_REACHED);
  });

  it("Should transferTree reject (symbol not reserved)", async () => {
    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    //////////--------------call transferTree by user
    await communityGiftsInstance
      .transferTree(userAccount3, 1234554321, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.SYMBOL_NOT_RESERVED);
  });

  it("Should transferTree reject", async () => {
    const giftee1 = userAccount1;
    const symbol1 = 1234554321;

    //////////--------------add giftee by admin

    await communityGiftsInstance.setGiftsRange(11, 13, {
      from: deployerAccount,
    });

    await communityGiftsInstance.updateGiftees(giftee1, symbol1, {
      from: deployerAccount,
    });

    ////////////// ----------- prepare for transfer
    const planterShareOfTree = web3.utils.toWei("4.9");
    const referralShareOfTree = web3.utils.toWei("2.1");

    await communityGiftsInstance.setPrice(
      planterShareOfTree,
      referralShareOfTree,
      { from: deployerAccount }
    );

    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );

    await communityGiftsInstance.claimTree({
      from: giftee1,
    });

    //////////--------------time travel
    await Common.travelTime(TimeEnumes.days, 31);

    //////////--------------call transferTree by admin(owner=>userAccount3)

    await communityGiftsInstance
      .transferTree(userAccount3, 1234554321, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommunityGiftErrorMsg.SYMBOL_NOT_RESERVED);
  });
});
