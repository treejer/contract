const AccessRestriction = artifacts.require("AccessRestriction");
const Tree = artifacts.require("Tree.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  CommonErrorMsg,

  PlanterErrorMsg,
  erc721ErrorMsg,
} = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("Tree", (accounts) => {
  let treeInstance;

  let arInstance;

  const dataManager = accounts[0];
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

  before(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });

  beforeEach(async () => {
    treeInstance = await deployProxy(Tree, [arInstance.address, "base uri"], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });

  afterEach(async () => {});
  //////////////////------------------------------------ deploy successfully ----------------------------------------//

  it("deploys successfully", async () => {
    const address = treeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  it("set base uri", async () => {
    await treeInstance
      .setBaseURI("base uri", { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treeInstance.setBaseURI("base uri", { from: deployerAccount });
  });

  it("safe mint and exist", async () => {
    const tokenId1 = 2;
    await treeInstance
      .safeMint(userAccount1, tokenId1, { from: userAccount2 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await treeInstance
      .safeMint(userAccount1, tokenId1, { from: deployerAccount })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount3,
      deployerAccount
    );

    const isExistBefore = await treeInstance.exists(tokenId1);

    assert.equal(isExistBefore, false, "exist is not true");

    await treeInstance.safeMint(userAccount1, tokenId1, { from: userAccount3 });

    const owner = await treeInstance.ownerOf(tokenId1);
    const isExistAfter = await treeInstance.exists(tokenId1);

    assert.equal(owner, userAccount1, "owner is not correct");
    assert.equal(isExistAfter, true, "exist is not correct");
  });

  it("minted before", async () => {
    const tokenId1 = 2;

    await Common.addTreejerContractRole(
      arInstance,
      userAccount3,
      deployerAccount
    );

    await treeInstance.safeMint(userAccount1, tokenId1, { from: userAccount3 });

    await treeInstance
      .safeMint(userAccount2, tokenId1, { from: userAccount3 })
      .should.be.rejectedWith(erc721ErrorMsg.MINTED_BEFORE);
  });

  it("test _baseURI", async () => {
    const tokenId1 = 2;

    await Common.addTreejerContractRole(
      arInstance,
      userAccount3,
      deployerAccount
    );

    await treeInstance.safeMint(userAccount1, tokenId1, {
      from: userAccount3,
    });

    await treeInstance.setBaseURI("", {
      from: deployerAccount,
    });

    let tokenURIBefore = await treeInstance.tokenURI(tokenId1);

    assert.equal(tokenURIBefore, "");

    await treeInstance.setBaseURI("https://api.treejer.com/trees/", {
      from: deployerAccount,
    });

    let tokenURIAfter = await treeInstance.tokenURI(tokenId1);

    assert.equal(tokenURIAfter, "https://api.treejer.com/trees/2");
  });

  it("should setAttributes works successfully", async () => {
    const tokenId = 101;

    /////////// ------------ fail because caller is not treejer contract
    await treeInstance
      .setAttributes(
        tokenId,
        web3.utils.toBN("127230078313845012625111011080416526335"),
        18,
        { from: userAccount1 }
      )
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

    await Common.addTreejerContractRole(
      arInstance,
      userAccount1,
      deployerAccount
    );
    //01011111,10110111,10011111,00101011,11111111,11111111,11111111,11111111,11111111,11111111,11111101,11111110,11111101,11111111,11111111,11111111
    await treeInstance.setAttributes(
      tokenId,
      web3.utils.toBN("127230078313845012625111011080416526335"),
      18,
      { from: userAccount1 }
    );

    let expectedAttributeValue = {
      attribute1: 255,
      attribute2: 255,
      attribute3: 255,
      attribute4: 253,
      attribute5: 254,
      attribute6: 253,
      attribute7: 255,
      attribute8: 255,
      generationType: 18,
    };

    const attributeData = await treeInstance.attributes.call(tokenId);

    assert.equal(
      attributeData.attribute1,
      expectedAttributeValue.attribute1,
      "attribute1 is incorrect"
    );
    assert.equal(
      attributeData.attribute2,
      expectedAttributeValue.attribute2,
      "attribute2 is incorrect"
    );
    assert.equal(
      attributeData.attribute3,
      expectedAttributeValue.attribute3,
      "attribute3 is incorrect"
    );
    assert.equal(
      attributeData.attribute4,
      expectedAttributeValue.attribute4,
      "attribute4 is incorrect"
    );
    assert.equal(
      attributeData.attribute5,
      expectedAttributeValue.attribute5,
      "attribute5 is incorrect"
    );
    assert.equal(
      attributeData.attribute6,
      expectedAttributeValue.attribute6,
      "attribute6 is incorrect"
    );
    assert.equal(
      attributeData.attribute7,
      expectedAttributeValue.attribute7,
      "attribute7 is incorrect"
    );
    assert.equal(
      attributeData.attribute8,
      expectedAttributeValue.attribute8,
      "attribute8 is incorrect"
    );

    assert.equal(
      attributeData.generationType,
      expectedAttributeValue.generationType,
      "generation type is invlid"
    );

    const expectedSymbolValue = {
      shape: 255,
      trunkColor: 255,
      crownColor: 255,
      effect: 255,
      coefficient: 43,
      generationType: 18,
    };

    const symbolData = await treeInstance.symbols.call(tokenId);

    assert.equal(
      symbolData.shape,
      expectedSymbolValue.shape,
      "shape is incorrect"
    );

    assert.equal(
      symbolData.trunkColor,
      expectedSymbolValue.trunkColor,
      "trunkColor is incorrect"
    );

    assert.equal(
      symbolData.crownColor,
      expectedSymbolValue.crownColor,
      "crownColor is incorrect"
    );
    assert.equal(
      symbolData.effect,
      expectedSymbolValue.effect,
      "effect is incorrect"
    );
    assert.equal(
      symbolData.coefficient,
      expectedSymbolValue.coefficient,
      "coefficient is incorrect"
    );
    assert.equal(
      symbolData.generationType,
      expectedSymbolValue.generationType,
      "generationType is incorrect"
    );
  });

  it("test attributeExists", async () => {
    const tokenId = 101;

    await Common.addTreejerContractRole(
      arInstance,
      userAccount1,
      deployerAccount
    );

    let result1 = await treeInstance.attributeExists.call(tokenId, {
      from: userAccount1,
    });
    assert.equal(result1, false, "result 1 is incorrect");
    await treeInstance.setAttributes(
      tokenId,
      web3.utils.toBN(
        "115792089237316195423570985008687907853269984665640564039439137263839420088320"
      ),
      18,
      { from: userAccount1 }
    );

    let result2 = await treeInstance.attributeExists.call(tokenId, {
      from: userAccount1,
    });
    assert.equal(result2, true, "result 1 is incorrect");
  });
});
