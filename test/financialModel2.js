const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { CommonErrorMsg, FinancialModelErrorMsg } = require("./enumes");

contract("FinancialModel", (accounts) => {
  let arInstance;
  let financialModelInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const treasuryAddress = accounts[9];

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  beforeEach(async () => {
    financialModelInstance = await deployProxy(
      FinancialModel,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );
  });

  afterEach(async () => {});

  // //----------------------------------------- deploy successfully -----------------------------------------//

  it("deploys successfully", async () => {
    const address = financialModelInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  //--------------------------------addFundDistributionModel test-----------------------------------------------
  it("addFundDistributionModel should be success and fail in invalid situation", async () => {
    //////////////---------------- fail invalid access
    await financialModelInstance
      .addFundDistributionModel(4000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    /////////----------- fail sum must be 10000
    await financialModelInstance
      .addFundDistributionModel(8000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: dataManager,
      })
      .should.be.rejectedWith(FinancialModelErrorMsg.SUM_INVALID);

    await financialModelInstance
      .addFundDistributionModel(3000, 1200, 1200, 1200, 1200, 1200, 300, 300, {
        from: dataManager,
      })
      .should.be.rejectedWith(FinancialModelErrorMsg.SUM_INVALID);

    const eventTx = await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    truffleAssert.eventEmitted(eventTx, "DistributionModelAdded", (ev) => {
      return ev.modelId == 0;
    });

    let result = await financialModelInstance.fundDistributions.call(0);

    assert.equal(
      Number(result.planterFund),
      4000,
      "planterFund percent not true"
    );

    assert.equal(
      Number(result.referralFund),
      1200,
      "referralFund percent not true"
    );

    assert.equal(
      Number(result.treeResearch),
      1200,
      "treeResearch percent not true"
    );

    assert.equal(
      Number(result.localDevelop),
      1200,
      "localDevelop percent not true"
    );

    assert.equal(
      Number(result.rescueFund),
      1200,
      "rescueFund percent not true"
    );

    assert.equal(
      Number(result.treejerDevelop),
      1200,
      "planterFund percent not true"
    );

    assert.equal(
      Number(result.reserveFund1),
      0,
      "reserveFund1 percent not true"
    );

    assert.equal(
      Number(result.reserveFund2),
      0,
      "reserveFund2 percent not true"
    );
  });

  //--------------------------------------------assignTreeFundDistributionModel test------------------------------------
  it("1.assignTreeFundDistributionModel should be success", async () => {
    const addTx1 = await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    const addTx2 = await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    const addTx3 = await financialModelInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    const addTx4 = await financialModelInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    truffleAssert.eventEmitted(addTx1, "DistributionModelAdded", (ev) => {
      return ev.modelId == 0;
    });

    truffleAssert.eventEmitted(addTx2, "DistributionModelAdded", (ev) => {
      return ev.modelId == 1;
    });

    truffleAssert.eventEmitted(addTx3, "DistributionModelAdded", (ev) => {
      return ev.modelId == 2;
    });

    truffleAssert.eventEmitted(addTx4, "DistributionModelAdded", (ev) => {
      return ev.modelId == 3;
    });

    const assignTx1 =
      await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
        from: dataManager,
      });

    const assignTx2 =
      await financialModelInstance.assignTreeFundDistributionModel(1, 10, 1, {
        from: dataManager,
      });

    const assignTx3 =
      await financialModelInstance.assignTreeFundDistributionModel(11, 100, 2, {
        from: dataManager,
      });

    const assignTx4 =
      await financialModelInstance.assignTreeFundDistributionModel(
        101,
        1000000,
        3,
        {
          from: dataManager,
        }
      );

    truffleAssert.eventEmitted(
      assignTx1,
      "FundDistributionModelAssigned",
      (ev) => {
        return ev.assignModelsLength == 1;
      }
    );

    truffleAssert.eventEmitted(
      assignTx2,
      "FundDistributionModelAssigned",
      (ev) => {
        return ev.assignModelsLength == 2;
      }
    );

    truffleAssert.eventEmitted(
      assignTx3,
      "FundDistributionModelAssigned",
      (ev) => {
        return ev.assignModelsLength == 3;
      }
    );

    truffleAssert.eventEmitted(
      assignTx4,
      "FundDistributionModelAssigned",
      (ev) => {
        return ev.assignModelsLength == 4;
      }
    );

    let expected = [
      {
        startingTreeId: 0,
        distributionModelId: 0,
      },
      {
        startingTreeId: 1,
        distributionModelId: 1,
      },
      {
        startingTreeId: 11,
        distributionModelId: 2,
      },
      {
        startingTreeId: 101,
        distributionModelId: 3,
      },
    ];

    let resultMaxAssignedIndex =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex),
      1000000,
      "1.maxAssignedIndex not true"
    );

    for (let i = 0; i < 4; i++) {
      let array = await financialModelInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    await financialModelInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: dataManager,
      }
    );

    let resultMaxAssignedIndex2 =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex2),
      2 ** 256 - 1,
      "2.maxAssignedIndex not true"
    );
  });

  it("5.assignTreeFundDistributionModel should be success", async () => {
    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(10, 100, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(1, 0, 1, {
      from: dataManager,
    });

    let resultMaxAssignedIndex1 =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      2 ** 256 - 1,
      "1.maxAssignedIndex not true"
    );
  });

  it("2.assignTreeFundDistributionModel should be success", async () => {
    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: dataManager,
    });

    let expected1 = [
      {
        startingTreeId: 11,
        distributionModelId: 2,
      },
      {
        startingTreeId: 101,
        distributionModelId: 3,
      },
      {
        startingTreeId: 1000001,
        distributionModelId: 0,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await financialModelInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId),
        expected1[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId),
        expected1[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    await financialModelInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: dataManager,
    });

    let resultMaxAssignedIndex1 =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      2 ** 256 - 1,
      "1.maxAssignedIndex not true"
    );

    let expected = [
      {
        startingTreeId: 0,
        distributionModelId: 0,
      },
      {
        startingTreeId: 1,
        distributionModelId: 1,
      },
      {
        startingTreeId: 11,
        distributionModelId: 2,
      },
      {
        startingTreeId: 101,
        distributionModelId: 3,
      },
      {
        startingTreeId: 1000001,
        distributionModelId: 0,
      },
    ];

    for (let i = 0; i < 5; i++) {
      let array = await financialModelInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }
  });

  it("3.assignTreeFundDistributionModel should be success", async () => {
    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: dataManager,
    });

    let expected = [
      {
        startingTreeId: 0,
        distributionModelId: 0,
      },
      {
        startingTreeId: 1,
        distributionModelId: 1,
      },
      {
        startingTreeId: 11,
        distributionModelId: 2,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await financialModelInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    let resultMaxAssignedIndex1 =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      100,
      "1.maxAssignedIndex not true"
    );
  });

  it("4.assignTreeFundDistributionModel should be success", async () => {
    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(1, 2, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(0, 5, 1, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(8, 10, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(3, 9, 2, {
      from: dataManager,
    });

    let expected = [
      {
        startingTreeId: 0,
        distributionModelId: 1,
      },
      {
        startingTreeId: 3,
        distributionModelId: 2,
      },
      {
        startingTreeId: 10,
        distributionModelId: 0,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await financialModelInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    let resultMaxAssignedIndex1 =
      await financialModelInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      10,
      "1.maxAssignedIndex not true"
    );
  });

  it("assignTreeFundDistributionModel should be reject", async () => {
    ///////////------------ fail Distribution model not found

    await financialModelInstance
      .assignTreeFundDistributionModel(0, 0, 0, {
        from: dataManager,
      })
      .should.be.rejectedWith(
        FinancialModelErrorMsg.DISTRIBUTION_MODEL_NOT_FOUND
      );

    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance
      .assignTreeFundDistributionModel(0, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });

  //--------------------------------------------------- DistributionModelOfTreeNotExist ------------------------------------
  it("Check DistributionModelOfTreeNotExist event", async () => {
    let hasModel0 = await financialModelInstance.distributionModelExistance(0);

    assert.equal(hasModel0, false, "hasModel not true");

    let amount = web3.utils.toWei("1", "Ether");

    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(4, 10, 0, {
      from: dataManager,
    });
    let hasModel1 = await financialModelInstance.distributionModelExistance(1);

    let hasModel7 = await financialModelInstance.distributionModelExistance(7);

    let hasModel11 = await financialModelInstance.distributionModelExistance(
      11
    );

    assert.equal(hasModel1, false, "hasModel not true");
    assert.equal(hasModel7, true, "hasModel not true");
    assert.equal(hasModel11, true, "hasModel not true");
  });

  //------------------------------------------- findTreeDistribution ----------------------------------------

  it("fundTree should be fail (invalid fund model)", async () => {
    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );
    await financialModelInstance
      .findTreeDistribution(1)
      .should.be.rejectedWith(FinancialModelErrorMsg.INVALID_FUND_MODEL);

    await financialModelInstance.assignTreeFundDistributionModel(3, 10, 0, {
      from: dataManager,
    });

    await financialModelInstance
      .findTreeDistribution(1)
      .should.be.rejectedWith(FinancialModelErrorMsg.INVALID_FUND_MODEL);
  });
  it("should findTreeDistribution successfully1", async () => {
    let treeId = 10;

    const planterFund = 4000;
    const referralFund = 1200;
    const treeResearch = 1200;
    const localDevelop = 1200;
    const rescueFund = 1200;
    const treejerDevelop = 1200;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    await financialModelInstance.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    let dmModel = await financialModelInstance.findTreeDistribution.call(
      treeId
    );

    const eventTx1 = await financialModelInstance.findTreeDistribution(treeId);

    assert.equal(
      Number(dmModel.planterFund),
      planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(dmModel.referralFund),
      referralFund,
      "referral funds invalid"
    );

    assert.equal(
      Number(dmModel.treeResearch),
      treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel.localDevelop),
      localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel.rescueFund),
      rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel.treejerDevelop),
      treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel.reserveFund1),
      reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel.reserveFund2),
      reserveFund2,
      "reserveFund2 funds invalid"
    );

    let dmModel100 = await financialModelInstance.findTreeDistribution.call(
      100
    );
    let eventTx2 = await financialModelInstance.findTreeDistribution(100);

    assert.equal(
      Number(dmModel100.planterFund),
      planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(dmModel100.referralFund),
      referralFund,
      "referral funds invalid"
    );

    assert.equal(
      Number(dmModel100.treeResearch),
      treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel100.localDevelop),
      localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel100.rescueFund),
      rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel100.treejerDevelop),
      treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserveFund1),
      reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserveFund2),
      reserveFund2,
      "reserveFund2 funds invalid"
    );
  });

  it("should findDistrbutionModel2", async () => {
    let treeId1 = 0;
    let treeId2 = 20;
    const planterFund1 = 4000;
    const referralFund1 = 1200;
    const treeResearch1 = 1200;
    const localDevelop1 = 1200;
    const rescueFund1 = 1200;
    const treejerDevelop1 = 1200;
    const reserveFund1_1 = 0;
    const reserveFund2_1 = 0;

    const planterFund2 = 3000;
    const referralFund2 = 1200;
    const treeResearch2 = 1200;
    const localDevelop2 = 1200;
    const rescueFund2 = 1200;
    const treejerDevelop2 = 1200;
    const reserveFund1_2 = 500;
    const reserveFund2_2 = 500;

    await financialModelInstance.addFundDistributionModel(
      planterFund1,
      referralFund1,
      treeResearch1,
      localDevelop1,
      rescueFund1,
      treejerDevelop1,
      reserveFund1_1,
      reserveFund2_1,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund2,
      referralFund2,
      treeResearch2,
      localDevelop2,
      rescueFund2,
      treejerDevelop2,
      reserveFund1_2,
      reserveFund2_2,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(1, 20, 1, {
      from: dataManager,
    });

    let dmModel2 = await financialModelInstance.findTreeDistribution.call(
      treeId2
    );

    assert.equal(
      Number(dmModel2.planterFund),
      planterFund2,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel2.referralFund),
      referralFund2,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel2.treeResearch),
      treeResearch2,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel2.localDevelop),
      localDevelop2,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel2.rescueFund),
      rescueFund2,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel2.treejerDevelop),
      treejerDevelop2,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel2.reserveFund1),
      reserveFund1_2,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel2.reserveFund2),
      reserveFund2_2,
      "reserveFund2 funds invalid"
    );

    let dmModel1 = await financialModelInstance.findTreeDistribution.call(
      treeId1
    );

    assert.equal(
      Number(dmModel1.planterFund),
      planterFund1,
      "2.planterFund  invalid"
    );

    assert.equal(
      Number(dmModel1.referralFund),
      referralFund1,
      "2.referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treeResearch),
      treeResearch1,
      "2.treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelop),
      localDevelop1,
      "2.localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.rescueFund),
      rescueFund1,
      "2.rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treejerDevelop),
      treejerDevelop1,
      "2.treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund1),
      reserveFund1_1,
      "2.reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund2),
      reserveFund2_1,
      "2.reserveFund2 funds invalid"
    );
  });

  it("should findDistrubutionModel3", async () => {
    const planterFund1 = 8000;
    const referralFund1 = 0;
    const treeResearch1 = 2000;
    const localDevelop1 = 0;
    const rescueFund1 = 0;
    const treejerDevelop1 = 0;
    const reserveFund1_1 = 0;
    const reserveFund2_1 = 0;

    const planterFund2 = 6000;
    const referralFund2 = 0;
    const treeResearch2 = 4000;
    const localDevelop2 = 0;
    const rescueFund2 = 0;
    const treejerDevelop2 = 0;
    const reserveFund1_2 = 0;
    const reserveFund2_2 = 0;

    const planterFund3 = 4000;
    const referralFund3 = 0;
    const treeResearch3 = 6000;
    const localDevelop3 = 0;
    const rescueFund3 = 0;
    const treejerDevelop3 = 0;
    const reserveFund1_3 = 0;
    const reserveFund2_3 = 0;

    const planterFund4 = 2000;
    const referralFund4 = 0;
    const treeResearch4 = 8000;
    const localDevelop4 = 0;
    const rescueFund4 = 0;
    const treejerDevelop4 = 0;
    const reserveFund1_4 = 0;
    const reserveFund2_4 = 0;

    const planterFund5 = 1000;
    const referralFund5 = 0;
    const treeResearch5 = 9000;
    const localDevelop5 = 0;
    const rescueFund5 = 0;
    const treejerDevelop5 = 0;
    const reserveFund1_5 = 0;
    const reserveFund2_5 = 0;

    const planterFund6 = 500;
    const referralFund6 = 0;
    const treeResearch6 = 9500;
    const localDevelop6 = 0;
    const rescueFund6 = 0;
    const treejerDevelop6 = 0;
    const reserveFund1_6 = 0;
    const reserveFund2_6 = 0;

    await financialModelInstance.addFundDistributionModel(
      planterFund1,
      referralFund1,
      treeResearch1,
      localDevelop1,
      rescueFund1,
      treejerDevelop1,
      reserveFund1_1,
      reserveFund2_1,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund2,
      referralFund2,
      treeResearch2,
      localDevelop2,
      rescueFund2,
      treejerDevelop2,
      reserveFund1_2,
      reserveFund2_2,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund3,
      referralFund3,
      treeResearch3,
      localDevelop3,
      rescueFund3,
      treejerDevelop3,
      reserveFund1_3,
      reserveFund2_3,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund4,
      referralFund4,
      treeResearch4,
      localDevelop4,
      rescueFund4,
      treejerDevelop4,
      reserveFund1_4,
      reserveFund2_4,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: dataManager,
    });

    await financialModelInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: dataManager,
    });

    //check treeId 0 model is 0

    const dmModel0 = await financialModelInstance.findTreeDistribution.call(0);

    assert.equal(
      Number(dmModel0.planterFund),
      planterFund1,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel0.referralFund),
      referralFund1,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel0.treeResearch),
      treeResearch1,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel0.localDevelop),
      localDevelop1,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel0.rescueFund),
      rescueFund1,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel0.treejerDevelop),
      treejerDevelop1,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel0.reserveFund1),
      reserveFund1_1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel0.reserveFund2),
      reserveFund2_1,
      "reserveFund2 funds invalid"
    );
    //check treeId 1 model is 2
    const dmModel1 = await financialModelInstance.findTreeDistribution.call(1);

    assert.equal(
      Number(dmModel1.planterFund),
      planterFund2,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1.referralFund),
      referralFund2,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treeResearch),
      treeResearch2,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelop),
      localDevelop2,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.rescueFund),
      rescueFund2,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treejerDevelop),
      treejerDevelop2,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund1),
      reserveFund1_2,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund2),
      reserveFund2_2,
      "reserveFund2 funds invalid"
    );

    //check treeId 5 model is 2

    const dmModel5 = await financialModelInstance.findTreeDistribution.call(5);

    assert.equal(
      Number(dmModel5.planterFund),
      planterFund2,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel5.referralFund),
      referralFund2,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel5.treeResearch),
      treeResearch2,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel5.localDevelop),
      localDevelop2,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel5.rescueFund),
      rescueFund2,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel5.treejerDevelop),
      treejerDevelop2,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel5.reserveFund1),
      reserveFund1_2,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel5.reserveFund2),
      reserveFund2_2,
      "reserveFund2 funds invalid"
    );

    //check treeId 10 model is 2

    const dmModel10 = await financialModelInstance.findTreeDistribution.call(
      10
    );

    assert.equal(
      Number(dmModel10.planterFund),
      planterFund2,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10.referralFund),
      referralFund2,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel10.treeResearch),
      treeResearch2,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel10.localDevelop),
      localDevelop2,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10.rescueFund),
      rescueFund2,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel10.treejerDevelop),
      treejerDevelop2,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10.reserveFund1),
      reserveFund1_2,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel10.reserveFund2),
      reserveFund2_2,
      "reserveFund2 funds invalid"
    );

    //check treeId 11 model is 3
    const dmModel11 = await financialModelInstance.findTreeDistribution.call(
      11
    );

    assert.equal(
      Number(dmModel11.planterFund),
      planterFund3,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel11.referralFund),
      referralFund3,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel11.treeResearch),
      treeResearch3,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel11.localDevelop),
      localDevelop3,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel11.rescueFund),
      rescueFund3,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel11.treejerDevelop),
      treejerDevelop3,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel11.reserveFund1),
      reserveFund1_3,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel11.reserveFund2),
      reserveFund2_3,
      "reserveFund2 funds invalid"
    );

    //check treeId 99 model is 3

    const dmModel99 = await financialModelInstance.findTreeDistribution.call(
      99
    );

    assert.equal(
      Number(dmModel99.planterFund),
      planterFund3,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel99.referralFund),
      referralFund3,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel99.treeResearch),
      treeResearch3,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel99.localDevelop),
      localDevelop3,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel99.rescueFund),
      rescueFund3,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel99.treejerDevelop),
      treejerDevelop3,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel99.reserveFund1),
      reserveFund1_3,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel99.reserveFund2),
      reserveFund2_3,
      "reserveFund2 funds invalid"
    );

    //check treeId 100 model is 3

    const dmModel100 = await financialModelInstance.findTreeDistribution.call(
      100
    );

    assert.equal(
      Number(dmModel100.planterFund),
      planterFund3,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel100.referralFund),
      referralFund3,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel100.treeResearch),
      treeResearch3,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel100.localDevelop),
      localDevelop3,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel100.rescueFund),
      rescueFund3,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel100.treejerDevelop),
      treejerDevelop3,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserveFund1),
      reserveFund1_3,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserveFund2),
      reserveFund2_3,
      "reserveFund2 funds invalid"
    );

    //check treeId 101 model is 4

    const dmModel101 = await financialModelInstance.findTreeDistribution.call(
      101
    );

    assert.equal(
      Number(dmModel101.planterFund),
      planterFund4,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel101.referralFund),
      referralFund4,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel101.treeResearch),
      treeResearch4,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel101.localDevelop),
      localDevelop4,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel101.rescueFund),
      rescueFund4,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel101.treejerDevelop),
      treejerDevelop4,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel101.reserveFund1),
      reserveFund1_4,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel101.reserveFund2),
      reserveFund2_4,
      "reserveFund2 funds invalid"
    );

    //check treeId 1500 model is 4

    const dmModel1500 = await financialModelInstance.findTreeDistribution.call(
      1500
    );

    assert.equal(
      Number(dmModel1500.planterFund),
      planterFund4,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1500.referralFund),
      referralFund4,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel1500.treeResearch),
      treeResearch4,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel1500.localDevelop),
      localDevelop4,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1500.rescueFund),
      rescueFund4,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel1500.treejerDevelop),
      treejerDevelop4,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1500.reserveFund1),
      reserveFund1_4,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel1500.reserveFund2),
      reserveFund2_4,
      "reserveFund2 funds invalid"
    );

    //check treeId 1000000 model is 4

    const dmModel1000000 =
      await financialModelInstance.findTreeDistribution.call(1000000);

    assert.equal(
      Number(dmModel1000000.planterFund),
      planterFund4,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1000000.referralFund),
      referralFund4,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.treeResearch),
      treeResearch4,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.localDevelop),
      localDevelop4,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.rescueFund),
      rescueFund4,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.treejerDevelop),
      treejerDevelop4,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.reserveFund1),
      reserveFund1_4,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.reserveFund2),
      reserveFund2_4,
      "reserveFund2 funds invalid"
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund5,
      referralFund5,
      treeResearch5,
      localDevelop5,
      rescueFund5,
      treejerDevelop5,
      reserveFund1_5,
      reserveFund2_5,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      5000,
      10000,
      4,
      {
        from: dataManager,
      }
    );

    //check treeId 4999 model is 4
    const dmModel4999 = await financialModelInstance.findTreeDistribution.call(
      4999
    );

    assert.equal(
      Number(dmModel4999.planterFund),
      planterFund4,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel4999.referralFund),
      referralFund4,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel4999.treeResearch),
      treeResearch4,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel4999.localDevelop),
      localDevelop4,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel4999.rescueFund),
      rescueFund4,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel4999.treejerDevelop),
      treejerDevelop4,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel4999.reserveFund1),
      reserveFund1_4,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel4999.reserveFund2),
      reserveFund2_4,
      "reserveFund2 funds invalid"
    );

    //check treeId 5000 model is 5

    const dmModel5000 = await financialModelInstance.findTreeDistribution.call(
      5000
    );

    assert.equal(
      Number(dmModel5000.planterFund),
      planterFund5,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel5000.referralFund),
      referralFund5,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel5000.treeResearch),
      treeResearch5,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel5000.localDevelop),
      localDevelop5,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel5000.rescueFund),
      rescueFund5,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel5000.treejerDevelop),
      treejerDevelop5,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel5000.reserveFund1),
      reserveFund1_5,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel5000.reserveFund2),
      reserveFund2_5,
      "reserveFund2 funds invalid"
    );

    //check treeId 6000 model is 5

    const dmModel6000 = await financialModelInstance.findTreeDistribution.call(
      6000
    );

    assert.equal(
      Number(dmModel6000.planterFund),
      planterFund5,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel6000.referralFund),
      referralFund5,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel6000.treeResearch),
      treeResearch5,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel6000.localDevelop),
      localDevelop5,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel6000.rescueFund),
      rescueFund5,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel6000.treejerDevelop),
      treejerDevelop5,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel6000.reserveFund1),
      reserveFund1_5,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel6000.reserveFund2),
      reserveFund2_5,
      "reserveFund2 funds invalid"
    );

    //check treeId 10000 model is 5

    const dmModel10000 = await financialModelInstance.findTreeDistribution.call(
      10000
    );

    assert.equal(
      Number(dmModel10000.planterFund),
      planterFund5,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10000.referralFund),
      referralFund5,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel10000.treeResearch),
      treeResearch5,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel10000.localDevelop),
      localDevelop5,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10000.rescueFund),
      rescueFund5,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel10000.treejerDevelop),
      treejerDevelop5,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10000.reserveFund1),
      reserveFund1_5,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel10000.reserveFund2),
      reserveFund2_5,
      "reserveFund2 funds invalid"
    );

    //check treeId 10001 model is 4
    const dmModel10001 = await financialModelInstance.findTreeDistribution.call(
      10001
    );

    assert.equal(
      Number(dmModel10001.planterFund),
      planterFund4,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10001.referralFund),
      referralFund4,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel10001.treeResearch),
      treeResearch4,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel10001.localDevelop),
      localDevelop4,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10001.rescueFund),
      rescueFund4,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel10001.treejerDevelop),
      treejerDevelop4,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10001.reserveFund1),
      reserveFund1_4,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel10001.reserveFund2),
      reserveFund2_4,
      "reserveFund2 funds invalid"
    );

    await financialModelInstance.addFundDistributionModel(
      planterFund6,
      referralFund6,
      treeResearch6,
      localDevelop6,
      rescueFund6,
      treejerDevelop6,
      reserveFund1_6,
      reserveFund2_6,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(4, 10, 5, {
      from: dataManager,
    });

    //check treeId 4 model is 6
    const dmModel4 = await financialModelInstance.findTreeDistribution.call(4);
    assert.equal(
      Number(dmModel4.planterFund),
      planterFund6,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel4.referralFund),
      referralFund6,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel4.treeResearch),
      treeResearch6,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel4.localDevelop),
      localDevelop6,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel4.rescueFund),
      rescueFund6,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel4.treejerDevelop),
      treejerDevelop6,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel4.reserveFund1),
      reserveFund1_6,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel4.reserveFund2),
      reserveFund2_6,
      "reserveFund2 funds invalid"
    );

    //check treeId 10_2 model is 6
    const dmModel10_2 = await financialModelInstance.findTreeDistribution.call(
      10
    );

    assert.equal(
      Number(dmModel10_2.planterFund),
      planterFund6,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10_2.referralFund),
      referralFund6,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.treeResearch),
      treeResearch6,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.localDevelop),
      localDevelop6,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.rescueFund),
      rescueFund6,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.treejerDevelop),
      treejerDevelop6,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.reserveFund1),
      reserveFund1_6,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.reserveFund2),
      reserveFund2_6,
      "reserveFund2 funds invalid"
    );

    //check treeId 11_2 model is 3

    const dmModel11_2 = await financialModelInstance.findTreeDistribution.call(
      11
    );
    assert.equal(
      Number(dmModel11_2.planterFund),
      planterFund3,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel11_2.referralFund),
      referralFund3,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.treeResearch),
      treeResearch3,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.localDevelop),
      localDevelop3,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.rescueFund),
      rescueFund3,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.treejerDevelop),
      treejerDevelop3,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.reserveFund1),
      reserveFund1_3,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.reserveFund2),
      reserveFund2_3,
      "reserveFund2 funds invalid"
    );

    //check treeId 3 model is 2

    assert.equal(
      Number(dmModel1.planterFund),
      planterFund2,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1.referralFund),
      referralFund2,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treeResearch),
      treeResearch2,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelop),
      localDevelop2,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.rescueFund),
      rescueFund2,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(dmModel1.treejerDevelop),
      treejerDevelop2,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund1),
      reserveFund1_2,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserveFund2),
      reserveFund2_2,
      "reserveFund2 funds invalid"
    );
  });

  ////////--------------------------- test getFindDistributionModelId --------------------------
  it("1.getFindDistributionModelId should be success", async () => {
    const addTx1 = await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    const addTx2 = await financialModelInstance.addFundDistributionModel(
      3000,
      2200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    const addTx3 = await financialModelInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: dataManager,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: dataManager,
    });

    let modelId = await financialModelInstance.getFindDistributionModelId(0);

    assert.equal(modelId, 0, "1.modelId not true");

    ///////////////

    await financialModelInstance.assignTreeFundDistributionModel(1, 10, 2, {
      from: dataManager,
    });

    let modelId2 = await financialModelInstance.getFindDistributionModelId(2);

    assert.equal(modelId2, 2, "2.modelId not true");

    ///////////////

    await financialModelInstance.assignTreeFundDistributionModel(10, 100, 1, {
      from: dataManager,
    });

    let modelId3 = await financialModelInstance.getFindDistributionModelId(15);

    assert.equal(modelId3, 1, "3.modelId not true");

    let modelId4 = await financialModelInstance.getFindDistributionModelId(3);

    assert.equal(modelId4, 2, "4.modelId not true");
  });
});
