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
  let TreeFactoryV2Instance;
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

      TreeFactoryV2Instance = await TreeFactoryV2.new({
        from: deployerAccount,
      });

      await TreeFactoryV2Instance.initialize(zeroAddress, {
        from: deployerAccount,
      }).should.be.rejected;

      await TreeFactoryV2Instance.initialize(arInstance.address, {
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

      await TreeFactoryV2Instance.setPlanterContractAddress(
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

      await TreeFactoryV2Instance.setMarketPlaceAddress(
        marketPlaceInstance.address,
        {
          from: deployerAccount,
        }
      );
    });

    it("check setMarketPlaceAddress function", async () => {
      const address = TreeFactoryV2Instance.address;

      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);

      //------------------------->reject set marketPlace function

      await TreeFactoryV2Instance.setMarketPlaceAddress(
        marketPlaceInstance.address,
        {
          from: userAccount3,
        }
      ).should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await TreeFactoryV2Instance.setMarketPlaceAddress(userAccount3, {
        from: deployerAccount,
      }).should.be.rejected;

      //------------------------->successfully set marketPlace function

      await TreeFactoryV2Instance.setMarketPlaceAddress(
        marketPlaceInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        await TreeFactoryV2Instance.marketPlace(),
        marketPlaceInstance.address,
        "address dosn't set correct"
      );
    });

    // //--------------------------plantTree test----------------------------------------------

    it("plantTree should be reject (Model not exist and owner not true)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;
      const planter2 = userAccount5;

      await Common.addTreejerContractRole(
        arInstance,
        TreeFactoryV2Instance.address,
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

      await TreeFactoryV2Instance.plantTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      ).should.be.rejected;

      //--------------- model not exist.

      await TreeFactoryV2Instance.plantTree(
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

      await TreeFactoryV2Instance.plantTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter2,
        }
      ).should.be.rejectedWith(MarketPlaceErrorMsg.OWNER_INVALID);

      //   await TreeFactoryV2Instance.plantTree(
      //     ipfsHash,
      //     birthDate,
      //     countryCode,
      //     1,
      //     {
      //       from: planter,
      //     }
      //   );
    });

    it("plantTree should be success (With Model)", async () => {
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const planter = userAccount2;

      await Common.addTreejerContractRole(
        arInstance,
        TreeFactoryV2Instance.address,
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

      const eventTx = await TreeFactoryV2Instance.plantTree(
        ipfsHash,
        birthDate,
        countryCode,
        1,
        {
          from: planter,
        }
      );

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      let result = await TreeFactoryV2Instance.tempTrees.call(0);

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

      //---------------------------------------------- test tempTreesModel

      let tempTree = await TreeFactoryV2Instance.tempTreesModel.call(0);

      assert.equal(Number(tempTree), 1, "tempTree is not correct");
    });

    it("plantTree should be success (Planter of organization)", async () => {
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

      await planterInstance.acceptPlanterByOrganization(planter, true, {
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

    it("plantTree should be rejected (organizationAdmin not accepted planter)", async () => {
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
  });
});
