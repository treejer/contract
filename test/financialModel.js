const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
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

contract("FinancialModel", (accounts) => {
  let arInstance;
  let TreeFactoryInstance;
  let startTime;
  let endTime;
  let financialModelSellInstance;
  let treeTokenInstance;

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

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    financialModelSellInstance = await deployProxy(
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

  // //************************************ deploy successfully ****************************************//

  it("deploys successfully", async () => {
    const address = financialModelSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  //--------------------------------addFundDistributionModel test-----------------------------------------------
  it("addFundDistributionModel should be success", async () => {
    await financialModelSellInstance.addFundDistributionModel(
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

    let result = await financialModelSellInstance.fundDistributions.call(0);

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

  it("addFundDistributionModel should be reject invalid access", async () => {
    await financialModelSellInstance
      .addFundDistributionModel(4000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("addFundDistributionModel should be reject sum must be 10000", async () => {
    await financialModelSellInstance
      .addFundDistributionModel(8000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);

    await financialModelSellInstance
      .addFundDistributionModel(3000, 1200, 1200, 1200, 1200, 1200, 300, 300, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);
  });

  //--------------------------------------------assignTreeFundDistributionModel test------------------------------------
  it("1.assignTreeFundDistributionModel should be success", async () => {
    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance.addFundDistributionModel(
      3000,
      2200,
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

    await financialModelSellInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(
      11,
      100,
      2,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: deployerAccount,
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
      await financialModelSellInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex),
      1000000,
      "1.maxAssignedIndex not true"
    );

    for (let i = 0; i < 4; i++) {
      let array = await financialModelSellInstance.assignModels(i);
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

    await financialModelSellInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let resultMaxAssignedIndex2 =
      await financialModelSellInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex2),
      2 ** 256 - 1,
      "2.maxAssignedIndex not true"
    );
  });

  it("2.assignTreeFundDistributionModel should be success", async () => {
    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance.addFundDistributionModel(
      3000,
      2200,
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

    await financialModelSellInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(
      11,
      100,
      2,
      {
        from: deployerAccount,
      }
    );

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
      let array = await financialModelSellInstance.assignModels(i);
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

    await financialModelSellInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    let resultMaxAssignedIndex1 =
      await financialModelSellInstance.maxAssignedIndex();

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
      let array = await financialModelSellInstance.assignModels(i);
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
    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance.addFundDistributionModel(
      3000,
      2200,
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

    await financialModelSellInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.addFundDistributionModel(
      1000,
      2200,
      2200,
      2200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(
      11,
      100,
      2,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
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
      let array = await financialModelSellInstance.assignModels(i);
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
      await financialModelSellInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      100,
      "1.maxAssignedIndex not true"
    );
  });

  it("4.assignTreeFundDistributionModel should be success", async () => {
    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance.addFundDistributionModel(
      3000,
      2200,
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

    await financialModelSellInstance.addFundDistributionModel(
      2000,
      2200,
      2200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelSellInstance.assignTreeFundDistributionModel(1, 2, 0, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(0, 5, 1, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(8, 10, 0, {
      from: deployerAccount,
    });

    await financialModelSellInstance.assignTreeFundDistributionModel(3, 9, 2, {
      from: deployerAccount,
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
      let array = await financialModelSellInstance.assignModels(i);
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
      await financialModelSellInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      10,
      "1.maxAssignedIndex not true"
    );
  });

  it("assignTreeFundDistributionModel should be reject invalid access", async () => {
    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance
      .assignTreeFundDistributionModel(0, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("assignTreeFundDistributionModel should be reject Distribution model not found", async () => {
    await financialModelSellInstance
      .assignTreeFundDistributionModel(0, 0, 0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(
        TreasuryManagerErrorMsg.DISTRIBUTION_MODEL_NOT_FOUND
      );
  });

  //--------------------------------------------------- DistributionModelOfTreeNotExist ------------------------------------
  it("Check DistributionModelOfTreeNotExist event", async () => {
    let amount = web3.utils.toWei("1", "Ether");

    await financialModelSellInstance.addFundDistributionModel(
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

    await financialModelSellInstance.assignTreeFundDistributionModel(4, 10, 0, {
      from: deployerAccount,
    });
    let hasModel1 = await financialModelSellInstance.distributionModelExistance(
      1
    );

    let hasModel7 = await financialModelSellInstance.distributionModelExistance(
      7
    );

    let hasModel11 =
      await financialModelSellInstance.distributionModelExistance(11);

    assert.equal(hasModel1, false, "hasModel not true");
    assert.equal(hasModel7, true, "hasModel not true");
    assert.equal(hasModel11, true, "hasModel not true");
  });
});
