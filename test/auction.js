require("dotenv").config();
// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const Auction = artifacts.require("Auction");
const TreeFactory = artifacts.require("TreeFactory");

const Tree = artifacts.require("Tree");
const Planter = artifacts.require("Planter");
const WethFund = artifacts.require("WethFund");
const RegularSale = artifacts.require("RegularSale");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");

var Token = artifacts.require("Weth");

let UniswapV2Router02New = artifacts.require("UniSwapMini");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const Math = require("./math");

const {
  TimeEnumes,
  CommonErrorMsg,
  AuctionErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Auction", (accounts) => {
  let auctionInstance;
  let arInstance;
  let treeFactoryInstance;
  let startTime;
  let endTime;
  let planterInstance;
  let planterFundInstnce;
  let allocationInstance;
  let wethFundInstance;
  let regularSaleInstance;
  let dexRouterInstance;
  let factoryInstance;
  let wethInstance;
  let daiInstance;
  let testUniswapInstance;
  let WETHAddress;
  let DAIAddress;
  let uniswapV2Router02NewAddress;

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

  const ipfsHash = "some ipfs hash here";

  before(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    wethInstance = await Token.new("WETH", "weth", {
      from: accounts[0],
    });
    WETHAddress = wethInstance.address;
    daiInstance = await Token.new("DAI", "dai", { from: accounts[0] });
    DAIAddress = daiInstance.address;
    dexRouterInstance = await UniswapV2Router02New.new(
      DAIAddress,
      WETHAddress,
      { from: deployerAccount }
    );
    uniswapV2Router02NewAddress = dexRouterInstance.address;
    await wethInstance.setMint(
      uniswapV2Router02NewAddress,
      web3.utils.toWei("125000", "Ether")
    );
    await daiInstance.setMint(
      uniswapV2Router02NewAddress,
      web3.utils.toWei("250000000", "Ether")
    );

    //////////////////////////////////////////////////////////////////////

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    await Common.addVerifierRole(arInstance, dataManager, deployerAccount);
  });

  describe("deployment and set addresses", () => {
    before(async () => {
      auctionInstance = await Auction.new({
        from: deployerAccount,
      });

      await auctionInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
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

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      //////////////////////////////////
    });

    it("check deploys successfully and set Tree Auction addresses and fail in invalid situation", async () => {
      //////////////////------------------ deploys successfully

      const address = auctionInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      ///// ---------------- set treeFactory

      await auctionInstance
        .setTreeFactoryAddress(treeFactoryInstance.address, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      ///// ---------------- deploy allocation

      await auctionInstance
        .setAllocationAddress(allocationInstance.address, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      ///// ---------------- set wethToken

      await auctionInstance
        .setWethTokenAddress(wethInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await auctionInstance
        .setWethTokenAddress(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        wethInstance.address,
        await auctionInstance.wethToken.call(),
        "address set incorect"
      );

      ///// ---------------- set regular sell

      await auctionInstance
        .setRegularSaleAddress(regularSaleInstance.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await auctionInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      assert.equal(
        regularSaleInstance.address,
        await auctionInstance.regularSale.call(),
        "address set incorect"
      );

      ///// ---------------- set wethFund

      await auctionInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });
      await auctionInstance
        .setWethFundAddress(wethFundInstance.address, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
    });
  });

  describe("add auction and bid", () => {
    beforeEach(async () => {
      auctionInstance = await Auction.new({
        from: deployerAccount,
      });

      await auctionInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      //////////////////////////////-------------------- handle address
      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        auctionInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //////////////////////////////////
    });

    ///////////////// ----------------------------- add auction -------------------------------

    it("add auction and fail in invalid situation", async () => {
      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      let treeId = 1;
      let initialValue = web3.utils.toWei("1");
      let bidInterval = 2000;

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });

      ////// --------------- fail because of invalid assing allocation data

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          bidInterval,
          { from: dataManager }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          bidInterval,
          { from: dataManager }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////// fail because caller is not data manager

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          bidInterval,
          { from: userAccount1 }
        )
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      ///////// fail because of invalid bidinterval
      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          0,
          { from: dataManager }
        )
        .should.be.rejectedWith(AuctionErrorMsg.INVALID_BIDINTERVAL);

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          10002,
          { from: dataManager }
        )
        .should.be.rejectedWith(AuctionErrorMsg.INVALID_BIDINTERVAL);

      /////////// ---------- create auction

      const eventTx = await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        bidInterval,
        { from: dataManager }
      );

      /////// --------------- fail Duplicate tree id
      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          bidInterval,
          { from: dataManager }
        )
        .should.be.rejectedWith(AuctionErrorMsg.TREE_STATUS);

      let result = await auctionInstance.auctions.call(0);

      assert.equal(
        (await treeFactoryInstance.trees.call(treeId)).treeStatus,
        2,
        "tree status is not correct"
      );

      assert.equal(result.treeId.toNumber(), treeId);
      assert.equal(Number(result.highestBid), Number(initialValue));
      assert.equal(Number(result.bidInterval), Number(bidInterval));
      assert.equal(Number(result.startDate), Number(startTime));
      assert.equal(Number(result.endDate), Number(endTime));

      truffleAssert.eventEmitted(eventTx, "AuctionCreated", (ev) => {
        return ev.auctionId == 0;
      });
    });

    ///////////////// ----------------------------- bid auction -------------------------------

    it("bid for auction and fail in invalid situations", async () => {
      //note usetAccount1 is used as bidderAccount1

      startTime = await Common.timeInitial(TimeEnumes.minutes, 5);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);
      const bidAmount1 = web3.utils.toWei("1.15");
      let initialValue = web3.utils.toWei("1");
      let bidInterval = 1000; //web3.utils.toWei("0.1");
      const invalidBidAmmount1 = web3.utils.toWei("1.05");
      const bidderInitialBalance = web3.utils.toWei("2");
      const invalidInitialBalance = web3.utils.toWei("1");
      const treeId = 1;
      const bidAmount2 = web3.utils.toWei("1.265");
      const invalidBidAmount2 = web3.utils.toWei("1.2649");

      const bidderInitialBalance2 = web3.utils.toWei("2");

      //////// -----------add auction

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });
      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ////////////---------------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        bidInterval,
        { from: dataManager }
      );

      //////// ------------ prepare for bid auction

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1, {
        from: userAccount1,
      });

      ////////// ---------- fail because bid before start

      await auctionInstance
        .bid(0, bidAmount1, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_BEFORE_START);

      await Common.travelTime(TimeEnumes.minutes, 10);

      /////////// ------------- fail not have enough balance

      await wethInstance.setMint(userAccount1, invalidInitialBalance);

      await auctionInstance
        .bid(0, bidAmount1, userAccount1, {
          from: userAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.INVALID_REFERAL);

      await auctionInstance
        .bid(0, bidAmount1, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.INSUFFICIENT_AMOUNT);

      await wethInstance.resetAcc(userAccount1);

      //////////// ------------ fail because of Insufficient balance

      await wethInstance.setMint(userAccount1, bidderInitialBalance);

      await auctionInstance
        .bid(0, invalidBidAmmount1, zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      await wethInstance.resetAcc(userAccount1);

      ////////////// travel time to check endTime increase
      await Common.travelTime(TimeEnumes.minutes, 45);

      let resultBeforeBid = await auctionInstance.auctions.call(0);

      ////////////////// charge bidder account

      await wethInstance.setMint(userAccount1, bidderInitialBalance);

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
        from: userAccount2,
      });

      await wethInstance.setMint(userAccount2, bidderInitialBalance2);

      const bidder1BalanceBefore = await wethInstance.balanceOf(userAccount1);

      assert.equal(
        bidder1BalanceBefore,
        Number(bidderInitialBalance),
        "bidderAmount is not correct"
      );

      /////////////////////////// ----------------- bid
      const eventTx = await auctionInstance.bid(0, bidAmount1, zeroAddress, {
        from: userAccount1,
      });

      const bidder1BalanceAfterBid = await wethInstance.balanceOf(userAccount1);

      const resultAfterBid1 = await auctionInstance.auctions.call(0);

      ////////// -------------- check highest bid event
      truffleAssert.eventEmitted(eventTx, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == 0 &&
          ev.bidder == userAccount1 &&
          Number(ev.amount) == Number(bidAmount1) &&
          Number(ev.treeId) == treeId &&
          ev.referrer == zeroAddress
        );
      });
      ////////////----------- check balances
      assert.equal(
        Number(bidder1BalanceAfterBid),
        Math.subtract(Number(bidderInitialBalance), Number(bidAmount1))
      );

      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount1),
        "contract balance is not ok"
      );

      assert.equal(
        Number(resultAfterBid1.highestBid),
        Number(bidAmount1),
        "highest bid is not correct"
      );

      await auctionInstance
        .bid(0, invalidBidAmount2, zeroAddress, {
          from: userAccount2,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      const eventTx2 = await auctionInstance.bid(0, bidAmount2, zeroAddress, {
        from: userAccount2,
      });

      const resultAfterBid2 = await auctionInstance.auctions.call(0);

      ////////// -------------- check highest bid event

      truffleAssert.eventEmitted(eventTx2, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == 0 &&
          ev.bidder == userAccount2 &&
          Number(ev.amount) == Number(bidAmount2) &&
          Number(ev.treeId) == treeId &&
          ev.referrer == zeroAddress
        );
      });

      /////////////////---------------- check contract and bidder balace after bid

      assert.equal(
        Number(await wethInstance.balanceOf(userAccount2)),
        Math.subtract(Number(bidderInitialBalance2), Number(bidAmount2))
      );

      //check contract balance
      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount2),
        "2.Contract balance is not true"
      );

      //check userAccount1 refunded
      assert.equal(
        Number(await wethInstance.balanceOf(userAccount1)),
        Math.add(Number(bidder1BalanceAfterBid), Number(bidAmount1)),
        "Redirect automatic withdraw is not true"
      );

      assert.equal(Number(resultAfterBid2.highestBid), Number(bidAmount2));

      ///////////////////////// check auction end time after bid

      assert.equal(
        Math.subtract(
          resultAfterBid1.endDate.toNumber(),
          resultBeforeBid.endDate.toNumber()
        ),
        600
      );

      truffleAssert.eventEmitted(eventTx, "AuctionEndTimeIncreased", (ev) => {
        return (
          Number(ev.auctionId) == 0 &&
          Number(ev.newAuctionEndTime) == Math.add(Number(endTime), 600)
        );
      });

      await wethInstance.resetAcc(userAccount1);
      await wethInstance.resetAcc(userAccount2);

      ////////////// ------------- travel time to after end of auction to fail bid
      await Common.travelTime(TimeEnumes.minutes, 20);

      await auctionInstance
        .bid(0, web3.utils.toWei("2"), zeroAddress, {
          from: userAccount2,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_AFTER_END);
    });

    it("bid with referrals and check data", async () => {
      const bidderAccount1 = userAccount1;
      const referralAccount1 = userAccount2;
      const bidderAccount2 = userAccount3;
      const referralAccount2 = userAccount4;
      const bidderAccount3 = userAccount5;
      const referralAccount3 = userAccount6;

      const bidAmount1 = web3.utils.toWei("1.1");
      const bidAmount2 = web3.utils.toWei("1.21");
      const bidAmount3 = web3.utils.toWei("1.331");
      const bidAmount4 = web3.utils.toWei("1.4641");
      const bidAmount5 = web3.utils.toWei("1.61051");

      const bidderInitialBalance = web3.utils.toWei("2");
      const treeId = 1;
      const auctionId1 = 0;
      const auctionId2 = 1;

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      ////////////// ------------------ handle address

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1, {
        from: bidderAccount1,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
        from: bidderAccount2,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount3, {
        from: bidderAccount3,
      });

      /////////////////// --------------- handle add tree

      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });
      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ////////////---------------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        1000,
        { from: dataManager }
      );

      ////////////////// charge bidder accounts

      await wethInstance.setMint(bidderAccount1, bidderInitialBalance);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance);

      await wethInstance.setMint(bidderAccount3, bidderInitialBalance);

      ///////////// check bidder1 referral before
      const bidder1RefferalBefore = await auctionInstance.referrals.call(
        bidderAccount1,
        auctionId1
      );
      assert.equal(
        bidder1RefferalBefore,
        zeroAddress,
        "referral 1 is not correct"
      );
      /////////////////// ------------- bid

      const eventTx1 = await auctionInstance.bid(
        auctionId1,
        bidAmount1,
        referralAccount1,
        {
          from: bidderAccount1,
        }
      );

      truffleAssert.eventEmitted(eventTx1, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          ev.treeId == treeId &&
          ev.bidder == bidderAccount1 &&
          Number(ev.amount) == Number(bidAmount1) &&
          ev.referrer == referralAccount1
        );
      });

      ///////////// check bidder1 referral after bid
      const bidder1RefferalAfter = await auctionInstance.referrals.call(
        bidderAccount1,
        auctionId1
      );

      assert.equal(
        bidder1RefferalAfter,
        referralAccount1,
        "referral 1 is not correct"
      );

      // /////////////////////////////////////////////////////////////////

      ///////////// check bidder1 referral before
      const bidder2RefferalBefore = await auctionInstance.referrals.call(
        bidderAccount2,
        auctionId1
      );
      assert.equal(
        bidder2RefferalBefore,
        zeroAddress,
        "referral 2 is not correct"
      );
      /////////////////// ------------- bid

      const eventTx2 = await auctionInstance.bid(
        auctionId1,
        bidAmount2,
        zeroAddress,
        {
          from: bidderAccount2,
        }
      );

      truffleAssert.eventEmitted(eventTx2, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          ev.treeId == treeId &&
          ev.bidder == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == zeroAddress
        );
      });

      ///////////// check bidder1 referral after bid
      const bidder2RefferalAfter = await auctionInstance.referrals.call(
        bidderAccount2,
        auctionId1
      );

      assert.equal(
        bidder2RefferalAfter,
        zeroAddress,
        "referral 2 is not correct"
      );

      // /////////////////////////////////////////////////////////////////

      ///////////// check bidder3 referral before
      const bidder3RefferalBefore = await auctionInstance.referrals.call(
        bidderAccount3,
        auctionId1
      );
      assert.equal(
        bidder3RefferalBefore,
        zeroAddress,
        "referral 3 is not correct"
      );
      // /////////////////// ------------- bid

      const eventTx3 = await auctionInstance.bid(
        auctionId1,
        bidAmount3,
        referralAccount3,
        {
          from: bidderAccount3,
        }
      );

      truffleAssert.eventEmitted(eventTx3, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          ev.treeId == treeId &&
          ev.bidder == bidderAccount3 &&
          Number(ev.amount) == Number(bidAmount3) &&
          ev.referrer == referralAccount3
        );
      });

      ///////////// check bidder1 referral after bid
      const bidder3RefferalAfter = await auctionInstance.referrals.call(
        bidderAccount3,
        auctionId1
      );

      assert.equal(
        bidder3RefferalAfter,
        referralAccount3,
        "referral 3 is not correct"
      );

      /////////////////////////////////////////////////////////////////

      ///////////// check bidder2 referral before
      const bidder2RefferalBefore2 = await auctionInstance.referrals.call(
        bidderAccount2,
        auctionId1
      );
      assert.equal(
        bidder2RefferalBefore2,
        zeroAddress,
        "referral 2 is not correct"
      );
      // /////////////////// ------------- bid
      await wethInstance.approve(auctionInstance.address, bidAmount4, {
        from: bidderAccount2,
      });

      await auctionInstance.bid(auctionId1, bidAmount4, referralAccount2, {
        from: bidderAccount2,
      });

      ///////////// check bidder2 referral after bid
      const bidder2RefferalAfter2 = await auctionInstance.referrals.call(
        bidderAccount2,
        auctionId1
      );

      assert.equal(
        bidder2RefferalAfter2,
        referralAccount2,
        "referral 2 is not correct"
      );

      /////////////////////////////////////////////////////////////////

      ///////////// check bidder3 referral before
      const bidder3RefferalBefore2 = await auctionInstance.referrals.call(
        bidderAccount3,
        auctionId1
      );
      assert.equal(
        bidder3RefferalBefore2,
        referralAccount3,
        "referral 3 is not correct"
      );
      // /////////////////// ------------- bid
      await wethInstance.approve(auctionInstance.address, bidAmount5, {
        from: bidderAccount3,
      });
      await auctionInstance.bid(auctionId1, bidAmount5, zeroAddress, {
        from: bidderAccount3,
      });

      ///////////// check bidder1 referral after bid
      const bidder3RefferalAfter2 = await auctionInstance.referrals.call(
        bidderAccount3,
        auctionId1
      );

      assert.equal(
        bidder3RefferalAfter2,
        referralAccount3,
        "referral 3 is not correct"
      );

      ////////////////------------------- check refferes in auction2

      const bidder1RefferalAuction2 = await auctionInstance.referrals.call(
        bidderAccount1,
        auctionId2
      );

      const bidder2RefferalAuction2 = await auctionInstance.referrals.call(
        bidderAccount1,
        auctionId2
      );
      const bidder3RefferalAuction2 = await auctionInstance.referrals.call(
        bidderAccount1,
        auctionId2
      );

      assert.equal(
        bidder1RefferalAuction2,
        zeroAddress,
        "referral 1 is not correct"
      );
      assert.equal(
        bidder2RefferalAuction2,
        zeroAddress,
        "referral 2 is not correct"
      );
      assert.equal(
        bidder3RefferalAuction2,
        zeroAddress,
        "referral 3 is not correct"
      );

      await wethInstance.resetAcc(bidderAccount1);
      await wethInstance.resetAcc(bidderAccount2);
      await wethInstance.resetAcc(bidderAccount3);
    });

    it("should fail to create and bid and end auction when functionality is paused", async () => {
      let auctionId = 0;

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;
      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      ///////////////------------------- pause
      await arInstance.pause({
        from: deployerAccount,
      });

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          web3.utils.toWei("1", "Ether"),
          web3.utils.toWei(".5", "Ether"),
          { from: dataManager }
        )
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await auctionInstance
        .bid(auctionId, web3.utils.toWei("1.5"), zeroAddress, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await Common.travelTime(TimeEnumes.hours, 2);

      await auctionInstance
        .endAuction(auctionId, 0, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.PAUSE);

      await arInstance.unpause({
        from: deployerAccount,
      });
    });
  });

  describe("test with end auction", () => {
    beforeEach(async () => {
      auctionInstance = await Auction.new({
        from: deployerAccount,
      });

      await auctionInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

      //////////////////////////////-------------------- handle address
      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await wethFundInstance.setDexRouterAddress(uniswapV2Router02NewAddress, {
        from: deployerAccount,
      });

      await wethFundInstance.setWethTokenAddress(WETHAddress, {
        from: deployerAccount,
      });

      await wethFundInstance.setDaiAddress(DAIAddress, {
        from: deployerAccount,
      });

      await wethFundInstance.setPlanterFundContractAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );
      await Common.addTreejerContractRole(
        arInstance,
        wethFundInstance.address,
        deployerAccount
      );
      await auctionInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        auctionInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
    });

    it("should end auction and fail in invalid situations", async () => {
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

      await auctionInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      const treeId = 1;
      const bidAmount = web3.utils.toWei("1.15");
      const bidderInitialBalance = web3.utils.toWei("2");
      const bidderAccount = userAccount1;

      const treeId2 = 2;
      const bidAmount2 = web3.utils.toWei("1.15");
      const bidderInitialBalance2 = web3.utils.toWei("2");
      const bidderAccount2 = userAccount1;

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount, {
        from: bidderAccount,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
        from: bidderAccount2,
      });

      /////////////////--------------- handle add tree

      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });

      // await treeFactoryInstance.listTree(treeId2, ipfsHash, {
      //   from: dataManager,
      // });

      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////////// ---------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        1000,
        { from: dataManager }
      );

      ////////////////// charge bidder account

      await wethInstance.setMint(bidderAccount, bidderInitialBalance);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

      /////////////////------------------- end auction with bidder

      await auctionInstance
        .endAuction(0, 0, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME); //end time dont reach and must be rejected

      await auctionInstance.bid(0, bidAmount, zeroAddress, {
        from: bidderAccount,
      });

      await Common.travelTime(TimeEnumes.seconds, 670);

      let successEnd = await auctionInstance.endAuction(0, 0, {
        from: deployerAccount,
      }); //succesfully end the auction

      //------------------------- check tree data
      const treeData1 = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        Number(treeData1.treeStatus),
        2,
        "tree1 status is not correct"
      );
      assert.equal(
        Number(treeData1.saleType),
        0,
        "tree1 sale type is not correct"
      );

      let addressGetToken = await treeTokenInstance.ownerOf(treeId);

      assert.equal(addressGetToken, bidderAccount, "token not true mint");

      truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
        return (
          Number(ev.auctionId) == 0 &&
          Number(ev.treeId) == treeId &&
          ev.winner == bidderAccount &&
          Number(ev.amount) == bidAmount &&
          ev.referrer == zeroAddress
        );
      });

      let result = await auctionInstance.auctions.call(0);

      assert.equal(Number(result.endDate), 0, "auction not true");

      assert.equal(Number(result.startDate), 0, "auction not true");

      await auctionInstance
        .endAuction(0, 0, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AuctionErrorMsg.AUCTION_IS_UNAVAILABLE); //auction already ended and must be rejected

      await wethInstance.resetAcc(bidderAccount);

      //////////////////////--------------------------- auction with no bidder

      await auctionInstance.createAuction(
        treeId2,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        1000,
        { from: dataManager }
      );

      await Common.travelTime(TimeEnumes.seconds, 70);

      let failEndNoBidder = await auctionInstance.endAuction(1, 0, {
        from: deployerAccount,
      });
      // check tree data
      const treeData2 = await treeFactoryInstance.trees.call(treeId2);

      assert.equal(Number(treeData2.saleType), 0, "provide status is not ok");

      assert.equal(
        Number(treeData2.treeStatus),
        2,
        "tree2 status is not correct"
      );

      truffleAssert.eventEmitted(failEndNoBidder, "AuctionEnded", (ev) => {
        return Number(ev.auctionId) == 1 && Number(ev.treeId) == treeId2;
      });

      // //////////////////////// create another auction for treeId2 that ended with no bidder

      await auctionInstance.createAuction(
        treeId2,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1.5"),
        2000,
        { from: dataManager }
      );

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId2)).saleType),
        1,
        "provide status is not ok"
      );

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId2)).treeStatus),
        2,
        "tree2 status is not correct"
      );

      await wethInstance.resetAcc(bidderAccount2);
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
      const bidAmount1_2 = web3.utils.toWei("1.4");
      const bidderInitialBalance1 = web3.utils.toWei("2");
      const bidderAccount1 = userAccount1;
      const bidAmount2_1 = web3.utils.toWei("1.21");
      const bidderInitialBalance2 = web3.utils.toWei("2");
      const bidderAccount2 = userAccount2;
      const bidAmount3_1 = web3.utils.toWei("1.6");
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
        dataManager
      );

      await Common.joinSimplePlanter(
        planterInstance,
        3,
        userAccount7,
        zeroAddress,
        userAccount8
      );

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1_1, {
        from: bidderAccount1,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2_1, {
        from: bidderAccount2,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount3_1, {
        from: bidderAccount3,
      });

      /////////////////--------------- handle add tree

      // await treeFactoryInstance.listTree(treeId, ipfsHash, {
      //   from: dataManager,
      // });

      //////////////////// ----------------- handle allocation data

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

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////////// ---------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        1000,

        { from: dataManager }
      );

      ////////////////// charge bidder account

      await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

      await wethInstance.setMint(bidderAccount3, bidderInitialBalance3);

      /////////////////////////////////////////////////////////////////////////////////

      await auctionInstance.bid(0, bidAmount1_1, zeroAddress, {
        from: bidderAccount1,
      });

      const auction1 = await auctionInstance.auctions.call(0);

      assert.equal(auction1.bidder, userAccount1, "bidder is incoreect");

      assert.equal(
        Number(auction1.highestBid),
        Number(bidAmount1_1),
        "highest bid is incorrect"
      );

      await Common.travelTime(TimeEnumes.minutes, 55);

      await auctionInstance.bid(0, bidAmount2_1, zeroAddress, {
        from: bidderAccount2,
      });

      const auction2 = await auctionInstance.auctions.call(0);

      assert.equal(auction2.bidder, userAccount2, "bidder is incorrect");
      assert.equal(
        Math.subtract(Number(auction2.endDate), Number(auction1.endDate)),
        600,
        "time increse incorrect"
      );

      await auctionInstance
        .bid(0, invalidBidAmount, zeroAddress, { from: userAccount1 })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      /////////////////// ---------------give approve again to auction contract from bidderAccount1

      await wethInstance.approve(auctionInstance.address, bidAmount1_2, {
        from: bidderAccount1,
      });

      await auctionInstance.bid(0, bidAmount1_2, zeroAddress, {
        from: bidderAccount1,
      });

      const auction3 = await auctionInstance.auctions.call(0);

      assert.equal(auction3.bidder, userAccount1, "bidder is incorrect");
      assert.equal(
        Number(auction3.endDate),
        Number(auction2.endDate),
        "increase end time inccorect"
      );

      await Common.travelTime(TimeEnumes.seconds, 600);

      await auctionInstance.bid(0, bidAmount3_1, zeroAddress, {
        from: bidderAccount3,
      });

      await auctionInstance
        .endAuction(0, 0, { from: deployerAccount })
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

      const auction4 = await auctionInstance.auctions.call(0);

      assert.equal(
        Math.subtract(Number(auction4.endDate), Number(auction3.endDate)),
        600,
        "increase end time incorrect"
      );

      assert.equal(auction4.bidder, bidderAccount3, "bidder is inccorect");

      await Common.travelTime(TimeEnumes.minutes, 16);

      let contractBalanceBefore = await wethInstance.balanceOf(
        auctionInstance.address
      );

      assert.equal(
        Number(contractBalanceBefore),
        Number(bidAmount3_1),
        "1.Contract balance not true"
      );

      let amount = Number(web3.utils.toWei("1.6"));

      let expected = {
        planterAmount: Math.divide(Math.mul(40, amount), 100),
        ambassadorAmount: Math.divide(Math.mul(12, amount), 100),
        research: Math.divide(Math.mul(12, amount), 100),
        localDevelopment: Math.divide(Math.mul(12, amount), 100),
        insurance: Math.divide(Math.mul(12, amount), 100),
        treasury: Math.divide(Math.mul(12, amount), 100),
        reserve1: 0,
        reserve2: 0,
      };

      const wethFundShare = Math.add(
        expected.research,
        expected.localDevelopment,
        expected.insurance,
        expected.treasury,
        expected.reserve1,
        expected.reserve2
      );

      const planterFundShare = web3.utils.toWei("0.832"); // 0.52 (planter and referral share) * 1.4 (highestBid)

      const expectedSwapTokenAmount =
        await dexRouterInstance.getAmountsOut.call(planterFundShare, [
          wethInstance.address,
          daiInstance.address,
        ]);

      await auctionInstance
        .endAuction(0, expectedSwapTokenAmount[1] + 1, {
          from: userAccount3,
        })
        .should.be.rejectedWith(CommonErrorMsg.UNISWAP_OUTPUT_AMOUNT);

      await auctionInstance.endAuction(0, expectedSwapTokenAmount[1], {
        from: userAccount3,
      });

      /////////// --------------- check referral for zero address
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

      const winnerReferral = await auctionInstance.referrals.call(
        auction3.bidder,
        0
      );

      assert.equal(
        winnerReferral,
        zeroAddress,
        "winner referral is not correct"
      );

      const giftCount =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          winnerReferral
        );

      assert.equal(Number(giftCount), 0, "gift count is not correct");

      ////////////////--------------------------------------------

      let contractBalanceAfter = await wethInstance.balanceOf(
        auctionInstance.address
      );

      assert.equal(
        Number(contractBalanceAfter),
        0,
        "2.Contract balance not true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(wethFundInstance.address)),
        wethFundShare,
        "1.WethFund contract balance not true"
      );

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundInstnce.address)),
        Number(expectedSwapTokenAmount[1]),
        "1.PlanterFund contract balance not true"
      );

      assert.equal(
        await treeTokenInstance.ownerOf(treeId),
        userAccount3,
        "owner of token is incorrect"
      );

      //check treasury updated true
      let pFund = await planterFundInstnce.treeToPlanterProjectedEarning.call(
        treeId
      );

      let aFund =
        await planterFundInstnce.treeToAmbassadorProjectedEarning.call(treeId);

      let totalBalancesPlanterFunds = await planterFundInstnce.totalBalances();

      let totalBalancesWethFund = await wethFundInstance.totalBalances();

      assert.equal(
        Number(pFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(5200)),
        "planter amount invalid"
      );

      assert.equal(
        Number(aFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(5200)),
        "ambassador amount invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(5200)),
        "ambassador funds invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(4000).div(5200)),
        "planter funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      await planterInstance.acceptPlanterByOrganization(userAccount7, true, {
        from: userAccount8,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount7, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance
        .plantAssignedTree(treeId, ipfsHash, birthDate, countryCode, {
          from: userAccount8,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANT_TREE_WITH_PLANTER);

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount7 }
      );

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount7 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_VERIFIER_ROLE);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount3 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_VERIFIER_ROLE);

      await Common.addVerifierRole(arInstance, userAccount8, deployerAccount);

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: userAccount8,
      });

      await wethInstance.resetAcc(bidderAccount1);
      await wethInstance.resetAcc(bidderAccount2);
      await wethInstance.resetAcc(bidderAccount3);
    });

    // ---------------------------------------complex test (auction and treeFactory and treasury)-------------------------------------

    it("complex test 1 with referral", async () => {
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
      const refferal1 = userAccount5;
      const bidAmount2 = web3.utils.toWei("1.265");
      const bidderInitialBalance2 = web3.utils.toWei("2");
      const bidderAccount2 = userAccount4;
      const refferal2 = userAccount6;

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1, {
        from: bidderAccount1,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
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
        planterInstance,
        dataManager
      );

      ///////////////// check tree data

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId)).treeStatus),
        4,
        "tree status is not correct"
      );

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId)).saleType),
        0,
        "tree sale type is not correct"
      );

      /////////////////////////////////// fail to create auction and allocation data

      await allocationInstance
        .addAllocationData(6500, 1200, 1200, 1200, 1200, 1200, 0, 0, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          1000,
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        3000,
        1200,
        1200,
        1200,
        1200,
        2200,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      //////////////// ---------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        1000,

        { from: dataManager }
      );

      ///////////////// check tree data

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId)).treeStatus),
        4,
        "tree status is not correct"
      );

      assert.equal(
        Number((await treeFactoryInstance.trees.call(treeId)).saleType),
        1,
        "tree sale type is not correct"
      );

      ////////////////// charge bidder account

      await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

      /////////////////////////////////////////////////////////////////////////////////

      let createResult = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        createResult.saleType,
        1,
        "sale type not true update when auction create"
      );

      ////////////////////----------------- fail to create auction

      await auctionInstance
        .createAuction(
          treeId,
          Number(startTime),
          Number(endTime),
          initialValue,
          1000,
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(AuctionErrorMsg.TREE_STATUS);

      ////////////////// ----------------- fail to end auction

      await auctionInstance
        .endAuction(0, 0, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

      await Common.travelTime(TimeEnumes.hours, 1);

      /////////////////// -------------- end auction

      await auctionInstance.endAuction(0, 0, {
        from: deployerAccount,
      });

      let failResult = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        Number(failResult.saleType),
        0,
        "sale type not true after end auction"
      );

      assert.equal(
        Number(failResult.treeStatus),
        4,
        "tree status not true after end auction"
      );

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        1000,
        {
          from: dataManager,
        }
      );

      ///////////////// check tree data

      let createResult2 = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        Number(createResult2.saleType),
        1,
        "sale type not true after auction create"
      );

      assert.equal(
        Number(createResult2.treeStatus),
        4,
        "tree status is not true after auction create"
      );

      await auctionInstance
        .bid(1, invalidBidAmount1, refferal1, {
          from: bidderAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      await auctionInstance.bid(1, bidAmount1, refferal1, {
        from: bidderAccount1,
      });

      let firstBidderAfterBid = await wethInstance.balanceOf(bidderAccount1);

      await auctionInstance
        .bid(1, invalidBidAmount2, refferal2, {
          from: bidderAccount2,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      await auctionInstance.bid(1, bidAmount2, refferal2, {
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
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount2),
        "1.Contract balance is not true"
      );

      await auctionInstance
        .endAuction(1, 0, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

      await Common.travelTime(TimeEnumes.hours, 1);

      let expected = {
        planterAmount: Math.divide(Math.mul(30, Number(bidAmount2)), 100),
        ambassadorAmount: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
        research: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
        localDevelopment: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
        insurance: Math.divide(Math.mul(12, Number(bidAmount2)), 100),
        treasury: Math.divide(Math.mul(22, Number(bidAmount2)), 100),
        reserve1: 0,
        reserve2: 0,
      };

      const wethFundShare = Math.add(
        expected.research,
        expected.localDevelopment,
        expected.insurance,
        expected.treasury,
        expected.reserve1,
        expected.reserve2
      );

      let wethFundInstanceBeforeAuctionEnd = await wethInstance.balanceOf(
        wethFundInstance.address
      );

      const planterFundShare = web3.utils.toWei("0.5313"); // 0.42 (planter and referral share) * 1.25 (highestBid)

      const expectedSwapTokenAmount =
        await dexRouterInstance.getAmountsOut.call(planterFundShare, [
          wethInstance.address,
          daiInstance.address,
        ]);

      const auctionDataBeforeEnd = await auctionInstance.auctions.call(1);

      let successEnd = await auctionInstance.endAuction(
        1,
        expectedSwapTokenAmount[1],
        {
          from: deployerAccount,
        }
      );

      //////////////// --------------------------------- check refferal part

      const winnerReferral = await auctionInstance.referrals.call(
        auctionDataBeforeEnd.bidder,
        1
      );

      assert.equal(winnerReferral, refferal2, "winner referral is not correct");

      const giftCountWinner =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          winnerReferral
        );

      const giftCountRefferal1 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(refferal1);

      assert.equal(
        Number(giftCountWinner),
        1,
        "gift count of winner is not correct"
      );

      assert.equal(
        Number(giftCountRefferal1),
        0,
        "gift count of refferal1 is not correct"
      );

      ////////////////////////////---------------------------------------

      assert.equal(
        Number(await wethInstance.balanceOf(wethFundInstance.address)),
        Math.add(Number(wethFundInstanceBeforeAuctionEnd), wethFundShare),
        "weth funds transfer not work true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        0,
        "Contract balance not true when auction end"
      );

      //check treasury updated true
      let pFund = await planterFundInstnce.treeToPlanterProjectedEarning.call(
        treeId
      );
      let aFund =
        await planterFundInstnce.treeToAmbassadorProjectedEarning.call(treeId);

      let totalBalancesPlanterFunds = await planterFundInstnce.totalBalances();

      let totalBalancesWethFund = await wethFundInstance.totalBalances();

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundInstnce.address)),
        Number(expectedSwapTokenAmount[1]),
        "PlanterFund balance is not ok"
      );

      assert.equal(
        Number(pFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(3000).div(4200)),
        "planter amount invalid"
      );

      assert.equal(
        Number(aFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(4200)),
        "ambassador amount invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(3000).div(4200)),
        "planter totalBalances invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1200).div(4200)),
        "ambassador funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      let successResult = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        successResult.saleType,
        0,
        "sale type not true update when auction success"
      );

      truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
        return (
          Number(ev.auctionId) == 1 &&
          Number(ev.treeId) == treeId &&
          ev.winner == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == refferal2
        );
      });

      await wethInstance.resetAcc(bidderAccount1);
      await wethInstance.resetAcc(bidderAccount2);
    });

    // check hold auction
    it("complex test 2 (without referrer)", async () => {
      const treeId = 0;
      const auctionId = 0;
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      let initialValue = web3.utils.toWei("1");
      let bidInterval = 1000;

      const invalidBidAmount1 = web3.utils.toWei("1.09");
      const invalidBidAmount2 = web3.utils.toWei("1.24");
      const invalidBidAmount3 = web3.utils.toWei("1.264");

      const bidAmount1_1 = web3.utils.toWei("1.15");
      const bidAmount1_2 = web3.utils.toWei("2.12");
      const bidderInitialBalance1 = web3.utils.toWei("3");
      const bidderAccount1 = userAccount3;
      const bidAmount2_1 = web3.utils.toWei("1.3");
      const bidAmount2_2 = web3.utils.toWei("2.52");
      const bidderInitialBalance2 = web3.utils.toWei("3");
      const bidderAccount2 = userAccount4;

      const bidAmount3_1 = web3.utils.toWei("1.5312");
      const bidderInitialBalance3 = web3.utils.toWei("2");
      const bidderAccount3 = userAccount5;

      startTime = await Common.timeInitial(TimeEnumes.minutes, 5);
      endTime = await Common.timeInitial(TimeEnumes.days, 10);

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        { from: deployerAccount }
      );

      await planterFundInstnce.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1_1, {
        from: bidderAccount1,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2_1, {
        from: bidderAccount2,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount3_1, {
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
        planterInstance,
        dataManager
      );

      ///////////////////// ---------------- fail to add allocation data

      await allocationInstance
        .addAllocationData(3500, 1000, 1000, 1500, 1000, 2000, 0, 0, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        3500,
        1000,
        1000,
        1500,
        1000,
        2000,
        0,
        0,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 0, 0, {
        from: dataManager,
      });

      //////////////// ---------------- create auction

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        initialValue,
        bidInterval,

        { from: dataManager }
      );

      ////////////////// charge bidder account

      await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

      await wethInstance.setMint(bidderAccount3, bidderInitialBalance3);

      /////////////////// ---------------- check bidders balance

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount1)),
        Number(bidderInitialBalance1),
        "bidder amount 1 is not ok"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount2)),
        Number(bidderInitialBalance2),
        "bidder amount 2 is not ok"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount3)),
        Number(bidderInitialBalance3),
        "bidder amount 3 is not ok"
      );

      ////////////// --------------- check tree data

      let createResult = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        createResult.saleType,
        1,
        "sale type not true update when auction create"
      );
      //////////////// ------------- fail to create auction
      await auctionInstance
        .createAuction(treeId, startTime, endTime, initialValue, bidInterval, {
          from: dataManager,
        })
        .should.be.rejectedWith(AuctionErrorMsg.TREE_STATUS);

      await auctionInstance
        .bid(auctionId, web3.utils.toWei("1.5"), zeroAddress, {
          from: bidderAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_BEFORE_START);

      await Common.travelTime(TimeEnumes.minutes, 5);

      await auctionInstance
        .bid(auctionId, invalidBidAmount1, zeroAddress, {
          from: bidderAccount1,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      ///////////////////// --------------- bid for auction

      await auctionInstance.bid(auctionId, bidAmount1_1, zeroAddress, {
        from: bidderAccount1,
      });

      ////////////////// check bidderAccount1 balance after bid

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount1)),
        Math.subtract(Number(bidderInitialBalance1), Number(bidAmount1_1)),
        "bidder balance 1 is not ok"
      );

      await Common.travelTime(TimeEnumes.days, 1);

      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount1_1),
        "1.Contract balance is not true"
      );

      const bidderAccount1AfterBid1 = await wethInstance.balanceOf(
        bidderAccount1
      );

      /////////////------------- fail to bid
      await auctionInstance
        .bid(auctionId, invalidBidAmount2, zeroAddress, {
          from: bidderAccount2,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      await auctionInstance
        .bid(auctionId, invalidBidAmount3, zeroAddress, {
          from: bidderAccount2,
        })
        .should.be.rejectedWith(AuctionErrorMsg.BID_VALUE);

      // /////////////////// ------------ bid for auction

      await auctionInstance.bid(auctionId, bidAmount2_1, zeroAddress, {
        from: bidderAccount2,
      });

      const bidderAccount1BalanceAfterAutomaticWithdraw1 =
        await wethInstance.balanceOf(bidderAccount1);

      //////////// ---------------- check contract balance
      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount2_1),
        "2.Contract balance is not true"
      );

      ////////////// ----------- check bidder account1 balance refunded

      assert.equal(
        Number(bidderAccount1BalanceAfterAutomaticWithdraw1),
        Math.add(Number(bidderAccount1AfterBid1), Number(bidAmount1_1)),
        "1.automatic withdraw not true work"
      );

      const bidderAccount2AfterBid1 = await wethInstance.balanceOf(
        bidderAccount2
      );
      ////////////////// check bidderAccount2 balance after bid

      assert.equal(
        Number(bidderAccount2AfterBid1),
        Math.subtract(Number(bidderInitialBalance2), Number(bidAmount2_1)),
        "bidder balance 1 is not ok"
      );
      ///////////////// -------------- bid for auction

      await auctionInstance.bid(auctionId, bidAmount3_1, zeroAddress, {
        from: bidderAccount3,
      });

      const bidderAccount2BalanceAfterAutomaticWithdraw1 =
        await wethInstance.balanceOf(bidderAccount2);

      ////////////// ----------- check bidder account 2 balance refunded
      assert.equal(
        Number(bidderAccount2BalanceAfterAutomaticWithdraw1),
        Math.add(Number(bidderAccount2AfterBid1), Number(bidAmount2_1)),
        "2.automatic withdraw not true work"
      );
      ////////// ----------- check contract balance
      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount3_1),
        "3.Contract balance is not true"
      );

      const bidderAccount3AfterBid1 = await wethInstance.balanceOf(
        bidderAccount3
      );

      ////////////////// check bidderAccount3 balance after bid

      assert.equal(
        Number(bidderAccount3AfterBid1),
        Math.subtract(Number(bidderInitialBalance3), Number(bidAmount3_1)),
        "bidder balance 3 is not ok"
      );

      await Common.travelTime(TimeEnumes.days, 7);

      // /////////////--------------------------- give approve from bidderAccount1 for seccend bid
      await wethInstance.approve(auctionInstance.address, bidAmount1_2, {
        from: bidderAccount1,
      });

      await auctionInstance.bid(auctionId, bidAmount1_2, zeroAddress, {
        from: bidderAccount1,
      });

      const bidderAccount3BalanceAfterAutomaticWithdraw1 =
        await wethInstance.balanceOf(bidderAccount3);

      /////////// ------------- check bidder account 3 balance refunded
      assert.equal(
        Number(bidderAccount3BalanceAfterAutomaticWithdraw1),
        Math.add(Number(bidderAccount3AfterBid1), Number(bidAmount3_1)),
        "3.automatic withdraw not true work"
      );

      ////////////////// check bidderAccount1 balance after bid

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount1)),
        Math.subtract(Number(bidderInitialBalance1), Number(bidAmount1_2)),
        "bidder balance 1 is not ok"
      );

      ///////////////----------- check contract balance after bid
      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount1_2),
        "4.Contract balance is not true"
      );

      //planter update tree
      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const treeDataAfterVerifyUpdate1 = await treeFactoryInstance.trees.call(
        treeId
      );

      assert.equal(
        Number(treeDataAfterVerifyUpdate1.treeStatus),
        192,
        "tree status is not ok"
      ); //its 168 because 7 days and 5 minutes left after tree planting that is equal to 168 hours

      const planterBalance = await planterFundInstnce.balances.call(
        userAccount2
      );

      assert.equal(planterBalance, 0, "1.planter balance not true in treasury");

      await auctionInstance
        .endAuction(auctionId, 0, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

      await Common.travelTime(TimeEnumes.days, 1);

      await Common.travelTime(TimeEnumes.minutes, 1430);

      //final bid

      const bidderAccount1AfterBid2 = await wethInstance.balanceOf(
        bidderAccount1
      );

      /////////////--------------------------- give approve from bidderAccount2 for seccend bid
      await wethInstance.approve(auctionInstance.address, bidAmount2_2, {
        from: bidderAccount2,
      });

      let tx = await auctionInstance.bid(auctionId, bidAmount2_2, zeroAddress, {
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

      //////////// ---------------- check bidder acccount 1 balance refunded
      assert.equal(
        Number(bidderAccount1BalanceAfterAutomaticWithdraw2),
        Math.add(Number(bidderAccount1AfterBid2), Number(bidAmount1_2)),
        "4.automatic withdraw not true work"
      );

      ////////////////// -------------------  check bidderAccount2 balance after bid

      assert.equal(
        Number(await wethInstance.balanceOf(bidderAccount2)),
        Math.subtract(Number(bidderInitialBalance2), Number(bidAmount2_2)),
        "bidder balance 2 is not ok"
      );

      //////////////////////// -------------------- check contract balance
      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(bidAmount2_2),
        "5.Contract balance is not true"
      );

      await Common.travelTime(TimeEnumes.minutes, 15);

      await Common.travelTime(TimeEnumes.days, 6);

      let expected = {
        planterAmount: Math.divide(Math.mul(35, Number(bidAmount2_2)), 100),
        ambassadorAmount: Math.divide(Math.mul(10, Number(bidAmount2_2)), 100),
        research: Math.divide(Math.mul(10, Number(bidAmount2_2)), 100),
        localDevelopment: Math.divide(Math.mul(15, Number(bidAmount2_2)), 100),
        insurance: Math.divide(Math.mul(10, Number(bidAmount2_2)), 100),
        treasury: Math.divide(Math.mul(20, Number(bidAmount2_2)), 100),
        reserve1: 0,
        reserve2: 0,
      };

      const wethFundShare = Math.add(
        expected.research,
        expected.localDevelopment,
        expected.insurance,
        expected.treasury,
        expected.reserve1,
        expected.reserve2
      );

      const planterFundShare = web3.utils.toWei("1.134"); // 0.45 (planter and referral share) * 2.52 (highestBid)

      const expectedSwapTokenAmount =
        await dexRouterInstance.getAmountsOut.call(planterFundShare, [
          wethInstance.address,
          daiInstance.address,
        ]);

      let successEnd = await auctionInstance.endAuction(auctionId, 0, {
        from: userAccount4,
      });

      await auctionInstance
        .createAuction(treeId, startTime, endTime, initialValue, bidInterval, {
          from: dataManager,
        })
        .should.be.rejectedWith(AuctionErrorMsg.TREE_STATUS);

      assert.equal(
        Number(await wethInstance.balanceOf(auctionInstance.address)),
        Number(web3.utils.toWei("0", "Ether")),
        "6.Contract balance is not true"
      );

      assert.equal(
        Number(await wethInstance.balanceOf(wethFundInstance.address)),
        Number(wethFundShare),
        "Treasury contract balance is not true"
      );

      assert.equal(
        Number(await daiInstance.balanceOf(planterFundInstnce.address)),
        Number(Math.Big(expectedSwapTokenAmount[1])),
        "planter fund balance is not ok"
      );

      truffleAssert.eventEmitted(successEnd, "AuctionSettled", (ev) => {
        return (
          Number(ev.auctionId) == auctionId &&
          Number(ev.treeId) == treeId &&
          ev.winner == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount2_2) &&
          ev.referrer == zeroAddress
        );
      });

      let addressGetToken = await treeTokenInstance.ownerOf(treeId);

      assert.equal(addressGetToken, bidderAccount2, "token not true mint");

      //check treasury updated true
      let pFund = await planterFundInstnce.treeToPlanterProjectedEarning.call(
        treeId
      );
      let aFund =
        await planterFundInstnce.treeToAmbassadorProjectedEarning.call(treeId);

      let totalBalancesPlanterFunds = await planterFundInstnce.totalBalances();
      let totalBalancesWethFund = await wethFundInstance.totalBalances();

      assert.equal(
        Number(pFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(3500).div(4500)),
        "planter amount invalid"
      );

      assert.equal(
        Number(aFund),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1000).div(4500)),
        "ambassador amount invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(3500).div(4500)),
        "planter totalBalances invalid"
      );

      assert.equal(
        Number(totalBalancesPlanterFunds.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1000).div(4500)),
        "ambassador funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.research),
        expected.research,
        "research funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.localDevelopment),
        expected.localDevelopment,
        "localDevelopment funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.insurance),
        expected.insurance,
        "insurance funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.treasury),
        expected.treasury,
        "treasury funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve1),
        expected.reserve1,
        "reserve1 funds invalid"
      );

      assert.equal(
        Number(totalBalancesWethFund.reserve2),
        expected.reserve2,
        "reserve2 funds invalid"
      );

      //planter update tree
      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      let planterBalance2 = await planterFundInstnce.balances.call(
        userAccount2
      );

      assert.equal(
        Number(planterBalance2),
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(3500)
            .div(4500) //planter share
            .times(384) // for 384 hours time travel
            .div(25920) // for 36*30*12
        ),
        "2.planter balance not true in treasury"
      );

      let plantersPaidTreeId0_1 =
        await planterFundInstnce.treeToPlanterTotalClaimed.call(treeId);

      assert.equal(
        Number(plantersPaidTreeId0_1),
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(3500)
            .div(4500) //planter share
            .times(384) // for 384 hours time travel
            .div(25920) // for 36*30*12
        ),
        "1.planter paid not true in treasury"
      );

      //planter withdraw

      let firstWithdrawPlanter = web3.utils.toWei("0.5");
      await planterFundInstnce
        .withdrawBalance(web3.utils.toWei("100"), {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INSUFFICIENT_AMOUNT);

      await planterFundInstnce.withdrawBalance(firstWithdrawPlanter, {
        from: userAccount2,
      });

      let planterBalance3 = await planterFundInstnce.balances.call(
        userAccount2
      );

      assert.equal(
        Number(planterBalance3),
        Math.subtract(Number(planterBalance2), Number(firstWithdrawPlanter)),
        "3.planter balance not true in treasury"
      );

      await Common.travelTime(TimeEnumes.years, 3);

      //planter update tree
      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      let planterBalance4 = await planterFundInstnce.balances.call(
        userAccount2
      );

      assert.equal(
        Number(Math.Big(planterBalance4).add(firstWithdrawPlanter)),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(3500).div(4500)),

        "4.planter balance not true in treasury"
      );

      let plantersPaidTreeId0_2 =
        await planterFundInstnce.treeToPlanterTotalClaimed.call(treeId);

      let planterFundsTreeId0_2 =
        await planterFundInstnce.treeToPlanterProjectedEarning.call(treeId);

      assert.equal(
        Number(plantersPaidTreeId0_2),
        Number(planterFundsTreeId0_2),
        "planter paid not equal to planter funds"
      );

      let planterFundsBalance = await daiInstance.balanceOf(
        planterFundInstnce.address
      );

      assert.equal(
        Number(Math.Big(planterFundsBalance).add(firstWithdrawPlanter)),
        Number(Math.Big(expectedSwapTokenAmount[1])),
        "2.treasury balance not true"
      );

      let totalBalances2 = await wethFundInstance.totalBalances();

      let treasuryBalance = totalBalances2.treasury;
      let ownerAccountBalanceBefore = await wethInstance.balanceOf(
        userAccount6
      );

      await wethFundInstance.setTreasuryAddress(userAccount6, {
        from: deployerAccount,
      });

      await wethFundInstance.withdrawTreasuryBalance(
        web3.utils.toWei(totalBalances2.treasury, "wei"),
        "reason message",
        {
          from: deployerAccount,
        }
      );

      let ownerAccountBalanceAfter = await wethInstance.balanceOf(userAccount6);

      assert.equal(
        Number(ownerAccountBalanceAfter),
        Math.add(Number(ownerAccountBalanceBefore), Number(treasuryBalance)),
        "1.owner balance not true"
      );

      assert.equal(
        await wethInstance.balanceOf(wethFundInstance.address),
        Math.subtract(wethFundShare, Number(treasuryBalance)),
        "3.treasury balance not true"
      );

      await wethInstance.resetAcc(bidderAccount1);
      await wethInstance.resetAcc(bidderAccount2);
      await wethInstance.resetAcc(bidderAccount3);
    });

    it("complex test 3 (complete auction done with referrer)  ", async () => {
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

      const treeId1 = 1;
      const treeId2 = 2;
      const auctionId1 = 0;
      const auctionId2 = 1;
      const initialPrice = web3.utils.toWei("1");
      const bidInterval = 1000;
      const bidAmount1 = web3.utils.toWei("1.5");
      const bidderInitialBalance1 = web3.utils.toWei("6");
      const bidderAccount1 = userAccount8;
      const bidAmount2 = web3.utils.toWei("2");
      const bidderInitialBalance2 = web3.utils.toWei("6");
      const bidderAccount2 = userAccount7;
      const mainReferrer = userAccount4;
      const otherReferrer = userAccount5;

      startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      ////////////////// ------------------- handle address

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        { from: deployerAccount }
      );

      await planterFundInstnce.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      //////////////// -----------  fail to create auction

      await auctionInstance
        .createAuction(treeId1, startTime, endTime, initialPrice, bidInterval, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await auctionInstance
        .createAuction(treeId1, startTime, endTime, initialPrice, bidInterval, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.INVALID_ASSIGN_MODEL);

      ///////////////////// ---------------- fail to add allocation data

      await allocationInstance
        .addAllocationData(5000, 1000, 1000, 1000, 1000, 1000, 0, 0, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      await allocationInstance
        .addAllocationData(5000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreasuryManagerErrorMsg.SUM_INVALID);

      //////////////////// ----------------- handle allocation data

      await allocationInstance.addAllocationData(
        5000,
        1000,
        1000,
        1000,
        1000,
        1000,
        0,
        0,
        { from: dataManager }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      // //////// ----------- fail to create auction <<invalid-tree>>
      // await auctionInstance
      //   .createAuction(
      //     treeId1,
      //     Number(startTime),
      //     Number(endTime),
      //     initialPrice,
      //     bidInterval,
      //     {
      //       from: dataManager,
      //     }
      //   )
      //   .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE);

      /////////------------------ add tree
      // await treeFactoryInstance.listTree(treeId1, ipfsHash, {
      //   from: dataManager,
      // });

      // await treeFactoryInstance.listTree(treeId2, ipfsHash, {
      //   from: dataManager,
      // });

      //////////////// ---------------- create auction

      await auctionInstance.createAuction(
        treeId1,
        Number(startTime),
        Number(endTime),
        initialPrice,
        bidInterval,

        { from: dataManager }
      );

      await auctionInstance.createAuction(
        treeId2,
        Number(startTime),
        Number(endTime),
        initialPrice,
        bidInterval,

        { from: dataManager }
      );

      ////////////////// charge bidder account

      await wethInstance.setMint(bidderAccount1, bidderInitialBalance1);

      await wethInstance.setMint(bidderAccount2, bidderInitialBalance2);

      /////////////////////////////////////////////////////////////////////////////////

      const initailAuction1 = await auctionInstance.auctions.call(auctionId1);

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount1, {
        from: bidderAccount1,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount1, {
        from: bidderAccount2,
      });

      //////////// bid 1

      let bidTx1 = await auctionInstance.bid(
        auctionId1,
        bidAmount1,
        otherReferrer,
        {
          from: bidderAccount1,
        }
      );
      let bidTx2 = await auctionInstance.bid(
        auctionId2,
        bidAmount1,
        otherReferrer,
        {
          from: bidderAccount2,
        }
      );

      truffleAssert.eventEmitted(bidTx1, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          ev.treeId == treeId1 &&
          ev.bidder == bidderAccount1 &&
          Number(ev.amount) == Number(bidAmount1) &&
          ev.referrer == otherReferrer
        );
      });

      truffleAssert.eventEmitted(bidTx2, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId2 &&
          ev.treeId == treeId2 &&
          ev.bidder == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount1) &&
          ev.referrer == otherReferrer
        );
      });

      /////////////////// ---------------give approve to auction contract

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
        from: bidderAccount2,
      });

      await wethInstance.approve(auctionInstance.address, bidAmount2, {
        from: bidderAccount1,
      });

      /////////////// bid 2

      await Common.travelTime(TimeEnumes.minutes, 55);

      const FinalBidTx1 = await auctionInstance.bid(
        auctionId1,
        bidAmount2,
        mainReferrer,
        {
          from: bidderAccount2,
        }
      );

      const FinalBidTx2 = await auctionInstance.bid(
        auctionId2,
        bidAmount2,
        mainReferrer,
        {
          from: bidderAccount1,
        }
      );

      const auction1AfterEndTimeIncrease = await auctionInstance.auctions.call(
        auctionId1
      );

      truffleAssert.eventEmitted(FinalBidTx1, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          ev.treeId == treeId1 &&
          ev.bidder == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == mainReferrer
        );
      });

      truffleAssert.eventEmitted(FinalBidTx2, "HighestBidIncreased", (ev) => {
        return (
          Number(ev.auctionId) == auctionId2 &&
          ev.treeId == treeId2 &&
          ev.bidder == bidderAccount1 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == mainReferrer
        );
      });

      assert.equal(
        Math.add(Number(initailAuction1.endDate), 600),
        Number(auction1AfterEndTimeIncrease.endDate),
        "invaild end time for auction after increase time"
      );

      truffleAssert.eventEmitted(
        FinalBidTx1,
        "AuctionEndTimeIncreased",
        (ev) => {
          return (
            Number(ev.auctionId) == auctionId1 &&
            Number(ev.newAuctionEndTime) ==
              Math.add(Number(initailAuction1.endDate), 600)
          );
        }
      );

      const planterFundBalanceBeforeAuction1End = await daiInstance.balanceOf(
        planterFundInstnce.address
      );
      const wethFundBalanceBeforeAuction1End = await wethInstance.balanceOf(
        wethFundInstance.address
      );
      const totalFundPlanterFundBeforeAuction1End =
        await planterFundInstnce.totalBalances();

      const totalFundWethFundBeforeAuction1End =
        await wethFundInstance.totalBalances();

      //////////////// ------------------  check contract funds before end auction

      assert.equal(
        Number(planterFundBalanceBeforeAuction1End),
        0,
        "invalid planter fund contract balance before auction end"
      );
      assert.equal(
        Number(wethFundBalanceBeforeAuction1End),
        0,
        "invalid weth fund contract balance before auction end"
      );

      ///------------ check totalBalances before auction end
      assert.equal(
        Number(totalFundPlanterFundBeforeAuction1End.planter),
        0,
        "invalid planter fund"
      );
      assert.equal(
        Number(totalFundPlanterFundBeforeAuction1End.ambassador),
        0,
        "invalid ambassador fund"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.research),
        0,
        "invalid research"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.localDevelopment),
        0,
        "invalid localDevelopment"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.insurance),
        0,
        "invalid insurance"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.treasury),
        0,
        "invalid treasury"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.reserve1),
        0,
        "invalid reserve1"
      );
      assert.equal(
        Number(totalFundWethFundBeforeAuction1End.reserve2),
        0,
        "invalid reserve2"
      );

      // //------------- end auction

      await auctionInstance
        .endAuction(auctionId1, 0)
        .should.be.rejectedWith(AuctionErrorMsg.END_AUCTION_BEFORE_END_TIME);

      await Common.travelTime(TimeEnumes.minutes, 20);

      const expectedPayValue = {
        planterAmount: Math.divide(Math.mul(Number(bidAmount2), 5000), 10000),
        ambassadorAmount: Math.divide(
          Math.mul(Number(bidAmount2), 1000),
          10000
        ),
        research: Math.divide(Math.mul(Number(bidAmount2), 1000), 10000),
        localDevelopment: Math.divide(
          Math.mul(Number(bidAmount2), 1000),
          10000
        ),
        insurance: Math.divide(Math.mul(Number(bidAmount2), 1000), 10000),
        treasury: Math.divide(Math.mul(Number(bidAmount2), 1000), 10000),
        reserve1: 0,
        reserve2: 0,
      };

      const wethFundShare = Math.add(
        expectedPayValue.research,
        expectedPayValue.treasury,
        expectedPayValue.localDevelopment,
        expectedPayValue.insurance,
        expectedPayValue.reserve1,
        expectedPayValue.reserve2
      );

      const planterFundShare = web3.utils.toWei("1.2"); // 0.6 (planter and referral share) * 2 (highestBid)

      const expectedSwapTokenAmount =
        await dexRouterInstance.getAmountsOut.call(planterFundShare, [
          wethInstance.address,
          daiInstance.address,
        ]);

      const auction1BeforeEnd = await auctionInstance.auctions.call(auctionId1);

      const endAuctionTx = await auctionInstance.endAuction(auctionId1, 0);

      /////////////////---------------------- check referral part

      const winnerReferrer1 = await auctionInstance.referrals.call(
        auction1BeforeEnd.bidder,
        auctionId1
      );

      assert.equal(
        winnerReferrer1,
        mainReferrer,
        "winner referrer of auction 0 is not ok"
      );

      const winnerGiftCount1 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          winnerReferrer1
        );

      assert.equal(Number(winnerGiftCount1), 1, "winner gift count is not ok");

      const otherReffereGiftCount1 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          otherReferrer
        );
      assert.equal(
        Number(otherReffereGiftCount1),
        0,
        "other referrer gift count is not ok"
      );

      /////////////////////////////// ---------------------------

      const wethFundBalanceAfterAuction1End = await wethInstance.balanceOf(
        wethFundInstance.address
      );

      const planterFundBalanceAfterAuction1End = await daiInstance.balanceOf(
        planterFundInstnce.address
      );

      let tokenOwner = await treeTokenInstance.ownerOf(treeId1);

      assert.equal(tokenOwner, userAccount7, "token owner not correct");

      const totalFundPlanterFundAfterAuction1End =
        await planterFundInstnce.totalBalances();

      const totalFundWethFundAfterAuction1End =
        await wethFundInstance.totalBalances();

      ///------------ check totalBalances after auction end
      assert.equal(
        Number(totalFundPlanterFundAfterAuction1End.planter),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(5000).div(6000)),
        "invalid planter fund"
      );
      assert.equal(
        Number(totalFundPlanterFundAfterAuction1End.ambassador),
        Number(Math.Big(expectedSwapTokenAmount[1]).times(1000).div(6000)),
        "invalid ambassador fund"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.research),
        expectedPayValue.research,
        "invalid research"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.localDevelopment),
        expectedPayValue.localDevelopment,
        "invalid localDevelopment"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.insurance),
        expectedPayValue.insurance,
        "invalid insurance"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.treasury),
        expectedPayValue.treasury,
        "invalid treasury"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.reserve1),
        expectedPayValue.reserve1,
        "invalid reserve1"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction1End.reserve2),
        expectedPayValue.reserve2,
        "invalid reserve2"
      );
      // ///////////------------ check charge treasury contract
      assert.equal(
        Math.subtract(
          Number(wethFundBalanceAfterAuction1End),
          Number(wethFundBalanceBeforeAuction1End)
        ),
        wethFundShare,
        "weth funds contract dont charge correctly"
      );

      assert.equal(
        Math.subtract(
          Number(planterFundBalanceAfterAuction1End),
          Number(planterFundBalanceBeforeAuction1End)
        ),
        Number(expectedSwapTokenAmount[1]),
        "planter fund contract dont charge correctly"
      );

      truffleAssert.eventEmitted(endAuctionTx, "AuctionSettled", (ev) => {
        return (
          Number(ev.auctionId) == auctionId1 &&
          Number(ev.treeId) == treeId1 &&
          ev.winner == bidderAccount2 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == mainReferrer
        );
      });

      ///////////////////----------------------------- end auction2

      const auction2BeforeEnd = await auctionInstance.auctions.call(auctionId2);

      const expectedSwapTokenAmount2 =
        await dexRouterInstance.getAmountsOut.call(planterFundShare, [
          wethInstance.address,
          daiInstance.address,
        ]);

      const endAuctionTx2 = await auctionInstance.endAuction(auctionId2, 0);

      /////////////////---------------------- check referral part

      const winnerReferrer2 = await auctionInstance.referrals.call(
        auction2BeforeEnd.bidder,
        auctionId2
      );
      assert.equal(
        winnerReferrer2,
        mainReferrer,
        "winner referrer of auction 0 is not ok"
      );

      const winnerGiftCount2 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          winnerReferrer2
        );
      assert.equal(Number(winnerGiftCount2), 2, "winner gift count is not ok");

      const otherReffereGiftCount2 =
        await regularSaleInstance.referrerClaimableTreesWeth.call(
          otherReferrer
        );
      assert.equal(
        Number(otherReffereGiftCount2),
        0,
        "other referrer gift count is not ok"
      );

      /////////////////////////////// ---------------------------

      ///////----------------- check token owner
      let tokenOwner2 = await treeTokenInstance.ownerOf(treeId2);

      assert.equal(tokenOwner2, userAccount8, "token owner not correct");

      ///////////////// ----------- check planterFund totalBalances

      const wethFundBalanceAfterAuction2End = await wethInstance.balanceOf(
        wethFundInstance.address
      );

      const planterFundBalanceAfterAuction2End = await daiInstance.balanceOf(
        planterFundInstnce.address
      );

      const totalFundPlanterFundAfterAuction2End =
        await planterFundInstnce.totalBalances();

      const totalFundWethFundAfterAuction2End =
        await wethFundInstance.totalBalances();

      ///------------ check totalBalances after auction end

      assert.equal(
        Number(totalFundPlanterFundAfterAuction2End.planter),
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(5000)
            .div(6000)
            .add(Math.Big(expectedSwapTokenAmount2[1]).times(5000).div(6000))
        ),
        "invalid planter fund"
      );
      assert.equal(
        Number(totalFundPlanterFundAfterAuction2End.ambassador),
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(1000)
            .div(6000)
            .add(Math.Big(expectedSwapTokenAmount2[1]).times(1000).div(6000))
        ),
        "invalid ambassador fund"
      );

      assert.equal(
        Number(totalFundWethFundAfterAuction2End.research),
        Math.mul(expectedPayValue.research, 2),
        "invalid research"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction2End.localDevelopment),
        Math.mul(expectedPayValue.localDevelopment, 2),
        "invalid localDevelopment"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction2End.insurance),
        Math.mul(expectedPayValue.insurance, 2),
        "invalid insurance"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction2End.treasury),
        Math.mul(expectedPayValue.treasury, 2),
        "invalid treasury"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction2End.reserve1),
        Math.mul(expectedPayValue.reserve1, 2),
        "invalid reserve1"
      );
      assert.equal(
        Number(totalFundWethFundAfterAuction2End.reserve2),
        Math.mul(expectedPayValue.reserve2, 2),
        "invalid reserve2"
      );

      // ///////////------------ check charge treasury contract
      assert.equal(
        Math.subtract(
          Number(wethFundBalanceAfterAuction2End),
          Number(wethFundBalanceAfterAuction1End)
        ),
        wethFundShare,
        "weth funds contract dont charge correctly"
      );

      assert.equal(
        Number(planterFundBalanceAfterAuction2End),
        Number(
          Math.Big(expectedSwapTokenAmount2[1]).add(
            Math.Big(expectedSwapTokenAmount[1])
          )
        ),
        "planter fund contract dont charge correctly"
      );

      truffleAssert.eventEmitted(endAuctionTx2, "AuctionSettled", (ev) => {
        return (
          Number(ev.auctionId) == auctionId2 &&
          Number(ev.treeId) == treeId2 &&
          ev.winner == bidderAccount1 &&
          Number(ev.amount) == Number(bidAmount2) &&
          ev.referrer == mainReferrer
        );
      });

      await Common.addPlanter(arInstance, userAccount2, deployerAccount);

      /////////////----------------------- plant treeId1

      await Common.successJoin(
        arInstance,
        deployerAccount,
        planterInstance,
        1,
        userAccount2,
        zeroAddress,
        zeroAddress
      );

      await treeFactoryInstance.assignTree(treeId1, userAccount2, {
        from: dataManager,
      });
      await treeFactoryInstance.plantAssignedTree(treeId1, ipfsHash, 1, 1, {
        from: userAccount2,
      });

      await Common.addVerifierRole(arInstance, dataManager, deployerAccount);

      await treeFactoryInstance.verifyAssignedTree(treeId1, true, {
        from: dataManager,
      });
      ////////////// ------------------- update tree
      await treeFactoryInstance
        .updateTree(treeId1, ipfsHash, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.hours, 28);

      await Common.travelTime(TimeEnumes.days, 6);

      await treeFactoryInstance.updateTree(treeId1, ipfsHash, {
        from: userAccount2,
      });
      /////////////////// --------------- verify update

      await treeFactoryInstance.verifyUpdate(treeId1, true, {
        from: dataManager,
      });

      //////////////// ---------------------- check total funds value

      const totalBalancesAfterFundPlanter =
        await planterFundInstnce.totalBalances();

      const planterPaidAfterVerify =
        await planterFundInstnce.treeToPlanterTotalClaimed.call(treeId1);

      const resultAfterGT = await treeFactoryInstance.trees.call(treeId1);

      const expectedPaidAfterFundPlanter = parseInt(
        Number(
          Math.Big(expectedSwapTokenAmount[1])
            .times(5000)
            .div(6000)
            .times(Number(resultAfterGT.treeStatus))
            .div(25920)
        )
      );

      assert.equal(
        parseInt(
          Number(
            Math.Big(totalFundPlanterFundAfterAuction2End.planter).minus(
              totalBalancesAfterFundPlanter.planter
            )
          )
        ),

        expectedPaidAfterFundPlanter,
        "planter total fund is not ok"
      );

      ///////////// ------------------------- check paid planter funds
      assert.equal(
        parseInt(Number(planterPaidAfterVerify)),
        expectedPaidAfterFundPlanter,
        "planter paid not correct"
      );
      /////////////---------------------- check planter balance before withdraw

      const planterPaidBeforeWithdrawTotalAmount =
        await planterFundInstnce.balances.call(userAccount2);

      assert.equal(
        parseInt(Number(planterPaidBeforeWithdrawTotalAmount)),
        expectedPaidAfterFundPlanter,
        "planter balance before withdraw is not ok"
      );

      ////////////// ----------------- withdraw planter fund

      let withdrawAmount = web3.utils.toWei("2");

      await planterFundInstnce.withdrawBalance(withdrawAmount, {
        from: userAccount2,
      });

      // ////////////////--------------- check planter balance after withdraw
      const planterPaidAfterWithdrawTotalAmount =
        await planterFundInstnce.balances.call(userAccount2);

      assert.equal(
        parseInt(
          Number(
            Math.Big(planterPaidAfterWithdrawTotalAmount).add(
              Number(withdrawAmount)
            )
          )
        ),
        expectedPaidAfterFundPlanter,
        "planter fund is not ok after withdraw total amount"
      );

      await wethInstance.resetAcc(bidderAccount1);
      await wethInstance.resetAcc(bidderAccount2);
    });
  });
});
