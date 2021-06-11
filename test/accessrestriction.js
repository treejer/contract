const AccessRestriction = artifacts.require("AccessRestriction");

const assert = require("chai").assert;
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

contract("AccessRestriction", (accounts) => {
  let arInstance;

  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  const ambassadorAccount = accounts[2];
  const planter1Account = accounts[3];
  const planter2Account = accounts[4];
  const adminAccount = accounts[8];

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
    let tx = await arInstance.grantRole(DEFAULT_ADMIN_ROLE, adminAccount, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx, "RoleGranted", (ev) => {
      return (
        ev.account.toString() === adminAccount && ev.role === DEFAULT_ADMIN_ROLE
      );
    });
  });
});
