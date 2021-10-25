// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

require("dotenv").config();

const WethFund = artifacts.require("WethFund");
const AccessRestriction = artifacts.require("AccessRestriction");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");

var Dai = artifacts.require("Dai");
var Weth = artifacts.require("Weth");
let UniswapV2Router02New;
let TestUniswap;
let Factory;

if (process.env.COVERAGE) {
  UniswapV2Router02New = artifacts.require("UniSwapMini");
} else {
  Factory = artifacts.require("Factory");
  UniswapV2Router02New = artifacts.require("UniswapV2Router02New");
  TestUniswap = artifacts.require("TestUniswap");
}

const Math = require("./math");

const {
  CommonErrorMsg,
  TreasuryManagerErrorMsg,
  WethFundErrorMsg,
} = require("./enumes");

const Common = require("./common");

contract("WethFund", (accounts) => {
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
  const funderRank = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const withdrawReason = "reason to withdraw";

  let testUniswap;
  let tokenIn;
  let tokenOut;
  let arInstance;
  let wethFund;
  let allocationInstance;
  let factoryInstance;
  let wethInstance;
  let daiInstance;
  let uniswapRouterInstance;
  let testUniswapInstance;
  let planterFundsInstnce;
  let uniswapV2Router02NewAddress;
  let WETHAddress;
  let DAIAddress;

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    if (!process.env.COVERAGE) {
      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;
      wethInstance = await Weth.new("WETH", "weth", { from: accounts[0] });
      WETHAddress = wethInstance.address;
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
      DAIAddress = daiInstance.address;
      uniswapRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        WETHAddress,
        { from: deployerAccount }
      );
      uniswapV2Router02NewAddress = uniswapRouterInstance.address;
      testUniswapInstance = await TestUniswap.new(
        uniswapV2Router02NewAddress,
        DAIAddress,
        WETHAddress,
        { from: deployerAccount }
      );
      /////---------------------------addLiquidity-------------------------
      const testUniswapAddress = testUniswapInstance.address;
      await wethInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );
      await daiInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("250000000", "Ether")
      );
      await testUniswapInstance.addLiquidity();
    } else {
      wethInstance = await Weth.new("WETH", "weth", {
        from: accounts[0],
      });
      WETHAddress = wethInstance.address;
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
      DAIAddress = daiInstance.address;
      uniswapRouterInstance = await UniswapV2Router02New.new(
        DAIAddress,
        WETHAddress,
        { from: deployerAccount }
      );
      uniswapV2Router02NewAddress = uniswapRouterInstance.address;
      await wethInstance.setMint(
        uniswapV2Router02NewAddress,
        web3.utils.toWei("125000", "Ether")
      );
      await daiInstance.setMint(
        uniswapV2Router02NewAddress,
        web3.utils.toWei("250000000", "Ether")
      );
    }

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
    await Common.addScriptRole(arInstance, funderRank, deployerAccount);
  });

  // beforeEach(async () => {
  // wethFund = await WethFund.new({
  //   from: deployerAccount,
  // });

  // await wethFund.initialize(arInstance.address, {
  //   from: deployerAccount,
  // });

  // allocationInstance = await Allocation.new({
  //   from: deployerAccount,
  // });

  // await allocationInstance.initialize(arInstance.address, {
  //   from: deployerAccount,
  // });

  // planterFundsInstnce = await PlanterFund.new({
  //   from: deployerAccount,
  // });

  // await planterFundsInstnce.initialize(arInstance.address, {
  //   from: deployerAccount,
  // });

  //   await wethFund.setUniswapRouterAddress(uniswapV2Router02NewAddress, {
  //     from: deployerAccount,
  //   });
  //   await wethFund.setWethTokenAddress(WETHAddress, { from: deployerAccount });

  //   await wethFund.setDaiAddress(DAIAddress, { from: deployerAccount });

  //   await wethFund.setPlanterFundContractAddress(planterFundsInstnce.address, {
  //     from: deployerAccount,
  //   });
  // });

  describe("deployment and set addresses", () => {
    beforeEach(async () => {
      wethFund = await WethFund.new({
        from: deployerAccount,
      });

      await wethFund.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundsInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundsInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("should set addresses", async () => {
      /////////////------------------------------------ set Dai Token address ----------------------------------------//

      await wethFund.setDaiAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await wethFund
        .setDaiAddress(daiInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setDaiAddress(zeroAddress, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      assert.equal(
        await wethFund.daiAddress.call(),
        daiInstance.address,
        "Set dai address not true"
      );

      /////////////------------------------------------ set Weth Token address ----------------------------------------//

      await wethFund.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await wethFund
        .setWethTokenAddress(wethInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setWethTokenAddress(zeroAddress, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      assert.equal(
        await wethFund.wethToken.call(),
        wethInstance.address,
        "set weth address not true"
      );

      /////////////------------------------------------ set Uniswap Router address ----------------------------------------//

      await wethFund.setUniswapRouterAddress(uniswapRouterInstance.address, {
        from: deployerAccount,
      });

      await wethFund
        .setUniswapRouterAddress(uniswapRouterInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setUniswapRouterAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      assert.equal(
        await wethFund.uniswapRouter.call(),
        uniswapRouterInstance.address,
        "set uniswap router address not true"
      );

      /////////////------------------------------------ set PlanterFund Contract address ----------------------------------------//

      await wethFund.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await wethFund
        .setPlanterFundContractAddress(planterFundsInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      assert.equal(
        await wethFund.planterFundContract.call(),
        planterFundsInstnce.address,
        "set planter fund contract address not true"
      );
    });
  });

  describe("set fund addresses", () => {
    beforeEach(async () => {
      wethFund = await WethFund.new({
        from: deployerAccount,
      });

      await wethFund.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("should set fund addresses and fail in invalid situation", async () => {
      //-------------------------------setResearchAddress test-------------------------------------------------------
      let researchAddress = userAccount4;

      await wethFund
        .setResearchAddress(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setResearchAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setResearchAddress(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.researchAddress(),
        userAccount4,
        "Set researchAddress address not true"
      );

      //-------------------------------setLocalDevelopmentAddress test-------------------------------------------------------

      await wethFund
        .setLocalDevelopmentAddress(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setLocalDevelopmentAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setLocalDevelopmentAddress(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.localDevelopmentAddress(),
        userAccount4,
        "Set localDevelopmentAddress address not true"
      );

      //-------------------------------setInsuranceAddress test-------------------------------------------------------

      await wethFund
        .setInsuranceAddress(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setInsuranceAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setInsuranceAddress(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.insuranceAddress(),
        userAccount4,
        "Set insuranceAddress address not true"
      );

      //-------------------------------setTreasuryAddress test-------------------------------------------------------

      await wethFund
        .setTreasuryAddress(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setTreasuryAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setTreasuryAddress(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.treasuryAddress(),
        userAccount4,
        "Set treasuryAddress address not true"
      );

      //-------------------------------setReserve1Address test-------------------------------------------------------

      await wethFund
        .setReserve1Address(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setReserve1Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setReserve1Address(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.reserve1Address(),
        userAccount4,
        "Set reserve1Address address not true"
      );

      //-------------------------------setReserve2Address test-------------------------------------------------------

      await wethFund
        .setReserve2Address(userAccount4, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .setReserve2Address(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await wethFund.setReserve2Address(userAccount4, {
        from: deployerAccount,
      });

      assert.equal(
        await wethFund.reserve2Address(),
        userAccount4,
        "Set reserve2Address address not true"
      );
    });
  });

  describe("fund and withdraw", () => {
    beforeEach(async () => {
      wethFund = await WethFund.new({
        from: deployerAccount,
      });

      await wethFund.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundsInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundsInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await wethFund.setUniswapRouterAddress(uniswapV2Router02NewAddress, {
        from: deployerAccount,
      });
      await wethFund.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });

      await wethFund.setDaiAddress(DAIAddress, { from: deployerAccount });

      await wethFund.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );
    });

    /////////////------------------------------------ fundTree function test ----------------------------------------//

    it("Should fundTree work successfully", async () => {
      const treeId = 1;
      let amount = web3.utils.toWei("1", "Ether");

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        wethFund.address,
        deployerAccount
      );

      ////--------------add and assign allocation data for tree
      await allocationInstance.addAllocationData(
        4000,
        2000,
        1000,
        1000,
        1000,
        1000,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ////---------------transfer weth for wethFund-------------------
      await wethInstance.setMint(wethFund.address, amount);

      ////--------------------call fund tree by auction----------------

      let expectedSwapTokenAmount =
        await uniswapRouterInstance.getAmountsOut.call(
          web3.utils.toWei(".6", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      const eventTx = await wethFund.fundTree(
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
        planterAmount: (40 * amount) / 100,
        ambassadorAmount: (20 * amount) / 100,
        research: (10 * amount) / 100,
        localDevelopment: (10 * amount) / 100,
        insurance: (10 * amount) / 100,
        treasury: (10 * amount) / 100,
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

      //check wethFund totalBalances
      let totalBalances = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let totalFund = await planterFundsInstnce.totalBalances.call();

      let treeToPlanterProjectedEarnings =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(1);

      let treeToAmbassadorProjectedEarnings =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(1);

      assert.equal(
        Number(totalFund.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
        "totalFund planter funds invalid"
      );

      assert.equal(
        Number(totalFund.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
        "totalFund ambassador funds invalid"
      );

      assert.equal(
        Number(treeToPlanterProjectedEarnings),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
        "planterAmount funds invalid"
      );

      assert.equal(
        Number(treeToAmbassadorProjectedEarnings),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
        "ambassadorAmount funds invalid"
      );

      ////------------check planter fund contract balance
      let contractBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(contractBalance),
        Number(expectedSwapTokenAmount[1]),
        "Contract balance not true"
      );
    });

    it("2.Should fundTree work successfully", async () => {
      const treeId = 0;
      const treeId2 = 1;

      let amount = web3.utils.toWei(".531", "Ether");

      let amountTreeId2 = web3.utils.toWei("3.252", "Ether");

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        wethFund.address,
        deployerAccount
      );

      ////--------------add and assign allocation data for tree
      await allocationInstance.addAllocationData(
        4000,
        2000,
        1000,
        1000,
        1000,
        1000,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.addAllocationData(
        2000,
        1500,
        1200,
        1400,
        1600,
        1100,
        600,
        600,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 0, 0, {
        from: dataManager,
      });

      await allocationInstance.assignAllocationToTree(1, 1, 1, {
        from: dataManager,
      });

      ////---------------transfer weth for wethFund-------------------
      await wethInstance.setMint(wethFund.address, amount);
      await wethInstance.setMint(wethFund.address, amountTreeId2);

      ////--------------------call fund tree by auction----------------

      let expectedSwapTokenAmount =
        await uniswapRouterInstance.getAmountsOut.call(
          web3.utils.toWei(".3186", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      await wethFund.fundTree(
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
        planterAmount: (40 * amount) / 100,
        ambassadorAmount: (20 * amount) / 100,
        research: (10 * amount) / 100,
        localDevelopment: (10 * amount) / 100,
        insurance: (10 * amount) / 100,
        treasury: (10 * amount) / 100,
        reserve1: 0,
        reserve2: 0,
      };

      //check wethFund totalBalances treeId1
      let totalBalances = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let totalFund = await planterFundsInstnce.totalBalances.call();

      let treeToPlanterProjectedEarnings =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(0);
      let treeToAmbassadorProjectedEarnings =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(0);

      assert.equal(
        Number(totalFund.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
        "totalFund planter funds invalid"
      );

      assert.equal(
        Number(totalFund.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
        "totalFund ambassador funds invalid"
      );

      assert.equal(
        Number(treeToPlanterProjectedEarnings),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000)),
        "planterAmount funds invalid"
      );

      assert.equal(
        Number(treeToAmbassadorProjectedEarnings),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(2000).div(6000)),
        "ambassadorAmount funds invalid"
      );

      ////------------check planter fund contract balance
      let contractBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(contractBalance),
        Number(expectedSwapTokenAmount[1]),
        "Contract balance not true"
      );

      ////--------------------call fund tree by auction(treeId2)----------------
      let expectedSwapTokenAmountTreeId2 =
        await uniswapRouterInstance.getAmountsOut.call(
          web3.utils.toWei("1.1382", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      await wethFund.fundTree(
        treeId2,
        amountTreeId2,
        2000,
        1500,
        1200,
        1400,
        1600,
        1100,
        600,
        600,
        { from: userAccount3 }
      );

      let expectedTreeId = {
        planterAmount: (20 * amountTreeId2) / 100,
        ambassadorAmount: (15 * amountTreeId2) / 100,
        research: (12 * amountTreeId2) / 100,
        localDevelopment: (14 * amountTreeId2) / 100,
        insurance: (16 * amountTreeId2) / 100,
        treasury: (11 * amountTreeId2) / 100,
        reserve1: (6 * amountTreeId2) / 100,
        reserve2: (6 * amountTreeId2) / 100,
      };

      //check wethFund totalBalances treeId2
      let totalBalances2 = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        Math.add(expected.research, expectedTreeId.research),
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        Math.add(expected.localDevelopment, expectedTreeId.localDevelopment),
        "2-localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalances2.insurance),
        Math.add(expected.insurance, expectedTreeId.insurance),
        "2-insurance funds invalid"
      );

      assert.equal(
        Number(totalBalances2.treasury),
        Math.add(expected.treasury, expectedTreeId.treasury),
        "2-treasury funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve1),
        Math.add(expected.reserve1, expectedTreeId.reserve1),
        "2-reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalances2.reserve2),
        Math.add(expected.reserve2, expectedTreeId.reserve2),
        "2-reserve2 funds invalid"
      );

      ////--------------------------check fund planter

      let totalFund2 = await planterFundsInstnce.totalBalances.call();

      let treeToPlanterProjectedEarning2 =
        await planterFundsInstnce.treeToPlanterProjectedEarning.call(1);
      let treeToAmbassadorProjectedEarning2 =
        await planterFundsInstnce.treeToAmbassadorProjectedEarning.call(1);

      assert.equal(
        Number(totalFund2.planter),
        Number(
          Math.Big(expectedSwapTokenAmountTreeId2[1])
            .times(2000)
            .div(3500)
            .plus(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(6000))
        ),
        "2-totalFund planter funds invalid"
      );

      assert.equal(
        Number(totalFund2.ambassador),
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(2000)
            .div(6000)
            .plus(
              Math.Big(expectedSwapTokenAmountTreeId2[1]).times(1500).div(3500)
            )
        ),
        "2-totalFund ambassador funds invalid"
      );

      assert.equal(
        Number(treeToPlanterProjectedEarning2),
        Number(
          Math.Big(expectedSwapTokenAmountTreeId2[1]).times(2000).div(3500)
        ),
        "2-treeToPlanterProjectedEarning funds invalid"
      );

      assert.equal(
        Number(treeToAmbassadorProjectedEarning2),
        Number(
          Math.Big(expectedSwapTokenAmountTreeId2[1]).times(1500).div(3500)
        ),
        "2-treeToAmbassadorProjectedEarning funds invalid"
      );

      ////------------check planter fund contract balance
      let contractBalance2 = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(contractBalance2),
        Number(
          Math.Big(expectedSwapTokenAmount[1]).plus(
            expectedSwapTokenAmountTreeId2[1]
          )
        ),
        "2-Contract balance not true"
      );
    });

    it("fundTree should be fail (invalid access)", async () => {
      let amount = web3.utils.toWei(".531", "Ether");

      await allocationInstance.addAllocationData(
        2000,
        1500,
        1200,
        1400,
        1600,
        1100,
        600,
        600,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 0, 0, {
        from: dataManager,
      });

      await wethFund
        .fundTree(0, amount, 2000, 1500, 1200, 1400, 1600, 1100, 600, 600, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
    });

    //////----------------------------------withdraw research test------------------------

    it("check withdraw research data to be ok and fail in invaid situation", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      const researchAddress = userAccount3;

      const totalResearchFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), researchShare),
        10000
      );

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setResearchAddress(researchAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      const eventTx1 = await wethFund.fundTree(
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
      const eventTx2 = await wethFund.fundTree(
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

      //////////////////////// fail to withdraw

      await wethFund
        .withdrawResearchBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawResearchBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawResearchBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      let expected1 = {
        planterAmount: (planterShare * amount) / 10000,
        ambassadorAmount: (ambassadorShare * amount) / 10000,
        research: (researchShare * amount) / 10000,
        localDevelopment: (localDevelopmentShare * amount) / 10000,
        insurance: (insuranceShare * amount) / 10000,
        treasury: (treasuryShare * amount) / 10000,
        reserve1: (reserve1Share * amount) / 10000,
        reserve2: (reserve2Share * amount) / 10000,
      };

      let expected2 = {
        planterAmount: (planterShare * amount1) / 10000,
        ambassadorAmount: (ambassadorShare * amount1) / 10000,
        research: (researchShare * amount1) / 10000,
        localDevelopment: (localDevelopmentShare * amount1) / 10000,
        insurance: (insuranceShare * amount1) / 10000,
        treasury: (treasuryShare * amount1) / 10000,
        reserve1: (reserve1Share * amount1) / 10000,
        reserve2: (reserve2Share * amount1) / 10000,
      };

      truffleAssert.eventEmitted(eventTx1, "TreeFunded", (ev) => {
        return (
          Number(ev.treeId) == treeId &&
          Number(ev.amount) == Number(amount) &&
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
          Number(ev.amount) == Number(amount1) &&
          Number(ev.planterPart) ==
            Math.add(
              Number(expected2.planterAmount),
              Number(expected2.ambassadorAmount)
            )
        );
      });

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalResearchFunded,
        Number(totalBalances1.research),
        "research total fund1 is not ok"
      );

      const researchBalnance1 = await wethInstance.balanceOf(researchAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawResearchBalance(
        withdrawBalance1,
        withdrawReason,
        { from: deployerAccount }
      );

      ////////////------------- should fail after withdraw some balance and then try to withdraw
      await wethFund
        .withdrawResearchBalance(
          web3.utils.toWei("0.25"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      truffleAssert.eventEmitted(tx, "ResearchBalanceWithdrew", (ev) => {
        return (
          Number(ev.amount) == Number(withdrawBalance1) &&
          ev.account == researchAddress &&
          ev.reason == withdrawReason
        );
      });
      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const researchBalnance2 = await wethInstance.balanceOf(researchAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
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
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await wethFund.withdrawResearchBalance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const researchBalnance3 = await wethInstance.balanceOf(researchAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });

    //////----------------------------------withdraw localDevelopmen test------------------------

    it("check withdraw localDevelopmen data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
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

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setLocalDevelopmentAddress(localDevelopmentAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      await wethFund.fundTree(
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
      await wethFund.fundTree(
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
      ///////////////////// ---------------- fail to withdraw

      await wethFund
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("3"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalLocalDevelopmentFunded,
        Number(totalBalances1.localDevelopment),
        "reserve fund1 total fund1 is not ok"
      );

      const localDevelopBalnance1 = await wethInstance.balanceOf(
        localDevelopmentAddress
      );

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawLocalDevelopmentBalance(
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

      ////////////------------- should fail after withdraw some balance and then try to withdraw
      await wethFund
        .withdrawLocalDevelopmentBalance(
          web3.utils.toWei("0.25"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const localDevelopBalnance2 = await wethInstance.balanceOf(
        localDevelopmentAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.localDevelopment),
          Number(totalBalances2.localDevelopment)
        ),
        Number(withdrawBalance1),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(localDevelopBalnance2),
        Math.add(Number(localDevelopBalnance1), Number(withdrawBalance1)),
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await wethFund.withdrawLocalDevelopmentBalance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const localDevelopBalnance3 = await wethInstance.balanceOf(
        localDevelopmentAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalLocalDevelopmentFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.localDevelopment),
        "reserve fund2 total fund3 is not ok"
      );

      assert.equal(
        Number(localDevelopBalnance3),
        Math.add(Number(localDevelopBalnance2), Number(withdrawBalance2)),
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });

    //////----------------------------------withdraw insurance fund test------------------------

    it("check withdraw insurance fund data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      const insuranceAddress = userAccount3;

      const totalInsuranceFundFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), insuranceShare),
        10000
      );

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setInsuranceAddress(insuranceAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      await wethFund.fundTree(
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
      await wethFund.fundTree(
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

      ///////////////////-------------------- fail to withdraw

      await wethFund
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawInsuranceBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawInsuranceBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalInsuranceFundFunded,
        Number(totalBalances1.insurance),
        "reserve fund1 total fund1 is not ok"
      );

      const insuranceFundBalnance1 = await wethInstance.balanceOf(
        insuranceAddress
      );

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawInsuranceBalance(
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

      ////////////------------- should fail after withdraw some balance and then try to withdraw
      await wethFund
        .withdrawInsuranceBalance(
          web3.utils.toWei("0.4"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const insuranceFundBalnance2 = await wethInstance.balanceOf(
        insuranceAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.insurance),
          Number(totalBalances2.insurance)
        ),
        Number(withdrawBalance1),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(insuranceFundBalnance2),
        Math.add(Number(insuranceFundBalnance1), Number(withdrawBalance1)),
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await wethFund.withdrawInsuranceBalance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const insuranceFundBalnance3 = await wethInstance.balanceOf(
        insuranceAddress
      );

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalInsuranceFundFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.insurance),
        "reserve fund2 total fund3 is not ok"
      );

      assert.equal(
        Number(insuranceFundBalnance3),
        Math.add(Number(insuranceFundBalnance2), Number(withdrawBalance2)),
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });

    //////----------------------------------withdraw treasury test------------------------

    it("check withdraw treasury data to be ok", async () => {
      const treeId = 1;
      const treeId2 = 2;
      const amount = web3.utils.toWei("2");
      const amount1 = web3.utils.toWei("1");
      const planterShare = 5000;
      const ambassadorShare = 500;
      const researchShare = 1000;
      const localDevelopmentShare = 1000;
      const insuranceShare = 1500;
      const treasuryShare = 1000;
      const reserve1Share = 0;
      const reserve2Share = 0;

      const treasuryAddress = userAccount3;

      const totalTreasuryFunded = Math.divide(
        Math.mul(Math.add(Number(amount), Number(amount1)), treasuryShare),
        10000
      );

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setTreasuryAddress(treasuryAddress, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      await wethFund.fundTree(
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
      await wethFund.fundTree(
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

      /////////////// ---------------- fail to withdraw
      await wethFund
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawTreasuryBalance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawTreasuryBalance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalTreasuryFunded,
        Number(totalBalances1.treasury),
        "reserve fund1 total fund1 is not ok"
      );

      const treasuryBalnance1 = await wethInstance.balanceOf(treasuryAddress);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawTreasuryBalance(
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

      ////////////------------- should fail withdraw some balance and then try to withdraw
      await wethFund
        .withdrawTreasuryBalance(
          web3.utils.toWei("0.25"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const treasuryBalnance2 = await wethInstance.balanceOf(treasuryAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.treasury),
          Number(totalBalances2.treasury)
        ),
        Number(withdrawBalance1),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(treasuryBalnance2),
        Math.add(Number(treasuryBalnance1), Number(withdrawBalance1)),
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await wethFund.withdrawTreasuryBalance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const treasuryBalnance3 = await wethInstance.balanceOf(treasuryAddress);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalTreasuryFunded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.treasury),
        "reserve fund2 total fund3 is not ok"
      );

      assert.equal(
        Number(treasuryBalnance3),
        Math.add(Number(treasuryBalnance2), Number(withdrawBalance2)),
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });

    //////----------------------------------withdraw reserve1 test------------------------

    it("check withdraw reserve1 data to be ok", async () => {
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

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setReserve1Address(reserve1Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      await wethFund.fundTree(
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
      await wethFund.fundTree(
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

      ////////////////////////// --------------------- fail to withdraw

      await wethFund
        .withdrawReserve1Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawReserve1Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawReserve1Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalReserve1Funded,
        Number(totalBalances1.reserve1),
        "reserve fund1 total fund1 is not ok"
      );

      const reserve1Balnance1 = await wethInstance.balanceOf(reserve1Address);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawReserve1Balance(
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

      ////////////------------- should fail withdraw some balance and then try to withdraw
      await wethFund
        .withdrawReserve1Balance(
          web3.utils.toWei("0.25"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const reserve1Balnance2 = await wethInstance.balanceOf(reserve1Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
        "contract balance after withdraw1 is not ok"
      );

      assert.equal(
        Math.subtract(
          Number(totalBalances1.reserve1),
          Number(totalBalances2.reserve1)
        ),
        Number(withdrawBalance1),
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Number(reserve1Balnance2),
        Math.add(Number(reserve1Balnance1), Number(withdrawBalance1)),
        "reserve fund1 account balance is not ok after withdraw1"
      );

      // -------------------- seccond withdraw and check data ------------------------------

      const withdrawBalance2 = web3.utils.toWei("0.2");

      const tx2 = await wethFund.withdrawReserve1Balance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const reserve1Balnance3 = await wethInstance.balanceOf(reserve1Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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
        "reserve fund2 total fund is not ok after withdraw1"
      );

      assert.equal(
        Math.subtract(
          totalReserve1Funded,
          Math.add(Number(withdrawBalance1), Number(withdrawBalance2))
        ),
        Number(totalBalances3.reserve1),
        "reserve fund2 total fund3 is not ok"
      );

      assert.equal(
        Number(reserve1Balnance3),
        Math.add(Number(reserve1Balnance2), Number(withdrawBalance2)),
        "reserve fund2 account balance is not ok after withdraw2"
      );
    });

    //////----------------------------------withdraw reserve2 test------------------------

    it("check withdraw reserve2 data to be ok", async () => {
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

      const wethFundContractShare = Math.divide(
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
        wethFund.address,
        deployerAccount
      );

      /////////// ------------------ set addresses
      await wethFund.setReserve2Address(reserve2Address, {
        from: deployerAccount,
      });

      ///////// ------------------ handle dm model
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

      //////////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, amount);

      await wethInstance.setMint(wethFund.address, amount1);

      ////////---------------fund trees-------------------

      await wethFund.fundTree(
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
      await wethFund.fundTree(
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

      /////////////////// --------------------- fail to withdraw
      await wethFund
        .withdrawReserve2Balance(
          web3.utils.toWei("0.2"),
          "reason to withdraw",
          {
            from: userAccount7,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await wethFund
        .withdrawReserve2Balance(web3.utils.toWei("0"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await wethFund
        .withdrawReserve2Balance(web3.utils.toWei("3"), "reason to withdraw", {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      // -------------------------- check data before withdraw -----------------
      const contractBalanceAfterFund = await wethInstance.balanceOf(
        wethFund.address
      );

      const totalBalances1 = await wethFund.totalBalances();

      assert.equal(
        Number(contractBalanceAfterFund),
        wethFundContractShare,
        "contract balance after fund is not ok"
      );

      assert.equal(
        totalReserve2Funded,
        Number(totalBalances1.reserve2),
        "reserve fund2 total fund1 is not ok"
      );

      const reserve2Balnance1 = await wethInstance.balanceOf(reserve2Address);

      // --------------------- first withdraw and check data ------------------
      const withdrawBalance1 = web3.utils.toWei("0.1");

      const tx = await wethFund.withdrawReserve2Balance(
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

      ////////////------------- should fail withdraw some balance and then try to withdraw
      await wethFund
        .withdrawReserve2Balance(
          web3.utils.toWei("0.25"),
          "reason to withdraw",
          {
            from: deployerAccount,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      const totalBalances2 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw1 = await wethInstance.balanceOf(
        wethFund.address
      );

      const reserve2Balnance2 = await wethInstance.balanceOf(reserve2Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw1),
        Math.subtract(wethFundContractShare, Number(withdrawBalance1)),
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

      const tx2 = await wethFund.withdrawReserve2Balance(
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

      const totalBalances3 = await wethFund.totalBalances();

      const contractBalanceAfterWithdraw2 = await wethInstance.balanceOf(
        wethFund.address
      );

      const reserve2Balnance3 = await wethInstance.balanceOf(reserve2Address);

      assert.equal(
        Number(contractBalanceAfterWithdraw2),
        Math.subtract(
          wethFundContractShare,
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

    it("2.Should fundTreeBatch work successfully", async () => {
      const totalPlanterAmount1 = web3.utils.toWei("5");
      const totalAmbassadorAmount1 = web3.utils.toWei("4");
      const totalResearch1 = web3.utils.toWei("2");
      const totalLocalDevelop1 = web3.utils.toWei("1");
      const totalInsurance1 = web3.utils.toWei("2");
      const totalTreasury1 = web3.utils.toWei("2");
      const totalReserve1_1 = web3.utils.toWei("2.5");
      const totalReserve2_1 = web3.utils.toWei("1");
      const total1 = web3.utils.toWei("19.5"); //total amount of above shares

      const totalPlanterAmount2 = web3.utils.toWei("7");
      const totalAmbassadorAmount2 = web3.utils.toWei("2");
      const totalResearch2 = web3.utils.toWei("1");
      const totalLocalDevelop2 = web3.utils.toWei("3");
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
        wethFund.address,
        deployerAccount
      );

      ////---------------transfer weth for wethFund-------------------
      await wethInstance.setMint(wethFund.address, total1);
      await wethInstance.setMint(wethFund.address, total2);

      ////--------------------call fund tree by auction----------------

      let expectedSwapTokenAmount =
        await uniswapRouterInstance.getAmountsOut.call(web3.utils.toWei("9"), [
          wethInstance.address,
          daiInstance.address,
        ]);

      ////////////// fail to call incremental fund because caller is not treejer contract
      await wethFund
        .fundTreeBatch(
          totalPlanterAmount1,
          totalAmbassadorAmount1,
          totalResearch1,
          totalLocalDevelop1,
          totalInsurance1,
          totalTreasury1,
          totalReserve1_1,
          totalReserve2_1,
          { from: userAccount4 }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      const eventTx1 = await wethFund.fundTreeBatch(
        totalPlanterAmount1,
        totalAmbassadorAmount1,
        totalResearch1,
        totalLocalDevelop1,
        totalInsurance1,
        totalTreasury1,
        totalReserve1_1,
        totalReserve2_1,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(eventTx1, "TreeFundedBatch");

      //check wethFund totalBalances treeId1
      let totalBalances = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances.research),
        Number(totalResearch1),
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalances.localDevelopment),
        Number(totalLocalDevelop1),
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
        Number(expectedSwapTokenAmount[1]),
        "Contract balance not true"
      );

      // ////--------------------call fund tree by auction(treeId2)----------------
      let expectedSwapTokenAmountTreeId2 =
        await uniswapRouterInstance.getAmountsOut.call(web3.utils.toWei("9"), [
          wethInstance.address,
          daiInstance.address,
        ]);

      const eventTx2 = await wethFund.fundTreeBatch(
        totalPlanterAmount2,
        totalAmbassadorAmount2,
        totalResearch2,
        totalLocalDevelop2,
        totalInsurance2,
        totalTreasury2,
        totalReserve1_2,
        totalReserve2_2,
        { from: userAccount3 }
      );

      truffleAssert.eventEmitted(eventTx2, "TreeFundedBatch");

      // //check wethFund totalBalances treeId2
      let totalBalances2 = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances2.research),
        Math.add(totalResearch1, totalResearch2),
        "2-research funds invalid"
      );

      assert.equal(
        Number(totalBalances2.localDevelopment),
        Math.add(totalLocalDevelop1, totalLocalDevelop2),
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
          Math.Big(expectedSwapTokenAmount[1]).plus(
            expectedSwapTokenAmountTreeId2[1]
          )
        ),
        "2-Contract balance not true"
      );
    });

    ///////---------------------------------- test updateDaiDebtToPlanterContract -----------------------

    it("Should updateDaiDebtToPlanterContract work successFully and fail in invalid situation ", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      //////////////// --------------------- fail because caller is not treejer contract
      await wethFund
        .updateDaiDebtToPlanterContract(web3.utils.toWei("12", "Ether"), {
          from: userAccount4,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await wethFund.updateDaiDebtToPlanterContract(
        web3.utils.toWei("12", "Ether"),
        {
          from: userAccount3,
        }
      );

      assert.equal(
        Number(await wethFund.totalDaiDebtToPlanterContract()),
        12e18,
        "2-Contract balance not true"
      );
    });

    ///////---------------------------------- test payDaiDebtToPlanterContract -----------------------

    it("Should payDaiDebtToPlanterContract work successfully", async () => {
      const totalTreasury2 = web3.utils.toWei("2");

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        wethFund.address,
        deployerAccount
      );

      ////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, totalTreasury2);

      // ////--------------------call fund tree by auction(treeId2)----------------

      await wethFund.fundTreeBatch(0, 0, 0, 0, 0, totalTreasury2, 0, 0, {
        from: userAccount3,
      });

      await wethFund.updateDaiDebtToPlanterContract(
        web3.utils.toWei("1000", "Ether"),
        {
          from: userAccount3,
        }
      );
      const totalDaiDebtToPlanterContractBeforeSwap =
        await wethFund.totalDaiDebtToPlanterContract();

      assert.equal(
        Number(totalDaiDebtToPlanterContractBeforeSwap),
        web3.utils.toWei("1000", "Ether"),
        "totalDaiDebtToPlanterContract not true"
      );

      let expectedSwapTokenAmountTreeId2 =
        await uniswapRouterInstance.getAmountsIn.call(
          web3.utils.toWei("500", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      const eventTx = await wethFund.payDaiDebtToPlanterContract(
        expectedSwapTokenAmountTreeId2[0],
        web3.utils.toWei("500", "Ether"),
        {
          from: funderRank,
        }
      );

      truffleAssert.eventEmitted(
        eventTx,
        "DaiDebtToPlanterContractPaid",
        (ev) => {
          return (
            Number(ev.wethMaxUse) ==
              Number(expectedSwapTokenAmountTreeId2[0]) &&
            Number(ev.daiAmount) == Number(web3.utils.toWei("500", "Ether")) &&
            Number(ev.wethAmount) == Number(expectedSwapTokenAmountTreeId2[0])
          );
        }
      );

      ////------------check planter fund contract balance
      let planterFundBalance = await daiInstance.balanceOf(
        planterFundsInstnce.address
      );

      assert.equal(
        Number(planterFundBalance),
        Number(web3.utils.toWei("500", "Ether")),
        "planterFund not true"
      );

      ////------------check planter fund contract balance
      let wethFundBalance = await wethInstance.balanceOf(wethFund.address);

      assert.equal(
        Number(wethFundBalance),
        Number(
          Math.Big(totalTreasury2).minus(expectedSwapTokenAmountTreeId2[0])
        ),
        "wethFund not true"
      );

      assert.equal(
        Number(await wethFund.totalDaiDebtToPlanterContract()),
        Number(web3.utils.toWei("500", "Ether")),
        "totalDaiDebtToPlanterContract not true"
      );

      let totalBalances = await wethFund.totalBalances();

      assert.equal(
        Number(totalBalances.treasury),
        Number(
          Math.Big(totalTreasury2).minus(expectedSwapTokenAmountTreeId2[0])
        ),
        "treasury funds invalid"
      );
    });

    it("Should payDaiDebtToPlanterContract reject (Liquidity not enough)", async () => {
      const totalTreasury2 = web3.utils.toWei("1.9");

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        wethFund.address,
        deployerAccount
      );

      ////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, totalTreasury2);

      // ////--------------------call fund tree by auction(treeId2)----------------

      await wethFund.fundTreeBatch(0, 0, 0, 0, 0, totalTreasury2, 0, 0, {
        from: userAccount3,
      });

      await wethFund.updateDaiDebtToPlanterContract(
        web3.utils.toWei("4000", "Ether"),
        {
          from: userAccount3,
        }
      );

      let expectedSwapTokenAmountTreeId2 =
        await uniswapRouterInstance.getAmountsIn.call(
          web3.utils.toWei("4000", "Ether"),
          [wethInstance.address, daiInstance.address]
        );

      await wethFund
        .payDaiDebtToPlanterContract(
          expectedSwapTokenAmountTreeId2[0],
          web3.utils.toWei("4000", "Ether"),
          {
            from: funderRank,
          }
        )
        .should.be.rejectedWith(WethFundErrorMsg.LIQUDITY_NOT_ENOUGH);
    });

    it("Should payDaiDebtToPlanterContract reject (totalDaiDebtToPlanterContract not be zero) and when caller is not script", async () => {
      const totalTreasury2 = web3.utils.toWei("2");

      ////--------------check set role----------------
      await Common.addTreejerContractRole(
        arInstance,
        userAccount3,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        wethFund.address,
        deployerAccount
      );

      ////---------------transfer weth for wethFund-------------------

      await wethInstance.setMint(wethFund.address, totalTreasury2);

      // ////--------------------call fund tree by auction(treeId2)----------------

      await wethFund.fundTreeBatch(0, 0, 0, 0, 0, totalTreasury2, 0, 0, {
        from: userAccount3,
      });

      let expectedSwapTokenAmountTreeId2 =
        await uniswapRouterInstance.getAmountsIn.call(
          web3.utils.toWei("1000", "Ether"),
          [wethInstance.address, daiInstance.address]
        );
      ////////////////// fail because caller is not script role
      await wethFund
        .payDaiDebtToPlanterContract(
          expectedSwapTokenAmountTreeId2[0],
          web3.utils.toWei("1000", "Ether"),
          {
            from: userAccount3,
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_SCRIPT_ROLE);

      await wethFund
        .payDaiDebtToPlanterContract(expectedSwapTokenAmountTreeId2[0], 0, {
          from: funderRank,
        })
        .should.be.rejectedWith(WethFundErrorMsg.TOTALDAI_INVALID);

      await wethFund.updateDaiDebtToPlanterContract(
        web3.utils.toWei("1000", "Ether"),
        {
          from: userAccount3,
        }
      );

      assert.equal(
        await wethFund.totalDaiDebtToPlanterContract(),
        web3.utils.toWei("1000", "Ether"),
        "totalDaiDebtToPlanterContract not true"
      );

      await wethFund
        .payDaiDebtToPlanterContract(
          expectedSwapTokenAmountTreeId2[0],
          web3.utils.toWei("2000", "Ether"),
          {
            from: funderRank,
          }
        )
        .should.be.rejectedWith(WethFundErrorMsg.TOTALDAI_INVALID);

      let eventTx = await wethFund.payDaiDebtToPlanterContract(
        expectedSwapTokenAmountTreeId2[0],
        web3.utils.toWei("1000", "Ether"),
        {
          from: funderRank,
        }
      );

      assert.equal(
        await wethFund.totalDaiDebtToPlanterContract(),
        0,
        "totalDaiDebtToPlanterContract not true"
      );

      truffleAssert.eventEmitted(
        eventTx,
        "DaiDebtToPlanterContractPaid",
        (ev) => {
          return (
            Number(ev.wethMaxUse) ==
              Number(expectedSwapTokenAmountTreeId2[0]) &&
            Number(ev.daiAmount) == Number(web3.utils.toWei("1000", "Ether")) &&
            Number(ev.wethAmount) == Number(expectedSwapTokenAmountTreeId2[0])
          );
        }
      );
    });
  });
});
