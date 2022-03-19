// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const AccessRestriction = artifacts.require("AccessRestriction");
const PublicForestFactory = artifacts.require("PublicForestFactory");
const RegularSale = artifacts.require("RegularSale");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { CommonErrorMsg, contractAddress } = require("./enumes");
const common = require("mocha/lib/interfaces/common");

contract("PublicForestFactory", (accounts) => {
  let arInstance;
  let publicForestFactory;
  let regularSaleInstance;
  const deployerAccount = accounts[0];
  const dataManager = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const adminAccount = accounts[8];
  const userAccount8 = accounts[9];

  const zeroAddress = "0x0000000000000000000000000000000000000000";

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount,
      });

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("deploys successfully and set addresses", async () => {
      //--------------- deploy regularSale contract
      regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      const address = publicForestFactory.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      assert.equal(
        await publicForestFactory.accessRestriction(),
        arInstance.address,
        "access restriction is not correct"
      );

      assert.equal(
        await publicForestFactory.accessRestriction(),
        arInstance.address,
        "access restriction is not correct"
      );

      assert.equal(
        await publicForestFactory.accessRestriction(),
        arInstance.address,
        "access restriction is not correct"
      );

      assert.equal(
        await publicForestFactory.isPublicForestFactory(),
        true,
        "isPublicForestFactory is not correct"
      );

      assert.equal(
        await publicForestFactory.treejerNftContractAddress(),
        contractAddress.TREE,
        "treejerNftContractAddress is not correct"
      );

      ///////////////---------------------------------set Treejer contract address--------------------------------------------------------

      await publicForestFactory
        .setTreejerContractAddress(regularSaleInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setTreejerContractAddress(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await publicForestFactory.setTreejerContractAddress(
        regularSaleInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        regularSaleInstance.address,
        await publicForestFactory.treejerContract(),
        "address set incorect"
      );
    });

    it("set valid tokens", async () => {
      //////////////// fail to updte valid token
      await publicForestFactory
        .updateValidTokens(userAccount1, true, { from: userAccount2 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await publicForestFactory
        .updateValidTokens(zeroAddress, true, {
          from: dataManager,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        false,
        "incorrect valid token"
      );

      /////////////////////// set true
      await publicForestFactory.updateValidTokens(userAccount1, true, {
        from: dataManager,
      });

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        true,
        "incorrect valid token"
      );

      ////////////////////// set false
      await publicForestFactory.updateValidTokens(userAccount1, false, {
        from: dataManager,
      });

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        false,
        "incorrect valid token"
      );
    });
  });
});
