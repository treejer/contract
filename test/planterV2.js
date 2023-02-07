// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const Planter = artifacts.require("PlanterV2");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, GsnErrorMsg, PlanterErrorMsg } = require("./enumes");

//gsn
// const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");

// const Gsn = require("@opengsn/provider");
// const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
// const ethers = require("ethers");

contract("Planter", (accounts) => {
  let planterInstance;

  let arInstance;

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

  // before(async () => {

  // });

  beforeEach(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    planterInstance = await Planter.new({
      from: deployerAccount,
    });

    await planterInstance.initialize(zeroAddress, {
      from: deployerAccount,
    }).should.be.rejected;

    await planterInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});

  /////////// ---------------------------- manageTreePermissionBatch ---------------------------------------------------------

  it("check manageTreePermissionBatch return value", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    await planterInstance.updateSupplyCap(userAccount1, 100, {
      from: dataManager,
    });

    let result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      10,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, true, "it must return true");

    result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      99,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, true, "it must return true");

    result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      100,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, true, "it must return true");

    result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      101,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, false, "it must return true");

    await planterInstance.manageTreePermissionBatch(userAccount1, 99, {
      from: userAccount2,
    });

    result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      1,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, true, "it must return true");

    await planterInstance.manageTreePermissionBatch(userAccount1, 1, {
      from: userAccount2,
    });

    result1 = await planterInstance.manageTreePermissionBatch.call(
      userAccount1,
      1,
      {
        from: userAccount2,
      }
    );

    assert.equal(result1, false, "it must return true");

    //-----------------------------------------------

    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await planterInstance.updateSupplyCap(userAccount3, 1, {
      from: dataManager,
    });

    let result2 = await planterInstance.manageTreePermissionBatch.call(
      userAccount3,
      1,
      {
        from: userAccount2,
      }
    );

    assert.equal(result2, true, "it must return true");

    result2 = await planterInstance.manageTreePermissionBatch(userAccount3, 1, {
      from: userAccount2,
    });

    result2 = await planterInstance.manageTreePermissionBatch.call(
      userAccount3,
      1,
      {
        from: userAccount2,
      }
    );

    assert.equal(result2, false, "it must return false");

    await planterInstance.updateSupplyCap(userAccount3, 2, {
      from: dataManager,
    });

    result2 = await planterInstance.manageTreePermissionBatch.call(
      userAccount3,
      1,
      {
        from: userAccount2,
      }
    );

    assert.equal(result2, true, "it must return false");
  });

  it("should check data to be correct when call manageTreePermissionBatch function and fail in invaid situation", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    await planterInstance
      .manageTreePermissionBatch(userAccount3, 0, { from: userAccount2 })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);

    await planterInstance
      .manageTreePermissionBatch(userAccount1, 0, { from: userAccount3 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await planterInstance.manageTreePermissionBatch(userAccount1, 1, {
      from: userAccount2,
    });

    const planter1 = await planterInstance.planters.call(userAccount1);

    assert.equal(planter1.status, 1, "status is incorrect");
    assert.equal(planter1.plantedCount, 1, "plant count is incorrect");

    await planterInstance.updateSupplyCap(userAccount1, 100, {
      from: dataManager,
    });

    await planterInstance.manageTreePermissionBatch(userAccount1, 99, {
      from: userAccount2,
    });

    const planter2 = await planterInstance.planters.call(userAccount1);

    assert.equal(planter2.status, 2, "planter status is incorrect");
    assert.equal(planter2.plantedCount, 100, "planted count is incorrect");
  });
});
