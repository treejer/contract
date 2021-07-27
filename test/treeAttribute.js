const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const Treasury = artifacts.require("Treasury.sol");
const Tree = artifacts.require("Tree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
  TreeAttributeErrorMsg,
} = require("./enumes");

contract("IncrementalSell", (accounts) => {
  let iSellInstance;
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let treasuryInstance;
  let treeAttributeInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const treasuryAddress = accounts[9];

  const ipfsHash = "some ipfs hash here";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    treeAttributeInstance = await deployProxy(
      TreeAttribute,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );
    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeAttributeInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
  });
  afterEach(async () => {});

  it("deploys successfully", async () => {
    const address = treeAttributeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("only admin can set treeFactory address", async () => {
    await treeAttributeInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //only admin can call
  });

  it("only admin can call set buyer rank", async () => {
    await treeAttributeInstance
      .setBuyerRank(
        userAccount3,
        web3.utils.toWei("100", "finney"),
        web3.utils.toWei("2"),
        10,
        59,
        {
          from: userAccount3,
        }
      )
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //only admin can call
  });
  it("only admin can call set buyer rank true", async () => {
    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      web3.utils.toWei("100", "finney"),
      web3.utils.toWei("2"),
      10,
      59,
      {
        from: deployerAccount,
      }
    );
  });

  it("tree attributes are not available to reserve", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance
      .reserveTreeAttributes(13000000, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });
  it("attributes to assign tree should be available", async () => {
    const treeAttributeGenerateCode = 13000000;

    await treeAttributeInstance.reserveTreeAttributes(
      treeAttributeGenerateCode,
      {
        from: deployerAccount,
      }
    );

    let x1 = await treeAttributeInstance.reservedAttributes.call(
      treeAttributeGenerateCode
    );
    let y1 = await treeAttributeInstance.generatedAttributes.call(
      treeAttributeGenerateCode
    );

    console.log("x1", x1.toString());
    console.log("y1", y1.toString());

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(
      101,
      treeAttributeGenerateCode,
      {
        from: deployerAccount,
      }
    );

    let x2 = await treeAttributeInstance.reservedAttributes.call(
      treeAttributeGenerateCode
    );
    let y2 = await treeAttributeInstance.generatedAttributes.call(
      treeAttributeGenerateCode
    );

    console.log("x2", x2.toString());
    console.log("y2", y2.toString());

    await treeAttributeInstance
      .setTreeAttributesByAdmin(102, treeAttributeGenerateCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });

  it("tree has attributes before", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(101, 13000000, {
      from: deployerAccount,
    });
    const eventTx = await treeAttributeInstance
      .setTreeAttributesByAdmin(100, 13000002, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("tree has attributes before", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(107, 13000001, {
      from: deployerAccount,
    });
    await treeAttributeInstance
      .createTreeAttributes(107, 13000002, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("tree check for attribute assignment", async () => {
    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await treasuryInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.005"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await iSellInstance.buyTree(102, {
      value: web3.utils.toWei("0.01"),
      from: userAccount3,
    });

    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance.createTreeAttributes(
      102,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await treeAttributeInstance
      .createTreeAttributes(103, web3.utils.toWei("0.01"), {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });

  it("tree check for attribute assignment", async () => {
    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await treasuryInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.005"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await iSellInstance.buyTree(102, {
      value: web3.utils.toWei("0.01"),
      from: userAccount3,
    });

    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .createTreeAttributes(102, web3.utils.toWei("0.01"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });
});
