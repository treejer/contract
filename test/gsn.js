// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const RelayRecipient = artifacts.require("RelayRecipient");
const TestRelayRecipient = artifacts.require("TestRelayRecipient");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Planter = artifacts.require("Planter");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const { CommonErrorMsg, GsnErrorMsg } = require("./enumes");

const Common = require("./common");

//test
const TestWhitelistPaymaster = artifacts.require("TestWhitelistPaymaster");

contract("Gsn", (accounts) => {
  const deployerAccount = accounts[0];
  const dataManager = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  let arInstance;
  let relayRecipientInstance;
  let whitelistPaymasterInstance;

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  beforeEach(async () => {
    /////////////---------------------- deploy contracts ------------------- //////////////
    relayRecipientInstance = await RelayRecipient.new({
      from: deployerAccount,
    });

    await WhitelistPaymaster.new(zeroAddress, { from: deployerAccount }).should
      .be.rejected;

    whitelistPaymasterInstance = await WhitelistPaymaster.new(
      arInstance.address,
      { from: deployerAccount }
    );

    planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });
  });

  it("return versionRecipient", async () => {
    const version = await relayRecipientInstance.versionRecipient.call();

    assert.equal(version, "2.2.0+treejer.irelayrecipient", "verion is not ok");
  });

  it("return versionPaymaster", async () => {
    const version = await whitelistPaymasterInstance.versionPaymaster.call();
    assert.equal(
      version,
      "2.2.0+treejer.whitelist.ipaymaster",
      "verion is not ok"
    );
  });

  it("should addPlanterWhitelistTarget", async () => {
    const planterAddress = userAccount1;

    const planterTargetWhitelistBefore =
      await whitelistPaymasterInstance.planterTargetWhitelist.call(
        planterAddress
      );

    await whitelistPaymasterInstance.addPlanterWhitelistTarget(planterAddress, {
      from: deployerAccount,
    });

    const planterTargetWhitelistAfter =
      await whitelistPaymasterInstance.planterTargetWhitelist.call(
        planterAddress
      );

    assert.equal(
      planterTargetWhitelistBefore,
      false,
      "planter target white list before not correct"
    );

    assert.equal(
      planterTargetWhitelistAfter,
      true,
      "planter target white list after not correct"
    );
  });

  it("should fail to addPlanterWhitelistTarget", async () => {
    const planterAddress = userAccount1;

    await whitelistPaymasterInstance
      .addPlanterWhitelistTarget(planterAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await whitelistPaymasterInstance
      .addPlanterWhitelistTarget(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  it("should removePlanterWhitelistTarget", async () => {
    const planterAddress = userAccount1;

    const beforeAdd =
      await whitelistPaymasterInstance.planterTargetWhitelist.call(
        planterAddress
      );
    await whitelistPaymasterInstance.addPlanterWhitelistTarget(planterAddress, {
      from: deployerAccount,
    });

    const afterAddBeforeRemove =
      await whitelistPaymasterInstance.planterTargetWhitelist.call(
        planterAddress
      );
    await whitelistPaymasterInstance.removePlanterWhitelistTarget(
      planterAddress,
      {
        from: deployerAccount,
      }
    );
    const afterRemove =
      await whitelistPaymasterInstance.planterTargetWhitelist.call(
        planterAddress
      );

    assert.equal(
      beforeAdd,
      false,
      "planter target white list before add not correct"
    );

    assert.equal(
      afterAddBeforeRemove,
      true,
      "planter target white list after add before remove not correct"
    );

    assert.equal(
      afterRemove,
      false,
      "planter target white list after remove not correct"
    );
  });

  it("should fail to removePlanterWhitelistTarget", async () => {
    const planterAddress = userAccount1;

    await whitelistPaymasterInstance
      .removePlanterWhitelistTarget(planterAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    await whitelistPaymasterInstance.addPlanterWhitelistTarget(planterAddress, {
      from: deployerAccount,
    });

    await whitelistPaymasterInstance
      .removePlanterWhitelistTarget(planterAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("should addFunderWhitelistTarget", async () => {
    const funderAddresss = userAccount1;

    const beforeAdd =
      await whitelistPaymasterInstance.funderTargetWhitelist.call(
        funderAddresss
      );

    await whitelistPaymasterInstance.addFunderWhitelistTarget(funderAddresss, {
      from: deployerAccount,
    });

    const afterAdd =
      await whitelistPaymasterInstance.funderTargetWhitelist.call(
        funderAddresss
      );

    assert.equal(
      beforeAdd,
      false,
      "funder target white list before not correct"
    );

    assert.equal(afterAdd, true, "funder target white list after not correct");
  });

  it("should fail to addFunderWhitelistTarget", async () => {
    const funderAddress = userAccount1;

    await whitelistPaymasterInstance
      .addFunderWhitelistTarget(funderAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await whitelistPaymasterInstance
      .addFunderWhitelistTarget(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  it("should removeFunderWhitelistTarget", async () => {
    const funderAddress = userAccount1;

    const beforeAdd =
      await whitelistPaymasterInstance.funderTargetWhitelist.call(
        funderAddress
      );
    await whitelistPaymasterInstance.addFunderWhitelistTarget(funderAddress, {
      from: deployerAccount,
    });

    const afterAddBeforeRemove =
      await whitelistPaymasterInstance.funderTargetWhitelist.call(
        funderAddress
      );
    await whitelistPaymasterInstance.removeFunderWhitelistTarget(
      funderAddress,
      {
        from: deployerAccount,
      }
    );
    const afterRemove =
      await whitelistPaymasterInstance.funderTargetWhitelist.call(
        funderAddress
      );

    assert.equal(
      beforeAdd,
      false,
      "planter target white list before add not correct"
    );

    assert.equal(
      afterAddBeforeRemove,
      true,
      "planter target white list after add before remove not correct"
    );

    assert.equal(
      afterRemove,
      false,
      "planter target white list after remove not correct"
    );
  });

  it("should fail to removeFunderWhitelistTarget", async () => {
    const funderAddress = userAccount1;

    await whitelistPaymasterInstance
      .removeFunderWhitelistTarget(funderAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    await whitelistPaymasterInstance.addFunderWhitelistTarget(funderAddress, {
      from: deployerAccount,
    });

    await whitelistPaymasterInstance
      .removeFunderWhitelistTarget(funderAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("test postRelayedCall", async () => {
    //deploy TestWhitelistPaymaster

    testInstance = await TestWhitelistPaymaster.new({
      from: deployerAccount,
    });

    await testInstance.test(whitelistPaymasterInstance.address, {
      from: deployerAccount,
    });
  });

  it("test preRelayedCall funder", async () => {
    //deploy TestWhitelistPaymaster

    testInstance = await TestWhitelistPaymaster.new({
      from: deployerAccount,
    });

    testRelayRecipientInstance = await TestRelayRecipient.new({
      from: deployerAccount,
    });

    await testInstance
      .testPreRelayedCall(
        whitelistPaymasterInstance.address,
        testRelayRecipientInstance.address,
        zeroAddress,
        {
          from: deployerAccount,
        }
      )
      .should.be.rejectedWith("Target not exists");

    await whitelistPaymasterInstance.addFunderWhitelistTarget(
      testRelayRecipientInstance.address,
      {
        from: deployerAccount,
      }
    );

    await testInstance.testPreRelayedCall(
      whitelistPaymasterInstance.address,
      testRelayRecipientInstance.address,
      zeroAddress,
      {
        from: deployerAccount,
      }
    );
  });

  it("test preRelayedCall planter", async () => {
    //deploy TestWhitelistPaymaster

    testInstance = await TestWhitelistPaymaster.new({
      from: deployerAccount,
    });

    testRelayRecipientInstance = await TestRelayRecipient.new({
      from: deployerAccount,
    });

    await whitelistPaymasterInstance.addPlanterWhitelistTarget(
      testRelayRecipientInstance.address,
      {
        from: deployerAccount,
      }
    );

    await testInstance.testPreRelayedCall(
      whitelistPaymasterInstance.address,
      testRelayRecipientInstance.address,
      userAccount7,
      {
        from: deployerAccount,
      }
    ).should.be.rejected;

    await Common.addPlanter(arInstance, userAccount7, deployerAccount);

    await testInstance.testPreRelayedCall(
      whitelistPaymasterInstance.address,
      testRelayRecipientInstance.address,
      userAccount7,
      {
        from: deployerAccount,
      }
    );
  });
});
