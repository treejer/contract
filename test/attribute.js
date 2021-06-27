const AccessRestriction = artifacts.require("AccessRestriction.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const GenesisTree = artifacts.require("GenesisTree.sol");

const RandomNumberConsumer = artifacts.require("RandomNumberConsumer.sol");
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock');
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken');


const Tree = artifacts.require("Tree.sol");
const GBFactory = artifacts.require("GBFactory.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {randomBytes} =   require('crypto');


const {
  TimeEnumes,
  CommonErrorMsg,
  AttributeErrorMsg,
  GenesisTreeErrorMsg,
} = require("./enumes");

contract("TreeAttribute", (accounts) => {
  let attributeInstance;
  let arInstance;
  let genesisTreeInstance;
  let startTime;
  let endTime;
  let gbInstance;

  let randomNumberConsumer, vrfCoordinatorMock, link, keyhash, fee;


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

    attributeInstance = await deployProxy(TreeAttribute, [arInstance.address], {
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

    genesisTreeInstance = await deployProxy(GenesisTree, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });


    // randomNumberConsumer = await deployProxy(RandomNumberConsumer, {
    //   initializer: "initialize",
    //   from: deployerAccount,
    //   unsafeAllowCustomTypes: true,
    // });

    // randomNumberConsumer = await RandomNumberConsumer.new({from: deployerAccount});


    // await attributeInstance.setGenesisTreeAddress(
    //   genesisTreeInstance.address,
    //   {
    //     from: deployerAccount,
    //   }
    // );

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = '1000000000000000000'
    link = await LinkToken.new({ from: deployerAccount })
    vrfCoordinatorMock = await VRFCoordinatorMock.new(link.address, { from: deployerAccount })
    randomNumberConsumer = await RandomNumberConsumer.new(link.address, keyhash, vrfCoordinatorMock.address, fee, { from: deployerAccount })

    await attributeInstance.setRandomNumberConsumerAddress(randomNumberConsumer.address, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(
      arInstance,
      attributeInstance.address,
      deployerAccount
    );

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => { });

  it("deploys successfully", async () => {
    const address = attributeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it('returns a random number with link', async () => {
    await link.transfer(randomNumberConsumer.address, web3.utils.toWei('100', 'ether'), { from: deployerAccount })
    // let transaction = await randomNumberConsumer.getRandomNumber({ from: deployerAccount })
    // console.log(tx.receipt.rawLogs)

    // assert.exists(transaction.receipt.rawLogs)
    // // This is the event that is emitted
    // let randNumberResultTx = await randomNumberConsumer.randomResult({ from: deployerAccount })
    // let randNumberResultTx = await randomNumberConsumer.randomResult({ from: deployerAccount })
    let getRandomNumberTx = await randomNumberConsumer.getRandomNumber({ from: deployerAccount })


    console.log(getRandomNumberTx);
    console.log(getRandomNumberTx.receipt.rawLogs);

    let requestId = getRandomNumberTx.receipt.rawLogs[3].topics[0]
    // // let requestId = await randomNumberConsumer.lastRequestId({ from: deployerAccount })
    console.log(requestId, "requestId");

    const treeId = 0;

    const value = randomBytes(32); // 32 bytes = 256 bits

    console.log(value, "value");

    // Value as native bigint
    const bigInt = BigInt(`0x${value.toString('hex')}`);
    const bigIntn = Number(bigInt);

    console.log(bigInt, "bigInt");
    console.log(bigIntn, "bigIntn");

    // Value as BN.js number
// const bn = new BN(value.toString('hex'), 16);

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    // await vrfCoordinatorMock.callBackWithRandomness(requestId, value, randomNumberConsumer.address, { from: deployerAccount })

    await vrfCoordinatorMock.callBackWithRandomness(requestId, value, randomNumberConsumer.address, { from: deployerAccount })
    let randomNumber = await randomNumberConsumer.randomResult({ from: deployerAccount })

    console.log(randomNumber, "randomNumber");
    console.log(Number(randomNumber), "randomNumber");



    let tx = await attributeInstance.generateUniqueAttribute(treeId, {
      from: deployerAccount,
    });

    let requestIdG = await attributeInstance.requestIdG.call();
    let randNumG = await attributeInstance.randNumG.call();
    // let expandedNum = await randomNumberConsumer.getExpandedResult.call(requestId, 10);
    // let expandedNum = await randomNumberConsumer.expand.call(randNumG, 8, 0, 8);
    // let expandedNum1 = await randomNumberConsumer.expand.call(randNumG, 8, 0, 8);


    let a = await attributeInstance.a.call();
    let b = await attributeInstance.b.call();
    let c = await attributeInstance.c.call();


    console.log(tx.receipt.rawLogs)
    console.log(tx)
    console.log(requestIdG, "requestIdG")
    console.log(Number(requestIdG), "requestIdG")
    console.log(Number(randNumG), "randNumG")

    console.log(Number(a), "a")
    console.log(Number(b), "b")
    console.log(Number(c), "c")
    console.log(a, "a")
    console.log(b, "b")
    console.log(c, "c")
    // console.log(expandedNum, "expandedNum")
    // console.log(expandedNum1, "expandedNum")



    // for (let index = 0; index < 10; index++) {
    //   console.log(Number(expandedNum[index]).toString());
      
    // }


    // for (let index = 0; index < 10; index++) {
    //   console.log(Number(expandedNum1[index]).toString());
      
    // }

    a = randNumG ^ 7;
    randNumG = randNumG/8;
    // trunkHeightRand     randdValue ^ 7 =>a  randValue/=8

    // console.log(Number(a));

  })

  // it("should set tresury address with admin access or fail otherwise", async () => {
  //   let tx = await attributeInstance.setTreasuryAddress(accounts[4], {
  //     from: deployerAccount,
  //   });
  //   await attributeInstance
  //     .setTreasuryAddress(userAccount1, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
  // });




});
