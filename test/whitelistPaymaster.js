const AccessRestriction = artifacts.require("AccessRestriction.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Common = require("./common");

const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");

const { CommonErrorMsg, GsnErrorMsg } = require("./enumes");

contract("WhitelistPaymaster", (accounts) => {
  let paymasterInstance;
  let arInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];

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
    paymasterInstance = await WhitelistPaymaster.new(arInstance.address);
  });

  afterEach(async () => {});

  // //----------------------------------------- deploy successfully -----------------------------------------//

  it("deploys successfully", async () => {
    const address = paymasterInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  // //----------------------------------------- check addPlanterWhitelistTarget function -----------------------------------------//

  it("Should addPlanterWhitelistTarget function work successfully", async () => {
    let address1 = userAccount1;

    await paymasterInstance
      .addPlanterWhitelistTarget(address1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await paymasterInstance
      .addPlanterWhitelistTarget(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    let existsBefore = await paymasterInstance.planterTargetWhitelist(address1);

    assert.equal(existsBefore, false, "1-address not added");

    await paymasterInstance.addPlanterWhitelistTarget(address1, {
      from: deployerAccount,
    });

    let exists = await paymasterInstance.planterTargetWhitelist(address1);

    assert.equal(exists, true, "2-address not added");
  });

  // //----------------------------------------- check removePlanterWhitelistTarget function -----------------------------------------//

  it("Should removePlanterWhitelistTarget function work successfully", async () => {
    let address1 = userAccount1;

    await paymasterInstance
      .removePlanterWhitelistTarget(userAccount1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    await paymasterInstance.addPlanterWhitelistTarget(address1, {
      from: deployerAccount,
    });

    await paymasterInstance
      .removePlanterWhitelistTarget(address1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    let existsBefore = await paymasterInstance.planterTargetWhitelist(address1);

    assert.equal(existsBefore, true, "1-address not added");

    await paymasterInstance.removePlanterWhitelistTarget(address1, {
      from: deployerAccount,
    });

    let exists = await paymasterInstance.planterTargetWhitelist(address1);

    assert.equal(exists, false, "2-address not added");
  });

  // //----------------------------------------- check addFunderWhitelistTarget function -----------------------------------------//

  it("Should addFunderWhitelistTarget function work successfully", async () => {
    let address1 = userAccount1;

    await paymasterInstance
      .addFunderWhitelistTarget(address1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await paymasterInstance
      .addFunderWhitelistTarget(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    let existsBefore = await paymasterInstance.funderTargetWhitelist(address1);

    assert.equal(existsBefore, false, "1-address not added");

    await paymasterInstance.addFunderWhitelistTarget(address1, {
      from: deployerAccount,
    });

    let exists = await paymasterInstance.funderTargetWhitelist(address1);

    assert.equal(exists, true, "2-address not added");
  });

  // //----------------------------------------- check removeFunderWhitelistTarget function -----------------------------------------//

  it("Should removeFunderWhitelistTarget function work successfully", async () => {
    let address1 = userAccount1;

    await paymasterInstance
      .removeFunderWhitelistTarget(userAccount1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    await paymasterInstance.addFunderWhitelistTarget(address1, {
      from: deployerAccount,
    });

    await paymasterInstance
      .removeFunderWhitelistTarget(address1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    let existsBefore = await paymasterInstance.funderTargetWhitelist(address1);

    assert.equal(existsBefore, true, "1-address not added");

    await paymasterInstance.removeFunderWhitelistTarget(address1, {
      from: deployerAccount,
    });

    let exists = await paymasterInstance.funderTargetWhitelist(address1);

    assert.equal(exists, false, "2-address not added");
  });
});
