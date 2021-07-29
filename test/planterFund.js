const AccessRestriction = artifacts.require("AccessRestriction.sol");

const Planter = artifacts.require("Planter.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Funds = artifacts.require("Funds.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const zeroAddress = "0x0000000000000000000000000000000000000000";

const Math = require("./math");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

contract("PlanterFund", (accounts) => {
  let planterInstance;
  let planterFundInstance;
  let fundsInstance;
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
  const treasuryAddress = accounts[9];

  const ipfsHash = "some ipfs hash here";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterFundInstance = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    fundsInstance = await deployProxy(Funds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );
  });
  afterEach(async () => {});

  it("deploys successfully", async () => {
    const address = planterFundInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  it("should set planter contrct address successfully", async () => {
    planterFundInstance
      .setPlanterContractAddress(planterInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    planterFundInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });
  });
  it("set planter funds successfully and check data", async () => {
    const treeId1 = 1;
    const treeId2 = 2;
    const planterFund1 = 1000;
    const referralFund1 = 500;

    const planterFund2 = 2000;
    const referralFund2 = 1000;
    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);

    const planterFundsBefore = await planterFundInstance.planterFunds.call(
      treeId1
    );
    const referralFundsBefore = await planterFundInstance.referralFunds.call(
      treeId1
    );

    const totalFundsBefore = await planterFundInstance.totalFunds.call();

    assert.equal(Number(planterFundsBefore), 0, "planter fund is not ok");

    assert.equal(Number(referralFundsBefore), 0, "referral fund is not ok");

    assert.equal(
      Number(totalFundsBefore.planterFund),
      0,
      "total planter fund is not ok"
    );

    assert.equal(
      Number(totalFundsBefore.referralFund),
      0,
      "total referral fund is not ok"
    );

    await planterFundInstance.setPlanterFunds(
      treeId1,
      planterFund1,
      referralFund1,
      { from: userAccount1 }
    );

    const planterFundsAfter = await planterFundInstance.planterFunds.call(
      treeId1
    );
    const referralFundsAfter = await planterFundInstance.referralFunds.call(
      treeId1
    );

    const totalFundsAfter = await planterFundInstance.totalFunds.call();

    assert.equal(
      Number(planterFundsAfter),
      planterFund1,
      "planter fund is not ok"
    );

    assert.equal(
      Number(referralFundsAfter),
      referralFund1,
      "referral fund is not ok"
    );

    assert.equal(
      Number(totalFundsAfter.planterFund),
      planterFund1,
      "total planter fund is not ok"
    );

    assert.equal(
      Number(totalFundsAfter.referralFund),
      referralFund1,
      "total referral fund is not ok"
    );

    await planterFundInstance.setPlanterFunds(
      treeId2,
      planterFund2,
      referralFund2,
      {
        from: userAccount1,
      }
    );

    const planterFundsAfter2 = await planterFundInstance.planterFunds.call(
      treeId2
    );

    const referralFundsAfter2 = await planterFundInstance.referralFunds.call(
      treeId2
    );

    const totalFundsAfter2 = await planterFundInstance.totalFunds.call();

    assert.equal(
      Number(planterFundsAfter2),
      planterFund2,
      "planter fund is not ok"
    );

    assert.equal(
      Number(referralFundsAfter2),
      referralFund2,
      "referral fund is not ok"
    );

    assert.equal(
      Number(totalFundsAfter2.planterFund),
      Math.add(planterFund1, planterFund2),
      "total planter fund is not ok"
    );

    assert.equal(
      Number(totalFundsAfter2.referralFund),
      Math.add(referralFund1, referralFund2),
      "total referral fund is not ok"
    );
  });
  //----------------------- fund planter test ---------------------------------------//ali
  it("fund planter successfully", async () => {
    await Common.addTreeFactoryRole(arInstance, userAccount1, deployerAccount);

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

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

    const planterFund = 5000;
    const referralFund = 1000;

    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);

    let tx = await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount1,
      }
    );

    await planterFundInstance.fundPlanter(treeId, userAccount2, 25920, {
      from: userAccount1,
    });
  });

  it("fund planter successfully with organazationAddress", async () => {
    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount1, deployerAccount);

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

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

    const planterFund = 5000;
    const referralFund = 1000;

    let tx = await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount1,
      }
    );

    await planterFundInstance.fundPlanter(treeId, userAccount2, 25920, {
      from: userAccount1,
    });
  });

  it("check fund planter data to be ok1", async () => {
    await Common.addTreeFactoryRole(arInstance, userAccount1, deployerAccount);

    const treeId = 1;

    const planterFund = 5000;
    const referralFund = 1000;

    const treeStatus1 = 2592;
    const treeStatus2 = 5184;
    const treeStatus3 = 12960;
    const treeStatus4 = 25920;
    const treeStatus5 = 65535; //2^16-1
    const finalStatus = 25920;

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      userAccount3,
      zeroAddress
    );

    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      { from: userAccount1 }
    );

    const totalFund = await planterFundInstance.totalFunds();

    assert.equal(
      Number(totalFund.planterFund),
      planterFund,
      "total fund is not correct1"
    );

    assert.equal(
      Number(totalFund.referralFund),
      referralFund,
      "total fund is not correct1"
    );

    let fundP1 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      {
        from: userAccount1,
      }
    );

    const totalFund1 = await planterFundInstance.totalFunds();
    let planterPaid1 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance1 = await planterFundInstance.balances(userAccount2);
    let referralBalance1 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterFund, treeStatus1), finalStatus)
      ),
      Number(totalFund1.planterFund),
      "total fund1 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
        Math.divide(Math.mul(referralFund, treeStatus1), finalStatus)
      ),
      Number(totalFund1.referralFund),
      "total fund1 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus1), finalStatus),
      Number(planterPaid1),
      "planter paid is not ok"
    );
    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus1), finalStatus),
      Number(planterBalance1),
      "planter balance is not ok1"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, treeStatus1), finalStatus),
      Number(referralBalance1),
      "referral balance is not ok1"
    );

    ///////////////////////////////
    let fundP2 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      { from: userAccount1 }
    );
    const totalFund2 = await planterFundInstance.totalFunds();
    let planterPaid2 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance2 = await planterFundInstance.balances(userAccount2);
    let referralBalance2 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterFund, treeStatus1), finalStatus)
      ),
      Number(totalFund2.planterFund),
      "total fund2 is not ok"
    );
    assert.equal(
      Math.subtract(
        referralFund,
        Math.divide(Math.mul(referralFund, treeStatus1), finalStatus)
      ),
      Number(totalFund2.referralFund),
      "total fund2 referral is not ok"
    );
    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus1), finalStatus),

      Number(planterPaid2),
      "planter paid is not ok2"
    );
    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus1), finalStatus),
      Number(planterBalance2),
      "planter balance is not ok2"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, treeStatus1), finalStatus),
      Number(referralBalance2),
      "referral balance is not ok2"
    );

    /////////////////////////

    let fundP3 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus2,
      { from: userAccount1 }
    );
    const totalFund3 = await planterFundInstance.totalFunds();

    let planterPaid3 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance3 = await planterFundInstance.balances(userAccount2);
    let referralBalance3 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterFund, treeStatus2), finalStatus)
      ),
      Number(totalFund3.planterFund),
      "total fund3 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
        Math.divide(Math.mul(referralFund, treeStatus2), finalStatus)
      ),
      Number(totalFund3.referralFund),
      "total fund3 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus2), finalStatus),
      Number(planterPaid3),
      "planter paid is not ok3"
    );
    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus2), finalStatus),
      Number(planterBalance3),
      "planter balance is not ok3"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, treeStatus2), finalStatus),
      Number(referralBalance3),
      "referral balance is not ok3"
    );

    //////////////////////////////

    let fundP4 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus3,
      { from: userAccount1 }
    );
    const totalFund4 = await planterFundInstance.totalFunds();

    let planterPaid4 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance4 = await planterFundInstance.balances(userAccount2);
    let referralBalance4 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterFund, treeStatus3), finalStatus)
      ),
      Number(totalFund4.planterFund),
      "total fund4 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
        Math.divide(Math.mul(referralFund, treeStatus3), finalStatus)
      ),
      Number(totalFund4.referralFund),
      "total fund4 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus3), finalStatus),
      Number(planterPaid4),
      "planter paid is not ok4"
    );
    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus3), finalStatus),
      Number(planterBalance4),
      "planter balance is not ok4"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, treeStatus3), finalStatus),
      Number(referralBalance4),
      "referral balance is not ok4"
    );

    /////////////////

    let fundP5 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus4,
      { from: userAccount1 }
    );
    const totalFund5 = await planterFundInstance.totalFunds();
    let planterPaid5 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance5 = await planterFundInstance.balances(userAccount2);
    let referralBalance5 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterFund, treeStatus4), finalStatus)
      ),
      Number(totalFund5.planterFund),
      "total fund5 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
        Math.divide(Math.mul(referralFund, treeStatus4), finalStatus)
      ),
      Number(totalFund5.referralFund),
      "total fund5 referral is not ok"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus4), finalStatus),
      Number(planterPaid5),
      "planter paid is not ok5"
    );

    assert.equal(
      Math.divide(Math.mul(planterFund, treeStatus4), finalStatus),
      Number(planterBalance5),
      "planter balance is not ok5"
    );

    assert.equal(
      Math.divide(Math.mul(referralFund, treeStatus4), finalStatus),
      Number(referralBalance5),
      "referral balance is not ok5"
    );
    /////////////////

    let fundP6 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus5,
      { from: userAccount1 }
    );
    const totalFund6 = await planterFundInstance.totalFunds();
    let planterPaid6 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance6 = await planterFundInstance.balances(userAccount2);
    let referralBalance6 = await planterFundInstance.balances(userAccount3);

    assert.equal(
      Math.subtract(planterFund, planterFund),
      Number(totalFund6.planterFund),
      "total fund6 is not ok"
    );

    assert.equal(
      Math.subtract(referralFund, referralFund),
      Number(totalFund5.referralFund),
      "total fund6 referral is not ok"
    );

    assert.equal(planterFund, Number(planterPaid6), "planter paid is not ok6");
    assert.equal(
      planterFund,
      Number(planterBalance6),
      "planter balance is not ok6"
    );

    assert.equal(
      referralFund,
      Number(referralBalance6),
      "referral balance is not ok6"
    );
  });

  it("check fund planter data to be ok1 with organizationAddress", async () => {
    await Common.addTreeFactoryRole(arInstance, userAccount1, deployerAccount);

    const treeId = 1;

    const planterFund = 5000;
    const referralFund = 1000;
    const treeStatus1 = 2592;
    const treeStatus2 = 5184;
    const treeStatus3 = 12960;
    const treeStatus4 = 25920;
    const treeStatus5 = 65535; //2^16-1
    const finalStatus = 25920;

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

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

    const planterTotalFunded = planterFund;

    const referralTotalFunded = referralFund;

    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);
    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      { from: userAccount1 }
    );

    const totalFund = await planterFundInstance.totalFunds();

    assert.equal(
      Number(totalFund.planterFund),
      planterFund,
      "total fund is not correct1"
    );

    let fundP1 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      {
        from: userAccount1,
      }
    );

    const totalFund1 = await planterFundInstance.totalFunds();
    let planterPaid1 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance1 = await planterFundInstance.balances(userAccount2);
    let referralBalance1 = await planterFundInstance.balances(userAccount3);
    let organizationBalance1 = await planterFundInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund1.planterFund),
      "total fund1 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
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
    let fundP2 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus1,
      { from: userAccount1 }
    );
    const totalFund2 = await planterFundInstance.totalFunds();
    let planterPaid2 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance2 = await planterFundInstance.balances(userAccount2);
    let referralBalance2 = await planterFundInstance.balances(userAccount3);
    let organizationBalance2 = await planterFundInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
      ),
      Number(totalFund2.planterFund),
      "total fund2 is not ok"
    );
    assert.equal(
      Math.subtract(
        referralFund,
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

    let fundP3 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus2,
      { from: userAccount1 }
    );
    const totalFund3 = await planterFundInstance.totalFunds();

    let planterPaid3 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance3 = await planterFundInstance.balances(userAccount2);
    let referralBalance3 = await planterFundInstance.balances(userAccount3);
    let organizationBalance3 = await planterFundInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus)
      ),
      Number(totalFund3.planterFund),
      "total fund3 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
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

    let fundP4 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus3,
      { from: userAccount1 }
    );
    const totalFund4 = await planterFundInstance.totalFunds();

    let planterPaid4 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance4 = await planterFundInstance.balances(userAccount2);
    let referralBalance4 = await planterFundInstance.balances(userAccount3);
    let organizationBalance4 = await planterFundInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus)
      ),
      Number(totalFund4.planterFund),
      "total fund4 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
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

    let fundP5 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus4,
      { from: userAccount1 }
    );

    const totalFund5 = await planterFundInstance.totalFunds();
    let planterPaid5 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance5 = await planterFundInstance.balances(userAccount2);
    let referralBalance5 = await planterFundInstance.balances(userAccount3);
    let organizationBalance5 = await planterFundInstance.balances(userAccount4);

    assert.equal(
      Math.subtract(
        planterFund,
        Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus)
      ),
      Number(totalFund5.planterFund),
      "total fund5 is not ok"
    );

    assert.equal(
      Math.subtract(
        referralFund,
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

    let fundP6 = await planterFundInstance.fundPlanter(
      treeId,
      userAccount2,
      treeStatus5,
      { from: userAccount1 }
    );
    const totalFund6 = await planterFundInstance.totalFunds();
    let planterPaid6 = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance6 = await planterFundInstance.balances(userAccount2);
    let referralBalance6 = await planterFundInstance.balances(userAccount3);
    let firstOrganizationBalance = await planterFundInstance.balances(
      userAccount4
    );
    let organizationBalance6 = await planterFundInstance.balances(userAccount5);

    assert.equal(
      Math.subtract(planterFund, planterTotalFunded),
      Number(totalFund6.planterFund),
      "total fund6 is not ok"
    );

    assert.equal(
      Math.subtract(referralFund, referralTotalFunded),
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
    await Common.addTreeFactoryRole(arInstance, userAccount1, deployerAccount);

    const treeId = 1;
    const treeId2 = 2;

    const planterFund = 5000;
    const referralFund = 1000;
    const planterFund2 = 10000;
    const referralFund2 = 2000;

    const treeStatus = 65535; //2^16-1

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      userAccount3,
      zeroAddress
    );

    const planterTotalFunded = planterFund;

    const referralTotalFunded = referralFund;

    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount1,
      }
    );

    await planterFundInstance.setPlanterFunds(
      treeId2,
      planterFund2,
      referralFund2,
      {
        from: userAccount1,
      }
    );

    const totalFunds = await planterFundInstance.totalFunds();

    assert.equal(
      Math.add(planterFund, planterFund2),
      Number(totalFunds.planterFund),
      "invalid planter total funds"
    );

    assert.equal(
      Math.add(referralFund, referralFund2),
      Number(totalFunds.referralFund),
      "invalid referral total funds"
    );

    let fundP = await planterFundInstance.fundPlanter(
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

    const totalFunds2 = await planterFundInstance.totalFunds();
    let planterPaid = await planterFundInstance.plantersPaid.call(treeId);
    let planterBalance = await planterFundInstance.balances(userAccount2);
    let referralBalance = await planterFundInstance.balances(userAccount3);

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
      planterFund2,
      Number(totalFunds2.planterFund),
      "total funds2 is not ok"
    );

    assert.equal(
      referralFund2,
      Number(totalFunds2.referralFund),
      "total funds2 referral is not ok"
    );
  });

  it("should fail fund planter", async () => {
    await Common.addFundsRole(arInstance, userAccount1, deployerAccount);
    await Common.addTreeFactoryRole(arInstance, userAccount2, deployerAccount);
    const treeId = 1;
    const treeId2 = 2;
    const planterFund = 5000;
    const referralFund = 1000;

    const treeStatus = 65535; //2^16-1

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount1,
      }
    );
    await planterFundInstance
      .fundPlanter(treeId, userAccount2, treeStatus, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREE_FACTORY);

    await planterFundInstance
      .fundPlanter(treeId2, userAccount2, treeStatus, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
  });
});
