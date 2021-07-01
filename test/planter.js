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
    Common.addPlanter(arInstance, userAccount2, deployerAccount);

    Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    let planter = await planterInstance.planters.call(userAccount2);

    // assert.equal(
    //   Number(planter.planterType.toString()),
    //   1,
    //   "planterType not true"
    // );
    // assert.equal(Number(planter.status), 1, "status not true");
    // assert.equal(Number(planter.capacity), 100, "capacity not true");
    // assert.equal(Number(planter.longitude), 1, "longitude not true");
    // assert.equal(Number(planter.latitude), 2, "latitude not true");
    // assert.equal(Number(planter.countryCode), 10, "countryCode not true");
    // assert.equal(Number(planter.score), 0, "score not true");
    // assert.equal(Number(planter.plantedCount), 0, "plantedCount not true");

    console.log("planter", planter);
  });

  // it("planterJoin should be fail because user not planter", async () => {
  //   planterInstance
  //     .planterJoin(1, 12, 24, 12, zeroAddress, zeroAddress, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(PlanterErrorMsg.ONLY_PLANTER);
  // });

  // it("planterJoin should be fail because user exist", async () => {
  //   Common.addPlanter(arInstance, userAccount2, deployerAccount);

  //   planterInstance.planterJoin(1, 12, 24, 12, zeroAddress, zeroAddress, {
  //     from: userAccount2,
  //   });
  // });

  //////////////// mahdi ///////////////////////////////////////////////////////////////////////////////

  // it("should update capacity successfully", async () => {
  //   await Common.addPlanter(arInstance, userAccount1, deployerAccount);
  //   await Common.joinSimplePlanter(
  //     planterInstance,
  //     1,
  //     userAccount1,
  //     zeroAddress,
  //     zeroAddress
  //   );

  //   await planterInstance.updateCapacity(userAccount1, 5, {
  //     from: deployerAccount,
  //   });
  // });
  // it("should check data after update capacity", async () => {});
  // it("should fail update capacity", async () => {});
});
