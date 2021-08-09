const AccessRestriction = artifacts.require("AccessRestriction.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Tree = artifacts.require("Tree.sol");
const Planter = artifacts.require("Planter.sol");
const FinancialModel = artifacts.require("FinancialModel.sol");
const WethFunds = artifacts.require("WethFunds.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const UniswapV2Router02New = artifacts.require("UniswapV2Router02New.sol");
var Dai = artifacts.require("Dai.sol");
var Weth = artifacts.require("Weth.sol");
const Factory = artifacts.require("Factory.sol");
var TestUniswap = artifacts.require("TestUniswap.sol");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");
const {
  TimeEnumes,
  CommonErrorMsg,
  TreeAuctionErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const zeroAddress = "0x0000000000000000000000000000000000000000";
contract("TreeAuction", (accounts) => {
  let treeAuctionInstance;
  let arInstance;
  let TreasuryInstance;
  let treeFactoryInstance;
  let startTime;
  let endTime;
  let planterInstance;
  let financialModelInstance;
  let wethFundsInstance;
  let uniswapRouterInstance;
  let planterFundsInstnce;
  let factoryInstance;
  let wethInstance;
  let daiInstance;
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

  const ipfsHash = "some ipfs hash here";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    treeAuctionInstance = await deployProxy(TreeAuction, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    TreasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    financialModelInstance = await deployProxy(
      FinancialModel,
      [arInstance.address],
      {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      }
    );

    wethFundsInstance = await deployProxy(WethFunds, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

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

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterFundsInstnce = await deployProxy(PlanterFund, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    wethInstance = await Weth.new("WETH", "weth", { from: deployerAccount });

    factoryInstance = await Factory.new(accounts[2], { from: deployerAccount });
    const factoryAddress = factoryInstance.address;

    factoryInstance.INIT_CODE_PAIR_HASH();

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

    const testUniswapAddress = testUniswapInstance.address;

    await wethInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("10000", "Ether")
    );

    await daiInstance.setMint(
      testUniswapAddress,
      web3.utils.toWei("10000", "Ether")
    );

    await testUniswapInstance.addLiquidity();

    //////////////////////////////-------------------- handle address
    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
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

    await wethFundsInstance.setPlanterFundContractAddress(
      planterFundsInstnce.address,
      {
        from: deployerAccount,
      }
    );
    await Common.addFundsRole(
      arInstance,
      wethFundsInstance.address,
      deployerAccount
    );
    await treeAuctionInstance.setWethFundsAddress(wethFundsInstance.address, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await TreasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => {});
  /*
  ////////////// ---------------------------------- deploy ----------------------------
  it("deploys successfully", async () => {
    const address = treeAuctionInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  ////////////// ---------------------------------- set tree factory contract address ----------------------------

  it("should set tree factory address with admin access or fail otherwise", async () => {
    await treeAuctionInstance
      .setTreeFactoryAddress(treeFactoryInstance.address, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account

    let tx = await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );
  });

  ////////////// ---------------------------------- set financial model contract address ----------------------------
  it("should set financial model address with admin access or fail otherwise", async () => {
    await treeAuctionInstance
      .setFinancialModelAddress(financialModelInstance.address, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account

    let tx = await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );
  });
  ////////////// ---------------------------------- set weth funds contract address ----------------------------

  it("should set weth funds address with admin access or fail otherwise", async () => {
    let tx = await treeAuctionInstance.setWethFundsAddress(
      wethFundsInstance.address,
      {
        from: deployerAccount,
      }
    );
    await treeAuctionInstance
      .setWethFundsAddress(wethFundsInstance.address, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
  });

  ///////////////// ----------------------------- add auction -------------------------------
  it("auction call by admin access or fail otherwise", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    const treeId = 1;
    const treeId2 = 2;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
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

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeFactoryInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });
    //only admin can call this method so it should be rejected
    await treeAuctionInstance
      .createAuction(
        treeId2,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: userAccount1 }
      )
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("should fail auction with duplicate tree id ( tree is in other provide ) ", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    let treeId = 1;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
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

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: deployerAccount }
      )
      .should.be.rejectedWith(TreeAuctionErrorMsg.TREE_STATUS);
  });

  it("Create auction should be fail (Assign models not exist) ", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    let treeId = 1;

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: deployerAccount }
      )
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

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

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: deployerAccount }
      )
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);
  });

  it("Check auction data insert conrrectly", async () => {
    let treeId = 1;
    let initialValue = web3.utils.toWei("1");
    let bidInterval = web3.utils.toWei("0.1");

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
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

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      initialValue,
      bidInterval,
      { from: deployerAccount }
    );

    let result = await treeAuctionInstance.auctions.call(0);

    assert.equal(result.treeId.toNumber(), treeId);
    assert.equal(Number(result.highestBid), initialValue);
    assert.equal(Number(result.bidInterval), bidInterval);
    assert.equal(Number(result.startDate), Number(startTime));
    assert.equal(Number(result.endDate), Number(endTime));
  });
  
  it("bid auction and check highest bid set change correctly and check bidder balance and contract balance", async () => {
    const bidderAccount = userAccount1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const treeId = 1;
    
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    
    /////////// -------------------- handle roles
    
    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
      );
      
      ////////////// ------------------ handle address
      
      await treeAuctionInstance.setFinancialModelAddress(
        financialModelInstance.address,
        {
          from: deployerAccount,
        }
        );
        
        await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
          from: deployerAccount,
        });
        
        /////////////////// ---------------give approve to auction contract

        await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
          from: bidderAccount,
        });
        
        /////////////////// --------------- handle add tree
        
        await treeFactoryInstance.addTree(treeId, ipfsHash, {
          from: deployerAccount,
        });
        //////////////////// ----------------- handle dm model
        
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
    
    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });
    
    ////////////---------------------- create auction
    
    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
      );
      
      const resultBefore = await treeAuctionInstance.auctions.call(0);
      
      ////////////////// charge bidder account and check balance before bid
      
      await wethInstance.setMint(bidderAccount, bidderInitialBalance);
      
      const bidderBalanceBefore = await wethInstance.balanceOf(bidderAccount);
      
      assert.equal(
        bidderBalanceBefore,
        Number(bidderInitialBalance),
        "bidderAmount is not "
        );
        /////////////////// ------------- bid
        
        await treeAuctionInstance.bid(0, bidAmount, {
          from: bidderAccount,
        });
        
        /////////////////---------------- check contract and bidder balace after bid
        
        const contractBalanceAfterBid = await wethInstance.balanceOf(
          treeAuctionInstance.address
          );
          
          const bidderBalanceAfter = await wethInstance.balanceOf(bidderAccount);
          
          assert.equal(
            Number(bidderBalanceAfter),
            Math.subtract(Number(bidderInitialBalance), Number(bidAmount))
            );
            
            assert.equal(
              Number(contractBalanceAfterBid),
              Number(bidAmount),
              "contract balance is not ok"
              );
              
              const resultAfter = await treeAuctionInstance.auctions.call(0);
              assert.equal(
                Math.subtract(
                  Number(resultAfter.highestBid),
                  Number(resultBefore.highestBid)
                  ),
                  web3.utils.toWei("0.15")
                  );
                });
                it("must offer suitable value for auction or rejected otherwise", async () => {
                  const treeId = 1;
                  const bidAmount = web3.utils.toWei("1.15");
                  const invalidBidAmmount = web3.utils.toWei("1.05");
                  const bidderInitialBalance = web3.utils.toWei("2");
                  
                  const bidderAccount = userAccount1;
                  
                  startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
                  endTime = await Common.timeInitial(TimeEnumes.hours, 1);
                  
                  ////////////////// ------------------- handle address
                  
                  await treeAuctionInstance.setFinancialModelAddress(
                    financialModelInstance.address,
                    {
                      from: deployerAccount,
      }
      );
      
      await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });
      
      ////////////////// --------------------- handle roles
      
      await Common.addAuctionRole(
        arInstance,
        treeAuctionInstance.address,
        deployerAccount
        );
        
        /////////////////// ---------------give approve to auction contract
        
        await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
          from: bidderAccount,
        });
        /////////////////--------------- handle add tree
        
        await treeFactoryInstance.addTree(treeId, ipfsHash, {
          from: deployerAccount,
        });
        
        ////////////////////// ------------------- handle dm model

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
          
          await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
            from: deployerAccount,
          });
          
          ////////////////////// -------------------- handle create auction
          await treeAuctionInstance.createAuction(
            treeId,
            Number(startTime),
            Number(endTime),
            web3.utils.toWei("1"),
            web3.utils.toWei("0.1"),
            { from: deployerAccount }
            );
            
            ////////////////// charge bidder account
            
            await wethInstance.setMint(bidderAccount, bidderInitialBalance);
            
    //////////////////// ----------------------- bid
    
    await treeAuctionInstance
    .bid(0, invalidBidAmmount, {
      from: bidderAccount,
    })
    .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);
    
    await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });
  });
  

  it("should fail when bidder dont have enough balance", async () => {
    const treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("1");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    ////////////////// --------------------- handle roles

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    ////////////////////// ------------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    ////////////////////// -------------------- handle create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    //////////////////// ----------------------- bid

    await treeAuctionInstance
      .bid(0, bidAmount, {
        from: bidderAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.INSUFFICIENT_AMOUNT);
  });
  
  it("should increase end time of auction beacuse bid less than 600 secconds left to end of auction", async () => {
    const treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 300);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    ////////////////// --------------------- handle roles

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    let tx = await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    let resultBefore = await treeAuctionInstance.auctions.call(0);

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    /////////////////////////// ----------------- bid
    await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });

    ///////////////////////// check auction data after bid

    let resultAfterChangeTime = await treeAuctionInstance.auctions.call(0);

    assert.equal(
      Math.subtract(
        resultAfterChangeTime.endDate.toNumber(),
        resultBefore.endDate.toNumber()
      ),
      600
    );
  });

  it("bid before start of aution must be failed", async () => {
    const treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.minutes, 5);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    ////////////////// --------------------- handle roles

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    let tx = await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    //////////////////////////// fail to bid

    await treeAuctionInstance
      .bid(0, bidAmount, {
        from: bidderAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_BEFORE_START);
  });

  it("bid after end of auction must be failed", async () => {
    const treeId = 1;
    const bidAmount1 = web3.utils.toWei("1.15");
    const bidAmount2 = web3.utils.toWei("1.5");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount1;
    const bidderAccount2 = userAccount2;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    ////////////////// --------------------- handle roles

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1, {
      from: bidderAccount1,
    });
    await wethInstance.approve(treeAuctionInstance.address, bidAmount2, {
      from: bidderAccount2,
    });

    await /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    let tx = await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);
    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    ///////////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance.bid(0, bidAmount1, {
      from: bidderAccount1,
    });

    await Common.travelTime(TimeEnumes.hours, 2);
    await treeAuctionInstance
      .bid(0, bidAmount2, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_AFTER_END);
  });

  it("should emit highest bid event", async () => {
    const treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    ////////////////// --------------------- handle roles

    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    let tx = await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });

    truffleAssert.eventEmitted(tx, "HighestBidIncreased", (ev) => {
      return (
        Number(ev.auctionId) == 0 &&
        ev.bidder == bidderAccount &&
        Number(ev.amount) == Number(bidAmount) &&
        Number(ev.treeId) == treeId
      );
    });
  });

  it("should emit end time event", async () => {
    let treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    /////////////////////////////////////////////////////////////////////////////

    let tx = await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });

    truffleAssert.eventEmitted(tx, "AuctionEndTimeIncreased", (ev) => {
      return (
        Number(ev.auctionId) == 0 &&
        Number(ev.newAuctionEndTime) == Math.add(Number(endTime), 600)
      );
    });
  });

  it("should end auction and fail in invalid situations", async () => {
    const treeId = 1;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    ///////////////////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance
      .endAuction(0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME); //end time dont reach and must be rejected

    await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 670);

    let successEnd = await treeAuctionInstance.endAuction(0, {
      from: deployerAccount,
    }); //succesfully end the auction

    let result = await treeAuctionInstance.auctions.call(0);

    assert.equal(Number(result.endDate), 0, "auction not true");

    assert.equal(Number(result.startDate), 0, "auction not true");

    let failEnd = await treeAuctionInstance
      .endAuction(0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.AUCTION_IS_UNAVAILABLE); //auction already ended and must be rejected
  });

  it("Check emit auction settled event", async () => {
    const treeId = 1;

    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    //////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance.bid(0, bidAmount, {
      from: bidderAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 670);

    let successEnd = await treeAuctionInstance.endAuction(0, {
      from: bidderAccount,
    });

    let addressGetToken = await treeTokenInstance.ownerOf(treeId);

    assert.equal(addressGetToken, userAccount1, "token not true mint");

    truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
      return (
        Number(ev.auctionId) == 0 &&
        Number(ev.treeId) == treeId &&
        ev.winner == bidderAccount &&
        Number(ev.amount) == bidAmount
      );
    });
  });

  it("end auction when there is no bidder", async () => {
    //TODO: check tree provide status in this test

    const treeId = 2;
    const bidAmount = web3.utils.toWei("1.15");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    /////////////////////////////////////////////////////////////////////////////////

    await Common.travelTime(TimeEnumes.seconds, 70);

    let failEnd = await treeAuctionInstance.endAuction(0, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(failEnd, "AuctionEnded", (ev) => {
      return Number(ev.auctionId) == 0 && Number(ev.treeId) == treeId;
    });
  });

  it("Should automatic withdraw successfully", async () => {
    const auctionId = 0;
    const treeId = 0;
    const bidAmount1 = web3.utils.toWei("1.5");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount1;
    const bidAmount2 = web3.utils.toWei("2");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount2 = userAccount2;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 120);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2, {
      from: bidderAccount2,
    });

    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);
    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    /////////////////////////////////////////////////////////////////////////////////////////

    //create auction

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, bidAmount1, {
      from: bidderAccount1,
    });

    //check contract balance
    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount1),
      "1.Contract balance is not true"
    );

    let refer1AccountBalanceAfterBid = await wethInstance.balanceOf(
      bidderAccount1
    );

    //userAccount2 take part in auction
    await treeAuctionInstance
      .bid(auctionId, bidAmount1, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance.bid(auctionId, bidAmount2, {
      from: bidderAccount2,
    });

    //check contract balance
    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount2),
      "2.Contract balance is not true"
    );

    //check userAccount1 refunded
    assert.equal(
      Number(await wethInstance.balanceOf(bidderAccount1)),
      Math.add(Number(refer1AccountBalanceAfterBid), Number(bidAmount1)),
      "Redirect automatic withdraw is not true"
    );
  });

  it("Check contract balance when user call bid function and Balance should be ok", async () => {
    //TODO:add user balance check here

    let auctionId = 0;
    const treeId = 0;

    const bidAmount1 = web3.utils.toWei("1.5");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount1;
    const bidAmount2 = web3.utils.toWei("2");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount2 = userAccount2;
    const bidAmount3 = web3.utils.toWei("4");
    const bidderInitialBalance3 = web3.utils.toWei("5");
    const bidderAccount3 = userAccount3;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 120);
    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2, {
      from: bidderAccount2,
    });
    await wethInstance.approve(treeAuctionInstance.address, bidAmount3, {
      from: bidderAccount3,
    });

    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);
    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);
    await wethInstance.setMint(bidderAccount3, bidderInitialBalance3);

    ///////////////////////////////////////////////////////////////////////////////////////////////

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, bidAmount1, {
      from: bidderAccount1,
    });

    //check contract balance
    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount1),
      "1.Contract balance is not true"
    );

    //userAccount2 take part in auction
    await treeAuctionInstance.bid(auctionId, bidAmount2, {
      from: bidderAccount2,
    });

    //check contract balance
    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount2),
      "2.Contract balance is not true"
    );

    //userAccount3 take part in auction
    await treeAuctionInstance.bid(auctionId, bidAmount3, {
      from: bidderAccount3,
    });

    //check contract balance
    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount3),
      "3.Contract balance is not true"
    );
  });

  it("Should bid function is reject because function is pause", async () => {
    let auctionId = 0;
    const treeId = 1;
    const bidAmount1 = web3.utils.toWei("1.5");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount1;
    const bidAmount2 = web3.utils.toWei("2");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount2 = userAccount2;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2, {
      from: bidderAccount2,
    });

    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.5"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);
    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    ////////////////////////////////////////////////////////////////////////////////

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, bidAmount1, {
      from: bidderAccount1,
    });

    await arInstance.pause({
      from: deployerAccount,
    });

    //userAccount2 take part in auction but function is pause
    await treeAuctionInstance
      .bid(auctionId, bidAmount2, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should endAuction function is reject because function is pause", async () => {
    let auctionId = 0;
    const treeId = 1;
    const bidAmount = web3.utils.toWei("2");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.5"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    /////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance.bid(auctionId, bidAmount, {
      from: bidderAccount,
    });

    await Common.travelTime(TimeEnumes.hours, 2);

    await arInstance.pause({
      from: deployerAccount,
    });

    await treeAuctionInstance
      .endAuction(auctionId, { from: deployerAccount })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should createAuction function is reject because function is pause", async () => {
    let auctionId = 0;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });
    ///////////////------------------- pause
    await arInstance.pause({
      from: deployerAccount,
    });

    const treeId = 1;
    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1", "Ether"),
        web3.utils.toWei(".5", "Ether"),
        { from: deployerAccount }
      )
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should endAuction function is reject because function is pause", async () => {
    let auctionId = 0;
    const treeId = 1;
    const bidAmount = web3.utils.toWei("2");
    const bidderInitialBalance = web3.utils.toWei("2");
    const bidderAccount = userAccount1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount, {
      from: bidderAccount,
    });
    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.5"),
      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount, bidderInitialBalance);

    /////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance.bid(auctionId, bidAmount, {
      from: bidderAccount,
    });

    await Common.travelTime(TimeEnumes.hours, 2);

    await arInstance.pause({
      from: deployerAccount,
    });

    await treeAuctionInstance
      .endAuction(auctionId, { from: deployerAccount })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });
  

  // //------------------------------------------- complete proccess of auction ------------------------------------------ //

  it("should do an acution completly", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const initialValue = web3.utils.toWei("1");
    const bidInterval = web3.utils.toWei("0.1");
    const invalidBidAmount = web3.utils.toWei("1.29");

    const bidAmount1_1 = web3.utils.toWei("1.1");
    const bidAmount1_2 = web3.utils.toWei("1.3");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount1;
    const bidAmount2_1 = web3.utils.toWei("1.2");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount2 = userAccount2;
    const bidAmount3_1 = web3.utils.toWei("1.4");
    const bidderInitialBalance3 = web3.utils.toWei("2");
    const bidderAccount3 = userAccount3;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount8,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount8
    );

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1_1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2_1, {
      from: bidderAccount2,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount3_1, {
      from: bidderAccount3,
    });

    /////////////////--------------- handle add tree

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    //////////////////// ----------------- handle dm model

    await financialModelInstance.addFundDistributionModel(
      4000,
      1200,
      1200,
      1200,
      1200,
      1200,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      initialValue,
      bidInterval,

      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    await wethInstance.setMint(bidderAccount3, bidderInitialBalance3);

    /////////////////////////////////////////////////////////////////////////////////

    await treeAuctionInstance.bid(0, bidAmount1_1, {
      from: bidderAccount1,
    });

    const auction1 = await treeAuctionInstance.auctions.call(0);

    assert.equal(auction1.bidder, userAccount1, "bidder is incoreect");

    assert.equal(
      Number(auction1.highestBid),
      Number(bidAmount1_1),
      "highest bid is incorrect"
    );

    await Common.travelTime(TimeEnumes.minutes, 55);

    await treeAuctionInstance.bid(0, bidAmount2_1, {
      from: bidderAccount2,
    });

    const auction2 = await treeAuctionInstance.auctions.call(0);

    assert.equal(auction2.bidder, userAccount2, "bidder is incorrect");
    assert.equal(
      Math.subtract(Number(auction2.endDate), Number(auction1.endDate)),
      600,
      "time increse incorrect"
    );

    await treeAuctionInstance
      .bid(0, invalidBidAmount, { from: userAccount1 })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    /////////////////// ---------------give approve again to auction contract from bidderAccount1

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1_2, {
      from: bidderAccount1,
    });

    await treeAuctionInstance.bid(0, bidAmount1_2, {
      from: bidderAccount1,
    });

    const auction3 = await treeAuctionInstance.auctions.call(0);

    assert.equal(auction3.bidder, userAccount1, "bidder is incorrect");
    assert.equal(
      Number(auction3.endDate),
      Number(auction2.endDate),
      "increase end time inccorect"
    );

    await Common.travelTime(TimeEnumes.seconds, 600);

    await treeAuctionInstance.bid(0, bidAmount3_1, {
      from: bidderAccount3,
    });

    await treeAuctionInstance
      .endAuction(0, { from: deployerAccount })
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

    const auction4 = await treeAuctionInstance.auctions.call(0);

    assert.equal(
      Math.subtract(Number(auction4.endDate), Number(auction3.endDate)),
      600,
      "increase end time incorrect"
    );

    assert.equal(auction4.bidder, bidderAccount3, "bidder is inccorect");

    await Common.travelTime(TimeEnumes.minutes, 16);

    let contractBalanceBefore = await wethInstance.balanceOf(
      treeAuctionInstance.address
    );

    assert.equal(
      Number(contractBalanceBefore),
      Number(bidAmount3_1),
      "1.Contract balance not true"
    );

    let amount = Number(web3.utils.toWei("1.4"));

    let expected = {
      planterFund: Math.divide(Math.mul(40, amount), 100),
      referralFund: Math.divide(Math.mul(12, amount), 100),
      treeResearch: Math.divide(Math.mul(12, amount), 100),
      localDevelop: Math.divide(Math.mul(12, amount), 100),
      rescueFund: Math.divide(Math.mul(12, amount), 100),
      treejerDevelop: Math.divide(Math.mul(12, amount), 100),
      reserveFund1: 0,
      reserveFund2: 0,
    };

    const wethFundsShare = Math.add(
      expected.treeResearch,
      expected.localDevelop,
      expected.rescueFund,
      expected.treejerDevelop,
      expected.reserveFund1,
      expected.reserveFund2
    );

    const planterFundShare = web3.utils.toWei("0.728"); // 0.52 (planter and referral share) * 1.4 (highestBid)

    const expectedSwapTokenAmount =
      await uniswapRouterInstance.getAmountsOut.call(planterFundShare, [
        wethInstance.address,
        daiInstance.address,
      ]);

    await treeAuctionInstance.endAuction(0, { from: userAccount3 });

    let contractBalanceAfter = await wethInstance.balanceOf(
      treeAuctionInstance.address
    );

    assert.equal(
      Number(contractBalanceAfter),
      0,
      "2.Contract balance not true"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(wethFundsInstance.address)),
      wethFundsShare,
      "1.WethFunds contract balance not true"
    );

    assert.equal(
      Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
      Number(expectedSwapTokenAmount[1]),
      "1.PlanterFund contract balance not true"
    );

    assert.equal(
      await treeTokenInstance.ownerOf(treeId),
      userAccount3,
      "owner of token is incorrect"
    );

    //check treasury updated true
    let pFund = await planterFundsInstnce.planterFunds.call(treeId);

    let rFund = await planterFundsInstnce.referralFunds.call(treeId);

    let totalFundsPlanterFunds = await planterFundsInstnce.totalFunds();

    let totalFundsWethFunds = await wethFundsInstance.totalFunds();

    assert.equal(
      Number(pFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(5200)),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(rFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(5200)),
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFunds.referralFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(5200)),
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFunds.planterFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(5200)),
      "planter funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.treeResearch),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.localDevelop),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.rescueFund),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.treejerDevelop),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.reserveFund1),
      expected.reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.reserveFund2),
      expected.reserveFund2,
      "reserveFund2 funds invalid"
    );

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount8,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount7, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount8,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANT_TREE_WITH_PLANTER);

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount7 }
    );

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_ACCESS);

    await treeFactoryInstance.verifyPlant(treeId, true, { from: userAccount8 });
  });

  // ---------------------------------------complex test (auction and treeFactory and treasury)-------------------------------------

  it("complex test 1", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    let initialValue = web3.utils.toWei("1");
    let bidInterval = web3.utils.toWei("0.1");
    const invalidBidAmount1 = web3.utils.toWei("1.09");
    const invalidBidAmount2 = web3.utils.toWei("1.24");
    const invalidBidAmount3 = web3.utils.toWei("1.09");

    const bidAmount1 = web3.utils.toWei("1.15");
    const bidderInitialBalance1 = web3.utils.toWei("2");
    const bidderAccount1 = userAccount3;
    const bidAmount2 = web3.utils.toWei("1.25");
    const bidderInitialBalance2 = web3.utils.toWei("2");
    const bidderAccount2 = userAccount4;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2, {
      from: bidderAccount2,
    });

    ///////////////////////////// add and plant tree

    await Common.successPlant(
      treeFactoryInstance,
      arInstance,
      ipfsHash,
      treeId,
      birthDate,
      countryCode,
      [userAccount2],
      userAccount2,
      deployerAccount,
      planterInstance
    );
    /////////////////////////////////// fail to create auction and dm model

    await financialModelInstance
      .addFundDistributionModel(6500, 1200, 1200, 1200, 1200, 1200, 0, 0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        bidInterval,
        {
          from: deployerAccount,
        }
      )
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

    //////////////////// ----------------- handle dm model

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

    await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      initialValue,
      bidInterval,

      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    /////////////////////////////////////////////////////////////////////////////////

    let createResult = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      createResult.provideStatus,
      1,
      "Provide status not true update when auction create"
    );

    ////////////////////----------------- fail to create auction

    await treeAuctionInstance
      .createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        bidInterval,
        {
          from: deployerAccount,
        }
      )
      .should.be.rejectedWith(TreeAuctionErrorMsg.TREE_STATUS);

    ////////////////// ----------------- fail to end auction

    await treeAuctionInstance
      .endAuction(0, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

    await Common.travelTime(TimeEnumes.hours, 1);

    /////////////////// -------------- end auction

    await treeAuctionInstance.endAuction(0, {
      from: deployerAccount,
    });

    let failResult = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      failResult.provideStatus,
      0,
      "Provide status not true update when auction fail"
    );

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      initialValue,
      bidInterval,
      {
        from: deployerAccount,
      }
    );

    let createResult2 = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      createResult2.provideStatus,
      1,
      "Provide status not true update when auction create"
    );

    await treeAuctionInstance
      .bid(1, invalidBidAmount1, {
        from: bidderAccount1,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance.bid(1, bidAmount1, {
      from: bidderAccount1,
    });

    let firstBidderAfterBid = await wethInstance.balanceOf(bidderAccount1);

    await treeAuctionInstance
      .bid(1, invalidBidAmount2, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance.bid(1, bidAmount2, {
      from: bidderAccount2,
    });

    let firstBidderAfterAutomaticWithdraw = await wethInstance.balanceOf(
      bidderAccount1
    );

    assert.equal(
      firstBidderAfterAutomaticWithdraw,
      Math.add(Number(firstBidderAfterBid), Number(bidAmount1)),
      "automatic withdraw not true work"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount2),
      "1.Contract balance is not true"
    );

    await treeAuctionInstance
      .endAuction(1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

    await Common.travelTime(TimeEnumes.hours, 1);

    let expected = {
      planterFund: Math.divide(Math.mul(30, Number(bidAmount2)), 100),
      referralFund: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
      treeResearch: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
      localDevelop: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
      rescueFund: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
      treejerDevelop: Math.divide(Math.mul(22, Number(bidAmount2)), 100),
      reserveFund1: 0,
      reserveFund2: 0,
    };

    const wethFundsShare = Math.add(
      expected.treeResearch,
      expected.localDevelop,
      expected.rescueFund,
      expected.treejerDevelop,
      expected.reserveFund1,
      expected.reserveFund2
    );

    let wethFundsInstanceBeforeAuctionEnd = await wethInstance.balanceOf(
      wethFundsInstance.address
    );

    const planterFundShare = web3.utils.toWei("0.525"); // 0.42 (planter and referral share) * 1.25 (highestBid)

    const expectedSwapTokenAmount =
      await uniswapRouterInstance.getAmountsOut.call(planterFundShare, [
        wethInstance.address,
        daiInstance.address,
      ]);

    let successEnd = await treeAuctionInstance.endAuction(1, {
      from: deployerAccount,
    });

    assert.equal(
      Number(await wethInstance.balanceOf(wethFundsInstance.address)),
      Math.add(Number(wethFundsInstanceBeforeAuctionEnd), wethFundsShare),
      "weth funds transfer not work true"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      0,
      "Contract balance not true when auction end"
    );

    //check treasury updated true
    let pFund = await planterFundsInstnce.planterFunds.call(treeId);
    let rFund = await planterFundsInstnce.referralFunds.call(treeId);

    let totalFundsPlanterFunds = await planterFundsInstnce.totalFunds();

    let totalFundsWethFunds = await wethFundsInstance.totalFunds();

    assert.equal(
      Number(await daiInstance.balanceOf(planterFundsInstnce.address)),
      Number(expectedSwapTokenAmount[1]),
      "planter balance is not ok"
    );

    assert.equal(
      Number(pFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(3000).div(4200)),
      "planterFund funds invalid"
    );

    assert.equal(
      Number(rFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(4200)),
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFunds.planterFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(3000).div(4200)),
      "planterFund totalFunds invalid"
    );

    assert.equal(
      Number(totalFundsPlanterFunds.referralFund),
      Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(4200)),
      "referralFund funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.treeResearch),
      expected.treeResearch,
      "treeResearch funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.localDevelop),
      expected.localDevelop,
      "localDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.rescueFund),
      expected.rescueFund,
      "rescueFund funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.treejerDevelop),
      expected.treejerDevelop,
      "treejerDevelop funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.reserveFund1),
      expected.reserveFund1,
      "reserveFund1 funds invalid"
    );

    assert.equal(
      Number(totalFundsWethFunds.reserveFund2),
      expected.reserveFund2,
      "reserveFund2 funds invalid"
    );

    let successResult = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      successResult.provideStatus,
      0,
      "Provide status not true update when auction success"
    );

    truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
      return (
        Number(ev.auctionId) == 1 &&
        Number(ev.treeId) == treeId &&
        ev.winner == bidderAccount2 &&
        Number(ev.amount) == Number(bidAmount2)
      );
    });
  });
*/
  // check hold auction
  it("complex test 2", async () => {
    //TODO: check bidder balance after bid
    const treeId = 0;
    const auctionId = 0;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    let initialValue = web3.utils.toWei("1");
    let bidInterval = web3.utils.toWei("0.1");

    const invalidBidAmount1 = web3.utils.toWei("1.09");
    const invalidBidAmount2 = web3.utils.toWei("1.13");
    const invalidBidAmount3 = web3.utils.toWei("1.24");

    const bidAmount1_1 = web3.utils.toWei("1.15");
    const bidAmount1_2 = web3.utils.toWei("2.12");
    const bidderInitialBalance1 = web3.utils.toWei("3");
    const bidderAccount1 = userAccount3;
    const bidAmount2_1 = web3.utils.toWei("1.25");
    const bidAmount2_2 = web3.utils.toWei("2.52");
    const bidderInitialBalance2 = web3.utils.toWei("3");
    const bidderAccount2 = userAccount4;

    const bidAmount3_1 = web3.utils.toWei("1.5312");
    const bidderInitialBalance3 = web3.utils.toWei("2");
    const bidderAccount3 = userAccount5;

    startTime = await Common.timeInitial(TimeEnumes.minutes, 5);
    endTime = await Common.timeInitial(TimeEnumes.days, 5);

    ////////////////// ------------------- handle address

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      { from: deployerAccount }
    );

    await treeAuctionInstance.setFinancialModelAddress(
      financialModelInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeAuctionInstance.setWethTokenAddress(wethInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    /////////////////// ---------------give approve to auction contract

    await wethInstance.approve(treeAuctionInstance.address, bidAmount1_1, {
      from: bidderAccount1,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount2_1, {
      from: bidderAccount2,
    });

    await wethInstance.approve(treeAuctionInstance.address, bidAmount3_1, {
      from: bidderAccount3,
    });

    /////////////////--------------- handle add and plant tree

    await Common.successPlant(
      treeFactoryInstance,
      arInstance,
      ipfsHash,
      treeId,
      birthDate,
      countryCode,
      [userAccount2],
      userAccount2,
      deployerAccount,
      planterInstance
    );

    ///////////////////// ---------------- fail to add dm model

    await financialModelInstance
      .addFundDistributionModel(3500, 1000, 1000, 1500, 1000, 2000, 0, 0, {
        from: userAccount5,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    //////////////////// ----------------- handle dm model

    await financialModelInstance.addFundDistributionModel(
      3500,
      1000,
      1000,
      1500,
      1000,
      2000,
      0,
      0,
      {
        from: deployerAccount,
      }
    );

    await financialModelInstance.assignTreeFundDistributionModel(0, 0, 0, {
      from: deployerAccount,
    });

    //////////////// ---------------- create auction

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime),
      Number(endTime),
      initialValue,
      bidInterval,

      { from: deployerAccount }
    );

    ////////////////// charge bidder account

    await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

    await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

    await wethInstance.setMint(bidderAccount3, bidderInitialBalance3);

    /////////////////////////////////////////////////////////////////////////////////

    //TODO: FIX_HERE_AFTER_TREE_FACTORY
    // await treeFactoryInstance.setTreasuryAddress(TreasuryInstance.address, {
    //   from: deployerAccount,
    // });

    ////////////// --------------- check tree data

    let createResult = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      createResult.provideStatus,
      1,
      "Provide status not true update when auction create"
    );
    //////////////// ------------- fail to create auction
    await treeAuctionInstance
      .createAuction(treeId, startTime, endTime, initialValue, bidInterval, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.TREE_STATUS);

    await treeAuctionInstance
      .bid(auctionId, web3.utils.toWei("1.5"), {
        from: bidderAccount1,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_BEFORE_START);

    await Common.travelTime(TimeEnumes.minutes, 5);

    await treeAuctionInstance
      .bid(auctionId, invalidBidAmount1, {
        from: bidderAccount1,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance.bid(auctionId, bidAmount1_1, {
      from: bidderAccount1,
    });

    await Common.travelTime(TimeEnumes.days, 1);

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount1_1),
      "1.Contract balance is not true"
    );

    const bidderAccount1AfterBid1 = await wethInstance.balanceOf(
      bidderAccount1
    );

    await treeAuctionInstance
      .bid(auctionId, invalidBidAmount2, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance
      .bid(auctionId, invalidBidAmount3, {
        from: bidderAccount2,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.BID_VALUE);

    await treeAuctionInstance.bid(auctionId, bidAmount2_1, {
      from: bidderAccount2,
    });

    const bidderAccount1BalanceAfterAutomaticWithdraw1 =
      await wethInstance.balanceOf(bidderAccount1);

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount2_1),
      "2.Contract balance is not true"
    );

    assert.equal(
      Number(bidderAccount1BalanceAfterAutomaticWithdraw1),
      Math.add(Number(bidderAccount1AfterBid1), Number(bidAmount1_1)),
      "1.automatic withdraw not true work"
    );

    const bidderAccount2AfterBid1 = await wethInstance.balanceOf(
      bidderAccount2
    );

    await treeAuctionInstance.bid(auctionId, bidAmount3_1, {
      from: bidderAccount3,
    });

    const bidderAccount2BalanceAfterAutomaticWithdraw1 =
      await wethInstance.balanceOf(bidderAccount2);

    console.log(
      "Number(bidderAccount2AfterBid1)",
      Number(bidderAccount2AfterBid1)
    );
    console.log("Number(bidAmount2_1)", Number(bidAmount2_1));

    assert.equal(
      Number(bidderAccount2BalanceAfterAutomaticWithdraw1),
      Math.add(Number(bidderAccount2AfterBid1), Number(bidAmount2_1)),
      "2.automatic withdraw not true work"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount3_1),
      "3.Contract balance is not true"
    );

    await Common.travelTime(TimeEnumes.days, 2);

    const bidderAccount3AfterBid1 = wethInstance.balanceOf(bidderAccount3);

    /////////////--------------------------- give approve from bidderAccount1 for seccend bid
    await wethInstance.approve(treeAuctionInstance.address, bidAmount1_2, {
      from: bidderAccount1,
    });

    await treeAuctionInstance.bid(auctionId, bidAmount1_2, {
      from: bidderAccount1,
    });

    const bidderAccount3BalanceAfterAutomaticWithdraw1 =
      await wethInstance.balanceOf(bidderAccount3);

    assert.equal(
      Number(bidderAccount3BalanceAfterAutomaticWithdraw1),
      Math.add(Number(bidderAccount3AfterBid1), Number(bidAmount3_1)),
      "3.automatic withdraw not true work"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount1_2),
      "4.Contract balance is not true"
    );

    //planter update tree
    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const planterBalance = await planterFundsInstnce.balances.call(
      userAccount2
    );

    assert.equal(planterBalance, 0, "1.planter balance not true in treasury");

    await treeAuctionInstance
      .endAuction(auctionId, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

    await Common.travelTime(TimeEnumes.days, 1);

    await Common.travelTime(TimeEnumes.minutes, 1430);

    //final bid
    let firstBidderAfterBid3_2 = await web3.eth.getBalance(userAccount3);
    const bidderAccount1AfterBid2 = wethInstance.balanceOf(bidderAccount1);

    /////////////--------------------------- give approve from bidderAccount2 for seccend bid
    await wethInstance.approve(treeAuctionInstance.address, bidAmount2_2, {
      from: bidderAccount2,
    });

    let tx = await treeAuctionInstance.bid(auctionId, bidAmount2_2, {
      from: bidderAccount2,
    });

    truffleAssert.eventEmitted(tx, "AuctionEndTimeIncreased", (ev) => {
      return (
        Number(ev.auctionId) == 0 &&
        Number(ev.newAuctionEndTime) == Math.add(Number(endTime), 600)
      );
    });

    const bidderAccount1BalanceAfterAutomaticWithdraw2 =
      await wethInstance.balanceOf(bidderAccount1);

    assert.equal(
      Number(bidderAccount1BalanceAfterAutomaticWithdraw2),
      Math.add(Number(bidderAccount1AfterBid2), Number(bidAmount1_2)),
      "4.automatic withdraw not true work"
    );

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(bidAmount2_2),
      "5.Contract balance is not true"
    );

    await Common.travelTime(TimeEnumes.minutes, 15);

    let expected = {
      planterFund: Math.divide(Math.mul(35, amount), 100),
      referralFund: Math.divide(Math.mul(10, amount), 100),
      treeResearch: Math.divide(Math.mul(10, amount), 100),
      localDevelop: Math.divide(Math.mul(15, amount), 100),
      rescueFund: Math.divide(Math.mul(10, amount), 100),
      treejerDevelop: Math.divide(Math.mul(20, amount), 100),
      reserveFund1: 0,
      reserveFund2: 0,
    };

    const wethFundsShare = Math.add(
      expected.treeResearch,
      expected.localDevelop,
      expected.rescueFund,
      expected.treejerDevelop,
      expected.reserveFund1,
      expected.reserveFund2
    );

    let successEnd = await treeAuctionInstance.endAuction(auctionId, {
      from: userAccount4,
    });

    await treeAuctionInstance
      .createAuction(treeId, startTime, endTime, initialValue, bidInterval, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.TREE_STATUS);

    assert.equal(
      Number(await wethInstance.balanceOf(treeAuctionInstance.address)),
      Number(web3.utils.toWei("0", "Ether")),
      "6.Contract balance is not true"
    );

    assert.equal(
      await web3.eth.getBalance(TreasuryInstance.address),
      web3.utils.toWei("2.52", "Ether"),
      "Treasury contract balance is not true"
    );

    truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
      return (
        Number(ev.auctionId) == auctionId &&
        Number(ev.treeId) == treeId &&
        ev.winner == bidderAccount2 &&
        Number(ev.amount) == Number(bidAmount2_2)
      );
    });

    // let addressGetToken = await treeTokenInstance.ownerOf(treeId);

    // assert.equal(addressGetToken, userAccount4, "token not true mint");

    // //check treasury updated true
    // let pFund = await TreasuryInstance.planterFunds.call(treeId);

    // let totalFunds = await TreasuryInstance.totalFunds();

    // let amount = Number(web3.utils.toWei("2.52"));

    // assert.equal(Number(pFund), expected.planterFund, "planter funds invalid");

    // assert.equal(
    //   Number(totalFunds.planterFund),
    //   expected.planterFund,
    //   "planterFund totalFunds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.referralFund),
    //   expected.referralFund,
    //   "referralFund funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.treeResearch),
    //   expected.treeResearch,
    //   "treeResearch funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.localDevelop),
    //   expected.localDevelop,
    //   "localDevelop funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.rescueFund),
    //   expected.rescueFund,
    //   "rescueFund funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.treejerDevelop),
    //   expected.treejerDevelop,
    //   "treejerDevelop funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.reserveFund1),
    //   expected.reserveFund1,
    //   "reserveFund1 funds invalid"
    // );

    // assert.equal(
    //   Number(totalFunds.reserveFund2),
    //   expected.reserveFund2,
    //   "reserveFund2 funds invalid"
    // );

    // //planter update tree
    // await treeFactoryInstance.updateTree(treeId, ipfsHash, {
    //   from: userAccount2,
    // });

    // await treeFactoryInstance.verifyUpdate(treeId, true, {
    //   from: deployerAccount,
    // });

    // let planterBalance2 = await TreasuryInstance.balances.call(userAccount2);

    // assert.equal(
    //   planterBalance2,
    //   parseInt(
    //     Math.divide(
    //       Math.mul(Number(web3.utils.toWei("2.52")), 0.35, 120),
    //       25920
    //     )
    //   ),
    //   "2.planter balance not true in treasury"
    // );

    // let plantersPaidTreeId0_1 = await TreasuryInstance.plantersPaid.call(
    //   treeId
    // );

    // assert.equal(
    //   plantersPaidTreeId0_1,
    //   parseInt(
    //     Math.divide(
    //       Math.mul(Number(web3.utils.toWei("2.52")), 0.35, 120),
    //       25920
    //     )
    //   ),
    //   "1.planter paid not true in treasury"
    // );

    // //planter withdraw

    // let firstWithdrawPlanter = Number(web3.utils.toWei(".001"));

    // await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei("1"), {
    //   from: userAccount2,
    // }).should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

    // await TreasuryInstance.withdrawPlanterBalance(web3.utils.toWei(".001"), {
    //   from: userAccount2,
    // });

    // let planterBalance3 = await TreasuryInstance.balances.call(userAccount2);

    // assert.equal(
    //   planterBalance3,
    //   Math.subtract(
    //     parseInt(
    //       Math.divide(
    //         Math.mul(Number(web3.utils.toWei("2.52")), 0.35, 120),
    //         25920
    //       )
    //     ),
    //     firstWithdrawPlanter
    //   ),
    //   "3.planter balance not true in treasury"
    // );

    // await Common.travelTime(TimeEnumes.years, 3);

    // //planter update tree
    // await treeFactoryInstance.updateTree(treeId, ipfsHash, {
    //   from: userAccount2,
    // });

    // await treeFactoryInstance.verifyUpdate(treeId, true, {
    //   from: deployerAccount,
    // });

    // let planterBalance4 = await TreasuryInstance.balances.call(userAccount2);

    // assert.equal(
    //   planterBalance4,
    //   Math.subtract(
    //     Math.mul(Number(web3.utils.toWei("2.52")), 0.35),
    //     firstWithdrawPlanter
    //   ),
    //   "4.planter balance not true in treasury"
    // );

    // let plantersPaidTreeId0_2 = await TreasuryInstance.plantersPaid.call(
    //   treeId
    // );

    // let planterFundsTreeId0_2 = await TreasuryInstance.planterFunds.call(
    //   treeId
    // );

    // assert.equal(
    //   Number(plantersPaidTreeId0_2),
    //   Number(planterFundsTreeId0_2),
    //   "planter paid not equal to planter funds"
    // );

    // let treasuryBalance = await web3.eth.getBalance(TreasuryInstance.address);

    // assert.equal(
    //   treasuryBalance,
    //   Math.subtract(
    //     Number(web3.utils.toWei("2.52")),
    //     Number(web3.utils.toWei(".001"))
    //   ),
    //   "2.treasury balance not true"
    // );

    // let totalFunds2 = await TreasuryInstance.totalFunds();

    // let treejerDevelopBalance = totalFunds2.treejerDevelop;
    // let ownerAccountBalanceBefore = await web3.eth.getBalance(ownerAccount);

    // await TreasuryInstance.setTreejerDevelopAddress(ownerAccount, {
    //   from: deployerAccount,
    // });

    // await TreasuryInstance.withdrawTreejerDevelop(
    //   web3.utils.toWei(totalFunds2.treejerDevelop, "wei"),
    //   "reason message",
    //   {
    //     from: deployerAccount,
    //   }
    // );

    // let ownerAccountBalanceAfter = await web3.eth.getBalance(ownerAccount);

    // assert.equal(
    //   Number(ownerAccountBalanceAfter),
    //   Math.add(
    //     Number(ownerAccountBalanceBefore),
    //     Number(treejerDevelopBalance)
    //   ),
    //   "1.owner balance not true"
    // );

    // assert.equal(
    //   await web3.eth.getBalance(TreasuryInstance.address),
    //   Math.subtract(
    //     Number(web3.utils.toWei("2.52")),
    //     Math.add(
    //       Number(web3.utils.toWei(".001")),
    //       Number(treejerDevelopBalance)
    //     )
    //   ),
    //   "3.treasury balance not true"
    // );
  });
  /*

  it("complex test 3 ( complete auction done ) ", async () => {
    const treeId1 = 1;
    const treeId2 = 2;
    const auctionId1 = 0;
    const initialPrice = web3.utils.toWei("1");
    const bidInterval = web3.utils.toWei("0.1");

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    //////////////// --------- set contract address
    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );
    await treeAuctionInstance.setTreasuryAddress(TreasuryInstance.address, {
      from: deployerAccount,
    });
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await treeFactoryInstance.setTreasuryAddress(TreasuryInstance.address, {
      from: deployerAccount,
    });

    //////////////// -----------  fail to create auction
    await treeAuctionInstance
      .createAuction(treeId1, startTime, endTime, initialPrice, bidInterval, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await treeAuctionInstance
      .createAuction(treeId1, startTime, endTime, initialPrice, bidInterval, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);
    await Common.addAuctionRole(
      arInstance,
      treeAuctionInstance.address,
      deployerAccount
    );

    ////////////// fail to add fund dm

    await TreasuryInstance.addFundDistributionModel(
      5000,
      1000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      { from: userAccount1 }
    ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await TreasuryInstance.addFundDistributionModel(
      5000,
      1000,
      1000,
      1000,
      1000,
      1000,
      1000,
      1000,
      { from: deployerAccount }
    ).should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);

    ///////// ----- add fund dm
    await TreasuryInstance.addFundDistributionModel(
      5000,
      1000,
      1000,
      1000,
      1000,
      1000,
      0,
      0,
      { from: deployerAccount }
    );
    ////////// ----------- assign tree fund dm
    await TreasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    //////// ----------- fail to create auction <<invalid-tree>>
    await treeAuctionInstance
      .createAuction(treeId1, startTime, endTime, initialPrice, bidInterval, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE);

    /////////------------------ ad tree
    await treeFactoryInstance.addTree(treeId1, ipfsHash, {
      from: deployerAccount,
    });
    ///// --------- create auction
    await treeAuctionInstance.createAuction(
      treeId1,
      startTime,
      endTime,
      initialPrice,
      bidInterval,
      { from: deployerAccount }
    );
    const initailAuction = await treeAuctionInstance.auctions.call(auctionId1);

    //////////// bid 1

    let bidTx = await treeAuctionInstance.bid(auctionId1, {
      from: userAccount8,
      value: web3.utils.toWei("1.5"),
    });
    truffleAssert.eventEmitted(bidTx, "HighestBidIncreased", (ev) => {
      return (
        Number(ev.auctionId) == auctionId1 &&
        ev.treeId == treeId1 &&
        ev.bidder == userAccount8 &&
        Number(ev.amount) == Number(web3.utils.toWei("1.5"))
      );
    });

    /////////////// bid 2
    await Common.travelTime(TimeEnumes.minutes, 55);
    const FinalBidTx = await treeAuctionInstance.bid(auctionId1, {
      from: userAccount7,
      value: web3.utils.toWei("2"),
    });
    const auctionAfterEndTimeIncrease = await treeAuctionInstance.auctions.call(
      auctionId1
    );

    truffleAssert.eventEmitted(FinalBidTx, "HighestBidIncreased", (ev) => {
      return (
        Number(ev.auctionId) == auctionId1 &&
        ev.treeId == treeId1 &&
        ev.bidder == userAccount7 &&
        Number(ev.amount) == Number(web3.utils.toWei("2"))
      );
    });

    assert.equal(
      Math.add(Number(initailAuction.endDate), 600),
      Number(auctionAfterEndTimeIncrease.endDate),
      "invaild end time for auction after increase time"
    );
    truffleAssert.eventEmitted(FinalBidTx, "AuctionEndTimeIncreased", (ev) => {
      return (
        Number(ev.auctionId) == auctionId1 &&
        Number(ev.newAuctionEndTime) ==
          Math.add(Number(initailAuction.endDate), 600)
      );
    });

    const treasuryBalanceBeforeAuctionEnd = await web3.eth.getBalance(
      TreasuryInstance.address
    );
    const totalFundBeforeAuctionEnd = await TreasuryInstance.totalFunds();
    ///------------ check totalFunds before auction end
    assert.equal(
      Number(totalFundBeforeAuctionEnd.planterFund),
      0,
      "invalid planterFund"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.referralFund),
      0,
      "invalid referralFund"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.treeResearch),
      0,
      "invalid treeResearch"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.localDevelop),
      0,
      "invalid localDevelop"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.rescueFund),
      0,
      "invalid rescueFund"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.treejerDevelop),
      0,
      "invalid treejerDevelop"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.reserveFund1),
      0,
      "invalid reserveFund1"
    );
    assert.equal(
      Number(totalFundBeforeAuctionEnd.reserveFund2),
      0,
      "invalid reserveFund2"
    );
    //------------- end auction
    await treeAuctionInstance
      .endAuction(auctionId1)
      .should.be.rejectedWith(TreeAuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);
    await Common.travelTime(TimeEnumes.minutes, 20);
    const endAuctionTx = await treeAuctionInstance.endAuction(auctionId1);

    const treasuryBalanceAfterAuctionEnd = await web3.eth.getBalance(
      TreasuryInstance.address
    );

    let tokenOwner = await treeTokenInstance.ownerOf(treeId1);
    assert.equal(tokenOwner, userAccount7, "token owner not correct");
    const totalPlanterFund = Math.divide(
      Math.mul(Number(web3.utils.toWei("2")), 5000),
      10000
    );
    const expectedPayValue = {
      planterFund: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 5000),
        10000
      ),
      referralFund: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 1000),
        10000
      ),
      treeResearch: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 1000),
        10000
      ),
      localDevelop: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 1000),
        10000
      ),
      rescueFund: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 1000),
        10000
      ),
      treejerDevelop: Math.divide(
        Math.mul(Number(web3.utils.toWei("2")), 1000),
        10000
      ),
      reserveFund1: 0,
      reserveFund2: 0,
    };

    const totalFundAfterAuctionEnd = await TreasuryInstance.totalFunds();
    ///------------ check totalFunds after auction end
    assert.equal(
      Number(totalFundAfterAuctionEnd.planterFund),
      expectedPayValue.planterFund,
      "invalid planterFund"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.referralFund),
      expectedPayValue.referralFund,
      "invalid referralFund"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.treeResearch),
      expectedPayValue.treeResearch,
      "invalid treeResearch"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.localDevelop),
      expectedPayValue.localDevelop,
      "invalid localDevelop"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.rescueFund),
      expectedPayValue.rescueFund,
      "invalid rescueFund"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.treejerDevelop),
      expectedPayValue.treejerDevelop,
      "invalid treejerDevelop"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.reserveFund1),
      expectedPayValue.reserveFund1,
      "invalid reserveFund1"
    );
    assert.equal(
      Number(totalFundAfterAuctionEnd.reserveFund2),
      expectedPayValue.reserveFund2,
      "invalid reserveFund2"
    );
    ///////////------------ check charge treasury contract
    assert.equal(
      Math.subtract(
        Number(treasuryBalanceAfterAuctionEnd),
        Number(treasuryBalanceBeforeAuctionEnd)
      ),
      Number(web3.utils.toWei("2")),
      "treasury done charge correctly"
    );

    truffleAssert.eventEmitted(endAuctionTx, "AuctionSettled", (ev) => {
      return (
        Number(ev.auctionId) == auctionId1 &&
        Number(ev.treeId) == treeId1 &&
        ev.winner == userAccount7 &&
        Number(ev.amount) == Number(web3.utils.toWei("2"))
      );
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    /////////////----------------------- plant tree

    await Common.successPlanterJoin(
      arInstance,
      deployerAccount,
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await treeFactoryInstance.assignTreeToPlanter(treeId1, userAccount2, {
      from: deployerAccount,
    });
    await treeFactoryInstance.plantTree(treeId1, ipfsHash, 1, 1, {
      from: userAccount2,
    });
    await treeFactoryInstance.verifyPlant(treeId1, true, {
      from: deployerAccount,
    });
    ////////////// ------------------- update tree
    await treeFactoryInstance
      .updateTree(treeId1, ipfsHash, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);
    await Common.travelTime(TimeEnumes.hours, 28);

    await treeFactoryInstance.updateTree(treeId1, ipfsHash, {
      from: userAccount2,
    });
    /////////////////// --------------- verify update

    await treeFactoryInstance.verifyUpdate(treeId1, true, {
      from: deployerAccount,
    });

    //////////////// ---------------------- check total funds value

    const totalFundsAfterFundPlanter = await TreasuryInstance.totalFunds();
    const planterPaidAfterVerify = await TreasuryInstance.plantersPaid.call(
      treeId1
    );
    const resultAfterGT = await treeFactoryInstance.treeData.call(treeId1);
    const expectedPaidAfterFundPlanter = parseInt(
      Math.divide(
        Math.mul(totalPlanterFund, Number(resultAfterGT.treeStatus)),
        25920
      )
    );
    assert.equal(
      Math.subtract(
        Number(totalFundAfterAuctionEnd.planterFund),
        expectedPaidAfterFundPlanter
      ),
      Number(totalFundsAfterFundPlanter.planterFund),
      "planter total fund is not ok"
    );

    ///////////// ------------------------- check paid planter funds
    assert.equal(
      Number(planterPaidAfterVerify),
      expectedPaidAfterFundPlanter,
      "planter paid not correct"
    );
    /////////////---------------------- check planter balance before withdraw

    const planterPaidBeforeWithdrawTotalAmount =
      await TreasuryInstance.balances.call(userAccount2);

    assert.equal(
      Number(planterPaidBeforeWithdrawTotalAmount),
      expectedPaidAfterFundPlanter,
      "planter balance before withdraw is not ok"
    );

    ////////////// ----------------- withdraw planter fund
    await TreasuryInstance.withdrawPlanterBalance(
      expectedPaidAfterFundPlanter,
      {
        from: userAccount2,
      }
    );
    ////////////////--------------- check planter balance after withdraw
    const planterPaidAfterWithdrawTotalAmount =
      await TreasuryInstance.balances.call(userAccount2);
    assert.equal(
      Number(planterPaidAfterWithdrawTotalAmount),
      0,
      "planter fund is not ok after withdraw total amount"
    );
  });
  */
});
