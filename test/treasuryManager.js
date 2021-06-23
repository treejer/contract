const AccessRestriction = artifacts.require("AccessRestriction");
const TreasuryManager = artifacts.require("TreasuryManager.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { TimeEnumes, CommonErrorMsg } = require("./enumes");

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
  ///////////////////////////////////////////////////////mahdi
  //  //************************************ fund tree test ****************************************//
  // it("should fund tree succesfully", async () => {
  //   const treeId = 1;
  //   const amount = web3.utils.toWei("1");
  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

  //   await treasuryManagerInstance.fundTree(treeId, amount, {
  //     from: userAccount1,
  //   });
  // });
  it("data must be correct after fund tree", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("1");
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

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    let tx = await treasuryManagerInstance.fundTree(treeId, amount, {
      from: userAccount1,
    });
    const data = await treasuryManagerInstance.totalFunds();
    console.log("data", data);

    truffleAssert.eventEmitted(tx, "Event1", (ev) => {
      console.log("ev", ev);

      return true;
    });
  });
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
