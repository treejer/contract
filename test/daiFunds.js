const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const DaiFunds = artifacts.require("DaiFunds.sol");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
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

  beforeEach(async () => {
    /////////////---------------------- deploy contracts ------------------- //////////////

    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    daiFundsInstance = await deployProxy(DaiFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    fModel = await deployProxy(FinancialModel, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterFundsInstnce = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

    /////////////---------------------- set address ------------------- //////////////
    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await daiFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      { from: deployerAccount }
    );

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  /////////////------------------------------------ set Dai Token address ----------------------------------------//

  it("set dai token address", async () => {
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
  });

  /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//
  it("set planter fund address", async () => {
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
  });

  //-------------------------------setTreeResearchAddress test-------------------------------------------------------
  it("setTreeResearchAddress should be success", async () => {
    let treeResearchAddress = userAccount4;

    await daiFundsInstance.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.treeResearchAddress(),
      treeResearchAddress,
      "Set treeResearchAddress address not true"
    );
  });

  it("setTreeResearchAddress should be fail (invalid access)", async () => {
    let treeResearchAddress = userAccount4;

    await daiFundsInstance
      .setTreeResearchAddress(treeResearchAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setTreeResearchAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  //-------------------------------setLocalDevelopAddress test-------------------------------------------------------
  it("setLocalDevelopAddress should be success", async () => {
    let localDevelopAddress = userAccount4;

    await daiFundsInstance.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.localDevelopAddress(),
      localDevelopAddress,
      "Set localDevelopAddress address not true"
    );
  });

  it("setLocalDevelopAddress should be fail (invalid access)", async () => {
    let localDevelopAddress = userAccount4;

    await daiFundsInstance
      .setLocalDevelopAddress(localDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setLocalDevelopAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  //-------------------------------setRescueFundAddress test-------------------------------------------------------
  it("setRescueFundAddress should be success", async () => {
    let rescueFundAddress = userAccount4;

    await daiFundsInstance.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.rescueFundAddress(),
      rescueFundAddress,
      "Set rescueFundAddress address not true"
    );
  });

  it("setRescueFundAddress should be fail (invalid access)", async () => {
    let rescueFundAddress = userAccount4;

    await daiFundsInstance
      .setRescueFundAddress(rescueFundAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setRescueFundAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  //-------------------------------setTreejerDevelopAddress test-------------------------------------------------------
  it("setTreejerDevelopAddress should be success", async () => {
    let treejerDevelopAddress = userAccount4;

    await daiFundsInstance.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.treejerDevelopAddress(),
      treejerDevelopAddress,
      "Set treejerDevelopAddress address not true"
    );
  });

  it("setTreejerDevelopAddress should be fail (invalid access)", async () => {
    let treejerDevelopAddress = userAccount4;

    await daiFundsInstance
      .setTreejerDevelopAddress(treejerDevelopAddress, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setTreejerDevelopAddress(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  //-------------------------------setReserveFund1Address test-------------------------------------------------------
  it("setReserveFund1Address should be success", async () => {
    let reserveFundAddress1 = userAccount4;

    await daiFundsInstance.setReserveFund1Address(reserveFundAddress1, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.reserveFundAddress1(),
      reserveFundAddress1,
      "Set reserveFundAddress1 address not true"
    );
  });

  it("setReserveFund1Address should be fail (invalid access)", async () => {
    let reserveFundAddress1 = userAccount4;

    await daiFundsInstance
      .setReserveFund1Address(reserveFundAddress1, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setReserveFund1Address(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  //-------------------------------setReserveFund2Address test-------------------------------------------------------
  it("setReserveFund2Address should be success", async () => {
    let reserveFundAddress2 = userAccount4;

    await daiFundsInstance.setReserveFund2Address(reserveFundAddress2, {
      from: deployerAccount,
    });

    assert.equal(
      await daiFundsInstance.reserveFundAddress2(),
      reserveFundAddress2,
      "Set reserveFundAddress2 address not true"
    );
  });

  it("setReserveFund2Address should be fail (invalid access)", async () => {
    let reserveFundAddress2 = userAccount4;

    await daiFundsInstance
      .setReserveFund2Address(reserveFundAddress2, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .setReserveFund2Address(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);
  });

  /////////////------------------------------------ fundTree function test ----------------------------------------//

  it("Should fundTree work successfully for 1 tree fund", async () => {
    const treeId = 1;
    let amount = web3.utils.toWei("1", "Ether");

    const planterFund = 4000;
    const referralFund = 2000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

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
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    const eventTx = await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount3 }
    );

    let expected = {
      planterFund: (planterFund * amount) / 10000,
      referralFund: (referralFund * amount) / 10000,
      treeResearch: (treeResearch * amount) / 10000,
      localDevelop: (localDevelop * amount) / 10000,
      rescueFund: (rescueFund * amount) / 10000,
      treejerDevelop: (treejerDevelop * amount) / 10000,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    truffleAssert.eventEmitted(eventTx, "TreeFunded", (ev) => {
      return (
        Number(ev.treeId) == treeId &&
        Number(ev.amount) == Number(amount) &&
        Number(ev.planterPart) ==
          Math.add(Number(expected.planterFund), Number(expected.referralFund))
      );
    });

    let daiFundBalance = await daiInstance.balanceOf(daiFundsInstance.address);

    const planterFundBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(daiFundBalance),
      Math.add(
        expected.localDevelop,
        expected.rescueFund,
        expected.reserveFund1,
        expected.reserveFund1,
        expected.reserveFund2,
        expected.treeResearch,
        expected.treejerDevelop
      )
    );

    assert.equal(
      Number(planterFundBalance),
      Math.add(expected.planterFund, expected.referralFund)
    );

    //check daiFund totalFunds
    let totalFundsDaiFunds = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(totalFundsDaiFunds.treeResearch),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.localDevelop),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.rescueFund),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.treejerDevelop),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.reserveFund1),
      expected.reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.reserveFund2),
      expected.reserveFund2,
      "reserveFund2 funds invalid"
    );

    // check planterFunds and referralFunds in planterFund

    let pFund = await planterFundsInstnce.planterFunds.call(treeId);
    let rFund = await planterFundsInstnce.referralFunds.call(treeId);

    assert.equal(Number(pFund), expected.planterFund, "planter funds invalid");

    assert.equal(
      Number(rFund),
      expected.referralFund,
      "referral funds invalid"
    );

    //check fund planter totalFunds

    let totalFundsPlanterFund = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(totalFundsPlanterFund.planterFund),
      expected.planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFund.referralFund),
      expected.referralFund,
      "referral funds invalid"
    );
  });
  it("Should fundTree work successfully for 2 tree fund", async () => {
    const treeId1 = 1;
    const treeId2 = 15;
    let amount1 = web3.utils.toWei("1", "Ether");
    let amount2 = web3.utils.toWei("0.5", "Ether");

    const planterFund1 = 4000;
    const referralFund1 = 2000;
    const treeResearch1 = 1000;
    const localDevelop1 = 1000;
    const rescueFund1 = 1000;
    const treejerDevelop1 = 1000;
    const reserveFund1_1 = 0;
    const reserveFund2_1 = 0;

    const planterFund2 = 4000;
    const referralFund2 = 2000;
    const treeResearch2 = 1000;
    const localDevelop2 = 1000;
    const rescueFund2 = 1000;
    const treejerDevelop2 = 1000;
    const reserveFund1_2 = 0;
    const reserveFund2_2 = 0;

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
    await fModel.addFundDistributionModel(
      planterFund1,
      referralFund1,
      treeResearch1,
      localDevelop1,
      rescueFund1,
      treejerDevelop1,
      reserveFund1_1,
      reserveFund2_1,
      {
        from: dataManager,
      }
    );

    await fModel.addFundDistributionModel(
      planterFund2,
      referralFund2,
      treeResearch2,
      localDevelop2,
      rescueFund2,
      treejerDevelop2,
      reserveFund1_2,
      reserveFund2_2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    await fModel.assignTreeFundDistributionModel(11, 20, 1, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount1);
    await daiInstance.setMint(daiFundsInstance.address, amount2);

    ////--------------------call fund tree by auction----------------
    const eventTx1 = await daiFundsInstance.fundTree(
      treeId1,
      amount1,
      planterFund1,
      referralFund1,
      treeResearch1,
      localDevelop1,
      rescueFund1,
      treejerDevelop1,
      reserveFund1_1,
      reserveFund2_1,
      { from: userAccount3 }
    );

    const eventTx2 = await daiFundsInstance.fundTree(
      treeId2,
      amount2,
      planterFund2,
      referralFund2,
      treeResearch2,
      localDevelop2,
      rescueFund2,
      treejerDevelop2,
      reserveFund1_2,
      reserveFund2_2,
      { from: userAccount3 }
    );

    let expected1 = {
      planterFund: (planterFund1 * amount1) / 10000,
      referralFund: (referralFund1 * amount1) / 10000,
      treeResearch: (treeResearch1 * amount1) / 10000,
      localDevelop: (localDevelop1 * amount1) / 10000,
      rescueFund: (rescueFund1 * amount1) / 10000,
      treejerDevelop: (treejerDevelop1 * amount1) / 10000,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    let expected2 = {
      planterFund: (planterFund2 * amount2) / 10000,
      referralFund: (referralFund2 * amount2) / 10000,
      treeResearch: (treeResearch2 * amount2) / 10000,
      localDevelop: (localDevelop2 * amount2) / 10000,
      rescueFund: (rescueFund2 * amount2) / 10000,
      treejerDevelop: (treejerDevelop2 * amount2) / 10000,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    truffleAssert.eventEmitted(eventTx1, "TreeFunded", (ev) => {
      return (
        Number(ev.treeId) == treeId1 &&
        Number(ev.amount) == Number(amount1) &&
        Number(ev.planterPart) ==
          Math.add(
            Number(expected1.planterFund),
            Number(expected1.referralFund)
          )
      );
    });

    truffleAssert.eventEmitted(eventTx2, "TreeFunded", (ev) => {
      return (
        Number(ev.treeId) == treeId2 &&
        Number(ev.amount) == Number(amount2) &&
        Number(ev.planterPart) ==
          Math.add(
            Number(expected2.planterFund),
            Number(expected2.referralFund)
          )
      );
    });

    let daiFundBalance = await daiInstance.balanceOf(daiFundsInstance.address);

    const planterFundBalance = await daiInstance.balanceOf(
      planterFundsInstnce.address
    );

    assert.equal(
      Number(daiFundBalance),
      Math.add(
        expected1.localDevelop,
        expected1.rescueFund,
        expected1.reserveFund1,
        expected1.reserveFund1,
        expected1.reserveFund2,
        expected1.treeResearch,
        expected1.treejerDevelop,
        expected2.localDevelop,
        expected2.rescueFund,
        expected2.reserveFund1,
        expected2.reserveFund1,
        expected2.reserveFund2,
        expected2.treeResearch,
        expected2.treejerDevelop
      ),
      "daiFund balance is not correct"
    );

    assert.equal(
      Number(planterFundBalance),
      Math.add(
        expected1.planterFund,
        expected1.referralFund,
        expected2.planterFund,
        expected2.referralFund
      ),
      "planterFund balance is not correct"
    );

    //check daiFund totalFunds
    let totalFundsDaiFunds = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(totalFundsDaiFunds.treeResearch),
      Math.add(expected1.treeResearch, expected2.treeResearch),
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.localDevelop),
      Math.add(expected1.localDevelop, expected2.localDevelop),
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.rescueFund),
      Math.add(expected1.rescueFund, expected2.rescueFund),
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.treejerDevelop),
      Math.add(expected1.treejerDevelop, expected2.treejerDevelop),
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.reserveFund1),
      Math.add(expected1.reserveFund1, expected2.reserveFund1),
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFundsDaiFunds.reserveFund2),
      Math.add(expected1.reserveFund2, expected2.reserveFund2),
      "reserveFund2 funds invalid"
    );

    // check planterFunds and referralFunds in planterFund

    let pFund1 = await planterFundsInstnce.planterFunds.call(treeId1);
    let rFund1 = await planterFundsInstnce.referralFunds.call(treeId1);
    let pFund2 = await planterFundsInstnce.planterFunds.call(treeId2);
    let rFund2 = await planterFundsInstnce.referralFunds.call(treeId2);

    assert.equal(
      Number(pFund1),
      expected1.planterFund,
      "planter funds invalid"
    );

    assert.equal(
      Number(rFund1),
      expected1.referralFund,
      "referral funds invalid"
    );

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

    //check fund planter totalFunds

    let totalFundsPlanterFund = await planterFundsInstnce.totalFunds.call();

    assert.equal(
      Number(totalFundsPlanterFund.planterFund),
      Math.add(expected1.planterFund, expected2.planterFund),
      "planter funds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFund.referralFund),
      Math.add(expected1.referralFund, expected2.referralFund),
      "referral funds invalid"
    );
  });

  //------------------------------------------withdraw tree research balance -------------------------------------/
  it("should withdraw tree research succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawTreeResearch(
      web3.utils.toWei("0.4"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw tree research data to be ok", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;
    const treeResearchAddress = userAccount3;

    const totalTreeResearchFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treeResearch),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setTreeResearchAddress(treeResearchAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalTreeResearchFunded,
      Number(totalFunds1.treeResearch),
      "tree research total fund1 is not ok"
    );

    const treeResearchBalnance1 = await daiInstance.balanceOf(
      treeResearchAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.2");

    const tx = await daiFundsInstance.withdrawTreeResearch(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == treeResearchAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const treeResearchBalnance2 = await daiInstance.balanceOf(
      treeResearchAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treeResearch),
        Number(totalFunds2.treeResearch)
      ),
      Number(withdrawBalance1),
      "tree research total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(treeResearchBalnance2),
      Math.add(Number(treeResearchBalnance1), Number(withdrawBalance1)),
      "tree research account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.3");

    const tx2 = await daiFundsInstance.withdrawTreeResearch(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "TreeResearchBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == treeResearchAddress &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const treeResearchBalnance3 = await daiInstance.balanceOf(
      treeResearchAddress
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
        Number(totalFunds1.treeResearch),
        Number(totalFunds3.treeResearch)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "tree research total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalTreeResearchFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.treeResearch),
      "tree research total fund3 is not ok"
    );

    assert.equal(
      Number(treeResearchBalnance3),
      Math.add(Number(treeResearchBalnance2), Number(withdrawBalance2)),
      "tree research account balance is not ok after withdraw2"
    );
  });

  it("should fail tree research withdraw", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setTreeResearchAddress(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawTreeResearch(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawTreeResearch(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawTreeResearch(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawTreeResearch(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawTreeResearch(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });

  /////////// --------------------------------------------------------------------withdraw local develop balance ----------------------------------------------------------------
  it("should withdraw local develop succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 500;
    const treeResearch = 2000;
    const localDevelop = 500;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.05"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw local develop data to be ok", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;
    const localDevelopAddress = userAccount3;

    const totalLocalDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), localDevelop),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setLocalDevelopAddress(localDevelopAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalLocalDevelopFunded,
      Number(totalFunds1.localDevelop),
      "local develop total fund1 is not ok"
    );

    const localDevelopBalnance1 = await daiInstance.balanceOf(
      localDevelopAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await daiFundsInstance.withdrawLocalDevelop(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == localDevelopAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const localDevelopBalnance2 = await daiInstance.balanceOf(
      localDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.localDevelop),
        Number(totalFunds2.localDevelop)
      ),
      Number(withdrawBalance1),
      "local develop total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(localDevelopBalnance2),
      Math.add(Number(localDevelopBalnance1), Number(withdrawBalance1)),
      "local develop account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await daiFundsInstance.withdrawLocalDevelop(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "LocalDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == localDevelopAddress &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const localDevelopBalnance3 = await daiInstance.balanceOf(
      localDevelopAddress
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
        Number(totalFunds1.localDevelop),
        Number(totalFunds3.localDevelop)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "local develop total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalLocalDevelopFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.localDevelop),
      "local develop total fund3 is not ok"
    );

    assert.equal(
      Number(localDevelopBalnance3),
      Math.add(Number(localDevelopBalnance2), Number(withdrawBalance2)),
      "local develop account balance is not ok after withdraw2"
    );
  });

  it("should fail local develop withdraw", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setLocalDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawLocalDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawLocalDevelop(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawLocalDevelop(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawLocalDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawLocalDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });

  ///// ---------------------------------------------------------------------withdraw rescue fund balance ---------------------------------------------------------------
  it("should withdraw rescue fund succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw rescue fund data to be ok", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const rescueFundAddress = userAccount3;

    const totalRescueFundFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), rescueFund),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setRescueFundAddress(rescueFundAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalRescueFundFunded,
      Number(totalFunds1.rescueFund),
      "rescue fund total fund1 is not ok"
    );

    const rescueFundBalnance1 = await daiInstance.balanceOf(rescueFundAddress);

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await daiFundsInstance.withdrawRescueFund(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == rescueFundAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const rescueFundBalnance2 = await daiInstance.balanceOf(rescueFundAddress);

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.rescueFund),
        Number(totalFunds2.rescueFund)
      ),
      Number(withdrawBalance1),
      "rescue fund total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(rescueFundBalnance2),
      Math.add(Number(rescueFundBalnance1), Number(withdrawBalance1)),
      "rescue fund account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await daiFundsInstance.withdrawRescueFund(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "RescueBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == rescueFundAddress &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const rescueFundBalnance3 = await daiInstance.balanceOf(rescueFundAddress);

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
        Number(totalFunds1.rescueFund),
        Number(totalFunds3.rescueFund)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "rescue fund total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalRescueFundFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.rescueFund),
      "rescue fund total fund3 is not ok"
    );

    assert.equal(
      Number(rescueFundBalnance3),
      Math.add(Number(rescueFundBalnance2), Number(withdrawBalance2)),
      "rescue fund account balance is not ok after withdraw2"
    );
  });

  it("should fail rescue fund withdraw", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setRescueFundAddress(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawRescueFund(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawRescueFund(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawRescueFund(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawRescueFund(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawRescueFund(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });
  ////////// ---------------------------------------------------------------------withdraw treejer develop balance ----------------------------------------------------------------

  it("should withdraw treejer develop succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 1000;
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw treejer develop data to be ok", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    const treejerDevelopAddress = userAccount3;

    const totalTreejerDevelopFunded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), treejerDevelop),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setTreejerDevelopAddress(treejerDevelopAddress, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalTreejerDevelopFunded,
      Number(totalFunds1.treejerDevelop),
      "treejer develop total fund1 is not ok"
    );

    const treejerDevelopBalnance1 = await daiInstance.balanceOf(
      treejerDevelopAddress
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await daiFundsInstance.withdrawTreejerDevelop(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == treejerDevelopAddress &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const treejerDevelopBalnance2 = await daiInstance.balanceOf(
      treejerDevelopAddress
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds2.treejerDevelop)
      ),
      Number(withdrawBalance1),
      "treejer develop total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(treejerDevelopBalnance2),
      Math.add(Number(treejerDevelopBalnance1), Number(withdrawBalance1)),
      "treejer develop account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await daiFundsInstance.withdrawTreejerDevelop(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "TreejerDevelopBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == treejerDevelopAddress &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const treejerDevelopBalnance3 = await daiInstance.balanceOf(
      treejerDevelopAddress
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
        Number(totalFunds1.treejerDevelop),
        Number(totalFunds3.treejerDevelop)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "treejer develop total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalTreejerDevelopFunded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.treejerDevelop),
      "treejer develop total fund3 is not ok"
    );

    assert.equal(
      Number(treejerDevelopBalnance3),
      Math.add(Number(treejerDevelopBalnance2), Number(withdrawBalance2)),
      "treejer develop account balance is not ok after withdraw2"
    );
  });

  it("should fail treejer develop withdraw", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 0;

    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setTreejerDevelopAddress(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawTreejerDevelop(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawTreejerDevelop(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawTreejerDevelop(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });

  // ---------------------------------------------------------------------withdraw reserve fund1 balance ----------------------------------------------------------------

  it("should withdraw reserve fund1 succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 1000;
    const reserveFund2 = 0;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setReserveFund1Address(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawReserveFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw reserve fund1 data to be ok", async () => {
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
    const reserveFund1 = 1000;
    const reserveFund2 = 0;

    const reserveFund1Address = userAccount3;

    const totalReserveFund1Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), reserveFund1),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setReserveFund1Address(reserveFund1Address, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalReserveFund1Funded,
      Number(totalFunds1.reserveFund1),
      "reserve fund1 total fund1 is not ok"
    );

    const reserveFund1Balnance1 = await daiInstance.balanceOf(
      reserveFund1Address
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await daiFundsInstance.withdrawReserveFund1(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "ReserveBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == reserveFund1Address &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const reserveFund1Balnance2 = await daiInstance.balanceOf(
      reserveFund1Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund1),
        Number(totalFunds2.reserveFund1)
      ),
      Number(withdrawBalance1),
      "reserve fund1 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(reserveFund1Balnance2),
      Math.add(Number(reserveFund1Balnance1), Number(withdrawBalance1)),
      "reserve fund1 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await daiFundsInstance.withdrawReserveFund1(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "ReserveBalanceWithdrawn1", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == reserveFund1Address &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const reserveFund1Balnance3 = await daiInstance.balanceOf(
      reserveFund1Address
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
        Number(totalFunds1.reserveFund1),
        Number(totalFunds3.reserveFund1)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund1 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalReserveFund1Funded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.reserveFund1),
      "reserve fund1 total fund3 is not ok"
    );

    assert.equal(
      Number(reserveFund1Balnance3),
      Math.add(Number(reserveFund1Balnance2), Number(withdrawBalance2)),
      "reserve fund1 account balance is not ok after withdraw2"
    );
  });

  it("should fail reserve fund1 withdraw", async () => {
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
    const reserveFund1 = 1000;
    const reserveFund2 = 0;
    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setReserveFund1Address(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawReserveFund1(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawReserveFund1(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawReserveFund1(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawReserveFund1(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawReserveFund1(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });

  // ---------------------------------------------------------------------withdraw reserve fund2 balance ----------------------------------------------------------------

  it("should withdraw reserve fund2 succussfully", async () => {
    const treeId = 1;
    const amount = web3.utils.toWei("2");
    const planterFund = 5000;
    const referralFund = 1000;
    const treeResearch = 1000;
    const localDevelop = 1000;
    const rescueFund = 1000;
    const treejerDevelop = 0;
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    //////// -------------------- add roles
    await Common.addTreejerContractRole(
      arInstance,
      userAccount6,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////////////------------------- set addresses
    await daiFundsInstance.setReserveFund2Address(userAccount3, {
      from: deployerAccount,
    });

    ////////------------------- handle dm models

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    ////---------------transfer dai for daiFundsInstance-------------------
    await daiInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      { from: userAccount6 }
    );
    /////////// ------------withdraw balance

    const tx = await daiFundsInstance.withdrawReserveFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      { from: deployerAccount }
    );
  });

  it("check withdraw reserve fund2 data to be ok", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    const reserveFund2Address = userAccount3;

    const totalReserveFund2Funded = Math.divide(
      Math.mul(Math.add(Number(amount), Number(amount1)), reserveFund2),
      10000
    );

    const daiFundContractShare = Math.divide(
      Math.mul(
        Math.add(Number(amount), Number(amount1)),
        Math.add(
          treeResearch,
          localDevelop,
          rescueFund,
          treejerDevelop,
          reserveFund1,
          reserveFund2
        )
      ),
      10000
    );

    ///////----------------------add roles
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

    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    /////////// ------------------ set addresses
    await daiFundsInstance.setReserveFund2Address(reserveFund2Address, {
      from: deployerAccount,
    });

    ///////// ------------------ handle dm model
    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );
    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    ////////---------------fund trees-------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    // -------------------------- check data before withdraw -----------------
    const contractBalanceAfterFund = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const totalFunds1 = await daiFundsInstance.totalFunds();

    assert.equal(
      Number(contractBalanceAfterFund),
      daiFundContractShare,
      "contract balance after fund is not ok"
    );

    assert.equal(
      totalReserveFund2Funded,
      Number(totalFunds1.reserveFund2),
      "reserve fund2 total fund1 is not ok"
    );

    const reserveFund2Balnance1 = await daiInstance.balanceOf(
      reserveFund2Address
    );

    // --------------------- first withdraw and check data ------------------
    const withdrawBalance1 = web3.utils.toWei("0.1");

    const tx = await daiFundsInstance.withdrawReserveFund2(
      withdrawBalance1,
      withdrawReason,
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx, "ReserveBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance1) &&
        ev.account == reserveFund2Address &&
        ev.reason == withdrawReason
      );
    });
    const totalFunds2 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const reserveFund2Balnance2 = await daiInstance.balanceOf(
      reserveFund2Address
    );

    assert.equal(
      Number(contractBalanceAfterWithdraw1),
      Math.subtract(daiFundContractShare, Number(withdrawBalance1)),
      "contract balance after withdraw1 is not ok"
    );

    assert.equal(
      Math.subtract(
        Number(totalFunds1.reserveFund2),
        Number(totalFunds2.reserveFund2)
      ),
      Number(withdrawBalance1),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Number(reserveFund2Balnance2),
      Math.add(Number(reserveFund2Balnance1), Number(withdrawBalance1)),
      "reserve fund2 account balance is not ok after withdraw1"
    );

    // -------------------- seccond withdraw and check data ------------------------------

    const withdrawBalance2 = web3.utils.toWei("0.2");

    const tx2 = await daiFundsInstance.withdrawReserveFund2(
      withdrawBalance2,
      "reason to withdraw",
      { from: deployerAccount }
    );

    truffleAssert.eventEmitted(tx2, "ReserveBalanceWithdrawn2", (ev) => {
      return (
        Number(ev.amount) == Number(withdrawBalance2) &&
        ev.account == reserveFund2Address &&
        ev.reason == withdrawReason
      );
    });

    const totalFunds3 = await daiFundsInstance.totalFunds();

    const contractBalanceAfterWithdraw2 = await daiInstance.balanceOf(
      daiFundsInstance.address
    );

    const reserveFund2Balnance3 = await daiInstance.balanceOf(
      reserveFund2Address
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
        Number(totalFunds1.reserveFund2),
        Number(totalFunds3.reserveFund2)
      ),
      Math.add(Number(withdrawBalance1), Number(withdrawBalance2)),
      "reserve fund2 total fund is not ok after withdraw1"
    );

    assert.equal(
      Math.subtract(
        totalReserveFund2Funded,
        Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
      ),
      Number(totalFunds3.reserveFund2),
      "reserve fund2 total fund3 is not ok"
    );

    assert.equal(
      Number(reserveFund2Balnance3),
      Math.add(Number(reserveFund2Balnance2), Number(withdrawBalance2)),
      "reserve fund2 account balance is not ok after withdraw2"
    );
  });

  it("should fail reserve fund2 withdraw", async () => {
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
    const reserveFund1 = 0;
    const reserveFund2 = 1000;

    ///////////--------------------- add roles
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
    await Common.addTreejerContractRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    //////-------------------- handle dm model

    await fModel.addFundDistributionModel(
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: dataManager,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: dataManager,
    });

    //////////---------------transfer dai for daiFundsInstance-------------------

    await daiInstance.setMint(daiFundsInstance.address, amount);

    await daiInstance.setMint(daiFundsInstance.address, amount1);

    //////////--------------- fund tree -------------------

    await daiFundsInstance.fundTree(
      treeId,
      amount,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );
    await daiFundsInstance.fundTree(
      treeId2,
      amount1,
      planterFund,
      referralFund,
      treeResearch,
      localDevelop,
      rescueFund,
      treejerDevelop,
      reserveFund1,
      reserveFund2,
      {
        from: userAccount6,
      }
    );

    await daiFundsInstance.setReserveFund2Address(userAccount3, {
      from: deployerAccount,
    });

    await daiFundsInstance
      .withdrawReserveFund2(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: userAccount7,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance
      .withdrawReserveFund2(web3.utils.toWei("0"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    await daiFundsInstance
      .withdrawReserveFund2(web3.utils.toWei("3"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);

    //////////////// ------------------ withdraw  some balance and then try to withdraw
    await daiFundsInstance.withdrawReserveFund2(
      web3.utils.toWei("0.2"),
      "reason to withdraw",
      {
        from: deployerAccount,
      }
    );

    ////////////------------- should fail
    await daiFundsInstance
      .withdrawReserveFund2(web3.utils.toWei("0.2"), "reason to withdraw", {
        from: deployerAccount,
      })
      .should.be.rejectedWith(DaiFundsErrorMsg.INSUFFICIENT_AMOUNT);
  });
});
