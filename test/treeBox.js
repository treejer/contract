// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBox = artifacts.require("TreeBox");
const TreeNftTest = artifacts.require("TreeNftTest");
const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

const {
  CommonErrorMsg,

  PlanterErrorMsg,
  erc721ErrorMsg
} = require("./enumes");

contract("TreeBox", accounts => {
  let treeBoxInstance;
  let treeInstance;
  let arInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const scriptRole = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const treeOwner2 = accounts[8];
  const treeOwner1 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {});

  afterEach(async () => {});
  //////////////////------------------------------------ deploy successfully ----------------------------------------//

  describe("deployment, set address, check access", () => {
    before(async () => {
      arInstance = await AccessRestriction.new({
        from: deployerAccount
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount
      });

      treeInstance = await TreeNftTest.new({
        from: deployerAccount
      });

      treeBoxInstance = await TreeBox.new({
        from: deployerAccount
      });

      await treeBoxInstance.initialize(treeInstance.address, deployerAccount, {
        from: deployerAccount
      });
    });

    it("deploys successfully", async () => {
      const address = treeBoxInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("test admin", async () => {
      await Common.addTreeBoxScript(treeBoxInstance, userAccount3, userAccount6)
        .should.be.rejected;

      assert.equal(
        await treeBoxInstance.hasRole(Common.TREEBOX_SCRIPT, userAccount3),
        false,
        "access is not correct"
      );

      await treeBoxInstance
        .claim(userAccount4, userAccount5, 4)
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEBOX_SCRIPT);

      await Common.addTreeBoxScript(
        treeBoxInstance,
        userAccount3,
        deployerAccount
      );

      assert.equal(
        await treeBoxInstance.hasRole(Common.TREEBOX_SCRIPT, userAccount3),
        true,
        "access is not correct"
      );
    });

    it("test pause", async () => {
      await treeBoxInstance
        .pause({ from: userAccount5 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeBoxInstance
        .unpause({ from: userAccount5 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeBoxInstance.pause({ from: deployerAccount });

      await treeBoxInstance
        .claim(userAccount4, userAccount5, 4)
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await treeBoxInstance.unpause({ from: deployerAccount });

      await treeBoxInstance
        .claim(userAccount4, userAccount5, 4)
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEBOX_SCRIPT);
    });
  });
  ////////////////////////////////////////////////////////////////////////////////// ali

  describe.only("claim", () => {
    before(async () => {
      treeInstance = await TreeNftTest.new({
        from: deployerAccount
      });

      treeBoxInstance = await TreeBox.new({
        from: deployerAccount
      });

      await treeBoxInstance.initialize(treeInstance.address, deployerAccount, {
        from: deployerAccount
      });
    });

    it("update count", async () => {
      const count1 = 10;
      const count2 = 15;

      await treeBoxInstance.updateCount(count1, { from: userAccount2 });

      assert.equal(
        count1,
        Number(await treeBoxInstance.ownerToCount(userAccount2)),
        "user2 count is incorrect"
      );

      await treeBoxInstance.updateCount(count2, { from: userAccount2 });

      assert.equal(
        Math.add(count1, count2),
        Number(await treeBoxInstance.ownerToCount(userAccount2)),
        "user2 count is incorrect"
      );

      await treeBoxInstance.updateCount(count1, { from: userAccount3 });

      assert.equal(
        count1,
        Number(await treeBoxInstance.ownerToCount(userAccount3)),
        "user3 count is incorrect"
      );
    });

    it("claim", async () => {
      /////// mint some tokens to an account
      for (let i = 0; i < 40; i++) {
        await treeInstance.safeMint(treeOwner1, i, { from: deployerAccount });
      }

      /////// -------------- give approve to treeBox
      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner1
      });

      //////////------------------- fail to claim because caller is not TreejerScript Role
      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 0, {
          from: treeOwner1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEBOX_SCRIPT);
      /////------------------ await
    });
  });
});
