const AccessRestriction = artifacts.require("AccessRestriction");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { CommonErrorMsg } = require("./enumes");

contract("AccessRestriction", (accounts) => {
  let arInstance;

  const deployerAccount = accounts[0];
  const dataManager = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const adminAccount = accounts[8];
  const userAccount8 = accounts[9];

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
  });

  afterEach(async () => {
    // await gbInstance.kill({ from: ownerAccount });
  });

  it("should add admin", async () => {
    await arInstance
      .ifAdmin(adminAccount)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    const before = await arInstance.isAdmin(adminAccount);

    let tx = await arInstance.grantRole(DEFAULT_ADMIN_ROLE, adminAccount, {
      from: deployerAccount,
    });

    await arInstance.ifAdmin(adminAccount);

    const after = await arInstance.isAdmin(adminAccount);

    assert.equal(before, false, "admin role is not correct");
    assert.equal(after, true, "admin role is not correct");

    truffleAssert.eventEmitted(tx, "RoleGranted", (ev) => {
      return (
        ev.account.toString() === adminAccount && ev.role === DEFAULT_ADMIN_ROLE
      );
    });
  });

  it("should add planter and check data", async () => {
    await arInstance
      .ifPlanter(userAccount1)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_PLANTER);

    const before = await arInstance.isPlanter(userAccount1);

    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await arInstance.ifPlanter(userAccount1);

    const after = await arInstance.isPlanter(userAccount1);

    assert.equal(before, false, "planter role is not correct");
    assert.equal(after, true, "planter role is not correct");
  });

  it("should add treejer contract and check data", async () => {
    await arInstance
      .ifTreejerContract(userAccount1)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    const before = await arInstance.isTreejerContract(userAccount1);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount1,
      deployerAccount
    );

    await arInstance.ifTreejerContract(userAccount1);

    const after = await arInstance.isTreejerContract(userAccount1);

    assert.equal(before, false, "TreejerContract role is not correct");
    assert.equal(after, true, "TreejerContract role is not correct");
  });

  it("should add data manager and check data", async () => {
    await arInstance
      .ifDataManager(userAccount1)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    const before = await arInstance.isDataManager(userAccount1);

    await Common.addDataManager(arInstance, userAccount1, deployerAccount);

    await arInstance.ifDataManager(userAccount1);

    const after = await arInstance.isDataManager(userAccount1);

    assert.equal(before, false, "DataManager role is not correct");
    assert.equal(after, true, "DataManager role is not correct");
  });

  it("should add buyer rank and check data", async () => {
    await arInstance
      .ifBuyerRank(userAccount1)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_BUYER_RANK);

    const before = await arInstance.isBuyerRank(userAccount1);

    await Common.addBuyerRank(arInstance, userAccount1, deployerAccount);

    await arInstance.ifBuyerRank(userAccount1);

    const after = await arInstance.isBuyerRank(userAccount1);

    assert.equal(before, false, "BuyerRank role is not correct");
    assert.equal(after, true, "BuyerRank role is not correct");
  });
  it("check if data manager or treejer contract", async () => {
    await Common.addDataManager(arInstance, userAccount1, deployerAccount);
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );
    await arInstance
      .ifDataManagerOrTreejerContract(userAccount3)
      .should.be.rejectedWith(
        CommonErrorMsg.CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT
      );

    await arInstance.ifDataManagerOrTreejerContract(userAccount1);
    await arInstance.ifDataManagerOrTreejerContract(userAccount2);
  });
  it("check pause", async () => {
    await arInstance
      .ifPaused()
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_PAUSED);

    await arInstance.ifNotPaused();

    await arInstance
      .pause({ from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await arInstance.pause({ from: deployerAccount });

    await arInstance
      .pause({ from: deployerAccount })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_NOT_PAUSED);

    await arInstance.ifPaused();

    await arInstance
      .ifNotPaused()
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_NOT_PAUSED);
  });
  it("check unpause", async () => {
    await arInstance.ifNotPaused();

    await arInstance
      .ifPaused()
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_PAUSED);

    await arInstance
      .unpause({ from: deployerAccount })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_PAUSED);

    await arInstance.pause({ from: deployerAccount });

    await arInstance
      .ifNotPaused()
      .should.be.rejectedWith(CommonErrorMsg.CHECK_IF_NOT_PAUSED);

    await arInstance
      .unpause({ from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await arInstance.unpause({ from: deployerAccount });

    await arInstance.ifNotPaused();
  });
});
