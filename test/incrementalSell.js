const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const GenesisTree = artifacts.require("GenesisTree.sol");
const Tree = artifacts.require("Tree.sol");
const GBFactory = artifacts.require("GBFactory.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const {
  TimeEnumes,
  CommonErrorMsg,
  IncrementalSellErrorMsg,
  GenesisTreeErrorMsg,
} = require("./enumes");

contract("IncrementalSell", (accounts) => {
  let iSellInstance;
  let arInstance;
  let genesisTreeInstance;
  let startTime;
  let endTime;
  let gbInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const userAccount1 = accounts[2];
  const userAccount2 = accounts[3];
  const userAccount3 = accounts[4];
  const userAccount4 = accounts[5];
  const userAccount5 = accounts[6];
  const userAccount6 = accounts[7];
  const userAccount7 = accounts[8];
  const treasuryAddress = accounts[9];

  const ipfsHash = "some ipfs hash here";

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });

    iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    genesisTreeInstance = await deployProxy(GenesisTree, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    gbInstance = await deployProxy(GBFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await iSellInstance.setGenesisTreeAddress(
      genesisTreeInstance.address,
      {
        from: deployerAccount,
      }
    );

    await iSellInstance.setTreasuryAddress(
      treasuryAddress,
      {
        from: deployerAccount,
      }
    );


    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await Common.addIncrementalSellRole(
      arInstance,
      iSellInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => { });
  /** */
  it("deploys successfully", async () => {
    const address = iSellInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("should set tresury address with admin access or fail otherwise", async () => {
    let tx = await iSellInstance.setTreasuryAddress(accounts[4], {
      from: deployerAccount,
    });
    await iSellInstance
      .setTreasuryAddress(userAccount1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
  });

  it("should set genesis tree address with admin access or fail otherwise", async () => {
    let tx = await iSellInstance.setGenesisTreeAddress(
      genesisTreeInstance.address,
      {
        from: deployerAccount,
      }
    );
    await iSellInstance
      .setTreasuryAddress(userAccount1, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
  });

  it("incrementalSell call by admin access or fail otherwise", async () => {
    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(2);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    //only admin can call this method so it should be rejected
    await iSellInstance
      .addOffer(
        initialPrice,
        incrementalPrice,
        fromTreeId,
        increasePriceCount,
        maxCount,
        { from: userAccount1 }
      )
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });

  it("should fail incrementalSell with duplicate tree id ( one of trees is on other provide. ) ", async () => {

    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(2);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    await iSellInstance.addOffer(
      initialPrice,
      incrementalPrice,
      fromTreeId,
      increasePriceCount,
      maxCount,
      { from: deployerAccount }
    )
      .should.be.rejectedWith(IncrementalSellErrorMsg.TREE_STATUS);

  });

  it("check incrementalSell offer data inserted correctly", async () => {

    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(2);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    let result = await iSellInstance.offers.call(0);

    assert.equal(Number(result.initialPrice.toString()), initialPrice);
    assert.equal(Number(result.incrementalPrice.toString()), incrementalPrice);
    assert.equal(Number(result.fromTreeId.toString()), fromTreeId);
    assert.equal(Number(result.increasePriceCount.toString()), increasePriceCount);
    assert.equal(Number(result.maxCount.toString()), maxCount);
    assert.equal(Number(result.latestTreeSold.toString()), fromTreeId);
    assert.equal(Number(result.status.toString()), 0);

  });


  it("buy from incremental sell and check for latestsoldid and IncrementalTreeSold event", async () => {
    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(2);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    const value = Number(initialPrice) + Number(web3.utils.toWei("0.0001"));
    let tx = await iSellInstance.buy(0,
      { from: userAccount1, value: value },
    );

    const latestTreeSold = fromTreeId + 1;
    truffleAssert.eventEmitted(tx, "IncrementalTreeSold", (ev) => {
      return (
        Number(ev.offerId.toString()) == 0 &&
        Number(ev.currentPrice.toString()) == initialPrice &&
        Number(ev.treeId.toString()) == latestTreeSold &&
        Number(ev.amount.toString()) == value &&
        ev.buyer.toString() == userAccount1
      );
    });

    let resultAfter = await iSellInstance.offers.call(0);

    assert.equal(Number(resultAfter.latestTreeSold.toString()), latestTreeSold);

  });


  it("must send enough value for auction or rejected otherwise", async () => {
    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(2);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    const value = Number(0) + Number(web3.utils.toWei("0.0001"));
    await iSellInstance.buy(0,
      { from: userAccount1, value: value },
    ).should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_AMOUNT);
  });


  it("buy before runing incremental sell must be failed", async () => {

    const value = Number(0) + Number(web3.utils.toWei("0.0001"));
    await iSellInstance.buy(0,
      { from: userAccount1, value: value },
    ).should.be.rejectedWith(IncrementalSellErrorMsg.OFFER_NOT_RUNNING);

  });


  it("get current price and buy 3 tree and must fuilfill event sent", async () => {

    const initialPrice = web3.utils.toWei("0.01");
    const incrementalPrice = web3.utils.toWei("0.001");
    const fromTreeId = Number(1);
    const increasePriceCount = Number(1);
    const maxCount = Number(3);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    let currentPrice1 = await iSellInstance.currentPrice.call(0);
    let value = Number(initialPrice);


    console.log(Number(currentPrice1.toString()), "first tree initial price");
    assert.equal(Number(currentPrice1.toString()), value);

    await iSellInstance.buy(0,
      { from: userAccount1, value: value },
    );

    let currentPrice2 = await iSellInstance.currentPrice.call(0);
    value = Number(initialPrice) + Number(incrementalPrice);

    console.log(Number(currentPrice2.toString()), "second tree initial price");
    assert.equal(Number(currentPrice2.toString()), value);

    await iSellInstance.buy(0,
      { from: userAccount2, value: value },
    );

    let currentPrice3 = await iSellInstance.currentPrice.call(0);
    value = Number(initialPrice) + Number(incrementalPrice) * 2;
    console.log(Number(currentPrice3.toString()), "third tree initial price");
    assert.equal(Number(currentPrice3.toString()), value);

    let tx = await iSellInstance.buy(0,
      { from: userAccount3, value: value },
    );

    truffleAssert.eventEmitted(tx, "OfferFulfilled", (ev) => {
      return (Number(ev.offerId.toString()) == 0);
    });

    let result = await iSellInstance.offers.call(0);
    assert.equal(Number(result.latestTreeSold.toString()), 4);
    assert.equal(Number(result.status.toString()), 2);

  });


  it("run with 0.015 and 0.0015 TreeID 10 − 20 Increase 3 per tree and get fulfill event", async () => {

    const initialPrice = web3.utils.toWei("0.015");
    const incrementalPrice = web3.utils.toWei("0.005");
    const fromTreeId = Number(9);
    const increasePriceCount = Number(3);
    const maxCount = Number(11);

    await Common.incrementalSellOfferAdd(genesisTreeInstance, iSellInstance, deployerAccount, initialPrice, incrementalPrice, fromTreeId, increasePriceCount, maxCount);

    let total = 0;
    let totalCumulativeGasUsed = 0;
    let treasuryAddressBalanceStart = await web3.eth.getBalance(treasuryAddress);
    let userAccount1BalanceStart = await web3.eth.getBalance(userAccount1);

    for (let index = 1; index <= maxCount; index++) {

      let currentPrice = await iSellInstance.currentPrice.call(0);
      let value = Number(currentPrice.toString());

      let tx = await iSellInstance.buy(0,
        { from: userAccount1, value: value },
      );

      totalCumulativeGasUsed = Number(totalCumulativeGasUsed) + Number(tx.receipt.cumulativeGasUsed.toString());
    }

    let IncrementalTreeSoldEventCount = 0;
    await iSellInstance.contract.getPastEvents("IncrementalTreeSold",
      {
        fromBlock: 0,
        toBlock: 'latest' // You can also specify 'latest'          
      })
      .then(events => {
        events.forEach((ev) => {
          console.log("<<IncrementalTreeSold>>");

          console.log(Number(ev.returnValues.treeId.toString()), ' TreeId');
          console.log(Number(web3.utils.fromWei(ev.returnValues.currentPrice.toString())), ' Price');
          total = Number(total) + Number(ev.returnValues.currentPrice.toString());
          IncrementalTreeSoldEventCount++;

        });
      })
      .catch((err) => console.error(err));
    assert.equal(Number(IncrementalTreeSoldEventCount), maxCount);


    let OfferFulfilledEventCount = 0;
    await iSellInstance.contract.getPastEvents("OfferFulfilled",
      {
        fromBlock: 0,
        toBlock: 'latest' // You can also specify 'latest'          
      })
      .then(events => {

        events.forEach((event) => {
          console.log("<<<<<<<<<<OfferFulfilled>>>>>>>");
          OfferFulfilledEventCount++;
        });
      })
      .catch((err) => console.error(err));
    assert.equal(Number(OfferFulfilledEventCount), 1);

    assert.equal(
      await web3.eth.getBalance(treasuryAddress),
      Number(treasuryAddressBalanceStart) + Number(total.toString()),
      "transfer to treasury not work true"
    );



    //@todo must fix and check why user balance not shows correct value
    // console.log(Number(userAccount1BalanceStart));
    // console.log(Number(total.toString()));
    // console.log(Number(totalCumulativeGasUsed.toString()));
    // assert.equal(
    //   await web3.eth.getBalance(userAccount1),
    //   Number(userAccount1BalanceStart) - Number(total.toString()) - Number(totalCumulativeGasUsed.toString()),
    //   "decrease from user account not works correctly"
    // );


    console.log(web3.utils.fromWei(total.toString()), "TOTAL ETH Cumulative");
    console.log(web3.utils.fromWei(totalCumulativeGasUsed.toString()), "TOTAL Cumulative Gas Used");

  });


});
