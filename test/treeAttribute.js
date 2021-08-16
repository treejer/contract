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
  const userAccount8 = accounts[9];

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

  /* sss

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

    await Common.addCommunityGiftRole(
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
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_COMMUNITY);
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

    await Common.addCommunityGiftRole(
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
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_COMMUNITY);
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
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN_OR_COMMUNITY);
  });

  it("Should setTreeAttributesByAdmin rejec because generatedCode has been reserved or generated before", async () => {
    let generatedCode = 12500123;
    let generatedCode2 = 12332;

    ///------test reserve before

    await treeAttributeInstance.reserveTreeAttributes(generatedCode, {
      from: deployerAccount,
    });

    await treeAttributeInstance
      .setTreeAttributesByAdmin(10, generatedCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAttributeErrorMsg.DUPLICATE_TREE_ATTRIBUTES);

    ///------test generate before

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
  sss */

  it("Should setBuyerRank rejec because caller must be admin", async () => {
    //0x5cd29886
    0x5cd29886;
    let tx = await treeAttributeInstance.createTreeAttributes(0, 1, {
      from: userAccount2,
    });

    truffleAssert.eventEmitted(tx, "x1", (ev) => {
      console.log("x1.x", ev.x);
      return true;
    });

    let treeAttribute = await treeAttributeInstance.treeAttributes(0);
    console.log("ss", Number(treeAttribute.universalCode));
  });

  /* ssss
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

  ssss */
});
