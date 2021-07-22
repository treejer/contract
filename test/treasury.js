const AccessRestriction = artifacts.require("AccessRestriction");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const Math = require("./math");

const { CommonErrorMsg, TreesuryManagerErrorMsg } = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("Treasury", (accounts) => {
  let TreasuryInstance;
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

    TreasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });

  afterEach(async () => {});

  // //************************************ deploy successfully ****************************************//

  it("deploys successfully", async () => {
    const address = TreasuryInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  //-------------------------------setTreeResearchAddress test-------------------------------------------------------
  it("setTreeResearchAddress should be success", async () => {
    let treeResearchAddress = userAccount4;

    await TreasuryInstance.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.treeResearchAddress(),
      treeResearchAddress,
      "Set treeResearchAddress address not true"
    );
  });

  it("setTreeResearchAddress should be fail (invalid access)", async () => {
    let treeResearchAddress = userAccount4;

    await TreasuryInstance.setTreeResearchAddress(treeResearchAddress, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setLocalDevelopAddress test-------------------------------------------------------
  it("setLocalDevelopAddress should be success", async () => {
    let localDevelopAddress = userAccount4;

    await TreasuryInstance.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.localDevelopAddress(),
      localDevelopAddress,
      "Set localDevelopAddress address not true"
    );
  });

  it("setLocalDevelopAddress should be fail (invalid access)", async () => {
    let localDevelopAddress = userAccount4;

    await TreasuryInstance.setLocalDevelopAddress(localDevelopAddress, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setRescueFundAddress test-------------------------------------------------------
  it("setRescueFundAddress should be success", async () => {
    let rescueFundAddress = userAccount4;

    await TreasuryInstance.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.rescueFundAddress(),
      rescueFundAddress,
      "Set rescueFundAddress address not true"
    );
  });

  it("setRescueFundAddress should be fail (invalid access)", async () => {
    let rescueFundAddress = userAccount4;

    await TreasuryInstance.setRescueFundAddress(rescueFundAddress, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setTreejerDevelopAddress test-------------------------------------------------------
  it("setTreejerDevelopAddress should be success", async () => {
    let treejerDevelopAddress = userAccount4;

    await TreasuryInstance.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.treejerDevelopAddress(),
      treejerDevelopAddress,
      "Set treejerDevelopAddress address not true"
    );
  });

  it("setTreejerDevelopAddress should be fail (invalid access)", async () => {
    let treejerDevelopAddress = userAccount4;

    await TreasuryInstance.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setOtherFund1Address test-------------------------------------------------------
  it("setOtherFund1Address should be success", async () => {
    let otherFundAddress1 = userAccount4;

    await TreasuryInstance.setOtherFund1Address(otherFundAddress1, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.otherFundAddress1(),
      otherFundAddress1,
      "Set otherFundAddress1 address not true"
    );
  });

  it("setOtherFund1Address should be fail (invalid access)", async () => {
    let otherFundAddress1 = userAccount4;

    await TreasuryInstance.setOtherFund1Address(otherFundAddress1, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //-------------------------------setOtherFund2Address test-------------------------------------------------------
  it("setOtherFund2Address should be success", async () => {
    let otherFundAddress2 = userAccount4;

    await TreasuryInstance.setOtherFund2Address(otherFundAddress2, {
      from: deployerAccount,
    });

    assert.equal(
      await TreasuryInstance.otherFundAddress2(),
      otherFundAddress2,
      "Set otherFundAddress2 address not true"
    );
  });

  it("setOtherFund2Address should be fail (invalid access)", async () => {
    let otherFundAddress2 = userAccount4;

    await TreasuryInstance.setOtherFund2Address(otherFundAddress2, {
      from: userAccount5,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //--------------------------------addFundDistributionModel test-----------------------------------------------
  it("addFundDistributionModel should be success", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    let result = await TreasuryInstance.fundDistributions.call(0);

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

    assert.equal(Number(result.otherFund1), 0, "otherFund1 percent not true");

    assert.equal(Number(result.otherFund2), 0, "otherFund2 percent not true");
  });

  it("addFundDistributionModel should be reject invalid access", async () => {
    await TreasuryInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: userAccount1,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("addFundDistributionModel should be reject sum must be 10000", async () => {
    await TreasuryInstance.addFundDistributionModel(
      8000,
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
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);

    await TreasuryInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      1200,
      300,
      300,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.SUM_INVALID);
  });

  //--------------------------------------------assignTreeFundDistributionModel test------------------------------------
  it("1.assignTreeFundDistributionModel should be success", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(101, 1000000, 3, {
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
      {
        startingTreeId: 101,
        distributionModelId: 3,
      },
    ];

    let resultMaxAssignedIndex = await TreasuryInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex),
      1000000,
      "1.maxAssignedIndex not true"
    );

    for (let i = 0; i < 4; i++) {
      let array = await TreasuryInstance.assignModels(i);
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

    await TreasuryInstance.assignTreeFundDistributionModel(1000001, 0, 0, {
      from: deployerAccount,
    });

    let resultMaxAssignedIndex2 = await TreasuryInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex2),
      2 ** 256 - 1,
      "2.maxAssignedIndex not true"
    );
  });

  it("2.assignTreeFundDistributionModel should be success", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(1000001, 0, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(101, 1000000, 3, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(11, 100, 2, {
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
      let array = await TreasuryInstance.assignModels(i);
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

    await TreasuryInstance.assignTreeFundDistributionModel(1, 10, 1, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    let resultMaxAssignedIndex1 = await TreasuryInstance.maxAssignedIndex();

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
      let array = await TreasuryInstance.assignModels(i);
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
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(1, 10, 1, {
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
      let array = await TreasuryInstance.assignModels(i);
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

    let resultMaxAssignedIndex1 = await TreasuryInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      100,
      "1.maxAssignedIndex not true"
    );
  });

  it("4.assignTreeFundDistributionModel should be success", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(1, 2, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(0, 5, 1, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(8, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(3, 9, 2, {
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
      let array = await TreasuryInstance.assignModels(i);
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

    let resultMaxAssignedIndex1 = await TreasuryInstance.maxAssignedIndex();

    assert.equal(
      Number(resultMaxAssignedIndex1),
      10,
      "1.maxAssignedIndex not true"
    );
  });

  it("assignTreeFundDistributionModel should be reject invalid access", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: userAccount1,
    }).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //************************************ fund tree test ****************************************//

  it("fundTree should be fail (invalid fund model)", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(3, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.fundTree(1, {
      from: userAccount3,
      value: web3.utils.toWei("1", "Ether"),
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.INVALID_FUND_MODEL);
  });

  it("fundTree should be fail (invalid access)", async () => {
    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.fundTree(1, {
      from: userAccount1,
      value: web3.utils.toWei("1", "Ether"),
    }).should.be.rejectedWith(CommonErrorMsg.ONLY_AUCTION); //TODO: @mahdi there is no thing like this
  });

  it("1.fundTree should be success", async () => {
    let treeId = 10;
    let amount = web3.utils.toWei(".18", "Ether");

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let tx = await TreasuryInstance.fundTree(treeId, {
      from: userAccount3,
      value: amount,
    });

    assert.equal(
      await web3.eth.getBalance(TreasuryInstance.address),
      amount,
      "1.Contract balance is not true"
    );

    truffleAssert.eventNotEmitted(tx, "DistributionModelOfTreeNotExist");

    let pFund = await TreasuryInstance.planterFunds.call(treeId);

    let rFund = await TreasuryInstance.referralFunds.call(treeId);

    let totalFunds = await TreasuryInstance.totalFunds();

    let expected = {
      planterFund: (40 * amount) / 100,
      referralFund: (12 * amount) / 100,
      treeResearch: (12 * amount) / 100,
      localDevelop: (12 * amount) / 100,
      rescueFund: (12 * amount) / 100,
      treejerDevelop: (12 * amount) / 100,
      otherFund1: 0,
      otherFund2: 0,
    };

    assert.equal(Number(pFund), expected.planterFund, "planter funds invalid");

    assert.equal(
      Number(rFund),
      expected.referralFund,
      "referral funds invalid"
    );

    assert.equal(
      Number(totalFunds.planterFund),
      expected.planterFund,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds.referralFund),
      expected.referralFund,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treeResearch),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds.localDevelop),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.rescueFund),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treejerDevelop),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund1),
      expected.otherFund1,
      "otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund2),
      expected.otherFund2,
      "otherFund2 funds invalid"
    );
  });

  it("2.fundTree should be success", async () => {
    let treeId1 = 0;
    let treeId2 = 20;
    let amount1 = web3.utils.toWei(".23", "Ether");
    let amount2 = web3.utils.toWei(".28", "Ether");

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(1, 20, 1, {
      from: deployerAccount,
    });

    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount3,
      value: amount2,
    });

    assert.equal(
      await web3.eth.getBalance(TreasuryInstance.address),
      web3.utils.toWei(".28", "Ether"),
      "1.Contract balance is not true"
    );

    let pFund2 = await TreasuryInstance.planterFunds.call(treeId2);

    let rFund2 = await TreasuryInstance.referralFunds.call(treeId2);

    let totalFunds2 = await TreasuryInstance.totalFunds();

    let expected2 = {
      planterFund: (30 * amount2) / 100,
      referralFund: (12 * amount2) / 100,
      treeResearch: (12 * amount2) / 100,
      localDevelop: (12 * amount2) / 100,
      rescueFund: (12 * amount2) / 100,
      treejerDevelop: (12 * amount2) / 100,
      otherFund1: (5 * amount2) / 100,
      otherFund2: (5 * amount2) / 100,
    };

    assert.equal(
      Number(pFund2),
      expected2.planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(rFund2),
      expected2.referralFund,
      "referral funds invalid"
    );

    assert.equal(
      Number(totalFunds2.planterFund),
      expected2.planterFund,
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds2.referralFund),
      expected2.referralFund,
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treeResearch),
      expected2.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds2.localDevelop),
      expected2.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.rescueFund),
      expected2.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds2.treejerDevelop),
      expected2.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds2.otherFund1),
      expected2.otherFund1,
      "otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds2.otherFund2),
      expected2.otherFund2,
      "otherFund2 funds invalid"
    );

    await TreasuryInstance.fundTree(treeId1, {
      from: userAccount3,
      value: amount1,
    });

    assert.equal(
      await web3.eth.getBalance(TreasuryInstance.address),
      web3.utils.toWei(".51", "Ether"),
      "2.Contract balance is not true"
    );

    let expected = {
      planterFund: (40 * amount1) / 100,
      referralFund: (12 * amount1) / 100,
      treeResearch: (12 * amount1) / 100,
      localDevelop: (12 * amount1) / 100,
      rescueFund: (12 * amount1) / 100,
      treejerDevelop: (12 * amount1) / 100,
      otherFund1: 0,
      otherFund2: 0,
    };

    let pFund = await TreasuryInstance.planterFunds.call(treeId1);

    let rFund = await TreasuryInstance.referralFunds.call(treeId1);

    let totalFunds = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(pFund),
      expected.planterFund,
      "2.planter funds invalid"
    );

    assert.equal(
      Number(rFund),
      expected.referralFund,
      "2.referral funds invalid"
    );

    assert.equal(
      Number(totalFunds.planterFund),
      Math.add(expected.planterFund, expected2.planterFund),
      "2.planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFunds.referralFund),
      Math.add(expected.referralFund, expected2.referralFund),
      "2.referralFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treeResearch),
      Math.add(expected.treeResearch, expected2.treeResearch),
      "2.treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFunds.localDevelop),
      Math.add(expected.localDevelop, expected2.localDevelop),
      "2.localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.rescueFund),
      Math.add(expected.rescueFund, expected2.rescueFund),
      "2.rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFunds.treejerDevelop),
      Math.add(expected.treejerDevelop, expected2.treejerDevelop),
      "2.treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund1),
      Math.add(expected.otherFund1, expected2.otherFund1),
      "2.otherFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.otherFund2),
      Math.add(expected.otherFund2, expected2.otherFund2),
      "2.otherFund2 funds invalid"
    );
  });

  it("3.fundTree should be success", async () => {
    let amount = web3.utils.toWei(".2", "Ether");

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(101, 1000000, 3, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(11, 100, 2, {
      from: deployerAccount,
    });

    await TreasuryInstance.assignTreeFundDistributionModel(1, 10, 1, {
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

    await TreasuryInstance.fundTree(0, {
      from: userAccount3,
      value: amount,
    });

    let pFund0 = await TreasuryInstance.planterFunds.call(0);

    assert.equal(
      Number(pFund0),
      expected.planterFundModel0,
      "Planter funds invalid treeId 0"
    );

    //check treeId 1

    await TreasuryInstance.fundTree(1, {
      from: userAccount3,
      value: amount,
    });

    let pFund1 = await TreasuryInstance.planterFunds.call(1);

    assert.equal(
      Number(pFund1),
      expected.planterFundModel1,
      "Planter funds invalid treeId 1"
    );

    //check treeId 5

    await TreasuryInstance.fundTree(5, {
      from: userAccount3,
      value: amount,
    });

    let pFund5 = await TreasuryInstance.planterFunds.call(5);

    assert.equal(
      Number(pFund5),
      expected.planterFundModel1,
      "Planter funds invalid treeId 5"
    );

    //check treeId 10

    await TreasuryInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    let pFund10 = await TreasuryInstance.planterFunds.call(10);

    assert.equal(
      Number(pFund10),
      expected.planterFundModel1,
      "Planter funds invalid treeId 10"
    );

    //check treeId 11

    await TreasuryInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    let pFund11 = await TreasuryInstance.planterFunds.call(11);

    assert.equal(
      Number(pFund11),
      expected.planterFundModel2,
      "Planter funds invalid treeId 11"
    );

    //check treeId 99

    await TreasuryInstance.fundTree(99, {
      from: userAccount3,
      value: amount,
    });

    let pFund99 = await TreasuryInstance.planterFunds.call(99);

    assert.equal(
      Number(pFund99),
      expected.planterFundModel2,
      "Planter funds invalid treeId 99"
    );

    //check treeId 100

    await TreasuryInstance.fundTree(100, {
      from: userAccount3,
      value: amount,
    });

    let pFund100 = await TreasuryInstance.planterFunds.call(100);

    assert.equal(
      Number(pFund100),
      expected.planterFundModel2,
      "Planter funds invalid treeId 100"
    );

    //check treeId 101

    await TreasuryInstance.fundTree(101, {
      from: userAccount3,
      value: amount,
    });

    let pFund101 = await TreasuryInstance.planterFunds.call(101);

    assert.equal(
      Number(pFund101),
      expected.planterFundModel3,
      "Planter funds invalid treeId 101"
    );

    //check treeId 1500

    await TreasuryInstance.fundTree(1500, {
      from: userAccount3,
      value: amount,
    });

    let pFund1500 = await TreasuryInstance.planterFunds.call(1500);

    assert.equal(
      Number(pFund1500),
      expected.planterFundModel3,
      "Planter funds invalid treeId 1500"
    );

    //check treeId 1000000

    await TreasuryInstance.fundTree(1000000, {
      from: userAccount3,
      value: amount,
    });

    let pFund1000000 = await TreasuryInstance.planterFunds.call(1000000);

    assert.equal(
      Number(pFund1000000),
      expected.planterFundModel3,
      "Planter funds invalid treeId 1000000"
    );

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(5000, 10000, 4, {
      from: deployerAccount,
    });

    //check treeId 4999

    await TreasuryInstance.fundTree(4999, {
      from: userAccount3,
      value: amount,
    });

    let pFund4999 = await TreasuryInstance.planterFunds.call(4999);

    assert.equal(
      Number(pFund4999),
      expected.planterFundModel3,
      "Planter funds invalid treeId 4999"
    );

    //check treeId 5000

    await TreasuryInstance.fundTree(5000, {
      from: userAccount3,
      value: amount,
    });

    let pFund5000 = await TreasuryInstance.planterFunds.call(5000);

    assert.equal(
      Number(pFund5000),
      expected.planterFundModel4,
      "Planter funds invalid treeId 5000"
    );

    //check treeId 6000

    await TreasuryInstance.fundTree(6000, {
      from: userAccount3,
      value: amount,
    });

    let pFund6000 = await TreasuryInstance.planterFunds.call(6000);

    assert.equal(
      Number(pFund6000),
      expected.planterFundModel4,
      "Planter funds invalid treeId 6000"
    );

    //check treeId 10000

    await TreasuryInstance.fundTree(10000, {
      from: userAccount3,
      value: amount,
    });

    let pFund10000 = await TreasuryInstance.planterFunds.call(10000);

    assert.equal(
      Number(pFund10000),
      expected.planterFundModel4,
      "Planter funds invalid treeId 10000"
    );

    //check treeId 10001

    await TreasuryInstance.fundTree(10001, {
      from: userAccount3,
      value: amount,
    });

    let pFund10001 = await TreasuryInstance.planterFunds.call(10001);

    assert.equal(
      Number(pFund10001),
      expected.planterFundModel3,
      "Planter funds invalid treeId 10001"
    );

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(4, 10, 5, {
      from: deployerAccount,
    });

    //check treeId 4
    await TreasuryInstance.fundTree(4, {
      from: userAccount3,
      value: amount,
    });

    let pFund4 = await TreasuryInstance.planterFunds.call(4);

    assert.equal(
      Number(pFund4),
      expected.planterFundModel5,
      "Planter funds invalid treeId 4"
    );

    //check treeId 10_2
    await TreasuryInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    let pFund10_2 = await TreasuryInstance.planterFunds.call(10);

    assert.equal(
      Number(pFund10_2),
      expected.planterFundModel5,
      "Planter funds invalid treeId pFund10_2"
    );

    //check treeId 11_2
    await TreasuryInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    let pFund11_2 = await TreasuryInstance.planterFunds.call(11);

    assert.equal(
      Number(pFund11_2),
      expected.planterFundModel2,
      "Planter funds invalid treeId pFund11_2"
    );

    //check treeId 3
    await TreasuryInstance.fundTree(3, {
      from: userAccount3,
      value: amount,
    });

    let pFund3 = await TreasuryInstance.planterFunds.call(3);

    assert.equal(
      Number(pFund3),
      expected.planterFundModel1,
      "Planter funds invalid treeId pFund3"
    );

    let maxAssignedIndex1 = await TreasuryInstance.maxAssignedIndex();

    assert.equal(
      Number(maxAssignedIndex1),
      1000000,
      "maxAssignedIndex1 not tTrue"
    );
  });

  it("Check DistributionModelOfTreeNotExist event", async () => {
    let amount = web3.utils.toWei("1", "Ether");

    await TreasuryInstance.addFundDistributionModel(
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let tx10 = await TreasuryInstance.fundTree(10, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx10, "DistributionModelOfTreeNotExist");

    let tx0 = await TreasuryInstance.fundTree(0, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx0, "DistributionModelOfTreeNotExist");

    let tx11 = await TreasuryInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventEmitted(tx11, "DistributionModelOfTreeNotExist");

    await TreasuryInstance.assignTreeFundDistributionModel(11, 100, 0, {
      from: deployerAccount,
    });

    tx11 = await TreasuryInstance.fundTree(11, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx11, "DistributionModelOfTreeNotExist");

    let tx100 = await TreasuryInstance.fundTree(100, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx100, "DistributionModelOfTreeNotExist");

    let tx102 = await TreasuryInstance.fundTree(102, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventEmitted(tx102, "DistributionModelOfTreeNotExist");

    await TreasuryInstance.assignTreeFundDistributionModel(5, 0, 0, {
      from: deployerAccount,
    });

    let tx1000000 = await TreasuryInstance.fundTree(1000000, {
      from: userAccount3,
      value: amount,
    });

    truffleAssert.eventNotEmitted(tx1000000, "DistributionModelOfTreeNotExist");
  });

  //************************************ fund planter test ****************************************//
  it("fund planter successfully", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let tx = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    await TreasuryInstance.fundPlanter(treeId, userAccount2, 25920, {
      from: userAccount1,
    });
  });

  it("fund planter successfully with organazationAddress", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount4
    );

    await Common.acceptPlanterByOrganization(
      planterInstance,
      userAccount4,
      userAccount2,
      7000
    );

    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let tx = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    await TreasuryInstance.fundPlanter(treeId, userAccount2, 25920, {
      from: userAccount1,
    });
  });

  it("check fund planter data to be ok1", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);
    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
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

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      userAccount3,
      zeroAddress
    );

    const planterTotalFunded = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const referralTotalFunded = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    let fundT = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    const totalFund = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(totalFund.planterFund),
      Math.divide(Math.mul(Number(amount), planterFund), 10000),
      "total fund is not correct1"
    );

    let fundP1 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      {
        from: userAccount1,
      }
    );

    const totalFund1 = await TreasuryInstance.totalFunds();
    let planterPaid1 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance1 = await TreasuryInstance.balances(userAccount2);
    let referralBalance1 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund1.planterFund),
      "total fund1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund1.referralFund),
      "total fund1 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
      Number(planterPaid1),
      "planter paid is not ok"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
      Number(planterBalance1),
      "planter balance is not ok1"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus),
      Number(referralBalance1),
      "referral balance is not ok1"
    );

    ///////////////////////////////
    let fundP2 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      { from: userAccount1 }
    );
    const totalFund2 = await TreasuryInstance.totalFunds();
    let planterPaid2 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance2 = await TreasuryInstance.balances(userAccount2);
    let referralBalance2 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund2.planterFund),
      "total fund2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund2.referralFund),
      "total fund2 referral is not ok"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),

      Number(planterPaid2),
      "planter paid is not ok2"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
      Number(planterBalance2),
      "planter balance is not ok2"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus),
      Number(referralBalance2),
      "referral balance is not ok2"
    );
    /////////////////////////

    let fundP3 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus2,
      { from: userAccount1 }
    );
    const totalFund3 = await TreasuryInstance.totalFunds();

    let planterPaid3 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance3 = await TreasuryInstance.balances(userAccount2);
    let referralBalance3 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus)
      ),
      Number(totalFund3.planterFund),
      "total fund3 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus2), finalStatus)
      ),
      Number(totalFund3.referralFund),
      "total fund3 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
      Number(planterPaid3),
      "planter paid is not ok3"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
      Number(planterBalance3),
      "planter balance is not ok3"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus2), finalStatus),
      Number(referralBalance3),
      "referral balance is not ok3"
    );

    // ///////////

    let fundP4 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus3,
      { from: userAccount1 }
    );
    const totalFund4 = await TreasuryInstance.totalFunds();

    let planterPaid4 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance4 = await TreasuryInstance.balances(userAccount2);
    let referralBalance4 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus)
      ),
      Number(totalFund4.planterFund),
      "total fund4 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus3), finalStatus)
      ),
      Number(totalFund4.referralFund),
      "total fund4 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus),
      Number(planterPaid4),
      "planter paid is not ok4"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus),
      Number(planterBalance4),
      "planter balance is not ok4"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus3), finalStatus),
      Number(referralBalance4),
      "referral balance is not ok4"
    );

    /////////////////

    let fundP5 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus4,
      { from: userAccount1 }
    );
    const totalFund5 = await TreasuryInstance.totalFunds();
    let planterPaid5 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance5 = await TreasuryInstance.balances(userAccount2);
    let referralBalance5 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus)
      ),
      Number(totalFund5.planterFund),
      "total fund5 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus4), finalStatus)
      ),
      Number(totalFund5.referralFund),
      "total fund5 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus),
      Number(planterPaid5),
      "planter paid is not ok5"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus),
      Number(planterBalance5),
      "planter balance is not ok5"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus4), finalStatus),
      Number(referralBalance5),
      "referral balance is not ok5"
    );
    /////////////////

    let fundP6 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus5,
      { from: userAccount1 }
    );
    const totalFund6 = await TreasuryInstance.totalFunds();
    let planterPaid6 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance6 = await TreasuryInstance.balances(userAccount2);
    let referralBalance6 = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        planterTotalFunded
      ),
      Number(totalFund6.planterFund),
      "total fund6 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        referralTotalFunded
      ),
      Number(totalFund5.referralFund),
      "total fund6 referral is not ok"
    );

    assert.equal(
      planterTotalFunded,
      Number(planterPaid6),
      "planter paid is not ok6"
    );
    assert.equal(
      planterTotalFunded,
      Number(planterBalance6),
      "planter balance is not ok6"
    );

    assert.equal(
      referralTotalFunded,
      Number(referralBalance6),
      "referral balance is not ok6"
    );
  });

  it("check fund planter data to be ok1 with organizationAddress", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
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

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount4,
      zeroAddress,
      deployerAccount
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      3,
      userAccount2,
      userAccount3,
      userAccount4
    );

    let planterPortion = 5000;

    await Common.acceptPlanterByOrganization(
      planterInstance,
      userAccount4,
      userAccount2,
      planterPortion
    );

    const planterTotalFunded = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const referralTotalFunded = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    let fundT = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    const totalFund = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(totalFund.planterFund),
      Math.divide(Math.mul(Number(amount), planterFund), 10000),
      "total fund is not correct1"
    );

    let fundP1 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      {
        from: userAccount1,
      }
    );

    const totalFund1 = await TreasuryInstance.totalFunds();
    let planterPaid1 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance1 = await TreasuryInstance.balances(userAccount2);
    let referralBalance1 = await TreasuryInstance.balances(userAccount3);
    let organizationBalance1 = await TreasuryInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund1.planterFund),
      "total fund1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund1.referralFund),
      "total fund1 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
      Number(planterPaid1),
      "planter paid is not ok"
    );
    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
          planterPortion
        ),
        10000
      ),
      Number(planterBalance1),
      "planter balance is not ok1"
    );

    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
          planterPortion
        ),
        10000
      ),
      Number(organizationBalance1),
      "organization balance is not ok1"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus),
      Number(referralBalance1),
      "referral balance is not ok1"
    );

    ///////////////////////////////
    let fundP2 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      { from: userAccount1 }
    );
    const totalFund2 = await TreasuryInstance.totalFunds();
    let planterPaid2 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance2 = await TreasuryInstance.balances(userAccount2);
    let referralBalance2 = await TreasuryInstance.balances(userAccount3);
    let organizationBalance2 = await TreasuryInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund2.planterFund),
      "total fund2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund2.referralFund),
      "total fund2 referral is not ok"
    );
    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),

      Number(planterPaid2),
      "planter paid is not ok2"
    );
    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
          planterPortion
        ),
        10000
      ),
      Number(planterBalance2),
      "planter balance is not ok2"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus1), finalStatus),
      Number(referralBalance2),
      "referral balance is not ok2"
    );

    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus),
          planterPortion
        ),
        10000
      ),

      Number(organizationBalance2),
      "organization balance is not ok2"
    );
    // /////////////////////////

    let fundP3 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus2,
      { from: userAccount1 }
    );
    const totalFund3 = await TreasuryInstance.totalFunds();

    let planterPaid3 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance3 = await TreasuryInstance.balances(userAccount2);
    let referralBalance3 = await TreasuryInstance.balances(userAccount3);
    let organizationBalance3 = await TreasuryInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus)
      ),
      Number(totalFund3.planterFund),
      "total fund3 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus2), finalStatus)
      ),
      Number(totalFund3.referralFund),
      "total fund3 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
      Number(planterPaid3),
      "planter paid is not ok3"
    );
    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
          planterPortion
        ),
        10000
      ),
      Number(planterBalance3),
      "planter balance is not ok3"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus2), finalStatus),
      Number(referralBalance3),
      "referral balance is not ok3"
    );

    assert.equal(
      Math.divide(
        Math.mul(
          Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
          planterPortion
        ),
        10000
      ),
      Number(organizationBalance3),
      "organization balance is not ok3"
    );

    // // ///////////
    let planterPortion2 = 7500;
    await planterInstance.updateOrganizationPlanterPayment(
      userAccount2,
      planterPortion2,
      {
        from: userAccount4,
      }
    );

    let fundP4 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus3,
      { from: userAccount1 }
    );
    const totalFund4 = await TreasuryInstance.totalFunds();

    let planterPaid4 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance4 = await TreasuryInstance.balances(userAccount2);
    let referralBalance4 = await TreasuryInstance.balances(userAccount3);
    let organizationBalance4 = await TreasuryInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus)
      ),
      Number(totalFund4.planterFund),
      "total fund4 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus3), finalStatus)
      ),
      Number(totalFund4.referralFund),
      "total fund4 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus),
      Number(planterPaid4),
      "planter paid is not ok4"
    );

    assert.equal(
      Number(planterBalance4),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            planterPortion2
          ),
          10000
        )
      ),
      "planter balance is not ok4"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus3), finalStatus),
      Number(referralBalance4),
      "referral balance is not ok4"
    );

    assert.equal(
      Number(organizationBalance4),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            Math.subtract(10000, planterPortion2)
          ),
          10000
        )
      ),
      "organization balance is not ok4"
    );

    // /////////////////

    await planterInstance.updatePlanterType(1, zeroAddress, {
      from: userAccount2,
    });

    let fundP5 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus4,
      { from: userAccount1 }
    );

    const totalFund5 = await TreasuryInstance.totalFunds();
    let planterPaid5 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance5 = await TreasuryInstance.balances(userAccount2);
    let referralBalance5 = await TreasuryInstance.balances(userAccount3);
    let organizationBalance5 = await TreasuryInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus)
      ),
      Number(totalFund5.planterFund),
      "total fund5 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        Math.divide(Math.mul(referralTotalFunded, treeStatus4), finalStatus)
      ),
      Number(totalFund5.referralFund),
      "total fund5 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus),
      Number(planterPaid5),
      "planter paid is not ok5"
    );

    assert.equal(
      Number(planterBalance5),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            planterPortion2
          ),
          10000
        ),
        Math.divide(
          Math.mul(planterTotalFunded, Math.subtract(treeStatus4, treeStatus3)),
          finalStatus
        )
      ),
      "planter balance is not ok5"
    );

    assert.equal(
      Number(organizationBalance5),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            Math.subtract(10000, planterPortion2)
          ),
          10000
        )
      ),
      "organization balance is not ok5"
    );

    assert.equal(
      Math.divide(Math.mul(referralTotalFunded, treeStatus4), finalStatus),
      Number(referralBalance5),
      "referral balance is not ok5"
    );
    /////////////////

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount
    );

    await planterInstance.updatePlanterType(3, userAccount5, {
      from: userAccount2,
    });

    let planterPortion3 = 2000;

    await Common.acceptPlanterByOrganization(
      planterInstance,
      userAccount5,
      userAccount2,
      planterPortion3
    );

    let fundP6 = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus5,
      { from: userAccount1 }
    );
    const totalFund6 = await TreasuryInstance.totalFunds();
    let planterPaid6 = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance6 = await TreasuryInstance.balances(userAccount2);
    let referralBalance6 = await TreasuryInstance.balances(userAccount3);
    let firstOrganizationBalance = await TreasuryInstance.balances(
      userAccount4
    );
    let organizationBalance6 = await TreasuryInstance.balances(userAccount5);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, planterFund), 10000),
        planterTotalFunded
      ),
      Number(totalFund6.planterFund),
      "total fund6 is not ok"
    );

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(amount, referralFund), 10000),
        referralTotalFunded
      ),
      Number(totalFund5.referralFund),
      "total fund6 referral is not ok"
    );

    assert.equal(
      planterTotalFunded,
      Number(planterPaid6),
      "planter paid is not ok6"
    );

    assert.equal(
      Number(planterBalance6),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            planterPortion2
          ),
          10000
        ),
        Math.divide(
          Math.mul(planterTotalFunded, Math.subtract(treeStatus4, treeStatus3)),
          finalStatus
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(finalStatus, treeStatus4)
              ),
              finalStatus
            ),
            planterPortion3
          ),
          10000
        )
      ),
      "planter balance is not ok6"
    );

    assert.equal(
      referralTotalFunded,
      Number(referralBalance6),
      "referral balance is not ok6"
    );

    assert.equal(
      Number(firstOrganizationBalance),
      Math.add(
        Math.divide(
          Math.mul(
            Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus),
            planterPortion
          ),
          10000
        ),
        Math.divide(
          Math.mul(
            Math.divide(
              Math.mul(
                planterTotalFunded,
                Math.subtract(treeStatus3, treeStatus2)
              ),
              finalStatus
            ),
            Math.subtract(10000, planterPortion2)
          ),
          10000
        )
      ),
      "firstorganization balance is not ok"
    );

    assert.equal(
      Number(organizationBalance6),

      Math.divide(
        Math.mul(
          Math.divide(
            Math.mul(
              planterTotalFunded,
              Math.subtract(finalStatus, treeStatus4)
            ),
            finalStatus
          ),
          Math.subtract(10000, planterPortion3)
        ),
        10000
      ),
      "organization balance is not ok6"
    );
  });

  it("check fund planter data to be ok1", async () => {
    await Common.addGenesisTreeRole(arInstance, userAccount1, deployerAccount);

    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("1");
    const amount2 = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const treeStatus = 65535; //2^16-1

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      userAccount3,
      zeroAddress
    );

    const planterTotalFunded = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const referralTotalFunded = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let fundT = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    let fundT2 = await TreasuryInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount2,
    });

    const totalFunds = await TreasuryInstance.totalFunds();

    assert.equal(
      Math.add(
        Math.divide(Math.mul(planterFund, Number(amount)), 10000),
        Math.divide(Math.mul(planterFund, Number(amount2)), 10000)
      ),
      Number(totalFunds.planterFund),
      "invalid planter total funds"
    );

    assert.equal(
      Math.add(
        Math.divide(Math.mul(referralFund, Number(amount)), 10000),
        Math.divide(Math.mul(referralFund, Number(amount2)), 10000)
      ),
      Number(totalFunds.referralFund),
      "invalid referral total funds"
    );

    let fundP = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus,
      {
        from: userAccount1,
      }
    );

    truffleAssert.eventEmitted(fundP, "PlanterFunded", (ev) => {
      return (
        Number(ev.treeId) == treeId &&
        ev.planterId == userAccount2 &&
        Number(ev.amount) == planterTotalFunded
      );
    });

    const totalFunds2 = await TreasuryInstance.totalFunds();
    let planterPaid = await TreasuryInstance.plantersPaid.call(treeId);
    let planterBalance = await TreasuryInstance.balances(userAccount2);
    let referralBalance = await TreasuryInstance.balances(userAccount3);

    assert.equal(
      planterTotalFunded,
      Number(planterPaid),
      "planter paid is not ok"
    );

    assert.equal(
      planterTotalFunded,
      Number(planterBalance),
      "planter balance is not ok1"
    );

    assert.equal(
      referralTotalFunded,
      Number(referralBalance),
      "referral balance is not ok1"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, amount2), 10000),
      Number(totalFunds2.planterFund),
      "total funds2 is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, amount2), 10000),
      Number(totalFunds2.referralFund),
      "total funds2 referral is not ok"
    );
  });

  it("should fail fund planter", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    const treeId = 1;
    const treeId2 = 2;
    const amount = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const treeStatus = 65535; //2^16-1

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    const planterTotalFunded = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    let fundT = await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    let fundP = await TreasuryInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus,
      {
        from: userAccount1,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_GENESIS_TREE);

    await TreasuryInstance.fundPlanter(treeId2, userAccount2, treeStatus, {
      from: userAccount2,
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
  });

  //*****************************************withdraw planter balance ************************************** */

  it("should withdraw planter succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount3,
      userAccount4,
      zeroAddress
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    let planterBalance = await web3.eth.getBalance(userAccount3);

    let referralBalance = await web3.eth.getBalance(userAccount4);

    let txPlanter = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.5"),
      {
        from: userAccount3,
      }
    );

    let txReferral = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      {
        from: userAccount4,
      }
    );

    let planterGas = await Common.getTransactionFee(txPlanter);

    let referralGas = await Common.getTransactionFee(txReferral);

    assert.equal(
      await web3.eth.getBalance(userAccount3),
      Math.subtract(
        Math.add(Number(planterBalance), Number(web3.utils.toWei("0.5"))),
        planterGas
      )
    );

    assert.equal(
      await web3.eth.getBalance(userAccount4),
      Math.subtract(
        Math.add(Number(referralBalance), Number(web3.utils.toWei("0.1"))),
        referralGas
      )
    );
  });

  it("should withdraw planter and organizationPlanter succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      3,
      userAccount3,
      userAccount4,
      userAccount5
    );

    let planterPortion = 2000;

    await Common.acceptPlanterByOrganization(
      planterInstance,
      userAccount5,
      userAccount3,
      planterPortion
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });
    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    let planterBalance = await web3.eth.getBalance(userAccount3);

    let referralBalance = await web3.eth.getBalance(userAccount4);

    let organizationBalance = await web3.eth.getBalance(userAccount5);

    let txPlanter = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.2"),
      {
        from: userAccount3,
      }
    );

    let txOrganization = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.8"),
      {
        from: userAccount5,
      }
    );

    let txReferral = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      {
        from: userAccount4,
      }
    );

    let planterGas = await Common.getTransactionFee(txPlanter);
    let organizationGas = await Common.getTransactionFee(txOrganization);
    let referralGas = await Common.getTransactionFee(txReferral);

    assert.equal(
      await web3.eth.getBalance(userAccount3),
      Math.subtract(
        Math.add(Number(planterBalance), Number(web3.utils.toWei("0.2"))),
        planterGas
      )
    );

    assert.equal(
      await web3.eth.getBalance(userAccount5),
      Math.subtract(
        Math.add(Number(organizationBalance), Number(web3.utils.toWei("0.8"))),
        organizationGas
      )
    );

    assert.equal(
      await web3.eth.getBalance(userAccount4),
      Math.subtract(
        Math.add(Number(referralBalance), Number(web3.utils.toWei("0.1"))),
        referralGas
      )
    );
  });

  it("check planter withdraw balance to be correct", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount3,
      userAccount4,
      zeroAddress
    );

    const totalPlanterFund = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const totalReferralFund = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    const contractBalanceBeforeFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(contractBalanceBeforeFund)
      ),
      Number(amount),
      "contrct balance charged inconrrectly"
    );

    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    const planterBalance1 = await TreasuryInstance.balances.call(userAccount3);
    const accountBalance1 = await web3.eth.getBalance(userAccount3);

    const referralBalance1 = await TreasuryInstance.balances.call(userAccount4);
    const accountReferralBalance1 = await web3.eth.getBalance(userAccount4);

    assert.equal(
      Number(planterBalance1),
      totalPlanterFund,
      "planter balance is not ok 1"
    );
    assert.equal(
      Number(referralBalance1),
      totalReferralFund,
      "referral balance is not ok 1"
    );

    const tx = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3
      );
    });

    const txReferral = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(txReferral, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount4
      );
    });

    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("0.2"))
      ),
      Number(contractBalanceAfterWithdraw1),
      "contract balance is not ok after withdraw 1"
    );

    const planterBalance2 = await TreasuryInstance.balances.call(userAccount3);
    const accountBalance2 = await web3.eth.getBalance(userAccount3);

    const referralBalance2 = await TreasuryInstance.balances.call(userAccount4);
    const accountReferralBalance2 = await web3.eth.getBalance(userAccount4);

    assert.equal(
      Math.subtract(totalPlanterFund, Number(web3.utils.toWei("0.1"))),
      Number(planterBalance2),
      "planter blance is not ok 2"
    );
    assert.equal(
      Math.subtract(totalReferralFund, Number(web3.utils.toWei("0.1"))),
      Number(referralBalance2),
      "referral blance is not ok 2"
    );

    const txFee = await Common.getTransactionFee(tx);

    assert.equal(
      Number(accountBalance2),
      Math.subtract(
        Math.add(Number(accountBalance1), Number(web3.utils.toWei("0.1"))),
        txFee
      ),
      "planter balance is not ok 2"
    );

    //////////////////////
    const tx2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.5"),
      { from: userAccount3 }
    );

    const txReferral2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.5")) &&
        ev.account == userAccount3
      );
    });

    truffleAssert.eventEmitted(txReferral2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount4
      );
    });

    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("0.8"))
      ),
      Number(contractBalanceAfterWithdraw2),
      "contract balance is not ok after withdraw 2"
    );

    const planterBalance3 = await TreasuryInstance.balances.call(userAccount3);
    const referralBalance4 = await TreasuryInstance.balances.call(userAccount4);

    assert.equal(
      Math.subtract(totalPlanterFund, Number(web3.utils.toWei("0.6"))),
      Number(planterBalance3),
      "planter blance is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(referralBalance4),
      "referral blance is not ok 3"
    );

    const totalFunds = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds.referralFund),
      "totalReferralFund is not ok 3"
    );

    const accountBalance3 = await web3.eth.getBalance(userAccount3);

    const txFee2 = await Common.getTransactionFee(tx2);

    assert.equal(
      Number(accountBalance3),
      Math.subtract(
        Math.add(Number(accountBalance2), Number(web3.utils.toWei("0.5"))),
        txFee2
      ),
      "planter balance is not ok 3"
    );
  });

  it("check planter and organization withdraw balance to be correct", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      3,
      userAccount3,
      userAccount4,
      userAccount5
    );

    let planterPortion = 6300;

    await Common.acceptPlanterByOrganization(
      planterInstance,
      userAccount5,
      userAccount3,
      planterPortion
    );

    const totalPlanterFund = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const totalReferralFund = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    const contractBalanceBeforeFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(contractBalanceBeforeFund)
      ),
      Number(amount),
      "contrct balance charged inconrrectly"
    );

    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    const planterBalance1 = await TreasuryInstance.balances.call(userAccount3);
    const accountBalance1 = await web3.eth.getBalance(userAccount3);

    const referralBalance1 = await TreasuryInstance.balances.call(userAccount4);
    const accountReferralBalance1 = await web3.eth.getBalance(userAccount4);

    const OrganizationBalance1 = await TreasuryInstance.balances.call(
      userAccount5
    );
    const accountOrganizationBalance1 = await web3.eth.getBalance(userAccount5);

    assert.equal(
      Number(planterBalance1),
      Math.divide(Math.mul(totalPlanterFund, planterPortion), 10000),
      "planter balance is not ok 1"
    );

    assert.equal(
      Number(OrganizationBalance1),
      Math.divide(
        Math.mul(totalPlanterFund, Math.subtract(10000, planterPortion)),
        10000
      ),
      "organization balance is not ok 1"
    );

    assert.equal(
      Number(referralBalance1),
      totalReferralFund,
      "referral balance is not ok 1"
    );

    const tx = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3
      );
    });

    const txReferral = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(txReferral, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount4
      );
    });

    const txOrganization = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount5 }
    );

    truffleAssert.eventEmitted(
      txOrganization,
      "PlanterBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
          ev.account == userAccount5
        );
      }
    );

    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("0.3"))
      ),
      Number(contractBalanceAfterWithdraw1),
      "contract balance is not ok after withdraw 1"
    );

    const planterBalance2 = await TreasuryInstance.balances.call(userAccount3);
    const accountBalance2 = await web3.eth.getBalance(userAccount3);

    const referralBalance2 = await TreasuryInstance.balances.call(userAccount4);
    const accountReferralBalance2 = await web3.eth.getBalance(userAccount4);

    const organizationBalance2 = await TreasuryInstance.balances.call(
      userAccount5
    );
    const accountOrganizationBalance2 = await web3.eth.getBalance(userAccount5);

    assert.equal(
      Math.subtract(
        Math.divide(Math.mul(totalPlanterFund, planterPortion), 10000),
        Number(web3.utils.toWei("0.1"))
      ),
      Number(planterBalance2),
      "planter blance is not ok 2"
    );

    assert.equal(
      Math.subtract(
        Math.divide(
          Math.mul(totalPlanterFund, Math.subtract(10000, planterPortion)),
          10000
        ),
        Number(web3.utils.toWei("0.1"))
      ),
      Number(organizationBalance2),
      "organization blance is not ok 2"
    );

    assert.equal(
      Math.subtract(totalReferralFund, Number(web3.utils.toWei("0.1"))),
      Number(referralBalance2),
      "referral blance is not ok 2"
    );

    const txFee = await Common.getTransactionFee(tx);

    const txOrganizationFee = await Common.getTransactionFee(txOrganization);

    assert.equal(
      Number(accountBalance2),
      Math.subtract(
        Math.add(Number(accountBalance1), Number(web3.utils.toWei("0.1"))),
        txFee
      ),
      "planter balance is not ok 2"
    );

    assert.equal(
      Number(accountOrganizationBalance2),
      Math.subtract(
        Math.add(
          Number(accountOrganizationBalance1),
          Number(web3.utils.toWei("0.1"))
        ),
        txOrganizationFee
      ),
      "organization balance is not ok 2"
    );

    //////////////////////
    const tx2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.53"),
      { from: userAccount3 }
    );

    const txOrganization2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.27"),
      { from: userAccount5 }
    );

    const txReferral2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.53")) &&
        ev.account == userAccount3
      );
    });

    truffleAssert.eventEmitted(
      txOrganization2,
      "PlanterBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(web3.utils.toWei("0.27")) &&
          ev.account == userAccount5
        );
      }
    );

    truffleAssert.eventEmitted(txReferral2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount4
      );
    });

    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("1.2"))
      ),
      Number(contractBalanceAfterWithdraw2),
      "contract balance is not ok after withdraw 2"
    );

    const planterBalance3 = await TreasuryInstance.balances.call(userAccount3);
    const referralBalance4 = await TreasuryInstance.balances.call(userAccount4);
    const organizationBalance3 = await TreasuryInstance.balances.call(
      userAccount5
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(planterBalance3),
      "planter blance is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(organizationBalance3),
      "organization blance is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(referralBalance4),
      "referral blance is not ok 3"
    );

    const totalFunds = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds.referralFund),
      "totalReferralFund is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds.planterFund),
      "totalPalnterFund is not ok 3"
    );

    const accountBalance3 = await web3.eth.getBalance(userAccount3);
    const accountOrganizationBalance3 = await web3.eth.getBalance(userAccount5);

    const txFee2 = await Common.getTransactionFee(tx2);
    const txOrganizationFee2 = await Common.getTransactionFee(txOrganization2);

    assert.equal(
      Number(accountBalance3),
      Math.subtract(
        Math.add(Number(accountBalance2), Number(web3.utils.toWei("0.53"))),
        txFee2
      ),
      "planter balance is not ok 3"
    );

    assert.equal(
      Number(accountOrganizationBalance3),
      Math.subtract(
        Math.add(
          Number(accountOrganizationBalance2),
          Number(web3.utils.toWei("0.27"))
        ),
        txOrganizationFee2
      ),
      "organization balance is not ok 3"
    );
  });

  it("organizationPlanter plant tree and withdraw successfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await TreasuryInstance.setLocalDevelopAddress(userAccount6, {
      from: deployerAccount,
    });

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    const totalPlanterFund = Math.divide(
      Math.mul(Number(amount), planterFund),
      10000
    );

    const totalReferralFund = Math.divide(
      Math.mul(Number(amount), referralFund),
      10000
    );

    const totallocalDevelopFund = Math.divide(
      Math.mul(Number(amount), localDevelop),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    const contractBalanceBeforeFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(contractBalanceBeforeFund)
      ),
      Number(amount),
      "contrct balance charged inconrrectly"
    );

    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    const OrganizationPlanterBalance1 = await TreasuryInstance.balances.call(
      userAccount3
    );

    const accountOrganizationPlanterBalance1 = await web3.eth.getBalance(
      userAccount3
    );

    const totalFunds = await TreasuryInstance.totalFunds();

    const accountlocalDevelopBalance1 = await web3.eth.getBalance(userAccount6);

    assert.equal(
      Number(OrganizationPlanterBalance1),
      Number(totalPlanterFund),
      "Organization planter balance is not ok 1"
    );

    assert.equal(
      Number(totalFunds.localDevelop),
      Math.add(totalReferralFund, totallocalDevelopFund),
      "localDevelop balance is not ok 1"
    );

    const tx = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.1"),
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3
      );
    });

    const txLocalDevelop = await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.1"),
      "some reason",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(
      txLocalDevelop,
      "LocalDevelopBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
          ev.account == userAccount6 &&
          ev.reason == "some reason"
        );
      }
    );

    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("0.2"))
      ),
      Number(contractBalanceAfterWithdraw1),
      "contract balance is not ok after withdraw 1"
    );

    const organizationPlanterBalance2 = await TreasuryInstance.balances.call(
      userAccount3
    );
    const accountOrganizationPlanterBalance2 = await web3.eth.getBalance(
      userAccount3
    );

    const totalFunds2 = await TreasuryInstance.totalFunds();

    const accountlocalDevelopBalance2 = await web3.eth.getBalance(userAccount6);

    assert.equal(
      Math.subtract(Number(totalPlanterFund), Number(web3.utils.toWei("0.1"))),
      Number(organizationPlanterBalance2),
      "organization planter blance is not ok 2"
    );

    assert.equal(
      Math.subtract(
        Math.add(totalReferralFund, totallocalDevelopFund),
        Number(web3.utils.toWei("0.1"))
      ),
      Number(totalFunds2.localDevelop),
      "localDevelop blance is not ok 2"
    );

    const txFee = await Common.getTransactionFee(tx);

    assert.equal(
      Number(accountOrganizationPlanterBalance2),
      Math.subtract(
        Math.add(
          Number(accountOrganizationPlanterBalance1),
          Number(web3.utils.toWei("0.1"))
        ),
        txFee
      ),
      "organization planter balance is not ok 2"
    );

    assert.equal(
      Number(accountlocalDevelopBalance2),
      Math.add(
        Number(accountlocalDevelopBalance1),
        Number(web3.utils.toWei("0.1"))
      ),
      "localDevelop balance is not ok 2"
    );

    // //////////////////////
    const tx2 = await TreasuryInstance.withdrawPlanterBalance(
      web3.utils.toWei("0.9"),
      { from: userAccount3 }
    );

    const txLocalDevelop2 = await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.3"),
      "some reason",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.9")) &&
        ev.account == userAccount3
      );
    });

    truffleAssert.eventEmitted(
      txLocalDevelop2,
      "LocalDevelopBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == Number(web3.utils.toWei("0.3")) &&
          ev.account == userAccount6 &&
          ev.reason == "some reason"
        );
      }
    );

    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Number(web3.utils.toWei("1.4"))
      ),
      Number(contractBalanceAfterWithdraw2),
      "contract balance is not ok after withdraw 2"
    );

    const organizationPlanterBalance3 = await TreasuryInstance.balances.call(
      userAccount3
    );

    const totalFunds3 = await TreasuryInstance.totalFunds();

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(organizationPlanterBalance3),
      "planter blance is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds3.referralFund),
      "totalReferralFund is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds3.planterFund),
      "totalPalnterFund is not ok 3"
    );

    assert.equal(
      Number(web3.utils.toWei("0")),
      Number(totalFunds3.localDevelop),
      "totallocalDevelop is not ok 3"
    );

    const accountOrganizationPlanterBalance3 = await web3.eth.getBalance(
      userAccount3
    );
    const accountlocalDevelopBalance3 = await web3.eth.getBalance(userAccount6);

    const txFee2 = await Common.getTransactionFee(tx2);

    assert.equal(
      Number(accountOrganizationPlanterBalance3),
      Math.subtract(
        Math.add(
          Number(accountOrganizationPlanterBalance2),
          Number(web3.utils.toWei("0.9"))
        ),
        txFee2
      ),
      "planter balance is not ok 3"
    );

    assert.equal(
      Number(accountlocalDevelopBalance3),
      Math.add(
        Number(accountlocalDevelopBalance2),
        Number(web3.utils.toWei("0.3"))
      ),
      "localDevelop balance is not ok 3"
    );
  });

  it("should fail withdraw planter", async () => {
    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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

    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("0"), {
      from: userAccount3,
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("1.5"), {
      from: userAccount3,
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("0.5"), {
      from: userAccount4,
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT); //not planter and his account have no vallue

    await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("0.5"), {
      from: userAccount5,
    }).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw tree research balance ************************************** */
  it("should withdraw tree research succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.4"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw tree research data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("3");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalTreeResearchFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treeResearch),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("5")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalTreeResearchFunded,
      Number(totalFunds1.treeResearch),
      "treeResearch total fund1 is not ok"
    );
    const treeResearchBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const treeResearchBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("4.8")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.treeResearch),
        Number(totalFunds2.treeResearch)
      ),
      Number(web3.utils.toWei("0.2")),
      "tree research total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(treeResearchBalnance2),
      Math.add(Number(treeResearchBalnance1), Number(web3.utils.toWei("0.2"))),
      "tree research account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.3"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.3")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const treeResearchBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("4.5")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.treeResearch),
        Number(totalFunds3.treeResearch)
      ),
      Number(web3.utils.toWei("0.5")),
      "tree research total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.treeResearch),
      Number(web3.utils.toWei("0.5")),
      "tree research total fund must be 0.5 eth"
    );
    assert.equal(
      Math.subtract(totalTreeResearchFunded, Number(web3.utils.toWei("0.5"))),
      Number(totalFunds3.treeResearch),
      "tree research total fund3 is not ok"
    );
    assert.equal(
      Number(treeResearchBalnance3),
      Math.add(Number(treeResearchBalnance1), Number(web3.utils.toWei("0.5"))),
      "tree research account balance  is not ok after withdraw2 ( checking with tree researchBalance1 )"
    );
    assert.equal(
      Number(treeResearchBalnance3),
      Math.add(Number(treeResearchBalnance2), Number(web3.utils.toWei("0.3"))),
      "tree research account balance is not ok after withdraw2"
    );
  });
  it("should fail tree research withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreeResearchAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
    await TreasuryInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("3"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw  some balance and then try to withdraw
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );
    await TreasuryInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw local develop balance ************************************** */
  it("should withdraw local develop succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw local develop data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1500;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalLocalDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), localDevelop),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("3")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalLocalDevelopFunded,
      Number(totalFunds1.localDevelop),
      "local develop total fund1 is not ok"
    );
    const localDevelopBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const localDevelopBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.localDevelop),
        Number(totalFunds2.localDevelop)
      ),
      Number(web3.utils.toWei("0.1")),
      "local develop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(localDevelopBalnance2),
      Math.add(Number(localDevelopBalnance1), Number(web3.utils.toWei("0.1"))),
      "local develop account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const localDevelopBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.localDevelop),
        Number(totalFunds3.localDevelop)
      ),
      Number(web3.utils.toWei("0.3")),
      "localDevelop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.localDevelop),
      0,
      "local develop total fund must be zero"
    ); //total value of localDevelop has withdrawn
    assert.equal(
      Number(localDevelopBalnance3),
      Math.add(Number(localDevelopBalnance1), Number(web3.utils.toWei("0.3"))),
      "local develop account balance  is not ok after withdraw2 ( checking with localDevelopBalance1 )"
    );
    assert.equal(
      Number(localDevelopBalnance3),
      Math.add(Number(localDevelopBalnance2), Number(web3.utils.toWei("0.2"))),
      "local develop account balance is not ok after withdraw2"
    );
  });
  it("should fail local develop withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount6, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setLocalDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount6,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount6,
      value: amount1,
    });

    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await TreasuryInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("3"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await TreasuryInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw rescue balance ************************************** */
  it("should withdraw rescue succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw rescue fund data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalRescueFundFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), rescueFund),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("3")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalRescueFundFunded,
      Number(totalFunds1.rescueFund),
      "rescue total fund1 is not ok"
    );
    const rescueFundBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const rescueFundBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.rescueFund),
        Number(totalFunds2.rescueFund)
      ),
      Number(web3.utils.toWei("0.1")),
      "rescue fund total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(rescueFundBalnance2),
      Math.add(Number(rescueFundBalnance1), Number(web3.utils.toWei("0.1"))),
      "rescue fund account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const rescueFundBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.rescueFund),
        Number(totalFunds3.rescueFund)
      ),
      Number(web3.utils.toWei("0.3")),
      "rescue fund total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.rescueFund),
      0,
      "rescueFund total fund must be zero"
    ); //total value of rescueFund has withdrawn
    assert.equal(
      Number(rescueFundBalnance3),
      Math.add(Number(rescueFundBalnance1), Number(web3.utils.toWei("0.3"))),
      "rescueFund account balance  is not ok after withdraw2 ( checking with rescueFundBalance1 )"
    );
    assert.equal(
      Number(rescueFundBalnance3),
      Math.add(Number(rescueFundBalnance2), Number(web3.utils.toWei("0.2"))),
      "rescueFund account balance is not ok after withdraw2"
    );
  });
  it("should fail rescue fund withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setRescueFundAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });

    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await TreasuryInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("3"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await TreasuryInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw treejer develop balance ************************************** */
  it("should withdraw treejer develop succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer develop data to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;
    const totalTreejerDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treejerDevelop),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("3")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalTreejerDevelopFunded,
      Number(totalFunds1.treejerDevelop),
      "treejerDevelop total fund1 is not ok"
    );
    const treejerDevelopBalnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const treejerDevelopBalnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds2.treejerDevelop)
      ),
      Number(web3.utils.toWei("0.1")),
      "treejerDevelop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(treejerDevelopBalnance2),
      Math.add(
        Number(treejerDevelopBalnance1),
        Number(web3.utils.toWei("0.1"))
      ),
      "treejer develop account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const treejerDevelopBalnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds3.treejerDevelop)
      ),
      Number(web3.utils.toWei("0.3")),
      "treejer develop total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.treejerDevelop),
      0,
      "treejerDevelop total fund must be zero"
    ); //total value of treejerDevelop has withdrawn
    assert.equal(
      Number(treejerDevelopBalnance3),
      Math.add(
        Number(treejerDevelopBalnance1),
        Number(web3.utils.toWei("0.3"))
      ),
      "treejer develop account balance  is not ok after withdraw2 ( checking with treejerDevelopBalance1 )"
    );
    assert.equal(
      Number(treejerDevelopBalnance3),
      Math.add(
        Number(treejerDevelopBalnance2),
        Number(web3.utils.toWei("0.2"))
      ),
      "treejer develop account balance is not ok after withdraw2"
    );
  });
  it("should fail treejer develop withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setTreejerDevelopAddress(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });

    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await TreasuryInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("3"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await TreasuryInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw other fund1 balance ************************************** */
  it("should withdraw other fund1 succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer other fund 1 to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;
    const totalOtherFund1Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), otherFund1),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("3")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalOtherFund1Funded,
      Number(totalFunds1.otherFund1),
      "otherFund1 total fund1 is not ok"
    );
    const otherFund1Balnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "OtherBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const otherFund1Balnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.otherFund1),
        Number(totalFunds2.otherFund1)
      ),
      Number(web3.utils.toWei("0.1")),
      "otherFund1 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(otherFund1Balnance2),
      Math.add(Number(otherFund1Balnance1), Number(web3.utils.toWei("0.1"))),
      "other fund1 account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "OtherBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const otherFund1Balnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.otherFund1),
        Number(totalFunds3.otherFund1)
      ),
      Number(web3.utils.toWei("0.3")),
      "other fund1 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.otherFund1),
      0,
      "other fund1 total fund must be zero"
    ); //total value of otherFund1 has withdrawn
    assert.equal(
      Number(otherFund1Balnance3),
      Math.add(Number(otherFund1Balnance1), Number(web3.utils.toWei("0.3"))),
      "other fund1 account balance is not ok after withdraw2 ( checking with otherFund1Balance1 )"
    );
    assert.equal(
      Number(otherFund1Balnance3),
      Math.add(Number(otherFund1Balnance2), Number(web3.utils.toWei("0.2"))),
      "other fund1 account balance is not ok after withdraw2"
    );
  });
  it("should fail other fund 1 withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund1Address(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 1000;
    const otherFund2 = 0;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount5,
      value: amount1,
    });

    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await TreasuryInstance.setOtherFund1Address(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("3"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await TreasuryInstance.withdrawOtherFund1(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  //*****************************************withdraw other fund2 balance ************************************** */
  it("should withdraw other fund2 succussfully", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });

    const tx = await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });
  it("check withdraw treejer other fund 1 to be ok", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");

    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1500;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;
    const totalOtherFund2Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), otherFund2),
      10000
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });
    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFunds1 = await TreasuryInstance.totalFunds();
    assert.equal(
      Number(contractBalanceAfterFund),
      Number(web3.utils.toWei("3")),
      "contract balance after fund is not ok"
    );
    assert.equal(
      totalOtherFund2Funded,
      Number(totalFunds1.otherFund2),
      "otherFund2 total fund1 is not ok"
    );
    const otherFund2Balnance1 = await web3.eth.getBalance(userAccount3);
    // --------------------- first withdraw and check data ------------------
    const tx = await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.1"),
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "OtherBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw1 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const otherFund2Balnance2 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Number(web3.utils.toWei("2.9")),
      "contract balance after withdraw1 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.otherFund2),
        Number(totalFunds2.otherFund2)
      ),
      Number(web3.utils.toWei("0.1")),
      "otherFund2 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(otherFund2Balnance2),
      Math.add(Number(otherFund2Balnance1), Number(web3.utils.toWei("0.1"))),
      "other fund2 account balance is not ok after withdraw1"
    );
    // -------------------- seccond withdraw and check data ------------------------------
    const tx2 = await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
    truffleAssert.eventEmitted(tx2, "OtherBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(web3.utils.toWei("0.2")) &&
        ev.account == userAccount3 &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await TreasuryInstance.totalFunds();
    const contractBalanceAfterWithdraw2 = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const otherFund2Balnance3 = await web3.eth.getBalance(userAccount3);
    assert.equal(
      Number(contractBalanceAfterWithdraw2),
      Number(web3.utils.toWei("2.7")),
      "contract balance after withdraw2 is not ok"
    );
    assert.equal(
      Math.subtract(
        Number(totalFunds1.otherFund2),
        Number(totalFunds3.otherFund2)
      ),
      Number(web3.utils.toWei("0.3")),
      "other fund2 total fund is not ok after withdraw1"
    );
    assert.equal(
      Number(totalFunds3.otherFund2),
      0,
      "other fund2 total fund must be zero"
    ); //total value of otherFund2 has withdrawn
    assert.equal(
      Number(otherFund2Balnance3),
      Math.add(Number(otherFund2Balnance1), Number(web3.utils.toWei("0.3"))),
      "other fund2 account balance is not ok after withdraw2 ( checking with otherFund2Balance1 )"
    );
    assert.equal(
      Number(otherFund2Balnance3),
      Math.add(Number(otherFund2Balnance2), Number(web3.utils.toWei("0.2"))),
      "other fund2 account balance is not ok after withdraw2"
    );
  });
  it("should fail other fund2 withdraw", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await TreasuryInstance.setOtherFund2Address(zeroAddress, {
      from: deployerAccount,
    });
    const treeId = 1;

    const treeId2 = 2;
    const amount = web3.utils.toWei("2");
    const amount1 = web3.utils.toWei("1");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const otherFund1 = 0;
    const otherFund2 = 1000;

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    await TreasuryInstance.fundTree(treeId, {
      from: userAccount1,
      value: amount,
    });
    await TreasuryInstance.fundTree(treeId2, {
      from: userAccount1,
      value: amount1,
    });

    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await TreasuryInstance.setOtherFund2Address(userAccount3, {
      from: deployerAccount,
    });
    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: userAccount7,
      }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("3"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //withdraw some balance and then try to withdraw
    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    );

    await TreasuryInstance.withdrawOtherFund2(
      web3.utils.toWei("0.2"),
      withdrawReason,
      {
        from: deployerAccount,
      }
    ).should.be.rejectedWith(TreesuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });

  // //----------------------------------------------gsn test-------------------------------------------
  it("Test gsn in Treasury", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");
    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;

    await TreasuryInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setWhitelistTarget(TreasuryInstance.address, {
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
      TreasuryInstance.address,
      TreasuryInstance.abi,
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
      Number(balanceAfter),
      Number(balanceBefore),
      "Set otherFundAddress1 address not true"
    );
  });

  it("Should be fail withdraw planter beacuse function is pause", async () => {
    await arInstance.pause({
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount8, deployerAccount);
    await Common.addGenesisTreeRole(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const otherFund1 = 0;
    const otherFund2 = 0;

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await TreasuryInstance.addFundDistributionModel(
      planterFund,
      referralFund,
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
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await TreasuryInstance.fundTree(treeId, {
      from: userAccount8,
      value: amount,
    });

    await TreasuryInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount2,
    });

    await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("0.2"), {
      from: userAccount3,
    }).should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });
});
