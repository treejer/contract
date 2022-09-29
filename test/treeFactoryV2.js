// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactoryV2 = artifacts.require("TreeFactoryV2");
const Tree = artifacts.require("Tree");
const Auction = artifacts.require("Auction");

const Planter = artifacts.require("Planter");
const Dai = artifacts.require("Dai");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const DaiFund = artifacts.require("DaiFund");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const MarketPlace = artifacts.require("MarketPlace");

const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  TimeEnumes,
  CommonErrorMsg,
  TreeFactoryErrorMsg,
  AuctionErrorMsg,
  TreasuryManagerErrorMsg,
  MarketPlaceErrorMsg,
} = require("./enumes");

const Math = require("./math");
const { should } = require("chai");

contract("TreeFactoryV2", (accounts) => {
  let treeFactoryV2Instance;
  let treeTokenInstance;

  let arInstance;

  let marketPlaceInstance;

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
      arInstance = await AccessRestriction.new({
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      await Common.addVerifierRole(arInstance, dataManager, deployerAccount);

      treeFactoryV2Instance = await TreeFactoryV2.new({
        from: deployerAccount,
      });

      await treeFactoryV2Instance.initialize(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await treeFactoryV2Instance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterFundInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstnce.initialize(arInstance.address, {
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

      await treeFactoryV2Instance.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      ///-----------------------------deploy market place
      marketPlaceInstance = await MarketPlace.new({
        from: deployerAccount,
      });

      await marketPlaceInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await marketPlaceInstance.setPlanterAddress(planterInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryV2Instance.setMarketPlaceAddress(
        marketPlaceInstance.address,
        {
          from: deployerAccount,
        }
      );
    });

    it("check setMarketPlaceAddress function", async () => {
      const address = treeFactoryV2Instance.address;

      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      //------------------------->reject set marketPlace function

      await treeFactoryV2Instance
        .setMarketPlaceAddress(marketPlaceInstance.address, {
          from: userAccount3,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeFactoryV2Instance.setMarketPlaceAddress(userAccount3, {
        from: deployerAccount,
      }).should.be.rejected;

      //------------------------->successfully set marketPlace function

      await treeFactoryV2Instance.setMarketPlaceAddress(
        marketPlaceInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await treeFactoryV2Instance.marketPlace(),
        marketPlaceInstance.address,
        "address dosn't set correct"
      );
    });

    // //--------------------------plantMarketPlaceTree test----------------------------------------------

    it("plantMarketPlaceTree should be reject (Model not exist and owner not true)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const planter2 = userAccount5;

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount
      );

      await Common.addPlanter(arInstance, planter, deployerAccount);

      await Common.addPlanter(arInstance, planter2, deployerAccount);

      await Common.joinSimplePlanter(
        planterInstance,
        1,
        planter,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanter(
        planterInstance,
        1,
        planter2,
        zeroAddress,
        zeroAddress
      );

      //--------------- model not exist.

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      ).should.be.rejected;

      //--------------- model not exist.

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      ).should.be.rejected;

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        1,
        { from: planter }
      );

      //----------------------------------

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter2,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter,
        })
        .should.rejectedWith(MarketPlaceErrorMsg.ALL_TREE_PLANTED);

      await treeFactoryV2Instance.verifyTree(0, false, {
        from: dataManager,
      });

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      await treeFactoryV2Instance.verifyTree(1, true, {
        from: dataManager,
      });

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter,
        })
        .should.rejectedWith(MarketPlaceErrorMsg.ALL_TREE_PLANTED);
    });

    it("plantMarketPlaceTree should be success (With Model)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: planter }
      );

      //-------------------------------------------

      const eventTx = await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      let result = await treeFactoryV2Instance.tempTrees.call(0);

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

      assert.equal(result.planter, planter, "planter address not true");

      let planterPlantedCount = (await planterInstance.planters.call(planter))
        .plantedCount;

      assert.equal(
        planterPlantedCount,
        1,
        "planter PlantedCount address not true"
      );

      let model = await marketPlaceInstance.models(1);

      assert.equal(
        Number(model.lastPlant),
        1000000000,
        "result is not correct"
      );
      assert.equal(
        Number(model.lastReservePlant),
        1000000001,
        "result is not correct"
      );

      truffleAssert.eventEmitted(eventTx, "TreePlanted", (ev) => {
        return ev.treeId == 0;
      });

      //---------------------------------------------- test tempTreesModel

      let tempTree = await treeFactoryV2Instance.tempTreesModel.call(0);

      assert.equal(Number(tempTree), 1, "tempTree is not correct");
    });

    it("plantMarketPlaceTree should be success (Planter of organization)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAdmin = userAccount1;

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAdmin }
      );

      //-------------------------------------------

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      await planterInstance.acceptPlanterByOrganization(planter, true, {
        from: organizationAdmin,
      });

      let eventTx = await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      let result = await treeFactoryV2Instance.tempTrees.call(0);

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

      assert.equal(result.planter, planter, "planter address not true");

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

    it("plantMarketPlaceTree should be rejected (organizationAdmin not accepted planter)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAdmin = userAccount1;

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAdmin }
      );

      //-------------------------------------------

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);
    });

    it("test both organizationAdmin and individual planter", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAdmin = userAccount1;

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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
        1,
        planter,
        zeroAddress,
        zeroAddress
      );

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: planter }
      );

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAdmin }
      );

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      await planterInstance.updatePlanterType(3, organizationAdmin, {
        from: planter,
      });

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: planter,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 1, {
          from: organizationAdmin,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        2,
        {
          from: organizationAdmin,
        }
      );

      await treeFactoryV2Instance
        .plantMarketPlaceTree(ipfsHash, birthDate, countryCode, 2, {
          from: planter,
        })
        .should.be.rejectedWith(MarketPlaceErrorMsg.PERMISSION_DENIED);
    });

    // //----------------------- verify tree

    it("verifyTree should be success(Admin Verify)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryV2Instance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: planter }
      );

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      //-------------------------------------------

      let marketPlanceTree = await treeFactoryV2Instance.tempTrees.call(0);

      const eventTx = await treeFactoryV2Instance.verifyTree(0, true, {
        from: dataManager,
      });

      let genTree = await treeFactoryV2Instance.trees.call(1000000001);

      assert.equal(
        Number(genTree.birthDate),
        Number(marketPlanceTree.birthDate),
        "birthDate not true update"
      );

      assert.equal(
        Number(genTree.plantDate),
        Number(marketPlanceTree.plantDate),
        "plantDate not true update"
      );

      assert.equal(
        genTree.treeSpecs,
        marketPlanceTree.treeSpecs,
        "treeSpecs not true update"
      );

      assert.equal(
        Number(genTree.countryCode),
        Number(marketPlanceTree.countryCode),
        "countryCode not true update"
      );

      assert.equal(
        genTree.planter,
        marketPlanceTree.planter,
        "planter not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(Number(genTree.saleType), 0, "saleType not true update");

      let model = await marketPlaceInstance.models(1);

      assert.equal(
        Number(model.lastPlant),
        1000000001,
        "result is not correct"
      );
      assert.equal(
        Number(model.lastReservePlant),
        1000000001,
        "result is not correct"
      );

      truffleAssert.eventEmitted(eventTx, "TreeVerified", (ev) => {
        return ev.treeId == 1000000001 && Number(ev.tempTreeId) == 0;
      });
    });

    it("2.verifyTree should be success", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAddress = userAccount1;

      await treeFactoryV2Instance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount
      );

      await Common.addPlanter(arInstance, planter, deployerAccount);
      await Common.addPlanter(arInstance, organizationAddress, deployerAccount);

      await Common.joinOrganizationPlanter(
        planterInstance,
        organizationAddress,
        zeroAddress,
        dataManager
      );

      await Common.joinSimplePlanter(
        planterInstance,
        3,
        planter,
        zeroAddress,
        organizationAddress
      );

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAddress }
      );

      //---------------------------------------------

      await planterInstance.acceptPlanterByOrganization(planter, true, {
        from: organizationAddress,
      });

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      //----------------------------------------

      let regularTree = await treeFactoryV2Instance.tempTrees.call(0);

      await Common.addVerifierRole(
        arInstance,
        organizationAddress,
        deployerAccount
      );

      const eventTx = await treeFactoryV2Instance.verifyTree(0, true, {
        from: organizationAddress,
      });

      let genTree = await treeFactoryV2Instance.trees.call(1000000001);

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
        genTree.planter,
        regularTree.planter,
        "planter not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(Number(genTree.saleType), 0, "saleType not true update");

      let model = await marketPlaceInstance.models(1);

      assert.equal(
        Number(model.lastPlant),
        1000000001,
        "result is not correct"
      );
      assert.equal(
        Number(model.lastReservePlant),
        1000000001,
        "result is not correct"
      );

      truffleAssert.eventEmitted(eventTx, "TreeVerified", (ev) => {
        return ev.treeId == 1000000001 && Number(ev.tempTreeId) == 0;
      });

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      await treeFactoryV2Instance.verifyTree(1, true, {
        from: dataManager,
      });

      let genTreeBefore2 = await treeFactoryV2Instance.trees.call(1000000002);

      assert.equal(
        Number(genTreeBefore2.treeStatus),
        4,
        "treeStatusBefore not true update"
      );

      assert.equal(
        Number(genTreeBefore2.saleType),
        0,
        "saleTypeBefore not true update"
      );

      let model2 = await marketPlaceInstance.models(1);

      assert.equal(
        Number(model2.lastPlant),
        1000000002,
        "model2 lastPlant is not correct"
      );
      assert.equal(
        Number(model2.lastReservePlant),
        1000000002,
        "model2 lastReservePlant is not correct"
      );
    });

    it("3.verifyTree should be success(isVerified is false)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAddress = userAccount1;

      await treeFactoryV2Instance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount
      );

      await Common.addPlanter(arInstance, planter, deployerAccount);
      await Common.addPlanter(arInstance, organizationAddress, deployerAccount);

      await Common.joinOrganizationPlanter(
        planterInstance,
        organizationAddress,
        zeroAddress,
        dataManager
      );

      await Common.joinSimplePlanter(
        planterInstance,
        3,
        planter,
        zeroAddress,
        organizationAddress
      );

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAddress }
      );

      //---------------------------------------------

      await planterInstance.acceptPlanterByOrganization(planter, true, {
        from: organizationAddress,
      });

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      //----------------------------------------

      await Common.addVerifierRole(
        arInstance,
        organizationAddress,
        deployerAccount
      );

      let modelBefore = await marketPlaceInstance.models(1);

      assert.equal(
        Number(modelBefore.lastPlant),
        1000000000,
        "result is not correct"
      );
      assert.equal(
        Number(modelBefore.lastReservePlant),
        1000000001,
        "result is not correct"
      );

      const eventTx = await treeFactoryV2Instance.verifyTree(0, false, {
        from: organizationAddress,
      });

      let genTree = await treeFactoryV2Instance.trees.call(1000000001);

      assert.equal(genTree.treeSpecs, "", "treeSpecs not true update");

      assert.equal(genTree.planter, zeroAddress, "planter not true update");

      let model = await marketPlaceInstance.models(1);

      assert.equal(
        Number(model.lastPlant),
        1000000000,
        "result is not correct"
      );
      assert.equal(
        Number(model.lastReservePlant),
        1000000000,
        "result is not correct"
      );

      truffleAssert.eventEmitted(eventTx, "TreeRejected", (ev) => {
        return ev.treeId == 0;
      });
    });

    it("verifyTree should be success(tree has owner)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const organizationAddress = userAccount6;

      await treeFactoryV2Instance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
        deployerAccount
      );

      await Common.addPlanter(arInstance, planter, deployerAccount);
      await Common.addPlanter(arInstance, organizationAddress, deployerAccount);

      await Common.joinOrganizationPlanter(
        planterInstance,
        organizationAddress,
        zeroAddress,
        dataManager
      );

      await Common.joinSimplePlanter(
        planterInstance,
        3,
        planter,
        zeroAddress,
        organizationAddress
      );

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: organizationAddress }
      );

      //---------------------------------------------

      await planterInstance.acceptPlanterByOrganization(planter, true, {
        from: organizationAddress,
      });

      await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      let regularTree = await treeFactoryV2Instance.tempTrees.call(0);

      // tree mint for userAccount4
      await Common.addTreejerContractRole(
        arInstance,
        deployerAccount,
        deployerAccount
      );
      await treeTokenInstance.mint(userAccount4, 1000000001, {
        from: deployerAccount,
      });

      await treeFactoryV2Instance.verifyTree(0, true, {
        from: dataManager,
      });

      let genTree = await treeFactoryV2Instance.trees.call(1000000001);

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
        genTree.planter,
        regularTree.planter,
        "planter not true update"
      );

      assert.equal(Number(genTree.treeStatus), 4, "treeStatus not true update");

      assert.equal(Number(genTree.saleType), 0, "saleType not true update");
    });

    it("verifyTree should be reject", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await treeFactoryV2Instance.setTreeTokenAddress(
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryV2Instance.address,
        deployerAccount
      );

      await Common.addTreejerContractRole(
        arInstance,
        marketPlaceInstance.address,
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

      //------------------------- create model

      await marketPlaceInstance.addModel(
        1,
        2,
        web3.utils.toWei("1", "Ether"),
        5000,
        { from: planter }
      );

      //-------------------------------------------

      const eventTx = await treeFactoryV2Instance.plantMarketPlaceTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      ////////// --------------- fail Regular Tree not exists
      await treeFactoryV2Instance
        .verifyTree(1, true, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.REGULAR_TREE_NOT_EXIST);

      /////////// ------------ Other planter can't verify update
      await treeFactoryV2Instance
        .verifyTree(0, true, {
          from: userAccount5,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_VERIFIER_ROLE);

      /////////------------   Planter of tree can't verify update
      await treeFactoryV2Instance
        .verifyTree(0, true, {
          from: planter,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_VERIFIER_ROLE);
    });
  });
});
