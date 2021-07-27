const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  TreeAuctionErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const Math = require("./math");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("TreeFactory", (accounts) => {
  let treeFactoryInstance;
  let treeTokenInstance;

  let arInstance;
  let treasuryInstance;
  let planterInstance;
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

    treeFactoryInstance = await deployProxy(TreeFactory, [arInstance.address], {
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

    treasuryInstance = await deployProxy(Treasury, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    planterInstance = await deployProxy(Planter, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });

    await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});
  /////////////------------------------------------ deploy successfully ----------------------------------------//

  it("deploys successfully", async () => {
    const address = treeFactoryInstance.address;

    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  /////////////------------------------------------ treasury address ----------------------------------------//

  it("set treasury address", async () => {
    let tx = await treeFactoryInstance.setTreasuryAddress(
      treasuryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance
      .setTreasuryAddress(treasuryInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  ////////////------------------------------------ set planter address ----------------------------------------//

  it("set planter address", async () => {
    let tx = await treeFactoryInstance.setPlanterAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await treeFactoryInstance
      .setPlanterAddress(planterInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  ////////////////////------------------------------------ tree token address ----------------------------------------//
  it("set tree token address", async () => {
    let tx = await treeFactoryInstance.setTreeTokenAddress(
      treeTokenInstance.address,
      { from: deployerAccount }
    );

    await treeFactoryInstance
      .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  /////////////////------------------------------------ add tree ----------------------------------------//

  it("add tree succussfuly", async () => {
    let tx = await treeFactoryInstance.addTree(1, ipfsHash, {
      from: deployerAccount,
    });

    let tx2 = await treeFactoryInstance.addTree(2, ipfsHash, {
      from: deployerAccount,
    });
  });

  it("add tree successfuly and check data to insert correct", async () => {
    let treeId1 = 1;

    await treeFactoryInstance.addTree(treeId1, ipfsHash, {
      from: deployerAccount,
    });

    let result1 = await treeFactoryInstance.treeData.call(treeId1);

    assert.equal(result1.planterId, 0x0, "invalid planter id in add tree");
    assert.equal(Number(result1.treeType), 0, "incorrect treeType");
    assert.equal(Number(result1.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result1.treeStatus), 2, "tree status is incorrect"); //updated
    assert.equal(Number(result1.countryCode), 0, "incorrect country code");
    assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
    assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
    assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");
  });
  it("fail to add tree", async () => {
    let treeId = 1;

    await treeFactoryInstance
      .addTree(treeId, ipfsHash, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .addTree(treeId, ipfsHash, { from: deployerAccount })
      .should.be.rejectedWith(TreeFactoryErrorMsg.DUPLICATE_TREE);
  });

  ////////////////////////------------------------------------ asign tree ----------------------------------------//
  it("assign tree to planter succussfuly", async () => {
    let treeId = 1;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });
  });
  it("check data to be correct after asigning tree to planter", async () => {
    let treeId = 1;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    //asign to planter user2
    let asign1 = await treeFactoryInstance.assignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );
    let result1 = await treeFactoryInstance.treeData.call(treeId);
    //////////////////////////////////////////////////////////////////////////

    assert.equal(
      result1.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(Number(result1.treeType), 0, "incorrect treeType");
    assert.equal(Number(result1.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result1.treeStatus), 2, "tree status is incorrect"); //updated
    assert.equal(Number(result1.countryCode), 0, "incorrect country code");
    assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
    assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
    assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ////////////////////////////////////////////////////

    //asign to planter user3
    let asign2 = await treeFactoryInstance.assignTreeToPlanter(
      treeId,
      userAccount3,
      { from: deployerAccount }
    );

    let result2 = await treeFactoryInstance.treeData.call(treeId);

    ///////////////////////////////////////////////////////////////////////////

    assert.equal(
      result2.planterId,
      userAccount3,
      "invalid planter id in add tree"
    );
    assert.equal(Number(result2.treeType), 0, "incorrect treeType");
    assert.equal(Number(result2.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result2.treeStatus), 2, "tree status is incorrect"); //updated
    assert.equal(Number(result2.countryCode), 0, "incorrect country code");
    assert.equal(Number(result2.plantDate), 0, "incorrect plant date");
    assert.equal(Number(result2.birthDate), 0, "incorrect birth date");
    assert.equal(result2.treeSpecs, ipfsHash, "incorrect ipfs hash");
  });
  it("should fail asign tree to planter", async () => {
    const treeId = 1;
    const invalidTreeId = 10;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //add planter role but it is not join to planters

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    let tree1 = await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .assignTreeToPlanter(treeId, userAccount2, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await treeFactoryInstance
      .assignTreeToPlanter(invalidTreeId, userAccount2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    ////////// try to plant tree and verify it to change staus to 2 and fail because it is planted
    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.plantTree(treeId, ipfsHash, 2, 4, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .assignTreeToPlanter(treeId, userAccount2, { from: deployerAccount })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);
  });

  it("should fail to assign because of can't assign tree to planter", async () => {
    const treeId1 = 1;
    const treeId2 = 2;
    const treeId3 = 3;
    const treeId4 = 4;
    const treeId5 = 5;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    ///////////////// ------------------------- add trees
    await treeFactoryInstance.addTree(treeId1, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId3, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId4, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId5, ipfsHash, {
      from: deployerAccount,
    });
    ///////////////////////// -------------------- add treeFactory role
    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    /////////////////// --------------------------- add planters

    Common.addPlanter(arInstance, userAccount1, deployerAccount);
    Common.addPlanter(arInstance, userAccount2, deployerAccount);
    Common.addPlanter(arInstance, userAccount3, deployerAccount);
    Common.addPlanter(arInstance, userAccount4, deployerAccount);
    Common.addPlanter(arInstance, userAccount5, deployerAccount);
    Common.addPlanter(arInstance, userAccount6, deployerAccount);

    ///////////////////------------------------------ join planters

    Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    Common.joinOrganizationPlanter(
      planterInstance,
      userAccount2,
      zeroAddress,
      deployerAccount
    );

    Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount3,
      zeroAddress,
      userAccount2
    );

    /////////////////////////// ------------------ update planter (userAccount1) capacity to 1 and plant a tree to change planter status to 2

    await planterInstance.updateCapacity(userAccount1, 1, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId1, userAccount1, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId1,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount1 }
    );

    await treeFactoryInstance
      .assignTreeToPlanter(treeId2, userAccount1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER);

    ///////////////////////// test userAccount3 (orgizationPlanter) --------------
    await treeFactoryInstance
      .assignTreeToPlanter(treeId2, userAccount3, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER);

    await planterInstance.updateCapacity(userAccount3, 1, {
      from: deployerAccount,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
      from: userAccount2,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await treeFactoryInstance
      .assignTreeToPlanter(treeId3, userAccount3, { from: deployerAccount })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER);

    /////////////////---------------------- assign tree to userAccount2(orgnization) (unlimited assign)
    await treeFactoryInstance.assignTreeToPlanter(treeId3, userAccount2, {
      from: deployerAccount,
    });

    await planterInstance.updateCapacity(userAccount2, 1, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId3,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    await treeFactoryInstance.assignTreeToPlanter(treeId4, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId5, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .plantTree(treeId4, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })

      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await planterInstance.updateCapacity(userAccount3, 2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId4,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await treeFactoryInstance
      .plantTree(treeId5, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
  });

  //////////////------------------------------------ plant tree ----------------------------------------//
  it("should plant tree successfuly when have planter", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );

    let tx = await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    truffleAssert.eventEmitted(tx, "TreePlanted", (ev) => {
      return Number(ev.treeId) == treeId;
    });
  });

  it("check data to be correct after plant tree with planter", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

    const treeFactoryResult = await treeFactoryInstance.treeData.call(treeId);
    /////////////////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      treeFactoryResult.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(Number(treeFactoryResult.treeType), 0, "incorrect treeType");

    assert.equal(
      Number(treeFactoryResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(treeFactoryResult.treeStatus),
      3,
      "tree status is incorrect"
    ); //updated

    assert.equal(
      Number(treeFactoryResult.countryCode),
      countryCode,
      "incorrect country code"
    );

    assert.equal(
      Number(treeFactoryResult.plantDate),
      Number(plantDate),
      "incorrect plant date"
    );

    assert.equal(
      Number(treeFactoryResult.birthDate),
      birthDate,
      "incorrect birth date"
    );

    assert.equal(treeFactoryResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await treeFactoryInstance.updateTrees.call(treeId);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );

    assert.equal(
      Number(updateGenResult.updateStatus),
      1,
      "invlid updateGen update status"
    );
  });

  it("should fail plant tree with planter", async () => {
    const treeId = 1;
    const invlidTreeId = 2;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanterFromTreeFactory(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      treeFactoryInstance,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );

    await treeFactoryInstance
      .plantTree(invlidTreeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
      );

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_TREE_FACTORY);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
      );
  });

  it("should fail because of planting permision (1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount8,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );
  });

  it("should fail because of planting permision (assign to type 2 and test with type 1 and type 2)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount6,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount3,
      }
    );
  });

  it("should fail because of planting permision (assign to type 2 and test with type 3)", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );
    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    ///////////////////------------------ update planter usrAccount4 capacity to 1 so he can plant just 1 tree

    await planterInstance.updateCapacity(userAccount4, 1, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });
    await treeFactoryInstance.assignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount8,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    ///////////////-------------- it must fail because planter status is not active

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
    //////////////------------------ accept user to organiztion

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await treeFactoryInstance
      .plantTree(treeId2, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    ////////////////------------- update capacity to 5 and now an plant

    await planterInstance.updateCapacity(userAccount4, 5, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
  });

  it("should fail because of planting permision assign to type 3", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
    //////////////-------------- call with user5 in same orgnization but not assignee

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    /////////////-------------- accept user account5 as planter to organization 3 but it should be fail because tree asigned to userAccount4 in organization 3

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    /////////////////////////////////------------ type 3 from other organization want to plant
    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

    ///////////////////////////--------------------- accept user from other org and must be fail because not assignee
    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await treeFactoryInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
    /////////////////////----------------- plant with assignee and fail becuase not accpted by org

    //////////////////////// ---------------------  plant succusfully

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
  });

  //////////------------------------------------ verify plant ----------------------------------------//
  it("should verify plant seccussfully", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const treeId3 = 3;
    const treeId4 = 4;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addPlanter(arInstance, userAccount6, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );
    //////////////----------------- accept org planter

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );
    //////////////////// verify type 1 by admin

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    const tx1 = await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx1, "PlantVerified", (ev) => {
      return Number(ev.treeId) == treeId;
    });

    //////////////////---------------- assign to type 2 anad verify by org

    await treeFactoryInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    const tx2 = await treeFactoryInstance.verifyPlant(treeId2, false, {
      from: userAccount4,
    });

    truffleAssert.eventEmitted(tx2, "PlantRejected", (ev) => {
      return Number(ev.treeId) == treeId2;
    });

    ///////////////////////////---------------- assign to type 3 and  verify by org

    await treeFactoryInstance.addTree(treeId3, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId3, userAccount4, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId3,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );

    const tx3 = await treeFactoryInstance.verifyPlant(treeId3, true, {
      from: userAccount3,
    });

    truffleAssert.eventEmitted(tx3, "PlantVerified", (ev) => {
      return Number(ev.treeId) == treeId3;
    });

    ///////////////////////////---------------- assign to type 3 and  verify by other planters in org
    await treeFactoryInstance.addTree(treeId4, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId4, userAccount4, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId4,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );

    const tx4 = await treeFactoryInstance.verifyPlant(treeId4, true, {
      from: userAccount5,
    });

    truffleAssert.eventEmitted(tx4, "PlantVerified", (ev) => {
      return Number(ev.treeId) == treeId4;
    });
  });
  it("check data to be correct after reject plant", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    let treeFactoryResult = await treeFactoryInstance.treeData.call(treeId);

    ///////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      treeFactoryResult.planterId,
      userAccount2,
      "plnter id is incorrect"
    );

    assert.equal(
      Number(treeFactoryResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(treeFactoryResult.treeStatus),
      3,
      "tree status is not ok"
    ); //updated

    assert.equal(
      Number(treeFactoryResult.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(treeFactoryResult.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(treeFactoryResult.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(treeFactoryResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await treeFactoryInstance.updateTrees.call(treeId);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );

    assert.equal(
      Number(updateGenResult.updateStatus),
      1,
      "invlid updateGen update status"
    );

    await treeFactoryInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });

    let treeFactoryResultAfterVerify = await treeFactoryInstance.treeData.call(
      treeId
    );

    /////////////////////////////////////////////////////////////////////

    assert.equal(
      treeFactoryResultAfterVerify.planterId,
      userAccount2,
      "plnter id is incorrect"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.treeStatus),
      2,
      "tree status is not ok"
    ); //updated

    assert.equal(
      Number(treeFactoryResultAfterVerify.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(
      treeFactoryResultAfterVerify.treeSpecs,
      ipfsHash,
      "incorrect ipfs hash"
    );

    /////////////////////////////////////////////////////////////////////

    let updateGenResultAfterVerify = await treeFactoryInstance.updateTrees.call(
      treeId
    );

    assert.equal(
      updateGenResultAfterVerify.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );

    assert.equal(
      Number(updateGenResultAfterVerify.updateStatus),
      2,
      "invlid updateGen update status"
    );
  });

  it("check data to be correct after verify plant", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
    let treeFactoryResult = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      treeFactoryResult.planterId,
      userAccount2,
      "plnter id is incorrect"
    );

    assert.equal(
      Number(treeFactoryResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(treeFactoryResult.treeStatus),
      3,
      "tree status is not ok"
    ); //updated

    assert.equal(
      Number(treeFactoryResult.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(treeFactoryResult.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(treeFactoryResult.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(treeFactoryResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    //////////////////////////////
    let updateGenResult = await treeFactoryInstance.updateTrees.call(treeId);

    assert.equal(
      updateGenResult.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );

    assert.equal(
      Number(updateGenResult.updateStatus),
      1,
      "invlid updateGen update status"
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    let treeFactoryResultAfterVerify = await treeFactoryInstance.treeData.call(
      treeId
    );

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      treeFactoryResultAfterVerify.planterId,
      userAccount2,
      "plnter id is incorrect"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.treeStatus),
      4,
      "tree status is not ok"
    ); //updated

    assert.equal(
      Number(treeFactoryResultAfterVerify.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(treeFactoryResultAfterVerify.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(
      treeFactoryResultAfterVerify.treeSpecs,
      updateIpfsHash1,
      "incorrect ipfs hash"
    );

    ///////////////////////////////////////////////////////////////////////////////////

    const updateGenResultAfterVerify = await treeFactoryInstance.updateTrees.call(
      treeId
    );

    assert.equal(
      updateGenResultAfterVerify.updateSpecs,
      updateIpfsHash1,
      "ipfs hash set inccorect"
    );

    assert.equal(
      Number(updateGenResultAfterVerify.updateStatus),
      3,
      "invlid updateGen update status"
    );
  });
  it("should fail verify", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const invalidTreeId = 100;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: deployerAccount })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance
      .verifyPlant(invalidTreeId, true, { from: deployerAccount })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await treeFactoryInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyPlant(treeId, false, { from: userAccount1 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );

    await treeFactoryInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId2,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await treeFactoryInstance.verifyPlant(treeId2, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyPlant(treeId2, true, { from: userAccount4 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );
  });

  it("should fail verify plant when planterType=1", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    ///////////////---------------- accept org planter by org

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });
    ///////////////-------------------------- plant tree

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount8 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });
  });
  it("should fail verify plant when planterType=2", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    ///////////////---------------- accept org planter by org

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });
    ///////////////-------------------------- plant tree

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    //////////////--------------- verify successfully

    await treeFactoryInstance.verifyPlant(treeId, true, { from: userAccount5 });
  });
  it("should fail verify plant when planterType=3", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount1,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    ///////////////---------------- accept org planter by org
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });
    ///////////////-------------------------- plant tree

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
    //////////////////----------- try to verify:fail

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyPlant(treeId, true, { from: userAccount5 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    /////////////////------------- try to verify: success
    await treeFactoryInstance.verifyPlant(treeId, true, { from: userAccount3 });
  });

  /////////////------------------------------------ more complex test for function asign and plant ----------------------------------------//
  it("should fail asign tree and plant tree after verify", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .assignTreeToPlanter(treeId, userAccount2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);

    await treeFactoryInstance
      .plantTree(treeId, updateIpfsHash1, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
      );
  });

  it("should plant tree after reject tree", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress
    );

    await await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance
      .verifyPlant(treeId, false, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await treeFactoryInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    await treeFactoryInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await treeFactoryInstance
      .verifyPlant(treeId, false, {
        from: userAccount3,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await treeFactoryInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });
  });

  // //  -----------------------------------------------------------updateTree test--------------------------------------------

  it("Should update tree work successfully", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    let tree = await treeFactoryInstance.treeData.call(treeId);
    let travelTime = Math.mul(
      Math.add(Math.mul(Number(tree.treeStatus), 3600), Math.mul(24, 3600)),
      2
    );

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    let tx = await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let result = await treeFactoryInstance.updateTrees.call(treeId);

    assert.equal(
      result.updateStatus.toNumber(),
      1,
      "update status set problem"
    );

    assert.equal(result.updateSpecs, ipfsHash, "update specs set problem");

    truffleAssert.eventEmitted(tx, "TreeUpdated", (ev) => {
      return ev.treeId == treeId;
    });
  });

  it("Should update tree not work because update time not reach", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    await Common.travelTime(TimeEnumes.seconds, 2000);

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);
  });
  it("Should update tree do not work because update time does not reach (using update status)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    let tree = await treeFactoryInstance.treeData.call(treeId);
    let travelTime = Math.subtract(
      Math.add(Math.mul(Number(tree.treeStatus), 3600), Math.mul(24, 3600)),
      100
    );

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);
  });

  it("Should update tree reject (updateGen updateStaus is 1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.UPDATE_TREE_FAIL_INVALID_UPDATE_TREE_STATUS
      );
  });
  it("should update successfully after reject update and fail update after verify update because update time does not reach", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("0.1");

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

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount1,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    let tree = await treeFactoryInstance.treeData.call(treeId);
    let travelTime = Math.add(
      Math.add(Math.mul(Number(tree.treeStatus), 3600), Math.mul(24, 3600)),
      100
    );

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx = await treeFactoryInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx2 = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);
  });

  it("Should be fail because invalid address try to update", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.successPlant(
      treeFactoryInstance,
      arInstance,
      ipfsHash,
      treeId,
      birthDate,
      countryCode,
      [userAccount2, userAccount3],
      userAccount2,
      deployerAccount,
      planterInstance
    );

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount3,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
      );
  });

  it("updateTree should be fail because tree not planted", async () => {
    let treeId = 1;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_NOT_PLANTED);
  });

  it("should fail update after two time update and verify", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

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

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount1,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    let tree = await treeFactoryInstance.treeData.call(treeId);
    let travelTime = Math.add(
      Math.mul(Number(tree.treeStatus), 3600),
      Math.mul(25, 3600)
    );

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 86400);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, { from: userAccount2 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 86300);

    await treeFactoryInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 100);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });
  });

  ////////////////////-----------------------------------------------------------verifyUpdate test--------------------------------------------

  it("Should verify update work seccussfully when verify true by Admin (no fund tree)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let resultBeforeUGT = await treeFactoryInstance.updateTrees.call(treeId);
    let resultBeforeGT = await treeFactoryInstance.treeData.call(treeId);

    let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let now = await Common.timeInitial(TimeEnumes.seconds, 0);
    let resultAfterUGT = await treeFactoryInstance.updateTrees.call(treeId);
    let resultAfterGT = await treeFactoryInstance.treeData.call(treeId);
    let pFund = await treasuryInstance.planterFunds.call(treeId);
    let planterPaid = await treasuryInstance.plantersPaid.call(treeId);

    assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

    assert.equal(
      resultAfterGT.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(Number(now), Number(resultBeforeGT.plantDate)),
          3600
        )
      ),
      "tree status update does not match"
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId;
    });

    assert.equal(Number(pFund), 0, "no fund beacuse tree fund did not call");

    assert.equal(planterPaid, 0, "planter fund did not call");
  });

  it("Should verify update work seccussfully when verify true by Admin (fund planter) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund = Math.divide(
      Math.mul(Number(fundTreeAmount), fundsPercent.planterFund),
      10000
    );

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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    const pFund = await treasuryInstance.planterFunds.call(treeId);
    const planterPaidBeforeVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      Number(pFund),
      planterTotalFund,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(planterPaidBeforeVerify),
      0,
      "planter paid before verify update is not ok"
    );

    await Common.travelTime(TimeEnumes.seconds, 172800); //172800 is equal to 48 hours

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await treeFactoryInstance.updateTrees.call(treeId);
    let resultBeforeGT = await treeFactoryInstance.treeData.call(treeId);

    let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterUGT = await treeFactoryInstance.updateTrees.call(treeId);

    const resultAfterGT = await treeFactoryInstance.treeData.call(treeId);

    const now = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    const expectedPaid = parseInt(
      Math.divide(
        Math.mul(planterTotalFund, Number(resultAfterGT.treeStatus)),
        25920
      )
    );

    assert.equal(
      Number(planterPaidAfterVerify),
      expectedPaid,

      "planter paid after verify is not ok"
    );

    assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

    assert.equal(
      resultAfterGT.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(Number(now), Number(resultBeforeGT.plantDate)),
          3600
        )
      ),
      "tree status update does not match"
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId;
    });
  });

  it("Should verify update work seccussfully when verify after more 3 years true by Admin (fund planter ) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };

    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund = Math.divide(
      Math.mul(Number(fundTreeAmount), fundsPercent.planterFund),
      10000
    );
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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    const pFund = await treasuryInstance.planterFunds.call(treeId);

    const planterPaidBeforeVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      Number(pFund),
      planterTotalFund,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(planterPaidBeforeVerify),
      0,
      "planter paid before verify update is not ok"
    );

    await Common.travelTime(TimeEnumes.seconds, 93312000); //93312000 is equal to 3 years

    await Common.travelTime(TimeEnumes.seconds, 31104000); //31104000 is equal to 1 year

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await treeFactoryInstance.updateTrees.call(treeId);
    let resultBeforeGT = await treeFactoryInstance.treeData.call(treeId);

    let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterUGT = await treeFactoryInstance.updateTrees.call(treeId);

    const resultAfterGT = await treeFactoryInstance.treeData.call(treeId);

    const now = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      Number(planterPaidAfterVerify),
      planterTotalFund,

      "planter paid after verify is not ok"
    );

    assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

    assert.equal(
      resultAfterGT.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(Number(now), Number(resultBeforeGT.plantDate)),
          3600
        )
      ),
      "tree status update does not match"
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId;
    });

    ////////////////////// update after 1 year and verify ///////////////////////////

    await Common.travelTime(TimeEnumes.seconds, 31104000); //31104000 is equal to 1 year

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterGT2 = await treeFactoryInstance.treeData.call(treeId);

    const nowAfterVerify = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify2 = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      resultAfterGT2.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(
            Number(nowAfterVerify),
            Number(resultBeforeGT.plantDate)
          ),
          3600
        )
      ),
      "tree status update does not match"
    );

    assert.equal(
      Number(planterPaidAfterVerify2),
      planterTotalFund,
      "planter paid after verify is not ok"
    );
  });

  it("Should verify update work seccussfully when verify true by Admin (no fund planter first because there is no token owner exist and fund planter in try 2 beacuse token owner setted) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund = Math.divide(
      Math.mul(Number(fundTreeAmount), fundsPercent.planterFund),
      10000
    );

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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    ///////////////////// fund tree without tree token owner ////////////////////////////////

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treasuryInstance.addFundDistributionModel(
      fundsPercent.planterFund,
      fundsPercent.referralFund,
      fundsPercent.treeResearch,
      fundsPercent.localDevelop,
      fundsPercent.rescueFund,
      fundsPercent.treejerDevelop,
      fundsPercent.reserveFund1,
      fundsPercent.reserveFund2,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await treeFactoryInstance.availability(treeId, 1, {
      from: userAccount5,
    });

    await treasuryInstance.fundTree(treeId, {
      from: userAccount5,
      value: fundTreeAmount,
    });

    /////////////////////////////////////////////////////////

    const pFund = await treasuryInstance.planterFunds.call(treeId);

    const planterPaidBeforeVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      Number(pFund),
      planterTotalFund,
      "planter total fund is not ok"
    );

    assert.equal(
      Number(planterPaidBeforeVerify),
      0,
      "planter paid before verify update is not ok"
    );

    await Common.travelTime(TimeEnumes.seconds, 172800); //172800 is equal to 48 hours

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await treeFactoryInstance.updateTrees.call(treeId);
    let resultBeforeGT = await treeFactoryInstance.treeData.call(treeId);

    let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let resultAfterUGT = await treeFactoryInstance.updateTrees.call(treeId);

    let resultAfterGT = await treeFactoryInstance.treeData.call(treeId);

    let now = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify1 = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      Number(planterPaidAfterVerify1),
      0,

      "planter paid after verify1 is not ok"
    );

    assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

    assert.equal(
      resultAfterGT.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(Number(now), Number(resultBeforeGT.plantDate)),
          3600
        )
      ),
      "tree status update does not match"
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId;
    });

    /////////////////// verify 2 and set token owner ////////////////////////

    await treeFactoryInstance.updateOwner(treeId, userAccount8, {
      from: userAccount5,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800); //172800 is equal to 48 hours

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let resultAfterGT2 = await treeFactoryInstance.treeData.call(treeId);

    const nowAfterVerify2 = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify2 = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      resultAfterGT2.treeStatus.toNumber(),
      parseInt(
        Math.divide(
          Math.subtract(
            Number(nowAfterVerify2),
            Number(resultBeforeGT.plantDate)
          ),
          3600
        )
      ),
      "tree status update does not match"
    );

    let expectedPaid = parseInt(
      Math.divide(
        Math.mul(planterTotalFund, Number(resultAfterGT2.treeStatus)),
        25920
      )
    );

    assert.equal(
      Number(planterPaidAfterVerify2),
      expectedPaid,

      "planter paid after verify is not ok"
    );
  });

  it("Should verify update work seccussfully when verify false by Admin", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

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

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let tx = await treeFactoryInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    let resultAfterUGT = await treeFactoryInstance.updateTrees.call(treeId);

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 2);

    truffleAssert.eventEmitted(tx, "UpdateRejected", (ev) => {
      return ev.treeId == treeId;
    });
  });

  it("should verify by planter in organization where organiation is planter (planterType=2) and fail otherwise", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount3,
      }
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    ///////////////---------------- accept org planter by org
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount3,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    const verifyTx = await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: userAccount4,
    });

    truffleAssert.eventEmitted(verifyTx, "UpdateVerified", (ev) => {
      return Number(ev.treeId) == treeId;
    });
  });
  it("should verify by planter in organization where organiation is planter in organization (planterType=3)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    ///////////////---------------- accept org planter by org
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount4,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount5 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: userAccount5,
    });
  });

  it("should verify by organization where organiation is planter in organization (planterType=3)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    ///////////////---------------- accept org planter by org
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount4,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: userAccount3,
    });
  });

  it("should verify by admin where planter is individual (planterType=1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount3,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount4,
      zeroAddress,
      userAccount3
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount5,
      zeroAddress,
      userAccount3
    );

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount6,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount7,
      zeroAddress,
      userAccount6
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount8,
      zeroAddress,
      userAccount6
    );

    ///////////////---------------- accept org planter by org
    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await planterInstance.acceptPlanterFromOrganization(userAccount8, true, {
      from: userAccount6,
    });

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

    await treeFactoryInstance
      .verifyUpdate(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });
  });

  it("Should be fail because update status is not pending when verify is true", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
      );
  });

  it("Should be fail because update status is not pending when verfiy is false", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      referralFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      reserveFund1: 0,
      reserveFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

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

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      treeFactoryInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      treeFactoryInstance
    );

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await treeFactoryInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treeFactoryInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, false, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
      );
  });

  it("verifyUpdate should be fail because tree not planted", async () => {
    let treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyUpdate(treeId, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_NOT_PLANTED);
  });

  it("Should be fail because function is pause", async () => {
    await arInstance.pause({
      from: deployerAccount,
    });

    await treeFactoryInstance
      .verifyUpdate(1, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  ////////////////--------------------------------------------------availability test----------------------------------------

  it("availability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let resultBefore = await treeFactoryInstance.treeData.call(treeId);

    let lastProvideStatus = await treeFactoryInstance.availability(1, 1, {
      from: userAccount5,
    });

    let resultAfter = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      Math.add(resultBefore.provideStatus.toNumber(), 1),
      "provideStatus not true update"
    );
  });

  it("availability should be fail because invalid access(just auction access for this function)", async () => {
    await treeFactoryInstance
      .availability(1, 1, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  it("availability should be fail because invalid tree", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    await treeFactoryInstance
      .availability(1, 1, {
        from: userAccount1,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE);
  });

  it("availability should be fail because tree has owner", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeTokenInstance.safeMint(userAccount2, treeId, {
      from: deployerAccount,
    });

    let balance = await web3.eth.getBalance(userAccount1);

    let resultBefore = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      resultBefore.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );

    await treeFactoryInstance.availability(1, 3, {
      from: userAccount1,
    });

    let resultAfter = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );
  });

  /////////////////-------------------------------------------------------updateOwner test-------------------------------------------------------------

  it("updateOwner should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.availability(1, 1, {
      from: userAccount5,
    });

    await treeFactoryInstance.updateOwner(1, userAccount4, {
      from: userAccount5,
    });

    let resultAfter = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );

    let addressGetToken = await treeTokenInstance.ownerOf(1);

    assert.equal(addressGetToken, userAccount4, "token not true mint");
  });

  it("updateOwner should be fail because invalid access(just auction access for this function)", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await treeFactoryInstance
      .updateOwner(1, userAccount4, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  it("updateOwner should be fail because token mint for another user", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await treeFactoryInstance.updateOwner(1, userAccount4, {
      from: userAccount5,
    });

    await treeFactoryInstance.updateOwner(1, userAccount6, {
      from: userAccount5,
    }).should.be.rejected;
  });

  //////////////////////---------------------------------------------------------updateAvailability----------------------------------

  it("updateAvailability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await treeFactoryInstance.availability(treeId, 1, {
      from: userAccount5,
    });

    await treeFactoryInstance.updateAvailability(treeId, {
      from: userAccount5,
    });

    let resultAfter = await treeFactoryInstance.treeData.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );
  });

  it("updateAvailability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await treeFactoryInstance.availability(treeId, 1, {
      from: userAccount5,
    });

    await treeFactoryInstance
      .updateAvailability(treeId, {
        from: userAccount6,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  /////////////////////////////////////////////////////////mahdiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii////////////////////////////////////////////////////////////////////////

  // //--------------------------regularPlantTree test----------------------------------------------

  it("regularPlantTree should be success (Individual Planter)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addPlanter(arInstance, planter, deployerAccount);

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      planter,
      zeroAddress,
      zeroAddress
    );

    const eventTx = await treeFactoryInstance.regularPlantTree(
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: planter,
      }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

    let result = await treeFactoryInstance.regularTrees.call(0);

    assert.equal(result.treeSpecs, ipfsHash, "incorrect treeSpecs");

    assert.equal(
      Number(result.birthDate),
      Number(birthDate),
      "birthDate not true"
    );

    assert.equal(
      Number(result.countryCode),
      countryCode,
      "countryCode not true"
    );

    assert.equal(
      Number(result.plantDate),
      Number(plantDate),
      "plantDate not true"
    );

    assert.equal(result.planterAddress, planter, "planter address not true");

    let planterPlantedCount = (await planterInstance.planters.call(planter))
      .plantedCount;

    assert.equal(
      planterPlantedCount,
      1,
      "planter PlantedCount address not true"
    );

    truffleAssert.eventEmitted(eventTx, "RegularTreePlanted", (ev) => {
      return ev.treeId == 0;
    });
  });

  it("regularPlantTree should be success (Planter of organization)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const organizationAdmin = userAccount1;

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addPlanter(arInstance, planter, deployerAccount);
    await Common.addPlanter(arInstance, organizationAdmin, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      organizationAdmin,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      planter,
      zeroAddress,
      organizationAdmin
    );

    await planterInstance.acceptPlanterFromOrganization(planter, true, {
      from: organizationAdmin,
    });

    const eventTx = await treeFactoryInstance.regularPlantTree(
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: planter,
      }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

    let result = await treeFactoryInstance.regularTrees.call(0);

    assert.equal(result.treeSpecs, ipfsHash, "incorrect treeSpecs");

    assert.equal(
      Number(result.birthDate),
      Number(birthDate),
      "birthDate not true"
    );

    assert.equal(
      Number(result.countryCode),
      countryCode,
      "countryCode not true"
    );

    assert.equal(
      Number(result.plantDate),
      Number(plantDate),
      "plantDate not true"
    );

    assert.equal(result.planterAddress, planter, "planter address not true");

    let planterPlantedCount = (await planterInstance.planters.call(planter))
      .plantedCount;

    assert.equal(
      planterPlantedCount,
      1,
      "planter PlantedCount address not true"
    );

    truffleAssert.eventEmitted(eventTx, "RegularTreePlanted", (ev) => {
      return ev.treeId == 0;
    });
  });

  it("regularPlantTree should be rejected (organizationAdmin not accepted planter)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const organizationAdmin = userAccount1;

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addPlanter(arInstance, planter, deployerAccount);
    await Common.addPlanter(arInstance, organizationAdmin, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      organizationAdmin,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      planter,
      zeroAddress,
      organizationAdmin
    );

    await treeFactoryInstance.regularPlantTree(
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: planter,
      }
    ).should.be.rejected;
  });

  //---------------------------------------------verifyRegularPlant-----------------------------------------------

  it("verifyRegularPlant should be success(Admin Verify)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    let regularTree = await treeFactoryInstance.regularTrees.call(0);

    const eventTx = await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    let genTree = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTree.birthDate),
      Number(regularTree.birthDate),
      "birthDate not true update"
    );

    assert.equal(
      Number(genTree.plantDate),
      Number(regularTree.plantDate),
      "plantDate not true update"
    );

    assert.equal(
      genTree.treeSpecs,
      regularTree.treeSpecs,
      "treeSpecs not true update"
    );

    assert.equal(
      Number(genTree.countryCode),
      Number(regularTree.countryCode),
      "countryCode not true update"
    );

    assert.equal(
      genTree.planterId,
      regularTree.planterAddress,
      "planterAddress not true update"
    );

    assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

    assert.equal(
      Number(genTree.provideStatus),
      4,
      "provideStatus not true update"
    );

    truffleAssert.eventEmitted(eventTx, "RegularPlantVerified", (ev) => {
      return ev.treeId == 10001;
    });
  });

  it("2.verifyRegularPlant should be success", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const organizationAddress = userAccount1;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccessOrganization(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      organizationAddress,
      deployerAccount
    );

    let regularTree = await treeFactoryInstance.regularTrees.call(0);

    const eventTx = await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: organizationAddress,
    });

    let genTree = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTree.birthDate),
      Number(regularTree.birthDate),
      "birthDate not true update"
    );

    assert.equal(
      Number(genTree.plantDate),
      Number(regularTree.plantDate),
      "plantDate not true update"
    );

    assert.equal(
      genTree.treeSpecs,
      regularTree.treeSpecs,
      "treeSpecs not true update"
    );

    assert.equal(
      Number(genTree.countryCode),
      Number(regularTree.countryCode),
      "countryCode not true update"
    );

    assert.equal(
      genTree.planterId,
      regularTree.planterAddress,
      "planterAddress not true update"
    );

    assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

    assert.equal(
      Number(genTree.provideStatus),
      4,
      "provideStatus not true update"
    );

    truffleAssert.eventEmitted(eventTx, "RegularPlantVerified", (ev) => {
      return ev.treeId == 10001;
    });
  });

  it("3.verifyRegularPlant should be success(isVerified is false)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;
    const organizationAddress = userAccount1;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccessOrganization(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      organizationAddress,
      deployerAccount
    );

    const eventTx = await treeFactoryInstance.verifyRegularPlant(0, false, {
      from: organizationAddress,
    });

    let genTree = await treeFactoryInstance.treeData.call(10001);

    assert.equal(genTree.treeSpecs, "", "treeSpecs not true update");

    assert.equal(
      genTree.planterId,
      zeroAddress,
      "planterAddress not true update"
    );

    truffleAssert.eventEmitted(eventTx, "RegularPlantRejected", (ev) => {
      return ev.treeId == 0;
    });
  });

  it("verifyRegularPlant should be success(tree has owner)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    let regularTree = await treeFactoryInstance.regularTrees.call(0);

    // tree mint for userAccount4
    await Common.addTreeFactoryRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );
    await treeTokenInstance.safeMint(userAccount4, 10001, {
      from: deployerAccount,
    });

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    let genTree = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTree.birthDate),
      Number(regularTree.birthDate),
      "birthDate not true update"
    );

    assert.equal(
      Number(genTree.plantDate),
      Number(regularTree.plantDate),
      "plantDate not true update"
    );

    assert.equal(
      genTree.treeSpecs,
      regularTree.treeSpecs,
      "treeSpecs not true update"
    );

    assert.equal(
      Number(genTree.countryCode),
      Number(regularTree.countryCode),
      "countryCode not true update"
    );

    assert.equal(
      genTree.planterId,
      regularTree.planterAddress,
      "planterAddress not true update"
    );

    assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

    assert.equal(
      Number(genTree.provideStatus),
      0,
      "provideStatus not true update"
    );
  });

  it("verifyRegularPlant should be reject(Planter of tree can't verify update)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    let regularTree = await treeFactoryInstance.regularTrees.call(0);

    await treeFactoryInstance
      .verifyRegularPlant(0, true, {
        from: planter,
      })
      .should.be.rejectedWith(
        TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );
  });

  it("verifyRegularPlant should be reject(regularTree not exist)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance
      .verifyRegularPlant(1, true, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.REGULAR_TREE_NOT_EXIST);
  });

  it("verifyRegularPlant should be reject(Other planter can't verify update)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    let regularTree = await treeFactoryInstance.regularTrees.call(0);

    await treeFactoryInstance
      .verifyRegularPlant(0, true, {
        from: userAccount5,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);
  });

  it("Check lastRegularPlantedTree count", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    const startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
    const endTime = await Common.timeInitial(TimeEnumes.hours, 1);

    const treeId = 10001;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setTreeFactoryAddress(
      treeFactoryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.addTree(10001, ipfsHash, {
      from: deployerAccount,
    });

    await treeAuctionInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.addFundDistributionModel(
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

    await treasuryInstance.assignTreeFundDistributionModel(0, 100000, 0, {
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

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    let result1 = await treeFactoryInstance.lastRegularPlantedTree();

    assert.equal(result1, 10002, "1-lastRegularPlantedTree not true");

    for (let i = 10003; i < 10006; i++) {
      await treeFactoryInstance.addTree(i, ipfsHash, {
        from: deployerAccount,
      });

      await treeAuctionInstance.createAuction(
        i,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: deployerAccount }
      );
    }

    await treeFactoryInstance.regularPlantTree(
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: planter,
      }
    );

    await treeFactoryInstance.verifyRegularPlant(1, true, {
      from: deployerAccount,
    });

    let result2 = await treeFactoryInstance.lastRegularPlantedTree();

    assert.equal(result2, 10006, "2-lastRegularPlantedTree not true");
  });

  //-----------------------------mintRegularTrees---------------------------------

  it("mintRegularTrees should be successfully (tree not planted)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addRegularSellRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeFactoryInstance.mintRegularTrees(15000, userAccount4, {
      from: deployerAccount,
    });

    let addressGetToken = await treeTokenInstance.ownerOf(15001);

    assert.equal(addressGetToken, userAccount4, "address not true");
  });

  it("mintRegularTrees should be successfully(tree planted)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await Common.addRegularSellRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    let genTreeBefore = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTreeBefore.treeStatus),
      4,
      "treeStatusBefore not true update"
    );

    assert.equal(
      Number(genTreeBefore.provideStatus),
      4,
      "provideStatusBefore not true update"
    );

    await treeFactoryInstance.mintRegularTrees(10000, userAccount4, {
      from: deployerAccount,
    });

    let addressGetToken = await treeTokenInstance.ownerOf(10001);

    assert.equal(addressGetToken, userAccount4, "address not true");

    let genTreeAfter = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTreeAfter.treeStatus),
      4,
      "treeStatusAfter not true update"
    );

    assert.equal(
      Number(genTreeAfter.provideStatus),
      0,
      "provideStatusAfter not true update"
    );
  });

  it("3.mintRegularTrees should be successfully", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await Common.addRegularSellRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeFactoryInstance.mintRegularTrees(10000, userAccount4, {
      from: deployerAccount,
    });

    let addressGetToken = await treeTokenInstance.ownerOf(10001);

    assert.equal(addressGetToken, userAccount4, "address not true");

    await treeFactoryInstance.mintRegularTrees(10000, userAccount5, {
      from: deployerAccount,
    });

    let addressGetToken2 = await treeTokenInstance.ownerOf(10002);

    assert.equal(addressGetToken2, userAccount5, "2-address not true");

    let genTreeBefore = await treeFactoryInstance.treeData.call(10002);

    assert.equal(
      Number(genTreeBefore.treeStatus),
      0,
      "treeStatusBefore not true update"
    );

    assert.equal(
      Number(genTreeBefore.provideStatus),
      0,
      "provideStatusBefore not true update"
    );

    await treeFactoryInstance.mintRegularTrees(10002, userAccount6, {
      from: deployerAccount,
    });

    let addressGetToken3 = await treeTokenInstance.ownerOf(10003);

    assert.equal(addressGetToken3, userAccount6, "3-address not true");
  });

  it("mintRegularTrees should be fail(only RegularSellContract call)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .mintRegularTrees(9999, userAccount4, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_REGULAR_SELL);
  });

  // //----------------------------------------requestRegularTree---------------------------------

  it("requestRegularTree should be successfully", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await Common.addRegularSellRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    let genTreeBefore = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTreeBefore.treeStatus),
      4,
      "treeStatusBefore not true update"
    );

    assert.equal(
      Number(genTreeBefore.provideStatus),
      4,
      "provideStatusBefore not true update"
    );

    await treeFactoryInstance.requestRegularTree(10001, userAccount5, {
      from: deployerAccount,
    });

    let addressGetToken2 = await treeTokenInstance.ownerOf(10001);

    assert.equal(addressGetToken2, userAccount5, "address not true");

    let genTreeAfter = await treeFactoryInstance.treeData.call(10001);

    assert.equal(
      Number(genTreeAfter.treeStatus),
      4,
      "treeStatusAfter not true update"
    );

    assert.equal(
      Number(genTreeAfter.provideStatus),
      0,
      "provideStatusAfter not true update"
    );
  });

  it("requestRegularTree should be fail(only RegularSellContract call)", async () => {
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;
    const planter = userAccount2;

    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.regularPlantTreeSuccess(
      arInstance,
      treeFactoryInstance,
      planterInstance,
      ipfsHash,
      birthDate,
      countryCode,
      planter,
      deployerAccount
    );

    await treeFactoryInstance.verifyRegularPlant(0, true, {
      from: deployerAccount,
    });

    await treeFactoryInstance
      .requestRegularTree(10000, userAccount5, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_REGULAR_SELL);
  });

  it("requestRegularTree should be fail(tree must be planted)", async () => {
    await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await Common.addRegularSellRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeFactoryInstance
      .requestRegularTree(10000, userAccount5, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_MUST_BE_PLANTED);
  });

  /////////////////////////////////////////////////////////mahdiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii////////////////////////////////////////////////////////////////////////

  // ////////////////////////////////////////////////////////////////////////////////////////////////

  it("test gsn", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");

    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;

    await treeFactoryInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setWhitelistTarget(treeFactoryInstance.address, {
      from: deployerAccount,
    });

    await paymaster.setWhitelistTarget(planterInstance.address, {
      from: deployerAccount,
    });

    await paymaster.setRelayHub(relayHubAddress);

    await paymaster.setTrustedForwarder(forwarderAddress);

    web3.eth.sendTransaction({
      from: accounts[0],
      to: paymaster.address,
      value: web3.utils.toWei("1"),
    });

    origProvider = web3.currentProvider;

    conf = { paymasterAddress: paymaster.address };

    gsnProvider = await Gsn.RelayProvider.newProvider({
      provider: origProvider,
      config: conf,
    }).init();

    provider = new ethers.providers.Web3Provider(gsnProvider);

    let signerPlanter = provider.getSigner(3);
    let signerAmbassador = provider.getSigner(2);

    let contractPlanter = await new ethers.Contract(
      treeFactoryInstance.address,
      treeFactoryInstance.abi,
      signerPlanter
    );

    let contractAmbassador = await new ethers.Contract(
      treeFactoryInstance.address,
      treeFactoryInstance.abi,
      signerAmbassador
    );

    const treeId = 1;
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    await Common.joinOrganizationPlanter(
      planterInstance,
      userAccount1,
      zeroAddress,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      3,
      userAccount2,
      zeroAddress,
      userAccount1
    );

    await planterInstance.acceptPlanterFromOrganization(userAccount2, true, {
      from: userAccount1,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeFactoryInstance.address,
      deployerAccount
    );

    await treeFactoryInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await treeFactoryInstance.assignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    let planterBeforeBalance = await web3.eth.getBalance(userAccount2);

    let ambassadorBeforeBalance = await web3.eth.getBalance(userAccount1);

    await contractPlanter.plantTree(treeId, ipfsHash, birthDate, countryCode);

    await contractAmbassador.verifyPlant(treeId, true);

    let planterAfterBalance = await web3.eth.getBalance(userAccount2);

    let ambassadorAfterBalance = await web3.eth.getBalance(userAccount1);

    assert.equal(
      planterAfterBalance,
      planterBeforeBalance,
      "planter balance not equal"
    );

    assert.equal(
      ambassadorAfterBalance,
      ambassadorBeforeBalance,
      "ambassador balance not equal"
    );
  });
});
