// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const AccessRestriction = artifacts.require("AccessRestriction");
const PublicForestFactory = artifacts.require("PublicForestFactory");
const RegularSale = artifacts.require("RegularSale");
const PublicForest = artifacts.require("PublicForest");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");
const Factory = artifacts.require("Factory.sol");
const Token = artifacts.require("Weth");
const Erc721Token = artifacts.require("Erc721Token");
const Erc1155Token = artifacts.require("Erc1155Token");

const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");
const Planter = artifacts.require("Planter");

const Attribute = artifacts.require("Attribute");
const DaiFund = artifacts.require("DaiFund");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const TestPublicForestFactory = artifacts.require("TestPublicForestFactory");

const Math = require("./math");

const assert = require("chai").assert;
require("chai")
  .use(require("chai-as-promised"))
  .should();
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const {
  CommonErrorMsg,
  contractAddress,
  PublicForestErrors,
  RegularSaleErrors,
  erc20ErrorMsg,
  erc721ErrorMsg
} = require("./enumes");
const common = require("mocha/lib/interfaces/common");

contract("PublicForestFactory", accounts => {
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
  let treeFactoryInstance;
  let daiFundInstance;
  let allocationInstance;
  let attributeInstance;
  let treeTokenInstance;
  let planterFundsInstnce;
  let planterInstance;
  let erc721TokenInstance;

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
      from: deployerAccount
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount
      });

      await publicForestFactory.initialize(
        arInstance.address,
        zeroAddress,
        zeroAddress,
        "0x3abbc23f3303ef36fd9f6cec0e585b2c23e47fd9",
        {
          from: deployerAccount
        }
      );
    });

    it("deploys successfully and set addresses", async () => {
      //--------------- deploy regularSale contract
      regularSaleInstance = await RegularSale.new({
        from: deployerAccount
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount
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
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setTreejerContractAddress(
        regularSaleInstance.address,
        {
          from: deployerAccount
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
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setImplementationAddress(userAccount2, {
        from: deployerAccount
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.implementation(),
        "implementation address set incorect"
      );

      ///////////////---------------------------------set dexRouter address--------------------------------------------------------

      await publicForestFactory
        .setDexRouterAddress(userAccount2, {
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setDexRouterAddress(userAccount2, {
        from: deployerAccount
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.dexRouter(),
        "dexRouter address set incorect"
      );
      ///////////////---------------------------------set daiToken address--------------------------------------------------------

      await publicForestFactory
        .setBaseTokenAddress(userAccount2, {
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setBaseTokenAddress(userAccount2, {
        from: deployerAccount
      });

      assert.equal(
        userAccount2,
        await publicForestFactory.baseTokenAddress(),
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
          from: dataManager
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        false,
        "incorrect valid token"
      );

      /////////////////////// set true
      await publicForestFactory.updateValidTokens(userAccount1, true, {
        from: dataManager
      });

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        true,
        "incorrect valid token"
      );

      ////////////////////// set false
      await publicForestFactory.updateValidTokens(userAccount1, false, {
        from: dataManager
      });

      assert.equal(
        await publicForestFactory.validTokens(userAccount1),
        false,
        "incorrect valid token"
      );
    });
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount
      });

      await publicForestFactory.initialize(
        arInstance.address,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        {
          from: deployerAccount
        }
      );

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount
      });
    });

    it("create public forest and update ipfsHash and factoryAddress", async () => {
      const ipfsHash = "ipfs hash 1";
      const newIpfsHash = "new ipfs";
      //------------- fail because implementation address not set
      await publicForestFactory
        .createPublicForest(ipfsHash, {
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await publicForestFactory.setImplementationAddress(publicForest.address);

      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
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

      await tempPublicForest
        .updateFactoryAddress(userAccount5, {
          from: dataManager
        })
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);

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
        from: deployerAccount
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei(treePrice.toString()),
        {
          from: deployerAccount
        }
      );

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });
      const fakeDaiInstance = await Token.new("DAI", "dai", {
        from: accounts[0]
      });

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount
      });

      planterInstance = await Planter.new({
        from: deployerAccount
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount
        }
      );

      treeTokenInstance = await Tree.new({
        from: deployerAccount
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount
      });

      daiFundInstance = await DaiFund.new({
        from: deployerAccount
      });

      await daiFundInstance.initialize(arInstance.address, {
        from: deployerAccount
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount
      });

      planterFundsInstnce = await PlanterFund.new({
        from: deployerAccount
      });

      await planterFundsInstnce.initialize(arInstance.address, {
        from: deployerAccount
      });

      attributeInstance = await Attribute.new({
        from: deployerAccount
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount
      });

      ////////////------------------ set regualr sale address

      await regularSaleInstance.setPlanterFundAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount
        }
      );

      await regularSaleInstance.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });

      await regularSaleInstance.setTreeFactoryAddress(
        treeFactoryInstance.address,
        { from: deployerAccount }
      );

      await regularSaleInstance.setDaiFundAddress(daiFundInstance.address, {
        from: deployerAccount
      });

      await regularSaleInstance.setAllocationAddress(
        allocationInstance.address,
        {
          from: deployerAccount
        }
      );

      await regularSaleInstance.setAttributesAddress(
        attributeInstance.address,
        { from: deployerAccount }
      );

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount
      });
      //--------------- set public forest address
      await publicForestFactory.setTreejerContractAddress(
        regularSaleInstance.address,
        { from: deployerAccount }
      );

      //set fake dai token address
      await publicForestFactory.setBaseTokenAddress(fakeDaiInstance.address, {
        from: deployerAccount
      });

      //-------------set daiFund address

      await daiFundInstance.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundsInstnce.address,
        {
          from: deployerAccount
        }
      );

      //-------------set treeFactory address

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount
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
          from: dataManager
        }
      );
      const daiFundShare = 0.48;
      const planterFundShare = 0.52;

      await allocationInstance.assignAllocationToTree(1, 1000000, 0, {
        from: dataManager
      });

      /////////////////------------ create forest
      const ipfsHash = "ipfs hash 1";

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount
      });

      await publicForestFactory.setImplementationAddress(publicForest.address);

      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      let forestAddress = await publicForestFactory.forests(0);
      let tempPublicForest = await PublicForest.at(forestAddress);
      await fakeDaiInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.mul(treePrice, 2).toString())
      );

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
      await publicForestFactory.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });
      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);

      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.divide(treePrice, 2).toString())
      );

      //-------------- fail because mint directly from publicForest
      await tempPublicForest
        .fundTrees(daiDexInstance.address, regularSaleInstance.address, {
          from: userAccount4
        })
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);

      //------------------- fail because invalid count

      await publicForestFactory
        .fundTrees(forestAddress)
        .should.be.rejectedWith(RegularSaleErrors.INVALID_COUNT);

      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.divide(treePrice, 2).toString())
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(forestAddress)),
        Number(web3.utils.toWei(treePrice.toString())),
        "incorrect balance"
      );

      await publicForestFactory.fundTrees(forestAddress);

      //check public forest balance
      assert.equal(
        Number(await daiDexInstance.balanceOf(forestAddress)),
        0,
        "incorrect balance"
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(daiFundInstance.address)),
        Math.mul(
          daiFundShare,
          Number(web3.utils.toWei(Math.mul(1, treePrice).toString()))
        )
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(planterFundsInstnce.address)),
        Math.mul(
          planterFundShare,
          Number(web3.utils.toWei(Math.mul(1, treePrice).toString()))
        )
      );

      assert.equal(
        await treeTokenInstance.ownerOf(10001),
        forestAddress,
        "token owner is not correct"
      );
      ///////------------------ mint 3 tree
      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.mul(treePrice, 3).toString())
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(forestAddress)),
        Number(web3.utils.toWei(Math.mul(treePrice, 3).toString())),
        "incorrect balance"
      );

      await publicForestFactory.fundTrees(forestAddress);

      assert.equal(
        Number(await daiDexInstance.balanceOf(forestAddress)),
        0,
        "incorrect balance"
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(daiFundInstance.address)),
        Math.mul(
          daiFundShare,
          Number(web3.utils.toWei(Math.mul(4, treePrice).toString()))
        )
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(planterFundsInstnce.address)),
        Math.mul(
          planterFundShare,
          Number(web3.utils.toWei(Math.mul(4, treePrice).toString()))
        )
      );

      for (let i = 10002; i < 10005; i++) {
        assert.equal(
          await treeTokenInstance.ownerOf(i),
          forestAddress,
          "token owner is not correct"
        );

        assert.equal(
          Number((await treeTokenInstance.attributes.call(i)).generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10005).should.be.rejected;

      /////////////--------------balance is more than 50 tree

      await daiDexInstance.setMint(
        forestAddress,
        web3.utils.toWei(Math.mul(treePrice, 60).toString())
      );

      await publicForestFactory.fundTrees(forestAddress);

      assert.equal(
        Number(await daiDexInstance.balanceOf(forestAddress)),
        Number(web3.utils.toWei(Math.mul(10, treePrice).toString())),
        "incorrect balance"
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(daiFundInstance.address)),
        Math.mul(
          daiFundShare,
          Number(web3.utils.toWei(Math.mul(54, treePrice).toString()))
        )
      );

      assert.equal(
        Number(await daiDexInstance.balanceOf(planterFundsInstnce.address)),
        Math.mul(
          planterFundShare,
          Number(web3.utils.toWei(Math.mul(54, treePrice).toString()))
        )
      );

      for (let i = 10005; i < 10055; i++) {
        assert.equal(
          await treeTokenInstance.ownerOf(i),
          forestAddress,
          "token owner is not correct"
        );

        assert.equal(
          Number((await treeTokenInstance.attributes.call(i)).generationType),
          1,
          `generationType for tree ${i} is inccorect`
        );
      }

      await treeTokenInstance.ownerOf(10055).should.be.rejected;
    });
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });
      ////////////////////// deploy contracts
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount
      });

      await publicForestFactory.initialize(
        arInstance.address,
        wethDexInstance.address,
        zeroAddress,
        zeroAddress,
        {
          from: deployerAccount
        }
      );

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount
      });

      await publicForestFactory.setImplementationAddress(publicForest.address);
      ////////////////////// deploy uniswap

      factoryInstance = await Factory.new(accounts[2], {
        from: deployerAccount
      });
      const factoryAddress = factoryInstance.address;

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0]
      });

      adaDexInstance = await Token.new("ADA", "ada", {
        from: accounts[0]
      });

      wmaticDexInstance = await Token.new("WMATIC", "wmatic", {
        from: accounts[0]
      });

      dexRouterInstance = await UniswapV2Router02New.new(
        factoryAddress,
        wethDexInstance.address,
        { from: deployerAccount }
      );
      const dexRouterAddress = dexRouterInstance.address;

      testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
        from: deployerAccount
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

      await wmaticDexInstance.setMint(
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
        daiDexInstance.address,
        bnbDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("500000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        adaDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );

      await testUniswapInstance.addLiquidity(
        daiDexInstance.address,
        wmaticDexInstance.address,
        web3.utils.toWei("250000000", "Ether"),
        web3.utils.toWei("125000000", "Ether")
      );
    });

    it("test swapTokenToBaseToken", async () => {
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
        from: userAccount1
      });

      let forestAddress = await publicForestFactory.forests(0);

      forestInstance1 = await PublicForest.at(forestAddress);

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
        web3.utils.toWei("10", "Ether")
      );

      assert.equal(
        await daiDexInstance.balanceOf(forestAddress),
        0,
        "before dai balance is not correct"
      );

      assert.equal(
        await bnbDexInstance.balanceOf(forestAddress),
        web3.utils.toWei("10", "Ether"),
        "before bnb balance is not correct"
      );
      assert.equal(
        await adaDexInstance.balanceOf(forestAddress),
        web3.utils.toWei("10", "Ether"),
        "before ada balance is not correct"
      );
      assert.equal(
        await wethDexInstance.balanceOf(forestAddress),
        web3.utils.toWei("10", "Ether"),
        "before weth balance is not correct"
      );

      await publicForestFactory.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount
      });

      await publicForestFactory.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });

      ///------------------ reject(bnb not valid token)

      await publicForestFactory
        .swapTokenToBaseToken(forestAddress, bnbDexInstance.address, 0)
        .should.be.rejectedWith(PublicForestErrors.INVALID_TOKEN);

      ///----------------- set bnb to valid address

      await publicForestFactory.updateValidTokens(
        bnbDexInstance.address,
        true,
        { from: dataManager }
      );

      //--------------------------- swap bnb balance to dai

      let expectedSwapTokenAmountBnb1 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei("10", "Ether"),
        [bnbDexInstance.address, daiDexInstance.address]
      );

      await publicForestFactory.swapTokenToBaseToken(
        forestAddress,
        bnbDexInstance.address,
        expectedSwapTokenAmountBnb1[1]
      );

      assert.equal(
        Number(expectedSwapTokenAmountBnb1[1]),
        Number(await daiDexInstance.balanceOf(forestAddress)),
        "after dai balance is not correct"
      );

      assert.equal(
        await bnbDexInstance.balanceOf(forestAddress),
        0,
        "after bnb balance is not correct"
      );

      assert.equal(
        await wethDexInstance.balanceOf(forestAddress),
        web3.utils.toWei("10", "Ether"),
        "before weth balance is not correct"
      );

      //--------------------------- swap weth balance to dai

      let expectedSwapTokenAmountWeth1 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei("10", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await publicForestFactory.swapTokenToBaseToken(
        forestAddress,
        wethDexInstance.address,
        0
      );

      assert.equal(
        Number(
          Math.Big(expectedSwapTokenAmountBnb1[1]).plus(
            expectedSwapTokenAmountWeth1[1]
          )
        ),
        Number(await daiDexInstance.balanceOf(forestAddress)),
        "after dai balance is not correct"
      );

      assert.equal(
        await wethDexInstance.balanceOf(forestAddress),
        0,
        "after weth balance is not correct"
      );

      //--------------------------- swap ada balance to dai

      let expectedSwapTokenAmountAda1 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei("10", "Ether"),
        [adaDexInstance.address, daiDexInstance.address]
      );

      await publicForestFactory.swapTokenToBaseToken(
        forestAddress,
        adaDexInstance.address,
        0
      );

      assert.equal(
        Number(
          Math.Big(expectedSwapTokenAmountBnb1[1])
            .plus(expectedSwapTokenAmountWeth1[1])
            .plus(expectedSwapTokenAmountAda1[1])
        ),
        Number(await daiDexInstance.balanceOf(forestAddress)),
        "after dai balance is not correct"
      );

      assert.equal(
        await adaDexInstance.balanceOf(forestAddress),
        0,
        "after ada balance is not correct"
      );

      //-------------- balance not enough

      await publicForestFactory
        .swapTokenToBaseToken(forestAddress, bnbDexInstance.address, 0)
        .should.be.rejectedWith(CommonErrorMsg.INSUFFICIENT_INPUT_AMOUNT);

      //-------------- balance swap lt 2 Dai
      let expectedSwapTokenAmountWeth2 = await dexRouterInstance.getAmountsIn.call(
        web3.utils.toWei("1.5", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await wethDexInstance.setMint(
        forestAddress,
        expectedSwapTokenAmountWeth2[0]
      );

      await publicForestFactory
        .swapTokenToBaseToken(forestAddress, wethDexInstance.address, 0)
        .should.be.rejectedWith(CommonErrorMsg.INSUFFICIENT_OUTPUT_AMOUNT);

      let expectedSwapTokenAmountWeth3 = await dexRouterInstance.getAmountsIn.call(
        web3.utils.toWei("1.5", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await wethDexInstance.setMint(
        forestAddress,
        expectedSwapTokenAmountWeth3[0]
      );

      await publicForestFactory
        .swapTokenToBaseToken(
          forestAddress,
          wethDexInstance.address,
          web3.utils.toWei("3", "Ether")
        )
        .should.be.rejectedWith(CommonErrorMsg.INSUFFICIENT_OUTPUT_AMOUNT);

      assert.equal(
        Number(await wethDexInstance.balanceOf(forestAddress)),
        Number(
          Math.Big(expectedSwapTokenAmountWeth2[0]).plus(
            expectedSwapTokenAmountWeth3[0]
          )
        ),
        "3-weth balance is not correct"
      );

      let expectedSwapTokenAmountWeth5 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei(
          Number(
            Math.Big(expectedSwapTokenAmountWeth2[0]).plus(
              expectedSwapTokenAmountWeth3[0]
            )
          ).toString(),
          "wei"
        ),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await publicForestFactory.swapTokenToBaseToken(
        forestAddress,
        wethDexInstance.address,
        0
      );

      assert.equal(
        Number(await wethDexInstance.balanceOf(forestAddress)),
        0,
        "4-weth balance is not correct"
      );

      assert.equal(
        Number(
          Math.Big(expectedSwapTokenAmountBnb1[1])
            .plus(expectedSwapTokenAmountWeth1[1])
            .plus(expectedSwapTokenAmountAda1[1])
            .plus(expectedSwapTokenAmountWeth5[1])
        ),
        Number(await daiDexInstance.balanceOf(forestAddress)),
        "4-dai balance is not correct"
      );

      // ------------ reject (invalid forest address)
      await publicForestFactory
        .swapTokenToBaseToken(userAccount5, wethDexInstance.address, 0, {
          from: userAccount1
        })
        .should.be.rejectedWith(PublicForestErrors.INVALID_FOREST_ADDRESS);

      //-----------should be rejecte (invalid access)
      await forestInstance1
        .swapTokenToBaseToken(
          dexRouterInstance.address,
          wethDexInstance.address,
          daiDexInstance.address,
          0
        )
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);
    });

    it("test swapMainCoinToBaseToken", async () => {
      const ipfsHash = "ipfs hash 1";

      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      await publicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount2
      });

      let forestAddress1 = await publicForestFactory.forests(0);

      let forestInstance1 = await PublicForest.at(forestAddress1);

      let forestAddress2 = await publicForestFactory.forests(1);

      let forestInstance2 = await PublicForest.at(forestAddress2);

      assert.equal(
        await publicForestFactory.forestToOwners(forestAddress1),
        userAccount1,
        "owner forest1 is not correct"
      );

      assert.equal(
        await publicForestFactory.forestToOwners(forestAddress2),
        userAccount2,
        "owner forest2 is not correct"
      );

      //---------------set intial data

      await publicForestFactory
        .setDexRouterAddress(dexRouterInstance.address, {
          from: userAccount3
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount
      });

      await publicForestFactory
        .setBaseTokenAddress(daiDexInstance.address, {
          from: userAccount3
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setBaseTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });

      //------transfer ether to forest

      await web3.eth.sendTransaction({
        from: userAccount1,
        to: forestAddress1,
        value: web3.utils.toWei("25", "Ether")
      });

      await web3.eth.sendTransaction({
        from: userAccount4,
        to: forestAddress2,
        value: web3.utils.toWei("25", "Ether")
      });

      //------call swapMainCoinToBaseToken function

      let expectedSwapTokenAmountWeth1 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei("25", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await publicForestFactory.swapMainCoinToBaseToken(forestAddress1, 0, {
        from: userAccount1
      });

      //-------------- check data
      assert.equal(
        await web3.eth.getBalance(forestAddress1),
        0,
        "forestAddress1 balance is incorrect"
      );

      assert.equal(
        await web3.eth.getBalance(forestAddress2),
        web3.utils.toWei("25", "Ether"),
        "forestAddress2 balance is incorrect"
      );

      assert.equal(
        Number(expectedSwapTokenAmountWeth1[1]),
        Number(await daiDexInstance.balanceOf(forestAddress1)),
        "after dai balance is not correct"
      );

      //-------------------reject (INSUFFICIENT_OUTPUT_AMOUNT)

      let expectedSwapTokenAmountWeth2 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei("7.5", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      let expectedSwapTokenAmountWeth3 = await dexRouterInstance.getAmountsIn.call(
        web3.utils.toWei("1.5", "Ether"),
        [wethDexInstance.address, daiDexInstance.address]
      );

      let expectedSwapTokenAmountWeth4 = await dexRouterInstance.getAmountsOut.call(
        web3.utils.toWei(
          Math.Big(web3.utils.toWei("5", "Ether"))
            .plus(expectedSwapTokenAmountWeth3[0])
            .toString(),
          "wei"
        ),
        [wethDexInstance.address, daiDexInstance.address]
      );

      await web3.eth.sendTransaction({
        from: userAccount4,
        to: forestAddress1,
        value: expectedSwapTokenAmountWeth3[0]
      });

      await publicForestFactory
        .swapMainCoinToBaseToken(forestAddress1, 0, {
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.INSUFFICIENT_OUTPUT_AMOUNT);

      await web3.eth.sendTransaction({
        from: userAccount4,
        to: forestAddress1,
        value: web3.utils.toWei("5", "Ether")
      });

      await publicForestFactory
        .swapMainCoinToBaseToken(
          forestAddress1,
          expectedSwapTokenAmountWeth2[1],
          {
            from: userAccount1
          }
        )
        .should.be.rejectedWith(CommonErrorMsg.INSUFFICIENT_OUTPUT_AMOUNT);

      //------------------------------------check balance
      assert.equal(
        await web3.eth.getBalance(forestAddress2),
        web3.utils.toWei("25", "Ether"),
        "2-forestAddress2 balance is incorrect"
      );

      assert.equal(
        await web3.eth.getBalance(forestAddress1),
        Math.Big(web3.utils.toWei("5", "Ether")).plus(
          expectedSwapTokenAmountWeth3[0]
        ),
        "2-forestAddress1 balance is incorrect"
      );

      //---------swap

      await publicForestFactory.swapMainCoinToBaseToken(
        forestAddress1,
        expectedSwapTokenAmountWeth4[1],
        {
          from: userAccount1
        }
      );

      //---------------check data

      assert.equal(
        await web3.eth.getBalance(forestAddress2),
        web3.utils.toWei("25", "Ether"),
        "3-forestAddress2 balance is incorrect"
      );

      assert.equal(
        await web3.eth.getBalance(forestAddress1),
        0,
        "3-forestAddress1 balance is incorrect"
      );

      assert.equal(
        Number(
          Math.Big(expectedSwapTokenAmountWeth1[1]).plus(
            expectedSwapTokenAmountWeth4[1]
          )
        ),
        Number(await daiDexInstance.balanceOf(forestAddress1)),
        "after dai balance is not correct"
      );

      // ------------ reject (invalid forest address)
      await publicForestFactory
        .swapMainCoinToBaseToken(userAccount5, 0, {
          from: userAccount1
        })
        .should.be.rejectedWith(PublicForestErrors.INVALID_FOREST_ADDRESS);

      //-----------should be rejecte (invalid access)
      await forestInstance1
        .swapMainCoinToBaseToken(
          dexRouterInstance.address,
          wethDexInstance.address,
          daiDexInstance.address,
          0
        )
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);
    });
  });

  describe("Check approve external erc1155", () => {
    beforeEach(async () => {
      treeInstance = await Tree.new({
        from: deployerAccount
      });

      await treeInstance.initialize(arInstance.address, "", {
        from: deployerAccount
      });

      testPublicForestFactory = await TestPublicForestFactory.new({
        from: deployerAccount
      });

      await testPublicForestFactory.initialize(
        arInstance.address,
        zeroAddress,
        zeroAddress,
        treeInstance.address,
        {
          from: deployerAccount
        }
      );

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize(
        "treejer",
        testPublicForestFactory.address,
        {
          from: deployerAccount
        }
      );

      await testPublicForestFactory.setImplementationAddress(
        publicForest.address
      );

      erc1155TokenInstance = await Erc1155Token.new({
        from: deployerAccount
      });
    });

    it("factory address must be valid", async () => {
      await testPublicForestFactory
        .externalTokenERC1155Approve(userAccount5, erc1155TokenInstance.address)
        .should.be.rejectedWith(PublicForestErrors.INVALID_FOREST_ADDRESS);
    });

    it("proxy can't get approve for treejer tree's", async () => {
      //---------deploy forest

      const ipfsHash = "ipfs hash 1";

      await testPublicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      let forestAddress1 = await testPublicForestFactory.forests(0);

      await testPublicForestFactory
        .externalTokenERC1155Approve(forestAddress1, treeInstance.address)
        .should.be.rejectedWith(PublicForestErrors.TREEJER_CONTRACT);
    });

    it("check erc1155 approve", async () => {
      const ipfsHash = "ipfs hash 1";

      await testPublicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      let forestAddress1 = await testPublicForestFactory.forests(0);

      let forestInstance1 = await PublicForest.at(forestAddress1);

      await erc1155TokenInstance.safeMint(forestAddress1, 4, 1);

      await testPublicForestFactory.transferFromErc1155(
        userAccount6,
        forestAddress1,
        erc1155TokenInstance.address,
        4,
        1
      ).should.be.rejected;

      assert.equal(
        await erc1155TokenInstance.isApprovedForAll(
          forestAddress1,
          testPublicForestFactory.address
        ),
        false,
        "1-result is not correct"
      );

      await testPublicForestFactory.externalTokenERC1155Approve(
        forestAddress1,
        erc1155TokenInstance.address
      );

      assert.equal(
        await erc1155TokenInstance.isApprovedForAll(
          forestAddress1,
          testPublicForestFactory.address
        ),
        true,
        "2-result is not correct"
      );

      assert.equal(
        await erc1155TokenInstance.balanceOf(forestAddress1, 4),
        1,
        "balance is not correct"
      );

      assert.equal(
        await erc1155TokenInstance.balanceOf(userAccount6, 4),
        0,
        "2-balance is not correct"
      );

      await testPublicForestFactory.transferFromErc1155(
        userAccount6,
        forestAddress1,
        erc1155TokenInstance.address,
        4,
        1
      );

      assert.equal(
        await erc1155TokenInstance.balanceOf(forestAddress1, 4),
        0,
        "3-balance is not correct"
      );

      assert.equal(
        await erc1155TokenInstance.balanceOf(userAccount6, 4),
        1,
        "4-balance is not correct"
      );

      await forestInstance1
        .externalTokenERC1155Approve(
          erc1155TokenInstance.address,
          userAccount8,
          true,
          {
            from: userAccount4
          }
        )
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);
    });
  });

  describe("Check approve external erc721", () => {
    beforeEach(async () => {
      treeInstance = await Tree.new({
        from: deployerAccount
      });

      await treeInstance.initialize(arInstance.address, "", {
        from: deployerAccount
      });

      testPublicForestFactory = await TestPublicForestFactory.new({
        from: deployerAccount
      });

      await testPublicForestFactory.initialize(
        arInstance.address,
        zeroAddress,
        zeroAddress,
        treeInstance.address,
        {
          from: deployerAccount
        }
      );

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize(
        "treejer",
        testPublicForestFactory.address,
        {
          from: deployerAccount
        }
      );

      await testPublicForestFactory.setImplementationAddress(
        publicForest.address
      );

      erc721TokenInstance = await Erc721Token.new("EXAMPLE", "example", {
        from: deployerAccount
      });
    });

    it("factory address must be valid", async () => {
      await testPublicForestFactory
        .externalTokenERC721Approve(
          userAccount5,
          erc721TokenInstance.address,
          0
        )
        .should.be.rejectedWith(PublicForestErrors.INVALID_FOREST_ADDRESS);
    });

    it("proxy can't get approve for treejer tree's", async () => {
      //---------deploy forest

      const ipfsHash = "ipfs hash 1";

      await testPublicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      let forestAddress1 = await testPublicForestFactory.forests(0);

      await testPublicForestFactory
        .externalTokenERC721Approve(forestAddress1, treeInstance.address, 0)
        .should.be.rejectedWith(PublicForestErrors.TREEJER_CONTRACT);
    });

    it("check erc721 approve", async () => {
      const ipfsHash = "ipfs hash 1";

      await testPublicForestFactory.createPublicForest(ipfsHash, {
        from: userAccount1
      });

      let forestAddress1 = await testPublicForestFactory.forests(0);

      let forestInstance1 = await PublicForest.at(forestAddress1);

      await testPublicForestFactory
        .externalTokenERC721Approve(
          forestAddress1,
          erc721TokenInstance.address,
          1
        )
        .should.be.rejectedWith(erc721ErrorMsg.QUERY_FOR_NOTEXIST_TOKEN);

      await erc721TokenInstance.safeMint(userAccount4, 1);

      await testPublicForestFactory
        .externalTokenERC721Approve(
          forestAddress1,
          erc721TokenInstance.address,
          1
        )
        .should.be.rejectedWith(erc721ErrorMsg.CALLER_NOT_OWNER);

      await erc721TokenInstance.safeMint(forestAddress1, 2);

      await testPublicForestFactory.externalTokenERC721Approve(
        forestAddress1,
        erc721TokenInstance.address,
        2
      );

      assert.equal(
        await erc721TokenInstance.getApproved(2),
        testPublicForestFactory.address,
        "approve is not correct"
      );

      await erc721TokenInstance.safeTransferFrom(
        userAccount4,
        forestAddress1,
        1,
        { from: userAccount4 }
      );

      assert.equal(
        await erc721TokenInstance.getApproved(1),
        zeroAddress,
        "approve is not correct"
      );

      await testPublicForestFactory.externalTokenERC721Approve(
        forestAddress1,
        erc721TokenInstance.address,
        1
      );

      assert.equal(
        await erc721TokenInstance.getApproved(1),
        testPublicForestFactory.address,
        "approve is not correct"
      );

      //---transfer from

      assert.equal(
        await erc721TokenInstance.ownerOf(1),
        forestAddress1,
        "1-owner is not correct"
      );

      await testPublicForestFactory.transferFromErc721(
        userAccount6,
        forestAddress1,
        erc721TokenInstance.address,
        1
      );

      assert.equal(
        await erc721TokenInstance.ownerOf(1),
        userAccount6,
        "2-owner is not correct"
      );

      await erc721TokenInstance.safeMint(forestAddress1, 4);

      await testPublicForestFactory.transferFromErc721(
        userAccount6,
        forestAddress1,
        erc721TokenInstance.address,
        4
      ).should.be.rejected;

      await testPublicForestFactory.externalTokenERC721Approve(
        forestAddress1,
        erc721TokenInstance.address,
        4
      );

      await testPublicForestFactory.transferFromErc721(
        userAccount6,
        forestAddress1,
        erc721TokenInstance.address,
        4
      );

      await forestInstance1
        .externalTokenERC721Approve(
          erc721TokenInstance.address,
          userAccount8,
          10,
          {
            from: userAccount4
          }
        )
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);
    });
  });
});
