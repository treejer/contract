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
  it("should fund tree succesfully", async () => {
    const treeId = 5;
    const treeId2 = 10;
    const treeId3 = 12;
    const amount = web3.utils.toWei("1");
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await treasuryManagerInstance.addFundDistributionModel(
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
    await treasuryManagerInstance.addFundDistributionModel(
      5000,
      1000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(3, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 15, 1, {
      from: deployerAccount,
    });
    let a1 = await treasuryManagerInstance.assignModels.call(0);
    // let a2 = await treasuryManagerInstance.assignModels.call(1);
    console.log("a1", a1);
    // console.log("a2", a2);

    // await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    // await treasuryManagerInstance.fundTree(treeId, amount, {
    //   from: userAccount1,
    // });
    // await treasuryManagerInstance.fundTree(treeId2, amount, {
    //   from: userAccount1,
    // });
    // await treasuryManagerInstance.fundTree(treeId3, amount, {
    //   from: userAccount1,
    // });
  });
  // it("data must be correct after fund tree", async () => {
  //   const treeId = 12;
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
  // it("fund with invalid", async () => {
  //   //treeid =1
  //   //assign (3,0) start from 3 to 10 with model 0
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

  //  //************************************ fund planter test ****************************************//
  // it("fund planter successfully", async () => {
  //   await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   const planterFund = 5000;
  //   const gbFund = 1000;
  //   const treeResearch = 1000;
  //   const localDevelop = 1000;
  //   const rescueFund = 1000;
  //   const treejerDevelop = 1000;
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
  //   await treasuryManagerInstance.fundPlanter(treeId, userAccount2, 25920, {
  //     from: userAccount1,
  //   });
  // });
  // it("check fund planter data to be ok1", async () => {
  //   await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   const planterFund = 5000;
  //   const gbFund = 1000;
  //   const treeResearch = 1000;
  //   const localDevelop = 1000;
  //   const rescueFund = 1000;
  //   const treejerDevelop = 1000;
  //   const otherFund1 = 0;
  //   const otherFund2 = 0;
  //   const treeStatus1 = 2592;
  //   const treeStatus2 = 5184;
  //   const treeStatus3 = 12960;
  //   const treeStatus4 = 25920;
  //   const treeStatus5 = 65535; //2^16-1
  //   const finalStatus = 25920;
  //   const planterTotalFunded =
  //     (Number(amount.toString()) * planterFund) / 10000;
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
  //   let fundT = await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  //   const totalFund = await treasuryManagerInstance.totalFunds();
  //   assert.equal(
  //     Number(totalFund.planterFund.toString()),
  //     (amount * planterFund) / 10000,
  //     "total fund is not correct1"
  //   );

  //   let fundP1 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus1,
  //     {
  //       from: userAccount1,
  //     }
  //   );
  //   const totalFund1 = await treasuryManagerInstance.totalFunds();
  //   let planterPaid1 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance1 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()", planterBalance1.toString());
  //   assert.equal(
  //     (amount * planterFund) / 10000 -
  //       (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(totalFund1.planterFund.toString()),
  //     "total fund1 is not ok"
  //   );
  //   // console.log("planterPaid", planterPaid.toString());
  //   assert.equal(
  //     (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(planterPaid1.toString()),
  //     "planter paid is not ok"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(planterBalance1.toString()),
  //     "planter balance is not ok1"
  //   );

  //   ///////////////////////////////
  //   let fundP2 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus1,
  //     { from: userAccount1 }
  //   );
  //   const totalFund2 = await treasuryManagerInstance.totalFunds();
  //   let planterPaid2 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance2 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()2", planterBalance2.toString());
  //   assert.equal(
  //     (amount * planterFund) / 10000 -
  //       (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(totalFund2.planterFund.toString()),
  //     "total fund2 is not ok"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(planterPaid2.toString()),
  //     "planter paid is not ok2"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus1) / finalStatus,
  //     Number(planterBalance2.toString()),
  //     "planter balance is not ok2"
  //   );
  //   /////////////////////////

  //   let fundP3 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus2,
  //     { from: userAccount1 }
  //   );
  //   const totalFund3 = await treasuryManagerInstance.totalFunds();

  //   let planterPaid3 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance3 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()3", planterBalance3.toString());

  //   assert.equal(
  //     (amount * planterFund) / 10000 -
  //       (planterTotalFunded * treeStatus2) / finalStatus,
  //     Number(totalFund3.planterFund.toString()),
  //     "total fund3 is not ok"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus2) / finalStatus,
  //     Number(planterPaid3.toString()),
  //     "planter paid is not ok3"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus2) / finalStatus,
  //     Number(planterBalance3.toString()),
  //     "planter balance is not ok3"
  //   );

  //   // ///////////

  //   let fundP4 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus3,
  //     { from: userAccount1 }
  //   );
  //   const totalFund4 = await treasuryManagerInstance.totalFunds();

  //   let planterPaid4 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance4 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()4", planterBalance4.toString());
  //   assert.equal(
  //     (amount * planterFund) / 10000 -
  //       (planterTotalFunded * treeStatus3) / finalStatus,
  //     Number(totalFund4.planterFund.toString()),
  //     "total fund4 is not ok"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus3) / finalStatus,
  //     Number(planterPaid4.toString()),
  //     "planter paid is not ok4"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus3) / finalStatus,
  //     Number(planterBalance4.toString()),
  //     "planter balance is not ok4"
  //   );
  //   /////////////////

  //   let fundP5 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus4,
  //     { from: userAccount1 }
  //   );
  //   const totalFund5 = await treasuryManagerInstance.totalFunds();
  //   let planterPaid5 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance5 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()5", planterBalance5.toString());
  //   assert.equal(
  //     (amount * planterFund) / 10000 -
  //       (planterTotalFunded * treeStatus4) / finalStatus,
  //     Number(totalFund5.planterFund.toString()),
  //     "total fund5 is not ok"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus4) / finalStatus,
  //     Number(planterPaid5.toString()),
  //     "planter paid is not ok5"
  //   );
  //   assert.equal(
  //     (planterTotalFunded * treeStatus4) / finalStatus,
  //     Number(planterBalance5.toString()),
  //     "planter balance is not ok5"
  //   );
  //   /////////////////

  //   let fundP6 =await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus5,
  //     { from: userAccount1 }
  //   );
  //   const totalFund6 = await treasuryManagerInstance.totalFunds();
  //   let planterPaid6 = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance6 = await treasuryManagerInstance.balances(userAccount2);
  //   console.log("planterBalance.toString()6", planterBalance6.toString());

  //   assert.equal(
  //     (amount * planterFund) / 10000 - planterTotalFunded,
  //     Number(totalFund6.planterFund.toString()),
  //     "total fund6 is not ok"
  //   );
  //   assert.equal(
  //     planterTotalFunded,
  //     Number(planterPaid6.toString()),
  //     "planter paid is not ok6"
  //   );
  //   assert.equal(
  //     planterTotalFunded,
  //     Number(planterBalance6.toString()),
  //     "planter balance is not ok6"
  //   );
  // });

  // it("check fund planter data to be ok1", async () => {
  //   await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
  //   const treeId = 1;
  //   const treeId2 = 2;
  //   const amount = web3.utils.toWei("1");
  //   const amount2 = web3.utils.toWei("2");
  //   const planterFund = 5000;
  //   const gbFund = 1000;
  //   const treeResearch = 1000;
  //   const localDevelop = 1000;
  //   const rescueFund = 1000;
  //   const treejerDevelop = 1000;
  //   const otherFund1 = 0;
  //   const otherFund2 = 0;
  //   const treeStatus = 65535; //2^16-1

  //   const planterTotalFunded =
  //     (Number(amount.toString()) * planterFund) / 10000;
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

  //   let fundT = await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  //   let fundT2 = await treasuryManagerInstance.fundTree(treeId2, amount2, {
  //     from: userAccount1,
  //   });
  //   const totalFunds = await treasuryManagerInstance.totalFunds();
  //   assert.equal(
  //     (planterFund * amount) / 10000 + (planterFund * amount2) / 10000,
  //     Number(totalFunds.planterFund.toString()),
  //     "invalid planter total funds"
  //   );
  //   let fundP = await treasuryManagerInstance.fundPlanter(
  //     treeId,
  //     userAccount2,
  //     treeStatus,
  //     {
  //       from: userAccount1,
  //     }
  //   );

  //   truffleAssert.eventEmitted(fundP, "PlanterFunded", (ev) => {
  //     return (
  //       Number(ev.treeId.toString()) == treeId &&
  //       ev.planterId == userAccount2 &&
  //       Number(ev.amount.toString()) == planterTotalFunded
  //     );
  //   });

  //   const totalFunds2 = await treasuryManagerInstance.totalFunds();
  //   let planterPaid = await treasuryManagerInstance.plantersPaid.call(treeId);
  //   let planterBalance = await treasuryManagerInstance.balances(userAccount2);

  //   assert.equal(
  //     planterTotalFunded,
  //     Number(planterPaid.toString()),
  //     "planter paid is not ok"
  //   );
  //   assert.equal(
  //     planterTotalFunded,
  //     Number(planterBalance.toString()),
  //     "planter balance is not ok1"
  //   );
  //   assert.equal(
  //     (planterFund * amount2) / 10000,
  //     Number(totalFunds2.planterFund.toString()),
  //     "total funds2 is not ok"
  //   );
  // });
  // it("should fail fund planter", async () => {
  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
  //   await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
  //   const treeId = 1;
  //   const treeId2 = 2;
  //   const amount = web3.utils.toWei("1");
  //   const planterFund = 5000;
  //   const gbFund = 1000;
  //   const treeResearch = 1000;
  //   const localDevelop = 1000;
  //   const rescueFund = 1000;
  //   const treejerDevelop = 1000;
  //   const otherFund1 = 0;
  //   const otherFund2 = 0;
  //   const treeStatus = 65535; //2^16-1

  //   const planterTotalFunded =
  //     (Number(amount.toString()) * planterFund) / 10000;

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

  //   let fundT = await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  //   let fundP = await treasuryManagerInstance
  //     .fundPlanter(treeId, userAccount2, treeStatus, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_GENESIS_TREE);

  //   await treasuryManagerInstance
  //     .fundPlanter(treeId2, userAccount2, treeStatus, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(TreesuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
  // });
});
