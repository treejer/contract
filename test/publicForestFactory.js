// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const AccessRestriction = artifacts.require("AccessRestriction");
const PublicForestFactory = artifacts.require("PublicForestFactory");
const RegularSale = artifacts.require("RegularSale");
const PublicForest = artifacts.require("PublicForest");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
const TestUniswap = artifacts.require("TestUniswap.sol");
const Factory = artifacts.require("Factory.sol");
const Token = artifacts.require("Weth");

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
  PublicForestErrors
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

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount
      });
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
        .setDaiTokenAddress(userAccount2, {
          from: userAccount1
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await publicForestFactory.setDaiTokenAddress(userAccount2, {
        from: deployerAccount
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

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount
      });

      publicForest = await PublicForest.new({
        from: deployerAccount
      });

      await publicForest.initialize("treejer", publicForestFactory.address, {
        from: deployerAccount
      });

      await publicForestFactory.setImplementationAddress(publicForest.address);
    });

    it("create public forest and update ipfsHash and factoryAddress", async () => {
      const ipfsHash = "ipfs hash 1";
      const newIpfsHash = "new ipfs";
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
  });

  describe("deployment and set addresses and set valid tokens", () => {
    beforeEach(async () => {
      ////////////////////// deploy contracts
      publicForestFactory = await PublicForestFactory.new({
        from: deployerAccount
      });

      await publicForestFactory.initialize(arInstance.address, {
        from: deployerAccount
      });

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

      wethDexInstance = await Token.new("WETH", "weth", { from: accounts[0] });

      daiDexInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      bnbDexInstance = await Token.new("BNB", "bnb", {
        from: accounts[0]
      });

      adaDexInstance = await Token.new("ADA", "ada", {
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
    });

    it.only("test swapTokenToDai", async () => {
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

      await publicForestFactory.setDaiTokenAddress(daiDexInstance.address, {
        from: deployerAccount
      });

      ///------------------ reject(bnb not valid token)

      await publicForestFactory
        .swapTokenToDai(forestAddress, bnbDexInstance.address, 0)
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

      await publicForestFactory.swapTokenToDai(
        forestAddress,
        bnbDexInstance.address,
        0
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

      await publicForestFactory.swapTokenToDai(
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

      await publicForestFactory.swapTokenToDai(
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
        .swapTokenToDai(forestAddress, bnbDexInstance.address, 0)
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
        .swapTokenToDai(forestAddress, wethDexInstance.address, 0)
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
        .swapTokenToDai(
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

      await publicForestFactory.swapTokenToDai(
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

      //-----------should be rejecte (invalid access)
      await forestInstance1
        .swapTokenToDAI(
          wethDexInstance.address,
          0,
          daiDexInstance.address,
          dexRouterInstance.address
        )
        .should.be.rejectedWith(PublicForestErrors.NOT_FACTORY_ADDRESS);
    });
  });
});
