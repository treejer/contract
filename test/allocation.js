const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Allocation = artifacts.require("Allocation.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { CommonErrorMsg, AllocationErrorMsg } = require("./enumes");

contract("Allocation", (accounts) => {
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
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  beforeEach(async () => {
    allocationInstance = await deployProxy(Allocation, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
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
    ///////////------------ fail Distribution model not found

    await allocationInstance
      .assignAllocationToTree(0, 0, 0, {
        from: dataManager,
      })
      .should.be.rejectedWith(AllocationErrorMsg.DISTRIBUTION_MODEL_NOT_FOUND);

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

  //--------------------------------------------------- DistributionModelOfTreeNotExist ------------------------------------
  it("Check DistributionModelOfTreeNotExist event", async () => {
    let hasModel0 = await allocationInstance.exists(0);

    assert.equal(hasModel0, false, "hasModel not true");

    let amount = web3.utils.toWei("1", "Ether");

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
    let hasModel1 = await allocationInstance.exists(1);

    let hasModel7 = await allocationInstance.exists(7);

    let hasModel11 = await allocationInstance.exists(11);

    assert.equal(hasModel1, false, "hasModel not true");
    assert.equal(hasModel7, true, "hasModel not true");
    assert.equal(hasModel11, true, "hasModel not true");
  });

  //------------------------------------------- findAllocationData ----------------------------------------

  it("fundTree should be fail (invalid fund model)", async () => {
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

    let dmModel = await allocationInstance.findAllocationData.call(treeId);

    const eventTx1 = await allocationInstance.findAllocationData(treeId);

    assert.equal(
      Number(dmModel.planterShare),
      planterShare,
      "planter funds invalid"
    );

    assert.equal(
      Number(dmModel.ambassadorShare),
      ambassadorShare,
      "referral funds invalid"
    );

    assert.equal(
      Number(dmModel.researchShare),
      researchShare,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel.localDevelopmentShare),
      localDevelopmentShare,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel.insuranceShare),
      insuranceShare,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel.treasuryShare),
      treasuryShare,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel.reserve1Share),
      reserve1Share,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel.reserve2Share),
      reserve2Share,
      "reserve2Share funds invalid"
    );

    let dmModel100 = await allocationInstance.findAllocationData.call(100);
    let eventTx2 = await allocationInstance.findAllocationData(100);

    assert.equal(
      Number(dmModel100.planterShare),
      planterShare,
      "planter funds invalid"
    );

    assert.equal(
      Number(dmModel100.ambassadorShare),
      ambassadorShare,
      "referral funds invalid"
    );

    assert.equal(
      Number(dmModel100.researchShare),
      researchShare,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.localDevelopmentShare),
      localDevelopmentShare,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.insuranceShare),
      insuranceShare,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.treasuryShare),
      treasuryShare,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserve1Share),
      reserve1Share,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserve2Share),
      reserve2Share,
      "reserve2Share funds invalid"
    );
  });

  it("should findDistrbutionModel2", async () => {
    let treeId1 = 0;
    let treeId2 = 20;
    const planterShare1 = 4000;
    const ambassadorShare1 = 1200;
    const researchShare1 = 1200;
    const localDevelopmentShare1 = 1200;
    const rescueFund1 = 1200;
    const treejerDevelop1 = 1200;
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
      rescueFund1,
      treejerDevelop1,
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

    let dmModel2 = await allocationInstance.findAllocationData.call(treeId2);

    assert.equal(
      Number(dmModel2.planterShare),
      planterShare2,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel2.ambassadorShare),
      ambassadorShare2,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel2.researchShare),
      researchShare2,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel2.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel2.insuranceShare),
      insuranceShare2,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel2.treasuryShare),
      treasuryShare2,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel2.reserve1Share),
      reserve1Share2,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel2.reserve2Share),
      reserve2Share2,
      "reserve2Share funds invalid"
    );

    let dmModel1 = await allocationInstance.findAllocationData.call(treeId1);

    assert.equal(
      Number(dmModel1.planterShare),
      planterShare1,
      "2.planterShare  invalid"
    );

    assert.equal(
      Number(dmModel1.ambassadorShare),
      ambassadorShare1,
      "2.ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.researchShare),
      researchShare1,
      "2.researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelopmentShare),
      localDevelopmentShare1,
      "2.localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.insuranceShare),
      rescueFund1,
      "2.insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.treasuryShare),
      treejerDevelop1,
      "2.treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve1Share),
      reserve1Share1,
      "2.reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve2Share),
      reserve2Share1,
      "2.reserve2Share funds invalid"
    );
  });

  it("should findDistrubutionModel3", async () => {
    const planterShare1 = 8000;
    const ambassadorShare1 = 0;
    const researchShare1 = 2000;
    const localDevelopmentShare1 = 0;
    const rescueFund1 = 0;
    const treejerDevelop1 = 0;
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
      rescueFund1,
      treejerDevelop1,
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

    const dmModel0 = await allocationInstance.findAllocationData.call(0);

    assert.equal(
      Number(dmModel0.planterShare),
      planterShare1,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel0.ambassadorShare),
      ambassadorShare1,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel0.researchShare),
      researchShare1,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel0.localDevelopmentShare),
      localDevelopmentShare1,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel0.insuranceShare),
      rescueFund1,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel0.treasuryShare),
      treejerDevelop1,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel0.reserve1Share),
      reserve1Share1,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel0.reserve2Share),
      reserve2Share1,
      "reserve2Share funds invalid"
    );
    //check treeId 1 model is 2
    const dmModel1 = await allocationInstance.findAllocationData.call(1);

    assert.equal(
      Number(dmModel1.planterShare),
      planterShare2,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1.ambassadorShare),
      ambassadorShare2,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.researchShare),
      researchShare2,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.insuranceShare),
      insuranceShare2,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.treasuryShare),
      treasuryShare2,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve1Share),
      reserve1Share2,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve2Share),
      reserve2Share2,
      "reserve2Share funds invalid"
    );

    //check treeId 5 model is 2

    const dmModel5 = await allocationInstance.findAllocationData.call(5);

    assert.equal(
      Number(dmModel5.planterShare),
      planterShare2,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel5.ambassadorShare),
      ambassadorShare2,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel5.researchShare),
      researchShare2,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel5.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel5.insuranceShare),
      insuranceShare2,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel5.treasuryShare),
      treasuryShare2,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel5.reserve1Share),
      reserve1Share2,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel5.reserve2Share),
      reserve2Share2,
      "reserve2Share funds invalid"
    );

    //check treeId 10 model is 2

    const dmModel10 = await allocationInstance.findAllocationData.call(10);

    assert.equal(
      Number(dmModel10.planterShare),
      planterShare2,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10.ambassadorShare),
      ambassadorShare2,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel10.researchShare),
      researchShare2,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel10.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel10.insuranceShare),
      insuranceShare2,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel10.treasuryShare),
      treasuryShare2,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel10.reserve1Share),
      reserve1Share2,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel10.reserve2Share),
      reserve2Share2,
      "reserve2Share funds invalid"
    );

    //check treeId 11 model is 3
    const dmModel11 = await allocationInstance.findAllocationData.call(11);

    assert.equal(
      Number(dmModel11.planterShare),
      planterShare3,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel11.ambassadorShare),
      ambassadorShare3,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel11.researchShare),
      researchShare3,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel11.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel11.insuranceShare),
      insuranceShare3,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel11.treasuryShare),
      treasuryShare3,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel11.reserve1Share),
      reserve1Share3,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel11.reserve2Share),
      reserve2Share3,
      "reserve2Share funds invalid"
    );

    //check treeId 99 model is 3

    const dmModel99 = await allocationInstance.findAllocationData.call(99);

    assert.equal(
      Number(dmModel99.planterShare),
      planterShare3,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel99.ambassadorShare),
      ambassadorShare3,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel99.researchShare),
      researchShare3,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel99.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel99.insuranceShare),
      insuranceShare3,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel99.treasuryShare),
      treasuryShare3,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel99.reserve1Share),
      reserve1Share3,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel99.reserve2Share),
      reserve2Share3,
      "reserve2Share funds invalid"
    );

    //check treeId 100 model is 3

    const dmModel100 = await allocationInstance.findAllocationData.call(100);

    assert.equal(
      Number(dmModel100.planterShare),
      planterShare3,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel100.ambassadorShare),
      ambassadorShare3,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.researchShare),
      researchShare3,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.insuranceShare),
      insuranceShare3,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.treasuryShare),
      treasuryShare3,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserve1Share),
      reserve1Share3,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel100.reserve2Share),
      reserve2Share3,
      "reserve2Share funds invalid"
    );

    //check treeId 101 model is 4

    const dmModel101 = await allocationInstance.findAllocationData.call(101);

    assert.equal(
      Number(dmModel101.planterShare),
      planterShare4,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel101.ambassadorShare),
      ambassadorShare4,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel101.researchShare),
      researchShare4,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel101.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel101.insuranceShare),
      insuranceShare4,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel101.treasuryShare),
      treasuryShare4,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel101.reserve1Share),
      reserve1Share4,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel101.reserve2Share),
      reserve2Share4,
      "reserve2Share funds invalid"
    );

    //check treeId 1500 model is 4

    const dmModel1500 = await allocationInstance.findAllocationData.call(1500);

    assert.equal(
      Number(dmModel1500.planterShare),
      planterShare4,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1500.ambassadorShare),
      ambassadorShare4,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel1500.researchShare),
      researchShare4,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel1500.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel1500.insuranceShare),
      insuranceShare4,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel1500.treasuryShare),
      treasuryShare4,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel1500.reserve1Share),
      reserve1Share4,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel1500.reserve2Share),
      reserve2Share4,
      "reserve2Share funds invalid"
    );

    //check treeId 1000000 model is 4

    const dmModel1000000 = await allocationInstance.findAllocationData.call(
      1000000
    );

    assert.equal(
      Number(dmModel1000000.planterShare),
      planterShare4,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1000000.ambassadorShare),
      ambassadorShare4,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.researchShare),
      researchShare4,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.insuranceShare),
      insuranceShare4,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.treasuryShare),
      treasuryShare4,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.reserve1Share),
      reserve1Share4,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel1000000.reserve2Share),
      reserve2Share4,
      "reserve2Share funds invalid"
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
    const dmModel4999 = await allocationInstance.findAllocationData.call(4999);

    assert.equal(
      Number(dmModel4999.planterShare),
      planterShare4,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel4999.ambassadorShare),
      ambassadorShare4,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel4999.researchShare),
      researchShare4,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel4999.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel4999.insuranceShare),
      insuranceShare4,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel4999.treasuryShare),
      treasuryShare4,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel4999.reserve1Share),
      reserve1Share4,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel4999.reserve2Share),
      reserve2Share4,
      "reserve2Share funds invalid"
    );

    //check treeId 5000 model is 5

    const dmModel5000 = await allocationInstance.findAllocationData.call(5000);

    assert.equal(
      Number(dmModel5000.planterShare),
      planterShare5,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel5000.ambassadorShare),
      ambassadorShare5,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel5000.researchShare),
      researchShare5,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel5000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel5000.insuranceShare),
      insuranceShare5,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel5000.treasuryShare),
      treasuryShare5,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel5000.reserve1Share),
      reserve1Share5,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel5000.reserve2Share),
      reserve2Share5,
      "reserve2Share funds invalid"
    );

    //check treeId 6000 model is 5

    const dmModel6000 = await allocationInstance.findAllocationData.call(6000);

    assert.equal(
      Number(dmModel6000.planterShare),
      planterShare5,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel6000.ambassadorShare),
      ambassadorShare5,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel6000.researchShare),
      researchShare5,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel6000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel6000.insuranceShare),
      insuranceShare5,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel6000.treasuryShare),
      treasuryShare5,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel6000.reserve1Share),
      reserve1Share5,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel6000.reserve2Share),
      reserve2Share5,
      "reserve2Share funds invalid"
    );

    //check treeId 10000 model is 5

    const dmModel10000 = await allocationInstance.findAllocationData.call(
      10000
    );

    assert.equal(
      Number(dmModel10000.planterShare),
      planterShare5,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10000.ambassadorShare),
      ambassadorShare5,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel10000.researchShare),
      researchShare5,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel10000.localDevelopmentShare),
      localDevelopmentShare5,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel10000.insuranceShare),
      insuranceShare5,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel10000.treasuryShare),
      treasuryShare5,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel10000.reserve1Share),
      reserve1Share5,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel10000.reserve2Share),
      reserve2Share5,
      "reserve2Share funds invalid"
    );

    //check treeId 10001 model is 4
    const dmModel10001 = await allocationInstance.findAllocationData.call(
      10001
    );

    assert.equal(
      Number(dmModel10001.planterShare),
      planterShare4,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10001.ambassadorShare),
      ambassadorShare4,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel10001.researchShare),
      researchShare4,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel10001.localDevelopmentShare),
      localDevelopmentShare4,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel10001.insuranceShare),
      insuranceShare4,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel10001.treasuryShare),
      treasuryShare4,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel10001.reserve1Share),
      reserve1Share4,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel10001.reserve2Share),
      reserve2Share4,
      "reserve2Share funds invalid"
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
    const dmModel4 = await allocationInstance.findAllocationData.call(4);
    assert.equal(
      Number(dmModel4.planterShare),
      planterShare6,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel4.ambassadorShare),
      ambassadorShare6,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel4.researchShare),
      researchShare6,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel4.localDevelopmentShare),
      localDevelopmentShare6,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel4.insuranceShare),
      insuranceShare6,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel4.treasuryShare),
      treasuryShare6,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel4.reserve1Share),
      reserve1Share6,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel4.reserve2Share),
      reserve2Share6,
      "reserve2Share funds invalid"
    );

    //check treeId 10_2 model is 6
    const dmModel10_2 = await allocationInstance.findAllocationData.call(10);

    assert.equal(
      Number(dmModel10_2.planterShare),
      planterShare6,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel10_2.ambassadorShare),
      ambassadorShare6,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.researchShare),
      researchShare6,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.localDevelopmentShare),
      localDevelopmentShare6,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.insuranceShare),
      insuranceShare6,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.treasuryShare),
      treasuryShare6,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.reserve1Share),
      reserve1Share6,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel10_2.reserve2Share),
      reserve2Share6,
      "reserve2Share funds invalid"
    );

    //check treeId 11_2 model is 3

    const dmModel11_2 = await allocationInstance.findAllocationData.call(11);
    assert.equal(
      Number(dmModel11_2.planterShare),
      planterShare3,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel11_2.ambassadorShare),
      ambassadorShare3,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.researchShare),
      researchShare3,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.localDevelopmentShare),
      localDevelopmentShare3,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.insuranceShare),
      insuranceShare3,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.treasuryShare),
      treasuryShare3,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.reserve1Share),
      reserve1Share3,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel11_2.reserve2Share),
      reserve2Share3,
      "reserve2Share funds invalid"
    );

    //check treeId 3 model is 2

    assert.equal(
      Number(dmModel1.planterShare),
      planterShare2,
      "planterShare totalFunds invalid"
    );

    assert.equal(
      Number(dmModel1.ambassadorShare),
      ambassadorShare2,
      "ambassadorShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.researchShare),
      researchShare2,
      "researchShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.localDevelopmentShare),
      localDevelopmentShare2,
      "localDevelopmentShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.insuranceShare),
      insuranceShare2,
      "insuranceShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.treasuryShare),
      treasuryShare2,
      "treasuryShare funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve1Share),
      reserve1Share2,
      "reserve1Share funds invalid"
    );

    assert.equal(
      Number(dmModel1.reserve2Share),
      reserve2Share2,
      "reserve2Share funds invalid"
    );
  });
});
