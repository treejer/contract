const AccessRestriction = artifacts.require("AccessRestriction");
const Planter = artifacts.require("Planter.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const {
  TimeEnumes,
  CommonErrorMsg,
  GenesisTreeErrorMsg,
  TreeAuctionErrorMsg,
  PlanterErrorMsg,
} = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("GenesisTree", (accounts) => {
  let planterInstance;

  let arInstance;

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
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });

  afterEach(async () => {});
  //************************************ deploy successfully ****************************************//
  // it("deploys successfully", async () => {
  //   const address = planterInstance.address;
  //   assert.notEqual(address, 0x0);
  //   assert.notEqual(address, "");
  //   assert.notEqual(address, null);
  //   assert.notEqual(address, undefined);
  // });

  //---------------------------------planterJoin--------------------------------------------------------

  it("planterJoin should be work successfully without refferedBy and organizationAddress", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    let planter = await planterInstance.planters.call(userAccount2);

    assert.equal(Number(planter.planterType), 1, "planterType not true");
    assert.equal(Number(planter.status), 1, "status not true");
    assert.equal(Number(planter.capacity), 100, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");
  });

  it("planterJoin should be work successfully with refferedBy and without organizationAddress", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      userAccount3,
      zeroAddress
    );

    let planter = await planterInstance.planters.call(userAccount2);

    assert.equal(Number(planter.planterType), 1, "planterType not true");
    assert.equal(Number(planter.status), 1, "status not true");
    assert.equal(Number(planter.capacity), 100, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");

    let reffered = await planterInstance.refferedBy.call(userAccount2);

    assert.equal(reffered, userAccount3, "refferedBy not true set");
  });

  it("planterJoin should be work successfully with organizationAddress and without refferedBy", async () => {
    //planter address
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    //organization address
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount4
    );

    let planter = await planterInstance.planters.call(userAccount2);

    assert.equal(Number(planter.planterType), 3, "planterType not true");
    assert.equal(Number(planter.status), 0, "status not true");
    assert.equal(Number(planter.capacity), 100, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");

    let reffered = await planterInstance.refferedBy.call(userAccount2);

    assert.equal(reffered, zeroAddress, "refferedBy not true set");

    let organizationAddress = await planterInstance.memberOf.call(userAccount2);

    assert.equal(
      organizationAddress,
      userAccount4,
      "organizationAddress not true set"
    );
  });

  it("planterJoin should be work successfully with refferedBy and organizationAddress", async () => {
    //planter address
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    //reffer address
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    //organization address
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      userAccount3,
      userAccount4
    );

    let planter = await planterInstance.planters.call(userAccount2);

    assert.equal(Number(planter.planterType), 3, "planterType not true");
    assert.equal(Number(planter.status), 0, "status not true");
    assert.equal(Number(planter.capacity), 100, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");

    let reffered = await planterInstance.refferedBy.call(userAccount2);

    assert.equal(reffered, userAccount3, "refferedBy not true set");

    let organizationAddress = await planterInstance.memberOf.call(userAccount2);

    assert.equal(
      organizationAddress,
      userAccount4,
      "organizationAddress not true set"
    );
  });

  it("planterJoin should be fail because user not planter", async () => {
    planterInstance
      .planterJoin(1, 12, 24, 12, zeroAddress, zeroAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);
  });

  it("planterJoin should be fail because planterType not allowed value", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.joinSimplePlanter(
      planterInstance,
      5,
      userAccount2,
      userAccount3,
      userAccount4
    ).should.be.rejectedWith(PlanterErrorMsg.PLANTERTYPE_ALLOWED_VALUE);
  });

  it("planterJoin should be fail because organization address not valid", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      userAccount3,
      userAccount4
    ).should.be.rejectedWith(PlanterErrorMsg.ORGANIZATION_NOT_VALID);
  });

  it("planterJoin should be fail because reffered not true", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      userAccount4,
      zeroAddress
    ).should.be.rejectedWith(PlanterErrorMsg.REFFERED_NOT_TRUE);
  });

  it("planterJoin should be fail because reffered not true", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      userAccount4,
      zeroAddress
    ).should.be.rejectedWith(PlanterErrorMsg.REFFERED_NOT_TRUE);
  });

  it("planterJoin should be fail because user exist", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    ).should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);
  });

  //---------------------------------------organizationJoin-------------------------

  it("organizationJoin should be work successfully without refferedBy", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    let planter = await planterInstance.planters.call(userAccount4);

    assert.equal(Number(planter.planterType), 2, "planterType not true");
    assert.equal(Number(planter.status), 1, "status not true");
    assert.equal(Number(planter.capacity), 1000, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");
  });

  it("organizationJoin should be work successfully with refferedBy", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    let reffered = await planterInstance.refferedBy.call(userAccount4);

    assert.equal(reffered, zeroAddress, "refferedBy not true set");

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      userAccount3,
      deployerAccount
    );

    let refferedAfter = await planterInstance.refferedBy.call(userAccount4);

    assert.equal(refferedAfter, userAccount3, "refferedBy not true set");

    let planter = await planterInstance.planters.call(userAccount4);

    assert.equal(Number(planter.planterType), 2, "planterType not true");
    assert.equal(Number(planter.status), 1, "status not true");
    assert.equal(Number(planter.capacity), 1000, "capacity not true");
    assert.equal(Number(planter.longitude), 1, "longitude not true");
    assert.equal(Number(planter.latitude), 2, "latitude not true");
    assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter.score), 0, "score not true");
    assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");
  });

  it("organizationJoin should be fail because user exist", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    ).should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);
  });

  it("organizationJoin should be fail because user not planter", async () => {
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    ).should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);
  });

  it("joinOrganizationPlanter should be fail because reffered not true", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      userAccount3,
      deployerAccount
    ).should.be.rejectedWith(PlanterErrorMsg.REFFERED_NOT_TRUE);
  });

  it("joinOrganizationPlanter should be fail because only admin access", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      userAccount6
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //----------------------------------------updatePlanterType------------------------------------------------
  it("1.updatePlanterType should be work successfully", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    //user join with organizationAddress
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount3
    );

    let statusBefore = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    let PlanterTypeBefore = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    let organizationAddressBefore = await planterInstance.memberOf.call(
      userAccount2
    );

    assert.equal(
      organizationAddressBefore,
      userAccount3,
      "organizationAddressBefore not true"
    );

    assert.equal(PlanterTypeBefore, 3, "PlanterTypeBefore not true");

    assert.equal(statusBefore, 0, "statusBefore not true");

    await planterInstance.updatePlanterType(1, zeroAddress, {
      from: userAccount2,
    });

    let statusAfter = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    let organizationAddressAfter = await planterInstance.memberOf.call(
      userAccount2
    );

    assert.equal(
      organizationAddressAfter,
      zeroAddress,
      "organizationAddressAfter not true"
    );

    let PlanterTypeAfter = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    assert.equal(PlanterTypeAfter, 1, "PlanterTypeAfter not true");

    assert.equal(statusAfter, 1, "statusAfter not true");
  });

  it("2.updatePlanterType should be work with successfully", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    //user join with organizationAddress
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount3
    );

    let PlanterTypeBefore = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    assert.equal(PlanterTypeBefore, 3, "PlanterTypeBefore not true");

    let statusBefore = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    let organizationAddressBefore = await planterInstance.memberOf.call(
      userAccount2
    );

    assert.equal(
      organizationAddressBefore,
      userAccount3,
      "organizationAddressBefore not true"
    );

    assert.equal(statusBefore, 0, "statusBefore not true");

    await planterInstance.updatePlanterType(3, userAccount4, {
      from: userAccount2,
    });

    let PlanterTypeAfter = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    assert.equal(PlanterTypeAfter, 3, "PlanterTypeAfter not true");

    let statusAfter = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    let organizationAddressAfter = await planterInstance.memberOf.call(
      userAccount2
    );

    assert.equal(
      organizationAddressAfter,
      userAccount4,
      "organizationAddressAfter not true"
    );

    assert.equal(statusAfter, 0, "statusAfter not true");
  });

  it("3.updatePlanterType should be work with successfully", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    //user join with organizationAddress
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    let PlanterTypeBefore = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    assert.equal(PlanterTypeBefore, 1, "PlanterTypeBefore not true");

    let statusBefore = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    assert.equal(statusBefore, 1, "statusBefore not true");

    await planterInstance.updatePlanterType(3, userAccount4, {
      from: userAccount2,
    });

    let PlanterTypeAfter = Number(
      (await planterInstance.planters.call(userAccount2)).planterType
    );

    assert.equal(PlanterTypeAfter, 3, "PlanterTypeAfter not true");

    let statusAfter = Number(
      (await planterInstance.planters.call(userAccount2)).status
    );

    let organizationAddressAfter = await planterInstance.memberOf.call(
      userAccount2
    );

    assert.equal(
      organizationAddressAfter,
      userAccount4,
      "organizationAddressAfter not true"
    );

    assert.equal(statusAfter, 0, "statusAfter not true");
  });

  it("updatePlanterType should be fail because invalid planterType in change", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PLANTER_TYPE);
  });

  it("updatePlanterType should be fail because organizationAddress not access", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ORGANIZATION_INVALID_ACCESS);
  });

  it("updatePlanterType should be fail because planter not exist", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);
  });

  it("updatePlanterType should be fail because planterType invalid", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount4,
      zeroAddress,
      zeroAddress
    );

    await planterInstance
      .updatePlanterType(2, zeroAddress, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTERTYPE_ALLOWED_VALUE);
  });

  it("updatePlanterType should be fail because organizationAddress not invalid", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await planterInstance
      .updatePlanterType(3, userAccount5, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ORGANIZATION_NOT_VALID);
  });

  ///////////////////////////////////////////////mahdi/////////////////////////////////
  it("should check data after update capacity", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );
    const planterBeforeUpdate = await planterInstance.planters.call(
      userAccount1
    );
    assert.equal(
      Number(planterBeforeUpdate.capacity.toString()),
      100,
      "planter capacity is incorrect"
    );

    await planterInstance.updateCapacity(userAccount1, 5, {
      from: deployerAccount,
    });
    const planterAfterUpdate = await planterInstance.planters.call(
      userAccount1
    );
    assert.equal(
      Number(planterAfterUpdate.capacity.toString()),
      5,
      "capacity update incorrect"
    );
  });
  it("should fail update capacity", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    ////////------------ fail because caller is not admin
    await planterInstance
      .updateCapacity(userAccount1, 2, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await planterInstance
      .updateCapacity(userAccount4, 2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);
    /////////////////----------- update capacity
    await planterInstance.updateCapacity(userAccount1, 2, {
      from: deployerAccount,
    });

    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    await planterInstance
      .updateCapacity(userAccount1, 1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_CAPACITY);
  });
  it("should give planting permision succusfully", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
  });
  it("should check data after give planting permision to be correct 1", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    const planter1 = await planterInstance.planters.call(userAccount1);
    assert.equal(
      Number(planter1.plantedCount.toString()),
      0,
      "incorrect plantedCount"
    );

    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    const planter2 = await planterInstance.planters.call(userAccount1);
    assert.equal(
      Number(planter2.plantedCount.toString()),
      1,
      "incorrect plantedCount"
    );
    ///////////-------------------- update capacity
    await planterInstance.updateCapacity(userAccount1, 2, {
      from: deployerAccount,
    });
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    const planter3 = await planterInstance.planters.call(userAccount1);
    assert.equal(
      Number(planter3.plantedCount.toString()),
      2,
      "incorrect plantedCount"
    );
    ////////////////// planter count must be 2 because it dont give permision
    await planterInstance.plantingPermision(userAccount1, {
      from: userAccount2,
    });
    const planter4 = await planterInstance.planters.call(userAccount1);
    assert.equal(
      Number(planter4.plantedCount.toString()),
      2,
      "incorrect plantedCount"
    );
  });

  it("should check data after give planting permision to be correct 2", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount3, deployerAccount);
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      deployerAccount
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount1
    );

    const planter1 = await planterInstance.planters.call(userAccount2);
    assert.equal(
      Number(planter1.plantedCount.toString()),
      0,
      "incorrect plantedCount"
    );

    await planterInstance.plantingPermision(userAccount2, {
      from: userAccount3,
    });
    const planter2 = await planterInstance.planters.call(userAccount2);
    assert.equal(
      Number(planter2.plantedCount.toString()),
      0,
      "incorrect plantedCount"
    );
  });

  it("should fail to give planting permision", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );
    await planterInstance
      .plantingPermision(userAccount1, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_GENESIS_TREE);
    await planterInstance
      .plantingPermision(userAccount4, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);
  });
});
