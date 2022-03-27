// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBox = artifacts.require("TreeBox");
const TestTreeBox = artifacts.require("TestTreeBox");
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

  SafeMathErrorMsg,
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

    it("test deploy", async () => {
      let treeBoxInstance3 = await TestTreeBox.new({
        from: deployerAccount
      });

      await treeBoxInstance3.set(deployerAccount);

      await treeBoxInstance3.initialize(treeInstance.address, deployerAccount, {
        from: deployerAccount
      });

      await treeInstance.setIsTree();

      let treeBoxInstance2 = await TreeBox.new({
        from: deployerAccount
      });

      await treeBoxInstance2.initialize(treeInstance.address, deployerAccount, {
        from: deployerAccount
      }).should.be.rejected;
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

      await treeBoxInstance
        .updateCount(30)
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await treeBoxInstance.unpause({ from: deployerAccount });

      await treeBoxInstance.updateCount(30);

      await treeBoxInstance
        .claim(userAccount4, userAccount5, 4)
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEBOX_SCRIPT);
    });
  });
  ////////////////////////////////////////////////////////////////////////////////// ali

  describe("claim", () => {
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

      await treeInstance.safeMint(treeOwner2, 40, { from: deployerAccount });
      await treeInstance.safeMint(treeOwner2, 41, { from: deployerAccount });

      //////////------------------- fail to claim because caller is not TreejerScript Role
      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 0, {
          from: treeOwner1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEBOX_SCRIPT);
      /////------------------ give script role
      await Common.addTreeBoxScript(
        treeBoxInstance,
        scriptRole,
        deployerAccount
      );
      //////// fail because didn't call updateCount
      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 0, {
          from: scriptRole
        })
        .should.be.rejectedWith(SafeMathErrorMsg.OVER_FLOW);

      ////////-------------- updateCount
      await treeBoxInstance.updateCount(40, { from: treeOwner1 });

      /////// -------------- give approve to treeBox

      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 0, {
          from: scriptRole
        })
        .should.be.rejectedWith(
          erc721ErrorMsg.TRANSFER_FROM_CALLER_APPROVE_PROBLEM
        );

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner1
      });

      ///////----------------- fail with overFlow because count of zero address is 0
      await treeBoxInstance
        .claim(zeroAddress, userAccount2, 0, {
          from: scriptRole
        })
        .should.be.rejectedWith(SafeMathErrorMsg.OVER_FLOW);

      //////////----------------------- fail becuase trransfer to zero address
      await treeBoxInstance
        .claim(treeOwner1, zeroAddress, 0, {
          from: scriptRole
        })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_TO_ZERO_ADDRESS);

      ///////////-------------------- claim successfully
      await treeBoxInstance.claim(treeOwner1, userAccount2, 0, {
        from: scriptRole
      });

      assert.equal(
        Number(await treeBoxInstance.ownerToCount(treeOwner1)),
        39,
        "owner to count is not correct"
      );

      //////-------------------------- fail because token claimed by user2
      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 0, {
          from: scriptRole
        })
        .should.be.rejectedWith(
          erc721ErrorMsg.TRANSFER_FROM_CALLER_APPROVE_PROBLEM
        );

      await treeBoxInstance.claim(treeOwner1, userAccount2, 1, {
        from: scriptRole
      });

      assert.equal(
        Number(await treeBoxInstance.ownerToCount(treeOwner1)),
        38,
        "owner to count is not correct"
      );

      await treeBoxInstance
        .claim(treeOwner1, userAccount2, 50, {
          from: scriptRole
        })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_NON_EXISTENT_TOKEN);

      assert.equal(
        await treeInstance.ownerOf(0),
        userAccount2,
        "owner is incorrect"
      );
      assert.equal(
        await treeInstance.ownerOf(1),
        userAccount2,
        "owner is incorrect"
      );

      assert.equal(
        await treeInstance.ownerOf(2),
        treeOwner1,
        "owner is incorrect"
      );

      ///////////// update count for treeOwner2
      await treeBoxInstance.updateCount(1, { from: treeOwner2 });

      /////------------- fail becuase caller has approve but owner of token is not correct
      await treeBoxInstance
        .claim(treeOwner2, userAccount2, 3, {
          from: scriptRole
        })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_TOKEN_FROM_NON_OWNER);

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner2
      });

      await treeBoxInstance.claim(treeOwner2, userAccount2, 41, {
        from: scriptRole
      });

      await treeBoxInstance
        .claim(treeOwner2, userAccount2, 40, {
          from: scriptRole
        })
        .should.be.rejectedWith(SafeMathErrorMsg.OVER_FLOW);
    });
  });
});
