// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const AccessRestriction = artifacts.require("AccessRestriction");
const PublicForestFactory = artifacts.require("PublicForestFactory");
const RegularSale = artifacts.require("RegularSale");
const PublicForest = artifacts.require("PublicForest");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");
const Factory = artifacts.require("Factory.sol");
const Token = artifacts.require("Weth");

const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");
const Planter = artifacts.require("Planter");

const Attribute = artifacts.require("Attribute");
const DaiFund = artifacts.require("DaiFund");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const {
  CommonErrorMsg,
  contractAddress,
  RegularSaleErrors,
  erc20ErrorMsg,
} = require("./enumes");

contract("PublicForestFactory", (accounts) => {
  let treeFactoryInstance;
  let daiFundInstance;
  let allocationInstance;
  let attributeInstance;
  let treeTokenInstance;
  let planterFundsInstnce;
  let planterInstance;
  let arInstance;
  let publicForestFactory;
  let regularSaleInstance;
  let publicForest;
  let uniswapV2Router02NewAddress;
  let testUniswapInstance;
  let wethDexInstance;
  let daiDexInstance;
  let bnbDexInstance;
  let adaDexInstance;
  let factoryInstance;

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

      ///////////////---------------------------------set implementation address--------------------------------------------------------

      await publicForestFactory
        .setImplementationAddress(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setImplementationAddress(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.implementation(),
        "implementation address set incorect"
      );

      ///////////////---------------------------------set dexRouter address--------------------------------------------------------

      await publicForestFactory
        .setDexRouterAddress(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setDexRouterAddress(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.dexRouter(),
        "dexRouter address set incorect"
      );
      ///////////////---------------------------------set daiToken address--------------------------------------------------------

      await publicForestFactory
        .setDaiTokenAddress(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setDaiTokenAddress(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.daiAddress(),
        "daiToken address set incorect"
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

  describe.only("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount,
      });

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount,
      });

      publicForest = await PublicForest.new({
        from: deployerAccount,
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount,
      });

      await publicForestFactory.setImplementationAddress(publicForest.address);
    });

    it("create public forest and update ipfsHash and factoryAddress", async () => {
      const ipfsHash = "ipfs hash 1";
      const newIpfsHash = "new ipfs";
      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1,
      });

      let forest = await publicForestFactory.forests(0);

      assert.equal(
        await publicForestFactory.forestToOwners(forest),
        userAccount1,
        "owner is not correct"
      );

      ///////---------------- check forest data
      let tempPublicForest = await PublicForest.at(forest);

      assert.equal(
        await tempPublicForest.ipfsHash(),
        ipfsHash,
        "ipfsHash is not correct"
      );

      assert.equal(
        await tempPublicForest.factoryAddress(),
        publicForestFactory.address,
        "factoryAddress is not correct"
      );

      ///////// ------------------- update ipfs and factory
      await publicForestFactory.updateIpfsHash(
        tempPublicForest.address,
        newIpfsHash,
        { from: userAccount3 }
      );

      await publicForestFactory.updateFactoryAddress(
        tempPublicForest.address,
        userAccount5,
        { from: dataManager }
      );

      ///////---------------- check forest data after update

      assert.equal(
        await tempPublicForest.ipfsHash(),
        newIpfsHash,
        "ipfsHash is not correct"
      );

      assert.equal(
        await tempPublicForest.factoryAddress(),
        userAccount5,
        "factoryAddress is not correct"
      );
    });

    it("test fund tree", async () => {
      const treePrice = 7;

      //////////// deploy regular contract

      regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei(treePrice.toString()),
        {
          from: deployerAccount,
        }
      );

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });
      const fakeDaiInstance = await Token.new("DAI", "dai", {
        from: accounts[0],
      });

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      daiFundInstance = await DaiFund.new({
        from: deployerAccount,
      });

      await daiFundInstance.initialize(arInstance.address, {
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

      attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      ////////////------------------ set regualr sale address

      await regularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount,
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount,
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });
      //--------------- set public forest address
      await publicForestFactory.setTreejerContractAddress(
        regularSaleInstance.address,
        { from: deployerAccount }
      );

      //set fake dai token address
      await publicForestFactory.setDaiTokenAddress(fakeDaiInstance.address, {
        from: deployerAccount,
      });

      //-------------set daiFund address

      await daiFundInstance.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount,
        }
      );

      //-------------set treeFactory address

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///////////////////////// -------------------- handle roles here ----------------

      await Common.addTreejerContractRole(
        arInstance,
        regularSaleInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );
      await Common.prepareAttributeDex(
        UniswapV2Router02New,
        Factory,
        TestUniswap,
        Token,
        attributeInstance,
        deployerAccount
      );

      await allocationInstance.addAllocationData(
        4000,
        1200,
        1200,
        1200,
        1200,
        1200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(1, 1000000, 0, {
        from: dataManager,
      });

      /////////////////------------ create forest
      const ipfsHash = "ipfs hash 1";

      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1,
      });

      let forestAddress = await publicForestFactory.forests(0);
      let tempPublicForest = await PublicForest.at(forestAddress);
      await fakeDaiInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.mul(treePrice, 2).toString())
      );

      // await daiDexInstance.setMint(
      //   forestAddress,
      //   web3.utils.toWei(Math.mul(treePrice, 2).toString())
      // );

      ////----------- fail to fund tree because no main dai exists
      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(RegularSaleErrors.INSUFFICIENT_AMOUNT);

      ////----------- fail to fund tree because no approve given to main dai

      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.mul(treePrice, 2).toString())
      );

      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(erc20ErrorMsg.APPROVAL_ISSUE);

      await daiDexInstance.resetAcc(forestAddress);

      ///////----------- set main dai address in forest
      await publicForestFactory.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });
      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);
      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.divide(treePrice, 2).toString())
      );

      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);

      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.divide(treePrice, 2).toString())
      );

      await publicForestFactory.fundTrees(forestAddress);

      // .should.be.rejectedWith(RegularSaleErrors.INSUFFICIENT_AMOUNT);

      tokentOwner1 = await treeTokenInstance.ownerOf(10001);
      // tokentOwner2 = await treeTokenInstance.ownerOf(10002);
      console.log("token owner1", tokentOwner1);

      // console.log("token owner2", tokentOwner2);

      // assert.equal(tokentOwner, forestAddress, "token owner is not correct");
    });
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      ////////////////////// deploy contracts
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount,
      });

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount,
      });

      publicForest = await PublicForest.new({
        from: deployerAccount,
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount,
      });

      await publicForestFactory.setImplementationAddress(publicForest.address);
      ////////////////////// deploy uniswap

      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount,
      });
      const factoryAddress = factoryInstance.address;

      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0],
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0],
      });

      unsafeTokenDexInstance = await Token.new("UNSAFE", "unsafe", {
        from: accounts[0],
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount,
      });

      /////---------------------------addLiquidity-------------------------

      const testUniswapAddress = testUniswapInstance.address;

      await wethDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000", "Ether")
      );

      await daiDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("1000000000", "Ether")
      );

      await bnbDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("500000", "Ether")
      );

      await adaDexInstance.setMint(
        testUniswapAddress,
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wethDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        bnbDexInstance.address,
        daiDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("250000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );

      console.log(
        "dddd",
        (
          await dexRouterInstance.getAmountsOut(
            web3.utils.toWei("250", "Ether"),
            [daiDexInstance.address, adaDexInstance.address]
          )
        ).toString()
      );
    });
    it("test swapTokenToDai", async () => {
      await publicForestFactory.updateValidTokens(
        bnbDexInstance.address,
        true,
        { from: dataManager }
      );

      await publicForestFactory.updateValidTokens(
        adaDexInstance.address,
        true,
        { from: dataManager }
      );
      await publicForestFactory.updateValidTokens(
        wethDexInstance.address,
        true,
        { from: dataManager }
      );

      const ipfsHash = "ipfs hash 1";
      const newIpfsHash = "new ipfs";
      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1,
      });

      let forestAddress = await publicForestFactory.forests(0);

      assert.equal(
        await publicForestFactory.forestToOwners(forestAddress),
        userAccount1,
        "owner is not correct"
      );

      ///////---------------- check forest data
      let tempPublicForest = await PublicForest.at(forestAddress);

      await wethDexInstance.setMint(
        forestAddress,
        web3.utils.toWei("10", "Ether")
      );

      await adaDexInstance.setMint(
        forestAddress,
        web3.utils.toWei("10", "Ether")
      );

      await bnbDexInstance.setMint(
        forestAddress,
        web3.utils.toWei("0.1", "Ether")
      );

      console.log(
        "bnb1",
        (await bnbDexInstance.balanceOf(forestAddress)).toString()
      );

      console.log(
        "dai1",
        (await daiDexInstance.balanceOf(forestAddress)).toString()
      );

      await publicForestFactory.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });

      await publicForestFactory.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount,
      });

      console.log(
        "222222222",
        (
          await dexRouterInstance.getAmountsOut(
            web3.utils.toWei("250", "Ether"),
            [daiDexInstance.address, bnbDexInstance.address]
          )
        ).toString()
      );

      await publicForestFactory.swapTokenToDai(
        forestAddress,
        bnbDexInstance.address,
        0
      );

      console.log(
        "dai2",
        (await daiDexInstance.balanceOf(forestAddress)).toString()
      );
      console.log(
        "bnb2",
        (await bnbDexInstance.balanceOf(forestAddress)).toString()
      );
    });
  });
});
