// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBoxV2 = artifacts.require("TreeBoxV2");
const TreeNftTest = artifacts.require("TreeNftTest");

const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();
const Common = require("./common");

const WhitelistPaymasterTreeBox = artifacts.require(
  "WhitelistPaymasterTreeBox"
);

const TestWhitelistPaymasterTreeBox = artifacts.require(
  "TestWhitelistPaymasterTreeBox"
);

const TestRelayRecipient = artifacts.require("TestRelayRecipient");

const { CommonErrorMsg, GsnErrorMsg } = require("./enumes");

contract("WhitelistPaymasterTreeBox", accounts => {
  let paymasterInstance;
  let arInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const treeOwner1 = accounts[4];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
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

    await treeBoxInstance.initialize(treeInstance.address, arInstance.address, {
      from: deployerAccount
    });

    paymasterInstance = await WhitelistPaymasterTreeBox.new(
      treeBoxInstance.address
    );
  });

  // afterEach(async () => {});

  // //----------------------------------------- deploy successfully -----------------------------------------//

  it("deploys successfully", async () => {
    const address = paymasterInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  // //----------------------------------------- check addPlanterWhitelistTarget function -----------------------------------------//

  it("Should addPlanterWhitelistTarget function work successfully", async () => {
    await WhitelistPaymasterTreeBox.new(userAccount1).should.be.rejected;

    let paymasterInstance2 = await WhitelistPaymasterTreeBox.new(
      treeBoxInstance.address
    );

    assert.equal(
      await paymasterInstance2.treeBox(),
      treeBoxInstance.address,
      "address is not correct"
    );
  });

  // //----------------------------------------- check preRelayedCall function -----------------------------------------//

  it("test preRelayedCall funder", async () => {
    let testInstance = await TestWhitelistPaymasterTreeBox.new({
      from: deployerAccount
    });

    let testRelayRecipientInstance = await TestRelayRecipient.new({
      from: deployerAccount
    });

    await testInstance
      .testPreRelayedCall(
        paymasterInstance.address,
        testRelayRecipientInstance.address,
        userAccount2,
        {
          from: deployerAccount
        }
      )
      .should.be.rejectedWith("user is not valid");

    //--------

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

    await testInstance.testPreRelayedCall(
      paymasterInstance.address,
      testRelayRecipientInstance.address,
      userAccount2,
      {
        from: deployerAccount
      }
    );

    await treeBoxInstance.claim(accounts[5], { from: userAccount2 });

    await testInstance
      .testPreRelayedCall(
        paymasterInstance.address,
        testRelayRecipientInstance.address,
        userAccount2,
        {
          from: deployerAccount
        }
      )
      .should.be.rejectedWith("user is not valid");
  });

  it("test postRelayedCall", async () => {
    //deploy TestWhitelistPaymaster

    testInstance = await TestWhitelistPaymasterTreeBox.new({
      from: deployerAccount
    });

    await testInstance.test(paymasterInstance.address, {
      from: deployerAccount
    });
  });
});
