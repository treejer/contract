const AccessRestriction = artifacts.require("AccessRestriction");
const GenesisTree = artifacts.require("GenesisTree.sol");
const GBFactory = artifacts.require("GBFactory.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");
const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const {
  TimeEnumes,
  CommonErrorMsg,
  GenesisTreeErrorMsg,
  TreeAuctionErrorMsg,
} = require("./enumes");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

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
  const updateIpfsHash1 = "some update ipfs hash here";
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

    treeAuctionInstance = await deployProxy(TreeAuction, [arInstance.address], {
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
  //************************************ deploy successfully ****************************************//
  it("deploys successfully", async () => {
    const address = genesisTreeInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  //************************************ gb factory address ****************************************//

  it("set gb factory address", async () => {
    let tx = await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    await genesisTreeInstance
      .setGBFactoryAddress(gbInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  //************************************ tree token address ****************************************//
  it("set tree token address", async () => {
    let tx = await genesisTreeInstance.setTreeTokenAddress(
      treeTokenInstance.address,
      { from: deployerAccount }
    );
    await genesisTreeInstance
      .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  //************************************ add tree ****************************************//

  it("add tree succussfuly", async () => {
    let tx = genesisTreeInstance.addTree(1, ipfsHash, {
      from: deployerAccount,
    });

    let tx2 = genesisTreeInstance.addTree(2, ipfsHash, {
      from: deployerAccount,
    });
  });
  it("add tree successfuly and check data to insert correct", async () => {
    let treeId1 = 1;
    let treeId2 = 2;
    let tx1 = genesisTreeInstance.addTree(treeId1, ipfsHash, {
      from: deployerAccount,
    });
    let result1 = await genesisTreeInstance.genTrees.call(treeId1);

    assert.equal(result1.planterId, 0x0, "invalid planter id in add tree");
    assert.equal(Number(result1.gbId.toString()), 0, "incorrect gbId");
    assert.equal(Number(result1.treeType.toString()), 0, "incorrect treeType");
    assert.equal(Number(result1.gbType.toString()), 0, "incorrect gbType");
    assert.equal(
      Number(result1.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(result1.isExist, true, "tree existance problem");
    assert.equal(
      Number(result1.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(result1.countryCode.toString()),
      0,
      "incorrect country code"
    );
    assert.equal(
      Number(result1.plantDate.toString()),
      0,
      "incorrect plant date"
    );
    assert.equal(
      Number(result1.birthDate.toString()),
      0,
      "incorrect birth date"
    );
    assert.equal(
      Number(result1.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");
  });
  it("fail to add tree", async () => {
    let treeId = 1;
    await genesisTreeInstance
      .addTree(treeId, ipfsHash, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await genesisTreeInstance
      .addTree(treeId, "", { from: deployerAccount })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
    let tx = await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance
      .addTree(treeId, ipfsHash, { from: deployerAccount })
      .should.be.rejectedWith(GenesisTreeErrorMsg.DUPLICATE_TREE);
  });
  //************************************ asign tree ****************************************//
  it("assign tree to planter succussfuly", async () => {
    let treeId = 1;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

    let result = await gbInstance.gbToPlanters.call(1, 0);
    console.log("result", result);
    //do not asign to any planter
    let asign1 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      1,
      zeroAddress,
      1,
      { from: deployerAccount }
    );
    //asign to planert
    let asign2 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      1,
      userAccount2,
      1,
      { from: deployerAccount }
    );
  });
  it("check data to be correct after asigning tree to planter", async () => {
    let treeId = 1;
    let gbId = 1; //beacuse index zero is WORLD gb
    let gbType = 1;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

    //do not asign to any planter
    let asign1 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    let result1 = await genesisTreeInstance.genTrees.call(treeId);
    //////////////////////////////////////////////////////////////////////////

    assert.equal(result1.planterId, 0x0, "invalid planter id in add tree");
    assert.equal(Number(result1.gbId.toString()), gbId, "incorrect gbId");
    assert.equal(Number(result1.treeType.toString()), 0, "incorrect treeType");
    assert.equal(Number(result1.gbType.toString()), gbType, "incorrect gbType");
    assert.equal(
      Number(result1.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(result1.isExist, true, "tree existance problem");
    assert.equal(
      Number(result1.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(result1.countryCode.toString()),
      0,
      "incorrect country code"
    );
    assert.equal(
      Number(result1.plantDate.toString()),
      0,
      "incorrect plant date"
    );
    assert.equal(
      Number(result1.birthDate.toString()),
      0,
      "incorrect birth date"
    );
    assert.equal(
      Number(result1.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ////////////////////////////////////////////////////

    //asign to planert
    let asign2 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount2,
      gbType,
      { from: deployerAccount }
    );
    let result2 = await genesisTreeInstance.genTrees.call(treeId);

    ///////////////////////////////////////////////////////////////////////////

    assert.equal(
      result2.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(Number(result2.gbId.toString()), gbId, "incorrect gbId");
    assert.equal(Number(result2.treeType.toString()), 0, "incorrect treeType");
    assert.equal(Number(result2.gbType.toString()), gbType, "incorrect gbType");
    assert.equal(
      Number(result2.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(result2.isExist, true, "tree existance problem");
    assert.equal(
      Number(result2.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(result2.countryCode.toString()),
      0,
      "incorrect country code"
    );
    assert.equal(
      Number(result2.plantDate.toString()),
      0,
      "incorrect plant date"
    );
    assert.equal(
      Number(result2.birthDate.toString()),
      0,
      "incorrect birth date"
    );
    assert.equal(
      Number(result2.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(result2.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ///////////////////////////////////////////////////////////////////////////
  });
  it("should fail asign tree to planter", async () => {
    const treeId = 1;
    const invalidTreeId = 10;
    const gbId = 1; //beacuse index zero is WORLD gb
    const invalidGbId = 10;
    const gbType = 1;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

    let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId, zeroAddress, gbType, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    await genesisTreeInstance
      .asignTreeToPlanter(invalidTreeId, gbId, zeroAddress, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, invalidGbId, zeroAddress, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_GB);
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId, userAccount1, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId, userAccount3, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
  });
  //************************************ plant tree ****************************************//
  it("should plant tree successfuly when have planter", async () => {
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
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
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
    let tx = await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );
    truffleAssert.eventEmitted(tx, "PlantTree", (ev) => {
      return (
        ev.planter == userAccount2 && Number(ev.treeId.toString()) == treeId
      );
    });
  });
  it("should plant tree successfully when tree don't have planter", async () => {
    const treeId = 1;
    const treeId2 = 2;
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
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3],
      "gb1"
    );
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    const tx1 = await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    truffleAssert.eventEmitted(tx1, "PlantTree", (ev) => {
      return (
        ev.planter == userAccount2 && Number(ev.treeId.toString()) == treeId
      );
    });

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
    const tx2 = await genesisTreeInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );
    truffleAssert.eventEmitted(tx2, "PlantTree", (ev) => {
      return (
        ev.planter == userAccount3 && Number(ev.treeId.toString()) == treeId2
      );
    });
  });
  it("check data to be correct after plant tree with planter", async () => {
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
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
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
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );
    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    let genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
    /////////////////////////////////////////////////////////////////////////////////////////////
    assert.equal(
      genesisTreeResult.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(
      Number(genesisTreeResult.gbId.toString()),
      gbId,
      "incorrect gbId"
    );
    assert.equal(
      Number(genesisTreeResult.treeType.toString()),
      0,
      "incorrect treeType"
    );
    assert.equal(
      Number(genesisTreeResult.gbType.toString()),
      gbType,
      "incorrect gbType"
    );
    assert.equal(
      Number(genesisTreeResult.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(genesisTreeResult.isExist, true, "tree existance problem");
    assert.equal(
      Number(genesisTreeResult.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(genesisTreeResult.countryCode.toString()),
      countryCode,
      "incorrect country code"
    );
    assert.equal(
      Number(genesisTreeResult.plantDate.toString()),
      Number(plantDate.toString()),
      "incorrect plant date"
    );
    assert.equal(
      Number(genesisTreeResult.birthDate.toString()),
      birthDate,
      "incorrect birth date"
    );
    assert.equal(
      Number(genesisTreeResult.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);
    let now = await Common.timeInitial(TimeEnumes.seconds, 0);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResult.updateStatus.toString()),
      1,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResult.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );
  });
  it("check data to be correct after plant tree with no planter", async () => {
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
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb1");
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    let genTreeResult1 = await genesisTreeInstance.genTrees.call(treeId);

    /////////////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      genTreeResult1.planterId,
      0x0,
      "invalid planter id in add tree"
    );
    assert.equal(
      Number(genTreeResult1.gbId.toString()),
      gbId,
      "incorrect gbId"
    );
    assert.equal(
      Number(genTreeResult1.treeType.toString()),
      0,
      "incorrect treeType"
    );
    assert.equal(
      Number(genTreeResult1.gbType.toString()),
      gbType,
      "incorrect gbType"
    );
    assert.equal(
      Number(genTreeResult1.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(genTreeResult1.isExist, true, "tree existance problem");
    assert.equal(
      Number(genTreeResult1.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(genTreeResult1.countryCode.toString()),
      0,
      "incorrect country code"
    );
    assert.equal(
      Number(genTreeResult1.plantDate.toString()),
      0,
      "incorrect plant date"
    );
    assert.equal(
      Number(genTreeResult1.birthDate.toString()),
      0,
      "incorrect birth date"
    );
    assert.equal(
      Number(genTreeResult1.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(genTreeResult1.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ///////////////////////////////////////////////////////////////////////////////////////////////

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );
    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    const now = await Common.timeInitial(TimeEnumes.seconds, 0);
    const genTreeResult2 = await genesisTreeInstance.genTrees.call(treeId);

    //////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      genTreeResult2.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(
      Number(genTreeResult2.gbId.toString()),
      gbId,
      "incorrect gbId"
    );
    assert.equal(
      Number(genTreeResult2.treeType.toString()),
      0,
      "incorrect treeType"
    );
    assert.equal(
      Number(genTreeResult2.gbType.toString()),
      gbType,
      "incorrect gbType"
    );
    assert.equal(
      Number(genTreeResult2.provideStatus.toString()),
      0,
      "incorrect provide status"
    );
    assert.equal(genTreeResult2.isExist, true, "tree existance problem");
    assert.equal(
      Number(genTreeResult2.treeStatus.toString()),
      1,
      "tree status is incorrect"
    );
    assert.equal(
      Number(genTreeResult2.countryCode.toString()),
      countryCode,
      "incorrect country code"
    );
    assert.equal(
      Number(genTreeResult2.plantDate.toString()),
      Number(plantDate.toString()),
      "incorrect plant date"
    );
    assert.equal(
      Number(genTreeResult2.birthDate.toString()),
      birthDate,
      "incorrect birth date"
    );
    assert.equal(
      Number(genTreeResult2.lastUpdate.toString()),
      0,
      "incorrect last update"
    );
    assert.equal(genTreeResult2.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ////////////////////////////////////////////////////////////////////////////////////
    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResult.updateStatus.toString()),
      1,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResult.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );
  });
  it("should fail plant tree with planter", async () => {
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
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3],
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
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_WITH_PLANTER);
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_WITH_PLANTER);

    await genesisTreeInstance
      .plantTree(treeId, "", birthDate, countryCode, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
  });
  it("should fail plant tree with no planter", async () => {
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
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3],
      "gb1"
    );
    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);

    await genesisTreeInstance
      .plantTree(treeId, "", birthDate, countryCode, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);
  });

  //************************************ verify plant ****************************************//
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
    const tx1 = await genesisTreeInstance.verifyPlant(treeId, true, {
      from: userAccount1,
    });
    truffleAssert.eventEmitted(tx1, "VerifyPlant", (ev) => {
      return (
        Number(ev.updateStatus.toString()) == 3 &&
        Number(ev.treeId.toString()) == treeId
      );
    });
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
    const tx2 = await genesisTreeInstance.verifyPlant(treeId2, false, {
      from: deployerAccount,
    });
    truffleAssert.eventEmitted(tx2, "VerifyPlant", (ev) => {
      return (
        Number(ev.updateStatus.toString()) == 2 &&
        Number(ev.treeId.toString()) == treeId2
      );
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
    const tx3 = await genesisTreeInstance.verifyPlant(treeId3, true, {
      from: userAccount2,
    });
    truffleAssert.eventEmitted(tx3, "VerifyPlant", (ev) => {
      return (
        Number(ev.updateStatus.toString()) == 3 &&
        Number(ev.treeId.toString()) == treeId3
      );
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
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    let genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
    ///////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      genesisTreeResult.planterId,
      userAccount2,
      "plnter id is incorrect"
    );
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
    assert.equal(
      Number(genesisTreeResult.provideStatus.toString()),
      0,
      "incorrect provide status"
    );

    assert.equal(genesisTreeResult.isExist, true, "tree existance problem");
    assert.equal(
      Number(genesisTreeResult.treeStatus.toString()),
      1,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResult.countryCode.toString()),
      countryCode,
      "country code set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResult.plantDate.toString()),
      Number(plantDate.toString()),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResult.birthDate.toString()),
      birthDate,
      "birthDate set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResult.lastUpdate.toString()),
      0,
      "invalid last update"
    );

    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);
    let now = await Common.timeInitial(TimeEnumes.seconds, 0);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResult.updateStatus.toString()),
      1,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResult.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );

    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: userAccount1,
    });

    let genesisTreeResultAfterVerify = await genesisTreeInstance.genTrees.call(
      treeId
    );

    /////////////////////////////////////////////////////////////////////

    assert.equal(
      genesisTreeResultAfterVerify.planterId,
      userAccount2,
      "plnter id is incorrect"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.gbId.toString()),
      gbId,
      "incorrect gbId set"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.gbType.toString()),
      gbType,
      "invalid gbType set"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.provideStatus.toString()),
      0,
      "incorrect provide status"
    );

    assert.equal(
      genesisTreeResultAfterVerify.isExist,
      true,
      "tree existance problem"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.treeStatus.toString()),
      1,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.countryCode.toString()),
      countryCode,
      "country code set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.plantDate.toString()),
      Number(plantDate.toString()),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.birthDate.toString()),
      birthDate,
      "birthDate set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.lastUpdate.toString()),
      0,
      "invalid last update"
    );

    assert.equal(
      genesisTreeResultAfterVerify.treeSpecs,
      ipfsHash,
      "incorrect ipfs hash"
    );

    /////////////////////////////////////////////////////////////////////

    let updateGenResultAfterVerify = await genesisTreeInstance.updateGenTrees.call(
      treeId
    );

    assert.equal(
      updateGenResultAfterVerify.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResultAfterVerify.updateStatus.toString()),
      2,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResultAfterVerify.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );
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
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    let genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
    assert.equal(
      genesisTreeResult.planterId,
      userAccount2,
      "plnter id is incorrect"
    );
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
    assert.equal(
      Number(genesisTreeResult.provideStatus.toString()),
      0,
      "incorrect provide status"
    );

    assert.equal(genesisTreeResult.isExist, true, "tree existance problem");
    assert.equal(
      Number(genesisTreeResult.treeStatus.toString()),
      1,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResult.countryCode.toString()),
      countryCode,
      "country code set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResult.plantDate.toString()),
      Number(plantDate.toString()),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResult.birthDate.toString()),
      birthDate,
      "birthDate set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResult.lastUpdate.toString()),
      0,
      "invalid last update"
    );

    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    //////////////////////////////
    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);
    let now = await Common.timeInitial(TimeEnumes.seconds, 0);
    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResult.updateStatus.toString()),
      1,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResult.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );
    await genesisTreeInstance.verifyPlant(treeId, true, { from: userAccount1 });

    let genesisTreeResultAfterVerify = await genesisTreeInstance.genTrees.call(
      treeId
    );

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      genesisTreeResultAfterVerify.planterId,
      userAccount2,
      "plnter id is incorrect"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.gbId.toString()),
      gbId,
      "incorrect gbId set"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.gbType.toString()),
      gbType,
      "invalid gbType set"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.provideStatus.toString()),
      0,
      "incorrect provide status"
    );

    assert.equal(
      genesisTreeResultAfterVerify.isExist,
      true,
      "tree existance problem"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.treeStatus.toString()),
      2,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.countryCode.toString()),
      countryCode,
      "country code set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.plantDate.toString()),
      Number(plantDate.toString()),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.birthDate.toString()),
      birthDate,
      "birthDate set inccorectly"
    );
    assert.equal(
      Number(genesisTreeResultAfterVerify.lastUpdate.toString()),
      Number(updateGenResult.updateDate.toString()),
      "invalid last update"
    );

    assert.equal(
      genesisTreeResultAfterVerify.treeSpecs,
      updateIpfsHash1,
      "incorrect ipfs hash"
    );

    ///////////////////////////////////////////////////////////////////////////////////

    const updateGenResultAfterVerify = await genesisTreeInstance.updateGenTrees.call(
      treeId
    );
    assert.equal(
      updateGenResultAfterVerify.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );
    assert.equal(
      Number(updateGenResultAfterVerify.updateStatus.toString()),
      3,
      "invlid updateGen update status"
    );
    assert.equal(
      Number(updateGenResultAfterVerify.updateDate.toString()),
      Number(now.toString()),
      "invlid time"
    );
  });
  it("should fail verify", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const invalidTreeId = 100;
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
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance
      .verifyPlant(invalidTreeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_BY_PLANTER);
    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount5 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);
    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: userAccount1,
    });
    await genesisTreeInstance
      .verifyPlant(treeId, false, { from: userAccount1 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_UPDATE_STATUS_IN_VERIFY_PLANT
      );
    await genesisTreeInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId2,
      gbId,
      userAccount3,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId2,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );
    await genesisTreeInstance.verifyPlant(treeId2, true, {
      from: userAccount4,
    });
    await genesisTreeInstance
      .verifyPlant(treeId2, true, { from: userAccount4 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );
  });

  //************************************ more complex test for function asign and plant ****************************************//
  it("should fail asign tree and plant tree after verify", async () => {
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
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: userAccount1,
    });
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId, userAccount2, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_IS_PLANTED_BEFORE);
    await genesisTreeInstance
      .plantTree(treeId, updateIpfsHash1, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
      );
  });
  it("should asign tree to another planter after plant tree", async () => {
    const treeId = 1;
    const gbId = 1;
    const gbId2 = 2;
    const gbId3 = 3;
    const gbType = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addAmbassador(arInstance, userAccount6, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3],
      "gb1"
    );
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount4, userAccount5],
      "gb 2"
    );
    await Common.addGB(
      gbInstance,
      userAccount6,
      [userAccount7, userAccount8],
      "gb3"
    );

    await await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount3,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId2, userAccount3, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
    await genesisTreeInstance
      .asignTreeToPlanter(treeId, gbId2, userAccount1, gbType, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId2,
      userAccount4,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance
      .plantTree(treeId, updateIpfsHash1, birthDate, countryCode, {
        from: userAccount5,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_WITH_PLANTER);
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId3,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );

    await genesisTreeInstance
      .plantTree(treeId, updateIpfsHash1, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANT_TREE_ACCESS_NO_PLANTER);

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount7 }
    );
  });
  it("should plant tree after reject tree", async () => {
    const treeId = 1;
    const gbId = 1;
    const gbType = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addAmbassador(arInstance, userAccount6, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount2, userAccount3],
      "gb1"
    );
    await Common.addGB(
      gbInstance,
      userAccount1,
      [userAccount4, userAccount5],
      "gb 2"
    );
    await Common.addGB(
      gbInstance,
      userAccount6,
      [userAccount7, userAccount8],
      "gb3"
    );
    await await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      zeroAddress,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
    await genesisTreeInstance
      .verifyPlant(treeId, false, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_BY_PLANTER);
    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );
    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: userAccount3,
    });
    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      gbId,
      userAccount3,
      gbType,
      { from: deployerAccount }
    );
    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );
    await genesisTreeInstance
      .verifyPlant(treeId, false, {
        from: userAccount3,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_BY_PLANTER);
    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: userAccount2,
    });
  });

  //-----------------------------------------------------------updateTree test--------------------------------------------

  // it("Should update tree work seccussfully", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   let tx = await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   let result = await genesisTreeInstance.updateGenTrees.call(treeId);

  //   let now = await Common.timeInitial(TimeEnumes.seconds, 0);

  //   assert.equal(result.updateDate.toNumber(), now);
  //   assert.equal(result.updateStatus.toNumber(), 1);

  //   truffleAssert.eventEmitted(tx, "UpdateTree", (ev) => {
  //     return ev.treeId == treeId;
  //   });
  // });

  // it("Should update tree not work because update time not reach", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );
  //   await Common.travelTime(TimeEnumes.seconds, 2000);

  //   await genesisTreeInstance
  //     .updateTree(treeId, ipfsHash, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);
  // });

  // it("Should update tree reject (update time not reach)", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.verifyUpdate(treeId, true, {
  //     from: userAccount1,
  //   });

  //   await genesisTreeInstance
  //     .updateTree(treeId, ipfsHash, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);

  //   let result = await genesisTreeInstance.updateGenTrees.call(treeId);

  //   let now = await Common.timeInitial(TimeEnumes.seconds, 0);

  //   assert.equal(result.updateDate.toNumber(), now);
  //   assert.equal(result.updateStatus.toNumber(), 3);
  // });

  // it("Should be fail because invalid address try to update", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2, userAccount3],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );
  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance
  //     .updateTree(treeId, ipfsHash, {
  //       from: userAccount3,
  //     })
  //     .should.be.rejectedWith(
  //       GenesisTreeErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
  //     );
  // });

  // it("updateTree should be fail because tree not planted", async () => {
  //   let treeId = 1;
  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

  //   await genesisTreeInstance.asignTreeToPlanter(treeId, 1, userAccount2, 1, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance
  //     .updateTree(treeId, ipfsHash, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_NOT_PLANTED);
  // });

  // //-----------------------------------------------------------verifyUpdate test--------------------------------------------

  // it("Should verify update work seccussfully when verify true by Admin", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   let resultBeforeUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
  //   let resultBeforeGT = await genesisTreeInstance.genTrees.call(treeId);

  //   let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
  //     from: deployerAccount,
  //   });

  //   let resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
  //   let resultAfterGT = await genesisTreeInstance.genTrees.call(treeId);

  //   assert.equal(
  //     resultAfterGT.lastUpdate.toNumber(),
  //     resultBeforeUGT.updateDate.toNumber()
  //   );

  //   assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

  //   assert.equal(
  //     resultAfterGT.treeStatus.toNumber(),
  //     resultBeforeGT.treeStatus.toNumber() + 1
  //   );

  //   assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

  //   truffleAssert.eventEmitted(tx, "VerifyUpdate", (ev) => {
  //     return ev.treeId == treeId && ev.updateStatus == 3;
  //   });
  // });

  // it("Should verify update work seccussfully when verify false by Admin", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   let tx = await genesisTreeInstance.verifyUpdate(treeId, false, {
  //     from: deployerAccount,
  //   });

  //   let resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(treeId);

  //   assert.equal(resultAfterUGT.updateStatus.toNumber(), 2);

  //   truffleAssert.eventEmitted(tx, "VerifyUpdate", (ev) => {
  //     return ev.treeId == treeId && ev.updateStatus == 2;
  //   });
  // });

  // it("Should verify update work seccussfully by Ambassador", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.verifyUpdate(treeId, true, {
  //     from: userAccount1,
  //   });
  // });

  // it("Should verify update work seccussfully by other Planter in Gb", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2, userAccount3],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.verifyUpdate(treeId, true, {
  //     from: userAccount3,
  //   });
  // });

  // it("Should be fail invalid access . planter not in Gb", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance
  //     .verifyUpdate(treeId, true, {
  //       from: userAccount3,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);
  // });

  // it("Should be fail invalid access . planter of tree not access to update", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance
  //     .verifyUpdate(treeId, true, {
  //       from: userAccount2,
  //     })
  //     .should.be.rejectedWith(
  //       GenesisTreeErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
  //     );
  // });

  // it("Should be fail because update status is not pending when verify is true", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.verifyUpdate(treeId, true, {
  //     from: userAccount1,
  //   });

  //   await genesisTreeInstance
  //     .verifyUpdate(treeId, true, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(
  //       GenesisTreeErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
  //     );
  // });

  // it("Should be fail because update status is not pending when verfiy is false", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.travelTime(TimeEnumes.seconds, 2592000);

  //   await genesisTreeInstance.updateTree(treeId, ipfsHash, {
  //     from: userAccount2,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.verifyUpdate(treeId, false, {
  //     from: userAccount1,
  //   });

  //   await genesisTreeInstance
  //     .verifyUpdate(treeId, false, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(
  //       GenesisTreeErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
  //     );
  // });

  // it("verifyUpdate should be fail because tree not planted", async () => {
  //   let treeId = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await genesisTreeInstance.addTree(treeId, ipfsHash, {
  //     from: deployerAccount,
  //   });

  //   await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
  //   await Common.addPlanter(arInstance, userAccount2, deployerAccount);
  //   await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

  //   await genesisTreeInstance.asignTreeToPlanter(treeId, 1, userAccount2, 1, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.plantTree(
  //     treeId,
  //     ipfsHash,
  //     birthDate,
  //     countryCode,
  //     {
  //       from: userAccount2,
  //     }
  //   );

  //   await genesisTreeInstance
  //     .verifyUpdate(treeId, true, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_NOT_PLANTED);
  // });

  // it("Should be fail because tree id not exist", async () => {
  //   await genesisTreeInstance
  //     .verifyUpdate(10, true, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
  // });

  // //--------------------------------------------------checkAndSetProvideStatus test----------------------------------------

  // it("checkAndSetProvideStatus should be success", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

  //   let resultBefore = await genesisTreeInstance.genTrees.call(treeId);

  //   let lastProvideStatus = await genesisTreeInstance.checkAndSetProvideStatus(
  //     1,
  //     1,
  //     {
  //       from: userAccount5,
  //     }
  //   );

  //   let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

  //   assert.equal(
  //     resultAfter.provideStatus.toNumber(),
  //     resultBefore.provideStatus.toNumber() + 1,
  //     "provideStatus not true update"
  //   );
  // });

  // it("checkAndSetProvideStatus should be fail because invalid access(just auction access for this function)", async () => {
  //   await genesisTreeInstance
  //     .checkAndSetProvideStatus(1, 1, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  // });

  // it("checkAndSetProvideStatus should be fail because invalid tree", async () => {
  //   await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

  //   await genesisTreeInstance
  //     .checkAndSetProvideStatus(1, 1, {
  //       from: userAccount1,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
  // });

  // //-------------------------------------------------------updateOwner test-------------------------------------------------------------

  // it("updateOwner should be success", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

  //   await Common.addGenesisTreeRole(
  //     arInstance,
  //     genesisTreeInstance.address,
  //     deployerAccount
  //   );

  //   await genesisTreeInstance.checkAndSetProvideStatus(1, 1, {
  //     from: userAccount5,
  //   });

  //   await genesisTreeInstance.updateOwner(1, userAccount4, {
  //     from: userAccount5,
  //   });

  //   let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

  //   assert.equal(
  //     resultAfter.provideStatus.toNumber(),
  //     0,
  //     "provideStatus not true update"
  //   );

  //   let addressGetToken = await treeTokenInstance.ownerOf(1);

  //   assert.equal(addressGetToken, userAccount4, "token not true mint");
  // });

  // it("updateOwner should be fail because invalid access(just auction access for this function)", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await genesisTreeInstance
  //     .updateOwner(1, userAccount4, {
  //       from: userAccount5,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  // });

  // it("updateOwner should be fail because token mint for another user", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await Common.addGenesisTreeRole(
  //     arInstance,
  //     genesisTreeInstance.address,
  //     deployerAccount
  //   );

  //   await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await genesisTreeInstance.updateOwner(1, userAccount4, {
  //     from: userAccount5,
  //   });

  //   await genesisTreeInstance.updateOwner(1, userAccount6, {
  //     from: userAccount5,
  //   }).should.be.rejected;
  // });

  // //---------------------------------------------------------updateProvideStatus----------------------------------

  // it("updateProvideStatus should be success", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

  //   await genesisTreeInstance.checkAndSetProvideStatus(treeId, 1, {
  //     from: userAccount5,
  //   });

  //   await genesisTreeInstance.updateProvideStatus(treeId, {
  //     from: userAccount5,
  //   });

  //   let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

  //   assert.equal(
  //     resultAfter.provideStatus.toNumber(),
  //     0,
  //     "provideStatus not true update"
  //   );
  // });

  // it("updateProvideStatus should be success", async () => {
  //   const treeId = 1;
  //   const gbId = 1;
  //   const gbType = 1;
  //   const birthDate = parseInt(new Date().getTime() / 1000);
  //   const countryCode = 2;

  //   await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
  //     from: deployerAccount,
  //   });

  //   await Common.successPlant(
  //     genesisTreeInstance,
  //     gbInstance,
  //     arInstance,
  //     ipfsHash,
  //     treeId,
  //     gbId,
  //     gbType,
  //     birthDate,
  //     countryCode,
  //     [userAccount2],
  //     userAccount1,
  //     userAccount2,
  //     deployerAccount
  //   );

  //   await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

  //   await genesisTreeInstance.checkAndSetProvideStatus(treeId, 1, {
  //     from: userAccount5,
  //   });

  //   await genesisTreeInstance
  //     .updateProvideStatus(treeId, {
  //       from: userAccount6,
  //     })
  //     .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  // });

  // it("test gsn", async () => {
  //   let env = await GsnTestEnvironment.startGsn("localhost");
  //   const {
  //     forwarderAddress,
  //     relayHubAddress,
  //     paymasterAddress,
  //   } = env.contractsDeployment;

  //   await genesisTreeInstance.setTrustedForwarder(forwarderAddress, {
  //     from: deployerAccount,
  //   });

  //   let paymaster = await WhitelistPaymaster.new(arInstance.address);

  //   await paymaster.setWhitelistTarget(genesisTreeInstance.address, {
  //     from: deployerAccount,
  //   });
  //   await paymaster.setRelayHub(relayHubAddress);
  //   await paymaster.setTrustedForwarder(forwarderAddress);
  //   web3.eth.sendTransaction({
  //     from: accounts[0],
  //     to: paymaster.address,
  //     value: web3.utils.toWei("1"),
  //   });

  //   origProvider = web3.currentProvider;

  //   conf = { paymasterAddress: paymaster.address };

  //   gsnProvider = await Gsn.RelayProvider.newProvider({
  //     provider: origProvider,
  //     config: conf,
  //   }).init();

  //   provider = new ethers.providers.Web3Provider(gsnProvider);

  //   let signerPlanter = provider.getSigner(3);
  //   let signerAmbassador = provider.getSigner(2);

  //   let contractPlanter = await new ethers.Contract(
  //     genesisTreeInstance.address,
  //     genesisTreeInstance.abi,
  //     signerPlanter
  //   );

  //   let contractAmbassador = await new ethers.Contract(
  //     genesisTreeInstance.address,
  //     genesisTreeInstance.abi,
  //     signerAmbassador
  //   );

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

  //   let planterBeforeBalance = await web3.eth.getBalance(userAccount2);

  //   let ambassadorBeforeBalance = await web3.eth.getBalance(userAccount1);

  //   await contractPlanter.plantTree(treeId, ipfsHash, birthDate, countryCode);

  //   await contractAmbassador.verifyPlant(treeId, true);

  //   let planterAfterBalance = await web3.eth.getBalance(userAccount2);

  //   let ambassadorAfterBalance = await web3.eth.getBalance(userAccount1);

  //   assert.equal(
  //     planterAfterBalance,
  //     planterBeforeBalance,
  //     "planter balance not equal"
  //   );

  //   assert.equal(
  //     ambassadorAfterBalance,
  //     ambassadorBeforeBalance,
  //     "ambassador balance not equal"
  //   );
  // });
});
