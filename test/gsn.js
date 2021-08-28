const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const RelayRecipient = artifacts.require("RelayRecipient.sol");
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");
const Planter = artifacts.require("Planter.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");

const { CommonErrorMsg, GsnErrorMsg } = require("./enumes");

const Common = require("./common");

const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

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

  beforeEach(async () => {
    /////////////---------------------- deploy contracts ------------------- //////////////

    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    relayRecipientInstance = await deployProxy(RelayRecipient, {
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    whitelistPaymasterInstance = await WhitelistPaymaster.new(
      arInstance.address,
      { from: deployerAccount }
    );

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
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
});
