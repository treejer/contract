const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
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
} = require("./enumes");

contract("IncrementalSell", (accounts) => {
  let iSellInstance;
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let treasuryInstance;

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
    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
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
    // await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
    //   from: deployerAccount,
    // });
    await Common.addRegularSellRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );
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
  });
  afterEach(async () => {});

  it("deploys successfully", async () => {
    const address = iSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  it("should set tree factory address with admin access or fail otherwise", async () => {
    let tx = await iSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );
    await iSellInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
  });

  it("added incrementalSell should has positive tree Count", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 0, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_TO_SELL); //must be faild because treeCount is zero
  });

  it("added incrementalSell should has startTreeId>100", async () => {
    await iSellInstance
      .addTreeSells(98, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.OCCUPIED_TREES); //treeStartId should be >100
  });

  it("added incrementalSell should has steps of price change>0", async () => {
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 0, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS); // steps of price change should be >0
  });
  it("added incrementalSell should have equivalant fund distribution model", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await treasuryInstance.assignTreeFundDistributionModel(105, 10000, 0, {
      from: deployerAccount,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 400, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
  });

  it("added incrementalSell should have equivalant fund distribution model", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(110, 10000, 1, {
      from: deployerAccount,
    });

    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
  });
  it("incrementalSell all trees should be availabe to sell", async () => {
    treeAuctionInstance = await deployProxy(TreeAuction, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    await treeAuctionInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address,{
      from: deployerAccount,
    });
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 1, {
      from: deployerAccount,
    });
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    await treeAuctionInstance.createAuction(
      107,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await iSellInstance
      .addTreeSells(101, web3.utils.toWei("0.005"), 9900, 100, 1000, {
        from: deployerAccount,
      }).should.be.rejectedWith(IncrementalSellErrorMsg.OCCUPIED_TREES); // trees shouldnot be on other provides
  });
  it("buyed Tree should be in incremental sell", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address,{
      from: deployerAccount,
    });
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await treasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );
    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 1, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(105, web3.utils.toWei("0.01"), 9900, 100, 1000, {
      from: deployerAccount,
    });
    await iSellInstance
      .buyTree(102, { value: web3.utils.toWei("1.15") , from : userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);
  });

  it("low price paid for the tree", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      9900,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );
    await iSellInstance
      .buyTree(110, { value: web3.utils.toWei("0.009"), from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
  });

  it("check discount timeout", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      9900,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );
    await iSellInstance.buyTree(110, {
      value: web3.utils.toWei("0.01"),
      from: userAccount3,
    });
    await Common.travelTime(TimeEnumes.minutes, 7);
    await iSellInstance.buyTree(203, {
      value: web3.utils.toWei("0.0099"),
      from: userAccount3,
    });
    await iSellInstance.buyTree(226, {
      value: web3.utils.toWei("0.011"),
      from: userAccount3,
    });
    await Common.travelTime(TimeEnumes.minutes, 12);
    await iSellInstance
      .buyTree(292, { value: web3.utils.toWei("0.0099"), from: userAccount3 })
      .should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
  });
  it("check discount usage", async () => {
    await iSellInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });
    await treasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: deployerAccount,
    });
    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.01"),
      9900,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );
    await iSellInstance.buyTree(110, {
      value: web3.utils.toWei("0.01"),
      from: userAccount3,
    });
    await Common.travelTime(TimeEnumes.minutes, 1);
    await iSellInstance.buyTree(119, {
      value: web3.utils.toWei("0.009"),
      from: userAccount3,
    });
    await Common.travelTime(TimeEnumes.minutes, 5);
    await iSellInstance.buyTree(145, {
      value: web3.utils.toWei("0.009"),
      from: userAccount3,
    });
  });
});
