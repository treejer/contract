// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBoxV2 = artifacts.require("TreeBoxV2");
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
  TreeBoxErrorMsg,
  SafeMathErrorMsg,
  erc721ErrorMsg
} = require("./enumes");

contract("TreeBox", accounts => {
  let treeBoxInstance;
  let treeInstance;
  let arInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount2 = accounts[2];
  const userAccount3 = accounts[3];
  const userAccount4 = accounts[4];
  const userAccount5 = accounts[5];
  const treeOwner1 = accounts[6];
  const treeOwner3 = accounts[7];
  const treeOwner2 = accounts[8];
  const treeOwner4 = accounts[9];

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

      treeBoxInstance = await TreeBoxV2.new({
        from: deployerAccount
      });

      await treeBoxInstance.initialize(
        treeInstance.address,
        arInstance.address,
        {
          from: deployerAccount
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
          from: userAccount3
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeBoxInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------- set setTrustedForwarder
      await treeBoxInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount
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
      const data1 = [
        [userAccount2, "ipfs 1", [0, 1]],
        [userAccount3, "ipfs 2", [2, 3]],
        [userAccount2, "ipfs 1", [4, 5]]
      ];

      const data2 = [[userAccount4, "ipfs 3", [6]]];

      const data3 = [[userAccount2, "ipfs 4", [7, 8]]];

      //mint tokens to treeOwner1
      for (let i = 0; i < data1.length; i++) {
        for (let j = 0; j < data1[i][2].length; j++) {
          await treeInstance.safeMint(treeOwner1, data1[i][2][j], {
            from: deployerAccount
          });
        }
      }

      //mint tokens to treeOwner2
      for (let i = 0; i < data2.length; i++) {
        for (let j = 0; j < data2[i][2].length; j++) {
          await treeInstance.safeMint(treeOwner2, data2[i][2][j], {
            from: deployerAccount
          });
        }
      }

      //mint tokens to treeOwner3
      for (let i = 0; i < data3.length; i++) {
        for (let j = 0; j < data3[i][2].length; j++) {
          await treeInstance.safeMint(treeOwner3, data3[i][2][j], {
            from: deployerAccount
          });
        }
      }

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner1
      });

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner2
      });
      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner3
      });

      await treeBoxInstance.create(data1, { from: treeOwner1 });

      for (let i = 0; i < data1.length; i++) {
        const box = await treeBoxInstance.boxes(data1[i][0]);
        assert.equal(box.ipfsHash, data1[i][1], "ipfs is incorrect");
        assert.equal(box.sender, treeOwner1, "sender is incorrect");

        for (let j = 0; j < data1[i][2].length; j++) {
          assert.equal(
            await treeInstance.ownerOf(data1[i][2][j]),
            treeBoxInstance.address,
            "trees didn't transfer to contract"
          );
        }
      }

      ///////----------------- user 2 trees

      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, 0)),
        0,
        "tree index is incorrect"
      );
      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, 1)),
        1,
        "tree index is incorrect"
      );

      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, 2)),
        4,
        "tree index is incorrect"
      );

      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, 3)),
        5,
        "tree index is incorrect"
      );

      ///////----------------- user 3 trees
      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount3, 0)),
        2,
        "tree index is incorrect"
      );
      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount3, 1)),
        3,
        "tree index is incorrect"
      );

      ////////////////////// create treeOwner2
      await treeBoxInstance.create(data2, { from: treeOwner2 });

      for (let i = 0; i < data2.length; i++) {
        const box = await treeBoxInstance.boxes(data2[i][0]);
        assert.equal(box.ipfsHash, data2[i][1], "ipfs is incorrect");
        assert.equal(box.sender, treeOwner2, "sender is incorrect");

        for (let j = 0; j < data2[i][2].length; j++) {
          assert.equal(
            await treeInstance.ownerOf(data2[i][2][j]),
            treeBoxInstance.address,
            "trees didn't transfer to contract"
          );
        }
      }
      ///////----------------- user 4 trees
      assert.equal(
        Number(await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 0)),
        6,
        "tree index is incorrect"
      );

      ////////////////////// fail to create  with treeOwner3 because public key is exists
      await treeBoxInstance
        .create(data3, { from: treeOwner3 })

        .should.be.rejectedWith(TreeBoxErrorMsg.PUBLIC_KEY_EXISTS);

      /////////// ------------------- check approvments and access to token
      const valid_data4 = [[userAccount5, "ipfs 5", [9, 10]]];
      const not_own_data4 = [[userAccount5, "ipfs 5", [11, 12]]];
      const not_exists_data4 = [[userAccount5, "ipfs 5", [200, 255]]];
      const locked_as_gift_data4 = [[userAccount5, "ipfs 5", [0, 1]]];

      ///// mint trees to treeOwner4
      await treeInstance.safeMint(treeOwner4, 9, {
        from: deployerAccount
      });
      await treeInstance.safeMint(treeOwner4, 10, {
        from: deployerAccount
      });

      ///// mint trees to dataManager
      await treeInstance.safeMint(dataManager, 11, {
        from: deployerAccount
      });
      await treeInstance.safeMint(dataManager, 12, {
        from: deployerAccount
      });

      // create tokens that not exists0
      await treeBoxInstance
        .create(not_exists_data4, { from: treeOwner4 })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_NON_EXISTENT_TOKEN);
      //create with tokens that not own and owner also didnt give approve
      await treeBoxInstance
        .create(not_own_data4, { from: treeOwner4 })
        .should.be.rejectedWith(
          erc721ErrorMsg.TRANSFER_FROM_CALLER_APPROVE_PROBLEM
        );
      //------------ create with tokens that not own but owner of tokens give approve
      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: dataManager
      });

      await treeBoxInstance
        .create(not_own_data4, { from: treeOwner4 })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_TOKEN_FROM_NON_OWNER);
      //create with tokens that are locked in contract as gift
      await treeBoxInstance
        .create(locked_as_gift_data4, { from: treeOwner4 })
        .should.be.rejectedWith(erc721ErrorMsg.TRANSFER_TOKEN_FROM_NON_OWNER);

      //no approve
      await treeBoxInstance
        .create(valid_data4, { from: treeOwner4 })
        .should.be.rejectedWith(
          erc721ErrorMsg.TRANSFER_FROM_CALLER_APPROVE_PROBLEM
        );

      //give approve
      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: treeOwner4
      });

      /// call successfully
      await treeBoxInstance.create(valid_data4, { from: treeOwner4 });
    });
  });
  ////////////////////////////////////////////////////////////////////////////////// ali

  describe("create, claim", () => {
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

      treeBoxInstance = await TreeBoxV2.new({
        from: deployerAccount
      });

      await treeBoxInstance.initialize(
        treeInstance.address,
        arInstance.address,
        {
          from: deployerAccount
        }
      );
    });

    it("check Claim function", async () => {
      let sender = treeOwner1;

      const data = [[userAccount2, "ipfs 1", [0, 1, 2]]];

      ///-------------mint tree to sender
      for (let i = 0; i < data.length; i++) {
        for (j = 0; j < data[i][2].length; j++) {
          await treeInstance.safeMint(sender, data[i][2][j], {
            from: deployerAccount
          });
        }
      }

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: sender
      });

      await treeBoxInstance.create(data, { from: sender });

      for (let i = 0; i < data.length; i++) {
        const box = await treeBoxInstance.boxes(data[i][0]);
        assert.equal(box.ipfsHash, data[i][1], "ipfs is incorrect");
        assert.equal(box.sender, sender, "sender is incorrect");

        for (let j = 0; j < data[i][2].length; j++) {
          assert.equal(
            await treeInstance.ownerOf(data[i][2][j]),
            treeBoxInstance.address,
            "trees didn't transfer to contract"
          );
        }

        for (let j = 0; j < data[i][2].length; j++) {
          assert.equal(
            await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, j),
            data[i][2][j],
            "list tree is not correct"
          );
        }
      }

      //-------reject (reciever is not correct)
      await treeBoxInstance
        .claim(userAccount3, {
          from: userAccount4
        })
        .should.be.rejectedWith(TreeBoxErrorMsg.RECIEVER_INCORRECT);

      //-------reject (can't transfer to this address)

      await treeBoxInstance
        .claim(userAccount2, { from: userAccount2 })
        .should.be.rejectedWith(TreeBoxErrorMsg.CANT_TRANSFER_TO_THIS_ADDRESS);

      await arInstance.pause({ from: deployerAccount });

      await treeBoxInstance
        .claim(userAccount2, { from: userAccount2 })
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await arInstance.unpause({ from: deployerAccount });
      //----------success claim
      await treeBoxInstance.claim(userAccount3, { from: userAccount2 });

      //----check data
      const box = await treeBoxInstance.boxes(data[0][0]);

      assert.equal(box.sender, zeroAddress, "sender is incorrect");
      assert.equal(box.ipfsHash, "", "ipfsHash is incorrect");

      for (let j = 0; j < data[0][2].length; j++) {
        assert.equal(
          await treeInstance.ownerOf(data[0][2][j]),
          userAccount3,
          "trees didn't transfer to user account"
        );
      }

      await treeBoxInstance.getTreeOfRecivierByIndex(userAccount2, 0).should.be
        .rejected;

      ///----------------test 2

      let sender2 = userAccount5;

      const data2 = [[userAccount4, "ipfs 2 test", [10, 20, 30]]];

      await treeInstance.safeMint(sender2, 10, {
        from: deployerAccount
      });

      await treeInstance.safeMint(sender2, 20, {
        from: deployerAccount
      });

      await treeInstance.safeMint(sender2, 30, {
        from: deployerAccount
      });

      await treeInstance.safeMint(sender2, 40, {
        from: deployerAccount
      });

      await treeInstance.safeMint(sender2, 50, {
        from: deployerAccount
      });

      await treeInstance.setApprovalForAll(treeBoxInstance.address, true, {
        from: sender2
      });

      await treeBoxInstance.create(data2, { from: sender2 });

      const box2 = await treeBoxInstance.boxes(userAccount4);

      assert.equal(box2.ipfsHash, "ipfs 2 test", "ipfs is incorrect");
      assert.equal(box2.sender, sender2, "sender is incorrect");

      assert.equal(
        await treeInstance.ownerOf(10),
        treeBoxInstance.address,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(20),
        treeBoxInstance.address,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(30),
        treeBoxInstance.address,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(40),
        sender2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(50),
        sender2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 0),
        10,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 1),
        20,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 2),
        30,
        "list tree is not correct"
      );

      await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 3).should.be
        .rejected;

      const data3 = [[userAccount4, "ipfs 3 test", [40, 50]]];

      await treeBoxInstance.create(data3, { from: sender2 });

      const box3 = await treeBoxInstance.boxes(userAccount4);

      assert.equal(box3.ipfsHash, "ipfs 3 test", "ipfs is incorrect");
      assert.equal(box3.sender, sender2, "sender is incorrect");

      assert.equal(
        await treeInstance.ownerOf(40),
        treeBoxInstance.address,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(50),
        treeBoxInstance.address,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 0),
        10,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 1),
        20,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 2),
        30,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 3),
        40,
        "list tree is not correct"
      );

      assert.equal(
        await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 4),
        50,
        "list tree is not correct"
      );

      //-------reject (reciever is not correct)
      await treeBoxInstance
        .claim(userAccount3, {
          from: userAccount2
        })
        .should.be.rejectedWith(TreeBoxErrorMsg.RECIEVER_INCORRECT);

      //-------reject (can't transfer to this address)

      await treeBoxInstance
        .claim(userAccount4, { from: userAccount4 })
        .should.be.rejectedWith(TreeBoxErrorMsg.CANT_TRANSFER_TO_THIS_ADDRESS);

      //----------success claim
      await treeBoxInstance
        .claim(arInstance.address, { from: userAccount4 })
        .should.be.rejectedWith(
          "Reason given: ERC721: transfer to non ERC721Receiver implementer"
        );

      //----------success claim
      await treeBoxInstance.claim(treeOwner2, { from: userAccount4 });

      //-------reject (reciever is not correct)
      await treeBoxInstance
        .claim(treeOwner2, { from: userAccount4 })
        .should.be.rejectedWith(TreeBoxErrorMsg.RECIEVER_INCORRECT);

      //--------------check data

      const box4 = await treeBoxInstance.boxes(userAccount4);

      assert.equal(box4.ipfsHash, "", "ipfs is incorrect");
      assert.equal(box4.sender, zeroAddress, "sender is incorrect");

      assert.equal(
        await treeInstance.ownerOf(10),
        treeOwner2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(20),
        treeOwner2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(30),
        treeOwner2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(40),
        treeOwner2,
        "trees didn't transfer to contract"
      );

      assert.equal(
        await treeInstance.ownerOf(50),
        treeOwner2,
        "trees didn't transfer to contract"
      );

      await treeBoxInstance.getTreeOfRecivierByIndex(userAccount4, 0).should.be
        .rejected;
    });
  });
});
