const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const AccessRestriction = contract.fromArtifact("AccessRestriction");
const Allocation = contract.fromArtifact("Allocation");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { CommonErrorMsg, AllocationErrorMsg } = require("./enumes");

describe("Allocation", () => {
  let arInstance;
  let allocationInstance;

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
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  beforeEach(async () => {
    allocationInstance = await Allocation.new({
      from: deployerAccount,
    });

    await allocationInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});

  // //----------------------------------------- deploy successfully -----------------------------------------//

  it("deploys successfully", async () => {
    const address = allocationInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  //--------------------------------addAllocationData test-----------------------------------------------
  it("addAllocationData should be success and fail in invalid situation", async () => {
    //////////////---------------- fail invalid access
    await allocationInstance
      .addAllocationData(4000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    /////////----------- fail sum must be 10000
    await allocationInstance
      .addAllocationData(8000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: dataManager,
      })
      .should.be.rejectedWith(AllocationErrorMsg.SUM_INVALID);

    await allocationInstance
      .addAllocationData(3000, 1200, 1200, 1200, 1200, 1200, 300, 300, {
        from: dataManager,
      })
      .should.be.rejectedWith(AllocationErrorMsg.SUM_INVALID);

    const eventTx = await allocationInstance.addAllocationData(
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

    truffleAssert.eventEmitted(eventTx, "AllocationDataAdded", (ev) => {
      return ev.allocationDataId == 0;
    });

    let result = await allocationInstance.allocations.call(0);

    assert.equal(
      Number(result.planterShare),
      4000,
      "planterShare percent not true"
    );

    assert.equal(
      Number(result.ambassadorShare),
      1200,
      "ambassadorShare percent not true"
    );

    assert.equal(
      Number(result.researchShare),
      1200,
      "researchShare percent not true"
    );

    assert.equal(
      Number(result.localDevelopmentShare),
      1200,
      "localDevelopmentShare percent not true"
    );

    assert.equal(
      Number(result.insuranceShare),
      1200,
      "insuranceShare percent not true"
    );

    assert.equal(
      Number(result.treasuryShare),
      1200,
      "planterShare percent not true"
    );

    assert.equal(
      Number(result.reserve1Share),
      0,
      "reserve1Share percent not true"
    );

    assert.equal(
      Number(result.reserve2Share),
      0,
      "reserve2Share percent not true"
    );
  });

  //--------------------------------------------assignAllocationToTree test------------------------------------
  it("1.assignAllocationToTree should be success", async () => {
    const addTx1 = await allocationInstance.addAllocationData(
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

    const addTx2 = await allocationInstance.addAllocationData(
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

    const addTx3 = await allocationInstance.addAllocationData(
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

    const addTx4 = await allocationInstance.addAllocationData(
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

    truffleAssert.eventEmitted(addTx1, "AllocationDataAdded", (ev) => {
      return ev.allocationDataId == 0;
    });

    truffleAssert.eventEmitted(addTx2, "AllocationDataAdded", (ev) => {
      return ev.allocationDataId == 1;
    });

    truffleAssert.eventEmitted(addTx3, "AllocationDataAdded", (ev) => {
      return ev.allocationDataId == 2;
    });

    truffleAssert.eventEmitted(addTx4, "AllocationDataAdded", (ev) => {
      return ev.allocationDataId == 3;
    });

    const assignTx1 = await allocationInstance.assignAllocationToTree(0, 0, 0, {
      from: dataManager,
    });

    const assignTx2 = await allocationInstance.assignAllocationToTree(
      1,
      10,
      1,
      {
        from: dataManager,
      }
    );

    const assignTx3 = await allocationInstance.assignAllocationToTree(
      11,
      100,
      2,
      {
        from: dataManager,
      }
    );

    const assignTx4 = await allocationInstance.assignAllocationToTree(
      101,
      1000000,
      3,
      {
        from: dataManager,
      }
    );

    truffleAssert.eventEmitted(assignTx1, "AllocationToTreeAssigned", (ev) => {
      return ev.allocationToTreesLength == 1;
    });

    truffleAssert.eventEmitted(assignTx2, "AllocationToTreeAssigned", (ev) => {
      return ev.allocationToTreesLength == 2;
    });

    truffleAssert.eventEmitted(assignTx3, "AllocationToTreeAssigned", (ev) => {
      return ev.allocationToTreesLength == 3;
    });

    truffleAssert.eventEmitted(assignTx4, "AllocationToTreeAssigned", (ev) => {
      return ev.allocationToTreesLength == 4;
    });

    let expected = [
      {
        startingTreeId: 0,
        allocationDataId: 0,
      },
      {
        startingTreeId: 1,
        allocationDataId: 1,
      },
      {
        startingTreeId: 11,
        allocationDataId: 2,
      },
      {
        startingTreeId: 101,
        allocationDataId: 3,
      },
    ];

    let resultMaxAssignedIndex = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex),
      1000000,
      "1.maxAssignedIndex not true"
    );

    for (let i = 0; i < 4; i++) {
      let array = await allocationInstance.allocationToTrees(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.allocationDataId),
        expected[i].allocationDataId,
        i + " allocationDataId not true"
      );
    }

    await allocationInstance.assignAllocationToTree(1000001, 0, 0, {
      from: dataManager,
    });

    let resultMaxAssignedIndex2 = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex2),
      2 ** 256 - 1,
      "2.maxAssignedIndex not true"
    );
  });

  it("5.assignAllocationToTree should be success", async () => {
    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.assignAllocationToTree(10, 100, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(1, 0, 1, {
      from: dataManager,
    });

    let resultMaxAssignedIndex1 = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      2 ** 256 - 1,
      "1.maxAssignedIndex not true"
    );
  });

  it("2.assignAllocationToTree should be success", async () => {
    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.assignAllocationToTree(1000001, 0, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(101, 1000000, 3, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(11, 100, 2, {
      from: dataManager,
    });

    let expected1 = [
      {
        startingTreeId: 11,
        allocationDataId: 2,
      },
      {
        startingTreeId: 101,
        allocationDataId: 3,
      },
      {
        startingTreeId: 1000001,
        allocationDataId: 0,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await allocationInstance.allocationToTrees(i);
      assert.equal(
        Number(array.startingTreeId),
        expected1[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.allocationDataId),
        expected1[i].allocationDataId,
        i + " allocationDataId not true"
      );
    }

    await allocationInstance.assignAllocationToTree(1, 10, 1, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(0, 0, 0, {
      from: dataManager,
    });

    let resultMaxAssignedIndex1 = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      2 ** 256 - 1,
      "1.maxAssignedIndex not true"
    );

    let expected = [
      {
        startingTreeId: 0,
        allocationDataId: 0,
      },
      {
        startingTreeId: 1,
        allocationDataId: 1,
      },
      {
        startingTreeId: 11,
        allocationDataId: 2,
      },
      {
        startingTreeId: 101,
        allocationDataId: 3,
      },
      {
        startingTreeId: 1000001,
        allocationDataId: 0,
      },
    ];

    for (let i = 0; i < 5; i++) {
      let array = await allocationInstance.allocationToTrees(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.allocationDataId),
        expected[i].allocationDataId,
        i + " allocationDataId not true"
      );
    }
  });

  it("3.assignAllocationToTree should be success", async () => {
    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.assignAllocationToTree(11, 100, 2, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(0, 0, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(1, 10, 1, {
      from: dataManager,
    });

    let expected = [
      {
        startingTreeId: 0,
        allocationDataId: 0,
      },
      {
        startingTreeId: 1,
        allocationDataId: 1,
      },
      {
        startingTreeId: 11,
        allocationDataId: 2,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await allocationInstance.allocationToTrees(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.allocationDataId),
        expected[i].allocationDataId,
        i + " allocationDataId not true"
      );
    }

    let resultMaxAssignedIndex1 = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      100,
      "1.maxAssignedIndex not true"
    );
  });

  it("4.assignAllocationToTree should be success", async () => {
    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.addAllocationData(
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

    await allocationInstance.assignAllocationToTree(1, 2, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(0, 5, 1, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(8, 10, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(3, 9, 2, {
      from: dataManager,
    });

    let expected = [
      {
        startingTreeId: 0,
        allocationDataId: 1,
      },
      {
        startingTreeId: 3,
        allocationDataId: 2,
      },
      {
        startingTreeId: 10,
        allocationDataId: 0,
      },
    ];

    for (let i = 0; i < 3; i++) {
      let array = await allocationInstance.allocationToTrees(i);
      assert.equal(
        Number(array.startingTreeId),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.allocationDataId),
        expected[i].allocationDataId,
        i + " allocationDataId not true"
      );
    }

    let resultMaxAssignedIndex1 = await allocationInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      10,
      "1.maxAssignedIndex not true"
    );
  });

  it("assignAllocationToTree should be reject", async () => {
    ///////////------------ fail allocation data not found

    await allocationInstance
      .assignAllocationToTree(0, 0, 0, {
        from: dataManager,
      })
      .should.be.rejectedWith(AllocationErrorMsg.ALLOCATION_MODEL_NOT_FOUND);

    await allocationInstance.addAllocationData(
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

    await allocationInstance
      .assignAllocationToTree(0, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);
  });

  //--------------------------------------------------- exists ------------------------------------
  it("Check AllocationDataExist event", async () => {
    let hasAllocation0 = await allocationInstance.exists(0);

    assert.equal(hasAllocation0, false, "hasAllocation not true");

    await allocationInstance.addAllocationData(
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

    await allocationInstance.assignAllocationToTree(4, 10, 0, {
      from: dataManager,
    });
    let hasAllocation1 = await allocationInstance.exists(1);

    let hasAllocation7 = await allocationInstance.exists(7);

    let hasAllocation11 = await allocationInstance.exists(11);

    assert.equal(hasAllocation1, false, "hasAllocation not true");
    assert.equal(hasAllocation7, true, "hasAllocation not true");
    assert.equal(hasAllocation11, true, "hasAllocation not true");
  });

  //------------------------------------------- findAllocationData ----------------------------------------

  it("findAllocationData should be fail (invalid allocation data)", async () => {
    await allocationInstance.addAllocationData(
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
    await allocationInstance
      .findAllocationData(1)
      .should.be.rejectedWith(AllocationErrorMsg.INVALID_FUND_MODEL);

    await allocationInstance.assignAllocationToTree(3, 10, 0, {
      from: dataManager,
    });

    await allocationInstance
      .findAllocationData(1)
      .should.be.rejectedWith(AllocationErrorMsg.INVALID_FUND_MODEL);
  });
  it("should findAllocationData successfully1", async () => {
    let treeId = 10;

    const planterShare = 4000;
    const ambassadorShare = 1200;
    const researchShare = 1200;
    const localDevelopmentShare = 1200;
    const insuranceShare = 1200;
    const treasuryShare = 1200;
    const reserve1Share = 0;
    const reserve2Share = 0;

    await allocationInstance.addAllocationData(
      planterShare,
      ambassadorShare,
      researchShare,
      localDevelopmentShare,
      insuranceShare,
      treasuryShare,
      reserve1Share,
      reserve2Share,
      {
        from: dataManager,
      }
    );

    await allocationInstance.assignAllocationToTree(0, 10, 0, {
      from: dataManager,
    });

    let allocationData = await allocationInstance.findAllocationData.call(
      treeId
    );

    await allocationInstance.findAllocationData(treeId);

    assert.equal(
      Number(allocationData.planterShare),
      planterShare,
      "planter funds invalid"
    );

    assert.equal(
      Number(allocationData.ambassadorShare),
      ambassadorShare,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData.researchShare),
      researchShare,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData.localDevelopmentShare),
      localDevelopmentShare,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData.insuranceShare),
      insuranceShare,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData.treasuryShare),
      treasuryShare,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData.reserve1Share),
      reserve1Share,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData.reserve2Share),
      reserve2Share,
      "reserve2 share invalid"
    );

    let allocationData100 = await allocationInstance.findAllocationData.call(
      100
    );
    await allocationInstance.findAllocationData(100);

    assert.equal(
      Number(allocationData100.planterShare),
      planterShare,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData100.ambassadorShare),
      ambassadorShare,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData100.researchShare),
      researchShare,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData100.localDevelopmentShare),
      localDevelopmentShare,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData100.insuranceShare),
      insuranceShare,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData100.treasuryShare),
      treasuryShare,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData100.reserve1Share),
      reserve1Share,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData100.reserve2Share),
      reserve2Share,
      "reserve2 share invalid"
    );
  });

  it("should findAllocationData2", async () => {
    let treeId1 = 0;
    let treeId2 = 20;
    const planterShare1 = 4000;
    const ambassadorShare1 = 1200;
    const researchShare1 = 1200;
    const localDevelopmentShare1 = 1200;
    const insuranceFund1 = 1200;
    const treasury1 = 1200;
    const reserve1Share1 = 0;
    const reserve2Share1 = 0;

    const planterShare2 = 3000;
    const ambassadorShare2 = 1200;
    const researchShare2 = 1200;
    const localDevelopmentShare2 = 1200;
    const insuranceShare2 = 1200;
    const treasuryShare2 = 1200;
    const reserve1Share2 = 500;
    const reserve2Share2 = 500;

    await allocationInstance.addAllocationData(
      planterShare1,
      ambassadorShare1,
      researchShare1,
      localDevelopmentShare1,
      insuranceFund1,
      treasury1,
      reserve1Share1,
      reserve2Share1,
      {
        from: dataManager,
      }
    );

    await allocationInstance.addAllocationData(
      planterShare2,
      ambassadorShare2,
      researchShare2,
      localDevelopmentShare2,
      insuranceShare2,
      treasuryShare2,
      reserve1Share2,
      reserve2Share2,
      {
        from: dataManager,
      }
    );

    await allocationInstance.assignAllocationToTree(0, 10, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(1, 20, 1, {
      from: dataManager,
    });

    let allocationData2 = await allocationInstance.findAllocationData.call(
      treeId2
    );

    assert.equal(
      Number(allocationData2.planterShare),
      planterShare2,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData2.ambassadorShare),
      ambassadorShare2,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData2.researchShare),
      researchShare2,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData2.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData2.insuranceShare),
      insuranceShare2,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData2.treasuryShare),
      treasuryShare2,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData2.reserve1Share),
      reserve1Share2,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData2.reserve2Share),
      reserve2Share2,
      "reserve2 share invalid"
    );

    let allocationData1 = await allocationInstance.findAllocationData.call(
      treeId1
    );

    assert.equal(
      Number(allocationData1.planterShare),
      planterShare1,
      "2.planterShare  invalid"
    );

    assert.equal(
      Number(allocationData1.ambassadorShare),
      ambassadorShare1,
      "2.ambassador share invalid"
    );

    assert.equal(
      Number(allocationData1.researchShare),
      researchShare1,
      "2.research share invalid"
    );

    assert.equal(
      Number(allocationData1.localDevelopmentShare),
      localDevelopmentShare1,
      "2.localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData1.insuranceShare),
      insuranceFund1,
      "2.insurance share invalid"
    );

    assert.equal(
      Number(allocationData1.treasuryShare),
      treasury1,
      "2.treasury share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve1Share),
      reserve1Share1,
      "2.reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve2Share),
      reserve2Share1,
      "2.reserve2 share invalid"
    );
  });

  it("should findAllocationData3", async () => {
    const planterShare1 = 8000;
    const ambassadorShare1 = 0;
    const researchShare1 = 2000;
    const localDevelopmentShare1 = 0;
    const insuranceFund1 = 0;
    const treasury1 = 0;
    const reserve1Share1 = 0;
    const reserve2Share1 = 0;

    const planterShare2 = 6000;
    const ambassadorShare2 = 0;
    const researchShare2 = 4000;
    const localDevelopmentShare2 = 0;
    const insuranceShare2 = 0;
    const treasuryShare2 = 0;
    const reserve1Share2 = 0;
    const reserve2Share2 = 0;

    const planterShare3 = 4000;
    const ambassadorShare3 = 0;
    const researchShare3 = 6000;
    const localDevelopmentShare3 = 0;
    const insuranceShare3 = 0;
    const treasuryShare3 = 0;
    const reserve1Share3 = 0;
    const reserve2Share3 = 0;

    const planterShare4 = 2000;
    const ambassadorShare4 = 0;
    const researchShare4 = 8000;
    const localDevelopmentShare4 = 0;
    const insuranceShare4 = 0;
    const treasuryShare4 = 0;
    const reserve1Share4 = 0;
    const reserve2Share4 = 0;

    const planterShare5 = 1000;
    const ambassadorShare5 = 0;
    const researchShare5 = 9000;
    const localDevelopmentShare5 = 0;
    const insuranceShare5 = 0;
    const treasuryShare5 = 0;
    const reserve1Share5 = 0;
    const reserve2Share5 = 0;

    const planterShare6 = 500;
    const ambassadorShare6 = 0;
    const researchShare6 = 9500;
    const localDevelopmentShare6 = 0;
    const insuranceShare6 = 0;
    const treasuryShare6 = 0;
    const reserve1Share6 = 0;
    const reserve2Share6 = 0;

    await allocationInstance.addAllocationData(
      planterShare1,
      ambassadorShare1,
      researchShare1,
      localDevelopmentShare1,
      insuranceFund1,
      treasury1,
      reserve1Share1,
      reserve2Share1,
      {
        from: dataManager,
      }
    );

    await allocationInstance.addAllocationData(
      planterShare2,
      ambassadorShare2,
      researchShare2,
      localDevelopmentShare2,
      insuranceShare2,
      treasuryShare2,
      reserve1Share2,
      reserve2Share2,
      {
        from: dataManager,
      }
    );

    await allocationInstance.addAllocationData(
      planterShare3,
      ambassadorShare3,
      researchShare3,
      localDevelopmentShare3,
      insuranceShare3,
      treasuryShare3,
      reserve1Share3,
      reserve2Share3,
      {
        from: dataManager,
      }
    );

    await allocationInstance.addAllocationData(
      planterShare4,
      ambassadorShare4,
      researchShare4,
      localDevelopmentShare4,
      insuranceShare4,
      treasuryShare4,
      reserve1Share4,
      reserve2Share4,
      {
        from: dataManager,
      }
    );

    await allocationInstance.assignAllocationToTree(101, 1000000, 3, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(0, 0, 0, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(11, 100, 2, {
      from: dataManager,
    });

    await allocationInstance.assignAllocationToTree(1, 10, 1, {
      from: dataManager,
    });

    //check treeId 0 model is 0

    const allocationData0 = await allocationInstance.findAllocationData.call(0);

    assert.equal(
      Number(allocationData0.planterShare),
      planterShare1,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData0.ambassadorShare),
      ambassadorShare1,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData0.researchShare),
      researchShare1,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData0.localDevelopmentShare),
      localDevelopmentShare1,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData0.insuranceShare),
      insuranceFund1,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData0.treasuryShare),
      treasury1,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData0.reserve1Share),
      reserve1Share1,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData0.reserve2Share),
      reserve2Share1,
      "reserve2 share invalid"
    );
    //check treeId 1 model is 2
    const allocationData1 = await allocationInstance.findAllocationData.call(1);

    assert.equal(
      Number(allocationData1.planterShare),
      planterShare2,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData1.ambassadorShare),
      ambassadorShare2,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData1.researchShare),
      researchShare2,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData1.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData1.insuranceShare),
      insuranceShare2,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData1.treasuryShare),
      treasuryShare2,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve1Share),
      reserve1Share2,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve2Share),
      reserve2Share2,
      "reserve2 share invalid"
    );

    //check treeId 5 model is 2

    const allocationData5 = await allocationInstance.findAllocationData.call(5);

    assert.equal(
      Number(allocationData5.planterShare),
      planterShare2,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData5.ambassadorShare),
      ambassadorShare2,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData5.researchShare),
      researchShare2,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData5.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData5.insuranceShare),
      insuranceShare2,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData5.treasuryShare),
      treasuryShare2,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData5.reserve1Share),
      reserve1Share2,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData5.reserve2Share),
      reserve2Share2,
      "reserve2 share invalid"
    );

    //check treeId 10 model is 2

    const allocationData10 = await allocationInstance.findAllocationData.call(
      10
    );

    assert.equal(
      Number(allocationData10.planterShare),
      planterShare2,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData10.ambassadorShare),
      ambassadorShare2,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData10.researchShare),
      researchShare2,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData10.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData10.insuranceShare),
      insuranceShare2,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData10.treasuryShare),
      treasuryShare2,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData10.reserve1Share),
      reserve1Share2,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData10.reserve2Share),
      reserve2Share2,
      "reserve2 share invalid"
    );

    //check treeId 11 model is 3
    const allocationData11 = await allocationInstance.findAllocationData.call(
      11
    );

    assert.equal(
      Number(allocationData11.planterShare),
      planterShare3,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData11.ambassadorShare),
      ambassadorShare3,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData11.researchShare),
      researchShare3,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData11.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData11.insuranceShare),
      insuranceShare3,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData11.treasuryShare),
      treasuryShare3,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData11.reserve1Share),
      reserve1Share3,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData11.reserve2Share),
      reserve2Share3,
      "reserve2 share invalid"
    );

    //check treeId 99 model is 3

    const allocationData99 = await allocationInstance.findAllocationData.call(
      99
    );

    assert.equal(
      Number(allocationData99.planterShare),
      planterShare3,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData99.ambassadorShare),
      ambassadorShare3,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData99.researchShare),
      researchShare3,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData99.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData99.insuranceShare),
      insuranceShare3,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData99.treasuryShare),
      treasuryShare3,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData99.reserve1Share),
      reserve1Share3,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData99.reserve2Share),
      reserve2Share3,
      "reserve2 share invalid"
    );

    //check treeId 100 model is 3

    const allocationData100 = await allocationInstance.findAllocationData.call(
      100
    );

    assert.equal(
      Number(allocationData100.planterShare),
      planterShare3,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData100.ambassadorShare),
      ambassadorShare3,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData100.researchShare),
      researchShare3,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData100.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData100.insuranceShare),
      insuranceShare3,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData100.treasuryShare),
      treasuryShare3,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData100.reserve1Share),
      reserve1Share3,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData100.reserve2Share),
      reserve2Share3,
      "reserve2 share invalid"
    );

    //check treeId 101 model is 4

    const allocationData101 = await allocationInstance.findAllocationData.call(
      101
    );

    assert.equal(
      Number(allocationData101.planterShare),
      planterShare4,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData101.ambassadorShare),
      ambassadorShare4,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData101.researchShare),
      researchShare4,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData101.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData101.insuranceShare),
      insuranceShare4,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData101.treasuryShare),
      treasuryShare4,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData101.reserve1Share),
      reserve1Share4,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData101.reserve2Share),
      reserve2Share4,
      "reserve2 share invalid"
    );

    //check treeId 1500 model is 4

    const allocationData1500 = await allocationInstance.findAllocationData.call(
      1500
    );

    assert.equal(
      Number(allocationData1500.planterShare),
      planterShare4,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData1500.ambassadorShare),
      ambassadorShare4,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData1500.researchShare),
      researchShare4,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData1500.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData1500.insuranceShare),
      insuranceShare4,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData1500.treasuryShare),
      treasuryShare4,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData1500.reserve1Share),
      reserve1Share4,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData1500.reserve2Share),
      reserve2Share4,
      "reserve2 share invalid"
    );

    //check treeId 1000000 model is 4

    const allocationData1000000 =
      await allocationInstance.findAllocationData.call(1000000);

    assert.equal(
      Number(allocationData1000000.planterShare),
      planterShare4,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData1000000.ambassadorShare),
      ambassadorShare4,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData1000000.researchShare),
      researchShare4,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData1000000.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData1000000.insuranceShare),
      insuranceShare4,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData1000000.treasuryShare),
      treasuryShare4,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData1000000.reserve1Share),
      reserve1Share4,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData1000000.reserve2Share),
      reserve2Share4,
      "reserve2 share invalid"
    );

    await allocationInstance.addAllocationData(
      planterShare5,
      ambassadorShare5,
      researchShare5,
      localDevelopmentShare5,
      insuranceShare5,
      treasuryShare5,
      reserve1Share5,
      reserve2Share5,
      {
        from: dataManager,
      }
    );

    await allocationInstance.assignAllocationToTree(5000, 10000, 4, {
      from: dataManager,
    });

    //check treeId 4999 model is 4
    const allocationData4999 = await allocationInstance.findAllocationData.call(
      4999
    );

    assert.equal(
      Number(allocationData4999.planterShare),
      planterShare4,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData4999.ambassadorShare),
      ambassadorShare4,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData4999.researchShare),
      researchShare4,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData4999.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData4999.insuranceShare),
      insuranceShare4,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData4999.treasuryShare),
      treasuryShare4,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData4999.reserve1Share),
      reserve1Share4,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData4999.reserve2Share),
      reserve2Share4,
      "reserve2 share invalid"
    );

    //check treeId 5000 model is 5

    const allocationData5000 = await allocationInstance.findAllocationData.call(
      5000
    );

    assert.equal(
      Number(allocationData5000.planterShare),
      planterShare5,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData5000.ambassadorShare),
      ambassadorShare5,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData5000.researchShare),
      researchShare5,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData5000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData5000.insuranceShare),
      insuranceShare5,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData5000.treasuryShare),
      treasuryShare5,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData5000.reserve1Share),
      reserve1Share5,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData5000.reserve2Share),
      reserve2Share5,
      "reserve2 share invalid"
    );

    //check treeId 6000 model is 5

    const allocationData6000 = await allocationInstance.findAllocationData.call(
      6000
    );

    assert.equal(
      Number(allocationData6000.planterShare),
      planterShare5,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData6000.ambassadorShare),
      ambassadorShare5,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData6000.researchShare),
      researchShare5,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData6000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData6000.insuranceShare),
      insuranceShare5,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData6000.treasuryShare),
      treasuryShare5,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData6000.reserve1Share),
      reserve1Share5,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData6000.reserve2Share),
      reserve2Share5,
      "reserve2 share invalid"
    );

    //check treeId 10000 model is 5

    const allocationData10000 =
      await allocationInstance.findAllocationData.call(10000);

    assert.equal(
      Number(allocationData10000.planterShare),
      planterShare5,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData10000.ambassadorShare),
      ambassadorShare5,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData10000.researchShare),
      researchShare5,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData10000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData10000.insuranceShare),
      insuranceShare5,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData10000.treasuryShare),
      treasuryShare5,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData10000.reserve1Share),
      reserve1Share5,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData10000.reserve2Share),
      reserve2Share5,
      "reserve2 share invalid"
    );

    //check treeId 10001 model is 4
    const allocationData10001 =
      await allocationInstance.findAllocationData.call(10001);

    assert.equal(
      Number(allocationData10001.planterShare),
      planterShare4,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData10001.ambassadorShare),
      ambassadorShare4,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData10001.researchShare),
      researchShare4,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData10001.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData10001.insuranceShare),
      insuranceShare4,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData10001.treasuryShare),
      treasuryShare4,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData10001.reserve1Share),
      reserve1Share4,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData10001.reserve2Share),
      reserve2Share4,
      "reserve2 share invalid"
    );

    await allocationInstance.addAllocationData(
      planterShare6,
      ambassadorShare6,
      researchShare6,
      localDevelopmentShare6,
      insuranceShare6,
      treasuryShare6,
      reserve1Share6,
      reserve2Share6,
      {
        from: dataManager,
      }
    );

    await allocationInstance.assignAllocationToTree(4, 10, 5, {
      from: dataManager,
    });

    //check treeId 4 model is 6
    const allocationData4 = await allocationInstance.findAllocationData.call(4);
    assert.equal(
      Number(allocationData4.planterShare),
      planterShare6,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData4.ambassadorShare),
      ambassadorShare6,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData4.researchShare),
      researchShare6,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData4.localDevelopmentShare),
      localDevelopmentShare6,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData4.insuranceShare),
      insuranceShare6,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData4.treasuryShare),
      treasuryShare6,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData4.reserve1Share),
      reserve1Share6,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData4.reserve2Share),
      reserve2Share6,
      "reserve2 share invalid"
    );

    //check treeId 10_2 model is 6
    const allocationData10_2 = await allocationInstance.findAllocationData.call(
      10
    );

    assert.equal(
      Number(allocationData10_2.planterShare),
      planterShare6,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData10_2.ambassadorShare),
      ambassadorShare6,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData10_2.researchShare),
      researchShare6,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData10_2.localDevelopmentShare),
      localDevelopmentShare6,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData10_2.insuranceShare),
      insuranceShare6,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData10_2.treasuryShare),
      treasuryShare6,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData10_2.reserve1Share),
      reserve1Share6,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData10_2.reserve2Share),
      reserve2Share6,
      "reserve2 share invalid"
    );

    //check treeId 11_2 model is 3

    const allocationData11_2 = await allocationInstance.findAllocationData.call(
      11
    );
    assert.equal(
      Number(allocationData11_2.planterShare),
      planterShare3,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData11_2.ambassadorShare),
      ambassadorShare3,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData11_2.researchShare),
      researchShare3,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData11_2.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData11_2.insuranceShare),
      insuranceShare3,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData11_2.treasuryShare),
      treasuryShare3,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData11_2.reserve1Share),
      reserve1Share3,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData11_2.reserve2Share),
      reserve2Share3,
      "reserve2 share invalid"
    );

    //check treeId 3 model is 2

    assert.equal(
      Number(allocationData1.planterShare),
      planterShare2,
      "planter share invalid"
    );

    assert.equal(
      Number(allocationData1.ambassadorShare),
      ambassadorShare2,
      "ambassador share invalid"
    );

    assert.equal(
      Number(allocationData1.researchShare),
      researchShare2,
      "research share invalid"
    );

    assert.equal(
      Number(allocationData1.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopment share invalid"
    );

    assert.equal(
      Number(allocationData1.insuranceShare),
      insuranceShare2,
      "insurance share invalid"
    );

    assert.equal(
      Number(allocationData1.treasuryShare),
      treasuryShare2,
      "treasury share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve1Share),
      reserve1Share2,
      "reserve1 share invalid"
    );

    assert.equal(
      Number(allocationData1.reserve2Share),
      reserve2Share2,
      "reserve2 share invalid"
    );
  });
});
