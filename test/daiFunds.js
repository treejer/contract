const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const DaiFunds = artifacts.require("DaiFunds.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Math = require("./math");

var Dai = artifacts.require("Dai.sol");

const { CommonErrorMsg, DaiFundsErrorMsg } = require("./enumes");

const Common = require("./common");

contract("DaiFunds", (accounts) => {
  const deployerAccount = accounts[0];
  const dataManager = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  let arInstance;
  let daiFundsInstance;
  let fModel;

  let daiInstance;
  let planterFundsInstnce;

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const withdrawReason = "reason to withdraw";

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );
  });

  describe("deployment and set addresses", () => {
    before(async () => {
      /////////////---------------------- deploy contracts ------------------- //////////////

      daiFundsInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      planterFundsInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
    });

    it("set daiFundsInstance address and fail in invalid situation", async () => {
      /////////////------------------------------------ set Dai Token address ----------------------------------------//
      await daiFundsInstance
        .setDaiTokenAddress(daiInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setDaiTokenAddress(zeroAddress, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.daiToken.call(),
        daiInstance.address,
        "Set dai contract address not true"
      );
      /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//
      await daiFundsInstance
        .setPlanterFundContractAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await daiFundsInstance.planterFundContract.call(),
        planterFundsInstnce.address,
        "Set planter fund contract address not true"
      );
      //-------------------------------setResearchAddress test-------------------------------------------------------
      let researchAddress = userAccount4;

      await daiFundsInstance.setResearchAddress(researchAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.researchAddress(),
        researchAddress,
        "Set researchAddress address not true"
      );

      //------------------------setResearchAddress should be fail (invalid access)---------------------------------
      researchAddress = userAccount4;

      await daiFundsInstance
        .setResearchAddress(researchAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setResearchAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------setLocalDevelopmentAddress should be fail (invalid access)----------------------------
      let localDevelopmentAddress = userAccount4;

      await daiFundsInstance
        .setLocalDevelopmentAddress(localDevelopmentAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setLocalDevelopmentAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------setLocalDevelopmentAddress test-------------------------------------------------------
      localDevelopmentAddress = userAccount4;

      await daiFundsInstance.setLocalDevelopmentAddress(
        localDevelopmentAddress,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await daiFundsInstance.localDevelopmentAddress(),
        localDevelopmentAddress,
        "Set localDevelopmentAddress address not true"
      );

      //-----------------------------setInsuranceAddress should be fail (invalid access)---------------------------------
      let insuranceAddress = userAccount4;

      await daiFundsInstance
        .setInsuranceAddress(insuranceAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setInsuranceAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-----------------------------setInsuranceAddress should be success---------------------------------
      insuranceAddress = userAccount4;

      await daiFundsInstance.setInsuranceAddress(insuranceAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.insuranceAddress(),
        insuranceAddress,
        "Set insuranceAddress address not true"
      );

      //--------------------------setTreasuryAddress should be fail (invalid access)--------------------

      let treasuryAddress = userAccount4;

      await daiFundsInstance
        .setTreasuryAddress(treasuryAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setTreasuryAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //--------------------------setTreasuryAddress should be success--------------------

      treasuryAddress = userAccount4;

      await daiFundsInstance.setTreasuryAddress(treasuryAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.treasuryAddress(),
        treasuryAddress,
        "Set treasuryAddress address not true"
      );

      //-------------------setReserve1Address should be fail (invalid access)-------------------
      let reserve1Address = userAccount4;

      await daiFundsInstance
        .setReserve1Address(reserve1Address, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setReserve1Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
      //--------------------------------setReserve1Address should be success-----------------------
      reserve1Address = userAccount4;

      await daiFundsInstance.setReserve1Address(reserve1Address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.reserve1Address(),
        reserve1Address,
        "Set reserve1Address address not true"
      );
      //----------------------------------------setReserve2Address should be fail (invalid access)-----------------------------------
      let reserve2Address = userAccount4;

      await daiFundsInstance
        .setReserve2Address(reserve2Address, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .setReserve2Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------------setReserve2Address should be success------------------------------------------------
      reserve2Address = userAccount4;

      await daiFundsInstance.setReserve2Address(reserve2Address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundsInstance.reserve2Address(),
        reserve2Address,
        "Set reserve2Address address not true"
      );
    });
  });

  describe("with financial section", () => {
    beforeEach(async () => {
      /////////////---------------------- deploy contracts ------------------- //////////////

      daiFundsInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      fModel = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      planterFundsInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      /////////////---------------------- set address ------------------- //////////////
      await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundsInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        { from: deployerAccount }
      );
    });

    /////////////------------------------------------ fundTree function test ----------------------------------------//

    it("Should fundTree work successfully for 1 tree fund", async () => {
      const treeId = 1;
      let amount = web3.utils.toWei("1", "Ether");

      const planterShare = 4000;
      const ambassadorShare = 2000;
      const research = 1000;
      const localDevelopment = 1000;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 0;
      const reserve2 = 0;

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      ////--------------add and assign DistributionModel for tree
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );

      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      const eventTx = await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount3 }
      );

      let expected = {
        planterShare: (planterShare * amount) / 10000,
        ambassadorShare: (ambassadorShare * amount) / 10000,
        research: (research * amount) / 10000,
        localDevelopment: (localDevelopment * amount) / 10000,
        insurance: (insurance * amount) / 10000,
        treasury: (treasury * amount) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      truffleAssert.eventEmitted(eventTx, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId &&
          Number(ev.amount) == Number(amount) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected.planterShare),
              Number(expected.ambassadorShare)
            )
        );
      });

      let daiFundBalance = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const planterFundBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(daiFundBalance),
        Math.add(
          expected.localDevelopment,
          expected.insurance,
          expected.reserve1,
          expected.reserve1,
          expected.reserve2,
          expected.research,
          expected.treasury
        )
      );

      assert.equal(
        Number(planterFundBalance),
        Math.add(expected.planterShare, expected.ambassadorShare)
      );

      //check daiFund totalBalances
      let totalBalancesDaiFunds = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(totalBalancesDaiFunds.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      // check planterShare and ambassadorShare in planterShare

      let pShare = await planterFundsInstnce.planterShare.call(treeId);
      let aShare = await planterFundsInstnce.ambassadorShare.call(treeId);

      assert.equal(
        Number(pShare),
        expected.planterShare,
        "planter funds invalid"
      );

      assert.equal(
        Number(aShare),
        expected.ambassadorShare,
        "ambassador funds invalid"
      );

      //check fund planter totalBalances

      let totalBalancesPlanterFund =
        await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(totalBalancesPlanterFund.planterShare),
        expected.planterShare,
        "planter funds invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFund.ambassadorShare),
        expected.ambassadorShare,
        "ambassador funds invalid"
      );
    });
    it("Should fundTree work successfully for 2 tree fund", async () => {
      const treeId1 = 1;
      const treeId2 = 15;
      let amount1 = web3.utils.toWei("1", "Ether");
      let amount2 = web3.utils.toWei("0.5", "Ether");

      const planterShare1 = 4000;
      const ambassadorShare1 = 2000;
      const research1 = 1000;
      const localDevelopment1 = 1000;
      const insurance1 = 1000;
      const treasury1 = 1000;
      const reserve1_1 = 0;
      const reserve2_1 = 0;

      const planterShare2 = 4000;
      const ambassadorShare2 = 2000;
      const research2 = 1000;
      const localDevelopment2 = 1000;
      const insurance2 = 1000;
      const treasury2 = 1000;
      const reserve1_2 = 0;
      const reserve2_2 = 0;

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      ////--------------add and assign DistributionModel for tree
      await fModel.addAllocationData(
        planterShare1,
        ambassadorShare1,
        research1,
        localDevelopment1,
        insurance1,
        treasury1,
        reserve1_1,
        reserve2_1,
        {
          from: dataManager,
        }
      );

      await fModel.addAllocationData(
        planterShare2,
        ambassadorShare2,
        research2,
        localDevelopment2,
        insurance2,
        treasury2,
        reserve1_2,
        reserve2_2,
        {
          from: dataManager,
        }
      );

      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      await fModel.assignAllocationToTree(11, 20, 1, {
        from: dataManager,
      });

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount1);
      await daiInstance.setMint(daiFundsInstance.address, amount2);

      ////--------------------call fund tree by auction----------------
      const eventTx1 = await daiFundsInstance.fundTree(
        treeId1,
        amount1,
        planterShare1,
        ambassadorShare1,
        research1,
        localDevelopment1,
        insurance1,
        treasury1,
        reserve1_1,
        reserve2_1,
        { from: userAccount3 }
      );

      const eventTx2 = await daiFundsInstance.fundTree(
        treeId2,
        amount2,
        planterShare2,
        ambassadorShare2,
        research2,
        localDevelopment2,
        insurance2,
        treasury2,
        reserve1_2,
        reserve2_2,
        { from: userAccount3 }
      );

      let expected1 = {
        planterShare: (planterShare1 * amount1) / 10000,
        ambassadorShare: (ambassadorShare1 * amount1) / 10000,
        research: (research1 * amount1) / 10000,
        localDevelopment: (localDevelopment1 * amount1) / 10000,
        insurance: (insurance1 * amount1) / 10000,
        treasury: (treasury1 * amount1) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      let expected2 = {
        planterShare: (planterShare2 * amount2) / 10000,
        ambassadorShare: (ambassadorShare2 * amount2) / 10000,
        research: (research2 * amount2) / 10000,
        localDevelopment: (localDevelopment2 * amount2) / 10000,
        insurance: (insurance2 * amount2) / 10000,
        treasury: (treasury2 * amount2) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      truffleAssert.eventEmitted(eventTx1, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId1 &&
          Number(ev.amount) == Number(amount1) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected1.planterShare),
              Number(expected1.ambassadorShare)
            )
        );
      });

      truffleAssert.eventEmitted(eventTx2, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId2 &&
          Number(ev.amount) == Number(amount2) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected2.planterShare),
              Number(expected2.ambassadorShare)
            )
        );
      });

      let daiFundBalance = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const planterFundBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(daiFundBalance),
        Math.add(
          expected1.localDevelopment,
          expected1.insurance,
          expected1.reserve1,
          expected1.reserve1,
          expected1.reserve2,
          expected1.research,
          expected1.treasury,
          expected2.localDevelopment,
          expected2.insurance,
          expected2.reserve1,
          expected2.reserve1,
          expected2.reserve2,
          expected2.research,
          expected2.treasury
        ),
        "daiFund balance is not correct"
      );

      assert.equal(
        Number(planterFundBalance),
        Math.add(
          expected1.planterShare,
          expected1.ambassadorShare,
          expected2.planterShare,
          expected2.ambassadorShare
        ),
        "planterShare balance is not correct"
      );

      //check daiFund totalBalances
      let totalBalancesDaiFunds = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(totalBalancesDaiFunds.research),
        Math.add(expected1.research, expected2.research),
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.localDevelopment),
        Math.add(expected1.localDevelopment, expected2.localDevelopment),
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.insurance),
        Math.add(expected1.insurance, expected2.insurance),
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.treasury),
        Math.add(expected1.treasury, expected2.treasury),
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.reserve1),
        Math.add(expected1.reserve1, expected2.reserve1),
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFunds.reserve2),
        Math.add(expected1.reserve2, expected2.reserve2),
        "reserve2 funds invalid"
      );

      // check planterShare and ambassadorShare in planterShare

      let pShare1 = await planterFundsInstnce.planterShare.call(treeId1);
      let aShare1 = await planterFundsInstnce.ambassadorShare.call(treeId1);
      let pShare2 = await planterFundsInstnce.planterShare.call(treeId2);
      let aShare2 = await planterFundsInstnce.ambassadorShare.call(treeId2);

      assert.equal(
        Number(pShare1),
        expected1.planterShare,
        "planter funds invalid"
      );

      assert.equal(
        Number(aShare1),
        expected1.ambassadorShare,
        "ambassador funds invalid"
      );

      assert.equal(
        Number(pShare2),
        expected2.planterShare,
        "planter funds invalid"
      );

      assert.equal(
        Number(aShare2),
        expected2.ambassadorShare,
        "ambassador funds invalid"
      );

      //check fund planter totalBalances

      let totalBalancesPlanterFund =
        await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(totalBalancesPlanterFund.planterShare),
        Math.add(expected1.planterShare, expected2.planterShare),
        "planter funds invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFund.ambassadorShare),
        Math.add(expected1.ambassadorShare, expected2.ambassadorShare),
        "ambassador funds invalid"
      );
    });

    it("check withdraw errors from accounts", async () => {
      ////----------------------should fail tree research withdraw
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 3000;
      const ambassadorShare = 1000;
      const research = 1000;
      const localDevelopment = 1000;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 1000;
      const reserve2 = 1000;

      ///////////--------------------- add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      //////-------------------- handle dm model

      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );

      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      //////////--------------- fund tree -------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      await daiFundsInstance.setResearchAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawResearchBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawResearchBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawResearchBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawResearchBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawResearchBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail local develop withdraw------------------/////

      await daiFundsInstance.setLocalDevelopmentAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("3"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawLocalDevelopmentBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail rescue fund withdraw------------------/////

      await daiFundsInstance.setInsuranceAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawInsuranceBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawInsuranceBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawInsuranceBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail treejer develop withdraw------------------/////

      await daiFundsInstance.setTreasuryAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawTreasuryBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawTreasuryBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawTreasuryBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail reserve fund1 withdraw------------------/////

      await daiFundsInstance.setReserve1Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawReserve1Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawReserve1Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawReserve1Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawReserve1Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawReserve1Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail reserve fund2 withdraw------------------/////
      await daiFundsInstance.setReserve2Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance
        .withdrawReserve2Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundsInstance
        .withdrawReserve2Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundsInstance
        .withdrawReserve2Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundsInstance.withdrawReserve2Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundsInstance
        .withdrawReserve2Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
    });

    it("should withdraw address succussfully", async () => {
      ///-------------------------------- should withdraw local develop succussfully ---------------------------------------
      const treeId = 1;
      const amount = web3.utils.toWei("2");
      const planterShare = 3000;
      const ambassadorShare = 500;
      const research = 2000;
      const localDevelopment = 500;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 1000;
      const reserve2 = 1000;

      //////// -------------------- add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      ////////////------------------- set addresses

      await daiFundsInstance.setLocalDevelopmentAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance.setResearchAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance.setInsuranceAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance.setTreasuryAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance.setReserve1Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundsInstance.setReserve2Address(userAccount3, {
        from: deployerAccount,
      });

      ////////------------------- handle dm models

      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );

      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawLocalDevelopmentBalance(
        web3.utils.toWei("0.05"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///
      ///

      ////-------------------------------------- should withdraw rescue fund succussfully -----------------------------------------

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawInsuranceBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw treejer develop succussfully -----------------------------------------

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawTreasuryBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw reserve fund1 succussfully -----------------------------------------

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawReserve1Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw reserve fund2 succussfully -----------------------------------------

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawReserve2Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw Tree Research succussfully -----------------------------------------

      ////---------------transfer dai for daiFundsInstance-------------------
      await daiInstance.setMint(daiFundsInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundsInstance.withdrawResearchBalance(
        web3.utils.toWei("0.4"),
        "reason to withdraw",
        { from: deployerAccount }
      );
    });

    //------------------------------------------withdraw tree research balance -------------------------------------/

    it("check withdraw tree research data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("3");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 2000;
      const localDevelopment = 500;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 0;
      const reserve2 = 0;
      const researchAddress = userAccount3;

      const totalResearchFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), research),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setResearchAddress(researchAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalResearchFunded,
        Number(totalBalances1.research),
        "tree research total fund1 is not ok"
      );

      const researchBalnance1 = await daiInstance.balanceOf(researchAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.2");

      const tx = await daiFundsInstance.withdrawResearchBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "ResearchBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == researchAddress &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const researchBalnance2 = await daiInstance.balanceOf(researchAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.research),
          Number(totalBalances2.research)
        ),
        Number(withdrawBalance1),
        "tree research total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(researchBalnance2),
        Math.add(Number(researchBalnance1), Number(withdrawBalance1)),
        "tree research account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.3");

      const tx2 = await daiFundsInstance.withdrawResearchBalance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "ResearchBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == researchAddress &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const researchBalnance3 = await daiInstance.balanceOf(researchAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.research),
          Number(totalBalances3.research)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "tree research total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalResearchFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.research),
        "tree research total fund3 is not ok"
      );

      assert.equal(
        Number(researchBalnance3),
        Math.add(Number(researchBalnance2), Number(withdrawBalance2)),
        "tree research account balance is not ok after withdraw2"
      );
    });

    /////////// --------------------------------------------------------------------withdraw local develop balance ----------------------------------------------------------------
    it("check withdraw local develop data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 1500;
      const localDevelopment = 1000;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 0;
      const reserve2 = 0;
      const localDevelopmentAddress = userAccount3;

      const totalLocalDevelopmentFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), localDevelopment),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setLocalDevelopmentAddress(
        localDevelopmentAddress,
        {
          from: deployerAccount,
        }
      );

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalLocalDevelopmentFunded,
        Number(totalBalances1.localDevelopment),
        "local develop total fund1 is not ok"
      );

      const localDevelopmentBalnance1 = await daiInstance.balanceOf(
        localDevelopmentAddress
      );

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundsInstance.withdrawLocalDevelopmentBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(
        tx,
        "LocalDevelopmentBalanceWithdrew",
        (ev) => {
          return (
            Number(ev.amount) == Number(withdrawBalance1) &&
            ev.account == localDevelopmentAddress &&
            ev.reason == withdrawReason
          );
        }
      );
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const localDevelopmentBalnance2 = await daiInstance.balanceOf(
        localDevelopmentAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.localDevelopment),
          Number(totalBalances2.localDevelopment)
        ),
        Number(withdrawBalance1),
        "local develop total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(localDevelopmentBalnance2),
        Math.add(Number(localDevelopmentBalnance1), Number(withdrawBalance1)),
        "local develop account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundsInstance.withdrawLocalDevelopmentBalance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(
        tx2,
        "LocalDevelopmentBalanceWithdrew",
        (ev) => {
          return (
            Number(ev.amount) == Number(withdrawBalance2) &&
            ev.account == localDevelopmentAddress &&
            ev.reason == withdrawReason
          );
        }
      );

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const localDevelopmentBalnance3 = await daiInstance.balanceOf(
        localDevelopmentAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.localDevelopment),
          Number(totalBalances3.localDevelopment)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "local develop total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalLocalDevelopmentFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.localDevelopment),
        "local develop total fund3 is not ok"
      );

      assert.equal(
        Number(localDevelopmentBalnance3),
        Math.add(Number(localDevelopmentBalnance2), Number(withdrawBalance2)),
        "local develop account balance is not ok after withdraw2"
      );
    });

    ///// ---------------------------------------------------------------------withdraw rescue fund balance ---------------------------------------------------------------
    it("check withdraw rescue fund data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 1000;
      const localDevelopment = 1500;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 0;
      const reserve2 = 0;

      const insuranceAddress = userAccount3;

      const totalInsuranceFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), insurance),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setInsuranceAddress(insuranceAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalInsuranceFunded,
        Number(totalBalances1.insurance),
        "rescue fund total fund1 is not ok"
      );

      const insuranceBalnance1 = await daiInstance.balanceOf(insuranceAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundsInstance.withdrawInsuranceBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "RescueBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == insuranceAddress &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const insuranceBalnance2 = await daiInstance.balanceOf(insuranceAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.insurance),
          Number(totalBalances2.insurance)
        ),
        Number(withdrawBalance1),
        "rescue fund total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(insuranceBalnance2),
        Math.add(Number(insuranceBalnance1), Number(withdrawBalance1)),
        "rescue fund account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundsInstance.withdrawInsuranceBalance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "RescueBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == insuranceAddress &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const insuranceBalnance3 = await daiInstance.balanceOf(insuranceAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.insurance),
          Number(totalBalances3.insurance)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "rescue fund total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalInsuranceFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.insurance),
        "rescue fund total fund3 is not ok"
      );

      assert.equal(
        Number(insuranceBalnance3),
        Math.add(Number(insuranceBalnance2), Number(withdrawBalance2)),
        "rescue fund account balance is not ok after withdraw2"
      );
    });

    ////////// ---------------------------------------------------------------------withdraw treejer develop balance ----------------------------------------------------------------
    it("check withdraw treejer develop data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 1000;
      const localDevelopment = 1500;
      const insurance = 1000;
      const treasury = 1000;
      const reserve1 = 0;
      const reserve2 = 0;

      const treasuryAddress = userAccount3;

      const totalTreasuryFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), treasury),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setTreasuryAddress(treasuryAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalTreasuryFunded,
        Number(totalBalances1.treasury),
        "treejer develop total fund1 is not ok"
      );

      const treasuryBalnance1 = await daiInstance.balanceOf(treasuryAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundsInstance.withdrawTreasuryBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "TreasuryBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == treasuryAddress &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const treasuryBalnance2 = await daiInstance.balanceOf(treasuryAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.treasury),
          Number(totalBalances2.treasury)
        ),
        Number(withdrawBalance1),
        "treejer develop total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(treasuryBalnance2),
        Math.add(Number(treasuryBalnance1), Number(withdrawBalance1)),
        "treejer develop account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundsInstance.withdrawTreasuryBalance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "TreasuryBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == treasuryAddress &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const treasuryBalnance3 = await daiInstance.balanceOf(treasuryAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.treasury),
          Number(totalBalances3.treasury)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "treejer develop total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalTreasuryFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.treasury),
        "treejer develop total fund3 is not ok"
      );

      assert.equal(
        Number(treasuryBalnance3),
        Math.add(Number(treasuryBalnance2), Number(withdrawBalance2)),
        "treejer develop account balance is not ok after withdraw2"
      );
    });

    // ---------------------------------------------------------------------withdraw reserve fund1 balance ----------------------------------------------------------------

    it("check withdraw reserve fund1 data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 1000;
      const localDevelopment = 1000;
      const insurance = 1500;
      const treasury = 0;
      const reserve1 = 1000;
      const reserve2 = 0;

      const reserve1Address = userAccount3;

      const totalReserve1Funded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), reserve1),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setReserve1Address(reserve1Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalReserve1Funded,
        Number(totalBalances1.reserve1),
        "reserve fund1 total fund1 is not ok"
      );

      const reserve1Balnance1 = await daiInstance.balanceOf(reserve1Address);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundsInstance.withdrawReserve1Balance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "Reserve1BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == reserve1Address &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const reserve1Balnance2 = await daiInstance.balanceOf(reserve1Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.reserve1),
          Number(totalBalances2.reserve1)
        ),
        Number(withdrawBalance1),
        "reserve fund1 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(reserve1Balnance2),
        Math.add(Number(reserve1Balnance1), Number(withdrawBalance1)),
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundsInstance.withdrawReserve1Balance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "Reserve1BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == reserve1Address &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const reserve1Balnance3 = await daiInstance.balanceOf(reserve1Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.reserve1),
          Number(totalBalances3.reserve1)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "reserve fund1 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalReserve1Funded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.reserve1),
        "reserve fund1 total fund3 is not ok"
      );

      assert.equal(
        Number(reserve1Balnance3),
        Math.add(Number(reserve1Balnance2), Number(withdrawBalance2)),
        "reserve fund1 account balance is not ok after withdraw2"
      );
    });

    // ---------------------------------------------------------------------withdraw reserve fund2 balance ----------------------------------------------------------------

    it("check withdraw reserve fund2 data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const research = 1000;
      const localDevelopment = 1000;
      const insurance = 1500;
      const treasury = 0;
      const reserve1 = 0;
      const reserve2 = 1000;

      const reserve2Address = userAccount3;

      const totalReserve2Funded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), reserve2),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            research,
            localDevelopment,
            insurance,
            treasury,
            reserve1,
            reserve2
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundsInstance.setReserve2Address(reserve2Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
      await fModel.addAllocationData(
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: dataManager,
        }
      );
      await fModel.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////---------------transfer dai for daiFundsInstance-------------------

      await daiInstance.setMint(daiFundsInstance.address, amount);

      await daiInstance.setMint(daiFundsInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundsInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );
      await daiFundsInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        research,
        localDevelopment,
        insurance,
        treasury,
        reserve1,
        reserve2,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const totalBalances1 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalReserve2Funded,
        Number(totalBalances1.reserve2),
        "reserve fund2 total fund1 is not ok"
      );

      const reserve2Balnance1 = await daiInstance.balanceOf(reserve2Address);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundsInstance.withdrawReserve2Balance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "Reserve2BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == reserve2Address &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const reserve2Balnance2 = await daiInstance.balanceOf(reserve2Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.reserve2),
          Number(totalBalances2.reserve2)
        ),
        Number(withdrawBalance1),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(reserve2Balnance2),
        Math.add(Number(reserve2Balnance1), Number(withdrawBalance1)),
        "reserve fund2 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundsInstance.withdrawReserve2Balance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "Reserve2BalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == reserve2Address &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundsInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundsInstance.address
      );

      const reserve2Balnance3 = await daiInstance.balanceOf(reserve2Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          daiFundContractShare,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        "contract balance after withdraw2 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.reserve2),
          Number(totalBalances3.reserve2)
        ),
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalReserve2Funded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.reserve2),
        "reserve fund2 total fund3 is not ok"
      );

      assert.equal(
        Number(reserve2Balnance3),
        Math.add(Number(reserve2Balnance2), Number(withdrawBalance2)),
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });
    ////-------------------------test fundTreeBatch-----------------------------------

    it("2.Should fundTreeBatch work successfully", async () => {
      const treeId = 0;
      const treeId2 = 1;

      let amount = web3.utils.toWei(".531", "Ether");

      const totalPlanterShare1 = web3.utils.toWei("5");
      const totalAmbassadorShare1 = web3.utils.toWei("4");
      const totalResearch1 = web3.utils.toWei("2");
      const totalLocalDevelopment1 = web3.utils.toWei("1");
      const totalInsurance1 = web3.utils.toWei("2");
      const totalTreasury1 = web3.utils.toWei("2");
      const totalReserve1_1 = web3.utils.toWei("2.5");
      const totalReserve2_1 = web3.utils.toWei("1");
      const total1 = web3.utils.toWei("19.5"); //total amount of above shares

      const totalPlanterShare2 = web3.utils.toWei("7");
      const totalAmbassadorShare2 = web3.utils.toWei("2");
      const totalResearch2 = web3.utils.toWei("1");
      const totalLocalDevelopment2 = web3.utils.toWei("3");
      const totalInsurance2 = web3.utils.toWei("4");
      const totalTreasury2 = web3.utils.toWei("2");
      const totalReserve1_2 = web3.utils.toWei("1.5");
      const totalReserve2_2 = web3.utils.toWei("1.5");
      const total2 = web3.utils.toWei("19"); //total amount of above shares

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundsInstance.address,
        deployerAccount
      );

      ////---------------transfer dai for daiFunds-------------------
      await daiInstance.setMint(daiFundsInstance.address, total1);
      await daiInstance.setMint(daiFundsInstance.address, total2);

      ////--------------------call fund tree by auction----------------

      const eventTx1 = await daiFundsInstance.fundTreeBatch(
        totalPlanterShare1,
        totalAmbassadorShare1,
        totalResearch1,
        totalLocalDevelopment1,
        totalInsurance1,
        totalTreasury1,
        totalReserve1_1,
        totalReserve2_1,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(eventTx1, "TreeFundedBatch");

      //check daiFund totalBalances treeId1
      let totalBalances = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        Number(totalResearch1),
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        Number(totalLocalDevelopment1),
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances.insurance),
        Number(totalInsurance1),
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances.treasury),
        Number(totalTreasury1),
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve1),
        Number(totalReserve1_1),
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve2),
        Number(totalReserve2_1),
        "reserve2 funds invalid"
      );

      ////------------check planter fund contract balance
      let contractBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(contractBalance),
        Number(Math.Big(totalPlanterShare1).plus(totalAmbassadorShare1)),
        "Contract balance not true"
      );

      // ////--------------------call fund tree by auction(treeId2)----------------

      const eventTx2 = await daiFundsInstance.fundTreeBatch(
        totalPlanterShare2,
        totalAmbassadorShare2,
        totalResearch2,
        totalLocalDevelopment2,
        totalInsurance2,
        totalTreasury2,
        totalReserve1_2,
        totalReserve2_2,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(eventTx2, "TreeFundedBatch");

      // //check daiFund totalBalances treeId2
      let totalBalances2 = await daiFundsInstance.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        Math.add(totalResearch1, totalResearch2),
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        Math.add(totalLocalDevelopment1, totalLocalDevelopment2),
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        Math.add(totalInsurance1, totalInsurance2),
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        Math.add(totalTreasury1, totalTreasury2),
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        Math.add(totalReserve1_1, totalReserve1_2),
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        Math.add(totalReserve2_1, totalReserve2_2),
        "2-reserve2 funds invalid"
      );

      ////------------check planter fund contract balance
      let contractBalance2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(contractBalance2),
        Number(
          Math.Big(totalPlanterShare2)
            .plus(totalAmbassadorShare2)
            .plus(totalPlanterShare1)
            .plus(totalAmbassadorShare1)
        ),
        "2-Contract balance not true"
      );
    });

    it("should transferReferrerDai succussfully and fail in invalid situation", async () => {
      await daiInstance.setMint(
        daiFundsInstance.address,
        await web3.utils.toWei("16")
      );
      await daiFundsInstance.fundTreeBatch(
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        await web3.utils.toWei("2"),
        {
          from: userAccount6,
        }
      );
      const planterFundBalanceBeforeTransfer1 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundBalanceBeforeTransfer1),
        Number(await web3.utils.toWei("4")),
        "planter fund balance is not ok"
      );

      const totalBalancesBeforeTransfer1 =
        await daiFundsInstance.totalBalances.call();

      assert.equal(
        Number(totalBalancesBeforeTransfer1.treasury),
        Number(await web3.utils.toWei("2")),
        "treejer develop is not ok"
      );

      const transferAmount1 = await web3.utils.toWei("1");
      const transferAmount2 = await web3.utils.toWei("0.5");
      const transferAmount3 = await web3.utils.toWei("1");
      const transferAmount4 = await web3.utils.toWei("0.5");

      await daiFundsInstance
        .transferReferrerDai(transferAmount1, { from: dataManager })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await daiFundsInstance.transferReferrerDai(transferAmount1, {
        from: userAccount6,
      });

      const totalBalancesBeforeTransfer2 =
        await daiFundsInstance.totalBalances.call();

      assert.equal(
        Number(totalBalancesBeforeTransfer2.treasury),
        Number(await web3.utils.toWei("1")),
        "treejer develop is not ok"
      );

      const planterFundBalanceBeforeTransfer2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundBalanceBeforeTransfer2),
        Number(await web3.utils.toWei("5")),
        "planter fund balance is not ok"
      );

      await daiFundsInstance.transferReferrerDai(transferAmount2, {
        from: userAccount6,
      });

      const totalBalancesBeforeTransfer3 =
        await daiFundsInstance.totalBalances.call();

      assert.equal(
        Number(totalBalancesBeforeTransfer3.treasury),
        Number(await web3.utils.toWei("0.5")),
        "treejer develop is not ok"
      );

      const planterFundBalanceBeforeTransfer3 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundBalanceBeforeTransfer3),
        Number(await web3.utils.toWei("5.5")),
        "planter fund balance is not ok"
      );

      await daiFundsInstance
        .transferReferrerDai(transferAmount3, {
          from: userAccount6,
        })
        .should.be.rejectedWith(DaiFundsErrorMsg.LIQUDITY_NOT_ENOUGH);

      await daiFundsInstance.transferReferrerDai(transferAmount4, {
        from: userAccount6,
      });

      const totalBalancesAfterTransfer4 =
        await daiFundsInstance.totalBalances.call();

      assert.equal(
        Number(totalBalancesAfterTransfer4.treasury),
        0,
        "treejer develop is not ok"
      );

      const planterFundBalanceAfterTransfer4 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundBalanceAfterTransfer4),
        Number(await web3.utils.toWei("6")),
        "planter fund balance is not ok"
      );
    });
  });
});
