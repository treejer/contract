const AccessRestriction = artifacts.require("AccessRestriction");
const TreeAuction = artifacts.require("TreeAuction");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");

contract("TreeAuction", (accounts) => {
  let treeAuctionInstance;
  let arInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];

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
  });

  afterEach(async () => {});
  it("should set trusted forwarder", async () => {
    let tx = await treeAuctionInstance.setTrustedForwarder(accounts[4], {
      from: deployerAccount,
    });
    await treeAuctionInstance.setTrustedForwarder(userAccount1, {
      from: userAccount2,
    }).should.be.rejected;
  });
  it("should set tresury address", async () => {
    let tx = await treeAuctionInstance.setTreasuryAddress(accounts[4], {
      from: deployerAccount,
    });
    await treeAuctionInstance.setTreasuryAddress(userAccount1, {
      from: userAccount2,
    }).should.be.rejected;
  });
  it("deploys successfully", async () => {
    const address = treeAuctionInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("auction call by admin", async () => {
    let tx = await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 60 * 60, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    //only admin can call this method so it should be rejected
    await treeAuctionInstance.createAuction(
      2,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 60 * 60, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: userAccount1 }
    ).should.be.rejected;
  });
  it("check auction data insert conrrectly", async () => {
    let treeId = 1;
    let initialValue = web3.utils.toWei("1");
    let bidInterval = web3.utils.toWei("0.1");
    let start = parseInt(new Date().getTime() / 1000);
    let end = parseInt(new Date().getTime() / 1000) + 60 * 60;
    let tx = await treeAuctionInstance.createAuction(
      treeId,
      start,
      end,
      initialValue,
      bidInterval,
      { from: deployerAccount }
    );
    let result = await treeAuctionInstance.auctions.call(1);

    assert.equal(result.treeId.toNumber(), 1);
    assert.equal(Number(result.highestBid.toString()), initialValue);
    assert.equal(Number(result.bidInterval.toString()), bidInterval);
    assert.equal(Number(result.startDate.toString()), start);
    assert.equal(Number(result.endDate.toString()), end);
    assert.equal(web3.utils.hexToUtf8(result.status), "started");
  });
  it("auction have valid tree status", async () => {
    //TODO: aliad010 when tree status done check here
  });
  it("bid auction", async () => {
    await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 60 * 60, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    const resultBefore = await treeAuctionInstance.auctions.call(1);
    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    });
    const resultAfter = await treeAuctionInstance.auctions.call(1);
    assert.equal(
      Number(resultAfter.highestBid.toString()) -
        Number(resultBefore.highestBid.toString()),
      web3.utils.toWei("0.15")
    );
  });
  it("must offer suitable value for auction", async () => {
    await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 60 * 60, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    });

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("0.01"),
    }).should.be.rejected;
  });

  it("should increase end time of auction", async () => {
    let tx = await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 500, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    let resultBefore = await treeAuctionInstance.auctions.call(1);

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    });

    let resultAfterChangeTime = await treeAuctionInstance.auctions.call(1);

    assert.equal(
      resultAfterChangeTime.endDate.toNumber() -
        resultBefore.endDate.toNumber(),
      3 //TODO: must change to real value/ beascuse ceck this
    );
  });
  it("bid before start of aution", async () => {
    await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000) + 60, //start time
      parseInt(new Date().getTime() / 1000) + 100, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    }).should.be.rejected;
  });
  it("bid after end of auction", async () => {
    let tx = await treeAuctionInstance.createAuction(
      1,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 4, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    });
    console.log("waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000)); //wait till auction end time reach

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    }).should.be.rejected;
  });

  it("should change highest bid event call", async () => {
    let treeId = 1;
    await treeAuctionInstance.createAuction(
      treeId,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 500, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    let tx = await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
      from: userAccount1,
    });

    truffleAssert.eventEmitted(tx, "HighestBidIncreased", (ev) => {
      return (
        Number(ev.auctionId.toString()) == 1 &&
        ev.bidder == userAccount1 &&
        Number(ev.amount.toString()) == web3.utils.toWei("1.15") &&
        Number(ev.treeId.toString()) == treeId
      );
    });
  });
  it("should change end time event call", async () => {
    let treeId = 1;
    let end = parseInt(new Date().getTime() / 1000) + 500;
    await treeAuctionInstance.createAuction(
      treeId,
      parseInt(new Date().getTime() / 1000), //start time
      end,
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    let tx = await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
      from: userAccount1,
    });

    truffleAssert.eventEmitted(tx, "AuctionEndTimeIncreased", (ev) => {
      return (
        Number(ev.auctionId.toString()) == 1 &&
        ev.bidder == userAccount1 &&
        Number(ev.newAuctionEndTime.toString()) == end + 3
      );
    });
  });
  it("should end auction by admin", async () => {
    await treeAuctionInstance.setTreasuryAddress(ownerAccount, {
      from: deployerAccount,
    });
    const treeId = 1;
    const highestBid = web3.utils.toWei("1.15");
    await treeAuctionInstance.createAuction(
      treeId,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 3, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await treeAuctionInstance.auctionEnd(1, {
      from: deployerAccount,
    }).should.be.rejected; //end time dont reach
    await treeAuctionInstance.auctionEnd(1, {
      from: userAccount1,
    }).should.be.rejected; //admin must call this dont reach
    await treeAuctionInstance.bid(1, {
      from: userAccount1,
      value: highestBid,
    });
    console.log("waiting 10 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000)); //wait till auction end time reach
    let successEnd = await treeAuctionInstance.auctionEnd(1, {
      from: deployerAccount,
    });
    truffleAssert.eventEmitted(successEnd, "AuctionEnded", (ev) => {
      return (
        Number(ev.auctionId.toString()) == 1 &&
        Number(ev.treeId.toString()) == treeId &&
        ev.winner == userAccount1 &&
        Number(ev.amount.toString()) == highestBid
      );
    });

    // await treeAuctionInstance.auctionEnd(1, { from: deployerAccount }).should.be
    //   .rejected;
    let tx2 = await treeAuctionInstance.createAuction(
      2,
      parseInt(new Date().getTime() / 1000), //start time
      parseInt(new Date().getTime() / 1000) + 3, //end time
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    console.log("waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000)); //wait till auction end time reach
    let endAuction2 = await treeAuctionInstance.auctionEnd(2, {
      from: deployerAccount,
    }).should.be.rejected; //no bidder
  });

  it("should automatic withdraw successfully", async () => {
    let now = parseInt(new Date().getTime() / 1000);
    let auctionId = 1;

    //create auction
    await treeAuctionInstance.createAuction(
      0,
      now,
      now + 120,
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount1,
      value: web3.utils.toWei("1.5", "Ether"),
    });

    //check contract balance
    assert.equal(
      await web3.eth.getBalance(treeAuctionInstance.address),
      web3.utils.toWei("1.5", "Ether"),
      "1.Contract balance is not true"
    );

    let refer1AccountBalanceAfterBid = await web3.eth.getBalance(userAccount1);

    //userAccount2 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount2,
      value: web3.utils.toWei("1.5", "Ether"),
    }).should.be.rejected;

    await treeAuctionInstance.bid(auctionId, {
      from: userAccount2,
      value: web3.utils.toWei("2", "Ether"),
    });

    //check contract balance
    assert.equal(
      await web3.eth.getBalance(treeAuctionInstance.address),
      web3.utils.toWei("2", "Ether"),
      "2.Contract balance is not true"
    );

    //check userAccount1 refunded
    assert.equal(
      await web3.eth.getBalance(userAccount1),
      Number(refer1AccountBalanceAfterBid) +
        Number(web3.utils.toWei("1.5", "Ether")),
      "Redirect automatic withdraw is not true"
    );
  });

  it("Should contract balance is true", async () => {
    let now = parseInt(new Date().getTime() / 1000);
    let auctionId = 1;

    await treeAuctionInstance.createAuction(
      0,
      now,
      now + 120,
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount1,
      value: web3.utils.toWei("1.5", "Ether"),
    });

    //check contract balance
    assert.equal(
      await web3.eth.getBalance(treeAuctionInstance.address),
      web3.utils.toWei("1.5", "Ether"),
      "1.Contract balance is not true"
    );

    //userAccount2 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount2,
      value: web3.utils.toWei("2", "Ether"),
    });

    //check contract balance
    assert.equal(
      await web3.eth.getBalance(treeAuctionInstance.address),
      web3.utils.toWei("2", "Ether"),
      "2.Contract balance is not true"
    );

    //userAccount3 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount3,
      value: web3.utils.toWei("4", "Ether"),
    });

    //check contract balance
    assert.equal(
      await web3.eth.getBalance(treeAuctionInstance.address),
      web3.utils.toWei("4", "Ether"),
      "3.Contract balance is not true"
    );
  });
});
