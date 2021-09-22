const AccessRestriction = artifacts.require("AccessRestriction");
const Planter = artifacts.require("Planter.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, GsnErrorMsg, PlanterErrorMsg } = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");

const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

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
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });

  afterEach(async () => {});

  ////////////////--------------------------------------------gsn------------------------------------------------
  // it("test gsn [ @skip-on-coverage ]", async () => {
  //   let env = await GsnTestEnvironment.startGsn("localhost");

  //   const { forwarderAddress, relayHubAddress } = env.contractsDeployment;

  //   await planterInstance.setTrustedForwarder(forwarderAddress, {
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

  //   let signerPlanter = provider.getSigner(3);

  //   let contractPlanter = await new ethers.Contract(
  //     planterInstance.address,
  //     planterInstance.abi,
  //     signerPlanter
  //   );

  //   let longitude = 1;
  //   let latitude = 2;
  //   const countryCode = 10;

  //   let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);

  //   let tx = await contractPlanter
  //     .planterJoin(
  //       1,
  //       longitude,
  //       latitude,
  //       countryCode,
  //       zeroAddress,
  //       zeroAddress
  //     )
  //     .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

  //   await paymaster.addPlanterWhitelistTarget(planterInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await contractPlanter.planterJoin(
  //     1,
  //     longitude,
  //     latitude,
  //     countryCode,
  //     zeroAddress,
  //     zeroAddress
  //   );

  //   let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

  //   assert.equal(
  //     balanceAccountAfter,
  //     balanceAccountBefore,
  //     "gsn not true work"
  //   );

  //   await GsnTestEnvironment.stopGsn();
  // });

  //////////////////------------------------------------ deploy successfully ----------------------------------------//

  it("deploys successfully and set addresses", async () => {
    const address = planterInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);

    ///////////////---------------------------------set trust forwarder address--------------------------------------------------------

    await planterInstance
      .setTrustedForwarder(userAccount2, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await planterInstance
      .setTrustedForwarder(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await planterInstance.setTrustedForwarder(userAccount2, {
      from: deployerAccount,
    });

    assert.equal(
      userAccount2,
      await planterInstance.trustedForwarder(),
      "address set incorrect"
    );
  });
  /////////////////---------------------------------planterJoin--------------------------------------------------------

  it("planterJoin should work successfully", async () => {
    ////////////// ------------ planterJoin should be work successfully without refferedBy and organizationAddress
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    const eventTx1 = await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    let planter1 = await planterInstance.planters.call(userAccount2);

    assert.equal(Number(planter1.planterType), 1, "planterType not true");
    assert.equal(Number(planter1.status), 1, "status not true");
    assert.equal(Number(planter1.capacity), 100, "capacity not true");
    assert.equal(Number(planter1.longitude), 1, "longitude not true");
    assert.equal(Number(planter1.latitude), 2, "latitude not true");
    assert.equal(Number(planter1.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter1.score), 0, "score not true");
    assert.equal(Number(planter1.plantedCount), 0, "plantedCount not true");

    truffleAssert.eventEmitted(eventTx1, "PlanterJoin", (ev) => {
      return userAccount2 == ev.planterId;
    });

    ////////////////// ---------------------- planterJoin should be work successfully with refferedBy and without organizationAddress
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    const eventTx2 = await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      userAccount4,
      zeroAddress
    );

    let planter2 = await planterInstance.planters.call(userAccount3);

    assert.equal(Number(planter2.planterType), 1, "planterType not true");
    assert.equal(Number(planter2.status), 1, "status not true");
    assert.equal(Number(planter2.capacity), 100, "capacity not true");
    assert.equal(Number(planter2.longitude), 1, "longitude not true");
    assert.equal(Number(planter2.latitude), 2, "latitude not true");
    assert.equal(Number(planter2.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter2.score), 0, "score not true");
    assert.equal(Number(planter2.plantedCount), 0, "plantedCount not true");

    let reffered1 = await planterInstance.refferedBy.call(userAccount3);

    assert.equal(reffered1, userAccount4, "refferedBy not true set");

    truffleAssert.eventEmitted(eventTx2, "PlanterJoin", (ev) => {
      return userAccount3 == ev.planterId;
    });

    /////////////////////-------------------------planterJoin should be work successfully with organizationAddress and without refferedBy
    //planter address
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    //organization address
    await Common.addPlanter(arInstance, userAccount6, deployerAccount);

    const eventTx3 = await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      dataManager
    );

    const eventTx4 = await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount6
    );

    let planter3 = await planterInstance.planters.call(userAccount5);

    assert.equal(Number(planter3.planterType), 3, "planterType not true");
    assert.equal(Number(planter3.status), 0, "status not true");
    assert.equal(Number(planter3.capacity), 100, "capacity not true");
    assert.equal(Number(planter3.longitude), 1, "longitude not true");
    assert.equal(Number(planter3.latitude), 2, "latitude not true");
    assert.equal(Number(planter3.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter3.score), 0, "score not true");
    assert.equal(Number(planter3.plantedCount), 0, "plantedCount not true");

    let reffered2 = await planterInstance.refferedBy.call(userAccount5);

    assert.equal(reffered2, zeroAddress, "refferedBy not true set");

    let organizationAddress1 = await planterInstance.memberOf.call(
      userAccount5
    );

    assert.equal(
      organizationAddress1,
      userAccount6,
      "organizationAddress not true set"
    );

    truffleAssert.eventEmitted(eventTx3, "OrganizationJoin", (ev) => {
      return userAccount6 == ev.organizationId;
    });

    truffleAssert.eventEmitted(eventTx4, "PlanterJoin", (ev) => {
      return userAccount5 == ev.planterId;
    });

    /////////////////////////------------------ planterJoin should be work successfully with refferedBy and organizationAddress

    //planter address
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    //reffer address
    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    //organization address
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);

    const eventTx5 = await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount8,
      zeroAddress,
      dataManager
    );

    const eventTx6 = await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount1,
      userAccount7,
      userAccount8
    );

    let planter4 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter4.planterType), 3, "planterType not true");
    assert.equal(Number(planter4.status), 0, "status not true");
    assert.equal(Number(planter4.capacity), 100, "capacity not true");
    assert.equal(Number(planter4.longitude), 1, "longitude not true");
    assert.equal(Number(planter4.latitude), 2, "latitude not true");
    assert.equal(Number(planter4.countryCode), 10, "countryCode not true");
    assert.equal(Number(planter4.score), 0, "score not true");
    assert.equal(Number(planter4.plantedCount), 0, "plantedCount not true");

    let reffered3 = await planterInstance.refferedBy.call(userAccount1);

    assert.equal(reffered3, userAccount7, "refferedBy not true set");

    let organizationAddress2 = await planterInstance.memberOf.call(
      userAccount1
    );

    assert.equal(
      organizationAddress2,
      userAccount8,
      "organizationAddress not true set"
    );

    truffleAssert.eventEmitted(eventTx5, "OrganizationJoin", (ev) => {
      return userAccount8 == ev.organizationId;
    });

    truffleAssert.eventEmitted(eventTx6, "PlanterJoin", (ev) => {
      return userAccount1 == ev.planterId;
    });
  });

  it("planterJoin should be fail", async () => {
    ///////////// fail user not planter
    planterInstance
      .planterJoin(1, 12, 24, 12, zeroAddress, zeroAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    ////////////// ------- fail planterType not allowed value

    await Common.joinSimplePlanter(
      planterInstance,
      5,
      userAccount2,
      userAccount3,
      userAccount4
    ).should.be.rejectedWith(PlanterErrorMsg.PLANTERTYPE_ALLOWED_VALUE);

    ///////////// --------------- fail organization address not valid
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      userAccount3,
      userAccount4
    ).should.be.rejectedWith(PlanterErrorMsg.ORGANIZATION_NOT_VALID);

    ///////// --------------- reffered not true

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

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    //////////------------ fail because user exist
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
      dataManager
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

    const eventTx = await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      userAccount3,
      dataManager
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

    truffleAssert.eventEmitted(eventTx, "OrganizationJoin", (ev) => {
      return userAccount4 == ev.organizationId;
    });
  });

  it("organizationJoin should be fail", async () => {
    ///////////----------- fail because user not planter

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
    ).should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);

    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
    );

    //////////-----------  fail because user exist
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
    ).should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);

    // ///////// ----------------- fail because reffered not true
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount5,
      userAccount3,
      dataManager
    ).should.be.rejectedWith(PlanterErrorMsg.REFFERED_NOT_TRUE);
    // //////////////// -------------- fail because only admin access

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount5,
      zeroAddress,
      userAccount6
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
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
      dataManager
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

    const eventTx = await planterInstance.updatePlanterType(1, zeroAddress, {
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

    truffleAssert.eventEmitted(eventTx, "PlanterUpdated", (ev) => {
      return userAccount2 == ev.planterId;
    });
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
      dataManager
    );

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
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

    const eventTx = await planterInstance.updatePlanterType(3, userAccount4, {
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

    truffleAssert.eventEmitted(eventTx, "PlanterUpdated", (ev) => {
      return userAccount2 == ev.planterId;
    });
  });

  it("3.updatePlanterType should be work with successfully", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
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

    const eventTx = await planterInstance.updatePlanterType(3, userAccount4, {
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

    truffleAssert.eventEmitted(eventTx, "PlanterUpdated", (ev) => {
      return userAccount2 == ev.planterId;
    });
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

  it("updatePlanterType should be fail because planter has invalid status", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount4
    );

    await planterInstance.acceptPlanterFromOrganization(userAccount2, true, {
      from: userAccount4,
    });

    await planterInstance.updateCapacity(userAccount2, 1, {
      from: dataManager,
    });

    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await planterInstance.plantingPermission(userAccount2, userAccount2, {
      from: deployerAccount,
    });

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PLANTER_STATUS);
  });

  it("updatePlanterType should be fail because organizationAddress not access", async () => {
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount4,
      zeroAddress,
      dataManager
    );

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ORGANIZATION_INVALID_ACCESS);
  });

  it("updatePlanterType should be fail", async () => {
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    ///////// ----------------- fail because planter not exist

    await planterInstance
      .updatePlanterType(1, zeroAddress, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);

    /////////// ------------ fail because planterType invalid

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

    ////////// ---------------- fail because organizationAddress not invalid

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

  ////// ---------------------------------------------  accept planter from organization  --------------------------------------------------

  it("should check data to be correct after acceptPlanterFromOrganization", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    //////////////// check data (accept)
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount1
    );
    const planterBefore = await planterInstance.planters.call(userAccount2);
    const memberOfBefore = await planterInstance.memberOf.call(userAccount2);
    assert.equal(Number(planterBefore.status.toString()), 0, "invalid status");
    assert.equal(
      Number(planterBefore.planterType.toString()),
      3,
      "invalid type"
    );

    assert.equal(memberOfBefore, userAccount1, "invalid memberOf");

    const eventTx = await planterInstance.acceptPlanterFromOrganization(
      userAccount2,
      true,
      {
        from: userAccount1,
      }
    );

    const planterAfter = await planterInstance.planters.call(userAccount2);
    const memberOfAfter = await planterInstance.memberOf.call(userAccount2);

    assert.equal(Number(planterAfter.status.toString()), 1, "invalid status");
    assert.equal(
      Number(planterAfter.planterType.toString()),
      3,
      "invalid type"
    );

    assert.equal(memberOfAfter, userAccount1, "invalid memberOf");

    truffleAssert.eventEmitted(eventTx, "AcceptedByOrganization", (ev) => {
      return userAccount2 == ev.planterId;
    });

    ///////// -------------- check data (reject)

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );
    const planterBefore2 = await planterInstance.planters.call(userAccount4);
    const memberOfBefore2 = await planterInstance.memberOf.call(userAccount4);
    assert.equal(Number(planterBefore2.status.toString()), 0, "invalid status");
    assert.equal(
      Number(planterBefore2.planterType.toString()),
      3,
      "invalid type"
    );

    assert.equal(memberOfBefore2, userAccount3, "invalid memberOf");

    const eventTx2 = await planterInstance.acceptPlanterFromOrganization(
      userAccount4,
      false,
      {
        from: userAccount3,
      }
    );

    const planterAfter2 = await planterInstance.planters.call(userAccount4);
    const memberOfAfter2 = await planterInstance.memberOf.call(userAccount4);

    assert.equal(Number(planterAfter2.status.toString()), 1, "invalid status");
    assert.equal(
      Number(planterAfter2.planterType.toString()),
      1,
      "invalid type"
    );

    assert.equal(memberOfAfter2, 0x0, "invalid memberOf");

    truffleAssert.eventEmitted(eventTx2, "RejectedByOrganization", (ev) => {
      return userAccount4 == ev.planterId;
    });
  });

  it("should fail accept planter from organization", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount2,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount2
    );

    await planterInstance
      .acceptPlanterFromOrganization(userAccount3, true, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_ORGANIZATION);

    await planterInstance
      .acceptPlanterFromOrganization(userAccount6, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);

    await planterInstance
      .acceptPlanterFromOrganization(userAccount4, true, { from: userAccount1 })
      .should.be.rejectedWith(PlanterErrorMsg.ACCEPT_PLANTER_ACCESS_ERROR);

    await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
      from: userAccount1,
    });

    await planterInstance
      .acceptPlanterFromOrganization(userAccount3, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.ACCEPT_PLANTER_ACCESS_ERROR);
  });

  ///////////// ---------------------------------------------- update capacity -------------------------------------

  it("should check data after update capacity", async () => {
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

    const planterBeforeUpdate = await planterInstance.planters.call(
      userAccount1
    );

    assert.equal(
      Number(planterBeforeUpdate.capacity),
      100,
      "planter capacity is incorrect"
    );

    const eventTx1 = await planterInstance.updateCapacity(userAccount1, 2, {
      from: dataManager,
    });

    truffleAssert.eventEmitted(eventTx1, "PlanterUpdated", (ev) => {
      return ev.planterId == userAccount1;
    });

    const planterAfterUpdate = await planterInstance.planters.call(
      userAccount1
    );

    assert.equal(
      Number(planterAfterUpdate.capacity),
      2,
      "capacity update incorrect"
    );

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    const planterAfterPlant1 = await planterInstance.planters.call(
      userAccount1
    );

    assert.equal(
      Number(planterAfterPlant1.status),
      1,
      "planter after plant 1 status is not ok"
    );

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    const planterAfterPlant2 = await planterInstance.planters.call(
      userAccount1
    );

    assert.equal(
      Number(planterAfterPlant2.status),
      2,
      "planter after plant 2 status is not ok"
    );

    const eventTx2 = await planterInstance.updateCapacity(userAccount1, 5, {
      from: dataManager,
    });

    truffleAssert.eventEmitted(eventTx2, "PlanterUpdated", (ev) => {
      return ev.planterId == userAccount1;
    });

    const planterAfterFinalUpdate = await planterInstance.planters.call(
      userAccount1
    );

    assert.equal(
      Number(planterAfterFinalUpdate.capacity),
      5,
      "capacity update incorrect after finall update"
    );

    assert.equal(
      Number(planterAfterFinalUpdate.status),
      1,
      "planter status after final update capacity is not ok"
    );
  });

  it("should fail update capacity", async () => {
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
    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    ///////////////------------ fail because caller is not admin
    await planterInstance
      .updateCapacity(userAccount1, 2, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
    //////////////////////////-------------fail: planter not exist
    await planterInstance
      .updateCapacity(userAccount4, 2, {
        from: dataManager,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);
    /////////////////----------- update capacity
    await planterInstance.updateCapacity(userAccount1, 3, {
      from: dataManager,
    });

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    await planterInstance
      .updateCapacity(userAccount1, 1, {
        from: dataManager,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_CAPACITY);
  });

  ////////// ---------------------------------------------- give planting permission -------------------------------------

  it("should give planting permision successfully", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
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
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    await planterInstance.plantingPermission(userAccount3, userAccount4, {
      from: userAccount2,
    });
  });
  it("should check data after give planting permision to be correct 1 (checking capacity limit)", async () => {
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

    const planter1 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter1.plantedCount), 0, "incorrect plantedCount");

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    const planter2 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter2.plantedCount), 1, "incorrect plantedCount");
    assert.equal(Number(planter2.status), 1, "planter status must be 1");

    ///////////-------------------- update capacity
    await planterInstance.updateCapacity(userAccount1, 2, {
      from: dataManager,
    });

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    const planter3 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter3.plantedCount), 2, "incorrect plantedCount");

    assert.equal(Number(planter3.status), 2, "planter status must be 2");

    ////////////////// function must return false it dont give permision
    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    await planterInstance.plantingPermission.call(
      userAccount1,
      userAccount1,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false becuse cpacity is full"
          );
        }
      }
    );
  });
  it("should return false when there is no planter (planter type is not > 0)", async () => {
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await planterInstance.plantingPermission.call(
      userAccount3,
      userAccount3,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false because planterType is not > 0"
          );
        }
      }
    );
  });

  it("should return false when planter type is 1", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
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
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress
    );
    await planterInstance.plantingPermission.call(
      userAccount3,
      userAccount1,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false because planter != assignee in planterType=1"
          );
        }
      }
    );
  });
  it("should return false when planter type is 2", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );

    await planterInstance.plantingPermission.call(
      userAccount3,
      userAccount1,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false because planter != assignee in planterType=2"
          );
        }
      }
    );
  });
  it("should return false when planterType=3 (1)", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount1
    );
    /////////---------------- return false because another one in organization want to plant but assigned to another one
    await planterInstance.plantingPermission.call(
      userAccount3,
      userAccount4,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false because another one want to plant a tree that assign to another one in same organization in planterType=3"
          );
        }
      }
    );
  });
  it("should return false when planterType=3 (2)", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount1
    );
    /////////---------------- return false because organization want to plant but assigned to another one
    await planterInstance.plantingPermission.call(
      userAccount1,
      userAccount4,
      { from: userAccount2 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false because organization want to plant a tree that assign to another one in same organization in planterType=3"
          );
        }
      }
    );
  });
  it("should check data after give planting permision to be correct 2", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addTreejerContractRole(
      arInstance,
      userAccount3,
      deployerAccount
    );
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount1
    );

    const planter1 = await planterInstance.planters.call(userAccount2);
    assert.equal(Number(planter1.plantedCount), 0, "incorrect plantedCount");
    //////////////////// should return false because status is not zero
    await planterInstance.plantingPermission.call(
      userAccount2,
      userAccount2,
      { from: userAccount3 },
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(
            result,
            false,
            "it must return false becuse cpacity is full"
          );
        }
      }
    );
  });

  it("should fail to give planting permision", async () => {
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

    await planterInstance
      .plantingPermission(userAccount1, userAccount1, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
  });
  /////// ---------------------------------------------- update organization planter payment  -------------------------------------

  it("should data be correct after update organization planter", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount2,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount2
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount1
    );

    //////////////// ---------- accept planter
    await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
      from: userAccount1,
    });
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount2,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount1,
    });
    ////////////////--------------- check before any update
    const rule1_3_1 = await planterInstance.organizationRules.call(
      userAccount1,
      userAccount3
    );
    const rule2_4_1 = await planterInstance.organizationRules.call(
      userAccount2,
      userAccount4
    );

    assert.equal(
      Number(rule1_3_1.toString()),
      0,
      "invalid payment portion before update"
    );

    assert.equal(
      Number(rule2_4_1.toString()),
      0,
      "invalid payment portion before update"
    );

    ////////////////////--------------------- update1
    const eventTx1 = await planterInstance.updateOrganizationPlanterPayment(
      userAccount3,
      2000,
      {
        from: userAccount1,
      }
    );

    const eventTx2 = await planterInstance.updateOrganizationPlanterPayment(
      userAccount5,
      5000,
      {
        from: userAccount1,
      }
    );

    const eventTx3 = await planterInstance.updateOrganizationPlanterPayment(
      userAccount4,
      4000,
      {
        from: userAccount2,
      }
    );

    ///////////////////-------------------check after update 1

    const rule1_3_2 = await planterInstance.organizationRules.call(
      userAccount1,
      userAccount3
    );

    const rule2_4_2 = await planterInstance.organizationRules.call(
      userAccount2,
      userAccount4
    );

    const rule1_5_2 = await planterInstance.organizationRules.call(
      userAccount1,
      userAccount5
    );

    const rule2_3 = await planterInstance.organizationRules.call(
      userAccount2,
      userAccount3
    );

    assert.equal(
      Number(rule1_3_2.toString()),
      2000,
      "invalid payment portion after update for rule1_3_2"
    );

    assert.equal(
      Number(rule2_4_2.toString()),
      4000,
      "invalid payment portion after update for rule2_4_2"
    );

    assert.equal(
      Number(rule1_5_2.toString()),
      5000,
      "invalid payment portion for rule1_5_2"
    );

    assert.equal(
      Number(rule2_3.toString()),
      0,
      "payment portion for rule2_3 must be zero because user2 belongs to organiztion4"
    );

    truffleAssert.eventEmitted(eventTx1, "PortionUpdated", (ev) => {
      return userAccount3 == ev.planterId;
    });

    truffleAssert.eventEmitted(eventTx2, "PortionUpdated", (ev) => {
      return userAccount5 == ev.planterId;
    });

    truffleAssert.eventEmitted(eventTx3, "PortionUpdated", (ev) => {
      return userAccount4 == ev.planterId;
    });

    ///////////////////-------------------update 2

    const eventTx4 = await planterInstance.updateOrganizationPlanterPayment(
      userAccount3,
      3000,
      {
        from: userAccount1,
      }
    );
    ///////////////////-------------------check after update 2

    const rule1_3_3 = await planterInstance.organizationRules.call(
      userAccount1,
      userAccount3
    );

    const rule1_5_3 = await planterInstance.organizationRules.call(
      userAccount1,
      userAccount5
    );

    assert.equal(
      Number(rule1_3_3.toString()),
      3000,
      "invalid payment portion after update2 for rule1_3_3"
    );

    assert.equal(
      Number(rule1_5_3.toString()),
      5000,
      "invalid payment portion after update2 for rule1_5_3"
    );

    truffleAssert.eventEmitted(eventTx4, "PortionUpdated", (ev) => {
      return userAccount3 == ev.planterId;
    });
  });

  it("should fail update orgnization planter", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );
    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount2,
      zeroAddress,
      dataManager
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount2
    );
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount5,
      zeroAddress,
      zeroAddress
    );
    /////////////////// ----------------- fail: planter not exist
    await planterInstance
      .updateOrganizationPlanterPayment(userAccount6, 2000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);
    ////////////////// --------------------- caller is not planter organization
    await planterInstance
      .updateOrganizationPlanterPayment(userAccount3, 2000, {
        from: userAccount4,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_ORGANIZATION);

    ///////////////////// -------------------fail: planter status is 0
    await planterInstance
      .updateOrganizationPlanterPayment(userAccount3, 2000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PLANTER_STATUS);
    //////////////////////////--------------------- fail:planter is independent and is not member of that organization
    await planterInstance
      .updateOrganizationPlanterPayment(userAccount5, 2000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PLANTER);

    await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
      from: userAccount1,
    });

    /////////////////// ------------------ fail: plater address not in oragization

    await planterInstance
      .updateOrganizationPlanterPayment(userAccount3, 2000, {
        from: userAccount2,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PLANTER);

    ///////////////////----------------------- fail: input portion is more than 10000

    await planterInstance
      .updateOrganizationPlanterPayment(userAccount3, 11000, {
        from: userAccount1,
      })
      .should.be.rejectedWith(PlanterErrorMsg.INVALID_PAYMENT_PORTION);
  });
  //////////////-----------------------------------------------  get planter portion  --------------------------------------------
  it("should get correct data from planter payment portion", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //orgnaizer planter
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //independent planter
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      userAccount5,
      zeroAddress
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount1
    );

    await planterInstance.getPlanterPaymentPortion.call(
      userAccount2,
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(result[0], true, "invalid bool");
          assert.equal(result[1], 0x0, "invalid organaizer address");
          assert.equal(result[2], userAccount5, "invalid refferal address");
          assert.equal(Number(result[3]), 10000, "invalid payment portion");
        }
      }
    );

    await planterInstance.getPlanterPaymentPortion.call(
      userAccount1,
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(result[0], true, "invalid bool");
          assert.equal(result[1], 0x0, "invalid organaizer address");
          assert.equal(result[2], 0x0, "invalid refferal address");
          assert.equal(Number(result[3]), 10000, "invalid payment portion");
        }
      }
    );

    await planterInstance.getPlanterPaymentPortion.call(
      userAccount3,
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(result[0], true, "invalid bool");
          assert.equal(result[1], 0x0, "invalid organaizer address");
          assert.equal(result[2], 0x0, "invalid refferal address");
          assert.equal(Number(result[3]), 10000, "invalid payment portion");
        }
      }
    );

    await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
      from: userAccount1,
    });

    await planterInstance.getPlanterPaymentPortion.call(
      userAccount3,
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(result[0], true, "invalid bool");
          assert.equal(result[1], userAccount1, "invalid organaizer address");
          assert.equal(result[2], 0x0, "invalid refferal address");
          assert.equal(Number(result[3]), 0, "invalid payment portion /:");
        }
      }
    );

    const eventTx = await planterInstance.updateOrganizationPlanterPayment(
      userAccount3,
      2000,
      {
        from: userAccount1,
      }
    );

    truffleAssert.eventEmitted(eventTx, "PortionUpdated", (ev) => {
      return userAccount3 == ev.planterId;
    });

    await planterInstance.getPlanterPaymentPortion.call(
      userAccount3,
      (err, result) => {
        if (err) {
          console.log("err", err);
        } else {
          assert.equal(result[0], true, "invalid bool");
          assert.equal(result[1], userAccount1, "invalid organaizer address");
          assert.equal(result[2], 0x0, "invalid refferal address");
          assert.equal(Number(result[3]), 2000, "invalid payment portion");
        }
      }
    );
  });
  ///////////////////////-----------------------------------------------  reduce plant count  --------------------------------------------
  it("should reduce planted count and check data to be ok", async () => {
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

    await planterInstance.updateCapacity(userAccount1, 3, {
      from: dataManager,
    });
    ///////////// -------------- fail invalid access
    await planterInstance
      .plantingPermission(userAccount1, userAccount1, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    //////////// -------------- fail planter not exist
    await planterInstance
      .reducePlantCount(userAccount4, { from: userAccount2 })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    const planter1 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter1.plantedCount), 2, "planted count must be 2");

    assert.equal(Number(planter1.status), 1, "status must be 1");

    await planterInstance.reducePlantCount(userAccount1, {
      from: userAccount2,
    });

    const planter2 = await planterInstance.planters.call(userAccount1);

    assert.equal(Number(planter2.plantedCount), 1, "planted count must be 1");

    assert.equal(Number(planter2.status), 1, "status must be 1");

    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });
    await planterInstance.plantingPermission(userAccount1, userAccount1, {
      from: userAccount2,
    });

    const planter3 = await planterInstance.planters.call(userAccount1);
    assert.equal(Number(planter3.plantedCount), 3, "planted count must be 3");
    assert.equal(Number(planter3.status), 2, "status must be 2");
    await planterInstance.reducePlantCount(userAccount1, {
      from: userAccount2,
    });
    const planter4 = await planterInstance.planters.call(userAccount1);
    assert.equal(Number(planter4.status), 1, "status must be 1");
    assert.equal(Number(planter4.plantedCount), 2, "planted count must be 2");
  });

  /////////// ---------------------------- planter check ---------------------------------------------------------

  it("check planterCheck return value", async () => {
    //////////// ------------ return true

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

    const result1 = await planterInstance.planterCheck.call(userAccount1, {
      from: userAccount2,
    });

    assert.equal(result1, true, "it must return true");

    ////////////// -------------------- return false

    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await planterInstance.updateCapacity(userAccount3, 1, {
      from: dataManager,
    });

    await planterInstance.planterCheck(userAccount3, { from: userAccount2 });

    const result2 = await planterInstance.planterCheck.call(userAccount3, {
      from: userAccount2,
    });

    assert.equal(result2, false, "it must return false");
  });
  it("should planterCheck return false", async () => {});

  it("should check data to be correct when call planterCheck function and fail in invaid situation", async () => {
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    await planterInstance
      .planterCheck(userAccount3, { from: userAccount2 })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_NOT_EXIST);

    await planterInstance
      .planterCheck(userAccount1, { from: userAccount3 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await planterInstance.planterCheck(userAccount1, { from: userAccount2 });

    const planter1 = await planterInstance.planters.call(userAccount1);

    assert.equal(planter1.status, 1, "status is incorrect");
    assert.equal(planter1.plantedCount, 1, "plant count is incorrect");

    await planterInstance.updateCapacity(userAccount1, 2, {
      from: dataManager,
    });

    await planterInstance.planterCheck(userAccount1, { from: userAccount2 });

    const planter2 = await planterInstance.planters.call(userAccount1);

    assert.equal(planter2.status, 2, "planter status is incorrect");
    assert.equal(planter2.plantedCount, 2, "planted count is incorrect");
  });
});
