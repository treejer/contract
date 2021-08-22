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

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

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
  const userAccount8 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  // beforeAll(async () => {});

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

  it("deploys successfully", async () => {
    const address = treeAttributeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ///////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set tree factory address", async () => {
    await treeAttributeInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treeAttributeInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      treeFactoryInstance.address,
      await treeAttributeInstance.treeFactory(),
      "address set incorect"
    );
  });

  ///////////////---------------------------------set Trusted Forwarder address--------------------------------------------------------
  it("set Trusted Forwarder address", async () => {
    await treeAttributeInstance
      .setTrustedForwarder(zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

    await treeAttributeInstance
      .setTrustedForwarder(userAccount1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treeAttributeInstance.setTrustedForwarder(userAccount1, {
      from: deployerAccount,
    });

    assert.equal(
      userAccount1,
      await treeAttributeInstance.trustedForwarder(),
      "address set incorect"
    );
  });

  ///////////////---------------------------------test reserveTreeAttributes function--------------------------------------------------------
  it("Should reserveTreeAttributes work successfully", async () => {
    let generatedCode = 2 ** 32 - 1;

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    let generatedAttribute = await treeAttributeInstance.generatedAttributes(
      generatedCode
    );

    let reservedAttribute = await treeAttributeInstance.reservedAttributes(
      generatedCode
    );

    assert.equal(generatedAttribute, 1, "generatedAttribute not true");

    assert.equal(reservedAttribute, 1, "reservedAttribute not true");

    //////test 2

    let generatedCode2 = 0;

    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await treeAttributeInstance.reserveTreeAttributes(generatedCode2, {
      from: userAccount2,
    });

    let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
      generatedCode2
    );

    let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
      generatedCode2
    );

    assert.equal(generatedAttribute2, 1, "2 - generatedAttribute not true");

    assert.equal(reservedAttribute2, 1, "2 - reservedAttribute not true");
  });

  it("Should reserveTreeAttributes rejec because generatedCode has been reserved before", async () => {
    let generatedCode = 12500123;

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .reserveTreeAttributes(generatedCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_TAKEN);
  });

  it("Should reserveTreeAttributes rejec because caller must be admin or communityGifts", async () => {
    let generatedCode = 12500123;

    await treeAttributeInstance
      .reserveTreeAttributes(generatedCode)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_TREEJER_CONTRACT);
  });

  ///////////////---------------------------------test freeReserveTreeAttributes function--------------------------------------------------------

  it("Should freeReserveTreeAttributes work successfully", async () => {
    let generatedCode = 2 ** 32 - 1;

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance.freeReserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    let generatedAttribute = await treeAttributeInstance.generatedAttributes(
      generatedCode
    );

    let reservedAttribute = await treeAttributeInstance.reservedAttributes(
      generatedCode
    );

    assert.equal(generatedAttribute, 0, "generatedAttribute not true");

    assert.equal(reservedAttribute, 0, "reservedAttribute not true");

    //////test 2

    let generatedCode2 = 0;

    await Common.addTreejerContractRole(
      arInstance,
      userAccount2,
      deployerAccount
    );

    await treeAttributeInstance.reserveTreeAttributes(generatedCode2, {
      from: userAccount2,
    });

    await treeAttributeInstance.freeReserveTreeAttributes(generatedCode2, {
      from: userAccount2,
    });

    let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
      generatedCode2
    );

    let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
      generatedCode2
    );

    assert.equal(generatedAttribute2, 0, "2 - generatedAttribute not true");

    assert.equal(reservedAttribute2, 0, "2 - reservedAttribute not true");
  });

  it("Should freeReserveTreeAttributes rejec because generatedCode hasn't been reserved before", async () => {
    let generatedCode = 12500123;

    await treeAttributeInstance
      .freeReserveTreeAttributes(generatedCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.ATTRIBUTE_NOT_RESERVED);
  });

  it("Should freeReserveTreeAttributes rejec because caller must be admin or communityGifts", async () => {
    let generatedCode = 12500123;

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .freeReserveTreeAttributes(generatedCode)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_TREEJER_CONTRACT);
  });

  ///////////////---------------------------------test setTreeAttributesByAdmin function--------------------------------------------------------
  it("Should setTreeAttributesByAdmin work successFully", async () => {
    let generatedCode = 3988700315;
    let treeId = 0;
    let generatedCodeBase2 = 11101101101111101011110010011011;

    let expectedAttribute = {
      treeType: 27, //011011
      groundType: 2, //010
      trunkColor: 14, //1110
      crownColor: 5, //0101
      groundColor: 7, //111
      specialEffects: 11, //1011
    };

    await treeAttributeInstance.setTreeAttributesByAdmin(
      treeId,
      generatedCode,
      {
        from: deployerAccount,
      }
    );

    let treeAttribute = await treeAttributeInstance.treeAttributes(treeId);

    let generatedAttribute = await treeAttributeInstance.generatedAttributes(
      generatedCode
    );

    let reservedAttribute = await treeAttributeInstance.reservedAttributes(
      generatedCode
    );

    assert.equal(
      Number(generatedAttribute),
      1,
      "1 - generatedAttribute not true"
    );

    assert.equal(
      Number(reservedAttribute),
      0,
      "1 - reservedAttribute not true"
    );

    assert.equal(
      Number(treeAttribute.treeType),
      expectedAttribute.treeType,
      "1 - Tree type not true"
    );

    assert.equal(
      Number(treeAttribute.groundType),
      expectedAttribute.groundType,
      "1 - Ground type not true"
    );

    assert.equal(
      Number(treeAttribute.trunkColor),
      expectedAttribute.trunkColor,
      "1 - Trunk color not true"
    );

    assert.equal(
      Number(treeAttribute.crownColor),
      expectedAttribute.crownColor,
      "1 - Crown color not true"
    );

    assert.equal(
      Number(treeAttribute.groundColor),
      expectedAttribute.groundColor,
      "1 - Ground color not true"
    );

    assert.equal(
      Number(treeAttribute.specialEffects),
      expectedAttribute.specialEffects,
      "1 - Special effects not true"
    );
    assert.equal(
      Number(treeAttribute.universalCode),
      generatedCode,
      "1 - Generated code not true"
    );

    assert.equal(Number(treeAttribute.exists), 1, "1 - Exists not true");

    ////-------------------------test2

    let generatedCode2 = 4294967295;
    let treeId2 = 1;
    let generatedCode2Base2 = 11111111111111111111111111111111;

    let expectedAttribute2 = {
      treeType: 63, //111111
      groundType: 7, //111
      trunkColor: 15, //1111
      crownColor: 15, //1111
      groundColor: 7, //111
      specialEffects: 15, //1111
    };

    await treeAttributeInstance.setTreeAttributesByAdmin(
      treeId2,
      generatedCode2,
      {
        from: deployerAccount,
      }
    );

    let treeAttribute2 = await treeAttributeInstance.treeAttributes(treeId2);

    let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
      generatedCode2
    );

    let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
      generatedCode2
    );

    assert.equal(generatedAttribute2, 1, "2 - generatedAttribute not true");

    assert.equal(reservedAttribute2, 0, "2 - reservedAttribute not true");

    assert.equal(
      Number(treeAttribute2.treeType),
      expectedAttribute2.treeType,
      "2 - Tree type not true"
    );

    assert.equal(
      Number(treeAttribute2.groundType),
      expectedAttribute2.groundType,
      "2 - Ground type not true"
    );

    assert.equal(
      Number(treeAttribute2.trunkColor),
      expectedAttribute2.trunkColor,
      "2 - Trunk color not true"
    );

    assert.equal(
      Number(treeAttribute2.crownColor),
      expectedAttribute2.crownColor,
      "2 - Crown color not true"
    );

    assert.equal(
      Number(treeAttribute2.groundColor),
      expectedAttribute2.groundColor,
      "2 - Ground color not true"
    );

    assert.equal(
      Number(treeAttribute2.specialEffects),
      expectedAttribute2.specialEffects,
      "2 - Special effects not true"
    );
    assert.equal(
      Number(treeAttribute2.universalCode),
      generatedCode2,
      "2 - Generated code not true"
    );

    assert.equal(Number(treeAttribute2.exists), 1, "2 - Exists not true");

    ////-------------------------test3

    let generatedCode3 = 0;
    let treeId3 = 2;
    let generatedCode3Base2 = 00000000000000000000000000000000;

    let expectedAttribute3 = {
      treeType: 0, //000000
      groundType: 0, //000
      trunkColor: 0, //0000
      crownColor: 0, //0000
      groundColor: 0, //000
      specialEffects: 0, //0000
    };

    await treeAttributeInstance.setTreeAttributesByAdmin(
      treeId3,
      generatedCode3,
      {
        from: deployerAccount,
      }
    );

    let treeAttribute3 = await treeAttributeInstance.treeAttributes(treeId3);

    let generatedAttribute3 = await treeAttributeInstance.generatedAttributes(
      generatedCode3
    );

    let reservedAttribute3 = await treeAttributeInstance.reservedAttributes(
      generatedCode3
    );

    assert.equal(generatedAttribute3, 1, "3 - generatedAttribute not true");

    assert.equal(reservedAttribute3, 0, "3 - reservedAttribute not true");

    assert.equal(
      Number(treeAttribute3.treeType),
      expectedAttribute3.treeType,
      "3 - Tree type not true"
    );

    assert.equal(
      Number(treeAttribute3.groundType),
      expectedAttribute3.groundType,
      "3 - Ground type not true"
    );

    assert.equal(
      Number(treeAttribute3.trunkColor),
      expectedAttribute3.trunkColor,
      "3 - Trunk color not true"
    );

    assert.equal(
      Number(treeAttribute3.crownColor),
      expectedAttribute3.crownColor,
      "3 - Crown color not true"
    );

    assert.equal(
      Number(treeAttribute3.groundColor),
      expectedAttribute3.groundColor,
      "3 - Ground color not true"
    );

    assert.equal(
      Number(treeAttribute3.specialEffects),
      expectedAttribute3.specialEffects,
      "3 - Special effects not true"
    );
    assert.equal(
      Number(treeAttribute3.universalCode),
      generatedCode3,
      "3 - Generated code not true"
    );

    assert.equal(Number(treeAttribute2.exists), 1, "3 - Exists not true");
  });

  it("Should setTreeAttributesByAdmin rejec because caller must be admin or communityGifts", async () => {
    let generatedCode = 12500123;

    await treeAttributeInstance
      .setTreeAttributesByAdmin(0, generatedCode)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_TREEJER_CONTRACT);
  });

  it("Should setTreeAttributesByAdmin rejec because generatedCode has been generated before and not resreved", async () => {
    let generatedCode = 12500123;
    let generatedCode2 = 12332;

    ///------test reserve before (work successfully)

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance.setTreeAttributesByAdmin(10, generatedCode, {
      from: deployerAccount,
    });

    ///------test generate before (fail)

    await treeAttributeInstance.setTreeAttributesByAdmin(11, generatedCode2, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .setTreeAttributesByAdmin(16, generatedCode2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);
  });

  it("Should setTreeAttributesByAdmin rejec because attributes are set before", async () => {
    let generatedCode = 12500123;
    let generatedCode2 = 12332;

    ///------test generate before

    await treeAttributeInstance.setTreeAttributesByAdmin(11, generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .setTreeAttributesByAdmin(11, generatedCode2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("Should setBuyerRank work successFully", async () => {
    //

    ////--------test treejerSpent 2--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount2,
      web3.utils.toWei(".012"), // 30 points(rank must be 0)
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank2 = await treeAttributeInstance.rankOf(userAccount2);

    assert.equal(Number(testRank2), 0, "2-rank is not true");

    ////--------test treejerSpent--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount2,
      web3.utils.toWei(".016"), // 31 points(rank must be 1)
      0,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank = await treeAttributeInstance.rankOf(userAccount2);

    assert.equal(Number(testRank), 1, "1-rank is not true");

    ////--------test walletSpent(test2)--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      0,
      web3.utils.toWei("15"), // 30 points(rank must be 0)
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank4 = await treeAttributeInstance.rankOf(userAccount3);

    assert.equal(Number(testRank4), 0, "4-rank is not true");

    ////--------test walletSpent--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      0,
      web3.utils.toWei("15.5"), // 31 points(rank must be 1)
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank3 = await treeAttributeInstance.rankOf(userAccount3);

    assert.equal(Number(testRank3), 1, "3-rank is not true");

    ////--------test treesOwned--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount4,
      0,
      0,
      0,
      30, // 30 points(rank must be 0)
      {
        from: deployerAccount,
      }
    );

    let testRank5 = await treeAttributeInstance.rankOf(userAccount4);

    assert.equal(Number(testRank5), 0, "5-rank is not true");

    ////--------test treesOwned(test2)--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount4,
      0,
      0,
      0,
      31, // 31 points(rank must be 1)
      {
        from: deployerAccount,
      }
    );

    let testRank6 = await treeAttributeInstance.rankOf(userAccount4);

    assert.equal(Number(testRank6), 1, "6-rank is not true");

    ////--------test treesOwned--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount6,
      0,
      0,
      3, // 30 points(rank must be 0)
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank7 = await treeAttributeInstance.rankOf(userAccount6);

    assert.equal(Number(testRank7), 0, "7-rank is not true");

    ////--------test treesOwned(test2)--------------------

    await treeAttributeInstance.setBuyerRank(
      userAccount6,
      0,
      0,
      4, // 40 points(rank must be 1)
      0,
      {
        from: deployerAccount,
      }
    );

    let testRank8 = await treeAttributeInstance.rankOf(userAccount6);

    assert.equal(Number(testRank8), 1, "8-rank is not true");

    ///----------------------------test(range 0---31)---------------------------

    ////--------------------test1
    await treeAttributeInstance.setBuyerRank(
      userAccount7,
      web3.utils.toWei(".004"),
      web3.utils.toWei("2"),
      1,
      6,
      {
        from: deployerAccount,
      }
    );

    let testRank9 = await treeAttributeInstance.rankOf(userAccount7);

    assert.equal(Number(testRank9), 0, "9-rank is not true");

    ////--------------------test2
    await treeAttributeInstance.setBuyerRank(
      userAccount7,
      web3.utils.toWei(".004"),
      web3.utils.toWei("3"),
      1,
      5,
      {
        from: deployerAccount,
      }
    );

    let testRank10 = await treeAttributeInstance.rankOf(userAccount7);

    assert.equal(Number(testRank10), 1, "10-rank is not true");

    ///----------------------------test(range 31---61)---------------------------

    ////--------------------test1
    await treeAttributeInstance.setBuyerRank(
      userAccount2,
      web3.utils.toWei(".012"),
      web3.utils.toWei("1"),
      2,
      8,
      {
        from: deployerAccount,
      }
    );

    let testRank11 = await treeAttributeInstance.rankOf(userAccount2);

    assert.equal(Number(testRank11), 1, "11-rank is not true");

    ////--------------------test2
    await treeAttributeInstance.setBuyerRank(
      userAccount2,
      web3.utils.toWei(".016"),
      web3.utils.toWei("4"),
      1,
      3,
      {
        from: deployerAccount,
      }
    );

    let testRank12 = await treeAttributeInstance.rankOf(userAccount2);

    assert.equal(Number(testRank12), 2, "12-rank is not true");

    ///----------------------------test(range 61---201)---------------------------

    ////--------------------test1
    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      web3.utils.toWei(".02"),
      web3.utils.toWei("30"),
      5,
      40,
      {
        from: deployerAccount,
      }
    );

    let testRank13 = await treeAttributeInstance.rankOf(userAccount3);

    assert.equal(Number(testRank13), 2, "13-rank is not true");

    ////--------------------test2
    await treeAttributeInstance.setBuyerRank(
      userAccount3,
      web3.utils.toWei("0"),
      web3.utils.toWei("5.5"),
      11,
      80,
      {
        from: deployerAccount,
      }
    );

    let testRank14 = await treeAttributeInstance.rankOf(userAccount3);

    assert.equal(Number(testRank14), 3, "14-rank is not true");

    ///----------------------------test(range 201---1001)---------------------------

    ////--------------------test1
    await treeAttributeInstance.setBuyerRank(
      userAccount4,
      web3.utils.toWei(".2"),
      web3.utils.toWei("50"),
      25,
      150,
      {
        from: deployerAccount,
      }
    );

    let testRank15 = await treeAttributeInstance.rankOf(userAccount4);

    assert.equal(Number(testRank15), 3, "15-rank is not true");

    ////--------------------test2
    await treeAttributeInstance.setBuyerRank(
      userAccount4,
      web3.utils.toWei(".24"),
      web3.utils.toWei("200"),
      0,
      1,
      {
        from: deployerAccount,
      }
    );

    let testRank16 = await treeAttributeInstance.rankOf(userAccount4);

    assert.equal(Number(testRank16), 4, "16-rank is not true");

    ////---------test zero

    await treeAttributeInstance.setBuyerRank(userAccount1, 0, 0, 0, 0, {
      from: deployerAccount,
    });

    let testRank17 = await treeAttributeInstance.rankOf(userAccount1);

    assert.equal(Number(testRank17), 0, "17-rank is not true");
  });

  it("Should setBuyerRank rejec because caller must be admin", async () => {
    await treeAttributeInstance
      .setBuyerRank(userAccount1, 0, 0, 0, 0)
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  // it("Should createTreeAttributes work successfully", async () => {
  //   ///------------------------------expected for tree with id 102
  //   let rand102 = 136929780; //10000010 100 1011 0000 111 110100
  //   let generatedCode102 = 2712052; //10 10010110000111110100
  //   let expectedAttribute102 = {
  //     treeType: 52, //110100
  //     groundType: 7, //111
  //     trunkColor: 0, //0000
  //     crownColor: 11, //1011
  //     groundColor: 4, //100
  //     specialEffects: 130,
  //     specialEffectsFinal: 2,
  //     universalCode: 2712052, //10 10010110000111110100
  //   };
  //   /////------------------------------expected for tree with id 150
  //   let rand150 = 233875876; //11011111 000 0101 0100 110 100100
  //   let generatedCode150 = 8432036; //1000 00001010100110100100
  //   let expectedAttribute150 = {
  //     treeType: 36, //100100
  //     groundType: 6, //110
  //     trunkColor: 4, //0100
  //     crownColor: 5, //0101
  //     groundColor: 0, //000
  //     specialEffects: 223,
  //     specialEffectsFinal: 8,
  //     universalCode: 8432036, //1000 00001010100110100100
  //   };
  //   /////------------------------------expected for tree with id 170
  //   let rand170 = 76879606; //1001001 010 1000 1011 011 110110
  //   let generatedCode170 = 1382134; //1 01010001011011110110
  //   let expectedAttribute170 = {
  //     treeType: 54, //110110
  //     groundType: 3, //011
  //     trunkColor: 11, //1011
  //     crownColor: 8, //1000
  //     groundColor: 2, //010
  //     specialEffects: 73,
  //     specialEffectsFinal: 1,
  //     universalCode: 1382134, //1 01010001011011110110
  //   };
  //   /////------------------------------expected for tree with id 999
  //   let rand999 = 186983906; //10110010 010 1001 0010 111 100010
  //   let generatedCode999 = 7677410; //111 01010010010111100010
  //   let expectedAttribute999 = {
  //     treeType: 34, //100010
  //     groundType: 7, //111
  //     trunkColor: 2, //0010
  //     crownColor: 9, //1001
  //     groundColor: 2, //010
  //     specialEffects: 178, //10110010
  //     specialEffectsFinal: 7,
  //     universalCode: 7677410, //111 01010010010111100010
  //   };
  //   /////------------------------------expected for tree with id 1531
  //   let rand1531 = 40214938; //100110 010 1101 0000 110 011010
  //   let generatedCode1531 = 1417626; //1 01011010000110011010
  //   let expectedAttribute1531 = {
  //     treeType: 26, //011010
  //     groundType: 6, //110
  //     trunkColor: 0, //0000
  //     crownColor: 13, //1101
  //     groundColor: 2, //010
  //     specialEffects: 38, //100110
  //     specialEffectsFinal: 1,
  //     universalCode: 1417626, //1 01011010000110011010
  //   };
  //   /////------------------------------expected for tree with id 2 (example for auction)
  //   let rand2 = 181058782; //10101100 101 0101 1110 011 011110
  //   let generatedCode2 = 8043742; //111 10101011110011011110
  //   let expectedAttribute2 = {
  //     treeType: 30, //011110
  //     groundType: 3, //011
  //     trunkColor: 14, //1110
  //     crownColor: 5, //0101
  //     groundColor: 5, //101
  //     specialEffects: 172, //100110
  //     specialEffectsFinal: 7,
  //     universalCode: 8043742, //111 10101011110011011110
  //   };
  //   /////------------------------------expected for tree with id 51 (example for auction)
  //   let rand51 = 125541807; //1110111 101 1100 1110 110 101111
  //   let generatedCode51 = 6004143; //101 10111001110110101111
  //   let expectedAttribute51 = {
  //     treeType: 47, //101111
  //     groundType: 6, //110
  //     trunkColor: 14, //1110
  //     crownColor: 12, //1100
  //     groundColor: 5, //101
  //     specialEffects: 119, //100110
  //     specialEffectsFinal: 5,
  //     universalCode: 6004143, //101 10111001110110101111
  //   };
  //   //----------------------------config tree factory-------------------------
  //   await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addTreejerContractRole(
  //     arInstance,
  //     deployerAccount,
  //     deployerAccount
  //   );
  //   await Common.addTreejerContractRole(
  //     arInstance,
  //     treeFactoryInstance.address,
  //     deployerAccount
  //   );
  //   ////----------------------------test tree 102 (with rank==0) owner==> userAccounts2----------------------
  //   await treeFactoryInstance.updateOwner(102, userAccount2, 1, {
  //     from: deployerAccount,
  //   });
  //   await treeAttributeInstance.createTreeAttributes(102, {
  //     from: userAccount2,
  //   });
  //   let treeAttribute102 = await treeAttributeInstance.treeAttributes(102);
  //   let generatedAttribute102 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode102
  //   );
  //   let reservedAttribute102 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode102
  //   );
  //   assert.equal(generatedAttribute102, 1, "102 - generatedAttribute not true");
  //   assert.equal(reservedAttribute102, 0, "102 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute102.treeType),
  //     expectedAttribute102.treeType,
  //     "102 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.groundType),
  //     expectedAttribute102.groundType,
  //     "102 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.trunkColor),
  //     expectedAttribute102.trunkColor,
  //     "102 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.crownColor),
  //     expectedAttribute102.crownColor,
  //     "102 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.groundColor),
  //     expectedAttribute102.groundColor,
  //     "102 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.specialEffects),
  //     expectedAttribute102.specialEffectsFinal,
  //     "102 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute102.universalCode),
  //     expectedAttribute102.universalCode,
  //     "102 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute102.exists), 1, "102 - Exists not true");
  //   ////----------------------------test tree 150 (with rank==1) owner==> userAccounts4----------------------
  //   await treeAttributeInstance.setBuyerRank(
  //     userAccount4,
  //     web3.utils.toWei(".004"),
  //     web3.utils.toWei("3"),
  //     1,
  //     5,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treeFactoryInstance.updateOwner(150, userAccount4, 1, {
  //     from: deployerAccount,
  //   });
  //   await treeAttributeInstance.createTreeAttributes(150, {
  //     from: userAccount4,
  //   });
  //   let treeAttribute150 = await treeAttributeInstance.treeAttributes(150);
  //   let generatedAttribute150 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode150
  //   );
  //   let reservedAttribute150 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode150
  //   );
  //   assert.equal(generatedAttribute150, 1, "150 - generatedAttribute not true");
  //   assert.equal(reservedAttribute150, 0, "150 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute150.treeType),
  //     expectedAttribute150.treeType,
  //     "150 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.groundType),
  //     expectedAttribute150.groundType,
  //     "150 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.trunkColor),
  //     expectedAttribute150.trunkColor,
  //     "150 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.crownColor),
  //     expectedAttribute150.crownColor,
  //     "150 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.groundColor),
  //     expectedAttribute150.groundColor,
  //     "150 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.specialEffects),
  //     expectedAttribute150.specialEffectsFinal,
  //     "150 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute150.universalCode),
  //     expectedAttribute150.universalCode,
  //     "150 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute150.exists), 1, "150 - Exists not true");
  //   let testRank150 = await treeAttributeInstance.rankOf(userAccount4);
  //   assert.equal(Number(testRank150), 0, "150-rank is not true");
  //   ////----------------------------test tree 170 (with rank==2) owner==> userAccounts5----------------------
  //   await treeAttributeInstance.setBuyerRank(
  //     userAccount5,
  //     web3.utils.toWei(".016"),
  //     web3.utils.toWei("4"),
  //     1,
  //     3,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treeFactoryInstance.updateOwner(170, userAccount5, 1, {
  //     from: deployerAccount,
  //   });
  //   await treeAttributeInstance.createTreeAttributes(170, {
  //     from: userAccount5,
  //   });
  //   let treeAttribute170 = await treeAttributeInstance.treeAttributes(170);
  //   let generatedAttribute170 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode170
  //   );
  //   let reservedAttribute170 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode170
  //   );
  //   assert.equal(generatedAttribute170, 1, "170 - generatedAttribute not true");
  //   assert.equal(reservedAttribute170, 0, "170 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute170.treeType),
  //     expectedAttribute170.treeType,
  //     "170 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.groundType),
  //     expectedAttribute170.groundType,
  //     "170 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.trunkColor),
  //     expectedAttribute170.trunkColor,
  //     "170 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.crownColor),
  //     expectedAttribute170.crownColor,
  //     "170 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.groundColor),
  //     expectedAttribute170.groundColor,
  //     "170 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.specialEffects),
  //     expectedAttribute170.specialEffectsFinal,
  //     "170 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute170.universalCode),
  //     expectedAttribute170.universalCode,
  //     "170 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute170.exists), 1, "170 - Exists not true");
  //   let testRank170 = await treeAttributeInstance.rankOf(userAccount5);
  //   assert.equal(Number(testRank170), 0, "170-rank is not true");
  //   ////----------------------------test tree 999 (with rank==3) owner==> userAccounts5----------------------
  //   await treeAttributeInstance.setBuyerRank(
  //     userAccount5,
  //     web3.utils.toWei("0"),
  //     web3.utils.toWei("5.5"),
  //     11,
  //     80,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treeFactoryInstance.updateOwner(999, userAccount5, 1, {
  //     from: deployerAccount,
  //   });
  //   let tx = await treeAttributeInstance.createTreeAttributes(999, {
  //     from: userAccount5,
  //   });
  //   truffleAssert.eventEmitted(tx, "x1", (ev) => {
  //     console.log("x1.x", Number(ev.x));
  //     return true;
  //   });
  //   let treeAttribute999 = await treeAttributeInstance.treeAttributes(999);
  //   let generatedAttribute999 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode999
  //   );
  //   let reservedAttribute999 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode999
  //   );
  //   assert.equal(generatedAttribute999, 1, "999 - generatedAttribute not true");
  //   assert.equal(reservedAttribute999, 0, "999 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute999.treeType),
  //     expectedAttribute999.treeType,
  //     "999 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.groundType),
  //     expectedAttribute999.groundType,
  //     "999 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.trunkColor),
  //     expectedAttribute999.trunkColor,
  //     "999 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.crownColor),
  //     expectedAttribute999.crownColor,
  //     "999 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.groundColor),
  //     expectedAttribute999.groundColor,
  //     "999 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.specialEffects),
  //     expectedAttribute999.specialEffectsFinal,
  //     "999 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute999.universalCode),
  //     expectedAttribute999.universalCode,
  //     "999 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute999.exists), 1, "999 - Exists not true");
  //   let testRank999 = await treeAttributeInstance.rankOf(userAccount5);
  //   assert.equal(Number(testRank999), 0, "999-rank is not true");
  //   //----------------------------test tree 1531 (with rank==4) owner==> userAccounts5----------------------
  //   await treeAttributeInstance.setBuyerRank(
  //     userAccount5,
  //     web3.utils.toWei("0"),
  //     web3.utils.toWei("5.5"),
  //     11,
  //     80,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treeFactoryInstance.updateOwner(1531, userAccount5, 1, {
  //     from: deployerAccount,
  //   });
  //   let tx = await treeAttributeInstance.createTreeAttributes(1531, {
  //     from: userAccount5,
  //   });
  //   truffleAssert.eventEmitted(tx, "x1", (ev) => {
  //     console.log("x1.x", Number(ev.x));
  //     return true;
  //   });
  //   let treeAttribute1531 = await treeAttributeInstance.treeAttributes(1531);
  //   let generatedAttribute1531 =
  //     await treeAttributeInstance.generatedAttributes(generatedCode1531);
  //   let reservedAttribute1531 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode1531
  //   );
  //   assert.equal(
  //     generatedAttribute1531,
  //     1,
  //     "1531 - generatedAttribute not true"
  //   );
  //   assert.equal(reservedAttribute1531, 0, "1531 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute1531.treeType),
  //     expectedAttribute1531.treeType,
  //     "1531 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.groundType),
  //     expectedAttribute1531.groundType,
  //     "1531 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.trunkColor),
  //     expectedAttribute1531.trunkColor,
  //     "1531 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.crownColor),
  //     expectedAttribute1531.crownColor,
  //     "1531 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.groundColor),
  //     expectedAttribute1531.groundColor,
  //     "1531 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.specialEffects),
  //     expectedAttribute1531.specialEffectsFinal,
  //     "1531 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute1531.universalCode),
  //     expectedAttribute1531.universalCode,
  //     "1531 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute1531.exists), 1, "1531 - Exists not true");
  //   let testRank1531 = await treeAttributeInstance.rankOf(userAccount5);
  //   assert.equal(Number(testRank1531), 0, "1531-rank is not true");
  //   //----------------------------test tree 2 (with rank==0) owner==> userAccounts2----------------------
  //   await treeFactoryInstance.updateOwner(2, userAccount5, 1, {
  //     from: deployerAccount,
  //   });
  //   let tx = await treeAttributeInstance.createTreeAttributes(2, {
  //     from: userAccount5,
  //   });
  //   truffleAssert.eventEmitted(tx, "x1", (ev) => {
  //     console.log("x1.x", Number(ev.x));
  //     return true;
  //   });
  //   let treeAttribute2 = await treeAttributeInstance.treeAttributes(2);
  //   let generatedAttribute2 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode2
  //   );
  //   let reservedAttribute2 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode2
  //   );
  //   assert.equal(generatedAttribute2, 1, "2 - generatedAttribute not true");
  //   assert.equal(reservedAttribute2, 0, "2 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute2.treeType),
  //     expectedAttribute2.treeType,
  //     "2 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.groundType),
  //     expectedAttribute2.groundType,
  //     "2 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.trunkColor),
  //     expectedAttribute2.trunkColor,
  //     "2 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.crownColor),
  //     expectedAttribute2.crownColor,
  //     "2 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.groundColor),
  //     expectedAttribute2.groundColor,
  //     "2 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.specialEffects),
  //     expectedAttribute2.specialEffectsFinal,
  //     "2 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute2.universalCode),
  //     expectedAttribute2.universalCode,
  //     "2 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute2.exists), 1, "2 - Exists not true");
  //   let testRank2 = await treeAttributeInstance.rankOf(userAccount5);
  //   assert.equal(Number(testRank2), 0, "2-rank is not true");
  //   //----------------------------test tree 51 (with rank==2) owner==> userAccounts5----------------------
  //   await treeAttributeInstance.setBuyerRank(
  //     userAccount5,
  //     web3.utils.toWei(".016"),
  //     web3.utils.toWei("4"),
  //     1,
  //     3,
  //     {
  //       from: deployerAccount,
  //     }
  //   );
  //   await treeFactoryInstance.updateOwner(51, userAccount5, 1, {
  //     from: deployerAccount,
  //   });
  //   let tx = await treeAttributeInstance.createTreeAttributes(51, {
  //     from: userAccount5,
  //   });
  //   truffleAssert.eventEmitted(tx, "x1", (ev) => {
  //     console.log("x1.x", Number(ev.x));
  //     return true;
  //   });
  //   let treeAttribute51 = await treeAttributeInstance.treeAttributes(51);
  //   let generatedAttribute51 = await treeAttributeInstance.generatedAttributes(
  //     generatedCode51
  //   );
  //   let reservedAttribute51 = await treeAttributeInstance.reservedAttributes(
  //     generatedCode51
  //   );
  //   assert.equal(generatedAttribute51, 1, "51 - generatedAttribute not true");
  //   assert.equal(reservedAttribute51, 0, "51 - reservedAttribute not true");
  //   assert.equal(
  //     Number(treeAttribute51.treeType),
  //     expectedAttribute51.treeType,
  //     "51 - Tree type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.groundType),
  //     expectedAttribute51.groundType,
  //     "51 - Ground type not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.trunkColor),
  //     expectedAttribute51.trunkColor,
  //     "51 - Trunk color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.crownColor),
  //     expectedAttribute51.crownColor,
  //     "51 - Crown color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.groundColor),
  //     expectedAttribute51.groundColor,
  //     "51 - Ground color not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.specialEffects),
  //     expectedAttribute51.specialEffectsFinal,
  //     "51 - Special effects not true"
  //   );
  //   assert.equal(
  //     Number(treeAttribute51.universalCode),
  //     expectedAttribute51.universalCode,
  //     "51 - Generated code not true"
  //   );
  //   assert.equal(Number(treeAttribute51.exists), 1, "51 - Exists not true");
  //   let testRank51 = await treeAttributeInstance.rankOf(userAccount5);
  //   assert.equal(Number(testRank51), 0, "51-rank is not true");
  // });

  it("Should createTreeAttributes reject because treeAttributes exist", async () => {
    ////----------------------------config tree factory-------------------------
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    ////---------------------------createTreeAttributes----------------------
    await treeFactoryInstance.updateOwner(102, userAccount2, 1, {
      from: deployerAccount,
    });

    await treeAttributeInstance.createTreeAttributes(102, {
      from: userAccount2,
    });

    await treeAttributeInstance
      .createTreeAttributes(102, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_HAS_ATTRIBUTES);
  });

  it("Should createTreeAttributes reject because mint status isn't (1 or 2) or not owner", async () => {
    ////----------------------------config tree factory-------------------------
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    //////----------------------------mint status isn't (1 or 2)--------------------
    await treeTokenInstance.safeMint(userAccount2, 102, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .createTreeAttributes(102, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);

    await treeAttributeInstance
      .createTreeAttributes(104, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
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
      .createTreeAttributes(107, {
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

    await Common.addTreejerContractRole(
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

    await Common.addTreejerContractRole(
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

    await Common.addTreejerContractRole(
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

      {
        from: userAccount3,
      }
    );

    await treeAttributeInstance
      .createTreeAttributes(103, {
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

    await Common.addTreejerContractRole(
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

    await Common.addTreejerContractRole(
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

    await Common.addTreejerContractRole(
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
      .createTreeAttributes(102, {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.TREE_WITH_NO_ATTRIBUTES);
  });

  ////////////////--------------------------------------------gsn------------------------------------------------
  it("test gsn [ @skip-on-coverage ]", async () => {
    ////----------------------------config tree factory-------------------------
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );
    await Common.addTreejerContractRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    ////---------------------------createTreeAttributes----------------------
    await treeFactoryInstance.updateOwner(102, userAccount2, 1, {
      from: deployerAccount,
    });

    ///////------------------------------handle gsn---------------------------------

    let env = await GsnTestEnvironment.startGsn("localhost");

    const { forwarderAddress, relayHubAddress, paymasterAddress } =
      env.contractsDeployment;

    await treeAttributeInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setWhitelistTarget(treeAttributeInstance.address, {
      from: deployerAccount,
    });
    await paymaster.setRelayHub(relayHubAddress);
    await paymaster.setTrustedForwarder(forwarderAddress);

    web3.eth.sendTransaction({
      from: accounts[0],
      to: paymaster.address,
      value: web3.utils.toWei("1"),
    });

    origProvider = web3.currentProvider;

    conf = { paymasterAddress: paymaster.address };

    gsnProvider = await Gsn.RelayProvider.newProvider({
      provider: origProvider,
      config: conf,
    }).init();

    provider = new ethers.providers.Web3Provider(gsnProvider);

    let signerFunder = provider.getSigner(3);

    let contractFunder = await new ethers.Contract(
      treeAttributeInstance.address,
      treeAttributeInstance.abi,
      signerFunder
    );

    let balanceAccountBefore = await web3.eth.getBalance(userAccount2);

    await contractFunder.createTreeAttributes(102);

    let balanceAccountAfter = await web3.eth.getBalance(userAccount2);

    console.log("balanceAccountBefore", Number(balanceAccountBefore));
    console.log("balanceAccountAfter", Number(balanceAccountAfter));

    assert.equal(
      balanceAccountAfter,
      balanceAccountBefore,
      "Gsn not true work"
    );
  });
});
