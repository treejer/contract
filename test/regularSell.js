const AccessRestriction = artifacts.require("AccessRestriction");
const RegularSell = artifacts.require("RegularSell.sol");
const GenesisTree = artifacts.require("GenesisTree.sol");
const Dai = artifacts.require("Dai.sol");

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
});
