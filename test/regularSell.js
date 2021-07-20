const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSell = artifacts.require("RegularSell.sol");
const GenesisTree = artifacts.require("GenesisTree.sol");
const Dai = artifacts.require("Dai.sol");
const Tree = artifacts.require("Tree.sol");
const Planter = artifacts.require("Planter.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Units = require("ethereumjs-units");

const {
  TimeEnumes,
  CommonErrorMsg,
  GenesisTreeErrorMsg,
  RegularSellErrors,
} = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("GenesisTree", (accounts) => {
  let regularSellInstance;
  let treeFactoryInstance;
  let arInstance;
  let daiInstance;
  let treeTokenInstance;

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

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    regularSellInstance = await deployProxy(RegularSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeFactoryInstance = await deployProxy(GenesisTree, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    daiInstance = await Dai.new(Units.convert("1000000", "eth", "wei"), {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});
  //////////////////************************************ deploy successfully ****************************************//
  it("deploys successfully", async () => {
    const address = regularSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  /////////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set tree factory address", async () => {
    await regularSellInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      treeFactoryInstance.address,
      await regularSellInstance.treeFactory.call(),
      "address set incorect"
    );
  });

  /////////////////---------------------------------set tree factory address--------------------------------------------------------
  it("set dai address", async () => {
    await regularSellInstance
      .setDaiTokenAddress(daiInstance.address, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    assert.equal(
      daiInstance.address,
      await regularSellInstance.daiToken.call(),
      "address set incorect"
    );
  });

  ///////////////////------------------------------------- set price ------------------------------------------
  it("set price and check data", async () => {
    let treePrice1 = await regularSellInstance.treePrice.call();

    assert.equal(Number(treePrice1), 0, "treePriceInvalid");

    await regularSellInstance.setPrice(10, { from: deployerAccount });

    const treePrice2 = await regularSellInstance.treePrice.call();

    assert.equal(Number(treePrice2), 10, "tree price is incorrect");
  });

  it("should fail set price", async () => {
    await regularSellInstance
      .setPrice(10, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  //////////TODO: must be complete below tests

  /////////////////////// -------------------------------------- request trees ----------------------------------------------------
  // it("should request trees successfully", async () => {});

  it("should fail request trees", async () => {
    let price = Units.convert("1", "eth", "wei");
    await regularSellInstance.setPrice(price, { from: deployerAccount });

    await regularSellInstance
      .requestTrees(0)
      .should.be.rejectedWith(RegularSellErrors.INVALID_COUNT);

    await Common.approveAndTransfer(
      daiInstance,
      userAccount1,
      regularSellInstance.address,
      deployerAccount,
      "3"
    );

    await regularSellInstance.requestTrees(1, { from: userAccount1 }).should.be
      .rejected;

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance
      .requestTrees(4, { from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    await regularSellInstance.requestTrees(2).should.be.rejected;

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance.requestTrees(2, { from: userAccount1 }).should.be
      .rejected;

    await Common.addGenesisTreeRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await regularSellInstance.requestTrees(2, { from: userAccount1 }).should.be
      .rejected;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await regularSellInstance.requestTrees(2, { from: userAccount1 });
  });

  //////////////////////// ------------------------------------------- request tree by id ---------------------------------------------------
  it("should request tree by id successfully", async () => {
    await regularSellInstance.setPrice(10, { from: deployerAccount });

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    await Common.approveAndTransfer(
      daiInstance,
      userAccount1,
      regularSellInstance.address,
      deployerAccount,
      "1"
    );

    let balance = await daiInstance.balanceOf.call(userAccount1);

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );

    ///////////////////////////////////////////////////// plant regualar

    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addGenesisTreeRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await regularSellInstance.requestByTreeId(10001, { from: userAccount1 });
  });
  it("should be reject request by tree id", async () => {
    let price = Units.convert("1", "eth", "wei");
    await regularSellInstance.setPrice(price, { from: deployerAccount });

    await regularSellInstance
      .requestByTreeId(2, { from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_TREE);

    await Common.approveAndTransfer(
      daiInstance,
      userAccount1,
      regularSellInstance.address,
      deployerAccount,
      "1"
    );

    await regularSellInstance.requestByTreeId(10001, { from: userAccount1 })
      .should.be.rejected;

    await regularSellInstance.setDaiTokenAddress(daiInstance.address, {
      from: deployerAccount,
    });

    let price2 = Units.convert("2", "eth", "wei");

    await regularSellInstance.setPrice(price2, { from: deployerAccount });

    await regularSellInstance
      .requestByTreeId(10001, { from: userAccount1 })
      .should.be.rejectedWith(RegularSellErrors.INVALID_AMOUNT);

    await Common.approveAndTransfer(
      daiInstance,
      userAccount1,
      regularSellInstance.address,
      deployerAccount,
      "2"
    );

    await regularSellInstance.requestByTreeId(10001, { from: userAccount1 })
      .should.be.rejected;

    await regularSellInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await regularSellInstance
      .requestByTreeId(10001, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_REGULAR_SELL);

    await Common.addRegularSellRole(
      arInstance,
      regularSellInstance.address,
      deployerAccount
    );
    ///////////////////////////////////////////////////// plant regualar

    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const planter = userAccount2;
    const ipfsHash = "some ipfs hash here";
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addGenesisTreeRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    const planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await regularSellInstance.requestByTreeId(10001, { from: userAccount1 });
  });
});
