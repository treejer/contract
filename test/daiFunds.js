const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const DaiFunds = artifacts.require("DaiFunds.sol");

const AccessRestriction = artifacts.require("AccessRestriction.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  TreeAuctionErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const Common = require("./common");

contract("DaiFunds", (accounts) => {
  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const userAccount8 = accounts[9];

  let testUniswap;
  let tokenIn;
  let tokenOut;
  let arInstance;
  let daiFundsInstance;
  let fModel;
  let wethInstance;
  let daiInstance;
  let planterFundsInstnce;

  beforeEach(async () => {
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

    daiInstance = await Weth.new("DAI", "dai", { from: accounts[0] });
  });

  /////////////------------------------------------ set Dai Token address ----------------------------------------//

  it("set dai token address", async () => {
    await daiFundsInstance
      .setDaiTokenAddress(daiInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await daiFundsInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });
  });

  /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//
  it("set uniswap router address", async () => {
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
  });
  /*
        
        /////////////------------------------------------ fundTree function test ----------------------------------------//
        
        it("Should fundTree work successfully", async () => {
            const treeId = 1;
            let amount = web3.utils.toWei("1", "Ether");
            
            ////--------------check set role----------------
            await Common.addAuctionRole(arInstance, userAccount3, deployerAccount);
            
    await Common.addFundsRole(
      arInstance,
      daiFundsInstance.address,
      deployerAccount
    );

    ////--------------add and assign DistributionModel for tree
    await fModel.addFundDistributionModel(
      4000,
      2000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await fModel.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    ////---------------transfer weth for daiFundsInstance-------------------
    await wethInstance.setMint(daiFundsInstance.address, amount);

    ////--------------------call fund tree by auction----------------
    await daiFundsInstance.fundTree(
      treeId,
      amount,
      4000,
      2000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      { from: userAccount3 }
    );

    let expected = {
      planterFund: (40 * amount) / 100,
      referralFund: (20 * amount) / 100,
      treeResearch: (10 * amount) / 100,
      localDevelop: (10 * amount) / 100,
      rescueFund: (10 * amount) / 100,
      treejerDevelop: (10 * amount) / 100,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    //check wethFund totalFunds
    let totalFunds = await daiFundsInstance.totalFunds();

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
      Number(totalFunds.reserveFund1),
      expected.reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFunds.reserveFund2),
      expected.reserveFund2,
      "reserveFund2 funds invalid"
    );

    //check fund planter

    let totalFund = await planterFundsInstnce.totalFunds.call();

    let planterFund = totalFund.planterFund;
    let referralFund = totalFund.referralFund;

    // let contractBalance = await daiInstance.balanceOf(
    //   planterFundsInstnce.address
    // );

    // console.log(`out ${web3.utils.fromWei(contractBalance.toString())}`);

    // let totalFund = await planterFundsInstnce.totalFunds.call();
    // let planterFund = totalFund.planterFund;
    // let referralFund = totalFund.referralFund;

    // let total = Number(planterFund) + Number(referralFund);

    // console.log("total", total);
    // console.log("planterFund", web3.utils.fromWei(planterFund.toString()));
    // console.log("referal", web3.utils.fromWei(referralFund.toString()));
  });

  */
});
