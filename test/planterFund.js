const AccessRestriction = artifacts.require("AccessRestriction.sol");

const Planter = artifacts.require("Planter.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");
const zeroAddress = "0x0000000000000000000000000000000000000000";
var Dai = artifacts.require("Dai.sol");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

const Math = require("./math");

const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
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
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
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

  beforeEach(async () => {
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

    daiInstance = await Dai.new("DAI", "dai", { from: deployerAccount });

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );
  });

  afterEach(async () => {});

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
  //   const referralFund = Units.convert("50", "eth", "wei");

  //   const planterWithdrawAmount = Units.convert("100", "eth", "wei");

  //   await planterFundInstance.setPlanterContractAddress(
  //     planterInstance.address,
  //     {
  //       from: deployerAccount,
  //     }
  //   );

  //   await Common.successPlanterJoin(
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

  //   await planterFundInstance.setPlanterFunds(
  //     treeId,
  //     planterFund,
  //     referralFund,
  //     {
  //       from: userAccount8,
  //     }
  //   );

  //   await planterFundInstance.fundPlanter(treeId, planterAddress, 25920, {
  //     from: userAccount6,
  //   });

  //   await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
  //     from: deployerAccount,
  //   });

  //   let balanceAccountBefore = await web3.eth.getBalance(planterAddress);

  //   await contractPlanterFund
  //     .withdrawPlanterBalance(planterWithdrawAmount, {
  //       from: planterAddress,
  //     })
  //     .should.be.rejectedWith(GsnErrorMsg.ADDRESS_NOT_EXISTS);

  //   await paymaster.addPlanterWhitelistTarget(planterFundInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await contractPlanterFund.withdrawPlanterBalance(planterWithdrawAmount, {
  //     from: planterAddress,
  //   });

  //   let balanceAccountAfter = await web3.eth.getBalance(planterAddress);

  //   assert.equal(
  //     balanceAccountAfter,
  //     balanceAccountBefore,
  //     "gsn not true work"
  //   );
  // });

  it("deploys successfully", async () => {
    const address = planterFundInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ///////////////---------------------------------set trust forwarder address--------------------------------------------------------
  it("set trust forwarder address", async () => {
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
  });

  ///////----------------------------------------------------test set WithdrawThreshold----------------------------

  it("should set WithdrawThreshold successfully", async () => {
    planterFundInstance
      .setWithdrawThreshold(planterInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

    let priceBefore = await planterFundInstance.withdrawThreshold();

    planterFundInstance.setWithdrawThreshold(web3.utils.toWei("1"), {
      from: dataManager,
    });

    let priceAfter = await planterFundInstance.withdrawThreshold();

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
  ///////////////---------------------------------set planter contract address--------------------------------------------------------
  it("should set planter contract address successfully", async () => {
    planterFundInstance
      .setPlanterContractAddress(planterInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    planterFundInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });
  });
  ///////////////---------------------------------set dai token address--------------------------------------------------------
  it("should set dai token address successfully", async () => {
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

  it("set planter funds successfully and check data", async () => {
    const treeId1 = 1;
    const treeId2 = 2;
    const planterFund1 = 1000;
    const referralFund1 = 500;
    const planterFund2 = 2000;
    const referralFund2 = 1000;

    ////////////////////////----------- handle role

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

    const eventTx1 = await planterFundInstance.setPlanterFunds(
      treeId1,
      planterFund1,
      referralFund1,
      { from: userAccount1 }
    );

    truffleAssert.eventEmitted(eventTx1, "PlanterFundSet", (ev) => {
      return (
        Number(ev.treeId) == treeId1 &&
        Number(ev.planterAmount) == Number(planterFund1) &&
        Number(ev.referralAmount) == Number(referralFund1)
      );
    });

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

    const eventTx2 = await planterFundInstance.setPlanterFunds(
      treeId2,
      planterFund2,
      referralFund2,
      {
        from: userAccount1,
      }
    );

    truffleAssert.eventEmitted(eventTx2, "PlanterFundSet", (ev) => {
      return (
        Number(ev.treeId) == treeId2 &&
        Number(ev.planterAmount) == Number(planterFund2) &&
        Number(ev.referralAmount) == Number(referralFund2)
      );
    });

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

  it("should fail to set planter funds in invalid access1", async () => {
    const treeId = 1;
    const planterFund = 1000;
    const referralFund = 500;

    await planterFundInstance
      .setPlanterFunds(treeId, planterFund, referralFund, {
        from: notTreejerContractAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
  });

  //----------------------- fund planter test ---------------------------------------//ali
  it("fund planter successfully", async () => {
    const treeId = 1;
    const planterFund = 5000;
    const referralFund = 1000;

    ////////////////////////----------- handle address

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
    const treeId = 1;
    const planterFund = 5000;
    const referralFund = 1000;

    ////////////////////////----------- handle address

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
      deployerAccount,
      dataManager
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
    const treeId = 1;
    const planterFund = 5000;
    const referralFund = 1000;
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

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      treeId,
      userAccount2,
      userAccount3,
      zeroAddress
    );

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
      deployerAccount,
      dataManager
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
        from: userAccount4,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await planterFundInstance
      .fundPlanter(treeId2, userAccount2, treeStatus, {
        from: userAccount6,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.PLANTER_FUND_NOT_EXIST);
  });

  it("should withdraw planter succussfully", async () => {
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    const treeId = 1;

    const planterFund = Units.convert("100", "eth", "wei");
    const referralFund = Units.convert("50", "eth", "wei");

    const planterWithdrawAmount = Units.convert("100", "eth", "wei");
    const referralWithdrawAmount = Units.convert("30", "eth", "wei");

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

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );
    const planterDaiBalanceBefore = await daiInstance.balanceOf.call(
      userAccount3
    );

    const referralDaiBlanceBefore = await daiInstance.balanceOf.call(
      userAccount4
    );

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    let txPlanter = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount,
      {
        from: userAccount3,
      }
    );

    let txReferral = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrawAmount,
      {
        from: userAccount4,
      }
    );

    let planterDaiBalanceAfter = await daiInstance.balanceOf.call(userAccount3);
    let referralDaiBalanceAfter = await daiInstance.balanceOf.call(
      userAccount4
    );

    assert.equal(
      Number(planterDaiBalanceAfter),
      Math.add(Number(planterDaiBalanceBefore), planterWithdrawAmount)
    );

    assert.equal(
      referralDaiBalanceAfter,
      Math.add(referralDaiBlanceBefore, referralWithdrawAmount)
    );

    const referralBalanceLeft = await planterFundInstance.balances.call(
      userAccount4
    );

    const planterBalanceLeft = await planterFundInstance.balances.call(
      userAccount3
    );

    assert.equal(
      Number(referralBalanceLeft),
      Math.subtract(referralFund, Number(referralDaiBalanceAfter))
    );

    assert.equal(
      Number(planterBalanceLeft),
      Math.subtract(planterFund, Number(planterDaiBalanceAfter))
    );
  });

  it("should withdraw planter succussfully(when minimum amount change)", async () => {
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    const treeId = 1;

    planterFundInstance.setWithdrawThreshold(web3.utils.toWei(".5"), {
      from: dataManager,
    });

    const planterFund = Units.convert("5", "eth", "wei");
    const referralFund = Units.convert("5", "eth", "wei");

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

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".6"), {
      from: userAccount3,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".6"), {
      from: userAccount4,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".5"), {
      from: userAccount3,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".5"), {
      from: userAccount4,
    });

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei(".4"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei(".4"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    planterFundInstance.setWithdrawThreshold(web3.utils.toWei(".4"), {
      from: dataManager,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".4"), {
      from: userAccount3,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei(".4"), {
      from: userAccount4,
    });

    planterFundInstance.setWithdrawThreshold(web3.utils.toWei("2"), {
      from: dataManager,
    });

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("1.9"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("1.9"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei("3.5"), {
      from: userAccount3,
    });

    await planterFundInstance.withdrawPlanterBalance(web3.utils.toWei("3.5"), {
      from: userAccount4,
    });

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("3.5"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("3.5"), {
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
    const referralFund = Units.convert("50", "eth", "wei");

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
      userAccount3,
      userAccount4,
      zeroAddress
    );

    const totalPlanterFund = planterFund;

    const totalReferralFund = referralFund;

    await daiInstance.transfer(
      planterFundInstance.address,
      Units.convert("150", "eth", "wei"),
      { from: deployerAccount }
    );

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
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

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    const planterBalance1 = await planterFundInstance.balances.call(
      userAccount3
    );
    const accountBalance1 = await web3.eth.getBalance(userAccount3);

    const referralBalance1 = await planterFundInstance.balances.call(
      userAccount4
    );
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
    const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");
    const referralWithdrwAmount1 = Units.convert("10", "eth", "wei");
    const tx = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount1,
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount1 &&
        ev.account == userAccount3
      );
    });

    const txReferral = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrwAmount1,
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(txReferral, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == referralWithdrwAmount1 &&
        ev.account == userAccount4
      );
    });

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
      planterFundInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Math.add(planterWithdrawAmount1, referralWithdrwAmount1)
      ),
      Number(contractBalanceAfterWithdraw1),
      "contract balance is not ok after withdraw 1"
    );

    const planterBalance2 = await planterFundInstance.balances.call(
      userAccount3
    );
    const planterDaiBalance2 = await daiInstance.balanceOf.call(userAccount3);

    const referralBalance2 = await planterFundInstance.balances.call(
      userAccount4
    );
    const referralDaiBalance2 = await daiInstance.balanceOf.call(userAccount4);

    assert.equal(
      Math.subtract(totalPlanterFund, planterWithdrawAmount1),
      Number(planterBalance2),
      "planter blance is not ok 2"
    );
    assert.equal(
      Math.subtract(totalReferralFund, referralWithdrwAmount1),
      Number(referralBalance2),
      "referral blance is not ok 2"
    );

    assert.equal(
      Number(planterDaiBalance2),
      planterWithdrawAmount1,
      "planter balance is not ok 2"
    );

    //////////////////////
    const planterWithdrawAmount2 = Units.convert("20", "eth", "wei");
    const referralWithdrawAmount2 = Units.convert("40", "eth", "wei");

    const tx2 = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount2,
      { from: userAccount3 }
    );

    const txReferral2 = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrawAmount2,
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount2 &&
        ev.account == userAccount3
      );
    });

    truffleAssert.eventEmitted(txReferral2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == referralWithdrawAmount2 &&
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
          referralWithdrwAmount1,
          referralWithdrawAmount2
        )
      ),
      Number(contractBalanceAfterWithdraw2),
      "contract balance is not ok after withdraw 2"
    );

    const planterBalance3 = await planterFundInstance.balances.call(
      userAccount3
    );
    const referralBalance4 = await planterFundInstance.balances.call(
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

    assert.equal(0, Number(referralBalance4), "referral blance is not ok 3");

    const totalFunds = await planterFundInstance.totalFunds();

    assert.equal(
      0,
      Number(totalFunds.referralFund),
      "totalReferralFund is not ok 3"
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
    const referralFund = Units.convert("50", "eth", "wei");

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount,
      dataManager
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

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );
    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    let planterBalance = await web3.eth.getBalance(userAccount3);

    let referralBalance = await web3.eth.getBalance(userAccount4);

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
    const referralWithdrawAmount = Units.convert("10", "eth", "wei");

    let txPlanter = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount,
      {
        from: userAccount3,
      }
    );

    let txOrganization = await planterFundInstance.withdrawPlanterBalance(
      organizationWithdrawAmount,
      {
        from: userAccount5,
      }
    );

    let txReferral = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrawAmount,
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
      referralWithdrawAmount
    );
  });

  it("should fail of insufficient amount", async () => {
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await planterFundInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    const treeId = 1;

    const planterFund = Units.convert("100", "eth", "wei");
    const referralFund = Units.convert("50", "eth", "wei");

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount,
      dataManager
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

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );
    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    await daiInstance.transfer(
      planterFundInstance.address,
      Units.convert("150", "eth", "wei"),
      {
        from: deployerAccount,
      }
    );

    const planterWithdrawAmount = Units.convert("21", "eth", "wei");
    const organizationWithdrawAmount = Units.convert("81", "eth", "wei");
    const referralWithdrawAmount = Units.convert("51", "eth", "wei");

    let txPlanter = await planterFundInstance
      .withdrawPlanterBalance(planterWithdrawAmount, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    let txOrganization = await planterFundInstance
      .withdrawPlanterBalance(organizationWithdrawAmount, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
    let txReferral = await planterFundInstance
      .withdrawPlanterBalance(referralWithdrawAmount, {
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
    const referralFund = Units.convert("50", "eth", "wei");

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount5,
      zeroAddress,
      deployerAccount,
      dataManager
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

    const totalPlanterFund = planterFund;

    const totalReferralFund = referralFund;

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
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
      Math.add(planterFund, referralFund),
      "contrct balance charged inconrrectly"
    );

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    const planterBalance1 = await planterFundInstance.balances.call(
      userAccount3
    );
    const accountBalance1 = await web3.eth.getBalance(userAccount3);

    const referralBalance1 = await planterFundInstance.balances.call(
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
      Number(referralBalance1),
      totalReferralFund,
      "referral balance is not ok 1"
    );

    const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");
    const referralWithdrawAmount1 = Units.convert("10", "eth", "wei");
    const organizationWithdrawAmount1 = Units.convert("10", "eth", "wei");
    const tx = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount1,
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount1 &&
        ev.account == userAccount3
      );
    });

    const txReferral = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrawAmount1,
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(txReferral, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == referralWithdrawAmount1 &&
        ev.account == userAccount4
      );
    });

    const txOrganization = await planterFundInstance.withdrawPlanterBalance(
      organizationWithdrawAmount1,
      { from: userAccount5 }
    );

    truffleAssert.eventEmitted(
      txOrganization,
      "PlanterBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == organizationWithdrawAmount1 &&
          ev.account == userAccount5
        );
      }
    );

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
      planterFundInstance.address
    );

    assert.equal(
      Math.subtract(
        Number(contractBalanceAfterFund),
        Math.add(
          planterWithdrawAmount1,
          referralWithdrawAmount1,
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

    const referralBalance2 = await planterFundInstance.balances.call(
      userAccount4
    );
    const accountReferralBalance2 = await daiInstance.balanceOf.call(
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
      Math.subtract(totalReferralFund, referralWithdrawAmount1),
      Number(referralBalance2),
      "referral blance is not ok 2"
    );

    // const txFee = await Common.getTransactionFee(tx);

    // const txOrganizationFee = await Common.getTransactionFee(txOrganization);

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
    const referralWithdrawAmount2 = Units.convert("10", "eth", "wei");
    const tx2 = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount2,
      { from: userAccount3 }
    );

    const txOrganization2 = await planterFundInstance.withdrawPlanterBalance(
      organizationWithdrawAmount2,
      { from: userAccount5 }
    );

    const txReferral2 = await planterFundInstance.withdrawPlanterBalance(
      referralWithdrawAmount2,
      { from: userAccount4 }
    );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount2 &&
        ev.account == userAccount3
      );
    });

    truffleAssert.eventEmitted(
      txOrganization2,
      "PlanterBalanceWithdrawn",
      (ev) => {
        return (
          Number(ev.amount) == organizationWithdrawAmount2 &&
          ev.account == userAccount5
        );
      }
    );

    truffleAssert.eventEmitted(txReferral2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == referralWithdrawAmount2 &&
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
          referralWithdrawAmount1,
          referralWithdrawAmount2
        )
      ),
      Number(contractBalanceAfterWithdraw2),
      "contract balance is not ok after withdraw 2"
    );

    const planterBalance3 = await planterFundInstance.balances.call(
      userAccount3
    );
    const referralBalance4 = await planterFundInstance.balances.call(
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
        totalReferralFund,
        Math.add(referralWithdrawAmount2, referralWithdrawAmount1)
      ),
      Number(referralBalance4),
      "referral blance is not ok 3"
    );

    const totalFunds = await planterFundInstance.totalFunds();

    assert.equal(
      0,
      Number(totalFunds.referralFund),
      "totalReferralFund is not ok 3"
    );

    assert.equal(
      0,
      Number(totalFunds.planterFund),
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
    const referralFund = Units.convert("50", "eth", "wei");

    await planterFundInstance.setPlanterContractAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.successOrganizationPlanterJoin(
      arInstance,
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount,
      dataManager
    );

    const totalPlanterFund = planterFund;

    const totalReferralFund = referralFund;

    await daiInstance.transfer(
      planterFundInstance.address,
      Units.convert("150", "eth", "wei"),
      { from: deployerAccount }
    );

    const contractBalanceAfterFund = await daiInstance.balanceOf.call(
      planterFundInstance.address
    );

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    const OrganizationPlanterBalance1 = await planterFundInstance.balances.call(
      userAccount3
    );

    const totalFunds = await planterFundInstance.totalFunds();

    assert.equal(
      Number(OrganizationPlanterBalance1),
      Number(totalPlanterFund),
      "Organization planter balance is not ok 1"
    );

    assert.equal(
      Number(totalFunds.localDevelop),
      totalReferralFund,
      "localDevelop balance is not ok 1"
    );

    assert.equal(
      Number(totalFunds.referralFund),
      0,
      "total referrar fund is not ok"
    );

    const planterWithdrawAmount1 = Units.convert("10", "eth", "wei");

    const tx = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount1,
      { from: userAccount3 }
    );

    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount1 &&
        ev.account == userAccount3
      );
    });

    //TODO: we can check here transfer local develop fund and check total funds

    // const txLocalDevelop = await planterFundInstance.withdrawLocalDevelop(
    //   web3.utils.toWei("0.1"),
    //   "some reason",
    //   { from: deployerAccount }
    // );

    // truffleAssert.eventEmitted(
    //   txLocalDevelop,
    //   "LocalDevelopBalanceWithdrawn",
    //   (ev) => {
    //     return (
    //       Number(ev.amount) == Number(web3.utils.toWei("0.1")) &&
    //       ev.account == userAccount6 &&
    //       ev.reason == "some reason"
    //     );
    //   }
    // );

    const contractBalanceAfterWithdraw1 = await daiInstance.balanceOf.call(
      planterFundInstance.address
    );

    assert.equal(
      Math.subtract(Number(contractBalanceAfterFund), planterWithdrawAmount1),
      Number(contractBalanceAfterWithdraw1),
      "contract balance is not ok after withdraw 1"
    );

    const organizationPlanterBalance2 = await planterFundInstance.balances.call(
      userAccount3
    );
    const accountOrganizationPlanterBalance2 = await daiInstance.balanceOf.call(
      userAccount3
    );

    const totalFunds2 = await planterFundInstance.totalFunds();

    const accountlocalDevelopBalance2 = await daiInstance.balanceOf.call(
      userAccount6
    );

    assert.equal(
      Math.subtract(Number(totalPlanterFund), planterWithdrawAmount1),
      Number(organizationPlanterBalance2),
      "organization planter blance is not ok 2"
    );
    //TODO: we can check here transfer local develop fund and check total funds
    assert.equal(
      totalReferralFund,
      Number(totalFunds2.localDevelop),
      "localDevelop blance is not ok 2"
    );

    const txFee = await Common.getTransactionFee(tx);

    assert.equal(
      Number(accountOrganizationPlanterBalance2),
      planterWithdrawAmount1,
      "organization planter balance is not ok 2"
    );

    // //////////////////////
    const planterWithdrawAmount2 = Units.convert("90", "eth", "wei");

    //amount must be gt .5 dai
    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("0.4"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    const tx2 = await planterFundInstance.withdrawPlanterBalance(
      planterWithdrawAmount2,
      { from: userAccount3 }
    );

    // const txLocalDevelop2 = await planterFundInstance.withdrawLocalDevelop(
    //   web3.utils.toWei("0.3"),
    //   "some reason",
    //   { from: deployerAccount }
    // );

    truffleAssert.eventEmitted(tx2, "PlanterBalanceWithdrawn", (ev) => {
      return (
        Number(ev.amount) == planterWithdrawAmount2 &&
        ev.account == userAccount3
      );
    });

    // truffleAssert.eventEmitted(
    //   txLocalDevelop2,
    //   "LocalDevelopBalanceWithdrawn",
    //   (ev) => {
    //     return (
    //       Number(ev.amount) == Number(web3.utils.toWei("0.3")) &&
    //       ev.account == userAccount6 &&
    //       ev.reason == "some reason"
    //     );
    //   }
    // );

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

    const organizationPlanterBalance3 = await planterFundInstance.balances.call(
      userAccount3
    );

    const totalFunds3 = await planterFundInstance.totalFunds();

    assert.equal(
      0,
      Number(organizationPlanterBalance3),
      "planter blance is not ok 3"
    );

    assert.equal(
      0,
      Number(totalFunds3.referralFund),
      "totalReferralFund is not ok 3"
    );

    assert.equal(
      0,
      Number(totalFunds3.planterFund),
      "totalPalnterFund is not ok 3"
    );

    assert.equal(
      totalReferralFund,
      Number(totalFunds3.localDevelop),
      "totallocalDevelop is not ok 3"
    );

    const accountOrganizationPlanterBalance3 = await daiInstance.balanceOf.call(
      userAccount3
    );
    // const accountlocalDevelopBalance3 = await web3.eth.getBalance(userAccount6);

    const txFee2 = await Common.getTransactionFee(tx2);

    assert.equal(
      Number(accountOrganizationPlanterBalance3),

      Math.add(
        Number(accountOrganizationPlanterBalance2),
        planterWithdrawAmount2
      ),

      "planter balance is not ok 3"
    );

    // assert.equal(
    //   Number(accountlocalDevelopBalance3),
    //   Math.add(
    //     Number(accountlocalDevelopBalance2),
    //     Number(web3.utils.toWei("0.3"))
    //   ),
    //   "localDevelop balance is not ok 3"
    // );
  });

  it("should fail withdraw planter", async () => {
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);

    const treeId = 1;

    const planterFund = Units.convert("100", "eth", "wei");
    const referralFund = Units.convert("50", "eth", "wei");

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
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await planterFundInstance.setPlanterFunds(
      treeId,
      planterFund,
      referralFund,
      {
        from: userAccount8,
      }
    );

    await planterFundInstance.fundPlanter(treeId, userAccount3, 25920, {
      from: userAccount6,
    });

    await planterFundInstance
      .withdrawPlanterBalance(0, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance
      .withdrawPlanterBalance(Units.convert("150", "eth", "wei"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    //amount must be gt .5 dai
    await planterFundInstance
      .withdrawPlanterBalance(web3.utils.toWei("0.2"), {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    await planterFundInstance
      .withdrawPlanterBalance(Units.convert("75", "eth", "wei"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT); //not planter and his account have no vallue

    await planterFundInstance
      .withdrawPlanterBalance(Units.convert("50", "eth", "wei"), {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);
  });
});
