const AccessRestriction = artifacts.require("AccessRestriction");
const TreasuryManager = artifacts.require("TreasuryManager.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreesuryManagerErrorMsg,
} = require("./enumes");

contract("TreasuryManager", (accounts) => {
  let treasuryManagerInstance;
  let arInstance;
  let startTime;
  let endTime;

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

    treasuryManagerInstance = await deployProxy(
      TreasuryManager,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );
  });

  afterEach(async () => {});

  // //************************************ deploy successfully ****************************************//

  // it("deploys successfully", async () => {
  //   const address = treasuryManagerInstance.address;
  //   assert.notEqual(address, 0x0);
  //   assert.notEqual(address, "");
  //   assert.notEqual(address, null);
  //   assert.notEqual(address, undefined);
  // });

  // //--------------------------------addFundDistributionModel test-----------------------------------------------
  // it("addFundDistributionModel should be success", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   let result = await treasuryManagerInstance.fundDistributions.call(0);

  //   assert.equal(
  //     Number(result.planterFund.toString()),
  //     4000,
  //     "planterFund percent not true"
  //   );

  //   assert.equal(
  //     Number(result.gbFund.toString()),
  //     1200,
  //     "gbFund percent not true"
  //   );

  //   assert.equal(
  //     Number(result.treeResearch.toString()),
  //     1200,
  //     "treeResearch percent not true"
  //   );

  //   assert.equal(
  //     Number(result.localDevelop.toString()),
  //     1200,
  //     "localDevelop percent not true"
  //   );

  //   assert.equal(
  //     Number(result.rescueFund.toString()),
  //     1200,
  //     "rescueFund percent not true"
  //   );

  //   assert.equal(
  //     Number(result.treejerDevelop.toString()),
  //     1200,
  //     "planterFund percent not true"
  //   );

  //   assert.equal(
  //     Number(result.otherFund1.toString()),
  //     0,
  //     "otherFund1 percent not true"
  //   );

  //   assert.equal(
  //     Number(result.otherFund2.toString()),
  //     0,
  //     "otherFund2 percent not true"
  //   );
  // });

  // it("addFundDistributionModel should be reject invalid access", async () => {
  //   await treasuryManagerInstance
  //     .addFundDistributionModel(4000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  // });

  // it("addFundDistributionModel should be reject sum must be 10000", async () => {
  //   await treasuryManagerInstance
  //     .addFundDistributionModel(8000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);

  //   await treasuryManagerInstance
  //     .addFundDistributionModel(3000, 1200, 1200, 1200, 1200, 1200, 300, 300, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);
  // });

  // //--------------------------------------------assignTreeFundDistributionModel test------------------------------------
  // it("1.assignTreeFundDistributionModel should be success", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     3000,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     2000,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     1000,
  //     2200,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(
  //     101,
  //     1000000,
  //     3,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   let expected = [
  //     {
  //       startingTreeId: 0,
  //       distributionModelId: 0,
  //     },
  //     {
  //       startingTreeId: 1,
  //       distributionModelId: 1,
  //     },
  //     {
  //       startingTreeId: 11,
  //       distributionModelId: 2,
  //     },
  //     {
  //       startingTreeId: 101,
  //       distributionModelId: 3,
  //     },
  //   ];

  //   let resultMaxAssignedIndex = await treasuryManagerInstance.maxAssignedIndex();

  //   assert.equal(
  //     Number(resultMaxAssignedIndex.toString()),
  //     1000000,
  //     "1.maxAssignedIndex not true"
  //   );

  //   for (let i = 0; i < 4; i++) {
  //     let array = await treasuryManagerInstance.assignModels(i);
  //     assert.equal(
  //       Number(array.startingTreeId.toString()),
  //       expected[i].startingTreeId,
  //       i + " startingTreeId not true"
  //     );

  //     assert.equal(
  //       Number(array.distributionModelId.toString()),
  //       expected[i].distributionModelId,
  //       i + " distributionModelId not true"
  //     );
  //   }

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(
  //     1000001,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   let resultMaxAssignedIndex2 = await treasuryManagerInstance.maxAssignedIndex();

  //   assert.equal(
  //     Number(resultMaxAssignedIndex2.toString()),
  //     2 ** 256 - 1,
  //     "2.maxAssignedIndex not true"
  //   );
  // });

  // it("2.assignTreeFundDistributionModel should be success", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     3000,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     2000,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     1000,
  //     2200,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(
  //     1000001,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(
  //     101,
  //     1000000,
  //     3,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
  //     from: deployerAccount,
  //   });

  //   let expected1 = [
  //     {
  //       startingTreeId: 11,
  //       distributionModelId: 2,
  //     },
  //     {
  //       startingTreeId: 101,
  //       distributionModelId: 3,
  //     },
  //     {
  //       startingTreeId: 1000001,
  //       distributionModelId: 0,
  //     },
  //   ];

  //   for (let i = 0; i < 3; i++) {
  //     let array = await treasuryManagerInstance.assignModels(i);
  //     assert.equal(
  //       Number(array.startingTreeId.toString()),
  //       expected1[i].startingTreeId,
  //       i + " startingTreeId not true"
  //     );

  //     assert.equal(
  //       Number(array.distributionModelId.toString()),
  //       expected1[i].distributionModelId,
  //       i + " distributionModelId not true"
  //     );
  //   }

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
  //     from: deployerAccount,
  //   });

  //   let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

  //   assert.equal(
  //     Number(resultMaxAssignedIndex1.toString()),
  //     2 ** 256 - 1,
  //     "1.maxAssignedIndex not true"
  //   );

  //   let expected = [
  //     {
  //       startingTreeId: 0,
  //       distributionModelId: 0,
  //     },
  //     {
  //       startingTreeId: 1,
  //       distributionModelId: 1,
  //     },
  //     {
  //       startingTreeId: 11,
  //       distributionModelId: 2,
  //     },
  //     {
  //       startingTreeId: 101,
  //       distributionModelId: 3,
  //     },
  //     {
  //       startingTreeId: 1000001,
  //       distributionModelId: 0,
  //     },
  //   ];

  //   for (let i = 0; i < 5; i++) {
  //     let array = await treasuryManagerInstance.assignModels(i);
  //     assert.equal(
  //       Number(array.startingTreeId.toString()),
  //       expected[i].startingTreeId,
  //       i + " startingTreeId not true"
  //     );

  //     assert.equal(
  //       Number(array.distributionModelId.toString()),
  //       expected[i].distributionModelId,
  //       i + " distributionModelId not true"
  //     );
  //   }
  // });

  // it("3.assignTreeFundDistributionModel should be success", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     3000,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     2000,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     1000,
  //     2200,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
  //     from: deployerAccount,
  //   });

  //   let expected = [
  //     {
  //       startingTreeId: 0,
  //       distributionModelId: 0,
  //     },
  //     {
  //       startingTreeId: 1,
  //       distributionModelId: 1,
  //     },
  //     {
  //       startingTreeId: 11,
  //       distributionModelId: 2,
  //     },
  //   ];

  //   for (let i = 0; i < 3; i++) {
  //     let array = await treasuryManagerInstance.assignModels(i);
  //     assert.equal(
  //       Number(array.startingTreeId.toString()),
  //       expected[i].startingTreeId,
  //       i + " startingTreeId not true"
  //     );

  //     assert.equal(
  //       Number(array.distributionModelId.toString()),
  //       expected[i].distributionModelId,
  //       i + " distributionModelId not true"
  //     );
  //   }

  //   let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

  //   assert.equal(
  //     Number(resultMaxAssignedIndex1.toString()),
  //     100,
  //     "1.maxAssignedIndex not true"
  //   );
  // });

  // it("4.assignTreeFundDistributionModel should be success", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     3000,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     2000,
  //     2200,
  //     2200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(1, 2, 0, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(0, 5, 1, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(8, 10, 0, {
  //     from: deployerAccount,
  //   });

  //   await treasuryManagerInstance.assignTreeFundDistributionModel(3, 9, 2, {
  //     from: deployerAccount,
  //   });

  //   let expected = [
  //     {
  //       startingTreeId: 0,
  //       distributionModelId: 1,
  //     },
  //     {
  //       startingTreeId: 3,
  //       distributionModelId: 2,
  //     },
  //     {
  //       startingTreeId: 10,
  //       distributionModelId: 0,
  //     },
  //   ];

  //   for (let i = 0; i < 3; i++) {
  //     let array = await treasuryManagerInstance.assignModels(i);
  //     assert.equal(
  //       Number(array.startingTreeId.toString()),
  //       expected[i].startingTreeId,
  //       i + " startingTreeId not true"
  //     );

  //     assert.equal(
  //       Number(array.distributionModelId.toString()),
  //       expected[i].distributionModelId,
  //       i + " distributionModelId not true"
  //     );
  //   }

  //   let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

  //   assert.equal(
  //     Number(resultMaxAssignedIndex1.toString()),
  //     10,
  //     "1.maxAssignedIndex not true"
  //   );
  // });

  // it("assignTreeFundDistributionModel should be reject invalid access", async () => {
  //   await treasuryManagerInstance.addFundDistributionModel(
  //     4000,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     1200,
  //     0,
  //     0,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await treasuryManagerInstance
  //     .assignTreeFundDistributionModel(0, 0, 0, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  // });

  // ///////////////////////////////////////////////////mahdi
  //  //************************************ fund tree test ****************************************//
  // it("should fund tree succesfully", async () => {
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

  //   await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  // });
  // it("data must be correct after fund tree", async () => {
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   const planterFund = 4000;
  //   const gbFund = 1200;
  //   const treeResearch = 1200;
  //   const localDevelop = 1200;
  //   const rescueFund = 1200;
  //   const treejerDevelop = 1200;
  //   const otherFund1 = 0;
  //   const otherFund2 = 0;

  //   await treasuryManagerInstance.addFundDistributionModel(
  //     planterFund,
  //     gbFund,
  //     treeResearch,
  //     localDevelop,
  //     rescueFund,
  //     treejerDevelop,
  //     otherFund1,
  //     otherFund2,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
  //     from: deployerAccount,
  //   });

  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

  //   let tx = await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  //   const pFund = await treasuryManagerInstance.planterFunds.call(treeId);

  //   assert.equal(
  //     Number(pFund.toString()),
  //     (planterFund / 10000) * Number(web3.utils.toWei("1")),
  //     "planter funds invalid"
  //   );
  //   const tFunds = await treasuryManagerInstance.totalFunds();
  //   assert.equal(
  //     Number(tFunds.planterFund.toString()),
  //     (planterFund / 10000) * Number(web3.utils.toWei("1")),
  //     "planter funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.gbFund.toString()),
  //     (gbFund / 10000) * Number(web3.utils.toWei("1")),
  //     "gb total funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.treeResearch.toString()),
  //     (treeResearch / 10000) * Number(web3.utils.toWei("1")),
  //     "tree research total funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.localDevelop.toString()),
  //     (localDevelop / 10000) * Number(web3.utils.toWei("1")),
  //     "local funds total funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.rescueFund.toString()),
  //     (rescueFund / 10000) * Number(web3.utils.toWei("1")),
  //     "rescue total funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.treejerDevelop.toString()),
  //     (treejerDevelop / 10000) * Number(web3.utils.toWei("1")),
  //     "treejer develop total funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.otherFund1.toString()),
  //     (otherFund1 / 10000) * Number(web3.utils.toWei("1")),
  //     "other1 total  funds invalid"
  //   );
  //   assert.equal(
  //     Number(tFunds.otherFund2.toString()),
  //     (otherFund2 / 10000) * Number(web3.utils.toWei("1")),
  //     "other2 total funds invalid"
  //   );
  // });
  // it("should fund tree fail", async () => {
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   }).should.be.rejected;
  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
  //   await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount2,
  //   }).should.be.rejected;
  // });
});
