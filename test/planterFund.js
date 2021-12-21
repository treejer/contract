// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const Planter = artifacts.require("Planter");
const PlanterFund = artifacts.require("PlanterFund");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");
const zeroAddress = "0x0000000000000000000000000000000000000000";
var Dai = artifacts.require("Dai");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

const Math = require("./math");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSaleErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
  GsnErrorMsg,
} = require("./enumes");

contract("PlanterFund", (accounts) => {
  let planterInstance;
  let planterFundInstance;

  let arInstance;
  let daiInstance;

  const dataManager = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const notTreejerContractAccount = accounts[8];
  const userAccount8 = accounts[9];

  const ipfsHash = "some ipfs hash here";

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount1,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      userAccount8,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );
  });

  afterEach(async () => {});

  describe("deployment and set addresses", () => {
    beforeEach(async () => {
      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundInstance = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      daiInstance = await Dai.new("DAI", "dai", { from: deployerAccount });
    });

    it("deploys successfully", async () => {
      const address = planterFundInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      ///////////////---------------------------------set trust forwarder address--------------------------------------------------------

      await planterFundInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await planterFundInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await planterFundInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await planterFundInstance.trustedForwarder(),
        "address set incorrect"
      );

      ///////////////---------------------------------set planter contract address--------------------------------------------------------
      planterFundInstance
        .setPlanterContractAddress(planterInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      planterFundInstance.setPlanterContractAddress(planterInstance.address, {
        from: deployerAccount,
      });

      ///////////////---------------------------------set dai token address--------------------------------------------------------
      planterFundInstance
        .setDaiTokenAddress(daiInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      planterFundInstance
        .setDaiTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        daiInstance.address,
        await planterFundInstance.daiToken.call(),
        "address set incorect"
      );
    });
  });

  describe("planterFund methods only", () => {
    beforeEach(async () => {
      planterFundInstance = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("set local address", async () => {
      let localDevelopmentAddress = userAccount4;

      //------------------------------- check failure --------------------------------

      await planterFundInstance
        .setLocalDevelopmentAddress(localDevelopmentAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await planterFundInstance
        .setLocalDevelopmentAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //------------------------------- set address --------------------------------

      await planterFundInstance.setLocalDevelopmentAddress(
        localDevelopmentAddress,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await planterFundInstance.localDevelopmentAddress(),
        localDevelopmentAddress,
        "Set localDevelopmentAddress address not true"
      );
    });

    ///////----------------------------------------------------test set minWithdrawable----------------------------

    it("should set minWithdrawable successfully", async () => {
      planterFundInstance
        .updateWithdrawableAmount(planterInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      let priceBefore = await planterFundInstance.minWithdrawable();

      const eventTx1 = await planterFundInstance.updateWithdrawableAmount(
        web3.utils.toWei("1"),
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx1, "MinWithdrawableAmountUpdated");

      let priceAfter = await planterFundInstance.minWithdrawable();

      assert.equal(
        Number(priceBefore),
        web3.utils.toWei(".5"),
        "1 - Number not true"
      );

      assert.equal(
        Number(priceAfter),
        web3.utils.toWei("1"),
        "2 - Number not true"
      );
    });

    it("set planter funds successfully and check data", async () => {
      const treeId1 = 1;
      const treeId2 = 2;
      const planterFund1 = 1000;
      const ambassadorFund1 = 500;
      const planterFund2 = 2000;
      const ambassadorFund2 = 1000;

      ////////////// -------------- fail invalid access
      await planterFundInstance
        .updateProjectedEarnings(treeId1, planterFund1, ambassadorFund1, {
          from: notTreejerContractAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      const planterFundsBefore =
        await planterFundInstance.treeToPlanterProjectedEarning.call(treeId1);
      const ambassadorFundsBefore =
        await planterFundInstance.treeToAmbassadorProjectedEarning.call(
          treeId1
        );

      const totalBalancesBefore =
        await planterFundInstance.totalBalances.call();

      assert.equal(Number(planterFundsBefore), 0, "planter fund is not ok");

      assert.equal(
        Number(ambassadorFundsBefore),
        0,
        "ambassador fund is not ok"
      );

      assert.equal(
        Number(totalBalancesBefore.planter),
        0,
        "total planter fund is not ok"
      );

      assert.equal(
        Number(totalBalancesBefore.ambassador),
        0,
        "total ambassador fund is not ok"
      );

      const eventTx1 = await planterFundInstance.updateProjectedEarnings(
        treeId1,
        planterFund1,
        ambassadorFund1,
        { from: userAccount1 }
      );

      truffleAssert.eventEmitted(eventTx1, "ProjectedEarningUpdated", (ev) => {
        return (
          Number(ev.treeId) == treeId1 &&
          Number(ev.planterAmount) == Number(planterFund1) &&
          Number(ev.ambassadorAmount) == Number(ambassadorFund1)
        );
      });

      const planterFundsAfter =
        await planterFundInstance.treeToPlanterProjectedEarning.call(treeId1);
      const ambassadorFundsAfter =
        await planterFundInstance.treeToAmbassadorProjectedEarning.call(
          treeId1
        );

      const totalBalancesAfter = await planterFundInstance.totalBalances.call();

      assert.equal(
        Number(planterFundsAfter),
        planterFund1,
        "planter fund is not ok"
      );

      assert.equal(
        Number(ambassadorFundsAfter),
        ambassadorFund1,
        "ambassador fund is not ok"
      );

      assert.equal(
        Number(totalBalancesAfter.planter),
        planterFund1,
        "total planter fund is not ok"
      );

      assert.equal(
        Number(totalBalancesAfter.ambassador),
        ambassadorFund1,
        "total ambassador fund is not ok"
      );

      const eventTx2 = await planterFundInstance.updateProjectedEarnings(
        treeId2,
        planterFund2,
        ambassadorFund2,
        {
          from: userAccount1,
        }
      );

      truffleAssert.eventEmitted(eventTx2, "ProjectedEarningUpdated", (ev) => {
        return (
          Number(ev.treeId) == treeId2 &&
          Number(ev.planterAmount) == Number(planterFund2) &&
          Number(ev.ambassadorAmount) == Number(ambassadorFund2)
        );
      });

      const planterFundsAfter2 =
        await planterFundInstance.treeToPlanterProjectedEarning.call(treeId2);

      const ambassadorFundsAfter2 =
        await planterFundInstance.treeToAmbassadorProjectedEarning.call(
          treeId2
        );

      const totalBalancesAfter2 =
        await planterFundInstance.totalBalances.call();

      assert.equal(
        Number(planterFundsAfter2),
        planterFund2,
        "planter fund is not ok"
      );

      assert.equal(
        Number(ambassadorFundsAfter2),
        ambassadorFund2,
        "ambassador fund is not ok"
      );

      assert.equal(
        Number(totalBalancesAfter2.planter),
        Math.add(planterFund1, planterFund2),
        "total planter fund is not ok"
      );

      assert.equal(
        Number(totalBalancesAfter2.ambassador),
        Math.add(ambassadorFund1, ambassadorFund2),
        "total ambassador fund is not ok"
      );
    });
  });

  describe("fund planter and withdraw", () => {
    beforeEach(async () => {
      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundInstance = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      daiInstance = await Dai.new("DAI", "dai", { from: deployerAccount });

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );
    });

    //----------------------- fund planter test ---------------------------------------//ali

    it("check fund planter data to be ok1", async () => {
      const treeId = 1;
      const planterFund = 5000;
      const ambassadorFund = 1000;
      const treeStatus1 = 2592;
      const treeStatus2 = 5184;
      const treeStatus3 = 12960;
      const treeStatus4 = 25920;
      const treeStatus5 = 65535; //2^16-1
      const finalStatus = 25920;

      ////////////////////////----------- handle address
      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount2,
        userAccount3,
        zeroAddress
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        { from: userAccount1 }
      );

      const totalFund = await planterFundInstance.totalBalances();

      assert.equal(
        Number(totalFund.planter),
        planterFund,
        "total fund is not correct1"
      );

      assert.equal(
        Number(totalFund.ambassador),
        ambassadorFund,
        "total fund is not correct1"
      );

      let fundP1 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus1,
        {
          from: userAccount1,
        }
      );

      truffleAssert.eventEmitted(fundP1, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount2 &&
          Number(ev.amount) ==
            Math.divide(Math.mul(planterFund, treeStatus1), finalStatus) &&
          ev.ambassador == userAccount3
        );
      });

      const totalFund1 = await planterFundInstance.totalBalances();
      let planterPaid1 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance1 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance1 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterFund, treeStatus1), finalStatus)
        ),
        Number(totalFund1.planter),
        "total fund1 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorFund, treeStatus1), finalStatus)
        ),
        Number(totalFund1.ambassador),
        "total fund1 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorFund, treeStatus1), finalStatus),
        Number(ambassadorBalance1),
        "ambassador balance is not ok1"
      );

      ///////////////////////////////
      let fundP2 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus1,
        { from: userAccount1 }
      );

      truffleAssert.eventNotEmitted(fundP2, "PlanterTotalClaimedUpdated");

      const totalFund2 = await planterFundInstance.totalBalances();
      let planterPaid2 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance2 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance2 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterFund, treeStatus1), finalStatus)
        ),
        Number(totalFund2.planter),
        "total fund2 is not ok"
      );
      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorFund, treeStatus1), finalStatus)
        ),
        Number(totalFund2.ambassador),
        "total fund2 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorFund, treeStatus1), finalStatus),
        Number(ambassadorBalance2),
        "ambassador balance is not ok2"
      );

      /////////////////////////

      let fundP3 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus2,
        { from: userAccount1 }
      );

      truffleAssert.eventEmitted(fundP3, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount2 &&
          Number(ev.amount) ==
            Math.subtract(
              Math.divide(Math.mul(planterFund, treeStatus2), finalStatus),
              planterPaid2
            ) &&
          ev.ambassador == userAccount3
        );
      });

      const totalFund3 = await planterFundInstance.totalBalances();

      let planterPaid3 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance3 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance3 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterFund, treeStatus2), finalStatus)
        ),
        Number(totalFund3.planter),
        "total fund3 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorFund, treeStatus2), finalStatus)
        ),
        Number(totalFund3.ambassador),
        "total fund3 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorFund, treeStatus2), finalStatus),
        Number(ambassadorBalance3),
        "ambassador balance is not ok3"
      );

      //////////////////////////////

      let fundP4 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus3,
        { from: userAccount1 }
      );

      truffleAssert.eventEmitted(fundP4, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount2 &&
          Number(ev.amount) ==
            Math.subtract(
              Math.divide(Math.mul(planterFund, treeStatus3), finalStatus),
              planterPaid3
            ) &&
          ev.ambassador == userAccount3
        );
      });

      const totalFund4 = await planterFundInstance.totalBalances();

      let planterPaid4 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance4 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance4 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterFund, treeStatus3), finalStatus)
        ),
        Number(totalFund4.planter),
        "total fund4 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorFund, treeStatus3), finalStatus)
        ),
        Number(totalFund4.ambassador),
        "total fund4 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorFund, treeStatus3), finalStatus),
        Number(ambassadorBalance4),
        "ambassador balance is not ok4"
      );

      /////////////////

      let fundP5 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus4,
        { from: userAccount1 }
      );

      truffleAssert.eventEmitted(fundP5, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount2 &&
          Number(ev.amount) ==
            Math.subtract(
              Math.divide(Math.mul(planterFund, treeStatus4), finalStatus),
              planterPaid4
            ) &&
          ev.ambassador == userAccount3
        );
      });

      const totalFund5 = await planterFundInstance.totalBalances();
      let planterPaid5 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance5 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance5 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterFund, treeStatus4), finalStatus)
        ),
        Number(totalFund5.planter),
        "total fund5 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorFund, treeStatus4), finalStatus)
        ),
        Number(totalFund5.ambassador),
        "total fund5 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorFund, treeStatus4), finalStatus),
        Number(ambassadorBalance5),
        "ambassador balance is not ok5"
      );
      /////////////////

      let fundP6 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus5,
        { from: userAccount1 }
      );

      truffleAssert.eventNotEmitted(fundP6, "PlanterTotalClaimedUpdated");

      const totalFund6 = await planterFundInstance.totalBalances();
      let planterPaid6 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance6 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance6 = await planterFundInstance.balances(userAccount3);

      assert.equal(
        Math.subtract(planterFund, planterFund),
        Number(totalFund6.planter),
        "total fund6 is not ok"
      );

      assert.equal(
        Math.subtract(ambassadorFund, ambassadorFund),
        Number(totalFund5.ambassador),
        "total fund6 ambassador is not ok"
      );

      assert.equal(
        planterFund,
        Number(planterPaid6),
        "planter paid is not ok6"
      );
      assert.equal(
        planterFund,
        Number(planterBalance6),
        "planter balance is not ok6"
      );

      assert.equal(
        ambassadorFund,
        Number(ambassadorBalance6),
        "ambassador balance is not ok6"
      );
    });

    it("check fund planter data to be ok1 with organizationAddress", async () => {
      const treeId = 1;

      const planterFund = 5000;
      const ambassadorFund = 1000;
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

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount4,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      await Common.successJoin(
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

      const ambassadorTotalFunded = ambassadorFund;

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        { from: userAccount1 }
      );

      const totalFund = await planterFundInstance.totalBalances();

      assert.equal(
        Number(totalFund.planter),
        planterFund,
        "total fund is not correct1"
      );

      let fundP1 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus1,
        {
          from: userAccount1,
        }
      );

      const totalFund1 = await planterFundInstance.totalBalances();
      let planterPaid1 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance1 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance1 = await planterFundInstance.balances(userAccount3);
      let organizationBalance1 = await planterFundInstance.balances(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
        ),
        Number(totalFund1.planter),
        "total fund1 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorTotalFunded, treeStatus1), finalStatus)
        ),
        Number(totalFund1.ambassador),
        "total fund1 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorTotalFunded, treeStatus1), finalStatus),
        Number(ambassadorBalance1),
        "ambassador balance is not ok1"
      );

      ///////////////////////////////
      let fundP2 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus1,
        { from: userAccount1 }
      );
      const totalFund2 = await planterFundInstance.totalBalances();
      let planterPaid2 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance2 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance2 = await planterFundInstance.balances(userAccount3);
      let organizationBalance2 = await planterFundInstance.balances(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterTotalFunded, treeStatus1), finalStatus)
        ),
        Number(totalFund2.planter),
        "total fund2 is not ok"
      );
      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorTotalFunded, treeStatus1), finalStatus)
        ),
        Number(totalFund2.ambassador),
        "total fund2 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorTotalFunded, treeStatus1), finalStatus),
        Number(ambassadorBalance2),
        "ambassador balance is not ok2"
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

      let fundP3 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus2,
        { from: userAccount1 }
      );
      const totalFund3 = await planterFundInstance.totalBalances();

      let planterPaid3 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance3 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance3 = await planterFundInstance.balances(userAccount3);
      let organizationBalance3 = await planterFundInstance.balances(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterTotalFunded, treeStatus2), finalStatus)
        ),
        Number(totalFund3.planter),
        "total fund3 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorTotalFunded, treeStatus2), finalStatus)
        ),
        Number(totalFund3.ambassador),
        "total fund3 ambassador is not ok"
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
        Math.divide(Math.mul(ambassadorTotalFunded, treeStatus2), finalStatus),
        Number(ambassadorBalance3),
        "ambassador balance is not ok3"
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
      await planterInstance.updateOrganizationMemberShare(
        userAccount2,
        planterPortion2,
        {
          from: userAccount4,
        }
      );

      let fundP4 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus3,
        { from: userAccount1 }
      );
      const totalFund4 = await planterFundInstance.totalBalances();

      let planterPaid4 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance4 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance4 = await planterFundInstance.balances(userAccount3);
      let organizationBalance4 = await planterFundInstance.balances(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterTotalFunded, treeStatus3), finalStatus)
        ),
        Number(totalFund4.planter),
        "total fund4 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorTotalFunded, treeStatus3), finalStatus)
        ),
        Number(totalFund4.ambassador),
        "total fund4 ambassador is not ok"
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
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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
        Math.divide(Math.mul(ambassadorTotalFunded, treeStatus3), finalStatus),
        Number(ambassadorBalance4),
        "ambassador balance is not ok4"
      );

      assert.equal(
        Number(organizationBalance4),
        Math.add(
          Math.divide(
            Math.mul(
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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

      let fundP5 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus4,
        { from: userAccount1 }
      );

      const totalFund5 = await planterFundInstance.totalBalances();
      let planterPaid5 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance5 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance5 = await planterFundInstance.balances(userAccount3);
      let organizationBalance5 = await planterFundInstance.balances(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          planterFund,
          Math.divide(Math.mul(planterTotalFunded, treeStatus4), finalStatus)
        ),
        Number(totalFund5.planter),
        "total fund5 is not ok"
      );

      assert.equal(
        Math.subtract(
          ambassadorFund,
          Math.divide(Math.mul(ambassadorTotalFunded, treeStatus4), finalStatus)
        ),
        Number(totalFund5.ambassador),
        "total fund5 ambassador is not ok"
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
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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
            Math.mul(
              planterTotalFunded,
              Math.subtract(treeStatus4, treeStatus3)
            ),
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
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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
        Math.divide(Math.mul(ambassadorTotalFunded, treeStatus4), finalStatus),
        Number(ambassadorBalance5),
        "ambassador balance is not ok5"
      );
      /////////////////

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount5,
        zeroAddress,
        deployerAccount,
        dataManager
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

      let fundP6 = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus5,
        { from: userAccount1 }
      );
      const totalFund6 = await planterFundInstance.totalBalances();
      let planterPaid6 =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance6 = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance6 = await planterFundInstance.balances(userAccount3);
      let firstOrganizationBalance = await planterFundInstance.balances(
        userAccount4
      );
      let organizationBalance6 = await planterFundInstance.balances(
        userAccount5
      );

      assert.equal(
        Math.subtract(planterFund, planterTotalFunded),
        Number(totalFund6.planter),
        "total fund6 is not ok"
      );

      assert.equal(
        Math.subtract(ambassadorFund, ambassadorTotalFunded),
        Number(totalFund5.ambassador),
        "total fund6 ambassador is not ok"
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
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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
            Math.mul(
              planterTotalFunded,
              Math.subtract(treeStatus4, treeStatus3)
            ),
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
        ambassadorTotalFunded,
        Number(ambassadorBalance6),
        "ambassador balance is not ok6"
      );

      assert.equal(
        Number(firstOrganizationBalance),
        Math.add(
          Math.divide(
            Math.mul(
              Math.divide(
                Math.mul(planterTotalFunded, treeStatus2),
                finalStatus
              ),
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
      const treeId = 1;
      const treeId2 = 2;

      const planterFund = 5000;
      const ambassadorFund = 1000;
      const planterFund2 = 10000;
      const ambassadorFund2 = 2000;

      const treeStatus = 65535; //2^16-1

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount2,
        userAccount3,
        zeroAddress
      );

      const planterTotalFunded = planterFund;

      const ambassadorTotalFunded = ambassadorFund;

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount1,
        }
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId2,
        planterFund2,
        ambassadorFund2,
        {
          from: userAccount1,
        }
      );

      const totalBalances = await planterFundInstance.totalBalances();

      assert.equal(
        Math.add(planterFund, planterFund2),
        Number(totalBalances.planter),
        "invalid planter total funds"
      );

      assert.equal(
        Math.add(ambassadorFund, ambassadorFund2),
        Number(totalBalances.ambassador),
        "invalid ambassador total funds"
      );

      let fundP = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount2,
        treeStatus,
        {
          from: userAccount1,
        }
      );

      truffleAssert.eventEmitted(fundP, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          Number(ev.treeId) == treeId &&
          ev.planter == userAccount2 &&
          Number(ev.amount) == planterTotalFunded &&
          ev.ambassador == userAccount3
        );
      });

      const totalBalances2 = await planterFundInstance.totalBalances();
      let planterPaid =
        await planterFundInstance.treeToPlanterTotalClaimed.call(treeId);
      let planterBalance = await planterFundInstance.balances(userAccount2);
      let ambassadorBalance = await planterFundInstance.balances(userAccount3);

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
        ambassadorTotalFunded,
        Number(ambassadorBalance),
        "ambassador balance is not ok1"
      );

      assert.equal(
        planterFund2,
        Number(totalBalances2.planter),
        "total funds2 is not ok"
      );

      assert.equal(
        ambassadorFund2,
        Number(totalBalances2.ambassador),
        "total funds2 ambassador is not ok"
      );
    });

    it("should fail fund planter", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const planterFund = 5000;
      const ambassadorFund = 1000;

      const treeStatus = 65535; //2^16-1

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount2,
        zeroAddress,
        zeroAddress
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount1,
        }
      );
      await planterFundInstance
        .updatePlanterTotalClaimed(treeId, userAccount2, treeStatus, {
          from: userAccount4,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await planterFundInstance
        .updatePlanterTotalClaimed(treeId2, userAccount2, treeStatus, {
          from: userAccount6,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
    });

    it("should withdraw planter succussfully", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);
      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      const planterWithdrawAmount = Units.convert("100", "eth", "wei");
      const ambassadorWithdrawAmount = Units.convert("30", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount3,
        userAccount4,
        zeroAddress
      );

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        {
          from: deployerAccount,
        }
      );

      const planterFundDaiBalance = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );
      const planterDaiBalanceBefore = await daiInstance.balanceOf.call(
        userAccount3
      );

      const ambassadorDaiBlanceBefore = await daiInstance.balanceOf.call(
        userAccount4
      );

      const fundTx = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      truffleAssert.eventEmitted(fundTx, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount3 &&
          Number(ev.amount) == Number(planterFund) &&
          ev.ambassador == userAccount4
        );
      });

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      let txPlanter = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount,
        {
          from: userAccount3,
        }
      );

      let txAmbassador = await planterFundInstance.withdrawBalance(
        ambassadorWithdrawAmount,
        {
          from: userAccount4,
        }
      );

      let planterDaiBalanceAfter = await daiInstance.balanceOf.call(
        userAccount3
      );
      let ambassadorDaiBalanceAfter = await daiInstance.balanceOf.call(
        userAccount4
      );

      assert.equal(
        Number(planterDaiBalanceAfter),
        Math.add(Number(planterDaiBalanceBefore), planterWithdrawAmount)
      );

      assert.equal(
        ambassadorDaiBalanceAfter,
        Math.add(ambassadorDaiBlanceBefore, ambassadorWithdrawAmount)
      );

      const ambassadorBalanceLeft = await planterFundInstance.balances.call(
        userAccount4
      );

      const planterBalanceLeft = await planterFundInstance.balances.call(
        userAccount3
      );

      assert.equal(
        Number(ambassadorBalanceLeft),
        Math.subtract(ambassadorFund, Number(ambassadorDaiBalanceAfter))
      );

      assert.equal(
        Number(planterBalanceLeft),
        Math.subtract(planterFund, Number(planterDaiBalanceAfter))
      );
    });

    it("should withdraw planter succussfully(when minimum amount change)", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      const treeId = 1;

      planterFundInstance.updateWithdrawableAmount(web3.utils.toWei(".5"), {
        from: dataManager,
      });

      const planterFund = Units.convert("5", "eth", "wei");
      const ambassadorFund = Units.convert("5", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount3,
        userAccount4,
        zeroAddress
      );

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("15", "eth", "wei"),
        {
          from: deployerAccount,
        }
      );

      const planterFundDaiBalance = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      const fundTx = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      truffleAssert.eventEmitted(fundTx, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount3 &&
          Number(ev.amount) == Number(planterFund) &&
          ev.ambassador == userAccount4
        );
      });

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".6"), {
        from: userAccount3,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".6"), {
        from: userAccount4,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".5"), {
        from: userAccount3,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".5"), {
        from: userAccount4,
      });

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei(".4"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei(".4"), {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      planterFundInstance.updateWithdrawableAmount(web3.utils.toWei(".4"), {
        from: dataManager,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".4"), {
        from: userAccount3,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei(".4"), {
        from: userAccount4,
      });

      planterFundInstance.updateWithdrawableAmount(web3.utils.toWei("2"), {
        from: dataManager,
      });

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("1.9"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("1.9"), {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance.withdrawBalance(web3.utils.toWei("3.5"), {
        from: userAccount3,
      });

      await planterFundInstance.withdrawBalance(web3.utils.toWei("3.5"), {
        from: userAccount4,
      });

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("3.5"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("3.5"), {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    });

    it("check planter withdraw balance to be correct", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount3,
        userAccount4,
        zeroAddress
      );

      const totalPlanterFund = planterFund;

      const totalAmbassadorFund = ambassadorFund;

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        { from: deployerAccount }
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      const contractBalanceAfterFund = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Number(contractBalanceAfterFund),

        Units.convert("150", "eth", "wei"),
        "contract balance charged inconrrectly"
      );

      await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      const planterBalance1 = await planterFundInstance.balances.call(
        userAccount3
      );
      const accountBalance1 = await web3.eth.getBalance(userAccount3);

      const ambassadorBalance1 = await planterFundInstance.balances.call(
        userAccount4
      );
      const accountAmbassadorBalance1 = await web3.eth.getBalance(userAccount4);

      assert.equal(
        Number(planterBalance1),
        totalPlanterFund,
        "planter balance is not ok 1"
      );
      assert.equal(
        Number(ambassadorBalance1),
        totalAmbassadorFund,
        "ambassador balance is not ok 1"
      );
      const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");
      const ambassadorWithdrwAmount1 = Units.convert("10", "eth", "wei");
      const tx = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount1,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(tx, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount1 &&
          ev.account == userAccount3
        );
      });

      const txAmbassador = await planterFundInstance.withdrawBalance(
        ambassadorWithdrwAmount1,
        { from: userAccount4 }
      );

      truffleAssert.eventEmitted(txAmbassador, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == ambassadorWithdrwAmount1 &&
          ev.account == userAccount4
        );
      });

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(
          Number(contractBalanceAfterFund),
          Math.add(planterWithdrawAmount1, ambassadorWithdrwAmount1)
        ),
        Number(contractBalanceAfterWithdraw1),
        "contract balance is not ok after withdraw 1"
      );

      const planterBalance2 = await planterFundInstance.balances.call(
        userAccount3
      );
      const planterDaiBalance2 = await daiInstance.balanceOf.call(userAccount3);

      const ambassadorBalance2 = await planterFundInstance.balances.call(
        userAccount4
      );
      const ambassadorDaiBalance2 = await daiInstance.balanceOf.call(
        userAccount4
      );

      assert.equal(
        Math.subtract(totalPlanterFund, planterWithdrawAmount1),
        Number(planterBalance2),
        "planter blance is not ok 2"
      );
      assert.equal(
        Math.subtract(totalAmbassadorFund, ambassadorWithdrwAmount1),
        Number(ambassadorBalance2),
        "ambassador blance is not ok 2"
      );

      assert.equal(
        Number(planterDaiBalance2),
        planterWithdrawAmount1,
        "planter balance is not ok 2"
      );

      //////////////////////
      const planterWithdrawAmount2 = Units.convert("20", "eth", "wei");
      const ambassadorWithdrawAmount2 = Units.convert("40", "eth", "wei");

      const tx2 = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount2,
        { from: userAccount3 }
      );

      const txAmbassador2 = await planterFundInstance.withdrawBalance(
        ambassadorWithdrawAmount2,
        { from: userAccount4 }
      );

      truffleAssert.eventEmitted(tx2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount2 &&
          ev.account == userAccount3
        );
      });

      truffleAssert.eventEmitted(txAmbassador2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == ambassadorWithdrawAmount2 &&
          ev.account == userAccount4
        );
      });

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(
          Number(contractBalanceAfterFund),
          Math.add(
            planterWithdrawAmount1,
            planterWithdrawAmount2,
            ambassadorWithdrwAmount1,
            ambassadorWithdrawAmount2
          )
        ),
        Number(contractBalanceAfterWithdraw2),
        "contract balance is not ok after withdraw 2"
      );

      const planterBalance3 = await planterFundInstance.balances.call(
        userAccount3
      );
      const ambassadorBalance4 = await planterFundInstance.balances.call(
        userAccount4
      );

      assert.equal(
        Math.subtract(
          totalPlanterFund,
          Math.add(planterWithdrawAmount1, planterWithdrawAmount2)
        ),
        Number(planterBalance3),
        "planter blance is not ok 3"
      );

      assert.equal(
        0,
        Number(ambassadorBalance4),
        "ambassador blance is not ok 3"
      );

      const totalBalances = await planterFundInstance.totalBalances();

      assert.equal(
        0,
        Number(totalBalances.ambassador),
        "totalAmbassadorFund is not ok 3"
      );

      const planterDaiBalance3 = await daiInstance.balanceOf.call(userAccount3);

      assert.equal(
        Number(planterDaiBalance3),
        Math.add(Number(planterDaiBalance2), planterWithdrawAmount2),
        "planter balance is not ok 3"
      );
    });

    it("should withdraw planter and organizationPlanter succussfully", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount5,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      await Common.successJoin(
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

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );
      await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      let planterBalance = await web3.eth.getBalance(userAccount3);

      let ambassadorBalance = await web3.eth.getBalance(userAccount4);

      let organizationBalance = await web3.eth.getBalance(userAccount5);

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        {
          from: deployerAccount,
        }
      );

      const planterWithdrawAmount = Units.convert("20", "eth", "wei");
      const organizationWithdrawAmount = Units.convert("80", "eth", "wei");
      const ambassadorWithdrawAmount = Units.convert("10", "eth", "wei");

      let txPlanter = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount,
        {
          from: userAccount3,
        }
      );

      let txOrganization = await planterFundInstance.withdrawBalance(
        organizationWithdrawAmount,
        {
          from: userAccount5,
        }
      );

      let txAmbassador = await planterFundInstance.withdrawBalance(
        ambassadorWithdrawAmount,
        {
          from: userAccount4,
        }
      );

      assert.equal(
        Number(await daiInstance.balanceOf.call(userAccount3)),
        planterWithdrawAmount
      );

      assert.equal(
        Number(await daiInstance.balanceOf.call(userAccount5)),
        organizationWithdrawAmount
      );

      assert.equal(
        Number(await daiInstance.balanceOf.call(userAccount4)),
        ambassadorWithdrawAmount
      );
    });

    it("should fail of insufficient amount", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount5,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      await Common.successJoin(
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

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );
      await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        {
          from: deployerAccount,
        }
      );

      const planterWithdrawAmount = Units.convert("21", "eth", "wei");
      const organizationWithdrawAmount = Units.convert("81", "eth", "wei");
      const ambassadorWithdrawAmount = Units.convert("51", "eth", "wei");

      let txPlanter = await planterFundInstance
        .withdrawBalance(planterWithdrawAmount, {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      let txOrganization = await planterFundInstance
        .withdrawBalance(organizationWithdrawAmount, {
          from: userAccount5,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
      let txAmbassador = await planterFundInstance
        .withdrawBalance(ambassadorWithdrawAmount, {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    });

    it("check planter and organization withdraw balance to be correct", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount5,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      await Common.successJoin(
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

      const totalPlanterFund = planterFund;

      const totalAmbassadorFund = ambassadorFund;

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        { from: deployerAccount }
      );

      const contractBalanceAfterFund = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Number(contractBalanceAfterFund),
        Math.add(planterFund, ambassadorFund),
        "contrct balance charged inconrrectly"
      );

      await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      const planterBalance1 = await planterFundInstance.balances.call(
        userAccount3
      );
      const accountBalance1 = await web3.eth.getBalance(userAccount3);

      const ambassadorBalance1 = await planterFundInstance.balances.call(
        userAccount4
      );

      const OrganizationBalance1 = await planterFundInstance.balances.call(
        userAccount5
      );

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
        Number(ambassadorBalance1),
        totalAmbassadorFund,
        "ambassador balance is not ok 1"
      );

      const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");
      const ambassadorWithdrawAmount1 = Units.convert("10", "eth", "wei");
      const organizationWithdrawAmount1 = Units.convert("10", "eth", "wei");
      const tx = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount1,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(tx, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount1 &&
          ev.account == userAccount3
        );
      });

      const txAmbassador = await planterFundInstance.withdrawBalance(
        ambassadorWithdrawAmount1,
        { from: userAccount4 }
      );

      truffleAssert.eventEmitted(txAmbassador, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == ambassadorWithdrawAmount1 &&
          ev.account == userAccount4
        );
      });

      const txOrganization = await planterFundInstance.withdrawBalance(
        organizationWithdrawAmount1,
        { from: userAccount5 }
      );

      truffleAssert.eventEmitted(txOrganization, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == organizationWithdrawAmount1 &&
          ev.account == userAccount5
        );
      });

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(
          Number(contractBalanceAfterFund),
          Math.add(
            planterWithdrawAmount1,
            ambassadorWithdrawAmount1,
            organizationWithdrawAmount1
          )
        ),
        Number(contractBalanceAfterWithdraw1),
        "contract balance is not ok after withdraw 1"
      );

      const planterBalance2 = await planterFundInstance.balances.call(
        userAccount3
      );
      const accountBalance2 = await daiInstance.balanceOf.call(userAccount3);

      const ambassadorBalance2 = await planterFundInstance.balances.call(
        userAccount4
      );

      const organizationBalance2 = await planterFundInstance.balances.call(
        userAccount5
      );
      const accountOrganizationBalance2 = await daiInstance.balanceOf.call(
        userAccount5
      );

      assert.equal(
        Math.subtract(
          Math.divide(Math.mul(totalPlanterFund, planterPortion), 10000),
          planterWithdrawAmount1
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
          organizationWithdrawAmount1
        ),
        Number(organizationBalance2),
        "organization blance is not ok 2"
      );

      assert.equal(
        Math.subtract(totalAmbassadorFund, ambassadorWithdrawAmount1),
        Number(ambassadorBalance2),
        "ambassador blance is not ok 2"
      );

      assert.equal(
        Number(accountBalance2),
        planterWithdrawAmount1,
        "planter balance is not ok 2"
      );

      assert.equal(
        Number(accountOrganizationBalance2),
        organizationWithdrawAmount1,
        "organization balance is not ok 2"
      );

      //////////////////////
      const planterWithdrawAmount2 = Units.convert("53", "eth", "wei");
      const organizationWithdrawAmount2 = Units.convert("27", "eth", "wei");
      const ambassadorWithdrawAmount2 = Units.convert("10", "eth", "wei");
      const tx2 = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount2,
        { from: userAccount3 }
      );

      const txOrganization2 = await planterFundInstance.withdrawBalance(
        organizationWithdrawAmount2,
        { from: userAccount5 }
      );

      const txAmbassador2 = await planterFundInstance.withdrawBalance(
        ambassadorWithdrawAmount2,
        { from: userAccount4 }
      );

      truffleAssert.eventEmitted(tx2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount2 &&
          ev.account == userAccount3
        );
      });

      truffleAssert.eventEmitted(txOrganization2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == organizationWithdrawAmount2 &&
          ev.account == userAccount5
        );
      });

      truffleAssert.eventEmitted(txAmbassador2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == ambassadorWithdrawAmount2 &&
          ev.account == userAccount4
        );
      });

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(
          Number(contractBalanceAfterFund),
          Math.add(
            planterWithdrawAmount1,
            planterWithdrawAmount2,
            organizationWithdrawAmount1,
            organizationWithdrawAmount2,
            ambassadorWithdrawAmount1,
            ambassadorWithdrawAmount2
          )
        ),
        Number(contractBalanceAfterWithdraw2),
        "contract balance is not ok after withdraw 2"
      );

      const planterBalance3 = await planterFundInstance.balances.call(
        userAccount3
      );
      const ambassadorBalance4 = await planterFundInstance.balances.call(
        userAccount4
      );
      const organizationBalance3 = await planterFundInstance.balances.call(
        userAccount5
      );

      assert.equal(0, Number(planterBalance3), "planter blance is not ok 3");

      assert.equal(
        0,
        Number(organizationBalance3),
        "organization blance is not ok 3"
      );

      assert.equal(
        Math.subtract(
          totalAmbassadorFund,
          Math.add(ambassadorWithdrawAmount2, ambassadorWithdrawAmount1)
        ),
        Number(ambassadorBalance4),
        "ambassador blance is not ok 3"
      );

      const totalBalances = await planterFundInstance.totalBalances();

      assert.equal(
        0,
        Number(totalBalances.ambassador),
        "totalAmbassadorFund is not ok 3"
      );

      assert.equal(
        0,
        Number(totalBalances.planter),
        "totalPalnterFund is not ok 3"
      );

      const accountBalance3 = await daiInstance.balanceOf.call(userAccount3);
      const accountOrganizationBalance3 = await daiInstance.balanceOf.call(
        userAccount5
      );

      assert.equal(
        Number(accountBalance3),
        Math.add(Number(accountBalance2), planterWithdrawAmount2),

        "planter balance is not ok 3"
      );

      assert.equal(
        Number(accountOrganizationBalance3),
        Math.add(
          Number(accountOrganizationBalance2),
          organizationWithdrawAmount2
        ),
        "organization balance is not ok 3"
      );
    });

    it("organizationPlanter plant tree and withdraw successfully", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;
      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount3,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      const totalPlanterFund = planterFund;

      const totalAmbassadorFund = ambassadorFund;

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        { from: deployerAccount }
      );

      const contractBalanceAfterFund = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      const fundTx = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      truffleAssert.eventEmitted(fundTx, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount3 &&
          Number(ev.amount) == Number(planterFund) &&
          ev.ambassador == zeroAddress
        );
      });

      const OrganizationPlanterBalance1 =
        await planterFundInstance.balances.call(userAccount3);

      const totalBalances = await planterFundInstance.totalBalances();

      assert.equal(
        Number(OrganizationPlanterBalance1),
        Number(totalPlanterFund),
        "Organization planter balance is not ok 1"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        totalAmbassadorFund,
        "localDevelopment balance is not ok 1"
      );

      assert.equal(
        Number(totalBalances.ambassador),
        0,
        "total referrar fund is not ok"
      );

      const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");

      const tx = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount1,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(tx, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount1 &&
          ev.account == userAccount3
        );
      });

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(Number(contractBalanceAfterFund), planterWithdrawAmount1),
        Number(contractBalanceAfterWithdraw1),
        "contract balance is not ok after withdraw 1"
      );

      const organizationPlanterBalance2 =
        await planterFundInstance.balances.call(userAccount3);
      const accountOrganizationPlanterBalance2 =
        await daiInstance.balanceOf.call(userAccount3);

      const totalBalances2 = await planterFundInstance.totalBalances();

      assert.equal(
        Math.subtract(Number(totalPlanterFund), planterWithdrawAmount1),
        Number(organizationPlanterBalance2),
        "organization planter blance is not ok 2"
      );

      assert.equal(
        totalAmbassadorFund,
        Number(totalBalances2.localDevelopment),
        "localDevelopment blance is not ok 2"
      );

      assert.equal(
        Number(accountOrganizationPlanterBalance2),
        planterWithdrawAmount1,
        "organization planter balance is not ok 2"
      );

      // //////////////////////
      const planterWithdrawAmount2 = Units.convert("90", "eth", "wei");

      //amount must be gt .5 dai
      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("0.4"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const tx2 = await planterFundInstance.withdrawBalance(
        planterWithdrawAmount2,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(tx2, "BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == planterWithdrawAmount2 &&
          ev.account == userAccount3
        );
      });

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      assert.equal(
        Math.subtract(
          Number(contractBalanceAfterFund),
          Math.add(planterWithdrawAmount1, planterWithdrawAmount2)
        ),
        Number(contractBalanceAfterWithdraw2),
        "contract balance is not ok after withdraw 2"
      );

      const organizationPlanterBalance3 =
        await planterFundInstance.balances.call(userAccount3);

      const totalBalances3 = await planterFundInstance.totalBalances();

      assert.equal(
        0,
        Number(organizationPlanterBalance3),
        "planter blance is not ok 3"
      );

      assert.equal(
        0,
        Number(totalBalances3.ambassador),
        "totalAmbassadorFund is not ok 3"
      );

      assert.equal(
        0,
        Number(totalBalances3.planter),
        "totalPalnterFund is not ok 3"
      );

      assert.equal(
        totalAmbassadorFund,
        Number(totalBalances3.localDevelopment),
        "totallocalDevelop is not ok 3"
      );

      const accountOrganizationPlanterBalance3 =
        await daiInstance.balanceOf.call(userAccount3);

      assert.equal(
        Number(accountOrganizationPlanterBalance3),

        Math.add(
          Number(accountOrganizationPlanterBalance2),
          planterWithdrawAmount2
        ),

        "planter balance is not ok 3"
      );
    });

    it("withdraw local development", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);

      await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;
      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoinOrganization(
        arInstance,
        planterInstance,
        userAccount3,
        zeroAddress,
        deployerAccount,
        dataManager
      );

      const totalPlanterFund = planterFund;

      const totalAmbassadorFund = ambassadorFund;

      await daiInstance.transfer(
        planterFundInstance.address,
        Units.convert("150", "eth", "wei"),
        { from: deployerAccount }
      );

      const contractBalanceAfterFund = await daiInstance.balanceOf.call(
        planterFundInstance.address
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      const fundTx = await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      truffleAssert.eventEmitted(fundTx, "PlanterTotalClaimedUpdated", (ev) => {
        return (
          ev.treeId == treeId &&
          ev.planter == userAccount3 &&
          Number(ev.amount) == Number(planterFund) &&
          ev.ambassador == zeroAddress
        );
      });

      const planterBalance1 = await planterFundInstance.balances.call(
        userAccount3
      );

      const totalBalances = await planterFundInstance.totalBalances();

      assert.equal(
        Number(planterBalance1),
        Number(totalPlanterFund),
        "Organization planter balance is not ok 1"
      );

      assert.equal(
        Number(totalBalances.planter),
        0,
        "total planter fund is not ok"
      );

      assert.equal(
        Number(totalBalances.ambassador),
        0,
        "total referrar fund is not ok"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        totalAmbassadorFund,
        "localDevelopment balance is not ok 1"
      );

      const withdrawAmount1 = web3.utils.toWei("20");
      const withdrawAmount2 = web3.utils.toWei("30");
      const invalidWithdrawAmount = web3.utils.toWei("40");

      /////////////////// check withdraw failure

      await planterFundInstance
        .withdrawLocalDevelopmentBalance(withdrawAmount1, "some reason", {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await planterFundInstance
        .withdrawLocalDevelopmentBalance(withdrawAmount1, "some reason", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await planterFundInstance.setLocalDevelopmentAddress(userAccount8, {
        from: deployerAccount,
      });

      await planterFundInstance
        .withdrawLocalDevelopmentBalance(0, "some reason", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const txLocalDevelop =
        await planterFundInstance.withdrawLocalDevelopmentBalance(
          withdrawAmount1,
          "some reason",
          { from: deployerAccount }
        );

      truffleAssert.eventEmitted(
        txLocalDevelop,
        "LocalDevelopmentBalanceWithdrew",
        (ev) => {
          return (
            Number(ev.amount) == Number(withdrawAmount1) &&
            ev.account == userAccount8 &&
            ev.reason == "some reason"
          );
        }
      );

      ////////////// check contract balance

      assert.equal(
        Math.add(
          Number(await daiInstance.balanceOf.call(planterFundInstance.address)),
          Number(withdrawAmount1)
        ),
        Number(contractBalanceAfterFund),
        "contract balance after withdraw1 is not ok"
      );

      //////////////////// check total balances

      const totalBalances2 = await planterFundInstance.totalBalances();

      assert.equal(
        Math.subtract(Number(totalAmbassadorFund), Number(withdrawAmount1)),
        Number(totalBalances2.localDevelopment),
        "localDevelopment blance is not ok 2"
      );

      //////////////////////check user8 balance after withdraw

      assert.equal(
        Number(await daiInstance.balanceOf.call(userAccount8)),
        Number(withdrawAmount1),
        "local development address amount is not ok"
      );

      ///////////////// ------------ 2nd withdraw (invalid amount)

      await planterFundInstance
        .withdrawLocalDevelopmentBalance(invalidWithdrawAmount, "some reason", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      ///////////////// ------------ 2nd withdraw
      await planterFundInstance.withdrawLocalDevelopmentBalance(
        withdrawAmount2,
        "some reason",
        {
          from: deployerAccount,
        }
      );

      ////////////// check contract balance

      assert.equal(
        Math.add(
          Number(await daiInstance.balanceOf.call(planterFundInstance.address)),
          Number(withdrawAmount1),
          Number(withdrawAmount2)
        ),
        Number(contractBalanceAfterFund),
        "contract balance after withdraw2 is not ok"
      );

      //////////////////// check total balances

      assert.equal(
        Math.subtract(
          Number(totalAmbassadorFund),
          Math.add(Number(withdrawAmount1), Number(withdrawAmount2))
        ),
        Number((await planterFundInstance.totalBalances()).localDevelopment),
        "localDevelopment blance is not ok 3"
      );

      //////////////////////check user8 balance after withdraw

      assert.equal(
        Number(await daiInstance.balanceOf.call(userAccount8)),
        Math.add(Number(withdrawAmount1), Number(withdrawAmount2)),
        "local development address amount is not ok"
      );
    });

    it("should fail withdraw planter", async () => {
      await Common.addPlanter(arInstance, userAccount3, deployerAccount);
      await Common.addPlanter(arInstance, userAccount5, deployerAccount);

      const treeId = 1;

      const planterFund = Units.convert("100", "eth", "wei");
      const ambassadorFund = Units.convert("50", "eth", "wei");

      await planterFundInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        treeId,
        userAccount3,
        zeroAddress,
        zeroAddress
      );

      await planterFundInstance.updateProjectedEarnings(
        treeId,
        planterFund,
        ambassadorFund,
        {
          from: userAccount8,
        }
      );

      await planterFundInstance.updatePlanterTotalClaimed(
        treeId,
        userAccount3,
        25920,
        {
          from: userAccount6,
        }
      );

      await planterFundInstance
        .withdrawBalance(0, {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance
        .withdrawBalance(Units.convert("150", "eth", "wei"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      //amount must be gt .5 dai
      await planterFundInstance
        .withdrawBalance(web3.utils.toWei("0.2"), {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstance
        .withdrawBalance(Units.convert("75", "eth", "wei"), {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT); //not planter and his account have no vallue

      await planterFundInstance
        .withdrawBalance(Units.convert("50", "eth", "wei"), {
          from: userAccount5,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    });

    //////---------------------------------------------- test gsn --------------------------------
    // it("test gsn [ @skip-on-coverage ]", async () => {
    //   let env = await GsnTestEnvironment.startGsn("localhost");

    //   // const forwarderAddress = "0xDA69A8986295576aaF2F82ab1cf4342F1Fd6fb6a";
    //   // const relayHubAddress = "0xe692c56fF6d87b1028C967C5Ab703FBd1839bBb2";
    //   // const paymasterAddress = "0x5337173441B06673d317519cb2503c8395015b15";
    //   const { forwarderAddress, relayHubAddress, paymasterAddress } =
    //     env.contractsDeployment;

    //   await planterFundInstance.setTrustedForwarder(forwarderAddress, {
    //     from: deployerAccount,
    //   });

    //   let paymaster = await WhitelistPaymaster.new(arInstance.address);

    //   await paymaster.setRelayHub(relayHubAddress);
    //   await paymaster.setTrustedForwarder(forwarderAddress);

    //   web3.eth.sendTransaction({
    //     from: accounts[0],
    //     to: paymaster.address,
    //     value: web3.utils.toWei("1"),
    //   });

    //   origProvider = web3.currentProvider;

    //   conf = { paymasterAddress: paymaster.address };

    //   gsnProvider = await Gsn.RelayProvider.newProvider({
    //     provider: origProvider,
    //     config: conf,
    //   }).init();

    //   provider = new ethers.providers.Web3Provider(gsnProvider);

    //   let signerPlanterFund = provider.getSigner(4);

    //   let contractPlanterFund = await new ethers.Contract(
    //     planterFundInstance.address,
    //     planterFundInstance.abi,
    //     signerPlanterFund
    //   );

    //   //////////---------------------------------------------------------------------------------

    //   const planterAddress = userAccount3;

    //   await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    //   const treeId = 1;

    //   const planterFund = Units.convert("100", "eth", "wei");
    //   const ambassadorFund = Units.convert("50", "eth", "wei");

    //   const planterWithdrawAmount = Units.convert("100", "eth", "wei");

    //   await planterFundInstance.setPlanterContractAddress(
    //     planterInstance.address,
    //     {
    //       from: deployerAccount,
    //     }
    //   );

    //   await Common.successJoin(
    //     arInstance,
    //     deployerAccount,
    //     planterInstance,
    //     treeId,
    //     planterAddress,
    //     userAccount4,
    //     zeroAddress
    //   );

    //   await daiInstance.transfer(
    //     planterFundInstance.address,
    //     Units.convert("150", "eth", "wei"),
    //     {
    //       from: deployerAccount,
    //     }
    //   );

    //   await planterFundInstance.updateProjectedEarnings(
    //     treeId,
    //     planterFund,
    //     ambassadorFund,
    //     {
    //       from: userAccount8,
    //     }
    //   );

    //   await planterFundInstance.updatePlanterTotalClaimed(
    //     treeId,
    //     planterAddress,
    //     25920,
    //     {
    //       from: userAccount6,
    //     }
    //   );

    //   await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
    //     from: deployerAccount,
    //   });

    //   let balanceAccountBefore = await web3.eth.getBalance(planterAddress);

    //   await contractPlanterFund
    //     .withdrawBalance(planterWithdrawAmount, {
    //       from: planterAddress,
    //     })
    //     .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

    //   await paymaster.addPlanterWhitelistTarget(planterFundInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await contractPlanterFund.withdrawBalance(planterWithdrawAmount, {
    //     from: planterAddress,
    //   });

    //   let balanceAccountAfter = await web3.eth.getBalance(planterAddress);

    //   assert.equal(
    //     balanceAccountAfter,
    //     balanceAccountBefore,
    //     "gsn not true work"
    //   );
    // });
  });
});
