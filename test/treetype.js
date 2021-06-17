const AccessRestriction = artifacts.require("AccessRestriction");
const TreeType = artifacts.require("TreeType");
const assert = require("chai").assert;
const truffleAssert = require("truffle-assertions");
const Units = require("ethereumjs-units");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

contract("TreeType", (accounts) => {
  let arInstance;
  let treeTypeInstance;
  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    treeTypeInstance = await deployProxy(TreeType, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
  });
  afterEach(async () => {
    // await treetype.kill({ from: ownerAccount });
  });
  it("should create tree type", async () => {
    let name = "balut";
    let o2formula = 100;
    let tx = await Common.addType(treeTypeInstance, deployerAccount, name);
    truffleAssert.eventEmitted(tx, "NewType", (ev) => {
      return (
        ev.typeId.toString() === "0" &&
        ev.name === name &&
        ev.O2Formula.toString() === o2formula.toString()
      );
    });
  });
  it("should return tree type", async () => {
    let id = 0;
    let name = "balut";
    await Common.addType(treeTypeInstance, deployerAccount, name);
    return await treeTypeInstance
      .types(id)
      .then((treeType) => {
        assert.equal(treeType[0], name, "Tree with id: " + id + " returned");
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should return o2Formula ", async () => {
    let id = 0;
    let name = "balut";
    let o2formula = 100;
    await Common.addType(treeTypeInstance, deployerAccount, name);
    return await treeTypeInstance
      .types(id)
      .then((treeType) => {
        assert.equal(
          treeType[2],
          o2formula,
          "Tree o2formula : " + treeType[2] + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should return count of tree types", async () => {
    let name = "balut";
    let name1 = "konar";
    await Common.addType(treeTypeInstance, deployerAccount, name);
    await Common.addType(treeTypeInstance, deployerAccount, name1);
    return await treeTypeInstance
      .total()
      .then((count) => {
        assert.equal(2, count, "Tree types count is: " + count);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
