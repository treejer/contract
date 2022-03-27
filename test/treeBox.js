// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeBox = artifacts.require("TreeBox");
const Tree = artifacts.require("Tree");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  CommonErrorMsg,

  PlanterErrorMsg,
  erc721ErrorMsg,
} = require("./enumes");

contract("TreeBox", (accounts) => {
  let treeBoxInstance;
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

  beforeEach(async () => {});

  afterEach(async () => {});
  //////////////////------------------------------------ deploy successfully ----------------------------------------//

  describe("deployment, set address, check access", () => {
    before(async () => {
      arInstance = await AccessRestriction.new({
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      treeInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      treeBoxInstance = await TreeBox.new({
        from: deployerAccount,
      });

      await treeBoxInstance.initialize(treeInstance.address, deployerAccount, {
        from: deployerAccount,
      });
    });

    it("deploys successfully", async () => {
      const address = treeBoxInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });
  ////////////////////////////////////////////////////////////////////////////////// ali

  describe("claim", () => {});
});
