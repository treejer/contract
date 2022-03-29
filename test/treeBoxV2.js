// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBoxV2 = artifacts.require("TreeBoxV2");
const TestTreeBox = artifacts.require("TestTreeBox");
const TreeNftTest = artifacts.require("TreeNftTest");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

const {
  CommonErrorMsg,
  TreeBoxErrorMsg,
  SafeMathErrorMsg,
  erc721ErrorMsg,
} = require("./enumes");

contract("TreeBox", (accounts) => {
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
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      treeInstance = await TreeNftTest.new({
        from: deployerAccount,
      });

      treeBoxInstance = await TreeBoxV2.new({
        from: deployerAccount,
      });

      await treeBoxInstance.initialize(
        treeInstance.address,
        arInstance.address,
        {
          from: deployerAccount,
        }
      );
    });

    it("deploys successfully and check addresses", async () => {
      const address = treeBoxInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      //-------------- fail to set setTrustedForwarder
      await treeBoxInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount3,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeBoxInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------- set setTrustedForwarder
      await treeBoxInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        arInstance.address,
        await treeBoxInstance.accessRestriction.call(),
        "ar address is incorrect"
      );

      assert.equal(
        treeInstance.address,
        await treeBoxInstance.treeToken.call(),
        "tree token is incorrect"
      );

      assert.equal(
        userAccount2,
        await treeBoxInstance.trustedForwarder.call(),
        "trustedForwarder is incorrect"
      );
    });

    it("create", async () => {
      const data = [
        [userAccount2, "ipfs 1", [0, 1]],
        [userAccount3, "ipfs 2", [2, 3]],
        [userAccount2, "ipfs 1", [4, 5]],
      ];

      //mint tokens to treeOwner1
      for (let i = 0; i < data.length; i++) {
        for (j = 0; j < data[i][2].length; j++) {
          await treeInstance.safeMint(treeOwner1, data[i][2][j], {
            from: deployerAccount,
          });
        }
      }

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner1,
      });

      await treeBoxInstance.create(data, { from: treeOwner1 });

      for (i = 0; i < data.length; i++) {
        const box = await treeBoxInstance.boxes(data[i][0]);
        assert.equal(box.ipfsHash, data[i][1], "ipfs is incorrect");
        assert.equal(box.sender, treeOwner1, "sender is incorrect");

        for (let j = 0; j < data[i][2].length; j++) {
          assert.equal(
            await treeInstance.ownerOf(data[i][2][j]),
            treeBoxInstance.address,
            "trees didn't transfer to contract"
          );
        }

        for (let i = 0; i < 4; i++) {
          console.log(
            "await treeBoxInstance.getTreeOfRecivierByIndex(i)",
            await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, i)
          );
        }
      }
    });
  });
  ////////////////////////////////////////////////////////////////////////////////// ali

  describe("create, claim", () => {
    before(async () => {});

    it("claim", async () => {});
  });
});
