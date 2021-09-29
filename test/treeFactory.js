const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactory.sol");
const Tree = artifacts.require("Tree.sol");
const Auction = artifacts.require("Auction.sol");

const Planter = artifacts.require("Planter.sol");
const Dai = artifacts.require("Dai.sol");
const Allocation = artifacts.require("Allocation.sol");
const PlanterFund = artifacts.require("PlanterFund.sol");
const DaiFunds = artifacts.require("DaiFunds.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  AuctionErrorMsg,
  TreasuryManagerErrorMsg,
} = require("./enumes");

const Math = require("./math");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/provider");
const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("TreeFactory", (accounts) => {
  let treeFactoryInstance;
  let treeTokenInstance;

  let arInstance;

  let planterInstance;
  let allocationInstance;
  let planterFundInstnce;
  let daiFundInstance;
  let daiInstance;
  let startTime;
  let endTime;

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

  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const ipfsHash = "some ipfs hash here";
  const updateIpfsHash1 = "some update ipfs hash here";

  describe("deploy and set addresses", () => {
    beforeEach(async () => {
      arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await deployProxy(
        TreeFactory,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      planterFundInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

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

      await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });
    });

    it("deploys successfully and check addresses", async () => {
      const address = treeFactoryInstance.address;

      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      ///////////////---------------------------------set trust forwarder address--------------------------------------------------------
      await treeFactoryInstance
        .setTrustedForwarder(userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeFactoryInstance
        .setTrustedForwarder(zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      await treeFactoryInstance.setTrustedForwarder(userAccount2, {
        from: deployerAccount,
      });

      assert.equal(
        userAccount2,
        await treeFactoryInstance.trustedForwarder(),
        "address set incorrect"
      );

      /////////////------------------------------------ setPlanterFund address ----------------------------------------//

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance
        .setPlanterFundAddress(planterFundInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      ////////////------------------------------------ set planter address ----------------------------------------//

      await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance
        .setPlanterAddress(planterInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      ////////////////////------------------------------------ tree token address ----------------------------------------//
      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance
        .setTreeTokenAddress(treeTokenInstance.address, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);
    });
  });

  describe("just treeFactory methods", () => {
    beforeEach(async () => {
      arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await deployProxy(
        TreeFactory,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );
    });

    ////////////////////------------------------------------ test set treeUpdateInterval  ----------------------------------------//

    it("set treeUpdateInterval", async () => {
      let dayBefore = await treeFactoryInstance.treeUpdateInterval();

      await treeFactoryInstance
        .setUpdateInterval(10, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      let tx = await treeFactoryInstance.setUpdateInterval(10, {
        from: dataManager,
      });

      let dayAfter = await treeFactoryInstance.treeUpdateInterval();

      assert.equal(dayBefore, 7 * 24 * 60 * 60, "dayBefore not true");
      assert.equal(dayAfter, 10 * 24 * 60 * 60, "dayAfter not true");

      truffleAssert.eventEmitted(tx, "TreeUpdateIntervalChanged");
    });
    /////////////////------------------------------------ add tree ----------------------------------------//

    it("add tree succussfuly and fail in invalid situation", async () => {
      let treeId = 1;

      await treeFactoryInstance
        .listTree(treeId, ipfsHash, { from: userAccount1 })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      const eventTx = await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx, "TreeListed", (ev) => {
        return ev.treeId == treeId;
      });

      let result1 = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        result1.planterAddress,
        0x0,
        "invalid planter id in add tree"
      );
      assert.equal(Number(result1.species), 0, "incorrect treeType");
      assert.equal(Number(result1.saleType), 0, "incorrect provide status");
      assert.equal(Number(result1.treeStatus), 2, "tree status is incorrect"); //updated
      assert.equal(Number(result1.countryCode), 0, "incorrect country code");
      assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
      assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
      assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");

      //////////// fail to add tree

      await treeFactoryInstance
        .listTree(treeId, ipfsHash, { from: dataManager })
        .should.be.rejectedWith(TreeFactoryErrorMsg.DUPLICATE_TREE);
    });

    ///////////////////////------------------ test updateTreeSpecs -----------------
    it("should updateTreeSpecs succeusfully and fail in invalid accesses", async () => {
      const treeId = 0;
      const newIpfs = "new ipfs hash";

      await Common.addBuyerRank(arInstance, dataManager, deployerAccount); // give buyer rank role to data manager

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      const treeData1 = await treeFactoryInstance.trees.call(treeId);

      assert.equal(treeData1.treeSpecs, ipfsHash, "ipfs hash is not correct");

      const eventTx = await treeFactoryInstance.updateTreeSpecs(
        treeId,
        newIpfs,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "TreeSpecsUpdated", (ev) => {
        return Number(ev.treeId) == treeId && ev.treeSpecs == newIpfs;
      });

      const treeData2 = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        treeData2.treeSpecs,
        newIpfs,
        "new ipfs hash is not correct"
      );

      await treeFactoryInstance
        .updateTreeSpecs(treeId, newIpfs, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_BUYER_RANK);
    });
  });

  describe("add tree,assign and plant tree,verify plant", () => {
    beforeEach(async () => {
      arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await deployProxy(
        TreeFactory,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

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

      await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });
    });
    //////////// tests

    ////////////////////////------------------------------------ asign tree ----------------------------------------//

    it("asign tree to planter and fail in invalid situation", async () => {
      let treeId = 1;

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
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

      ////// ---------- fail to assign not data manager

      await treeFactoryInstance
        .assignTree(treeId, userAccount2, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_DATA_MANAGER);

      //asign to planter user2
      let asign1 = await treeFactoryInstance.assignTree(
        treeId,
        userAccount2,

        { from: dataManager }
      );

      truffleAssert.eventEmitted(asign1, "TreeAssigned", (ev) => {
        return ev.treeId == treeId;
      });

      let result1 = await treeFactoryInstance.trees.call(treeId);
      //////////////////////////////////////////////////////////////////////////

      assert.equal(
        result1.planterAddress,
        userAccount2,
        "invalid planter id in add tree"
      );
      assert.equal(Number(result1.species), 0, "incorrect treeType");
      assert.equal(Number(result1.saleType), 0, "incorrect provide status");
      assert.equal(Number(result1.treeStatus), 2, "tree status is incorrect"); //updated
      assert.equal(Number(result1.countryCode), 0, "incorrect country code");
      assert.equal(Number(result1.plantDate), 0, "incorrect plant date");
      assert.equal(Number(result1.birthDate), 0, "incorrect birth date");
      assert.equal(result1.treeSpecs, ipfsHash, "incorrect ipfs hash");

      ////////////////////////////////////////////////////

      //asign to planter user3
      let asign2 = await treeFactoryInstance.assignTree(treeId, userAccount3, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(asign2, "TreeAssigned", (ev) => {
        return ev.treeId == treeId;
      });

      let result2 = await treeFactoryInstance.trees.call(treeId);

      ///////////////////////////////////////////////////////////////////////////

      assert.equal(
        result2.planterAddress,
        userAccount3,
        "invalid planter id in add tree"
      );
      assert.equal(Number(result2.species), 0, "incorrect treeType");
      assert.equal(Number(result2.saleType), 0, "incorrect provide status");
      assert.equal(Number(result2.treeStatus), 2, "tree status is incorrect"); //updated
      assert.equal(Number(result2.countryCode), 0, "incorrect country code");
      assert.equal(Number(result2.plantDate), 0, "incorrect plant date");
      assert.equal(Number(result2.birthDate), 0, "incorrect birth date");
      assert.equal(result2.treeSpecs, ipfsHash, "incorrect ipfs hash");
      ///////////////// ----------------- fail to assign

      await treeFactoryInstance
        .assignTree(10, userAccount2, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);

      ////////// try to plant tree and verify it to change staus to 2 and fail because it is planted
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.plantAssignedTree(treeId, ipfsHash, 2, 4, {
        from: userAccount3,
      });

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .assignTree(treeId, userAccount2, { from: dataManager })
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
      await treeFactoryInstance.listTree(treeId1, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId2, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId3, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId4, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId5, ipfsHash, {
        from: dataManager,
      });
      ///////////////////////// -------------------- add treeFactory role
      await Common.addTreejerContractRole(
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
        dataManager
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
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId1, userAccount1, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId1,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount1 }
      );

      await treeFactoryInstance
        .assignTree(treeId2, userAccount1, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER
        );

      ///////////////////////// test userAccount3 (orgizationPlanter) --------------
      await treeFactoryInstance
        .assignTree(treeId2, userAccount3, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER
        );

      await planterInstance.updateCapacity(userAccount3, 1, {
        from: dataManager,
      });

      await planterInstance.acceptPlanterFromOrganization(userAccount3, true, {
        from: userAccount2,
      });

      await treeFactoryInstance.assignTree(treeId2, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId2,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );

      await treeFactoryInstance
        .assignTree(treeId3, userAccount3, { from: dataManager })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER
        );

      /////////////////---------------------- assign tree to userAccount2(orgnization) (unlimited assign)
      await treeFactoryInstance.assignTree(treeId3, userAccount2, {
        from: dataManager,
      });

      await planterInstance.updateCapacity(userAccount2, 1, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId3,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount2 }
      );

      await treeFactoryInstance.assignTree(treeId4, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId5, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId4, ipfsHash, birthDate, countryCode, {
          from: userAccount2,
        })

        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await planterInstance.updateCapacity(userAccount3, 2, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId4,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
    });

    //////////////------------------------------------ plant tree ----------------------------------------//

    it("plant tree and fail in invail situation", async () => {
      const treeId = 1;
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

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

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(10, updateIpfsHash1, birthDate, countryCode, {
          from: userAccount2,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
        );

      await treeFactoryInstance
        .plantAssignedTree(treeId, updateIpfsHash1, birthDate, countryCode, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      const tx = await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount2 }
      );

      truffleAssert.eventEmitted(tx, "AssignedTreePlanted", (ev) => {
        return Number(ev.treeId) == treeId;
      });

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      const treeFactoryResult = await treeFactoryInstance.trees.call(treeId);
      /////////////////////////////////////////////////////////////////////////////////////////////

      assert.equal(
        treeFactoryResult.planterAddress,
        userAccount2,
        "invalid planter id in add tree"
      );
      assert.equal(Number(treeFactoryResult.species), 0, "incorrect treeType");

      assert.equal(
        Number(treeFactoryResult.saleType),
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

      assert.equal(
        treeFactoryResult.treeSpecs,
        ipfsHash,
        "incorrect ipfs hash"
      );

      /////////////////////////////////////////////////////////////////////////////////////////////

      let updateGenResult = await treeFactoryInstance.treeUpdates.call(treeId);

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

      await treeFactoryInstance
        .plantAssignedTree(treeId, ipfsHash, birthDate, countryCode, {
          from: userAccount2,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
        );
    });

    it("should fil because of planting permision", async () => {
      const treeId1 = 1;
      const treeId2 = 2;
      const treeId3 = 3;
      const treeId4 = 4;
      const treeId5 = 5;

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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      //////////// ------------------- should fail because of planting permision (1)
      await treeFactoryInstance.listTree(treeId1, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId1, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId1, ipfsHash, birthDate, countryCode, {
          from: userAccount1,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId1, ipfsHash, birthDate, countryCode, {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId1, ipfsHash, birthDate, countryCode, {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId1, ipfsHash, birthDate, countryCode, {
          from: userAccount8,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance.plantAssignedTree(
        treeId1,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
      );
      /////////// -------------- should fail because of planting permision (assign to type 2 and test with type 1 and type 2)

      await treeFactoryInstance.listTree(treeId2, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId2, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId2, ipfsHash, birthDate, countryCode, {
          from: userAccount1,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId2, ipfsHash, birthDate, countryCode, {
          from: userAccount6,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance.plantAssignedTree(
        treeId2,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount3,
        }
      );

      ////////////////// --------------- should fail because of planting permision (assign to type 2 and test with type 3)

      ///////////////////------------------ update planter usrAccount4 capacity to 1 so he can plant just 1 tree

      await planterInstance.updateCapacity(userAccount4, 1, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId3, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(treeId4, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId3, userAccount3, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTree(treeId4, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId3, ipfsHash, birthDate, countryCode, {
          from: userAccount7,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId3, ipfsHash, birthDate, countryCode, {
          from: userAccount8,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      ///////////////-------------- it must fail because planter status is not active

      await treeFactoryInstance
        .plantAssignedTree(treeId3, ipfsHash, birthDate, countryCode, {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
      //////////////------------------ accept user to organiztion

      await planterInstance.acceptPlanterFromOrganization(userAccount4, true, {
        from: userAccount3,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId3,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount4,
        }
      );

      await treeFactoryInstance
        .plantAssignedTree(treeId4, ipfsHash, birthDate, countryCode, {
          from: userAccount4,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      ////////////////------------- update capacity to 5 and now an plant

      await planterInstance.updateCapacity(userAccount4, 5, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId4,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount4 }
      );
      ///////////////// -------------------------- should fail because of planting permision assign to type 3

      await treeFactoryInstance.listTree(treeId5, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId5, userAccount4, {
        from: dataManager,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount1,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount3,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
      //////////////-------------- call with user5 in same orgnization but not assignee

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount5,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      /////////////-------------- accept user account5 as planter to organization 3 but it should be fail because tree asigned to userAccount4 in organization 3

      await planterInstance.acceptPlanterFromOrganization(userAccount5, true, {
        from: userAccount3,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount5,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      /////////////////////////////////------------ type 3 from other organization want to plant
      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount7,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      ///////////////////////////--------------------- accept user from other org and must be fail because not assignee
      await planterInstance.acceptPlanterFromOrganization(userAccount7, true, {
        from: userAccount6,
      });

      await treeFactoryInstance
        .plantAssignedTree(treeId5, ipfsHash, birthDate, countryCode, {
          from: userAccount7,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
      /////////////////////----------------- plant with assignee and fail becuase not accpted by org

      //////////////////////// ---------------------  plant succusfully

      await treeFactoryInstance.plantAssignedTree(
        treeId5,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount4 }
      );
    });

    //////////------------------------------------ verify plant ----------------------------------------//
    it("should verify plant and reject seccussfully and fail in invaid situation", async () => {
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

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: dataManager })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
      );
      ////////////////// ---------------------- check data before reject

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
      let treeFactoryResult = await treeFactoryInstance.trees.call(treeId);

      await treeFactoryInstance
        .verifyAssignedTree(invalidTreeId, true, { from: dataManager })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

      ///////////////////////////////////////////////////////////////////////////////////

      assert.equal(
        treeFactoryResult.planterAddress,
        userAccount2,
        "plnter id is incorrect"
      );

      assert.equal(
        Number(treeFactoryResult.saleType),
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

      assert.equal(
        treeFactoryResult.treeSpecs,
        ipfsHash,
        "incorrect ipfs hash"
      );

      /////////////////////////////////////////////////////////////////////////////////////

      let updateGenResult = await treeFactoryInstance.treeUpdates.call(treeId);

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

      //////////////////////// -------------------------- reject
      await treeFactoryInstance.verifyAssignedTree(treeId, false, {
        from: dataManager,
      });

      await treeFactoryInstance
        .verifyAssignedTree(treeId, false, { from: userAccount1 })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );
      ///////////////////// check data after reject

      let treeFactoryResultAfterVerify = await treeFactoryInstance.trees.call(
        treeId
      );

      /////////////////////////////////////////////////////////////////////

      assert.equal(
        treeFactoryResultAfterVerify.planterAddress,
        userAccount2,
        "plnter id is incorrect"
      );

      assert.equal(
        Number(treeFactoryResultAfterVerify.saleType),
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

      let updateGenResultAfterVerify =
        await treeFactoryInstance.treeUpdates.call(treeId);

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

      //////////////////////////////////////// ------------- add tree2
      await treeFactoryInstance.listTree(treeId2, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId2, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId2,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );
      //////////////////// ---------------- check data before verify

      const plantDate2 = await Common.timeInitial(TimeEnumes.seconds, 0);
      let treeFactoryResult2 = await treeFactoryInstance.trees.call(treeId2);

      assert.equal(
        treeFactoryResult2.planterAddress,
        userAccount3,
        "plnter id is incorrect"
      );

      assert.equal(
        Number(treeFactoryResult2.saleType),
        0,
        "incorrect provide status"
      );

      assert.equal(
        Number(treeFactoryResult2.treeStatus),
        3,
        "tree status is not ok"
      ); //updated

      assert.equal(
        Number(treeFactoryResult2.countryCode),
        countryCode,
        "country code set inccorectly"
      );

      assert.equal(
        Number(treeFactoryResult2.plantDate),
        Number(plantDate2),
        "invalid plant date"
      );

      assert.equal(
        Number(treeFactoryResult2.birthDate),
        birthDate,
        "birthDate set inccorectly"
      );

      assert.equal(
        treeFactoryResult2.treeSpecs,
        ipfsHash,
        "incorrect ipfs hash"
      );

      //////////////////////////////
      let updateGenResult2 = await treeFactoryInstance.treeUpdates.call(
        treeId2
      );

      assert.equal(
        updateGenResult2.updateSpecs,
        updateIpfsHash1,
        "ipfs hash set inccorect"
      );

      assert.equal(
        Number(updateGenResult2.updateStatus),
        1,
        "invlid updateGen update status"
      );

      await treeFactoryInstance.verifyAssignedTree(treeId2, true, {
        from: dataManager,
      });
      ////////////// ---------------- check data after verify
      let treeFactoryResultAfterVerify2 = await treeFactoryInstance.trees.call(
        treeId2
      );

      /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      assert.equal(
        treeFactoryResultAfterVerify2.planterAddress,
        userAccount3,
        "plnter id is incorrect"
      );

      assert.equal(
        Number(treeFactoryResultAfterVerify2.saleType),
        0,
        "incorrect provide status"
      );

      assert.equal(
        Number(treeFactoryResultAfterVerify2.treeStatus),
        4,
        "tree status is not ok"
      ); //updated

      assert.equal(
        Number(treeFactoryResultAfterVerify2.countryCode),
        countryCode,
        "country code set inccorectly"
      );

      assert.equal(
        Number(treeFactoryResultAfterVerify2.plantDate),
        Number(plantDate2),
        "invalid plant date"
      );

      assert.equal(
        Number(treeFactoryResultAfterVerify2.birthDate),
        birthDate,
        "birthDate set inccorectly"
      );

      assert.equal(
        treeFactoryResultAfterVerify2.treeSpecs,
        updateIpfsHash1,
        "incorrect ipfs hash"
      );

      ///////////////////////////////////////////////////////////////////////////////////

      const updateGenResultAfterVerify2 =
        await treeFactoryInstance.treeUpdates.call(treeId2);

      assert.equal(
        updateGenResultAfterVerify2.updateSpecs,
        updateIpfsHash1,
        "ipfs hash set inccorect"
      );

      assert.equal(
        Number(updateGenResultAfterVerify2.updateStatus),
        3,
        "invlid updateGen update status"
      );
      ////////////// ------------------------------ fail too verify
      await treeFactoryInstance
        .verifyAssignedTree(treeId2, true, { from: userAccount4 })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      /////////////// plant treeId1 after reject again

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount2 }
      );

      await treeFactoryInstance.verifyAssignedTree(treeId, false, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );
    });

    it("should verify plant and emit event", async () => {
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
        dataManager
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
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });
      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
      );
      const tx1 = await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
      });
      truffleAssert.eventEmitted(tx1, "AssignedTreeVerified", (ev) => {
        return Number(ev.treeId) == treeId;
      });
      //////////////////---------------- assign to type 2 anad verify by org
      await treeFactoryInstance.listTree(treeId2, ipfsHash, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTree(treeId2, userAccount3, {
        from: dataManager,
      });
      await treeFactoryInstance.plantAssignedTree(
        treeId2,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );
      const tx2 = await treeFactoryInstance.verifyAssignedTree(treeId2, false, {
        from: userAccount4,
      });
      truffleAssert.eventEmitted(tx2, "AssignedTreeRejected", (ev) => {
        return Number(ev.treeId) == treeId2;
      });
      ///////////////////////////---------------- assign to type 3 and  verify by org
      await treeFactoryInstance.listTree(treeId3, ipfsHash, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTree(treeId3, userAccount4, {
        from: dataManager,
      });
      await treeFactoryInstance.plantAssignedTree(
        treeId3,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount4 }
      );
      const tx3 = await treeFactoryInstance.verifyAssignedTree(treeId3, true, {
        from: userAccount3,
      });
      truffleAssert.eventEmitted(tx3, "AssignedTreeVerified", (ev) => {
        return Number(ev.treeId) == treeId3;
      });
      ///////////////////////////---------------- assign to type 3 and  verify by other planters in org
      await treeFactoryInstance.listTree(treeId4, ipfsHash, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTree(treeId4, userAccount4, {
        from: dataManager,
      });
      await treeFactoryInstance.plantAssignedTree(
        treeId4,
        ipfsHash,
        birthDate,
        countryCode,
        { from: userAccount4 }
      );
      const tx4 = await treeFactoryInstance.verifyAssignedTree(treeId4, true, {
        from: userAccount5,
      });
      truffleAssert.eventEmitted(tx4, "AssignedTreeVerified", (ev) => {
        return Number(ev.treeId) == treeId4;
      });

      ////////////// ------------- fail to assing or plant after verify

      await treeFactoryInstance
        .assignTree(treeId4, userAccount4, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);

      await treeFactoryInstance
        .plantAssignedTree(treeId4, updateIpfsHash1, birthDate, countryCode, {
          from: userAccount2,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_FOR_PLANT
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
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

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount2 }
      );

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.VERIFY_PLANT_BY_PLANTER);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount1 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount3 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount4 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount6 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount8 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount3, {
        from: dataManager,
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

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount3 }
      );

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount1 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount6 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount7 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount4 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      //////////////--------------- verify successfully

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: userAccount5,
      });
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount3, {
        from: dataManager,
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

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        updateIpfsHash1,
        birthDate,
        countryCode,
        { from: userAccount4 }
      );
      //////////////////----------- try to verify:fail

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount6 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount7 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      await treeFactoryInstance
        .verifyAssignedTree(treeId, true, { from: userAccount5 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      /////////////////------------- try to verify: success
      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: userAccount3,
      });
    });

    ////////////////////------------------------------------ test manageProvideStatus func  ----------------------------------------//

    it("test manageProvideStatus function", async () => {
      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance
        .manageSaleTypeBatch(102, 103, 2, { from: deployerAccount })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      // await Common.addTreejerContractRole(
      //   arInstance,
      //   treeTokenInstance.address,
      //   deployerAccount
      // );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.mintAssignedTree(102, userAccount2, 1, {
        from: deployerAccount,
      });

      let result = await treeFactoryInstance.manageSaleTypeBatch.call(
        102,
        103,
        2,
        {
          from: deployerAccount,
        }
      );

      assert.equal(result, false, "result not true");

      let result2 = await treeFactoryInstance.manageSaleTypeBatch(103, 104, 2, {
        from: deployerAccount,
      });

      assert.equal(
        Number((await treeFactoryInstance.trees.call(103)).saleType),
        2,
        "provideStatus not true"
      );

      let result3 = await treeFactoryInstance.manageSaleTypeBatch.call(
        103,
        104,
        3,
        {
          from: deployerAccount,
        }
      );

      assert.equal(result3, false, "result3 not true");
    });
  });

  // //  -----------------------------------------------------------updateTree test--------------------------------------------

  describe("deploy and set addresses", () => {
    beforeEach(async () => {
      arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await deployProxy(
        TreeFactory,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

      planterFundInstnce = await deployProxy(
        PlanterFund,
        [arInstance.address],
        {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        }
      );

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

      await treeFactoryInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });
    });

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
        planterInstance,
        dataManager
      );

      let tree = await treeFactoryInstance.trees.call(treeId);
      let travelTime = Math.mul(
        Math.add(
          Math.mul(Number(tree.treeStatus), 3600),
          Math.mul(7 * 24, 3600)
        ),
        2
      );

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      let tx = await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let result = await treeFactoryInstance.treeUpdates.call(treeId);

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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      let tree = await treeFactoryInstance.trees.call(treeId);
      let travelTime = Math.add(
        Math.mul(Number(tree.treeStatus), 3600),
        Math.mul(3 * 24, 3600)
      );

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      const updateIntervalTx1 = await treeFactoryInstance.setUpdateInterval(3, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(
        updateIntervalTx1,
        "TreeUpdateIntervalChanged"
      );

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const updateIntervalTx2 = await treeFactoryInstance.setUpdateInterval(4, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(
        updateIntervalTx2,
        "TreeUpdateIntervalChanged"
      );

      let travelTime2 = Math.add(
        Math.mul(Number(tree.treeStatus), 3600),
        Math.mul(3 * 24, 3600)
      );

      await Common.travelTime(TimeEnumes.seconds, travelTime2);

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.days, 1);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });
    });

    it("should fail to update tree", async () => {});

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
        planterInstance,
        dataManager
      );

      await Common.travelTime(TimeEnumes.seconds, 2000);

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.days, 6);

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
        planterInstance,
        dataManager
      );

      let tree = await treeFactoryInstance.trees.call(treeId);
      let travelTime = Math.subtract(
        Math.add(
          Math.mul(Number(tree.treeStatus), 3600),
          Math.mul(7 * 24, 3600)
        ),
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
        planterInstance,
        dataManager
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// -------------- deploy dauFunds

      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation

      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount1,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      let tree = await treeFactoryInstance.trees.call(treeId);

      let travelTime = Math.add(
        Math.add(
          Math.mul(Number(tree.treeStatus), 3600),
          Math.mul(7 * 24, 3600)
        ),
        100
      );

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let tx = await treeFactoryInstance.verifyUpdate(treeId, false, {
        from: dataManager,
      });

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let tx2 = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
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
        planterInstance,
        dataManager
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
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await Common.addPlanter(arInstance, userAccount2, deployerAccount);

      await Common.joinSimplePlanter(
        planterInstance,
        1,
        userAccount2,
        zeroAddress,
        zeroAddress
      );

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_NOT_PLANTED);

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount1,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      let tree = await treeFactoryInstance.trees.call(treeId);
      let travelTime = Math.add(
        Math.mul(Number(tree.treeStatus), 3600),
        Math.mul(7 * 24, 3600)
      );

      await Common.travelTime(TimeEnumes.seconds, travelTime);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, {
          from: userAccount2,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.seconds, 7 * 86400);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .updateTree(treeId, ipfsHash, { from: userAccount2 })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.seconds, 6 * 86400 + 86300);

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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.travelTime(TimeEnumes.seconds, 2592000);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      let resultBeforeUGT = await treeFactoryInstance.treeUpdates.call(treeId);
      let resultBeforeGT = await treeFactoryInstance.trees.call(treeId);

      let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      let now = await Common.timeInitial(TimeEnumes.seconds, 0);
      let resultAfterUGT = await treeFactoryInstance.treeUpdates.call(treeId);
      let resultAfterGT = await treeFactoryInstance.trees.call(treeId);

      let pFund = await planterFundInstnce.planterFunds.call(treeId);
      let rFund = await planterFundInstnce.referralFunds.call(treeId);
      let planterPaid = await planterFundInstnce.plantersPaid.call(treeId);

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

      truffleAssert.eventEmitted(tx, "TreeUpdatedVerified", (ev) => {
        return ev.treeId == treeId;
      });

      assert.equal(Number(pFund), 0, "no fund beacuse tree fund did not call");

      assert.equal(Number(rFund), 0, "no fund beacuse tree fund did not call");

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
      const fundTreeAmount = web3.utils.toWei("0.219");

      const planterTotalFund = Math.divide(
        Math.mul(Number(fundTreeAmount), fundsPercent.planterFund),
        10000
      );

      const referralTotalFund = Math.divide(
        Math.mul(Number(fundTreeAmount), fundsPercent.referralFund),
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount7,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      const pFund = await planterFundInstnce.planterFunds.call(treeId);
      const rFund = await planterFundInstnce.referralFunds.call(treeId);

      const planterPaidBeforeVerify =
        await planterFundInstnce.plantersPaid.call(treeId);

      assert.equal(
        Number(pFund),
        planterTotalFund,
        "planter total fund is not ok"
      );

      assert.equal(
        Number(rFund),
        referralTotalFund,
        "referral total fund is not ok"
      );

      assert.equal(
        Number(planterPaidBeforeVerify),
        0,
        "planter paid before verify update is not ok"
      );

      const totalFundsBefore = await planterFundInstnce.totalFunds.call();

      assert.equal(
        Number(totalFundsBefore.planterFund),
        planterTotalFund,
        "planter total fund is not ok"
      );
      assert.equal(
        Number(totalFundsBefore.referralFund),
        referralTotalFund,
        "referral total fund is not ok"
      );
      assert.equal(
        Number(totalFundsBefore.localDevelop),
        0,
        "local develop total fund is not ok"
      );

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800); // 7 * 172800 is equal to 7 * 48 hours

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let resultBeforeUGT = await treeFactoryInstance.treeUpdates.call(treeId);
      let resultBeforeGT = await treeFactoryInstance.trees.call(treeId);

      let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const resultAfterUGT = await treeFactoryInstance.treeUpdates.call(treeId);

      const resultAfterGT = await treeFactoryInstance.trees.call(treeId);

      const now = await Common.timeInitial(TimeEnumes.seconds, 0);

      const planterPaidAfterVerify = await planterFundInstnce.plantersPaid.call(
        treeId
      );

      const expectedPaid = parseInt(
        Math.divide(
          Math.mul(planterTotalFund, Number(resultAfterGT.treeStatus)),
          25920
        )
      );

      const expectedReferralPaid = parseInt(
        Math.divide(
          Math.mul(referralTotalFund, Number(resultAfterGT.treeStatus)),
          25920
        )
      );

      assert.equal(
        Number(planterPaidAfterVerify),
        expectedPaid,

        "planter paid after verify is not ok"
      );

      const totalFundsAfterVerify = await planterFundInstnce.totalFunds.call();

      assert.equal(
        Number(totalFundsAfterVerify.planterFund),
        Math.subtract(Number(totalFundsBefore.planterFund), expectedPaid),
        "planter total fund is not ok"
      );
      assert.equal(
        Number(totalFundsAfterVerify.referralFund),
        Math.subtract(
          Number(totalFundsBefore.referralFund),
          expectedReferralPaid
        ),
        "referral total fund is not ok"
      );
      assert.equal(
        Number(totalFundsAfterVerify.localDevelop),
        expectedReferralPaid,
        "local develop total fund is not ok"
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

      truffleAssert.eventEmitted(tx, "TreeUpdatedVerified", (ev) => {
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

      const referralTotalFund = Math.divide(
        Math.mul(Number(fundTreeAmount), fundsPercent.referralFund),
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount7,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      const pFund = await planterFundInstnce.planterFunds.call(treeId);
      const rFund = await planterFundInstnce.referralFunds.call(treeId);

      const planterPaidBeforeVerify =
        await planterFundInstnce.plantersPaid.call(treeId);

      assert.equal(
        Number(pFund),
        planterTotalFund,
        "planter total fund is not ok"
      );

      assert.equal(
        Number(rFund),
        referralTotalFund,
        "referral total fund is not ok"
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

      let resultBeforeUGT = await treeFactoryInstance.treeUpdates.call(treeId);
      let resultBeforeGT = await treeFactoryInstance.trees.call(treeId);

      let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const resultAfterUGT = await treeFactoryInstance.treeUpdates.call(treeId);

      const resultAfterGT = await treeFactoryInstance.trees.call(treeId);

      const now = await Common.timeInitial(TimeEnumes.seconds, 0);

      const planterPaidAfterVerify = await planterFundInstnce.plantersPaid.call(
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

      truffleAssert.eventEmitted(tx, "TreeUpdatedVerified", (ev) => {
        return ev.treeId == treeId;
      });

      ////////////////////// update after 1 year and verify ///////////////////////////

      await Common.travelTime(TimeEnumes.seconds, 31104000); //31104000 is equal to 1 year

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const resultAfterGT2 = await treeFactoryInstance.trees.call(treeId);

      const nowAfterVerify = await Common.timeInitial(TimeEnumes.seconds, 0);

      const planterPaidAfterVerify2 =
        await planterFundInstnce.plantersPaid.call(treeId);

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

      const referralTotalFund = Math.divide(
        Math.mul(Number(fundTreeAmount), fundsPercent.referralFund),
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });
      ///////////////////// fund tree without tree token owner ////////////////////////////////

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await allocationInstance.addAllocationData(
        fundsPercent.planterFund,
        fundsPercent.referralFund,
        fundsPercent.treeResearch,
        fundsPercent.localDevelop,
        fundsPercent.rescueFund,
        fundsPercent.treejerDevelop,
        fundsPercent.reserveFund1,
        fundsPercent.reserveFund2,
        {
          from: dataManager,
        }
      );

      await allocationInstance.assignAllocationToTree(0, 10, 0, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        userAccount5,
        deployerAccount
      );

      await treeFactoryInstance.manageSaleType(treeId, 1, {
        from: userAccount5,
      });

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      await daiInstance.setMint(daiFundInstance.address, fundTreeAmount);

      await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
        from: deployerAccount,
      });

      await daiFundInstance.setPlanterFundContractAddress(
        planterFundInstnce.address,
        { from: deployerAccount }
      );

      await Common.addTreejerContractRole(
        arInstance,
        daiFundInstance.address,
        deployerAccount
      );

      await daiFundInstance.fundTree(
        treeId,
        fundTreeAmount,
        fundsPercent.planterFund,
        fundsPercent.referralFund,
        fundsPercent.treeResearch,
        fundsPercent.localDevelop,
        fundsPercent.rescueFund,
        fundsPercent.treejerDevelop,
        fundsPercent.reserveFund1,
        fundsPercent.reserveFund2,
        {
          from: userAccount5,
        }
      );

      /////////////////////////////////////////////////////////

      const pFund = await planterFundInstnce.planterFunds.call(treeId);
      const rFund = await planterFundInstnce.referralFunds.call(treeId);

      const totalFunds1 = await planterFundInstnce.totalFunds.call();

      const planterPaidBeforeVerify =
        await planterFundInstnce.plantersPaid.call(treeId);

      assert.equal(
        Number(pFund),
        planterTotalFund,
        "planter total fund is not ok"
      );
      assert.equal(
        Number(rFund),
        referralTotalFund,
        "planter total fund is not ok"
      );
      ////////////////// ------------ check total funds

      assert.equal(
        Number(totalFunds1.planterFund),
        planterTotalFund,
        "planter total fund is not ok"
      );
      assert.equal(
        Number(totalFunds1.referralFund),
        referralTotalFund,
        "referral total fund is not ok"
      );
      assert.equal(
        Number(totalFunds1.localDevelop),
        0,
        "local develop total fund is not ok"
      );
      /////////// ------------------ check planter paid
      assert.equal(
        Number(planterPaidBeforeVerify),
        0,
        "planter paid before verify update is not ok"
      );

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800); //7 * 172800 is equal to 7 * 48 hours

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      let resultBeforeUGT = await treeFactoryInstance.treeUpdates.call(treeId);
      let resultBeforeGT = await treeFactoryInstance.trees.call(treeId);

      let tx = await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      const totalFunds2 = await planterFundInstnce.totalFunds.call();

      ////////////////// ------------ check total funds

      assert.equal(
        Number(totalFunds2.planterFund),
        planterTotalFund,
        "planter total fund is not ok"
      );
      assert.equal(
        Number(totalFunds2.referralFund),
        referralTotalFund,
        "planter total fund is not ok"
      );
      assert.equal(
        Number(totalFunds2.localDevelop),
        0,
        "planter total fund is not ok"
      );

      let resultAfterUGT = await treeFactoryInstance.treeUpdates.call(treeId);

      let resultAfterGT = await treeFactoryInstance.trees.call(treeId);

      let now = await Common.timeInitial(TimeEnumes.seconds, 0);

      const planterPaidAfterVerify1 =
        await planterFundInstnce.plantersPaid.call(treeId);

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

      truffleAssert.eventEmitted(tx, "TreeUpdatedVerified", (ev) => {
        return ev.treeId == treeId;
      });

      /////////////////// verify 2 and set token owner ////////////////////////

      await treeFactoryInstance.mintAssignedTree(treeId, userAccount8, 2, {
        from: userAccount5,
      });

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800); //7 * 172800 is equal to 7 * 48 hours

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      let resultAfterGT2 = await treeFactoryInstance.trees.call(treeId);

      const nowAfterVerify2 = await Common.timeInitial(TimeEnumes.seconds, 0);

      const planterPaidAfterVerify2 =
        await planterFundInstnce.plantersPaid.call(treeId);

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

      let expectedReferralPaid = parseInt(
        Math.divide(
          Math.mul(referralTotalFund, Number(resultAfterGT2.treeStatus)),
          25920
        )
      );

      const totalFunds3 = await planterFundInstnce.totalFunds.call();

      const planterBalance = await planterFundInstnce.balances.call(
        userAccount2
      );

      assert.equal(
        Number(planterBalance),
        expectedPaid,
        "planter balance is not ok"
      );

      //// because there is no refferal , referral share added to totalFunds.localDevelop
      assert.equal(
        Number(totalFunds3.localDevelop),
        expectedReferralPaid,
        "local develop total fund is not correct"
      );

      assert.equal(
        Math.add(Number(totalFunds3.planterFund), expectedPaid),
        planterTotalFund,
        "planter total fund is not correct"
      );
      assert.equal(
        Math.add(Number(totalFunds3.referralFund), expectedReferralPaid),
        referralTotalFund,
        "referral total fund is not correct"
      );

      assert.equal(
        Number(planterPaidAfterVerify2),
        expectedPaid,

        "planter paid after verify is not ok"
      );
    });

    it("Should verify update work seccussfully when verify false by Admin", async () => {
      // no fund planter happen
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
        planterInstance,
        dataManager
      );

      await Common.travelTime(TimeEnumes.seconds, 2592000);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      let tx = await treeFactoryInstance.verifyUpdate(treeId, false, {
        from: dataManager,
      });

      let resultAfterUGT = await treeFactoryInstance.treeUpdates.call(treeId);

      assert.equal(resultAfterUGT.updateStatus.toNumber(), 2);

      truffleAssert.eventEmitted(tx, "TreeUpdateRejected", (ev) => {
        return ev.treeId == treeId;
      });
    });

    it("should verify by planter in organization where organiation is planter (planterType=2) and fail otherwise", async () => {
      // no fund planter happen
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount3, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount3,
        }
      );

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
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

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800);

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

      truffleAssert.eventEmitted(verifyTx, "TreeUpdatedVerified", (ev) => {
        return Number(ev.treeId) == treeId;
      });
    });

    it("should verify by planter in organization where organiation is planter in organization (planterType=3)", async () => {
      // no fund planter happen
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount4, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount4,
        }
      );

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
      });

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800);

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
      // no fund planter happen
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount4, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount4,
        }
      );

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
      });

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800);

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
      // no fund planter happen
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

      await Common.addTreejerContractRole(
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
        dataManager
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
        dataManager
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

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
      );

      await treeFactoryInstance.verifyAssignedTree(treeId, true, {
        from: dataManager,
      });

      await Common.travelTime(TimeEnumes.seconds, 7 * 172800);

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
        from: dataManager,
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount7,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      await Common.travelTime(TimeEnumes.seconds, 2592000);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .verifyUpdate(treeId, true, {
          from: dataManager,
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
        planterInstance,
        dataManager
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //////////// -------------- deploy dauFunds
      daiFundInstance = await deployProxy(DaiFunds, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });
      //////////// ----------- deploy dai
      daiInstance = await Dai.new("DAI", "dai", { from: accounts[0] });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await Common.successFundTree(
        arInstance,
        deployerAccount,
        treeFactoryInstance.address,
        userAccount7,
        allocationInstance,
        daiFundInstance,
        daiInstance,
        planterFundInstnce,
        treeId,
        fundsPercent,
        fundTreeAmount,
        userAccount8,
        treeFactoryInstance,
        dataManager
      );

      await Common.travelTime(TimeEnumes.seconds, 2592000);

      await treeFactoryInstance.updateTree(treeId, ipfsHash, {
        from: userAccount2,
      });

      await treeFactoryInstance.verifyUpdate(treeId, false, {
        from: dataManager,
      });

      await treeFactoryInstance
        .verifyUpdate(treeId, false, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.UPDATE_STATUS_MUST_BE_PENDING
        );
    });

    it("verifyUpdate should be fail because tree not planted", async () => {
      let treeId = 1;
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await treeFactoryInstance.listTree(treeId, ipfsHash, {
        from: dataManager,
      });

      await Common.addPlanter(arInstance, userAccount2, deployerAccount);

      await Common.joinSimplePlanter(
        planterInstance,
        1,
        userAccount2,
        zeroAddress,
        zeroAddress
      );

      await treeFactoryInstance.assignTree(treeId, userAccount2, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.plantAssignedTree(
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: userAccount2,
        }
      );

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

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

      await arInstance.unpause({ from: deployerAccount });
    });

    ////////////////--------------------------------------------------manageSaleType test----------------------------------------

    it("manageSaleType should be success", async () => {
      const treeId = 1;
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await treeFactoryInstance.setPlanterFundAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
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
        planterInstance,
        dataManager
      );

      await Common.addTreejerContractRole(
        arInstance,
        userAccount5,
        deployerAccount
      );

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      let resultBefore = await treeFactoryInstance.trees.call(treeId);

      let lastProvideStatus = await treeFactoryInstance.manageSaleType(1, 1, {
        from: userAccount5,
      });

      let resultAfter = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        resultAfter.saleType.toNumber(),
        Math.add(resultBefore.saleType.toNumber(), 1),
        "provideStatus not true update"
      );
    });

    it("manageSaleType should be fail because invalid access(just auction access for this function)", async () => {
      arInstance.revoke;

      await treeFactoryInstance
        .manageSaleType(1, 1, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        userAccount1,
        deployerAccount
      );

      await treeFactoryInstance
        .manageSaleType(1, 1, {
          from: userAccount1,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE);

      //////////////// ------------------- manageSaleType should be fail because tree has owner

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
        planterInstance,
        dataManager
      );

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await treeTokenInstance.safeMint(userAccount2, treeId, {
        from: deployerAccount,
      });

      let resultBefore = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        resultBefore.saleType.toNumber(),
        0,
        "provideStatus not true update"
      );

      await treeFactoryInstance.manageSaleType(1, 3, {
        from: userAccount1,
      });

      let resultAfter = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        resultAfter.saleType.toNumber(),
        0,
        "provideStatus not true update"
      );
    });

    /////////////////-------------------------------------------------------mintAssignedTree test-------------------------------------------------------------

    it("mintAssignedTree should be success", async () => {
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
        planterInstance,
        dataManager
      );

      //////// ----------- fail invalid access
      await treeFactoryInstance
        .mintAssignedTree(1, userAccount4, 2, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await Common.addTreejerContractRole(
        arInstance,
        userAccount5,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await treeFactoryInstance.manageSaleType(1, 1, {
        from: userAccount5,
      });

      await treeFactoryInstance.mintAssignedTree(1, userAccount4, 2, {
        from: userAccount5,
      });

      let resultAfter = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        resultAfter.saleType.toNumber(),
        0,
        "provideStatus not true update"
      );

      let addressGetToken = await treeTokenInstance.ownerOf(1);

      assert.equal(addressGetToken, userAccount4, "token not true mint");

      await treeFactoryInstance.mintAssignedTree(1, userAccount6, 2, {
        from: userAccount5,
      }).should.be.rejected;
    });

    //////////////////////---------------------------------------------------------resetSaleType----------------------------------

    it("resetSaleType should be success", async () => {
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
        planterInstance,
        dataManager
      );

      await Common.addTreejerContractRole(
        arInstance,
        userAccount5,
        deployerAccount
      );

      await treeFactoryInstance.manageSaleType(treeId, 1, {
        from: userAccount5,
      });

      ////////////// -------------- fail because of invalid access
      await treeFactoryInstance
        .resetSaleType(treeId, {
          from: userAccount6,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);

      await treeFactoryInstance.resetSaleType(treeId, {
        from: userAccount5,
      });

      let resultAfter = await treeFactoryInstance.trees.call(treeId);

      assert.equal(
        resultAfter.saleType.toNumber(),
        0,
        "provideStatus not true update"
      );
    });

    //-----------------------------mintRegularTrees---------------------------------

    it("mintRegularTrees should be successfully (tree not planted)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await treeFactoryInstance.mintTree(15000, userAccount4, {
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

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      let genTreeBefore = await treeFactoryInstance.trees.call(10001);

      assert.equal(
        Number(genTreeBefore.treeStatus),
        4,
        "treeStatusBefore not true update"
      );

      assert.equal(
        Number(genTreeBefore.saleType),
        4,
        "provideStatusBefore not true update"
      );

      await treeFactoryInstance.mintTree(10000, userAccount4, {
        from: deployerAccount,
      });

      let addressGetToken = await treeTokenInstance.ownerOf(10001);

      assert.equal(addressGetToken, userAccount4, "address not true");

      let genTreeAfter = await treeFactoryInstance.trees.call(10001);

      assert.equal(
        Number(genTreeAfter.treeStatus),
        4,
        "treeStatusAfter not true update"
      );

      assert.equal(
        Number(genTreeAfter.saleType),
        0,
        "provideStatusAfter not true update"
      );
    });

    it("3.mintTree should be successfully", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await treeFactoryInstance.mintTree(10000, userAccount4, {
        from: deployerAccount,
      });

      let addressGetToken = await treeTokenInstance.ownerOf(10001);

      assert.equal(addressGetToken, userAccount4, "address not true");

      await treeFactoryInstance.mintTree(10000, userAccount5, {
        from: deployerAccount,
      });

      let addressGetToken2 = await treeTokenInstance.ownerOf(10002);

      assert.equal(addressGetToken2, userAccount5, "2-address not true");

      let genTreeBefore = await treeFactoryInstance.trees.call(10002);

      assert.equal(
        Number(genTreeBefore.treeStatus),
        0,
        "treeStatusBefore not true update"
      );

      assert.equal(
        Number(genTreeBefore.saleType),
        0,
        "provideStatusBefore not true update"
      );

      await treeFactoryInstance.mintTree(10002, userAccount6, {
        from: deployerAccount,
      });

      let addressGetToken3 = await treeTokenInstance.ownerOf(10003);

      assert.equal(addressGetToken3, userAccount6, "3-address not true");
    });

    it("mintRegularTrees should be fail(only RegularSaleContract call)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .mintTree(9999, userAccount4, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
    });

    /////////////////////////////////////////////////////////mahdiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii////////////////////////////////////////////////////////////////////////

    // //--------------------------regularPlantTree test----------------------------------------------

    it("regularPlantTree should be success (Individual Planter)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await Common.addTreejerContractRole(
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

      const eventTx = await treeFactoryInstance.plantTree(
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: planter,
        }
      );

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      let result = await treeFactoryInstance.tempTrees.call(0);

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

      truffleAssert.eventEmitted(eventTx, "TreePlanted", (ev) => {
        return ev.treeId == 0;
      });
    });

    it("regularPlantTree should be success (Planter of organization)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAdmin = userAccount1;

      await Common.addTreejerContractRole(
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
        dataManager
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

      const eventTx = await treeFactoryInstance.plantTree(
        ipfsHash,
        birthDate,
        countryCode,
        {
          from: planter,
        }
      );

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      let result = await treeFactoryInstance.tempTrees.call(0);

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

      truffleAssert.eventEmitted(eventTx, "TreePlanted", (ev) => {
        return ev.treeId == 0;
      });
    });

    it("regularPlantTree should be rejected (organizationAdmin not accepted planter)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAdmin = userAccount1;

      await Common.addTreejerContractRole(
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
        dataManager
      );

      await Common.joinSimplePlanter(
        planterInstance,
        3,
        planter,
        zeroAddress,
        organizationAdmin
      );

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      }).should.be.rejected;
    });

    //---------------------------------------------verifyRegularPlant-----------------------------------------------

    it("verifyRegularPlant should be success(Admin Verify)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      let regularTree = await treeFactoryInstance.tempTrees.call(0);

      const eventTx = await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      let genTree = await treeFactoryInstance.trees.call(10001);

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
        genTree.planterAddress,
        regularTree.planterAddress,
        "planterAddress not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(
        Number(genTree.saleType),
        4,
        "provideStatus not true update"
      );

      truffleAssert.eventEmitted(eventTx, "TreeVerified", (ev) => {
        return ev.treeId == 10001;
      });
    });

    it("2.verifyTree should be success", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAddress = userAccount1;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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
        deployerAccount,
        dataManager
      );

      let regularTree = await treeFactoryInstance.tempTrees.call(0);

      const eventTx = await treeFactoryInstance.verifyTree(0, true, {
        from: organizationAddress,
      });

      let genTree = await treeFactoryInstance.trees.call(10001);

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
        genTree.planterAddress,
        regularTree.planterAddress,
        "planterAddress not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(
        Number(genTree.saleType),
        4,
        "provideStatus not true update"
      );

      truffleAssert.eventEmitted(eventTx, "TreeVerified", (ev) => {
        return ev.treeId == 10001;
      });
    });

    it("3.verifyTree should be success(isVerified is false)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAddress = userAccount1;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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
        deployerAccount,
        dataManager
      );

      const eventTx = await treeFactoryInstance.verifyTree(0, false, {
        from: organizationAddress,
      });

      let genTree = await treeFactoryInstance.trees.call(10001);

      assert.equal(genTree.treeSpecs, "", "treeSpecs not true update");

      assert.equal(
        genTree.planterAddress,
        zeroAddress,
        "planterAddress not true update"
      );

      truffleAssert.eventEmitted(eventTx, "TreeRejected", (ev) => {
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

      await Common.addTreejerContractRole(
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

      let regularTree = await treeFactoryInstance.tempTrees.call(0);

      // tree mint for userAccount4
      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );
      await treeTokenInstance.safeMint(userAccount4, 10001, {
        from: deployerAccount,
      });

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      let genTree = await treeFactoryInstance.trees.call(10001);

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
        genTree.planterAddress,
        regularTree.planterAddress,
        "planterAddress not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(
        Number(genTree.saleType),
        0,
        "provideStatus not true update"
      );
    });

    it("verifyRegularPlant should be reject", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      ////////// --------------- fail regularTree not exist
      await treeFactoryInstance
        .verifyTree(1, true, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.REGULAR_TREE_NOT_EXIST);

      /////////// ------------ Other planter can't verify update
      await treeFactoryInstance
        .verifyTree(0, true, {
          from: userAccount5,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_ACCESS_TO_VERIFY);

      /////////------------   Planter of tree can't verify update
      await treeFactoryInstance
        .verifyTree(0, true, {
          from: planter,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_ACCESS_PLANTER_OF_TREE
        );
    });

    it("Check lastRegualarTreeId count", async () => {
      //// deploy tree auction

      auctionInstance = await deployProxy(Auction, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      const startTime = await Common.timeInitial(TimeEnumes.seconds, 0);
      const endTime = await Common.timeInitial(TimeEnumes.hours, 1);

      const treeId = 10001;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await auctionInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.listTree(10001, ipfsHash, {
        from: dataManager,
      });

      ////////////// ---------- deploy allocation
      allocationInstance = await deployProxy(Allocation, [arInstance.address], {
        initializer: "initialize",
        from: deployerAccount,
        unsafeAllowCustomTypes: true,
      });

      await auctionInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

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

      await Common.addTreejerContractRole(
        arInstance,
        auctionInstance.address,
        deployerAccount
      );

      await allocationInstance.assignAllocationToTree(0, 100000, 0, {
        from: dataManager,
      });

      await auctionInstance.createAuction(
        treeId,
        Number(startTime),
        Number(endTime),
        web3.utils.toWei("1"),
        web3.utils.toWei("0.1"),
        { from: dataManager }
      );

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      let result1 = await treeFactoryInstance.lastRegualarTreeId();

      assert.equal(result1, 10002, "1-lastRegualarTreeId not true");

      for (let i = 10003; i < 10006; i++) {
        await treeFactoryInstance.listTree(i, ipfsHash, {
          from: dataManager,
        });

        await auctionInstance.createAuction(
          i,
          Number(startTime),
          Number(endTime),
          web3.utils.toWei("1"),
          web3.utils.toWei("0.1"),
          { from: dataManager }
        );
      }

      await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
        from: planter,
      });

      await treeFactoryInstance.verifyTree(1, true, {
        from: dataManager,
      });

      let result2 = await treeFactoryInstance.lastRegualarTreeId();

      assert.equal(result2, 10006, "2-lastRegualarTreeId not true");
    });

    // //----------------------------------------requestRegularTree---------------------------------

    it("requestRegularTree should be successfully", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      let genTreeBefore = await treeFactoryInstance.trees.call(10001);

      assert.equal(
        Number(genTreeBefore.treeStatus),
        4,
        "treeStatusBefore not true update"
      );

      assert.equal(
        Number(genTreeBefore.saleType),
        4,
        "provideStatusBefore not true update"
      );

      await treeFactoryInstance.mintTreeById(10001, userAccount5, {
        from: deployerAccount,
      });

      let addressGetToken2 = await treeTokenInstance.ownerOf(10001);

      assert.equal(addressGetToken2, userAccount5, "address not true");

      let genTreeAfter = await treeFactoryInstance.trees.call(10001);

      assert.equal(
        Number(genTreeAfter.treeStatus),
        4,
        "treeStatusAfter not true update"
      );

      assert.equal(
        Number(genTreeAfter.saleType),
        0,
        "provideStatusAfter not true update"
      );
    });

    it("requestRegularTree should be fail(only RegularSaleContract call)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
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

      await treeFactoryInstance.verifyTree(0, true, {
        from: dataManager,
      });

      await treeFactoryInstance
        .mintTreeById(10000, userAccount5, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_TREEJER_CONTTRACT);
    });

    it("requestRegularTree should be fail(tree must be planted)", async () => {
      await treeFactoryInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );

      await treeFactoryInstance
        .mintTreeById(10000, userAccount5, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_MUST_BE_PLANTED);
    });

    /////////////////////////////////////////////////////////mahdiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii////////////////////////////////////////////////////////////////////////

    // ////////////////////////////////////////////////////////////////////////////////////////////////

    // it("test gsn [ @skip-on-coverage ]", async () => {
    //   let env = await GsnTestEnvironment.startGsn("localhost");

    //   const { forwarderAddress, relayHubAddress, paymasterAddress } =
    //     env.contractsDeployment;

    //   await treeFactoryInstance.setTrustedForwarder(forwarderAddress, {
    //     from: deployerAccount,
    //   });

    //   let paymaster = await WhitelistPaymaster.new(arInstance.address);

    //   await paymaster.addPlanterWhitelistTarget(treeFactoryInstance.address, {
    //     from: deployerAccount,
    //   });

    //   await paymaster.addPlanterWhitelistTarget(planterInstance.address, {
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
    //     treeFactoryInstance.address,
    //     treeFactoryInstance.abi,
    //     signerPlanter
    //   );

    //   let contractAmbassador = await new ethers.Contract(
    //     treeFactoryInstance.address,
    //     treeFactoryInstance.abi,
    //     signerAmbassador
    //   );

    //   const treeId = 1;
    //   const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    //   const countryCode = 2;

    //    await Common.addPlanter(arInstance, userAccount2, deployerAccount);
    //    await Common.addPlanter(arInstance, userAccount1, deployerAccount);

    //   await Common.joinOrganizationPlanter(
    //     planterInstance,
    //     userAccount1,
    //     zeroAddress,
    //     dataManager
    //   );

    //   await Common.joinSimplePlanter(
    //     planterInstance,
    //     3,
    //     userAccount2,
    //     zeroAddress,
    //     userAccount1
    //   );

    //   await planterInstance.acceptPlanterFromOrganization(userAccount2, true, {
    //     from: userAccount1,
    //   });

    //   await Common.addTreejerContractRole(
    //     arInstance,
    //     treeFactoryInstance.address,
    //     deployerAccount
    //   );

    //   await treeFactoryInstance.listTree(treeId, ipfsHash, {
    //     from: dataManager,
    //   });

    //   await treeFactoryInstance.assignTree(treeId, userAccount2, {
    //     from: dataManager,
    //   });

    //   let planterBeforeBalance = await web3.eth.getBalance(userAccount2);

    //   let ambassadorBeforeBalance = await web3.eth.getBalance(userAccount1);

    //   await contractPlanter.plantAssignedTree(treeId, ipfsHash, birthDate, countryCode);

    //   await contractAmbassador.verifyAssignedTree(treeId, true);

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
    //   await GsnTestEnvironment.stopGsn();
    // });
  });
});
