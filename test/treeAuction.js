const AccessRestriction = artifacts.require("AccessRestriction");
const TreeAuction = artifacts.require("TreeAuction");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const { TimeEnumes, CommonErrorMsg, TreeAuctionErrorMsg } = require("./enumes");

contract("TreeAuction", (accounts) => {
  let treeAuctionInstance;
  let arInstance;
  let startTime;
  let endTime;

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

  it("deploys successfully", async () => {
    const address = treeAuctionInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("should set tresury address with admin access or fail otherwise", async () => {
    let tx = await treeAuctionInstance.setTreasuryAddress(accounts[4], {
      from: deployerAccount,
    });
    await treeAuctionInstance.setTreasuryAddress(userAccount1, {
      from: userAccount2,
    }).should.be.rejected; //must be faild because ots not deployer account
  });
  it("auction call by admin access or fail otherwise", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    let tx = await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    //only admin can call this method so it should be rejected
    await treeAuctionInstance.createAuction(
      2,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: userAccount1 }
    ).should.be.rejected;
  });
  it("check auction data insert conrrectly", async () => {
    let treeId = 1;
    let initialValue = web3.utils.toWei("1");
    let bidInterval = web3.utils.toWei("0.1");
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    let tx = await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime.toString()),
      Number(endTime.toString()),
      initialValue,
      bidInterval,
      { from: deployerAccount }
    );
    let result = await treeAuctionInstance.auctions.call(1);

    assert.equal(result.treeId.toNumber(), 1);
    assert.equal(Number(result.highestBid.toString()), initialValue);
    assert.equal(Number(result.bidInterval.toString()), bidInterval);
    assert.equal(
      Number(result.startDate.toString()),
      Number(startTime.toString())
    );
    assert.equal(Number(result.endDate.toString()), Number(endTime.toString()));
    assert.equal(web3.utils.hexToUtf8(result.status), "started");
  });
  it("auction have valid tree status", async () => {
    //TODO: aliad010 when tree status done check here
  });
  it("bid auction and check highest bid set change correctly", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
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
  it("must offer suitable value for auction or rejected otherwise", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
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

  it("should increase end time of auction beacuse bid less than 600 secconds left to end of auction", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 300);

    let tx = await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
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
      600
    );
  });
  it("bid before start of aution must be failed", async () => {
    startTime = await Common.timeInitial(TimeEnumes.minutes, 5);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    }).should.be.rejected;
  });
  it("bid after end of auction must be failed", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    let tx = await treeAuctionInstance.createAuction(
      1,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.15"),
    });
    await Common.travelTime(TimeEnumes.hours, 2);
    await treeAuctionInstance.bid(1, {
      value: web3.utils.toWei("1.5"),
    }).should.be.rejected;
  });

  it("should emit highest bid event", async () => {
    let treeId = 1;
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);
    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime.toString()),
      Number(endTime.toString()),
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

  it("should emit end time event", async () => {
    let treeId = 1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);

    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime.toString()),
      Number(endTime.toString()),
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
        Number(ev.newAuctionEndTime.toString()) ==
          Number(endTime.toString()) + 600
      );
    });
  });
  it("should end auction and fail in invalid situations", async () => {
    await treeAuctionInstance.setTreasuryAddress(ownerAccount, {
      from: deployerAccount,
    });
    const treeId = 1;
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);
    const highestBid = web3.utils.toWei("1.15");
    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await treeAuctionInstance.endAuction(1, {
      from: deployerAccount,
    }).should.be.rejected; //end time dont reach and must be rejected
    await treeAuctionInstance.endAuction(1, {
      from: userAccount1,
    }).should.be.rejected; //admin must call this method and must be rejected
    await treeAuctionInstance.bid(1, {
      from: userAccount1,
      value: highestBid,
    });
    await Common.travelTime(TimeEnumes.seconds, 670);
    let successEnd = await treeAuctionInstance.endAuction(1, {
      from: deployerAccount,
    }); //succesfully end the auction

    let failEnd = await treeAuctionInstance.endAuction(1, {
      from: deployerAccount,
    }).should.be.rejected; //auction already ended and must be rejected
  });
  it("check emit end auction event", async () => {
    await treeAuctionInstance.setTreasuryAddress(ownerAccount, {
      from: deployerAccount,
    });
    const treeId = 1;
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);
    const highestBid = web3.utils.toWei("1.15");
    await treeAuctionInstance.createAuction(
      treeId,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );
    await treeAuctionInstance.bid(1, {
      from: userAccount1,
      value: highestBid,
    });
    await Common.travelTime(TimeEnumes.seconds, 670);
    let successEnd = await treeAuctionInstance.endAuction(1, {
      from: deployerAccount,
    }); //succesfully end the auction

    truffleAssert.eventEmitted(successEnd, "AuctionEnded", (ev) => {
      return (
        Number(ev.auctionId.toString()) == 1 &&
        Number(ev.treeId.toString()) == treeId &&
        ev.winner == userAccount1 &&
        Number(ev.amount.toString()) == highestBid
      );
    });
  });
  it("end auction when there is no bidder must fail", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 60);
    let tx = await treeAuctionInstance.createAuction(
      2,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1"),
      web3.utils.toWei("0.1"),
      { from: deployerAccount }
    );

    await Common.travelTime(TimeEnumes.seconds, 70);
    let endAuction2 = await treeAuctionInstance.endAuction(2, {
      from: deployerAccount,
    }).should.be.rejected; //no bidder
  });

  it("Should automatic withdraw successfully", async () => {
    let auctionId = 1;
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 120);

    //create auction
    await treeAuctionInstance.createAuction(
      0,
      Number(startTime.toString()),
      Number(endTime.toString()),
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
    await treeAuctionInstance
      .bid(auctionId, {
        from: userAccount2,
        value: web3.utils.toWei("1.5", "Ether"),
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.bidMsgValueCheck);

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

  it("Check contract balance when user call bid function and Balance should be ok", async () => {
    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.seconds, 120);

    let auctionId = 1;

    await treeAuctionInstance.createAuction(
      0,
      Number(startTime.toString()),
      Number(endTime.toString()),
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

  it("Should manualWithdraw is reject because user balance is not enough", async () => {
    await treeAuctionInstance
      .manualWithdraw({
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeAuctionErrorMsg.manualWithdrawUserBalance);
  });

  it("Should manualWithdraw function is reject because pause is true", async () => {
    await arInstance.pause({
      from: deployerAccount,
    });
    await treeAuctionInstance
      .manualWithdraw({
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should bid function is reject because function is pause", async () => {
    let auctionId = 1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeAuctionInstance.createAuction(
      auctionId,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    //userAccount1 take part in auction
    await treeAuctionInstance.bid(auctionId, {
      from: userAccount1,
      value: web3.utils.toWei("1.5", "Ether"),
    });

    await arInstance.pause({
      from: deployerAccount,
    });

    //userAccount2 take part in auction but function is pause
    await treeAuctionInstance
      .bid(auctionId, {
        from: userAccount2,
        value: web3.utils.toWei("2", "Ether"),
      })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should endAuction function is reject because function is pause", async () => {
    let auctionId = 1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await treeAuctionInstance.createAuction(
      auctionId,
      Number(startTime.toString()),
      Number(endTime.toString()),
      web3.utils.toWei("1", "Ether"),
      web3.utils.toWei(".5", "Ether"),
      { from: deployerAccount }
    );

    await treeAuctionInstance.bid(auctionId, {
      from: userAccount2,
      value: web3.utils.toWei("2", "Ether"),
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
    let auctionId = 1;

    startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    await arInstance.pause({
      from: deployerAccount,
    });

    await treeAuctionInstance
      .createAuction(
        auctionId,
        Number(startTime.toString()),
        Number(endTime.toString()),
        web3.utils.toWei("1", "Ether"),
        web3.utils.toWei(".5", "Ether"),
        { from: deployerAccount }
      )
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });
});
