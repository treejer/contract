const AccessRestriction = artifacts.require("AccessRestriction");
const TreasuryManager = artifacts.require("TreasuryManager.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, TreesuryManagerErrorMsg } = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("TreasuryManager", (accounts) => {
  let treasuryManagerInstance;
  let arInstance;

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
  const withdrawReason = "reason to withdraw";

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

  it("deploys successfully", async () => {
    const address = treasuryManagerInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  //-------------------------------setGbFundAddress test-------------------------------------------------------
  it("setGbFundAddress should be success", async () => {
    let gbAddress = userAccount4;

    await treasuryManagerInstance.setGbFundAddress(gbAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.gbFundAddress(),
      gbAddress,
      "gbAddress not true"
    );
  });

  it("setGbFundAddress should be fail (invalid access)", async () => {
    let gbAddress = userAccount4;

    await treasuryManagerInstance
      .setGbFundAddress(gbAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setTreeResearchAddress test-------------------------------------------------------
  it("setTreeResearchAddress should be success", async () => {
    let treeResearchAddress = userAccount4;

    await treasuryManagerInstance.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.treeResearchAddress(),
      treeResearchAddress,
      "Set treeResearchAddress address not true"
    );
  });

  it("setTreeResearchAddress should be fail (invalid access)", async () => {
    let treeResearchAddress = userAccount4;

    await treasuryManagerInstance
      .setTreeResearchAddress(treeResearchAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setLocalDevelopAddress test-------------------------------------------------------
  it("setLocalDevelopAddress should be success", async () => {
    let localDevelopAddress = userAccount4;

    await treasuryManagerInstance.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.localDevelopAddress(),
      localDevelopAddress,
      "Set localDevelopAddress address not true"
    );
  });

  it("setLocalDevelopAddress should be fail (invalid access)", async () => {
    let localDevelopAddress = userAccount4;

    await treasuryManagerInstance
      .setLocalDevelopAddress(localDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setRescueFundAddress test-------------------------------------------------------
  it("setRescueFundAddress should be success", async () => {
    let rescueFundAddress = userAccount4;

    await treasuryManagerInstance.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.rescueFundAddress(),
      rescueFundAddress,
      "Set rescueFundAddress address not true"
    );
  });

  it("setRescueFundAddress should be fail (invalid access)", async () => {
    let rescueFundAddress = userAccount4;

    await treasuryManagerInstance
      .setRescueFundAddress(rescueFundAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setTreejerDevelopAddress test-------------------------------------------------------
  it("setTreejerDevelopAddress should be success", async () => {
    let treejerDevelopAddress = userAccount4;

    await treasuryManagerInstance.setTreejerDevelopAddress(
      treejerDevelopAddress,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      await treasuryManagerInstance.treejerDevelopAddress(),
      treejerDevelopAddress,
      "Set treejerDevelopAddress address not true"
    );
  });

  it("setTreejerDevelopAddress should be fail (invalid access)", async () => {
    let treejerDevelopAddress = userAccount4;

    await treasuryManagerInstance
      .setTreejerDevelopAddress(treejerDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setOtherFund1Address test-------------------------------------------------------
  it("setOtherFund1Address should be success", async () => {
    let otherFundAddress1 = userAccount4;

    await treasuryManagerInstance.setOtherFund1Address(otherFundAddress1, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.otherFundAddress1(),
      otherFundAddress1,
      "Set otherFundAddress1 address not true"
    );
  });

  it("setOtherFund1Address should be fail (invalid access)", async () => {
    let otherFundAddress1 = userAccount4;

    await treasuryManagerInstance
      .setOtherFund1Address(otherFundAddress1, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setOtherFund2Address test-------------------------------------------------------
  it("setOtherFund2Address should be success", async () => {
    let otherFundAddress2 = userAccount4;

    await treasuryManagerInstance.setOtherFund2Address(otherFundAddress2, {
      from: deployerAccount,
    });

    assert.equal(
      await treasuryManagerInstance.otherFundAddress2(),
      otherFundAddress2,
      "Set otherFundAddress2 address not true"
    );
  });

  it("setOtherFund2Address should be fail (invalid access)", async () => {
    let otherFundAddress2 = userAccount4;

    await treasuryManagerInstance
      .setOtherFund2Address(otherFundAddress2, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //--------------------------------addFundDistributionModel test-----------------------------------------------
  it("addFundDistributionModel should be success", async () => {
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

    let result = await treasuryManagerInstance.fundDistributions.call(0);

    assert.equal(
      Number(result.planterFund.toString()),
      4000,
      "planterFund percent not true"
    );

    assert.equal(
      Number(result.gbFund.toString()),
      1200,
      "gbFund percent not true"
    );

    assert.equal(
      Number(result.treeResearch.toString()),
      1200,
      "treeResearch percent not true"
    );

    assert.equal(
      Number(result.localDevelop.toString()),
      1200,
      "localDevelop percent not true"
    );

    assert.equal(
      Number(result.rescueFund.toString()),
      1200,
      "rescueFund percent not true"
    );

    assert.equal(
      Number(result.treejerDevelop.toString()),
      1200,
      "planterFund percent not true"
    );

    assert.equal(
      Number(result.otherFund1.toString()),
      0,
      "otherFund1 percent not true"
    );

    assert.equal(
      Number(result.otherFund2.toString()),
      0,
      "otherFund2 percent not true"
    );
  });

  it("addFundDistributionModel should be reject invalid access", async () => {
    await treasuryManagerInstance
      .addFundDistributionModel(4000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("addFundDistributionModel should be reject sum must be 10000", async () => {
    await treasuryManagerInstance
      .addFundDistributionModel(8000, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);

    await treasuryManagerInstance
      .addFundDistributionModel(3000, 1200, 1200, 1200, 1200, 1200, 300, 300, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);
  });

  //--------------------------------------------assignTreeFundDistributionModel test------------------------------------
  it("1.assignTreeFundDistributionModel should be success", async () => {
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(
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

    let resultMaxAssignedIndex = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex.toString()),
      1000000,
      "1.maxAssignedIndex not true"
    );

    for (let i = 0; i < 4; i++) {
      let array = await treasuryManagerInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId.toString()),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId.toString()),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    await treasuryManagerInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let resultMaxAssignedIndex2 = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex2.toString()),
      2 ** 256 - 1,
      "2.maxAssignedIndex not true"
    );
  });

  it("2.assignTreeFundDistributionModel should be success", async () => {
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.assignTreeFundDistributionModel(
      1000001,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
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
      let array = await treasuryManagerInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId.toString()),
        expected1[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId.toString()),
        expected1[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1.toString()),
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
      let array = await treasuryManagerInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId.toString()),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId.toString()),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }
  });

  it("3.assignTreeFundDistributionModel should be success", async () => {
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
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
      let array = await treasuryManagerInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId.toString()),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId.toString()),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1.toString()),
      100,
      "1.maxAssignedIndex not true"
    );
  });

  it("4.assignTreeFundDistributionModel should be success", async () => {
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

    await treasuryManagerInstance.addFundDistributionModel(
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

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 2, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 5, 1, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(8, 10, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(3, 9, 2, {
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
      let array = await treasuryManagerInstance.assignModels(i);
      assert.equal(
        Number(array.startingTreeId.toString()),
        expected[i].startingTreeId,
        i + " startingTreeId not true"
      );

      assert.equal(
        Number(array.distributionModelId.toString()),
        expected[i].distributionModelId,
        i + " distributionModelId not true"
      );
    }

    let resultMaxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1.toString()),
      10,
      "1.maxAssignedIndex not true"
    );
  });

  it("assignTreeFundDistributionModel should be reject invalid access", async () => {
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

    await treasuryManagerInstance
      .assignTreeFundDistributionModel(0, 0, 0, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //************************************ fund tree test ****************************************//

  it("fundTree should be fail (invalid fund model)", async () => {
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

    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await treasuryManagerInstance.assignTreeFundDistributionModel(3, 10, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance
      .fundTree(1, {
        from: userAccount3,
        value: web3.utils.toWei("1", "Ether"),
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INVALID_FUND_MODEL);
  });

  it("fundTree should be fail (invalid access)", async () => {
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

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance
      .fundTree(1, {
        from: userAccount1,
        value: web3.utils.toWei("1", "Ether"),
      })
      .should.be.rejectedWith(CommonErrorMsg.ONLY_AUCTION);
  });

  it("1.fundTree should be success", async () => {
    let treeId = 10;
    let amount = web3.utils.toWei(".18", "Ether");

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

    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let tx = await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount3,
      value: amount,
    });

    assert.equal(
      await web3.eth.getBalance(treasuryManagerInstance.address),
      amount,
      "1.Contract balance is not true"
    );

    truffleAssert.eventNotEmitted(tx, "DistributionModelOfTreeNotExist");

    let pFund = await treasuryManagerInstance.planterFunds.call(treeId);

    let totalFunds = await treasuryManagerInstance.totalFunds();

    let expected = {
      planterFund: (40 * amount) / 100,
      gbFund: (12 * amount) / 100,
      treeResearch: (12 * amount) / 100,
      localDevelop: (12 * amount) / 100,
      rescueFund: (12 * amount) / 100,
      treejerDevelop: (12 * amount) / 100,
      otherFund1: 0,
      otherFund2: 0,
    };

    assert.equal(
      Number(pFund.toString()),
      expected.planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(totalFunds.planterFund.toString()),
      expected.planterFund,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds.gbFund.toString()),
      expected.gbFund,
      "gbFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treeResearch.toString()),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds.localDevelop.toString()),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.rescueFund.toString()),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treejerDevelop.toString()),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund1.toString()),
      expected.otherFund1,
      "otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund2.toString()),
      expected.otherFund2,
      "otherFund2 funds invalid"
    );
  });

  it("2.fundTree should be success", async () => {
    let treeId1 = 0;
    let treeId2 = 20;
    let amount1 = web3.utils.toWei(".23", "Ether");
    let amount2 = web3.utils.toWei(".28", "Ether");

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
      3000,
      1200,
      1200,
      1200,
      1200,
      1200,
      500,
      500,
      {
        from: deployerAccount,
      }
    );

    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 20, 1, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount3,
      value: amount2,
    });

    assert.equal(
      await web3.eth.getBalance(treasuryManagerInstance.address),
      web3.utils.toWei(".28", "Ether"),
      "1.Contract balance is not true"
    );

    let pFund2 = await treasuryManagerInstance.planterFunds.call(treeId2);

    let totalFunds2 = await treasuryManagerInstance.totalFunds();

    let expected2 = {
      planterFund: (30 * amount2) / 100,
      gbFund: (12 * amount2) / 100,
      treeResearch: (12 * amount2) / 100,
      localDevelop: (12 * amount2) / 100,
      rescueFund: (12 * amount2) / 100,
      treejerDevelop: (12 * amount2) / 100,
      otherFund1: (5 * amount2) / 100,
      otherFund2: (5 * amount2) / 100,
    };

    assert.equal(
      Number(pFund2.toString()),
      expected2.planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(totalFunds2.planterFund.toString()),
      expected2.planterFund,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds2.gbFund.toString()),
      expected2.gbFund,
      "gbFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treeResearch.toString()),
      expected2.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop.toString()),
      expected2.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund.toString()),
      expected2.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop.toString()),
      expected2.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.otherFund1.toString()),
      expected2.otherFund1,
      "otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.otherFund2.toString()),
      expected2.otherFund2,
      "otherFund2 funds invalid"
    );

    await treasuryManagerInstance.fundTree(treeId1, {
      from: userAccount3,
      value: amount1,
    });

    assert.equal(
      await web3.eth.getBalance(treasuryManagerInstance.address),
      web3.utils.toWei(".51", "Ether"),
      "2.Contract balance is not true"
    );

    let expected = {
      planterFund: (40 * amount1) / 100,
      gbFund: (12 * amount1) / 100,
      treeResearch: (12 * amount1) / 100,
      localDevelop: (12 * amount1) / 100,
      rescueFund: (12 * amount1) / 100,
      treejerDevelop: (12 * amount1) / 100,
      otherFund1: 0,
      otherFund2: 0,
    };

    let pFund = await treasuryManagerInstance.planterFunds.call(treeId1);

    let totalFunds = await treasuryManagerInstance.totalFunds();

    assert.equal(
      Number(pFund.toString()),
      expected.planterFund,
      "2.planter funds invalid"
    );

    assert.equal(
      Number(totalFunds.planterFund.toString()),
      expected.planterFund + expected2.planterFund,
      "2.planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds.gbFund.toString()),
      expected.gbFund + expected2.gbFund,
      "2.gbFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treeResearch.toString()),
      expected.treeResearch + expected2.treeResearch,
      "2.treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds.localDevelop.toString()),
      expected.localDevelop + expected2.localDevelop,
      "2.localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.rescueFund.toString()),
      expected.rescueFund + expected2.rescueFund,
      "2.rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treejerDevelop.toString()),
      expected.treejerDevelop + expected2.treejerDevelop,
      "2.treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund1.toString()),
      expected.otherFund1 + expected2.otherFund1,
      "2.otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund2.toString()),
      expected.otherFund2 + expected2.otherFund2,
      "2.otherFund2 funds invalid"
    );
  });

  it("3.fundTree should be success", async () => {
    let amount = web3.utils.toWei(".2", "Ether");

    await treasuryManagerInstance.addFundDistributionModel(
      8000,
      0,
      2000,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.addFundDistributionModel(
      6000,
      0,
      4000,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.addFundDistributionModel(
      4000,
      0,
      6000,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.addFundDistributionModel(
      2000,
      0,
      8000,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await treasuryManagerInstance.assignTreeFundDistributionModel(
      101,
      1000000,
      3,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    let expected = {
      planterFundModel0: (80 * amount) / 100,
      planterFundModel1: (60 * amount) / 100,
      planterFundModel2: (40 * amount) / 100,
      planterFundModel3: (20 * amount) / 100,
      planterFundModel4: (10 * amount) / 100,
      planterFundModel5: (5 * amount) / 100,
    };

    //check treeId 0

    await treasuryManagerInstance.fundTree(0, {
      from: userAccount3,
      value: amount,
    });

    let pFund0 = await treasuryManagerInstance.planterFunds.call(0);

    assert.equal(
      Number(pFund0.toString()),
      expected.planterFundModel0,
      "Planter funds invalid treeId 0"
    );

    //check treeId 1

    await treasuryManagerInstance.fundTree(1, {
      from: userAccount3,
      value: amount,
    });

    let pFund1 = await treasuryManagerInstance.planterFunds.call(1);

    assert.equal(
      Number(pFund1.toString()),
      expected.planterFundModel1,
      "Planter funds invalid treeId 1"
    );

    //check treeId 5

    await treasuryManagerInstance.fundTree(5, {
      from: userAccount3,
      value: amount,
    });

    let pFund5 = await treasuryManagerInstance.planterFunds.call(5);

    assert.equal(
      Number(pFund5.toString()),
      expected.planterFundModel1,
      "Planter funds invalid treeId 5"
    );

    //check treeId 10

    await treasuryManagerInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    let pFund10 = await treasuryManagerInstance.planterFunds.call(10);

    assert.equal(
      Number(pFund10.toString()),
      expected.planterFundModel1,
      "Planter funds invalid treeId 10"
    );

    //check treeId 11

    await treasuryManagerInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    let pFund11 = await treasuryManagerInstance.planterFunds.call(11);

    assert.equal(
      Number(pFund11.toString()),
      expected.planterFundModel2,
      "Planter funds invalid treeId 11"
    );

    //check treeId 99

    await treasuryManagerInstance.fundTree(99, {
      from: userAccount3,
      value: amount,
    });

    let pFund99 = await treasuryManagerInstance.planterFunds.call(99);

    assert.equal(
      Number(pFund99.toString()),
      expected.planterFundModel2,
      "Planter funds invalid treeId 99"
    );

    //check treeId 100

    await treasuryManagerInstance.fundTree(100, {
      from: userAccount3,
      value: amount,
    });

    let pFund100 = await treasuryManagerInstance.planterFunds.call(100);

    assert.equal(
      Number(pFund100.toString()),
      expected.planterFundModel2,
      "Planter funds invalid treeId 100"
    );

    //check treeId 101

    await treasuryManagerInstance.fundTree(101, {
      from: userAccount3,
      value: amount,
    });

    let pFund101 = await treasuryManagerInstance.planterFunds.call(101);

    assert.equal(
      Number(pFund101.toString()),
      expected.planterFundModel3,
      "Planter funds invalid treeId 101"
    );

    //check treeId 1500

    await treasuryManagerInstance.fundTree(1500, {
      from: userAccount3,
      value: amount,
    });

    let pFund1500 = await treasuryManagerInstance.planterFunds.call(1500);

    assert.equal(
      Number(pFund1500.toString()),
      expected.planterFundModel3,
      "Planter funds invalid treeId 1500"
    );

    //check treeId 1000000

    await treasuryManagerInstance.fundTree(1000000, {
      from: userAccount3,
      value: amount,
    });

    let pFund1000000 = await treasuryManagerInstance.planterFunds.call(1000000);

    assert.equal(
      Number(pFund1000000.toString()),
      expected.planterFundModel3,
      "Planter funds invalid treeId 1000000"
    );

    await treasuryManagerInstance.addFundDistributionModel(
      1000,
      0,
      9000,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(
      5000,
      10000,
      4,
      {
        from: deployerAccount,
      }
    );

    //check treeId 4999

    await treasuryManagerInstance.fundTree(4999, {
      from: userAccount3,
      value: amount,
    });

    let pFund4999 = await treasuryManagerInstance.planterFunds.call(4999);

    assert.equal(
      Number(pFund4999.toString()),
      expected.planterFundModel3,
      "Planter funds invalid treeId 4999"
    );

    //check treeId 5000

    await treasuryManagerInstance.fundTree(5000, {
      from: userAccount3,
      value: amount,
    });

    let pFund5000 = await treasuryManagerInstance.planterFunds.call(5000);

    assert.equal(
      Number(pFund5000.toString()),
      expected.planterFundModel4,
      "Planter funds invalid treeId 5000"
    );

    //check treeId 6000

    await treasuryManagerInstance.fundTree(6000, {
      from: userAccount3,
      value: amount,
    });

    let pFund6000 = await treasuryManagerInstance.planterFunds.call(6000);

    assert.equal(
      Number(pFund6000.toString()),
      expected.planterFundModel4,
      "Planter funds invalid treeId 6000"
    );

    //check treeId 10000

    await treasuryManagerInstance.fundTree(10000, {
      from: userAccount3,
      value: amount,
    });

    let pFund10000 = await treasuryManagerInstance.planterFunds.call(10000);

    assert.equal(
      Number(pFund10000.toString()),
      expected.planterFundModel4,
      "Planter funds invalid treeId 10000"
    );

    //check treeId 10001

    await treasuryManagerInstance.fundTree(10001, {
      from: userAccount3,
      value: amount,
    });

    let pFund10001 = await treasuryManagerInstance.planterFunds.call(10001);

    assert.equal(
      Number(pFund10001.toString()),
      expected.planterFundModel3,
      "Planter funds invalid treeId 10001"
    );

    await treasuryManagerInstance.addFundDistributionModel(
      500,
      0,
      9500,
      0,
      0,
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance.assignTreeFundDistributionModel(4, 10, 5, {
      from: deployerAccount,
    });

    //check treeId 4
    await treasuryManagerInstance.fundTree(4, {
      from: userAccount3,
      value: amount,
    });

    let pFund4 = await treasuryManagerInstance.planterFunds.call(4);

    assert.equal(
      Number(pFund4.toString()),
      expected.planterFundModel5,
      "Planter funds invalid treeId 4"
    );

    //check treeId 10_2
    await treasuryManagerInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    let pFund10_2 = await treasuryManagerInstance.planterFunds.call(10);

    assert.equal(
      Number(pFund10_2.toString()),
      expected.planterFundModel5,
      "Planter funds invalid treeId pFund10_2"
    );

    //check treeId 11_2
    await treasuryManagerInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    let pFund11_2 = await treasuryManagerInstance.planterFunds.call(11);

    assert.equal(
      Number(pFund11_2.toString()),
      expected.planterFundModel2,
      "Planter funds invalid treeId pFund11_2"
    );

    //check treeId 3
    await treasuryManagerInstance.fundTree(3, {
      from: userAccount3,
      value: amount,
    });

    let pFund3 = await treasuryManagerInstance.planterFunds.call(3);

    assert.equal(
      Number(pFund3.toString()),
      expected.planterFundModel1,
      "Planter funds invalid treeId pFund3"
    );

    let maxAssignedIndex1 = await treasuryManagerInstance.maxAssignedIndex();

    assert.equal(
      Number(maxAssignedIndex1.toString()),
      1000000,
      "maxAssignedIndex1 not tTrue"
    );
  });

  it("Check DistributionModelOfTreeNotExist event", async () => {
    let amount = web3.utils.toWei("1", "Ether");

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

    await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);

    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let tx10 = await treasuryManagerInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx10, "DistributionModelOfTreeNotExist");

    let tx0 = await treasuryManagerInstance.fundTree(0, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx0, "DistributionModelOfTreeNotExist");

    let tx11 = await treasuryManagerInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventEmitted(tx11, "DistributionModelOfTreeNotExist");

    await treasuryManagerInstance.assignTreeFundDistributionModel(11, 100, 0, {
      from: deployerAccount,
    });

    tx11 = await treasuryManagerInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx11, "DistributionModelOfTreeNotExist");

    let tx100 = await treasuryManagerInstance.fundTree(100, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx100, "DistributionModelOfTreeNotExist");

    let tx102 = await treasuryManagerInstance.fundTree(102, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventEmitted(tx102, "DistributionModelOfTreeNotExist");

    await treasuryManagerInstance.assignTreeFundDistributionModel(5, 0, 0, {
      from: deployerAccount,
    });

    let tx1000000 = await treasuryManagerInstance.fundTree(1000000, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx1000000, "DistributionModelOfTreeNotExist");
  });

  //************************************ fund planter test ****************************************//
  it("fund planter successfully", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let tx = await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await treasuryManagerInstance.fundPlanter(treeId, userAccount2, 25920, {
      from: userAccount1,
    });
  });
  it("check fund planter data to be ok1", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const treeStatus1 = 2592;
    const treeStatus2 = 5184;
    const treeStatus3 = 12960;
    const treeStatus4 = 25920;
    const treeStatus5 = 65535; //2^16-1
    const finalStatus = 25920;
    const planterTotalFunded = (Number(amount) * planterFund) / 10000;
    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    let fundT = await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    const totalFund = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(totalFund.planterFund.toString()),
      (amount * planterFund) / 10000,
      "total fund is not correct1"
    );

    let fundP1 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      {
        from: userAccount1,
      }
    );
    const totalFund1 = await treasuryManagerInstance.totalFunds();
    let planterPaid1 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance1 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()", planterBalance1.toString());
    assert.equal(
      (amount * planterFund) / 10000 -
        (planterTotalFunded * treeStatus1) / finalStatus,
      Number(totalFund1.planterFund.toString()),
      "total fund1 is not ok"
    );
    // console.log("planterPaid", planterPaid.toString());
    assert.equal(
      (planterTotalFunded * treeStatus1) / finalStatus,
      Number(planterPaid1.toString()),
      "planter paid is not ok"
    );
    assert.equal(
      (planterTotalFunded * treeStatus1) / finalStatus,
      Number(planterBalance1.toString()),
      "planter balance is not ok1"
    );

    ///////////////////////////////
    let fundP2 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      { from: userAccount1 }
    );
    const totalFund2 = await treasuryManagerInstance.totalFunds();
    let planterPaid2 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance2 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()2", planterBalance2.toString());
    assert.equal(
      (amount * planterFund) / 10000 -
        (planterTotalFunded * treeStatus1) / finalStatus,
      Number(totalFund2.planterFund.toString()),
      "total fund2 is not ok"
    );
    assert.equal(
      (planterTotalFunded * treeStatus1) / finalStatus,
      Number(planterPaid2.toString()),
      "planter paid is not ok2"
    );
    assert.equal(
      (planterTotalFunded * treeStatus1) / finalStatus,
      Number(planterBalance2.toString()),
      "planter balance is not ok2"
    );
    /////////////////////////

    let fundP3 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus2,
      { from: userAccount1 }
    );
    const totalFund3 = await treasuryManagerInstance.totalFunds();

    let planterPaid3 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance3 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()3", planterBalance3.toString());

    assert.equal(
      (amount * planterFund) / 10000 -
        (planterTotalFunded * treeStatus2) / finalStatus,
      Number(totalFund3.planterFund.toString()),
      "total fund3 is not ok"
    );
    assert.equal(
      (planterTotalFunded * treeStatus2) / finalStatus,
      Number(planterPaid3.toString()),
      "planter paid is not ok3"
    );
    assert.equal(
      (planterTotalFunded * treeStatus2) / finalStatus,
      Number(planterBalance3.toString()),
      "planter balance is not ok3"
    );

    // ///////////

    let fundP4 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus3,
      { from: userAccount1 }
    );
    const totalFund4 = await treasuryManagerInstance.totalFunds();

    let planterPaid4 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance4 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()4", planterBalance4.toString());
    assert.equal(
      (amount * planterFund) / 10000 -
        (planterTotalFunded * treeStatus3) / finalStatus,
      Number(totalFund4.planterFund.toString()),
      "total fund4 is not ok"
    );
    assert.equal(
      (planterTotalFunded * treeStatus3) / finalStatus,
      Number(planterPaid4.toString()),
      "planter paid is not ok4"
    );
    assert.equal(
      (planterTotalFunded * treeStatus3) / finalStatus,
      Number(planterBalance4.toString()),
      "planter balance is not ok4"
    );
    /////////////////

    let fundP5 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus4,
      { from: userAccount1 }
    );
    const totalFund5 = await treasuryManagerInstance.totalFunds();
    let planterPaid5 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance5 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()5", planterBalance5.toString());
    assert.equal(
      (amount * planterFund) / 10000 -
        (planterTotalFunded * treeStatus4) / finalStatus,
      Number(totalFund5.planterFund.toString()),
      "total fund5 is not ok"
    );
    assert.equal(
      (planterTotalFunded * treeStatus4) / finalStatus,
      Number(planterPaid5.toString()),
      "planter paid is not ok5"
    );
    assert.equal(
      (planterTotalFunded * treeStatus4) / finalStatus,
      Number(planterBalance5.toString()),
      "planter balance is not ok5"
    );
    /////////////////

    let fundP6 = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus5,
      { from: userAccount1 }
    );
    const totalFund6 = await treasuryManagerInstance.totalFunds();
    let planterPaid6 = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance6 = await treasuryManagerInstance.balances(userAccount2);
    console.log("planterBalance.toString()6", planterBalance6.toString());

    assert.equal(
      (amount * planterFund) / 10000 - planterTotalFunded,
      Number(totalFund6.planterFund.toString()),
      "total fund6 is not ok"
    );
    assert.equal(
      planterTotalFunded,
      Number(planterPaid6.toString()),
      "planter paid is not ok6"
    );
    assert.equal(
      planterTotalFunded,
      Number(planterBalance6.toString()),
      "planter balance is not ok6"
    );
  });

  it("check fund planter data to be ok1", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("1");
    const amount2 = web3.utils.toWei("2");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const treeStatus = 65535; //2^16-1

    const planterTotalFunded = (Number(amount) * planterFund) / 10000;
    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let fundT = await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    let fundT2 = await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount2,
    });
    const totalFunds = await treasuryManagerInstance.totalFunds();
    assert.equal(
      (planterFund * amount) / 10000 + (planterFund * amount2) / 10000,
      Number(totalFunds.planterFund.toString()),
      "invalid planter total funds"
    );
    let fundP = await treasuryManagerInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus,
      {
        from: userAccount1,
      }
    );

    truffleAssert.eventEmitted(fundP, "PlanterFunded", (ev) => {
      return (
        Number(ev.treeId.toString()) == treeId &&
        ev.planterId == userAccount2 &&
        Number(ev.amount.toString()) == planterTotalFunded
      );
    });

    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    let planterPaid = await treasuryManagerInstance.plantersPaid.call(treeId);
    let planterBalance = await treasuryManagerInstance.balances(userAccount2);

    assert.equal(
      planterTotalFunded,
      Number(planterPaid.toString()),
      "planter paid is not ok"
    );
    assert.equal(
      planterTotalFunded,
      Number(planterBalance.toString()),
      "planter balance is not ok1"
    );
    assert.equal(
      (planterFund * amount2) / 10000,
      Number(totalFunds2.planterFund.toString()),
      "total funds2 is not ok"
    );
  });
  it("should fail fund planter", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const treeStatus = 65535; //2^16-1

    const planterTotalFunded = (Number(amount) * planterFund) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let fundT = await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    let fundP = await treasuryManagerInstance
      .fundPlanter(treeId, userAccount2, treeStatus, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_GENESIS_TREE);

    await treasuryManagerInstance
      .fundPlanter(treeId2, userAccount2, treeStatus, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
  });
  //*****************************************withdraw planter balance ************************************** */
  it("should withdraw planter succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    await treasuryManagerInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });
    const tx = await treasuryManagerInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.005"),
      { from: userAccount3 }
    );
  });

  it("check planter withdraw balance to be correct", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalPlanterFund = (Number(amount) * planterFund) / 10000;
    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    const contractBalanceBeforeFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    assert.equal(
      Number(contractBalanceAfterFund.toString()) -
        Number(contractBalanceBeforeFund.toString()),
      Number(amount),
      "contrct balance charged inconrrectly"
    );

    await treasuryManagerInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    const planterBalance1 = await treasuryManagerInstance.balances.call(
      userAccount3
    );
    const accountBalance1 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(planterBalance1.toString()),
      totalPlanterFund,
      "planter balance is not ok 1"
    );
    const tx = await treasuryManagerInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3
      );
    });

    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    assert.equal(
      Number(contractBalanceAfterFund.toString()) -
        Number(web3.utils.toWei("0.1")),
      Number(contractBalanceAfterWithdraw1.toString()),
      "contract balance is not ok after withdraw 1"
    );
    const planterBalance2 = await treasuryManagerInstance.balances.call(
      userAccount3
    );

    const accountBalance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      totalPlanterFund - Number(web3.utils.toWei("0.1")),
      Number(planterBalance2.toString()),
      "planter blance is not ok 2"
    );
    assert.isTrue(
      Number(accountBalance2.toString()) > Number(accountBalance1.toString()),
      "planter balance is not ok 2"
    );
    //////////////////////
    const tx2 = await treasuryManagerInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.5"),
      { from: userAccount3 }
    );
    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.5")) &&
        ev.account == userAccount3
      );
    });
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    assert.equal(
      Number(contractBalanceAfterFund.toString()) -
        Number(web3.utils.toWei("0.6")),
      Number(contractBalanceAfterWithdraw2.toString()),
      "contract balance is not ok after withdraw 2"
    );
    const planterBalance3 = await treasuryManagerInstance.balances.call(
      userAccount3
    );
    assert.equal(
      totalPlanterFund - Number(web3.utils.toWei("0.6")),
      Number(planterBalance3.toString()),
      "planter blance is not ok 3"
    );
    const accountBalance3 = await web3.eth.getBalance(userAccount3);
    assert.isTrue(
      Number(accountBalance3.toString()) > Number(accountBalance2.toString()),
      "planter balance is not ok 3"
    );
  });
  it("should fail withdraw planter", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("0.2");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    await treasuryManagerInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    await treasuryManagerInstance
      .withdrawPlanterBalance(web3.utils.toWei("0"), { from: userAccount3 })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawPlanterBalance(web3.utils.toWei("1.5"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawPlanterBalance(web3.utils.toWei("0.05"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT); //not planter and his account have no vallue
    await treasuryManagerInstance
      .withdrawPlanterBalance(web3.utils.toWei("0.05"), {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });
  //*****************************************withdraw gb balance ************************************** */
  it("should withdraw gb succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setGbFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawGb(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw gb data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setGbFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalGbFunded = ((Number(amount) + Number(amount1)) * gbFund) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount8,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalGbFunded,
      Number(totalFunds1.gbFund.toString()),
      "gb total fund1 is not ok"
    );
    const gbBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawGb(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "GbBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const gbBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.gbFund.toString()) -
        Number(totalFunds2.gbFund.toString()),
      Number(web3.utils.toWei("0.1")),
      "gb total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(gbBalnance2.toString()),
      Number(gbBalnance1.toString()) + Number(web3.utils.toWei("0.1")),
      "gb account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawGb(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "GbBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const gbBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.gbFund.toString()) -
        Number(totalFunds3.gbFund.toString()),
      Number(web3.utils.toWei("0.3")),
      "gb total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.gbFund.toString()),
      0,
      "gb total fund must be zero"
    ); //total value of gbFund has withdrawn
    assert.equal(
      Number(gbBalnance3.toString()),
      Number(gbBalnance1.toString()) + Number(web3.utils.toWei("0.3")),
      "gb account balance  is not ok after withdraw2 ( checking with gbBalance1 )"
    );
    assert.equal(
      Number(gbBalnance3.toString()),
      Number(gbBalnance2.toString()) + Number(web3.utils.toWei("0.2")),
      "gb account balance is not ok after withdraw2"
    );
  });
  it("should fail gbFund withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setGbFundAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount8,
      value: amount1,
    });
    await treasuryManagerInstance
      .withdrawGb(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
    await treasuryManagerInstance.setGbFundAddress(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawGb(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await treasuryManagerInstance
      .withdrawGb(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawGb(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw  some balance and then try to withdraw
    await treasuryManagerInstance.withdrawGb(
      web3.utils.toWei("0.02"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawGb(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });
  //*****************************************withdraw tree research balance ************************************** */
  it("should withdraw tree research succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawTreeResearch(
      web3.utils.toWei("0.004"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw tree research data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("3");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalTreeResearchFunded =
      ((Number(amount) + Number(amount1)) * treeResearch) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("5").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalTreeResearchFunded,
      Number(totalFunds1.treeResearch.toString()),
      "treeResearch total fund1 is not ok"
    );
    const treeResearchBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const treeResearchBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("4.8")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.treeResearch.toString()) -
        Number(totalFunds2.treeResearch.toString()),
      Number(web3.utils.toWei("0.2")),
      "tree research total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(treeResearchBalnance2.toString()),
      Number(treeResearchBalnance1.toString()) +
        Number(web3.utils.toWei("0.2")),
      "tree research account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawTreeResearch(
      web3.utils.toWei("0.3"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.3")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const treeResearchBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("4.5")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.treeResearch.toString()) -
        Number(totalFunds3.treeResearch.toString()),
      Number(web3.utils.toWei("0.5")),
      "tree research total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.treeResearch.toString()),
      Number(web3.utils.toWei("0.5")),
      "tree research total fund must be 0.5 eth"
    );
    assert.equal(
      totalTreeResearchFunded - Number(web3.utils.toWei("0.5")),
      Number(totalFunds3.treeResearch.toString()),
      "tree research total fund3 is not ok"
    );
    assert.equal(
      Number(treeResearchBalnance3.toString()),
      Number(treeResearchBalnance1.toString()) +
        Number(web3.utils.toWei("0.5")),
      "tree research account balance  is not ok after withdraw2 ( checking with tree researchBalance1 )"
    );
    assert.equal(
      Number(treeResearchBalnance3.toString()),
      Number(treeResearchBalnance2.toString()) +
        Number(web3.utils.toWei("0.3")),
      "tree research account balance is not ok after withdraw2"
    );
  });
  it("should fail tree research withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreeResearchAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    await treasuryManagerInstance
      .withdrawTreeResearch(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
    await treasuryManagerInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawTreeResearch(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await treasuryManagerInstance
      .withdrawTreeResearch(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawTreeResearch(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw  some balance and then try to withdraw
    await treasuryManagerInstance.withdrawTreeResearch(
      web3.utils.toWei("0.02"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance
      .withdrawTreeResearch(web3.utils.toWei("0.02"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw local develop balance ************************************** */
  it("should withdraw local develop succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw local develop data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 1500;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalLocalDevelopFunded =
      ((Number(amount) + Number(amount1)) * localDevelop) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalLocalDevelopFunded,
      Number(totalFunds1.localDevelop.toString()),
      "local develop total fund1 is not ok"
    );
    const localDevelopBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const localDevelopBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.localDevelop.toString()) -
        Number(totalFunds2.localDevelop.toString()),
      Number(web3.utils.toWei("0.1")),
      "local develop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(localDevelopBalnance2.toString()),
      Number(localDevelopBalnance1.toString()) +
        Number(web3.utils.toWei("0.1")),
      "local develop account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const localDevelopBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.localDevelop.toString()) -
        Number(totalFunds3.localDevelop.toString()),
      Number(web3.utils.toWei("0.3")),
      "localDevelop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.localDevelop.toString()),
      0,
      "local develop total fund must be zero"
    ); //total value of localDevelop has withdrawn
    assert.equal(
      Number(localDevelopBalnance3.toString()),
      Number(localDevelopBalnance1.toString()) +
        Number(web3.utils.toWei("0.3")),
      "local develop account balance  is not ok after withdraw2 ( checking with localDevelopBalance1 )"
    );
    assert.equal(
      Number(localDevelopBalnance3.toString()),
      Number(localDevelopBalnance2.toString()) +
        Number(web3.utils.toWei("0.2")),
      "local develop account balance is not ok after withdraw2"
    );
  });
  it("should fail local develop withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setLocalDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });

    await treasuryManagerInstance
      .withdrawLocalDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treasuryManagerInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawLocalDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treasuryManagerInstance
      .withdrawLocalDevelop(web3.utils.toWei("0"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawLocalDevelop(web3.utils.toWei("3"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await treasuryManagerInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.02"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawLocalDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw rescue balance ************************************** */
  it("should withdraw rescue succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawRescueFund(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw rescue fund data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalRescueFundFunded =
      ((Number(amount) + Number(amount1)) * rescueFund) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalRescueFundFunded,
      Number(totalFunds1.rescueFund.toString()),
      "rescue total fund1 is not ok"
    );
    const rescueFundBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawRescueFund(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const rescueFundBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.rescueFund.toString()) -
        Number(totalFunds2.rescueFund.toString()),
      Number(web3.utils.toWei("0.1")),
      "rescue fund total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(rescueFundBalnance2.toString()),
      Number(rescueFundBalnance1.toString()) + Number(web3.utils.toWei("0.1")),
      "rescue fund account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const rescueFundBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.rescueFund.toString()) -
        Number(totalFunds3.rescueFund.toString()),
      Number(web3.utils.toWei("0.3")),
      "rescue fund total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.rescueFund.toString()),
      0,
      "rescueFund total fund must be zero"
    ); //total value of rescueFund has withdrawn
    assert.equal(
      Number(rescueFundBalnance3.toString()),
      Number(rescueFundBalnance1.toString()) + Number(web3.utils.toWei("0.3")),
      "rescueFund account balance  is not ok after withdraw2 ( checking with rescueFundBalance1 )"
    );
    assert.equal(
      Number(rescueFundBalnance3.toString()),
      Number(rescueFundBalnance2.toString()) + Number(web3.utils.toWei("0.2")),
      "rescueFund account balance is not ok after withdraw2"
    );
  });
  it("should fail rescue fund withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setRescueFundAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });

    await treasuryManagerInstance
      .withdrawRescueFund(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treasuryManagerInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawRescueFund(web3.utils.toWei("0.02"), withdrawReason, {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treasuryManagerInstance
      .withdrawRescueFund(web3.utils.toWei("0"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawRescueFund(web3.utils.toWei("3"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await treasuryManagerInstance.withdrawRescueFund(
      web3.utils.toWei("0.02"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawRescueFund(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw treejer develop balance ************************************** */
  it("should withdraw treejer develop succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer develop data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalTreejerDevelopFunded =
      ((Number(amount) + Number(amount1)) * treejerDevelop) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalTreejerDevelopFunded,
      Number(totalFunds1.treejerDevelop.toString()),
      "treejerDevelop total fund1 is not ok"
    );
    const treejerDevelopBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const treejerDevelopBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.treejerDevelop.toString()) -
        Number(totalFunds2.treejerDevelop.toString()),
      Number(web3.utils.toWei("0.1")),
      "treejerDevelop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(treejerDevelopBalnance2.toString()),
      Number(treejerDevelopBalnance1.toString()) +
        Number(web3.utils.toWei("0.1")),
      "treejer develop account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const treejerDevelopBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.treejerDevelop.toString()) -
        Number(totalFunds3.treejerDevelop.toString()),
      Number(web3.utils.toWei("0.3")),
      "treejer develop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.treejerDevelop.toString()),
      0,
      "treejerDevelop total fund must be zero"
    ); //total value of treejerDevelop has withdrawn
    assert.equal(
      Number(treejerDevelopBalnance3.toString()),
      Number(treejerDevelopBalnance1.toString()) +
        Number(web3.utils.toWei("0.3")),
      "treejer develop account balance  is not ok after withdraw2 ( checking with treejerDevelopBalance1 )"
    );
    assert.equal(
      Number(treejerDevelopBalnance3.toString()),
      Number(treejerDevelopBalnance2.toString()) +
        Number(web3.utils.toWei("0.2")),
      "treejer develop account balance is not ok after withdraw2"
    );
  });
  it("should fail treejer develop withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setTreejerDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });

    await treasuryManagerInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treasuryManagerInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treasuryManagerInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawTreejerDevelop(web3.utils.toWei("3"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await treasuryManagerInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.02"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw other fund1 balance ************************************** */
  it("should withdraw other fund1 succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawOtherFund1(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer other fund 1 to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;
    const totalOtherFund1Funded =
      ((Number(amount) + Number(amount1)) * otherFund1) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalOtherFund1Funded,
      Number(totalFunds1.otherFund1.toString()),
      "otherFund1 total fund1 is not ok"
    );
    const otherFund1Balnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawOtherFund1(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "OtherBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const otherFund1Balnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.otherFund1.toString()) -
        Number(totalFunds2.otherFund1.toString()),
      Number(web3.utils.toWei("0.1")),
      "otherFund1 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(otherFund1Balnance2.toString()),
      Number(otherFund1Balnance1.toString()) + Number(web3.utils.toWei("0.1")),
      "other fund1 account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "OtherBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const otherFund1Balnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.otherFund1.toString()) -
        Number(totalFunds3.otherFund1.toString()),
      Number(web3.utils.toWei("0.3")),
      "other fund1 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.otherFund1.toString()),
      0,
      "other fund1 total fund must be zero"
    ); //total value of otherFund1 has withdrawn
    assert.equal(
      Number(otherFund1Balnance3.toString()),
      Number(otherFund1Balnance1.toString()) + Number(web3.utils.toWei("0.3")),
      "other fund1 account balance is not ok after withdraw2 ( checking with otherFund1Balance1 )"
    );
    assert.equal(
      Number(otherFund1Balnance3.toString()),
      Number(otherFund1Balnance2.toString()) + Number(web3.utils.toWei("0.2")),
      "other fund1 account balance is not ok after withdraw2"
    );
  });
  it("should fail other fund 1 withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund1Address(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });

    await treasuryManagerInstance
      .withdrawOtherFund1(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treasuryManagerInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawOtherFund1(web3.utils.toWei("0.02"), withdrawReason, {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treasuryManagerInstance
      .withdrawOtherFund1(web3.utils.toWei("0"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawOtherFund1(web3.utils.toWei("3"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await treasuryManagerInstance.withdrawOtherFund1(
      web3.utils.toWei("0.02"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawOtherFund1(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw other fund2 balance ************************************** */
  it("should withdraw other fund2 succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("0.02");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    const tx = await treasuryManagerInstance.withdrawOtherFund2(
      web3.utils.toWei("0.002"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer other fund 1 to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const gbFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;
    const totalOtherFund2Funded =
      ((Number(amount) + Number(amount1)) * otherFund2) / 10000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const totalFunds1 = await treasuryManagerInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund.toString()),
      Number(web3.utils.toWei("3").toString()),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalOtherFund2Funded,
      Number(totalFunds1.otherFund2.toString()),
      "otherFund2 total fund1 is not ok"
    );
    const otherFund2Balnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await treasuryManagerInstance.withdrawOtherFund2(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "OtherBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const otherFund2Balnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1.toString()),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Number(totalFunds1.otherFund2.toString()) -
        Number(totalFunds2.otherFund2.toString()),
      Number(web3.utils.toWei("0.1")),
      "otherFund2 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(otherFund2Balnance2.toString()),
      Number(otherFund2Balnance1.toString()) + Number(web3.utils.toWei("0.1")),
      "other fund2 account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await treasuryManagerInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "OtherBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount.toString()) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await treasuryManagerInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      treasuryManagerInstance.address
    );
    const otherFund2Balnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2.toString()),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Number(totalFunds1.otherFund2.toString()) -
        Number(totalFunds3.otherFund2.toString()),
      Number(web3.utils.toWei("0.3")),
      "other fund2 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.otherFund2.toString()),
      0,
      "other fund2 total fund must be zero"
    ); //total value of otherFund2 has withdrawn
    assert.equal(
      Number(otherFund2Balnance3.toString()),
      Number(otherFund2Balnance1.toString()) + Number(web3.utils.toWei("0.3")),
      "other fund2 account balance is not ok after withdraw2 ( checking with otherFund2Balance1 )"
    );
    assert.equal(
      Number(otherFund2Balnance3.toString()),
      Number(otherFund2Balnance2.toString()) + Number(web3.utils.toWei("0.2")),
      "other fund2 account balance is not ok after withdraw2"
    );
  });
  it("should fail other fund2 withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await treasuryManagerInstance.setOtherFund2Address(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("0.2");
    const amount1 = web3.utils.toWei("0.1");
    const planterFund = 5000;
    const gbFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;

    await treasuryManagerInstance.addFundDistributionModel(
      planterFund,
      gbFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      otherFund1,
      otherFund2,
      {
        from: deployerAccount,
      }
    );
    await treasuryManagerInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await treasuryManagerInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await treasuryManagerInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });

    await treasuryManagerInstance
      .withdrawOtherFund2(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treasuryManagerInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    await treasuryManagerInstance
      .withdrawOtherFund2(web3.utils.toWei("0.02"), withdrawReason, {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treasuryManagerInstance
      .withdrawOtherFund2(web3.utils.toWei("0"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await treasuryManagerInstance
      .withdrawOtherFund2(web3.utils.toWei("3"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await treasuryManagerInstance.withdrawOtherFund2(
      web3.utils.toWei("0.02"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await treasuryManagerInstance
      .withdrawOtherFund2(web3.utils.toWei("0.02"), withdrawReason, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  // //----------------------------------------------gsn test-------------------------------------------
  it("Test gsn in treasuryManager", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");
    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;

    await treasuryManagerInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setWhitelistTarget(treasuryManagerInstance.address, {
      from: deployerAccount,
    });
    await paymaster.setRelayHub(relayHubAddress);
    await paymaster.setTrustedForwarder(forwarderAddress);
    web3.eth.sendTransaction({
      from: accounts[0],
      to: paymaster.address,
      value: web3.utils.toWei("1"),
    });

    origProvider = web3.currentProvider;

    conf = { paymasterAddress: paymaster.address };

    gsnProvider = await Gsn.RelayProvider.newProvider({
      provider: origProvider,
      config: conf,
    }).init();

    provider = new ethers.providers.Web3Provider(gsnProvider);

    await Common.addPlanter(arInstance, deployerAccount, deployerAccount);

    let signer = provider.getSigner(1);

    let contract = await new ethers.Contract(
      treasuryManagerInstance.address,
      treasuryManagerInstance.abi,
      signer
    );

    let balanceBefore = await web3.eth.getBalance(deployerAccount);

    await await contract.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0
    );

    let balanceAfter = await web3.eth.getBalance(deployerAccount);

    assert.equal(
      Number(balanceAfter.toString()),
      Number(balanceBefore.toString()),
      "Set otherFundAddress1 address not true"
    );
  });
});
