const AccessRestriction = artifacts.require("AccessRestriction");
const CommunityGifts = artifacts.require("CommunityGifts.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const Tree = artifacts.require("Tree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const Units = require("ethereumjs-units");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  CommonErrorMsg,
  TimeEnumes,
  CommunityGiftErrorMsg,
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
  let treasuryInstance;

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
    const expireDate =
      parseInt(new Date().getTime() / 1000) + 30 * 24 * 60 * 60; //one month after now

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

    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    //----------------- set cntrac addresses

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

    await communityGiftsInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    //---------------- add role to communityGist
    await Common.addCommunityGiftRole(
      arInstance,
      communityGiftsInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => {});
  //////////////////------------------------------------ deploy successfully ----------------------------------------//

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
  /////////////////---------------------------------set treasury address--------------------------------------------------------
  it("set treasury address", async () => {
    await communityGiftsInstance
      .setTreasuryAddress(treasuryInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await communityGiftsInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      treasuryInstance.address,
      await communityGiftsInstance.treasury.call(),
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
  //TODO: ask if we must add tree and then gift it?

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

    const treeTokenInstance = await deployProxy(
      Tree,
      [arInstance.address, ""],
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

    await treeAuctionInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treasuryInstance.addFundDistributionModel(
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

    await treasuryInstance.assignTreeFundDistributionModel(0, 150, 0, {
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
});
