const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");

const Tree = artifacts.require("Tree.sol");
//treasury section
const WethFunds = artifacts.require("WethFunds.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const Weth = artifacts.require("Weth.sol");

//uniswap
var Factory = artifacts.require("Factory.sol");
var Dai = artifacts.require("Dai.sol");
var UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const { CommonErrorMsg, TreeAttributeErrorMsg } = require("./enumes");

contract("TreeAttribute", (accounts) => {
  let iSellInstance;
  let arInstance;

  let treeAttributeInstance;
  let financialModelInstance;
  let wethFundsInstance;
  let planterFundsInstnce;
  let wethInstance;
  let daiInstance;
  let factoryInstance;
  let uniswapRouterInstance;
  let testUniswapInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    treeAttributeInstance = await deployProxy(
      TreeAttribute,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterFundsInstnce = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    ////--------------------------uniswap deploy

    factoryInstance = await Factory.new(accounts[2], { from: deployerAccount });
    const factoryAddress = factoryInstance.address;

    wethInstance = await Weth.new("WETH", "weth", { from: accounts[0] });
    const WETHAddress = wethInstance.address;

    daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });
    const DAIAddress = daiInstance.address;

    uniswapRouterInstance = await UniswapV2Router02New.new(
      factoryAddress,
      WETHAddress,
      { from: deployerAccount }
    );
    const uniswapV2Router02NewAddress = uniswapRouterInstance.address;

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

    /////////////////////////////////////////////////////////////////////////////////

    await treeAttributeInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });
    ////////////////////////// set weth funds address

    await wethFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );

    await wethFundsInstance.setUniswapRouterAddress(
      uniswapV2Router02NewAddress,
      {
        from: deployerAccount,
      }
    );

    await wethFundsInstance.setWethTokenAddress(WETHAddress, {
      from: deployerAccount,
    });

    await wethFundsInstance.setDaiAddress(DAIAddress, {
      from: deployerAccount,
    });
  });
  afterEach(async () => {});

  it("deploys successfully", async () => {
    const address = treeAttributeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("only admin can set treeFactory address", async () => {
    await treeAttributeInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //only admin can call
  });

  it("only admin can call set buyer rank", async () => {
    await treeAttributeInstance
      .setBuyerRank(
        userAccount3,
        web3.utils.toWei("100", "finney"),
        web3.utils.toWei("2"),
        10,
        59,
        {
          from: userAccount3,
        }
      )
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //only admin can call
  });
  it("only admin can call set buyer rank true", async () => {
    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      web3.utils.toWei("100", "finney"),
      web3.utils.toWei("2"),
      10,
      59,
      {
        from: deployerAccount,
      }
    );
  });

  it("tree attributes are not available to reserve", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance
      .reserveTreeAttributes(13000000, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });
  it("attributes to assign tree should be available", async () => {
    const treeAttributeGenerateCode = 13000000;

    await treeAttributeInstance.reserveTreeAttributes(
      treeAttributeGenerateCode,
      {
        from: deployerAccount,
      }
    );

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(
      101,
      treeAttributeGenerateCode,
      {
        from: deployerAccount,
      }
    );

    await treeAttributeInstance
      .setTreeAttributesByAdmin(102, treeAttributeGenerateCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });

  it("tree has attributes before", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(101, 13000000, {
      from: deployerAccount,
    });
    const eventTx = await treeAttributeInstance
      .setTreeAttributesByAdmin(100, 13000002, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("tree has attributes before", async () => {
    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });
    await treeAttributeInstance.setTreeAttributesByAdmin(107, 13000001, {
      from: deployerAccount,
    });
    await treeAttributeInstance
      .createTreeAttributes(107, 13000002, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("tree check for attribute assignment", async () => {
    financialModelInstance = await deployProxy(
      FinancialModel,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      100,
      10000,
      0,
      {
        from: deployerAccount,
      }
    );

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.005"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await Common.addFundsRole(
      arInstance,
      wethFundsInstance.address,
      deployerAccount
    );

    await iSellInstance.buyTree(102, {
      from: userAccount3,
    });

    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance.createTreeAttributes(
      102,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await treeAttributeInstance
      .createTreeAttributes(103, web3.utils.toWei("0.01"), {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });

  it("tree check for attribute assignment", async () => {
    financialModelInstance = await deployProxy(
      FinancialModel,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    await iSellInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await iSellInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );

    await financialModelInstance.addFundDistributionModel(
      3000,
      1200,
      1200,
      1200,
      1200,
      2200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(
      100,
      10000,
      0,
      {
        from: deployerAccount,
      }
    );

    await iSellInstance.addTreeSells(
      101,
      web3.utils.toWei("0.005"),
      100,
      100,
      1000,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    //mint weth for funder
    await wethInstance.setMint(userAccount3, web3.utils.toWei("0.01"));

    await wethInstance.approve(
      iSellInstance.address,
      web3.utils.toWei("0.01"),
      {
        from: userAccount3,
      }
    );

    await Common.addFundsRole(
      arInstance,
      wethFundsInstance.address,
      deployerAccount
    );

    await iSellInstance.buyTree(102, {
      from: userAccount3,
    });

    await treeAttributeInstance.reserveTreeAttributes(13000000, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(100, 13000001, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .createTreeAttributes(102, web3.utils.toWei("0.01"), {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });
});
