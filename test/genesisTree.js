const AccessRestriction = artifacts.require("AccessRestriction");
const GenesisTree = artifacts.require("GenesisTree.sol");
const GBFactory = artifacts.require("GBFactory.sol");
const Tree = artifacts.require("Tree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const {
  TimeEnumes,
  CommonErrorMsg,
  GenesisTreeErrorMsg,
  TreeAuctionErrorMsg,
} = require("./enumes");

contract("GenesisTree", (accounts) => {
  let genesisTreeInstance;
  let treeTokenInstance;
  let gbInstance;
  let arInstance;
  let startTime;
  let endTime;

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

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const ipfsHash = "some ipfs hash here";
  const coordinates = [
    { lat: 25.774, lng: -80.19 },
    { lat: 18.466, lng: -66.118 },
    { lat: 32.321, lng: -64.757 },
    { lat: 25.774, lng: -80.19 },
  ];
  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
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
  });

  afterEach(async () => {});

  // it("deploys successfully", async () => {
  //   const address = genesisTreeInstance.address;
  //   assert.notEqual(address, 0x0);
  //   assert.notEqual(address, "");
  //   assert.notEqual(address, null);
  //   assert.notEqual(address, undefined);
  // });
  // it("set gb factory address", async () => {
  //   let tx = await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance
  //     .setGBFactoryAddress(gbInstance.address, { from: userAccount1 })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  // });
  // it("set tree token address", async () => {
  //   let tx = await genesisTreeInstance.setTreeTokenAddress(
  //     treeTokenInstance.address,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance
  //     .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  // });
  // it("add tree succussfuly", async () => {
  //   let tx = genesisTreeInstance.addTree(1, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   let tx2 = genesisTreeInstance.addTree(2, ipfsHash, {
  //     from: deployerAccount,
  //   });
  // });
  // it("add tree successfuly and check data to insert correct", async () => {
  //   let treeId1 = 1;
  //   let treeId2 = 2;
  //   let tx1 = genesisTreeInstance.addTree(treeId1, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   let result1 = await genesisTreeInstance.genTrees.call(treeId1);

  //   assert.equal(
  //     Number(result1.treeStatus.toString()),
  //     1,
  //     "tree status is incorrect"
  //   );
  //   assert.equal(result1.planterId, 0x0, "invalid planter id in add tree");
  //   assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");
  //   assert.equal(result1.isExist, true, "tree existance problem");
  // });
  // it("fail to add tree", async () => {
  //   let treeId = 1;
  //   await genesisTreeInstance
  //     .addTree(treeId, ipfsHash, { from: userAccount1 })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  //   await genesisTreeInstance
  //     .addTree(treeId, "", { from: deployerAccount })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
  //   let tx = await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance
  //     .addTree(treeId, ipfsHash, { from: deployerAccount })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.DUPLICATE_TREE);
  // });
  // it("assign tree to planter succussfuly", async () => {
  //   let treeId = 1;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

  //   let result = await gbInstance.gbToPlanters.call(1, 0);
  //   console.log("result", result);
  //   //do not asign to any planter
  //   let asign1 = await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     1,
  //     zeroAddress,
  //     1,
  //     { from: deployerAccount }
  //   );
  //   //asign to planert
  //   let asign2 = await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     1,
  //     userAccount2,
  //     1,
  //     { from: deployerAccount }
  //   );
  // });
  // it("check data to be correct after asigning tree to planter", async () => {
  //   let treeId = 1;
  //   let gbId = 1; //beacuse index zero is WORLD gb
  //   let gbType = 1;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

  //   //do not asign to any planter
  //   let asign1 = await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     zeroAddress,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   let result1 = await genesisTreeInstance.genTrees.call(treeId);

  //   assert.equal(result1.planterId, 0x0, "plnter id is incorrect");
  //   assert.equal(Number(result1.gbId.toString()), gbId, "incorrect gbId set");
  //   assert.equal(
  //     Number(result1.gbType.toString()),
  //     gbType,
  //     "invalid gbType set"
  //   );
  //   //asign to planert
  //   let asign2 = await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     userAccount2,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   let result2 = await genesisTreeInstance.genTrees.call(treeId);
  //   console.log("result2", result2);
  //   assert.equal(result2.planterId, userAccount2, "plnter id is incorrect");
  //   assert.equal(Number(result2.gbId.toString()), gbId, "incorrect gbId set");
  //   assert.equal(
  //     Number(result2.gbType.toString()),
  //     gbType,
  //     "invalid gbType set"
  //   );
  // });
  // it("should fail asign tree to planter", async () => {
  //   const treeId = 1;
  //   const invalidTreeId = 10;
  //   const gbId = 1; //beacuse index zero is WORLD gb
  //   const invalidGbId = 10;
  //   const gbType = 1;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

  //   let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance
  //     .asignTreeToPlanter(treeId, gbId, zeroAddress, gbType, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  //   await genesisTreeInstance
  //     .asignTreeToPlanter(invalidTreeId, gbId, zeroAddress, gbType, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
  //   await genesisTreeInstance
  //     .asignTreeToPlanter(treeId, invalidGbId, zeroAddress, gbType, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_GB);
  //   await genesisTreeInstance
  //     .asignTreeToPlanter(treeId, gbId, userAccount1, gbType, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
  //   await genesisTreeInstance
  //     .asignTreeToPlanter(treeId, gbId, userAccount3, gbType, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
  // });
  // it("should plant tree successfuly when have planter", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     userAccount2,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance.plantTree(
  //     treeId,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     { from: userAccount2 }
  //   );
  // });
  // it("should plant tree successfully when tree don't have planter", async () => {
  //   const treeId = 1;
  //   const treeId2 = 2;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount3, deployerAccount);
  //   await Common.addGB(
  //     gbInstance,
  //     userAccount1,
  //     [userAccount2, userAccount3],
  //     "gb1"
  //   );
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     zeroAddress,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance.plantTree(
  //     treeId,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     { from: userAccount1 }
  //   );
  //   await genesisTreeInstance.addTree(treeId2, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId2,
  //     gbId,
  //     zeroAddress,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance.plantTree(
  //     treeId2,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     { from: userAccount2 }
  //   );
  // });
  // it("check data to be correct after plant tree with planter", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     userAccount2,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance.plantTree(
  //     treeId,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     { from: userAccount2 }
  //   );
  //   let genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
  //   assert.equal(
  //     Number(genesisTreeResult.birthDate.toString()),
  //     birthDate,
  //     "birthDate set inccorectly"
  //   );
  //   assert.equal(
  //     Number(genesisTreeResult.countryCode.toString()),
  //     countryCode,
  //     "country code set inccorectly"
  //   );
  //   assert.equal(
  //     genesisTreeResult.planterId,
  //     userAccount2,
  //     "plnter id is incorrect"
  //   );
  //   assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");
  //   assert.equal(genesisTreeResult.isExist, true, "tree existance problem");
  //   assert.equal(
  //     Number(genesisTreeResult.gbId.toString()),
  //     gbId,
  //     "incorrect gbId set"
  //   );
  //   assert.equal(
  //     Number(genesisTreeResult.gbType.toString()),
  //     gbType,
  //     "invalid gbType set"
  //   );

  //   let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);
  //   let now = await Common.timeInitial(TimeEnumes.seconds, 0);

  //   assert.equal(
  //     updateGenResult.updateSpecs,
  //     ipfsHash,
  //     "ipfs hash set inccorect"
  //   );
  //   assert.equal(
  //     Number(updateGenResult.updateStatus.toString()),
  //     1,
  //     "invlid updateGen update status"
  //   );
  //   assert.equal(
  //     Number(updateGenResult.updateDate.toString()),
  //     Number(now.toString()),
  //     "invlid time"
  //   );
  // });
  // it("check data to be correct after plant tree with no planter", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     zeroAddress,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   let genTreeResult1 = await genesisTreeInstance.genTrees.call(treeId);
  //   assert.equal(
  //     genTreeResult1.planterId,
  //     0x0,
  //     "invalid planter id in add tree"
  //   );
  //   assert.equal(genTreeResult1.treeSpecs, ipfsHash, "incorrect ipfs hash");
  //   assert.equal(genTreeResult1.isExist, true, "tree existance problem");
  //   await genesisTreeInstance.plantTree(
  //     treeId,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     { from: userAccount2 }
  //   );
  //   let genTreeResult2 = await genesisTreeInstance.genTrees.call(treeId);
  //   assert.equal(
  //     Number(genTreeResult2.birthDate.toString()),
  //     birthDate,
  //     "birthDate set inccorectly"
  //   );
  //   assert.equal(
  //     Number(genTreeResult2.countryCode.toString()),
  //     countryCode,
  //     "country code set inccorectly"
  //   );
  //   assert.equal(
  //     genTreeResult2.planterId,
  //     userAccount2,
  //     "plnter id is incorrect"
  //   );
  //   assert.equal(genTreeResult2.treeSpecs, ipfsHash, "incorrect ipfs hash");
  //   assert.equal(genTreeResult2.isExist, true, "tree existance problem");
  //   assert.equal(
  //     Number(genTreeResult2.gbId.toString()),
  //     gbId,
  //     "incorrect gbId set"
  //   );
  //   assert.equal(
  //     Number(genTreeResult2.gbType.toString()),
  //     gbType,
  //     "invalid gbType set"
  //   );
  // });
  // it("should fail plant tree with planter", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount3, deployerAccount);
  //   await Common.addGB(
  //     gbInstance,
  //     userAccount1,
  //     [userAccount2, userAccount3],
  //     "gb1"
  //   );
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     userAccount2,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance
  //     .plantTree(treeId, ipfsHash, birthDate, countryCode, {
  //       from: userAccount3,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_WITH_PLANTER);
  //   await genesisTreeInstance
  //     .plantTree(treeId, "", birthDate, countryCode, { from: userAccount2 })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
  // });
  // it("should fail plant tree with no planter", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount3, deployerAccount);
  //   await Common.addGB(
  //     gbInstance,
  //     userAccount1,
  //     [userAccount2, userAccount3],
  //     "gb1"
  //   );
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.asignTreeToPlanter(
  //     treeId,
  //     gbId,
  //     zeroAddress,
  //     gbType,
  //     { from: deployerAccount }
  //   );
  //   await genesisTreeInstance
  //     .plantTree(treeId, ipfsHash, birthDate, countryCode, {
  //       from: userAccount4,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);
  //   await genesisTreeInstance
  //     .plantTree(treeId, ipfsHash, birthDate, countryCode, {
  //       from: deployerAccount,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);

  //   await genesisTreeInstance
  //     .plantTree(treeId, "", birthDate, countryCode, { from: userAccount2 })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
  // });
  it("should verify plant seccussfully", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const treeId3 = 3;
    const gbId = 1;
    const gbType = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3, userAccount4],
      "gb1"
    );
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount2,
      gbType,
      { from: deployerAccount }
    );

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance.verifyPlant(treeId, true, { from: userAccount1 });
    await genesisTreeInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId2,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );
    await genesisTreeInstance.verifyPlant(treeId2, false, {
      from: deployerAccount,
    });
    await genesisTreeInstance.addTree(treeId3, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId3,
      gbId,
      userAccount4,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId3,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
    await genesisTreeInstance.verifyPlant(treeId3, true, {
      from: userAccount2,
    });
  });
  it("check data to be correct after reject plant", async () => {
    const treeId = 1;
    const gbId = 1;
    const gbType = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3, userAccount4],
      "gb1"
    );
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount2,
      gbType,
      { from: deployerAccount }
    );

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    let genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
    assert.equal(
      Number(genesisTreeResult.birthDate.toString()),
      birthDate,
      "birthDate set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResult.countryCode.toString()),
      countryCode,
      "country code set inccorectly"
    );
    assert.equal(
      genesisTreeResult.planterId,
      userAccount2,
      "plnter id is incorrect"
    );
    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");
    assert.equal(genesisTreeResult.isExist, true, "tree existance problem");
    assert.equal(
      Number(genesisTreeResult.gbId.toString()),
      gbId,
      "incorrect gbId set"
    );
    assert.equal(
      Number(genesisTreeResult.gbType.toString()),
      gbType,
      "invalid gbType set"
    );
    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: userAccount1,
    });
  });
  it("check data to be correct after verify plant", async () => {
    const treeId = 1;
    const gbId = 1;
    const gbType = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3, userAccount4],
      "gb1"
    );
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount2,
      gbType,
      { from: deployerAccount }
    );

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance.verifyPlant(treeId, true, { from: userAccount1 });
  });

  ///////////////////////////////////////////////////////// mehdi //////////////////////////////
});
