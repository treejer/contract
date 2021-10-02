const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const DaiFund = artifacts.require("DaiFund.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Math = require("./math");

var Dai = artifacts.require("Dai.sol");

const { CommonErrorMsg, DaiFundErrorMsg } = require("./enumes");

const Common = require("./common");

contract("DaiFund", (accounts) => {
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
  let daiFundInstance;
  let allocationInstance;

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

      daiFundInstance = await deployProxy(DaiFund, [arInstance.address], {
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

    it("set daiFundInstance address and fail in invalid situation", async () => {
      /////////////------------------------------------ set Dai Token address ----------------------------------------//
      await daiFundInstance
        .setDaiTokenAddress(daiInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setDaiTokenAddress(zeroAddress, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.daiToken.call(),
        daiInstance.address,
        "Set dai contract address not true"
      );
      /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//
      await daiFundInstance
        .setPlanterFundContractAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await daiFundInstance.planterFundContract.call(),
        planterFundsInstnce.address,
        "Set planter fund contract address not true"
      );
      //-------------------------------setResearchAddress test-------------------------------------------------------
      let researchAddress = userAccount4;

      await daiFundInstance.setResearchAddress(researchAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.researchAddress(),
        researchAddress,
        "Set researchAddress address not true"
      );

      //------------------------setResearchAddress should be fail (invalid access)---------------------------------
      researchAddress = userAccount4;

      await daiFundInstance
        .setResearchAddress(researchAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setResearchAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------setLocalDevelopmentAddress should be fail (invalid access)----------------------------
      let localDevelopmentAddress = userAccount4;

      await daiFundInstance
        .setLocalDevelopmentAddress(localDevelopmentAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setLocalDevelopmentAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------setLocalDevelopmentAddress test-------------------------------------------------------
      localDevelopmentAddress = userAccount4;

      await daiFundInstance.setLocalDevelopmentAddress(
        localDevelopmentAddress,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await daiFundInstance.localDevelopmentAddress(),
        localDevelopmentAddress,
        "Set localDevelopmentAddress address not true"
      );

      //-----------------------------setInsuranceAddress should be fail (invalid access)---------------------------------
      let insuranceAddress = userAccount4;

      await daiFundInstance
        .setInsuranceAddress(insuranceAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setInsuranceAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-----------------------------setInsuranceAddress should be success---------------------------------
      insuranceAddress = userAccount4;

      await daiFundInstance.setInsuranceAddress(insuranceAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.insuranceAddress(),
        insuranceAddress,
        "Set insuranceAddress address not true"
      );

      //--------------------------setTreasuryAddress should be fail (invalid access)--------------------

      let treasuryAddress = userAccount4;

      await daiFundInstance
        .setTreasuryAddress(treasuryAddress, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setTreasuryAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //--------------------------setTreasuryAddress should be success--------------------

      treasuryAddress = userAccount4;

      await daiFundInstance.setTreasuryAddress(treasuryAddress, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.treasuryAddress(),
        treasuryAddress,
        "Set treasuryAddress address not true"
      );

      //-------------------setReserve1Address should be fail (invalid access)-------------------
      let reserve1Address = userAccount4;

      await daiFundInstance
        .setReserve1Address(reserve1Address, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setReserve1Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
      //--------------------------------setReserve1Address should be success-----------------------
      reserve1Address = userAccount4;

      await daiFundInstance.setReserve1Address(reserve1Address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.reserve1Address(),
        reserve1Address,
        "Set reserve1Address address not true"
      );
      //----------------------------------------setReserve2Address should be fail (invalid access)-----------------------------------
      let reserve2Address = userAccount4;

      await daiFundInstance
        .setReserve2Address(reserve2Address, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .setReserve2Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //-------------------------------------setReserve2Address should be success------------------------------------------------
      reserve2Address = userAccount4;

      await daiFundInstance.setReserve2Address(reserve2Address, {
        from: deployerAccount,
      });

      assert.equal(
        await daiFundInstance.reserve2Address(),
        reserve2Address,
        "Set reserve2Address address not true"
      );
    });
  });

  describe("with financial section", () => {
    beforeEach(async () => {
      /////////////---------------------- deploy contracts ------------------- //////////////

      daiFundInstance = await deployProxy(DaiFund, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
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
      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
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
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      ////--------------add and assign AllocationData for tree
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

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      const eventTx = await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount3 }
      );

      let expected = {
        planterAmount: (planterShare * amount) / 10000,
        ambassadorAmount: (ambassadorShare * amount) / 10000,
        research: (researchShare * amount) / 10000,
        localDevelopment: (localDevelopmentShare * amount) / 10000,
        insurance: (insuranceShare * amount) / 10000,
        treasury: (treasuryShare * amount) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      truffleAssert.eventEmitted(eventTx, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId &&
          Number(ev.amount) == Number(amount) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected.planterAmount),
              Number(expected.ambassadorAmount)
            )
        );
      });

      let daiFundBalance = await daiInstance.balanceOf(daiFundInstance.address);

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
        Math.add(expected.planterAmount, expected.ambassadorAmount)
      );

      //check daiFund totalBalances
      let totalBalancesDaiFund = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalancesDaiFund.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      // check treeToPlanterProjectedEarning and treeToAmbassadorProjectedEarning in planterFunds

      let pAmount =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(treeId);
      let aAmount =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(treeId);

      assert.equal(
        Number(pAmount),
        expected.planterAmount,
        "planter funds invalid"
      );

      assert.equal(
        Number(aAmount),
        expected.ambassadorAmount,
        "ambassador funds invalid"
      );

      //check fund planter totalBalances

      let totalBalancesPlanterFund =
        await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(totalBalancesPlanterFund.planter),
        expected.planterAmount,
        "planter funds invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFund.ambassador),
        expected.ambassadorAmount,
        "ambassador funds invalid"
      );
    });
    it("Should fundTree work successfully for 2 tree fund", async () => {
      const treeId1 = 1;
      const treeId2 = 15;
      let amount1 = web3.utils.toWei("1", "Ether");
      let amount2 = web3.utils.toWei("0.5", "Ether");

      const planter1Share = 4000;
      const ambassador1Share = 2000;
      const research1Share = 1000;
      const localDevelopment1Share = 1000;
      const insurance1Share = 1000;
      const treasury1Share = 1000;
      const reserve1Share_1 = 0;
      const reserve2Share_1 = 0;

      const planter2Share = 4000;
      const ambassador2Share = 2000;
      const research2Share = 1000;
      const localDevelopment2Share = 1000;
      const insurance2Share = 1000;
      const treasury2Share = 1000;
      const reserve1Share_2 = 0;
      const reserve2Share_2 = 0;

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      ////--------------add and assign allocation data for tree
      await allocationInstance.addAllocationData(
        planter1Share,
        ambassador1Share,
        research1Share,
        localDevelopment1Share,
        insurance1Share,
        treasury1Share,
        reserve1Share_1,
        reserve2Share_1,
        {
          from: dataManager,
        }
      );

      await allocationInstance.addAllocationData(
        planter2Share,
        ambassador2Share,
        research2Share,
        localDevelopment2Share,
        insurance2Share,
        treasury2Share,
        reserve1Share_2,
        reserve2Share_2,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      await allocationInstance.assignAllocationToTree(11, 20, 1, {
        from: dataManager,
      });

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount1);
      await daiInstance.setMint(daiFundInstance.address, amount2);

      ////--------------------call fund tree by auction----------------
      const eventTx1 = await daiFundInstance.fundTree(
        treeId1,
        amount1,
        planter1Share,
        ambassador1Share,
        research1Share,
        localDevelopment1Share,
        insurance1Share,
        treasury1Share,
        reserve1Share_1,
        reserve2Share_1,
        { from: userAccount3 }
      );

      const eventTx2 = await daiFundInstance.fundTree(
        treeId2,
        amount2,
        planter2Share,
        ambassador2Share,
        research2Share,
        localDevelopment2Share,
        insurance2Share,
        treasury2Share,
        reserve1Share_2,
        reserve2Share_2,
        { from: userAccount3 }
      );

      let expected1 = {
        planterAmount: (planter1Share * amount1) / 10000,
        ambassadorAmount: (ambassador1Share * amount1) / 10000,
        research: (research1Share * amount1) / 10000,
        localDevelopment: (localDevelopment1Share * amount1) / 10000,
        insurance: (insurance1Share * amount1) / 10000,
        treasury: (treasury1Share * amount1) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      let expected2 = {
        planterAmount: (planter2Share * amount2) / 10000,
        ambassadorAmount: (ambassador2Share * amount2) / 10000,
        research: (research2Share * amount2) / 10000,
        localDevelopment: (localDevelopment2Share * amount2) / 10000,
        insurance: (insurance2Share * amount2) / 10000,
        treasury: (treasury2Share * amount2) / 10000,
        reserve1: 0,
        reserve2: 0,
      };

      truffleAssert.eventEmitted(eventTx1, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId1 &&
          Number(ev.amount) == Number(amount1) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected1.planterAmount),
              Number(expected1.ambassadorAmount)
            )
        );
      });

      truffleAssert.eventEmitted(eventTx2, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId2 &&
          Number(ev.amount) == Number(amount2) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected2.planterAmount),
              Number(expected2.ambassadorAmount)
            )
        );
      });

      let daiFundBalance = await daiInstance.balanceOf(daiFundInstance.address);

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
          expected1.planterAmount,
          expected1.ambassadorAmount,
          expected2.planterAmount,
          expected2.ambassadorAmount
        ),
        "planterShare balance is not correct"
      );

      //check daiFund totalBalances
      let totalBalancesDaiFund = await daiFundInstance.totalBalances();

      assert.equal(
        Number(totalBalancesDaiFund.research),
        Math.add(expected1.research, expected2.research),
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.localDevelopment),
        Math.add(expected1.localDevelopment, expected2.localDevelopment),
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.insurance),
        Math.add(expected1.insurance, expected2.insurance),
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.treasury),
        Math.add(expected1.treasury, expected2.treasury),
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.reserve1),
        Math.add(expected1.reserve1, expected2.reserve1),
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesDaiFund.reserve2),
        Math.add(expected1.reserve2, expected2.reserve2),
        "reserve2 funds invalid"
      );

      // check planterShare and ambassadorShare in planterFund

      let pAmount1 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(treeId1);
      let aAmount1 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(
          treeId1
        );
      let pAmount2 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(treeId2);
      let aAmount2 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(
          treeId2
        );

      assert.equal(
        Number(pAmount1),
        expected1.planterAmount,
        "planter funds invalid"
      );

      assert.equal(
        Number(aAmount1),
        expected1.ambassadorAmount,
        "ambassador funds invalid"
      );

      assert.equal(
        Number(pAmount2),
        expected2.planterAmount,
        "planter funds invalid"
      );

      assert.equal(
        Number(aAmount2),
        expected2.ambassadorAmount,
        "ambassador funds invalid"
      );

      //check fund planter totalBalances

      let totalBalancesPlanterFund =
        await planterFundsInstnce.totalBalances.call();

      assert.equal(
        Number(totalBalancesPlanterFund.planter),
        Math.add(expected1.planterAmount, expected2.planterAmount),
        "planter funds invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFund.ambassador),
        Math.add(expected1.ambassadorAmount, expected2.ambassadorAmount),
        "ambassador funds invalid"
      );
    });

    it("check withdraw errors from accounts", async () => {
      ////----------------------should fail research withdraw
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 3000;
      const ambassadorShare = 1000;
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 1000;
      const reserve2Share = 1000;

      ///////////--------------------- add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      //////-------------------- handle allocation data

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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      //////////--------------- fund tree -------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      await daiFundInstance.setResearchAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawResearchBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawResearchBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawResearchBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawResearchBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawResearchBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail local development withdraw------------------/////

      await daiFundInstance.setLocalDevelopmentAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("3"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawLocalDevelopmentBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail insurance fund withdraw------------------/////

      await daiFundInstance.setInsuranceAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawInsuranceBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawInsuranceBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawInsuranceBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail treejer develop withdraw------------------/////

      await daiFundInstance.setTreasuryAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawTreasuryBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawTreasuryBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawTreasuryBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail reserve fund1 withdraw------------------/////

      await daiFundInstance.setReserve1Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawReserve1Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawReserve1Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawReserve1Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawReserve1Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawReserve1Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //
      //

      /////////////-------------------------------------should fail reserve fund2 withdraw------------------/////
      await daiFundInstance.setReserve2Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance
        .withdrawReserve2Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await daiFundInstance
        .withdrawReserve2Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      await daiFundInstance
        .withdrawReserve2Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);

      //////////////// ------------------ withdraw  some balance and then try to withdraw
      await daiFundInstance.withdrawReserve2Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        {
          from: deployerAccount,
        }
      );

      ////////////------------- should fail
      await daiFundInstance
        .withdrawReserve2Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(DaiFundErrorMsg.INSUFFICIENT_AMOUNT);
    });

    it("should withdraw address succussfully", async () => {
      ///-------------------------------- should withdraw local development succussfully ---------------------------------------
      const treeId = 1;
      const amount = web3.utils.toWei("2");
      const planterShare = 3000;
      const ambassadorShare = 500;
      const researchShare = 2000;
      const localDevelopmentShare = 500;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 1000;
      const reserve2Share = 1000;

      //////// -------------------- add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      ////////////------------------- set addresses

      await daiFundInstance.setLocalDevelopmentAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance.setResearchAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance.setInsuranceAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance.setTreasuryAddress(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance.setReserve1Address(userAccount3, {
        from: deployerAccount,
      });

      await daiFundInstance.setReserve2Address(userAccount3, {
        from: deployerAccount,
      });

      ////////------------------- handle allocation data

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

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawLocalDevelopmentBalance(
        web3.utils.toWei("0.05"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///
      ///

      ////-------------------------------------- should withdraw insurance fund succussfully -----------------------------------------

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawInsuranceBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw treejer develop succussfully -----------------------------------------

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawTreasuryBalance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw reserve fund1 succussfully -----------------------------------------

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawReserve1Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw reserve fund2 succussfully -----------------------------------------

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawReserve2Balance(
        web3.utils.toWei("0.2"),
        "reason to withdraw",
        { from: deployerAccount }
      );

      ///

      ///

      ////-------------------------------------- should withdraw Research succussfully -----------------------------------------

      ////---------------transfer dai for daiFundInstance-------------------
      await daiInstance.setMint(daiFundInstance.address, amount);

      ////--------------------call fund tree by auction----------------
      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        { from: userAccount6 }
      );
      /////////// ------------withdraw balance

      await daiFundInstance.withdrawResearchBalance(
        web3.utils.toWei("0.4"),
        "reason to withdraw",
        { from: deployerAccount }
      );
    });

    //------------------------------------------withdraw research balance -------------------------------------/

    it("check withdraw research data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("3");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 2000;
      const localDevelopmentShare = 500;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;
      const researchAddress = userAccount3;

      const totalResearchFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), researchShare),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setResearchAddress(researchAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalResearchFunded,
        Number(totalBalances1.research),
        "research total fund1 is not ok"
      );

      const researchBalnance1 = await daiInstance.balanceOf(researchAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.2");

      const tx = await daiFundInstance.withdrawResearchBalance(
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
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "research total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(researchBalnance2),
        Math.add(Number(researchBalnance1), Number(withdrawBalance1)),
        "research account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.3");

      const tx2 = await daiFundInstance.withdrawResearchBalance(
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

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "research total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalResearchFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.research),
        "research total fund3 is not ok"
      );

      assert.equal(
        Number(researchBalnance3),
        Math.add(Number(researchBalnance2), Number(withdrawBalance2)),
        "research account balance is not ok after withdraw2"
      );
    });

    /////////// --------------------------------------------------------------------withdraw local development balance ----------------------------------------------------------------
    it("check withdraw local development data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1500;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;
      const localDevelopmentAddress = userAccount3;

      const totalLocalDevelopmentFunded = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          localDevelopmentShare
        ),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setLocalDevelopmentAddress(
        localDevelopmentAddress,
        {
          from: deployerAccount,
        }
      );

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalLocalDevelopmentFunded,
        Number(totalBalances1.localDevelopment),
        "local development total fund1 is not ok"
      );

      const localDevelopmentBalnance1 = await daiInstance.balanceOf(
        localDevelopmentAddress
      );

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundInstance.withdrawLocalDevelopmentBalance(
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
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "local development total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(localDevelopmentBalnance2),
        Math.add(Number(localDevelopmentBalnance1), Number(withdrawBalance1)),
        "local development account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundInstance.withdrawLocalDevelopmentBalance(
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

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "local development total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalLocalDevelopmentFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.localDevelopment),
        "local development total fund3 is not ok"
      );

      assert.equal(
        Number(localDevelopmentBalnance3),
        Math.add(Number(localDevelopmentBalnance2), Number(withdrawBalance2)),
        "local development account balance is not ok after withdraw2"
      );
    });

    ///// ---------------------------------------------------------------------withdraw insurance fund balance ---------------------------------------------------------------
    it("check withdraw insurance fund data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1000;
      const localDevelopmentShare = 1500;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      const insuranceAddress = userAccount3;

      const totalInsuranceFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), insuranceShare),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setInsuranceAddress(insuranceAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        daiFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalInsuranceFunded,
        Number(totalBalances1.insurance),
        "insurance fund total fund1 is not ok"
      );

      const insuranceBalnance1 = await daiInstance.balanceOf(insuranceAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await daiFundInstance.withdrawInsuranceBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx, "InsuranceBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == insuranceAddress &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "insurance fund total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(insuranceBalnance2),
        Math.add(Number(insuranceBalnance1), Number(withdrawBalance1)),
        "insurance fund account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await daiFundInstance.withdrawInsuranceBalance(
        withdrawBalance2,
        "reason to withdraw",
        { from: deployerAccount }
      );

      truffleAssert.eventEmitted(tx2, "InsuranceBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance2) &&
          ev.account == insuranceAddress &&
          ev.reason == withdrawReason
        );
      });

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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
        "insurance fund total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalInsuranceFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.insurance),
        "insurance fund total fund3 is not ok"
      );

      assert.equal(
        Number(insuranceBalnance3),
        Math.add(Number(insuranceBalnance2), Number(withdrawBalance2)),
        "insurance fund account balance is not ok after withdraw2"
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
      const researchShare = 1000;
      const localDevelopmentShare = 1500;
      const insuranceShare = 1000;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      const treasuryAddress = userAccount3;

      const totalTreasuryFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), treasuryShare),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setTreasuryAddress(treasuryAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

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

      const tx = await daiFundInstance.withdrawTreasuryBalance(
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
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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

      const tx2 = await daiFundInstance.withdrawTreasuryBalance(
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

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
      const treasuryShare = 0;
      const reserve1Share = 1000;
      const reserve2Share = 0;

      const reserve1Address = userAccount3;

      const totalReserve1Funded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), reserve1Share),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setReserve1Address(reserve1Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

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

      const tx = await daiFundInstance.withdrawReserve1Balance(
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
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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

      const tx2 = await daiFundInstance.withdrawReserve1Balance(
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

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
      const treasuryShare = 0;
      const reserve1Share = 0;
      const reserve2Share = 1000;

      const reserve2Address = userAccount3;

      const totalReserve2Funded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), reserve2Share),
        10000
      );

      const daiFundContractShare = Math.divide(
        Math.mul(
          Math.add(Number(amount), Number(amount1)),
          Math.add(
            researchShare,
            localDevelopmentShare,
            insuranceShare,
            treasuryShare,
            reserve1Share,
            reserve2Share
          )
        ),
        10000
      );

      ///////----------------------add roles

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await daiFundInstance.setReserve2Address(reserve2Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle allocation data
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

      //////////---------------transfer dai for daiFundInstance-------------------

      await daiInstance.setMint(daiFundInstance.address, amount);

      await daiInstance.setMint(daiFundInstance.address, amount1);

      ////////---------------fund trees-------------------

      await daiFundInstance.fundTree(
        treeId,
        amount,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );
      await daiFundInstance.fundTree(
        treeId2,
        amount1,
        planterShare,
        ambassadorShare,
        researchShare,
        localDevelopmentShare,
        insuranceShare,
        treasuryShare,
        reserve1Share,
        reserve2Share,
        {
          from: userAccount6,
        }
      );

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await daiInstance.balanceOf(
        daiFundInstance.address
      );

      const totalBalances1 = await daiFundInstance.totalBalances();

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

      const tx = await daiFundInstance.withdrawReserve2Balance(
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
      const totalBalances2 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
        daiFundInstance.address
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

      const tx2 = await daiFundInstance.withdrawReserve2Balance(
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

      const totalBalances3 = await daiFundInstance.totalBalances();

      const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
        daiFundInstance.address
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

      const totalPlanterAmount1 = web3.utils.toWei("5");
      const totalAmbassadorAmount1 = web3.utils.toWei("4");
      const totalResearch1 = web3.utils.toWei("2");
      const totalLocalDevelopment1 = web3.utils.toWei("1");
      const totalInsurance1 = web3.utils.toWei("2");
      const totalTreasury1 = web3.utils.toWei("2");
      const totalReserve1_1 = web3.utils.toWei("2.5");
      const totalReserve2_1 = web3.utils.toWei("1");
      const total1 = web3.utils.toWei("19.5"); //total amount of above shares

      const totalPlanterAmount2 = web3.utils.toWei("7");
      const totalAmbassadorAmount2 = web3.utils.toWei("2");
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
        daiFundInstance.address,
        deployerAccount
      );

      ////---------------transfer dai for daiFund-------------------
      await daiInstance.setMint(daiFundInstance.address, total1);
      await daiInstance.setMint(daiFundInstance.address, total2);

      ////--------------------call fund tree by auction----------------

      const eventTx1 = await daiFundInstance.fundTreeBatch(
        totalPlanterAmount1,
        totalAmbassadorAmount1,
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
      let totalBalances = await daiFundInstance.totalBalances();

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
        Number(Math.Big(totalPlanterAmount1).plus(totalAmbassadorAmount1)),
        "Contract balance not true"
      );

      // ////--------------------call fund tree by auction(treeId2)----------------

      const eventTx2 = await daiFundInstance.fundTreeBatch(
        totalPlanterAmount2,
        totalAmbassadorAmount2,
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
      let totalBalances2 = await daiFundInstance.totalBalances();

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
          Math.Big(totalPlanterAmount2)
            .plus(totalAmbassadorAmount2)
            .plus(totalPlanterAmount1)
            .plus(totalAmbassadorAmount1)
        ),
        "2-Contract balance not true"
      );
    });

    it("should transferReferrerDai succussfully and fail in invalid situation", async () => {
      await daiInstance.setMint(
        daiFundInstance.address,
        await web3.utils.toWei("16")
      );
      await daiFundInstance.fundTreeBatch(
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
        await daiFundInstance.totalBalances.call();

      assert.equal(
        Number(totalBalancesBeforeTransfer1.treasury),
        Number(await web3.utils.toWei("2")),
        "treejer develop is not ok"
      );

      const transferAmount1 = await web3.utils.toWei("1");
      const transferAmount2 = await web3.utils.toWei("0.5");
      const transferAmount3 = await web3.utils.toWei("1");
      const transferAmount4 = await web3.utils.toWei("0.5");

      await daiFundInstance
        .transferReferrerDai(transferAmount1, { from: dataManager })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await daiFundInstance.transferReferrerDai(transferAmount1, {
        from: userAccount6,
      });

      const totalBalancesBeforeTransfer2 =
        await daiFundInstance.totalBalances.call();

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

      await daiFundInstance.transferReferrerDai(transferAmount2, {
        from: userAccount6,
      });

      const totalBalancesBeforeTransfer3 =
        await daiFundInstance.totalBalances.call();

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

      await daiFundInstance
        .transferReferrerDai(transferAmount3, {
          from: userAccount6,
        })
        .should.be.rejectedWith(DaiFundErrorMsg.LIQUDITY_NOT_ENOUGH);

      await daiFundInstance.transferReferrerDai(transferAmount4, {
        from: userAccount6,
      });

      const totalBalancesAfterTransfer4 =
        await daiFundInstance.totalBalances.call();

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
