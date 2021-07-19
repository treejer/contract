const AccessRestriction = artifacts.require("AccessRestriction");
const GenesisTree = artifacts.require("GenesisTree.sol");
const GBFactory = artifacts.require("GBFactory.sol");
const Tree = artifacts.require("Tree.sol");
const TreeAuction = artifacts.require("TreeAuction.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");
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
  TreesuryManagerErrorMsg,
} = require("./enumes");

const Math = require("./math");

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

    await genesisTreeInstance.setPlanterAddress(planterInstance.address, {
      from: deployerAccount,
    });
  });

  afterEach(async () => {});
  /////////////************************************ deploy successfully ****************************************//
  it("deploys successfully", async () => {
    const address = genesisTreeInstance.address;

    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });
  /////////////************************************ gb factory address ****************************************//

  it("set gb factory address", async () => {
    let tx = await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .setGBFactoryAddress(gbInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  /////////////************************************ treasury address ****************************************//

  it("set treasury address", async () => {
    let tx = await genesisTreeInstance.setTreasuryAddress(
      treasuryInstance.address,
      {
        from: deployerAccount,
      }
    );

    await genesisTreeInstance
      .setTreasuryAddress(treasuryInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  ////////////************************************ set planter address ****************************************//

  it("set planter address", async () => {
    let tx = await genesisTreeInstance.setPlanterAddress(
      planterInstance.address,
      {
        from: deployerAccount,
      }
    );

    await genesisTreeInstance
      .setPlanterAddress(planterInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  ////////////////////************************************ tree token address ****************************************//
  it("set tree token address", async () => {
    let tx = await genesisTreeInstance.setTreeTokenAddress(
      treeTokenInstance.address,
      { from: deployerAccount }
    );

    await genesisTreeInstance
      .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
  });
  /////////////////************************************ add tree ****************************************//

  it("add tree succussfuly", async () => {
    let tx = await genesisTreeInstance.addTree(1, ipfsHash, {
      from: deployerAccount,
    });

    let tx2 = await genesisTreeInstance.addTree(2, ipfsHash, {
      from: deployerAccount,
    });
  });

  it("add tree successfuly and check data to insert correct", async () => {
    let treeId1 = 1;

    await genesisTreeInstance.addTree(treeId1, ipfsHash, {
      from: deployerAccount,
    });

    let result1 = await genesisTreeInstance.genTrees.call(treeId1);

    assert.equal(result1.planterId, 0x0, "invalid planter id in add tree");
    assert.equal(Number(result1.treeType), 0, "incorrect treeType");
    assert.equal(Number(result1.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result1.treeStatus), 1, "tree status is incorrect");
    assert.equal(Number(result1.countryCode), 0, "incorrect country code");
    assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
    assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .addTree(treeId, ipfsHash, { from: deployerAccount })
      .should.be.rejectedWith(GenesisTreeErrorMsg.DUPLICATE_TREE);
  });
  ////////////////////////************************************ asign tree ****************************************//
  it("assign tree to planter succussfuly", async () => {
    let treeId = 1;

    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addAmbassador(arInstance, userAccount1, deployerAccount);
    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addGB(gbInstance, userAccount1, [userAccount2], "gb 1");

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    let result = await gbInstance.gbToPlanters.call(1, 0);

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });
  });
  it("check data to be correct after asigning tree to planter", async () => {
    let treeId = 1;

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount3,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    //asign to planter user2
    let asign1 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );
    let result1 = await genesisTreeInstance.genTrees.call(treeId);
    //////////////////////////////////////////////////////////////////////////

    assert.equal(
      result1.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(Number(result1.treeType), 0, "incorrect treeType");
    assert.equal(Number(result1.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result1.treeStatus), 1, "tree status is incorrect");
    assert.equal(Number(result1.countryCode), 0, "incorrect country code");
    assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
    assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
    assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");

    ////////////////////////////////////////////////////

    //asign to planter user3
    let asign2 = await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      userAccount3,
      { from: deployerAccount }
    );

    let result2 = await genesisTreeInstance.genTrees.call(treeId);

    ///////////////////////////////////////////////////////////////////////////

    assert.equal(
      result2.planterId,
      userAccount3,
      "invalid planter id in add tree"
    );
    assert.equal(Number(result2.treeType), 0, "incorrect treeType");
    assert.equal(Number(result2.provideStatus), 0, "incorrect provide status");
    assert.equal(Number(result2.treeStatus), 1, "tree status is incorrect");
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

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    let tree1 = await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, userAccount2, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await genesisTreeInstance
      .asignTreeToPlanter(invalidTreeId, userAccount2, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, zeroAddress, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ZERO_ADDRESS_PLANTER);

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, userAccount1, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, userAccount3, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_PLANTER);

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    ////////// try to plant tree and verify it to change staus to 2 and fail because it is planted
    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.plantTree(treeId, ipfsHash, 2, 4, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, userAccount2, { from: deployerAccount })
      .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_IS_PLANTED_BEFORE);
  });
  //////////////************************************ plant tree ****************************************//
  it("should plant tree successfuly when have planter", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );

    let tx = await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    truffleAssert.eventEmitted(tx, "TreePlanted", (ev) => {
      return ev.planter == userAccount2 && Number(ev.treeId) == treeId;
    });
  });

  it("check data to be correct after plant tree with planter", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

    const genesisTreeResult = await genesisTreeInstance.genTrees.call(treeId);
    /////////////////////////////////////////////////////////////////////////////////////////////

    assert.equal(
      genesisTreeResult.planterId,
      userAccount2,
      "invalid planter id in add tree"
    );
    assert.equal(Number(genesisTreeResult.treeType), 0, "incorrect treeType");

    assert.equal(
      Number(genesisTreeResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(genesisTreeResult.treeStatus),
      2,
      "tree status is incorrect"
    );

    assert.equal(
      Number(genesisTreeResult.countryCode),
      countryCode,
      "incorrect country code"
    );

    assert.equal(
      Number(genesisTreeResult.plantDate),
      Number(plantDate),
      "incorrect plant date"
    );

    assert.equal(
      Number(genesisTreeResult.birthDate),
      birthDate,
      "incorrect birth date"
    );

    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);

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
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);

    await Common.joinSimplePlanterFromGenesis(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress,
      genesisTreeInstance,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ZERO_ADDRESS_PLANTER);

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      userAccount2,

      { from: deployerAccount }
    );

    await genesisTreeInstance
      .plantTree(treeId, "", birthDate, countryCode, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_IPFS);

    await genesisTreeInstance
      .plantTree(invlidTreeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_GENESIS_TREE);

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
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

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
      );
  });

  it("should fail because of planting permision (1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount8,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance.plantTree(
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
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount6,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance.plantTree(
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
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });
    await genesisTreeInstance.asignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount8,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    ///////////////-------------- it must fail because planter status is not active

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);
    //////////////------------------ accept user to organiztion

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await genesisTreeInstance
      .plantTree(treeId2, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    ////////////////------------- update capacity to 5 and now an plant

    await planterInstance.updateCapacity(userAccount4, 5, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
  });

  it("should fail because of planting permision assign to type 3", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount3,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);
    //////////////-------------- call with user5 in same orgnization but not assignee

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount5,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    /////////////-------------- accept user account5 as planter to organization 3 but it should be fail because tree asigned to userAccount4 in organization 3

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount5,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    /////////////////////////////////------------ type 3 from other organization want to plant
    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    ///////////////////////////--------------------- accept user from other org and must be fail because not assingee
    await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
      from: userAccount6,
    });

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount7,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);
    /////////////////////----------------- plant with assignee and fail becuase not accpted by org

    await genesisTreeInstance
      .plantTree(treeId, ipfsHash, birthDate, countryCode, {
        from: userAccount4,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.PLANTING_PERMISSION_DENIED);

    //////////////////////// --------------------- accept and plant succusfully

    await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
      from: userAccount3,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
  });

  //////////************************************ verify plant ****************************************//
  it("should verify plant seccussfully", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const treeId3 = 3;
    const treeId4 = 4;
    const birthDate = parseInt(new Date().getTime() / 1000);
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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );
    //////////////////// verify type 1 by admin

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(
      treeId,
      userAccount2,

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
      from: deployerAccount,
    });

    truffleAssert.eventEmitted(tx1, "PlantVerified", (ev) => {
      return Number(ev.updateStatus) == 3 && Number(ev.treeId) == treeId;
    });

    //////////////////---------------- assing to type 2 anad verify by org

    await genesisTreeInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId2,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    const tx2 = await genesisTreeInstance.verifyPlant(treeId2, false, {
      from: userAccount4,
    });

    truffleAssert.eventEmitted(tx2, "PlantVerified", (ev) => {
      return Number(ev.updateStatus) == 2 && Number(ev.treeId) == treeId2;
    });

    ///////////////////////////---------------- assing to type 3 and  verify by org

    await genesisTreeInstance.addTree(treeId3, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId3, userAccount4, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId3,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );

    const tx3 = await genesisTreeInstance.verifyPlant(treeId3, true, {
      from: userAccount3,
    });

    truffleAssert.eventEmitted(tx3, "PlantVerified", (ev) => {
      return Number(ev.updateStatus) == 3 && Number(ev.treeId) == treeId3;
    });

    ///////////////////////////---------------- assing to type 3 and  verify by other planters in org
    await genesisTreeInstance.addTree(treeId4, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId4, userAccount4, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId4,
      ipfsHash,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );

    const tx4 = await genesisTreeInstance.verifyPlant(treeId4, true, {
      from: userAccount5,
    });

    truffleAssert.eventEmitted(tx4, "PlantVerified", (ev) => {
      return Number(ev.updateStatus) == 3 && Number(ev.treeId) == treeId4;
    });
  });
  it("check data to be correct after reject plant", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

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
      Number(genesisTreeResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(genesisTreeResult.treeStatus),
      2,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResult.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(genesisTreeResult.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResult.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    /////////////////////////////////////////////////////////////////////////////////////

    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);

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

    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
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
      Number(genesisTreeResultAfterVerify.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.treeStatus),
      1,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.birthDate),
      birthDate,
      "birthDate set inccorectly"
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
      Number(updateGenResultAfterVerify.updateStatus),
      2,
      "invlid updateGen update status"
    );
  });

  it("check data to be correct after verify plant", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

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
      Number(genesisTreeResult.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(genesisTreeResult.treeStatus),
      2,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResult.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(genesisTreeResult.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResult.birthDate),
      birthDate,
      "birthDate set inccorectly"
    );

    assert.equal(genesisTreeResult.treeSpecs, ipfsHash, "incorrect ipfs hash");

    //////////////////////////////
    let updateGenResult = await genesisTreeInstance.updateGenTrees.call(treeId);

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

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

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
      Number(genesisTreeResultAfterVerify.provideStatus),
      0,
      "incorrect provide status"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.treeStatus),
      3,
      "tree status is not ok"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.countryCode),
      countryCode,
      "country code set inccorectly"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.plantDate),
      Number(plantDate),
      "invalid plant date"
    );

    assert.equal(
      Number(genesisTreeResultAfterVerify.birthDate),
      birthDate,
      "birthDate set inccorectly"
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
      Number(updateGenResultAfterVerify.updateStatus),
      3,
      "invlid updateGen update status"
    );
  });
  it("should fail verify", async () => {
    const treeId = 1;
    const treeId2 = 2;
    const invalidTreeId = 100;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: deployerAccount })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
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
      .verifyPlant(invalidTreeId, true, { from: deployerAccount })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await genesisTreeInstance.verifyPlant(treeId, false, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyPlant(treeId, false, { from: userAccount1 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );

    await genesisTreeInstance.addTree(treeId2, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId2, userAccount3, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId2,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await genesisTreeInstance.verifyPlant(treeId2, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyPlant(treeId2, true, { from: userAccount4 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
      );
  });

  it("should fail verify plant when planterType=1", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
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

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount2 }
    );

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_BY_PLANTER);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount8 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });
  });
  it("should fail verify plant when planterType=2", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
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

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount3 }
    );

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    //////////////--------------- verify successfully

    await genesisTreeInstance.verifyPlant(treeId, true, { from: userAccount5 });
  });
  it("should fail verify plant when planterType=3", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
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

    await genesisTreeInstance.plantTree(
      treeId,
      updateIpfsHash1,
      birthDate,
      countryCode,
      { from: userAccount4 }
    );
    //////////////////----------- try to verify:fail

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    await genesisTreeInstance
      .verifyPlant(treeId, true, { from: userAccount5 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.VERIFY_PLANT_ACCESS);

    /////////////////------------- try to verify: success
    await genesisTreeInstance.verifyPlant(treeId, true, { from: userAccount3 });
  });

  /////////////************************************ more complex test for function asign and plant ****************************************//
  it("should fail asign tree and plant tree after verify", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await Common.joinSimplePlanter(
      planterInstance,
      1,
      userAccount2,
      zeroAddress,
      zeroAddress
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

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
      from: deployerAccount,
    });

    await genesisTreeInstance
      .asignTreeToPlanter(treeId, userAccount2, {
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

  it("should plant tree after reject tree", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });

    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    await Common.addPlanter(arInstance, userAccount3, deployerAccount);
    await Common.addPlanter(arInstance, userAccount4, deployerAccount);
    await Common.addPlanter(arInstance, userAccount5, deployerAccount);
    await Common.addPlanter(arInstance, userAccount7, deployerAccount);
    await Common.addPlanter(arInstance, userAccount8, deployerAccount);

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

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
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

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
      from: deployerAccount,
    });
  });

  // //  -----------------------------------------------------------updateTree test--------------------------------------------

  it("Should update tree work successfully", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    let tree = await genesisTreeInstance.genTrees.call(treeId);
    let travelTime = (Number(tree.treeStatus) * 3600 + 24 * 3600) * 2;

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    let tx = await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let result = await genesisTreeInstance.updateGenTrees.call(treeId);

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
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);
  });
  it("Should update tree do not work because update time does not reach (using update status)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    let tree = await genesisTreeInstance.genTrees.call(treeId);
    let travelTime = Number(tree.treeStatus) * 3600 + 24 * 3600 - 100;

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);
  });

  it("Should update tree reject (updateGen updateStaus is 1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.UPDATE_TREE_FAIL_INVALID_GENESIS_TREE_STATUS
      );
  });
  it("should update successfully after reject update and fail update after verify update because update time does not reach", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("0.1");

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount1,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
    );

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    let tree = await genesisTreeInstance.genTrees.call(treeId);
    let travelTime = Number(tree.treeStatus) * 3600 + 24 * 3600 + 100;

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx = await genesisTreeInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx2 = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);
  });

  it("Should be fail because invalid address try to update", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount3,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
      );
  });

  it("updateTree should be fail because tree not planted", async () => {
    let treeId = 1;

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
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

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_NOT_PLANTED);
  });

  it("should fail update after two time update and verify", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount1,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
    );

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    let tree = await genesisTreeInstance.genTrees.call(treeId);
    let travelTime = Number(tree.treeStatus) * 3600 + 25 * 3600;

    await Common.travelTime(TimeEnumes.seconds, travelTime);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 86400);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, { from: userAccount2 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 86300);

    await genesisTreeInstance
      .updateTree(treeId, ipfsHash, {
        from: userAccount2,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.UPDATE_TIME_NOT_REACH);

    await Common.travelTime(TimeEnumes.seconds, 100);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });
  });

  ////////////////////-----------------------------------------------------------verifyUpdate test--------------------------------------------

  it("Should verify update work seccussfully when verify true by Admin (no fund tree)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let resultBeforeUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
    let resultBeforeGT = await genesisTreeInstance.genTrees.call(treeId);

    let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let now = await Common.timeInitial(TimeEnumes.seconds, 0);
    let resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
    let resultAfterGT = await genesisTreeInstance.genTrees.call(treeId);
    let pFund = await treasuryInstance.planterFunds.call(treeId);
    let planterPaid = await treasuryInstance.plantersPaid.call(treeId);

    assert.equal(resultAfterGT.treeSpecs, resultBeforeUGT.updateSpecs);

    assert.equal(
      resultAfterGT.treeStatus.toNumber(),
      parseInt(
        (Number(now) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId && ev.updateStatus == 3;
    });

    assert.equal(Number(pFund), 0, "no fund beacuse tree fund did not call");

    assert.equal(planterPaid, 0, "planter fund did not call");
  });

  it("Should verify update work seccussfully when verify true by Admin (fund planter) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund =
      (Number(fundTreeAmount) * fundsPercent.planterFund) / 10000;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
    let resultBeforeGT = await genesisTreeInstance.genTrees.call(treeId);

    let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(
      treeId
    );

    const resultAfterGT = await genesisTreeInstance.genTrees.call(treeId);

    const now = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify = await treasuryInstance.plantersPaid.call(
      treeId
    );

    const expectedPaid = parseInt(
      (planterTotalFund * Number(resultAfterGT.treeStatus)) / 25920
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
        (Number(now) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId && ev.updateStatus == 3;
    });
  });

  it("Should verify update work seccussfully when verify after more 3 years true by Admin (fund planter ) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };

    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund =
      (Number(fundTreeAmount) * fundsPercent.planterFund) / 10000;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
    let resultBeforeGT = await genesisTreeInstance.genTrees.call(treeId);

    let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(
      treeId
    );

    const resultAfterGT = await genesisTreeInstance.genTrees.call(treeId);

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
        (Number(now) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId && ev.updateStatus == 3;
    });

    ////////////////////// update after 1 year and verify ///////////////////////////

    await Common.travelTime(TimeEnumes.seconds, 31104000); //31104000 is equal to 1 year

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    const resultAfterGT2 = await genesisTreeInstance.genTrees.call(treeId);

    const nowAfterVerify = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify2 = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      resultAfterGT2.treeStatus.toNumber(),
      parseInt(
        (Number(nowAfterVerify) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    assert.equal(
      Number(planterPaidAfterVerify2),
      planterTotalFund,
      "planter paid after verify is not ok"
    );
  });

  it("Should verify update work seccussfully when verify true by Admin (no fund planter first because there is no token owner exist and fund planter in try 2 beacuse token owner setted) ", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    const planterTotalFund =
      (Number(fundTreeAmount) * fundsPercent.planterFund) / 10000;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    ///////////////////// fund tree without tree token owner ////////////////////////////////

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await treasuryInstance.addFundDistributionModel(
      fundsPercent.planterFund,
      fundsPercent.gbFund,
      fundsPercent.treeResearch,
      fundsPercent.localDevelop,
      fundsPercent.rescueFund,
      fundsPercent.treejerDevelop,
      fundsPercent.otherFund1,
      fundsPercent.otherFund2,
      {
        from: deployerAccount,
      }
    );

    await treasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
      from: deployerAccount,
    });

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await genesisTreeInstance.availability(treeId, 1, {
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    let resultBeforeUGT = await genesisTreeInstance.updateGenTrees.call(treeId);
    let resultBeforeGT = await genesisTreeInstance.genTrees.call(treeId);

    let tx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(treeId);

    let resultAfterGT = await genesisTreeInstance.genTrees.call(treeId);

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
        (Number(now) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 3);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId && ev.updateStatus == 3;
    });

    /////////////////// verify 2 and set token owner ////////////////////////

    await genesisTreeInstance.updateOwner(treeId, userAccount8, {
      from: userAccount5,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800); //172800 is equal to 48 hours

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    let resultAfterGT2 = await genesisTreeInstance.genTrees.call(treeId);

    const nowAfterVerify2 = await Common.timeInitial(TimeEnumes.seconds, 0);

    const planterPaidAfterVerify2 = await treasuryInstance.plantersPaid.call(
      treeId
    );

    assert.equal(
      resultAfterGT2.treeStatus.toNumber(),
      parseInt(
        (Number(nowAfterVerify2) - Number(resultBeforeGT.plantDate)) / 3600,
        "tree status update does not match"
      )
    );

    let expectedPaid = parseInt(
      (planterTotalFund * Number(resultAfterGT2.treeStatus)) / 25920
    );

    assert.equal(
      Number(planterPaidAfterVerify2),
      expectedPaid,

      "planter paid after verify is not ok"
    );
  });

  it("Should verify update work seccussfully when verify false by Admin", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let tx = await genesisTreeInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    let resultAfterUGT = await genesisTreeInstance.updateGenTrees.call(treeId);

    assert.equal(resultAfterUGT.updateStatus.toNumber(), 2);

    truffleAssert.eventEmitted(tx, "UpdateVerified", (ev) => {
      return ev.treeId == treeId && ev.updateStatus == 2;
    });
  });

  it("should verify by planter in organization where organiation is planter (planterType=2) and fail otherwise", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount3, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount3,
      }
    );

    await genesisTreeInstance.verifyPlant(treeId, true, {
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

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount3,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    const verifyTx = await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: userAccount4,
    });

    truffleAssert.eventEmitted(verifyTx, "UpdateVerified", (ev) => {
      return Number(ev.treeId) == treeId;
    });
  });
  it("should verify by planter in organization where organiation is planter in organization (planterType=3)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount4,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount5 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
      from: userAccount3,
    });

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: userAccount5,
    });
  });

  it("should verify by organization where organiation is planter in organization (planterType=3)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount4, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount4,
      }
    );

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount4,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount7 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: userAccount3,
    });
  });

  it("should verify by admin where planter is individual (planterType=1)", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addPlanter(arInstance, userAccount1, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount2, deployerAccount); //individual
    await Common.addPlanter(arInstance, userAccount3, deployerAccount); //organization1
    await Common.addPlanter(arInstance, userAccount4, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount5, deployerAccount); //organizationPlanter1
    await Common.addPlanter(arInstance, userAccount6, deployerAccount); //organization2
    await Common.addPlanter(arInstance, userAccount7, deployerAccount); //organizationPlanter2
    await Common.addPlanter(arInstance, userAccount8, deployerAccount); //organizationPlanter2

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await genesisTreeInstance.plantTree(
      treeId,
      ipfsHash,
      birthDate,
      countryCode,
      {
        from: userAccount2,
      }
    );

    await genesisTreeInstance.verifyPlant(treeId, true, {
      from: deployerAccount,
    });

    await Common.travelTime(TimeEnumes.seconds, 172800);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount1 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount3 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount4 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount6 })
      .should.be.rejectedWith(GenesisTreeErrorMsg.ADMIN_ABBASSADOR_PLANTER);

    await genesisTreeInstance
      .verifyUpdate(treeId, true, { from: userAccount2 })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
      );

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });
  });

  it("Should be fail because update status is not pending when verify is true", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
    );

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyUpdate(treeId, true, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
      );
  });

  it("Should be fail because update status is not pending when verfiy is false", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;
    const fundsPercent = {
      planterFund: 5000,
      gbFund: 1000,
      treeResearch: 1000,
      localDevelop: 1000,
      rescueFund: 1000,
      treejerDevelop: 1000,
      otherFund1: 0,
      otherFund2: 0,
    };
    const fundTreeAmount = web3.utils.toWei("1");

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successFundTree(
      arInstance,
      deployerAccount,
      genesisTreeInstance.address,
      userAccount7,
      treasuryInstance,
      treeId,
      fundsPercent,
      fundTreeAmount,
      userAccount8,
      genesisTreeInstance
    );

    await Common.travelTime(TimeEnumes.seconds, 2592000);

    await genesisTreeInstance.updateTree(treeId, ipfsHash, {
      from: userAccount2,
    });

    await genesisTreeInstance.verifyUpdate(treeId, false, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, false, {
        from: deployerAccount,
      })
      .should.be.rejectedWith(
        GenesisTreeErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
      );
  });

  it("verifyUpdate should be fail because tree not planted", async () => {
    let treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
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

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
      from: deployerAccount,
    });

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
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

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await treasuryInstance.setPlanterContractAddress(planterInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyUpdate(treeId, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.TREE_NOT_PLANTED);
  });

  it("Should be fail because function is pause", async () => {
    await arInstance.pause({
      from: deployerAccount,
    });

    await genesisTreeInstance
      .verifyUpdate(1, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(CommonErrorMsg.PAUSE);
  });

  it("Should be fail because tree id not exist", async () => {
    await genesisTreeInstance
      .verifyUpdate(10, true, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
  });

  ////////////////--------------------------------------------------availability test----------------------------------------

  it("availability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreasuryAddress(treasuryInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,

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

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    let resultBefore = await genesisTreeInstance.genTrees.call(treeId);

    let lastProvideStatus = await genesisTreeInstance.availability(1, 1, {
      from: userAccount5,
    });

    let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      resultBefore.provideStatus.toNumber() + 1,
      "provideStatus not true update"
    );
  });

  it("availability should be fail because invalid access(just auction access for this function)", async () => {
    await genesisTreeInstance
      .availability(1, 1, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  it("availability should be fail because invalid tree", async () => {
    await Common.addAuctionRole(arInstance, userAccount1, deployerAccount);

    await genesisTreeInstance
      .availability(1, 1, {
        from: userAccount1,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.INVALID_TREE);
  });

  it("availability should be fail because tree has owner", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await Common.addGenesisTreeRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await treeTokenInstance.safeMint(userAccount2, treeId, {
      from: deployerAccount,
    });

    let balance = await web3.eth.getBalance(userAccount1);

    let resultBefore = await genesisTreeInstance.genTrees.call(treeId);

    assert.equal(
      resultBefore.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );

    await genesisTreeInstance.availability(1, 3, {
      from: userAccount1,
    });

    let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );
  });

  /////////////////-------------------------------------------------------updateOwner test-------------------------------------------------------------

  it("updateOwner should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.availability(1, 1, {
      from: userAccount5,
    });

    await genesisTreeInstance.updateOwner(1, userAccount4, {
      from: userAccount5,
    });

    let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

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
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance
      .updateOwner(1, userAccount4, {
        from: userAccount5,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  it("updateOwner should be fail because token mint for another user", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await Common.addAuctionRole(arInstance, userAccount5, deployerAccount);

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.updateOwner(1, userAccount4, {
      from: userAccount5,
    });

    await genesisTreeInstance.updateOwner(1, userAccount6, {
      from: userAccount5,
    }).should.be.rejected;
  });

  //////////////////////---------------------------------------------------------updateAvailability----------------------------------

  it("updateAvailability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.availability(treeId, 1, {
      from: userAccount5,
    });

    await genesisTreeInstance.updateAvailability(treeId, {
      from: userAccount5,
    });

    let resultAfter = await genesisTreeInstance.genTrees.call(treeId);

    assert.equal(
      resultAfter.provideStatus.toNumber(),
      0,
      "provideStatus not true update"
    );
  });

  it("updateAvailability should be success", async () => {
    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
    const countryCode = 2;

    await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });

    await Common.successPlant(
      genesisTreeInstance,
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

    await genesisTreeInstance.availability(treeId, 1, {
      from: userAccount5,
    });

    await genesisTreeInstance
      .updateAvailability(treeId, {
        from: userAccount6,
      })
      .should.be.rejectedWith(GenesisTreeErrorMsg.CALLER_IS_NOT_AUCTION);
  });

  ///////////////////////////////////////////////////////////mahdiiiiiiiiiiiiiiiiiiii///////////////////////////////////////////////

  it("test gsn", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");

    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;

    await genesisTreeInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });

    let paymaster = await WhitelistPaymaster.new(arInstance.address);

    await paymaster.setWhitelistTarget(genesisTreeInstance.address, {
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
      genesisTreeInstance.address,
      genesisTreeInstance.abi,
      signerPlanter
    );

    let contractAmbassador = await new ethers.Contract(
      genesisTreeInstance.address,
      genesisTreeInstance.abi,
      signerAmbassador
    );

    const treeId = 1;
    const birthDate = parseInt(new Date().getTime() / 1000);
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

    await Common.addGenesisTreeRole(
      arInstance,
      genesisTreeInstance.address,
      deployerAccount
    );

    await genesisTreeInstance.addTree(treeId, ipfsHash, {
      from: deployerAccount,
    });

    await genesisTreeInstance.asignTreeToPlanter(treeId, userAccount2, {
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
