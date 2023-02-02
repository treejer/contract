const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactoryV2");
const Tree = artifacts.require("Tree");
const Auction = artifacts.require("Auction");
const TestPlanter = artifacts.require("TestPlanter");
const Planter = artifacts.require("PlanterV2");
const Dai = artifacts.require("Dai");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const DaiFund = artifacts.require("DaiFund");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const { signTypedData } = require("@metamask/eth-sig-util");
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
const { should } = require("chai");

contract("TreeFactoryV2", (accounts) => {
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

  describe("set contract addresses", () => {
    beforeEach(async () => {
      arInstance = await AccessRestriction.new({
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
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

      planterFundInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("should set contract address", async () => {
      //--------> fail to set address

      await treeFactoryInstance
        .setContractAddresses(0, planterFundInstnce.address, {
          from: userAccount1,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

      await treeFactoryInstance
        .setContractAddresses(0, zeroAddress, {
          from: deployerAccount,
        })
        .should.be.rejectedWith(CommonErrorMsg.INVALID_ADDRESS);

      //--------> set contract address

      await treeFactoryInstance.setContractAddresses(
        0,
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setContractAddresses(
        1,
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setContractAddresses(
        2,
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );

      assert.equal(
        planterFundInstnce.address,
        await treeFactoryInstance.planterFund(),
        "planterFund contract address is incorrect"
      );
      assert.equal(
        planterInstance.address,
        await treeFactoryInstance.planterContract(),
        "planter contract address is incorrect"
      );
      assert.equal(
        treeTokenInstance.address,
        await treeFactoryInstance.treeToken(),
        "tree contract address is incorrect"
      );
    });
  });

  describe("list tree and assign tree batch", () => {
    beforeEach(async () => {
      arInstance = await AccessRestriction.new({
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      planterInstance = await Planter.new({
        from: deployerAccount,
      });

      await planterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });
    });

    it("should list tree batch", async () => {
      const treeIds = [1, 2, 3, 4, 5];
      const invalidTreeIds = [1, 2, 3, 4, 1];
      const treeSpecs = ["speecs1", "speecs2", "speecs3", "speecs4", "speecs5"];

      await treeFactoryInstance
        .listTreeBatch([1, 2, 3], ["speecs1", "speecs1"])
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_INPUTS);

      await treeFactoryInstance
        .listTreeBatch(invalidTreeIds, treeSpecs)
        .should.be.rejectedWith(TreeFactoryErrorMsg.DUPLICATE_TREE);

      const eventTx = await treeFactoryInstance.listTreeBatch(
        treeIds,
        treeSpecs
      );

      truffleAssert.eventEmitted(eventTx, "TreeListed", (ev) => {
        for (let index = 0; index < treeIds.length; index++) {
          return Number(ev.treeId) == treeIds[index];
        }
      });

      for (let i = 0; i < treeIds.length; i++) {
        const treeData = await treeFactoryInstance.trees.call(treeIds[i]);

        assert.equal(
          Number(treeData.treeStatus),
          2,
          "tree status is incorrect"
        );
        assert.equal(treeData.treeSpecs, treeSpecs[i], "incorrect ipfs hash");
      }
    });

    it("should assign tree batch", async () => {
      const testPlanterInstance = await TestPlanter.new({
        from: deployerAccount,
      });

      await testPlanterInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await treeFactoryInstance.setContractAddresses(
        1,
        testPlanterInstance.address,
        {
          from: deployerAccount,
        }
      );

      //----fail invalid length
      const treeIds = [1, 2, 3];
      const invalidTreeIds = [1, 2, 5];
      const treeSpecs = ["speecs1", "speecs2", "speecs3"];
      const planters = [userAccount1, userAccount2, userAccount3];
      //userAccount4 has invalid status (2)
      const invalidPlanters = [userAccount1, userAccount2, userAccount4];

      await treeFactoryInstance.listTreeBatch(treeIds, treeSpecs);

      for (let i = 0; i < planters.length; i++) {
        await Common.addPlanter(arInstance, planters[i], deployerAccount);

        await Common.joinSimplePlanter(
          testPlanterInstance,
          1,
          planters[i],
          zeroAddress,
          zeroAddress
        );
      }
      await Common.addPlanter(arInstance, userAccount4, deployerAccount);

      await Common.joinSimplePlanter(
        testPlanterInstance,
        1,
        userAccount4,
        zeroAddress,
        zeroAddress
      );

      await testPlanterInstance.setPlanterStatus(userAccount4, 2);

      await treeFactoryInstance
        .assignTreeBatch([1, 2, 3], [userAccount1, userAccount2])
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_INPUTS);

      await treeFactoryInstance
        .assignTreeBatch(invalidTreeIds, planters)
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_TREE_TO_ASSIGN);

      //fail not allowed planter

      await treeFactoryInstance
        .assignTreeBatch(treeIds, invalidPlanters)
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.CANT_ASSIGN_TREE_TO_PLANTER
        );

      // seccuseefull assignment

      const eventTx = await treeFactoryInstance.assignTreeBatch(
        treeIds,
        planters
      );

      truffleAssert.eventEmitted(eventTx, "TreeAssigned", (ev) => {
        for (let index = 0; index < treeIds.length; index++) {
          return Number(ev.treeId) == treeIds[index];
        }
      });

      for (let i = 0; i < treeIds.length; i++) {
        assert.equal(
          (await treeFactoryInstance.trees.call(treeIds[i])).planter,
          planters[i],
          "invalid planter id in add tree"
        );
      }
    });
  });

  describe.only("verification wih signature", () => {
    beforeEach(async () => {
      arInstance = await AccessRestriction.new({
        from: deployerAccount,
      });

      await arInstance.initialize(deployerAccount, {
        from: deployerAccount,
      });

      await Common.addDataManager(arInstance, dataManager, deployerAccount);

      await Common.addVerifierRole(arInstance, dataManager, deployerAccount);

      treeFactoryInstance = await TreeFactory.new({
        from: deployerAccount,
      });

      await treeFactoryInstance.initialize(arInstance.address, {
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

      //--------> setPlanterContractAddress

      await treeFactoryInstance.setContractAddresses(
        1,
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      await treeFactoryInstance.setContractAddresses(
        2,
        treeTokenInstance.address,
        {
          from: deployerAccount,
        }
      );
    });

    it("verifyAssignedTreeBatchWithSignature with one planter", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashs = [];
      let planters = [];
      let invalidTreeIds = [];

      for (let i = 0; i < 5; i++) {
        treeIds[i] = i + 1;
        invalidTreeIds[i] = i == 2 ? i + 100 : i + 1;
        ipfsHashs[i] = "some ipfs " + i + " hash here";
        planters[i] = account.address;
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashs, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      //-------------- ceate message for sign

      let inputs = [];

      let inputsWithInvalidNonce = [];
      let inputsIncludingNotSignedValues = [];
      let inputsIncludingInvalidTreeId = [];
      let inputsWithInvalidPlanter = [];
      let inputsWithIncorrectNonce = [];

      for (let i = 0; i < 5; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1, //nonce
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        let sign2 = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1, //nonce
          invalidTreeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        let sign3 = await Common.createMsgWithSig(
          treeFactoryInstance,
          account2,
          i + 1, //nonce
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        let sign4 = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i == 2 ? i : i + 3, //nonce
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputsWithInvalidNonce[i] = [
          i == 4 ? i + 100 : i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];

        inputsIncludingNotSignedValues[i] = [
          i + 1,
          treeIds[i],
          i == 2 ? "invalid ipfs hash" : ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];

        inputs[i] = [
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];

        inputsWithIncorrectNonce[i] = [
          i == 2 ? i : i + 3,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign4.v,
          sign4.r,
          sign4.s,
        ];

        inputsIncludingInvalidTreeId[i] = [
          i + 1,
          invalidTreeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign2.v,
          sign2.r,
          sign2.s,
        ];

        inputsWithInvalidPlanter[i] = [
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign3.v,
          sign3.r,
          sign3.s,
        ];
      }

      const invalidInput1 = [[account.address, inputsWithInvalidNonce]];
      const invalidInput2 = [[account.address, inputsIncludingNotSignedValues]];
      const invalidInput3 = [[account2.address, inputs]];
      const invalidInput4 = [[account.address, inputsIncludingInvalidTreeId]];
      const invalidInput5 = [[account2.address, inputsWithInvalidPlanter]];

      const invalidInput6 = [[account.address, inputsWithIncorrectNonce]];

      const input = [[account.address, inputs]];

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput1, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput2, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput3, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput4, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput5, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput6, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyAssignedTreeBatchWithSignature(input, {
        from: dataManager,
      });

      for (let i = 0; i < 5; i++) {
        let treeData = await treeFactoryInstance.trees(treeIds[i]);

        assert.equal(
          Number(treeData.planter),
          account.address,
          "planter is incorrect"
        );

        assert.equal(
          Number(treeData.treeStatus),
          4,
          "tree status is incorrect"
        );

        assert.equal(
          Number(treeData.countryCode),
          inputs[i][4],
          "countryCode is incorrect"
        );
        assert.equal(
          Number(treeData.birthDate),
          inputs[i][3],
          "birthDate is incorrect"
        );

        assert.isTrue(
          Number(treeData.plantDate) < Number(plantDate) + 10 &&
            Number(treeData.plantDate) > Number(plantDate) - 10,
          "plantDate is incorrect"
        );

        assert.equal(
          treeData.treeSpecs,
          inputs[i][2],
          "treeSpecs is incorrect"
        );
      }
    });

    it("verifyAssignedTreeBatchWithSignature with multiple planter", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashs = [];
      let planters = [];
      let invalidTreeIds = [];

      for (let i = 0; i < 5; i++) {
        treeIds[i] = i + 1;
        ipfsHashs[i] = "some ipfs " + i + " hash here";
        planters[i] = i < 2 ? account.address : account2.address;
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashs, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      //-------------- ceate message for sign

      let inputsForAccount1 = [];
      let inputsForAccount2 = [];
      let invalidInputsForAccount1 = [];
      let invalidInputsForAccount2 = [];

      for (let i = 0; i < 5; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          i < 2 ? account : account2,
          i < 2 ? i + 1 : i - 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        let invalidPlantingSign = await Common.createMsgWithSig(
          treeFactoryInstance,
          i < 2 ? account2 : account,
          i < 2 ? i + 1 : i - 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        if (i < 2) {
          inputsForAccount1[i] = [
            i + 1,
            treeIds[i],
            ipfsHashs[i],
            birthDate,
            countryCode,
            sign.v,
            sign.r,
            sign.s,
          ];

          invalidInputsForAccount2[i] = [
            i + 1,
            treeIds[i],
            ipfsHashs[i],
            birthDate,
            countryCode,
            invalidPlantingSign.v,
            invalidPlantingSign.r,
            invalidPlantingSign.s,
          ];
        } else {
          inputsForAccount2[i - 2] = [
            i - 1,
            treeIds[i],
            ipfsHashs[i],
            birthDate,
            countryCode,
            sign.v,
            sign.r,
            sign.s,
          ];

          invalidInputsForAccount1[i - 2] = [
            i - 1,
            treeIds[i],
            ipfsHashs[i],
            birthDate,
            countryCode,
            invalidPlantingSign.v,
            invalidPlantingSign.r,
            invalidPlantingSign.s,
          ];
        }
      }

      const input = [
        [account.address, inputsForAccount1],
        [account2.address, inputsForAccount2],
      ];

      const invalidInput = [
        [account.address, invalidInputsForAccount1],
        [account2.address, invalidInputsForAccount2],
      ];

      await treeFactoryInstance
        .verifyAssignedTreeBatchWithSignature(invalidInput, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyAssignedTreeBatchWithSignature(input, {
        from: dataManager,
      });

      for (let i = 0; i < 5; i++) {
        let treeData = await treeFactoryInstance.trees(treeIds[i]);

        assert.equal(
          Number(treeData.planter),
          i < 2 ? account.address : account2.address,
          "planter is incorrect"
        );

        assert.equal(
          Number(treeData.treeStatus),
          4,
          "tree status is incorrect"
        );

        assert.equal(
          Number(treeData.countryCode),
          i < 2 ? inputsForAccount1[i][4] : inputsForAccount2[i - 2][4],
          "countryCode is incorrect"
        );
        assert.equal(
          Number(treeData.birthDate),
          i < 2 ? inputsForAccount1[i][3] : inputsForAccount2[i - 2][3],
          "birthDate is incorrect"
        );

        assert.isTrue(
          Number(treeData.plantDate) < Number(plantDate) + 10 &&
            Number(treeData.plantDate) > Number(plantDate) - 10,
          "plantDate is incorrect"
        );

        assert.equal(
          treeData.treeSpecs,
          i < 2 ? inputsForAccount1[i][2] : inputsForAccount2[i - 2][2],
          "treeSpecs is incorrect"
        );
      }
    });

    it("verifyAssignedTreeWithSignature", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeId = 1;
      let treeId2 = 2;
      let invalidTreeId = 100;
      let ipfsHash = "ipfsHash";
      let invalidIpfsHash = "invalid ipfsHash";
      let nonce1 = 1;
      let nonce2 = 2;
      let invalidNonce = 100;
      const treeIds = [1, 2, 3];

      const ipfsHashes = ["ipfs hash 1", "ipfs hash 2", "ipfs hash 3"];
      const planters = [account.address, account.address, account2.address];
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashes, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      //-------------- ceate message for sign

      let inputs = [];

      let sign = await Common.createMsgWithSig(
        treeFactoryInstance,
        account,
        nonce1, //nonce
        treeIds[0],
        ipfsHashes[0],
        birthDate,
        countryCode
      );

      let notListedTreeSign = await Common.createMsgWithSig(
        treeFactoryInstance,
        account,
        nonce1, //nonce
        invalidTreeId,
        ipfsHashes[0],
        birthDate,
        countryCode
      );

      let invalidPlanterSign = await Common.createMsgWithSig(
        treeFactoryInstance,
        account2,
        nonce1, //nonce
        treeIds[0],
        ipfsHashes[0],
        birthDate,
        countryCode
      );

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce2,
          account.address,
          treeIds[0],
          ipfsHashes[0],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce1,
          account.address,
          treeIds[0],
          invalidIpfsHash,
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce1,
          account2.address,
          treeIds[0],
          ipfsHashes[0],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce1,
          account.address,
          invalidTreeId,
          ipfsHashes[0],
          birthDate,
          countryCode,
          notListedTreeSign.v,
          notListedTreeSign.r,
          notListedTreeSign.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce1,
          account2.address,
          treeIds[0],
          ipfsHashes[0],
          birthDate,
          countryCode,
          invalidPlanterSign.v,
          invalidPlanterSign.r,
          invalidPlanterSign.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyAssignedTreeWithSignature(
        nonce1,
        account.address,
        treeIds[0],
        ipfsHashes[0],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,

        { from: dataManager }
      );

      let treeData = await treeFactoryInstance.trees(treeIds[0]);

      assert.equal(
        Number(treeData.planter),
        account.address,
        "planter is incorrect"
      );

      assert.equal(Number(treeData.treeStatus), 4, "tree status is incorrect");

      assert.equal(
        Number(treeData.countryCode),
        countryCode,
        "countryCode is incorrect"
      );
      assert.equal(
        Number(treeData.birthDate),
        birthDate,
        "birthDate is incorrect"
      );

      assert.isTrue(
        Number(treeData.plantDate) < Number(plantDate) + 10 &&
          Number(treeData.plantDate) > Number(plantDate) - 10,
        "plantDate is incorrect"
      );

      assert.equal(treeData.treeSpecs, ipfsHashes[0], "treeSpecs is incorrect");

      //must be signed with nonce 2 but signed with nonce 1
      let signWithInccorectNonce = await Common.createMsgWithSig(
        treeFactoryInstance,
        account,
        nonce1, //nonce
        treeIds[1],
        ipfsHashes[1],
        birthDate,
        countryCode
      );

      await treeFactoryInstance
        .verifyAssignedTreeWithSignature(
          nonce1,
          account.address,
          treeIds[1],
          ipfsHashes[1],
          birthDate,
          countryCode,
          signWithInccorectNonce.v,
          signWithInccorectNonce.r,
          signWithInccorectNonce.s,

          { from: dataManager }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      return;
    });

    it("Verify assign tree", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashs = [];

      for (let i = 0; i < 20; i++) {
        treeIds[i] = i + 1;
      }

      for (let i = 0; i < 20; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashs, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(
        treeIds,
        [
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
          account2.address,
        ],
        {
          from: dataManager,
        }
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < 10; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputs[i] = [
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      let inputs2 = [];

      for (let i = 10; i < 20; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account2,
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputs2[i - 10] = [
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      const input = [
        [account.address, inputs],
        [account2.address, inputs2],
      ];

      let tx = await treeFactoryInstance.verifyAssignedTreeBatchWithSignature(
        input,
        { from: dataManager }
      );

      //   let tx = await treeFactoryInstance.verifyAssignedTreeWithSignature(
      //     1,
      //     account.address,
      //     treeId,
      //     ipfsHash,
      //     birthDate,
      //     countryCode,
      //     v,
      //     r,
      //     s,

      //     { from: dataManager }
      //   );

      console.log("tx", tx);
    });

    it("verifyTreeBatchWithSignature tree", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 20; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < 10; i++) {
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputs[i] = [
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      //   let inputs2 = [];

      //   for (let i = 10; i < 20; i++) {
      //     let sign = await Common.createMsgWithSigPlantTree(
      //       treeFactoryInstance,
      //       account2,
      //       i + 1,
      //       ipfsHashs[i],
      //       birthDate,
      //       countryCode
      //     );

      //     inputs2[i - 10] = [
      //       i + 1,
      //       ipfsHashs[i],
      //       birthDate,
      //       countryCode,
      //       sign.v,
      //       sign.r,
      //       sign.s,
      //     ];
      //   }

      const input = [
        [account.address, inputs],
        // [account2.address, inputs2],
      ];

      //   let tx = await treeFactoryInstance.verifyTreeBatchWithSignature(input, {
      //     from: dataManager,
      //   });

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      let tx = await treeFactoryInstance.verifyTreeWithSignature(
        1,
        account.address,
        ipfsHashs[0],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      console.log("tx", tx);
    });
    it("verify update batch", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      const totalPlantingCount = 20;

      let treeIds = [];
      let ipfsHashs = [];

      let updateIpfsHashes = [];

      for (let i = 0; i < totalPlantingCount; i++) {
        treeIds[i] = i + 1;
      }

      for (let i = 0; i < totalPlantingCount; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      for (let i = 0; i < totalPlantingCount; i++) {
        updateIpfsHashes[i] =
          "some ipfs " + (totalPlantingCount + i) + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      //////////////////// verify type 1 by admin
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashs, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(
        treeIds,
        [
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
          account.address,
        ],
        {
          from: dataManager,
        }
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < totalPlantingCount; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputs[i] = [
          i + 1,
          treeIds[i],
          ipfsHashs[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      // let inputs2 = [];

      // for (let i = totalPlantingCount / 2; i < totalPlantingCount; i++) {
      //   let sign = await Common.createMsgWithSig(
      //     treeFactoryInstance,
      //     account2,
      //     i + 1,
      //     treeIds[i],
      //     ipfsHashs[i],
      //     birthDate,
      //     countryCode
      //   );

      //   inputs2[i - 10] = [
      //     i + 1,
      //     treeIds[i],
      //     ipfsHashs[i],
      //     birthDate,
      //     countryCode,
      //     sign.v,
      //     sign.r,
      //     sign.s,
      //   ];
      // }

      const input = [
        [account.address, inputs],
        // [account2.address, inputs2],
      ];

      let tx = await treeFactoryInstance.verifyAssignedTreeBatchWithSignature(
        input,
        { from: dataManager }
      );

      await Common.travelTime(TimeEnumes.days, 60);

      let verifyUpdateInputs1 = [];

      for (let i = 0; i < totalPlantingCount; i++) {
        let sign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          totalPlantingCount + i + 1,
          treeIds[i],
          updateIpfsHashes[i]
        );

        verifyUpdateInputs1[i] = [
          totalPlantingCount + i + 1,
          treeIds[i],
          updateIpfsHashes[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      // let verifyUpdateInputs2 = [];

      // for (let i = totalPlantingCount / 2; i < totalPlantingCount; i++) {
      //   let sign = await Common.createUpdateTreeMsgWithSig(
      //     treeFactoryInstance,
      //     account2,
      //     totalPlantingCount + i + 1,
      //     treeIds[i],
      //     updateIpfsHashes[i]
      //   );

      //   verifyUpdateInputs2[i - 10] = [
      //     totalPlantingCount + i + 1,
      //     treeIds[i],
      //     updateIpfsHashes[i],
      //     sign.v,
      //     sign.r,
      //     sign.s,
      //   ];
      // }

      const verifyUpdateInput = [
        [account.address, verifyUpdateInputs1],
        // [account2.address, verifyUpdateInputs2],
      ];

      // let updateSign = await Common.createUpdateTreeMsgWithSig(
      //   treeFactoryInstance,
      //   account,
      //   2,
      //   treeId,
      //   ipfsHash
      // );

      // let verifyUpdateInput = [
      //   [
      //     account.address,
      //     [[2, treeId, ipfsHash, updateSign.v, updateSign.r, updateSign.s]],
      //   ],
      // ];

      // address _planter,
      // uint256 _nonce,
      // uint256 _treeId,
      // string memory _treeSpecs,
      // uint8 _v,
      // bytes32 _r,
      // bytes32 _s

      const tt = await treeFactoryInstance.verifyUpdateWithSignature(
        account.address,
        verifyUpdateInputs1[0][0],
        verifyUpdateInputs1[0][1],
        verifyUpdateInputs1[0][2],
        verifyUpdateInputs1[0][3],
        verifyUpdateInputs1[0][4],
        verifyUpdateInputs1[0][5],
        { from: dataManager }
      );

      // const tt = await treeFactoryInstance.verifyUpdateBatchWithSignature(
      //   verifyUpdateInput,
      //   { from: dataManager }
      // );

      console.log("tt", tt);
    });

    ////-------------------------------------------------> mahdi

    it("verifyTreeBatchWithSignature must be successfull (2 planter , 2 treeId per planter)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < 2; i++) {
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      let inputs2 = [];

      for (let i = 2; i < 4; i++) {
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account2,
          i - 2 + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs2[i - 2] = [
          i - 2 + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      const input = [
        [account.address, inputs],
        [account2.address, inputs2],
      ];

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);
      await treeFactoryInstance.verifyTreeBatchWithSignature(input, {
        from: dataManager,
      });

      //-----------------------------> check nonce for both planters;

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        2,
        "planter1 nonce is not correct"
      );

      assert.equal(
        await treeFactoryInstance.plantersNonce(account2.address),
        2,
        "planter2 nonce is not correct"
      );

      assert.equal(
        await treeFactoryInstance.lastRegualarTreeId(),
        10004,
        "lastRegualarTreeId not true updated"
      );

      for (let i = 0; i < 4; i++) {
        //-----------------------> check data for planter 1

        let planter = i < 2 ? account.address : account2.address;

        let treeFactoryResultAfterVerify2 =
          await treeFactoryInstance.trees.call(i + 10001);

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        assert.equal(
          treeFactoryResultAfterVerify2.planter,
          planter,
          "plnter id is incorrect"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.saleType),
          4,
          "incorrect provide status"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.treeStatus),
          4,
          "tree status is not ok"
        ); //updated

        assert.equal(
          Number(treeFactoryResultAfterVerify2.countryCode),
          countryCode[i],
          "country code set inccorectly"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.plantDate),
          Number(plantDate),
          "invalid plant date"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.birthDate),
          birthDate,
          "birthDate set inccorectly"
        );

        assert.equal(
          treeFactoryResultAfterVerify2.treeSpecs,
          ipfsHashs[i],
          "incorrect ipfs hash"
        );
      }
    });

    it("verifyTreeBatchWithSignature reject because of Permission denied", async () => {
      let account = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < 4; i++) {
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      const input = [
        [account.address, inputs],
        // [account2.address, inputs2],
      ];

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      //-----------------------------> reject

      await planterInstance.updateSupplyCap(account.address, 2);

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("Permission denied");

      await planterInstance.updateSupplyCap(account.address, 3);

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("Permission denied");

      await planterInstance.updateSupplyCap(account.address, 4);

      await treeFactoryInstance.verifyTreeBatchWithSignature(input, {
        from: dataManager,
      });
    });

    it("verifyTreeBatchWithSignature reject because of nonce incorrect", async () => {
      let account = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let inputs = [];

      for (let i = 0; i < 4; i++) {
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          i,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          i,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      let input = [[account.address, inputs]];

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("planter nonce is incorrect");

      //--->change array index 4

      for (let i = 0; i < 4; i++) {
        let nonce = i == 3 ? i : i + 1;
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      input = [[account.address, inputs]];

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("planter nonce is incorrect");

      for (let i = 0; i < 4; i++) {
        let nonce = i == 1 ? i : i + 1;
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      input = [[account.address, inputs]];

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("planter nonce is incorrect");

      for (let i = 0; i < 4; i++) {
        let nonce = i == 1 ? i + 3 : i + 1;
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      input = [[account.address, inputs]];

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("planter nonce is incorrect");

      for (let i = 0; i < 4; i++) {
        let nonce = i == 1 ? i + 3 : i + 1;
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      input = [[account.address, inputs]];

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("planter nonce is incorrect");

      for (let i = 0; i < 4; i++) {
        let nonce = i == 3 ? i + 3 : i + 1;
        let sign = await Common.createMsgWithSigPlantTree(
          treeFactoryInstance,
          account,
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i]
        );

        inputs[i] = [
          nonce,
          ipfsHashs[i],
          birthDate,
          countryCode[i],
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      input = [[account.address, inputs]];

      await treeFactoryInstance.verifyTreeBatchWithSignature(input, {
        from: dataManager,
      });

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        6,
        "planter nonce is not correct"
      );
    });

    it("verifyTreeBatchWithSignature reject because of check signature", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode[0]
      );

      let input = [
        [
          account.address,
          [
            [
              1,
              ipfsHashs[0],
              birthDate,
              countryCode[1],
              sign.v,
              sign.r,
              sign.s,
            ],
          ],
        ],
      ];

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      input = [
        [
          account.address,
          [
            [
              1,
              ipfsHashs[1],
              birthDate,
              countryCode[0],
              sign.v,
              sign.r,
              sign.s,
            ],
          ],
        ],
      ];

      //-----------------------------> reject wrong nonce

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      input = [
        [
          account.address,
          [
            [
              2,
              ipfsHashs[0],
              birthDate,
              countryCode[0],
              sign.v,
              sign.r,
              sign.s,
            ],
          ],
        ],
      ];

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      //-----------------------------> reject wrong nonce

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      //--------------

      input = [
        [
          account.address,
          [
            [
              2,
              ipfsHashs[0],
              birthDate,
              countryCode[0],
              sign.v,
              sign.r,
              sign.s,
            ],
          ],
        ],
      ];

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      //--------------------

      //-----------------------------> reject planter nonce

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account2,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode[0]
      );

      input = [
        [
          account.address,
          [
            [
              1,
              ipfsHashs[0],
              birthDate,
              countryCode[0],
              sign.v,
              sign.r,
              sign.s,
            ],
          ],
        ],
      ];

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeBatchWithSignature(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("MyFunction: invalid signature");
    });

    ////-------------------------------------------------> mahdi

    it("verifyTreeWithSignature must be successfull", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await Common.addPlanter(arInstance, account.address, deployerAccount);
      await Common.addPlanter(arInstance, account2.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account2.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode[0]
      );

      let plantDate = [];

      plantDate[0] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyTreeWithSignature(
        1,
        account.address,
        ipfsHashs[0],
        birthDate,
        countryCode[0],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        2,
        ipfsHashs[1],
        birthDate,
        countryCode[1]
      );

      plantDate[1] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyTreeWithSignature(
        2,
        account.address,
        ipfsHashs[1],
        birthDate,
        countryCode[1],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account2,
        1,
        ipfsHashs[2],
        birthDate,
        countryCode[2]
      );

      plantDate[2] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyTreeWithSignature(
        1,
        account2.address,
        ipfsHashs[2],
        birthDate,
        countryCode[2],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account2,
        2,
        ipfsHashs[3],
        birthDate,
        countryCode[3]
      );

      plantDate[3] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyTreeWithSignature(
        2,
        account2.address,
        ipfsHashs[3],
        birthDate,
        countryCode[3],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //-----------------------------> check nonce for both planters;

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        2,
        "planter1 nonce is not correct"
      );

      assert.equal(
        await treeFactoryInstance.plantersNonce(account2.address),
        2,
        "planter2 nonce is not correct"
      );

      assert.equal(
        await treeFactoryInstance.lastRegualarTreeId(),
        10004,
        "lastRegualarTreeId not true updated"
      );

      for (let i = 0; i < 4; i++) {
        //-----------------------> check data for planter 1

        let planter = i < 2 ? account.address : account2.address;

        let treeFactoryResultAfterVerify2 =
          await treeFactoryInstance.trees.call(i + 10001);

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        assert.equal(
          treeFactoryResultAfterVerify2.planter,
          planter,
          "plnter id is incorrect"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.saleType),
          4,
          "incorrect provide status"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.treeStatus),
          4,
          "tree status is not ok"
        ); //updated

        assert.equal(
          Number(treeFactoryResultAfterVerify2.countryCode),
          countryCode[i],
          "country code set inccorectly"
        );

        assert.equal(
          Number(plantDate[i]) - 5 <
            Number(treeFactoryResultAfterVerify2.plantDate) <
            Number(plantDate[i]) + 5,
          true,
          "invalid plant date"
        );

        assert.equal(
          Number(treeFactoryResultAfterVerify2.birthDate),
          birthDate,
          "birthDate set inccorectly"
        );

        assert.equal(
          treeFactoryResultAfterVerify2.treeSpecs,
          ipfsHashs[i],
          "incorrect ipfs hash"
        );
      }
    });

    it("verifyTreeWithSignature reject because of Permission denied", async () => {
      let account = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 1;

      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      let plantDate = [];

      plantDate[0] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await planterInstance.updateSupplyCap(account.address, 1);

      await treeFactoryInstance.verifyTreeWithSignature(
        1,
        account.address,
        ipfsHashs[0],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //-----------------------------> reject

      let sign2 = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        2,
        ipfsHashs[1],
        birthDate,
        countryCode
      );

      await treeFactoryInstance.verifyTreeWithSignature(
        2,
        account.address,
        ipfsHashs[1],
        birthDate,
        countryCode,
        sign2.v,
        sign2.r,
        sign2.s,
        { from: dataManager }
      ).should.be.rejected;
    });

    it("verifyTreeWithSignature reject because of nonce incorrect", async () => {
      let account = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));

      let countryCode = 1;
      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        0,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      //-----------------------------> reject

      await treeFactoryInstance
        .verifyTreeWithSignature(
          0,
          account.address,
          ipfsHashs[0],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("planter nonce is incorrect");

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      //-----------------------------> reject

      await treeFactoryInstance.verifyTreeWithSignature(
        1,
        account.address,
        ipfsHashs[0],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      await treeFactoryInstance
        .verifyTreeWithSignature(
          1,
          account.address,
          ipfsHashs[0],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("planter nonce is incorrect");

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        2,
        ipfsHashs[1],
        birthDate,
        countryCode
      );

      await treeFactoryInstance.verifyTreeWithSignature(
        2,
        account.address,
        ipfsHashs[1],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[2],
        birthDate,
        countryCode
      );

      await treeFactoryInstance
        .verifyTreeWithSignature(
          1,
          account.address,
          ipfsHashs[2],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("planter nonce is incorrect");

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        6,
        ipfsHashs[2],
        birthDate,
        countryCode
      );

      await treeFactoryInstance.verifyTreeWithSignature(
        6,
        account.address,
        ipfsHashs[2],
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        6,
        "planter nonce is not correct"
      );
    });

    it("verifyTreeWithSignature reject because of check signature", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 1;

      await Common.addPlanter(arInstance, account.address, deployerAccount);

      await Common.joinSimplePlanterByAdmin(
        dataManager,
        planterInstance,
        1,
        account.address,
        zeroAddress,
        zeroAddress
      );

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );

      //-------------- ceate message for sign

      let sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      //-----------------------------> reject wrong ipfhashes and countryCode

      await treeFactoryInstance
        .verifyTreeWithSignature(
          1,
          account.address,
          ipfsHashs[0],
          birthDate,
          2,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("MyFunction: invalid signature");

      await treeFactoryInstance
        .verifyTreeWithSignature(
          1,
          account.address,
          ipfsHashs[1],
          birthDate,
          1,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("MyFunction: invalid signature");
      //-----------------------------> reject wrong nonce

      await treeFactoryInstance
        .verifyTreeWithSignature(
          2,
          account.address,
          ipfsHashs[1],
          birthDate,
          1,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("MyFunction: invalid signature");

      //-----------------------------> reject planter nonce

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account2,
        1,
        ipfsHashs[0],
        birthDate,
        countryCode
      );

      await treeFactoryInstance
        .verifyTreeWithSignature(
          1,
          account.address,
          ipfsHashs[0],
          birthDate,
          1,
          sign.v,
          sign.r,
          sign.s,
          { from: dataManager }
        )
        .should.be.rejectedWith("MyFunction: invalid signature");
    });
  });
});
