const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactoryV2");
const Tree = artifacts.require("Tree");
const IncrementalSale = artifacts.require("IncrementalSale");
const TestPlanter = artifacts.require("TestPlanter");
const Planter = artifacts.require("PlanterV2");
const Dai = artifacts.require("Dai");
const Allocation = artifacts.require("Allocation");
const PlanterFund = artifacts.require("PlanterFund");
const DaiFund = artifacts.require("DaiFund");
const Token = artifacts.require("Weth");

const WethFund = artifacts.require("WethFund");

const UniswapV2Router02New = artifacts.require("UniSwapMini");

const Attribute = artifacts.require("Attribute");
const RegularSale = artifacts.require("RegularSale");

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
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

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

  describe("verification wih signature", () => {
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

    it("verifyAssignedTreeBatch with one planter", async () => {
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
        .verifyAssignedTreeBatch(invalidInput1, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatch(invalidInput2, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatch(invalidInput3, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyAssignedTreeBatch(invalidInput4, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.INVALID_TREE_STATUS_IN_VERIFY_PLANT
        );

      await treeFactoryInstance
        .verifyAssignedTreeBatch(invalidInput5, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);

      await treeFactoryInstance
        .verifyAssignedTreeBatch(invalidInput6, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      const eventTx = await treeFactoryInstance.verifyAssignedTreeBatch(input, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx, "AssignedTreeVerifiedWithSign", (ev) => {
        for (let i = 0; i < 5; i++) {
          return Number(ev.treeId) == i + 1;
        }
      });

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        5,
        "planterNonce is incorrect"
      );

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

    it("verifyAssignedTreeBatch with multiple planter", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashs = [];
      let planters = [];

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
        .verifyAssignedTreeBatch(invalidInput, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.PLANTING_PERMISSION_DENIED);
      const plantDate = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyAssignedTreeBatch(input, {
        from: dataManager,
      });

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        2,
        "planterNonce is incorrect"
      );

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account2.address)),
        3,
        "planterNonce is incorrect"
      );

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

    it("verifyAssignedTree", async () => {
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
        .verifyAssignedTree(
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
        .verifyAssignedTree(
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
        .verifyAssignedTree(
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
        .verifyAssignedTree(
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
        .verifyAssignedTree(
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

      const eventTx = await treeFactoryInstance.verifyAssignedTree(
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

      truffleAssert.eventEmitted(eventTx, "AssignedTreeVerifiedWithSign", (ev) => {
        return Number(ev.treeId) == treeIds[0];
      });

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        1,
        "planterNonce is incorrect"
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
        .verifyAssignedTree(
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

    it("verifyUpdateBatch with one planter (no token minted)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashes = [];
      let planters = [];
      let invalidTreeIds = [];
      let updateIpfsHashes = [];
      const invalidTreeId = 105;

      for (let i = 0; i < 5; i++) {
        treeIds[i] = i + 1;
        invalidTreeIds[i] = i == 2 ? invalidTreeId : i + 1;
        ipfsHashes[i] = "some ipfs " + i + " hash here";
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here";
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
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashes, {
        from: dataManager,
      });

      await treeFactoryInstance.listTree(invalidTreeId, "ipfsHashes", {
        from: dataManager,
      });

      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(invalidTreeId, account.address, {
        from: dataManager,
      });

      let inputs = [];

      for (let i = 0; i < 5; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1, //nonce
          treeIds[i],
          ipfsHashes[i],
          birthDate,
          countryCode
        );

        inputs[i] = [
          i + 1,
          treeIds[i],
          ipfsHashes[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }

      const input = [[account.address, inputs]];

      await treeFactoryInstance.verifyAssignedTreeBatch(input, {
        from: dataManager,
      });

      let verifyUpdateInputs1 = [];
      let verifyUpdateInputsWithIncorrectNonceAsInput = [];
      let verifyUpdateInputsWithIncorrectNonceAsInput2 = [];
      let verifyUpdateInputsWithInvalidNonce = [];
      let verifyUpdateInputsWithNotSignedValues = [];
      let verifyUpdateInputsWithIncorrectPlanter = [];
      let verifyUpdateInputsWithInvalidTreeIds = [];

      for (let i = 0; i < 5; i++) {
        let validSign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i + 6,
          treeIds[i],
          updateIpfsHashes[i]
        );

        let signWithIncorrectNonce = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i == 2 ? i + 100 : i + 6,
          treeIds[i],
          updateIpfsHashes[i]
        );

        let signWithInvalidNonce = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i == 2 ? i : i + 6,
          treeIds[i],
          updateIpfsHashes[i]
        );

        let signWithInvalidPlanter = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account2,
          i + 6,
          treeIds[i],
          updateIpfsHashes[i]
        );

        let signWithInvalidTreeIds = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i + 6,
          invalidTreeIds[i],
          updateIpfsHashes[i]
        );

        verifyUpdateInputs1[i] = [
          i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          validSign.v,
          validSign.r,
          validSign.s,
        ];

        verifyUpdateInputsWithIncorrectNonceAsInput[i] = [
          i == 2 ? i + 100 : i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          validSign.v,
          validSign.r,
          validSign.s,
        ];

        verifyUpdateInputsWithIncorrectNonceAsInput2[i] = [
          i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          signWithIncorrectNonce.v,
          signWithIncorrectNonce.r,
          signWithIncorrectNonce.s,
        ];

        verifyUpdateInputsWithInvalidNonce[i] = [
          i == 2 ? i : i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          signWithInvalidNonce.v,
          signWithInvalidNonce.r,
          signWithInvalidNonce.s,
        ];

        verifyUpdateInputsWithNotSignedValues[i] = [
          i + 6,
          treeIds[i],
          i == 2 ? "some invalid hash" : updateIpfsHashes[i],
          validSign.v,
          validSign.r,
          validSign.s,
        ];

        verifyUpdateInputsWithIncorrectPlanter[i] = [
          i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          signWithInvalidPlanter.v,
          signWithInvalidPlanter.r,
          signWithInvalidPlanter.s,
        ];

        verifyUpdateInputsWithInvalidTreeIds[i] = [
          i + 6,
          invalidTreeIds[i],
          updateIpfsHashes[i],
          signWithInvalidTreeIds.v,
          signWithInvalidTreeIds.r,
          signWithInvalidTreeIds.s,
        ];
      }

      const verifyUpdateInput = [[account.address, verifyUpdateInputs1]];

      const verifyUpdateDataWithIncorrectNonceAsInput = [
        [account.address, verifyUpdateInputsWithIncorrectNonceAsInput],
      ];

      const verifyUpdateDataWithIncorrectNonceAsInput2 = [
        [account.address, verifyUpdateInputsWithIncorrectNonceAsInput2],
      ];

      const verifyUpdateDataWithInvalidNonce = [
        [account.address, verifyUpdateInputsWithInvalidNonce],
      ];

      const verifyUpdateDataWithNotSignedValues = [
        [account.address, verifyUpdateInputsWithNotSignedValues],
      ];

      const verifyUpdateDataWithIncorrectPlanter = [
        [account2.address, verifyUpdateInputsWithIncorrectPlanter],
      ];

      const verifyUpdateDataWithInvalidTreeIds = [
        [account.address, verifyUpdateInputsWithInvalidTreeIds],
      ];

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateInput, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.days, 60);

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithIncorrectNonceAsInput, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithIncorrectNonceAsInput2, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithInvalidNonce, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithNotSignedValues, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithIncorrectPlanter, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
        );

      await treeFactoryInstance
        .verifyUpdateBatch(verifyUpdateDataWithInvalidTreeIds, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_NOT_PLANTED);

      const eventTx = await treeFactoryInstance.verifyUpdateBatch(
        verifyUpdateInput,
        {
          from: dataManager,
        }
      );

      truffleAssert.eventEmitted(eventTx, "TreeUpdatedVerifiedWithSign", (ev) => {
        for (let i = 0; i < 5; i++) {
          return Number(ev.treeId) == i + 1;
        }
      });

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        10,
        "planterNonce is incorrect"
      );

      for (let i = 0; i < 5; i++) {
        const treeData = await treeFactoryInstance.trees(i + 1);

        assert.equal(
          1440,
          Number(treeData.treeStatus),
          "treeStatus is incorrect"
        );

        assert.equal(
          treeData.treeSpecs,
          updateIpfsHashes[i],
          "incorrect update ipfs"
        );
      }
    });
    it("verifyUpdateBatch with multiple planter (no token minted)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let treeIds = [];
      let ipfsHashes = [];
      let updateIpfsHashes = [];
      let planters = [];

      for (let i = 0; i < 5; i++) {
        treeIds[i] = i + 1;
        ipfsHashes[i] = "some ipfs " + i + " hash here";
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here";
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
      await treeFactoryInstance.listTreeBatch(treeIds, ipfsHashes, {
        from: dataManager,
      });
      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      let inputs = [];
      let inputsForAccount1 = [];
      let inputsForAccount2 = [];

      for (let i = 0; i < 5; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          i < 2 ? account : account2,
          i < 2 ? i + 1 : i - 1,
          treeIds[i],
          ipfsHashes[i],
          birthDate,
          countryCode
        );

        if (i < 2) {
          inputsForAccount1[i] = [
            i + 1,
            treeIds[i],
            ipfsHashes[i],
            birthDate,
            countryCode,
            sign.v,
            sign.r,
            sign.s,
          ];
        } else {
          inputsForAccount2[i - 2] = [
            i - 1,
            treeIds[i],
            ipfsHashes[i],
            birthDate,
            countryCode,
            sign.v,
            sign.r,
            sign.s,
          ];
        }
      }

      const input = [
        [account.address, inputsForAccount1],
        [account2.address, inputsForAccount2],
      ];

      await treeFactoryInstance.verifyAssignedTreeBatch(input, {
        from: dataManager,
      });

      let inputsForVerifyUpdateAccount1 = [];
      let inputsForVerifyUpdateAccount2 = [];
      let invalidInputsForVerifyUpdateAccount1 = [];
      let invalidInputsForVerifyUpdateAccount2 = [];

      for (let i = 0; i < 5; i++) {
        let validSign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          i < 2 ? account : account2,
          i < 2 ? i + 3 : i + 2,
          treeIds[i],
          updateIpfsHashes[i]
        );

        let invalidSign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          i < 2 ? account2 : account,
          i < 2 ? i + 4 : i + 1,
          treeIds[i],
          updateIpfsHashes[i]
        );

        if (i < 2) {
          inputsForVerifyUpdateAccount1[i] = [
            i + 3,
            treeIds[i],
            updateIpfsHashes[i],
            validSign.v,
            validSign.r,
            validSign.s,
          ];

          invalidInputsForVerifyUpdateAccount2[i] = [
            i + 4,
            treeIds[i],
            updateIpfsHashes[i],
            invalidSign.v,
            invalidSign.r,
            invalidSign.s,
          ];
        } else {
          inputsForVerifyUpdateAccount2[i] = [
            i + 2,
            treeIds[i],
            updateIpfsHashes[i],
            validSign.v,
            validSign.r,
            validSign.s,
          ];

          invalidInputsForVerifyUpdateAccount1[i] = [
            i + 1,
            treeIds[i],
            updateIpfsHashes[i],
            invalidSign.v,
            invalidSign.r,
            invalidSign.s,
          ];
        }
      }

      await Common.travelTime(TimeEnumes.days, 60);

      const verifyInput = [
        [account.address, inputsForVerifyUpdateAccount1],
        [account2.address, inputsForVerifyUpdateAccount2],
      ];

      const invalidVerifyInput = [
        [account.address, invalidInputsForVerifyUpdateAccount1],
        [account2.address, invalidInputsForVerifyUpdateAccount2],
      ];

      await treeFactoryInstance
        .verifyUpdateBatch(invalidVerifyInput, {
          from: dataManager,
        })
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
        );

      await treeFactoryInstance.verifyUpdateBatch(verifyInput, {
        from: dataManager,
      });

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        4,
        "planterNonce is incorrect"
      );

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account2.address)),
        6,
        "planterNonce is incorrect"
      );

      for (let i = 0; i < 5; i++) {
        const treeData = await treeFactoryInstance.trees(i + 1);

        assert.equal(
          1440,
          Number(treeData.treeStatus),
          "treeStatus is incorrect"
        );

        assert.equal(
          treeData.treeSpecs,
          updateIpfsHashes[i],
          "incorrect update ipfs"
        );
      }
    });

    it("verifyUpdateBatch with one planter (token minted)", async () => {
      const treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      planterFundInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const wethInstance = await Token.new("WETH", "weth", {
        from: accounts[0],
      });

      const daiInstance = await Token.new("DAI", "dai", { from: accounts[0] });

      const dexRouterInstance = await UniswapV2Router02New.new(
        daiInstance.address,
        wethInstance.address,
        { from: deployerAccount }
      );

      await wethInstance.setMint(
        dexRouterInstance.address,
        web3.utils.toWei("125000", "Ether")
      );
      await daiInstance.setMint(
        dexRouterInstance.address,
        web3.utils.toWei("250000000", "Ether")
      );

      const regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      const attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const iSaleInstance = await IncrementalSale.new({
        from: deployerAccount,
      });

      await iSaleInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        iSaleInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        wethFundInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

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

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setPlanterFundAddress(planterFundInstnce.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setAttributesAddress(attributeInstance.address, {
        from: deployerAccount,
      });

      //-------------treeFactoryInstance

      await treeFactoryInstance.setContractAddresses(
        0,
        planterFundInstnce.address,
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

      //-------------wethFundInstance
      await wethFundInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await wethFundInstance.setPlanterFundContractAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await wethFundInstance.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });

      //--------------attributeInstance

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //--------------planterFund

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      //create IncrementalSale
      await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.1"),
        100,
        10,
        web3.utils.toWei("0.01"),
        { from: dataManager }
      );

      await wethInstance.setMint(userAccount3, web3.utils.toWei("10"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("10"),
        {
          from: userAccount3,
        }
      );

      let tx1 = await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, 0, {
        from: userAccount3,
      });
      //--------------------------------------------------------------------------------------
      let account = await web3.eth.accounts.create();
      let treeIds = [];
      let ipfsHashes = [];
      let planters = [];
      let updateIpfsHashes = [];

      for (let i = 0; i < 5; i++) {
        treeIds[i] = i + 101;
        ipfsHashes[i] = "some ipfs " + i + " hash here";
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here";
        planters[i] = account.address;
      }
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
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
      //////////////////// verify type 1 by admin

      await treeFactoryInstance.assignTreeBatch(treeIds, planters, {
        from: dataManager,
      });

      let inputs = [];
      for (let i = 0; i < 5; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account,
          i + 1, //nonce
          treeIds[i],
          ipfsHashes[i],
          birthDate,
          countryCode
        );
        inputs[i] = [
          i + 1,
          treeIds[i],
          ipfsHashes[i],
          birthDate,
          countryCode,
          sign.v,
          sign.r,
          sign.s,
        ];
      }
      const input = [[account.address, inputs]];
      await treeFactoryInstance.verifyAssignedTreeBatch(input, {
        from: dataManager,
      });

      let verifyUpdateInputs = [];
      for (let i = 0; i < 5; i++) {
        let validSign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i + 6,
          treeIds[i],
          updateIpfsHashes[i]
        );

        verifyUpdateInputs[i] = [
          i + 6,
          treeIds[i],
          updateIpfsHashes[i],
          validSign.v,
          validSign.r,
          validSign.s,
        ];
      }

      const verifyUpdateInput = [[account.address, verifyUpdateInputs]];

      await Common.travelTime(TimeEnumes.days, 60);

      const totalBalanceBeforeVerifyUpdate =
        await planterFundInstnce.totalBalances();

      let treeToPlanterProjectedEarningsBeforeVerify = [];
      let treeToAmbassadorProjectedEarningsBeforeVerify = [];
      let treeToPlanterTotalClaimedBeforeVerify = [];

      for (let i = 0; i < 5; i++) {
        treeToPlanterProjectedEarningsBeforeVerify[i] =
          await planterFundInstnce.treeToPlanterProjectedEarning(i + 101);
        treeToAmbassadorProjectedEarningsBeforeVerify[i] =
          await planterFundInstnce.treeToAmbassadorProjectedEarning(i + 101);

        treeToPlanterTotalClaimedBeforeVerify[i] =
          await planterFundInstnce.treeToPlanterTotalClaimed(i + 101);
      }

      await treeFactoryInstance.verifyUpdateBatch(verifyUpdateInput, {
        from: dataManager,
      });

      for (let i = 0; i < 5; i++) {
        assert.equal(
          Number(
            Math.Big(treeToPlanterProjectedEarningsBeforeVerify[i])
              .mul(1440)
              .div(25920)
          ),
          Number(
            await planterFundInstnce.treeToPlanterTotalClaimed(treeIds[i])
          ),
          "tree to planter projected earning is incorrect"
        );
      }

      const planterBalanceAfterVerify = await planterFundInstnce.balances(
        account.address
      );

      const totalBalanceAfterVerifyUpdate =
        await planterFundInstnce.totalBalances();

      assert.equal(
        Number(
          Math.Big(totalBalanceBeforeVerifyUpdate.planter).mul(1440).div(25920)
        ),
        Number(planterBalanceAfterVerify),
        "planter balance after verify is incorrect"
      );

      assert.equal(
        Number(
          Math.Big(totalBalanceAfterVerifyUpdate.planter).add(
            planterBalanceAfterVerify
          )
        ),
        Number(totalBalanceBeforeVerifyUpdate.planter),
        "incorrect totalBalance"
      );

      /////--------------------- update 2

      let verifyUpdateInputs2 = [];
      for (let i = 0; i < 5; i++) {
        let validSign2 = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i + 11,
          treeIds[i],
          updateIpfsHashes[i]
        );

        verifyUpdateInputs2[i] = [
          i + 11,
          treeIds[i],
          updateIpfsHashes[i],
          validSign2.v,
          validSign2.r,
          validSign2.s,
        ];
      }

      const verifyUpdateInput2 = [[account.address, verifyUpdateInputs2]];

      await Common.travelTime(TimeEnumes.days, 60);

      await treeFactoryInstance.verifyUpdateBatch(verifyUpdateInput2, {
        from: dataManager,
      });

      for (let i = 0; i < 5; i++) {
        assert.equal(
          Number(
            Math.Big(treeToPlanterProjectedEarningsBeforeVerify[i])
              .mul(2880)
              .div(25920)
          ),
          Number(
            await planterFundInstnce.treeToPlanterTotalClaimed(treeIds[i])
          ),
          "tree to planter projected earning is incorrect"
        );
      }

      const planterBalanceAfterVerify2 = await planterFundInstnce.balances(
        account.address
      );

      const totalBalanceAfterVerifyUpdate2 =
        await planterFundInstnce.totalBalances();

      assert.equal(
        Number(
          Math.Big(totalBalanceBeforeVerifyUpdate.planter).mul(2880).div(25920)
        ),
        Number(planterBalanceAfterVerify2),
        "planter balance after verify is incorrect"
      );

      assert.equal(
        Number(
          Math.Big(totalBalanceAfterVerifyUpdate2.planter).add(
            planterBalanceAfterVerify2
          )
        ),
        Number(totalBalanceBeforeVerifyUpdate.planter),
        "incorrect totalBalance"
      );
    });

    //--------------------------------> verifyUpdate test

    it("verifyUpdate must be successfull (no token minted)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      let treeIds = [];
      let planters = [];
      let updateIpfsHashes = [];

      for (let i = 0; i < 4; i++) {
        treeIds[i] = i + 10001;
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here updated";
        planters[i] = account.address;
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        account,
        3,
        ipfsHashs[2],
        birthDate,
        countryCode[2]
      );

      await treeFactoryInstance.verifyTree(
        3,
        account.address,
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
        account,
        4,
        ipfsHashs[3],
        birthDate,
        countryCode[3]
      );

      await treeFactoryInstance.verifyTree(
        4,
        account.address,
        ipfsHashs[3],
        birthDate,
        countryCode[3],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //--------------------------------------------- check

      let verifyUpdateInputs1 = [];

      for (let i = 0; i < 4; i++) {
        let validSign = await Common.createUpdateTreeMsgWithSig(
          treeFactoryInstance,
          account,
          i + 5,
          treeIds[i],
          updateIpfsHashes[i]
        );

        verifyUpdateInputs1[i] = [
          i + 5,
          treeIds[i],
          updateIpfsHashes[i],
          validSign.v,
          validSign.r,
          validSign.s,
        ];
      }

      await Common.travelTime(TimeEnumes.days, 60);

      for (let i = 0; i < 4; i++) {
        const eventTx = await treeFactoryInstance.verifyUpdate(
          i + 5,
          account.address,
          verifyUpdateInputs1[i][1],
          verifyUpdateInputs1[i][2],
          verifyUpdateInputs1[i][3],
          verifyUpdateInputs1[i][4],
          verifyUpdateInputs1[i][5],
          {
            from: dataManager,
          }
        );

        truffleAssert.eventEmitted(eventTx, "TreeUpdatedVerifiedWithSign", (ev) => {
          return Number(ev.treeId) == treeIds[i];
        });
      }

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        8,
        "planter1 nonce is not correct"
      );

      for (let i = 0; i < 4; i++) {
        const treeData = await treeFactoryInstance.trees(i + 10001);

        assert.equal(
          1440,
          Number(treeData.treeStatus),
          "treeStatus is incorrect"
        );

        assert.equal(
          treeData.treeSpecs,
          updateIpfsHashes[i],
          "incorrect update ipfs"
        );
      }
    });

    it("verifyUpdate must be reject IncorrectNonce (no token minted)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      let treeIds = [];
      let planters = [];
      let updateIpfsHashes = [];

      for (let i = 0; i < 4; i++) {
        treeIds[i] = i + 10001;
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here updated";
        planters[i] = account.address;
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        account,
        3,
        ipfsHashs[2],
        birthDate,
        countryCode[2]
      );

      await treeFactoryInstance.verifyTree(
        3,
        account.address,
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
        account,
        4,
        ipfsHashs[3],
        birthDate,
        countryCode[3]
      );

      await treeFactoryInstance.verifyTree(
        4,
        account.address,
        ipfsHashs[3],
        birthDate,
        countryCode[3],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //--------------------------------------------- check

      await Common.travelTime(TimeEnumes.days, 60);

      let validSign2 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        0,
        treeIds[0],
        updateIpfsHashes[0]
      );

      let verifyUpdateInputsIncorrectNonce2 = [
        0,
        treeIds[0],
        updateIpfsHashes[0],
        validSign2.v,
        validSign2.r,
        validSign2.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          0,
          account.address,
          verifyUpdateInputsIncorrectNonce2[1],
          verifyUpdateInputsIncorrectNonce2[2],
          verifyUpdateInputsIncorrectNonce2[3],
          verifyUpdateInputsIncorrectNonce2[4],
          verifyUpdateInputsIncorrectNonce2[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      let validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        4,
        treeIds[0],
        updateIpfsHashes[0]
      );

      let verifyUpdateInputsIncorrectNonce1 = [
        4,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          4,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance.verifyUpdate(
        5,
        account.address,
        verifyUpdateInputsIncorrectNonce1[1],
        verifyUpdateInputsIncorrectNonce1[2],
        verifyUpdateInputsIncorrectNonce1[3],
        verifyUpdateInputsIncorrectNonce1[4],
        verifyUpdateInputsIncorrectNonce1[5],
        {
          from: dataManager,
        }
      );

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        7,
        treeIds[1],
        updateIpfsHashes[1]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        7,
        treeIds[1],
        updateIpfsHashes[1],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance.verifyUpdate(
        7,
        account.address,
        verifyUpdateInputsIncorrectNonce1[1],
        verifyUpdateInputsIncorrectNonce1[2],
        verifyUpdateInputsIncorrectNonce1[3],
        verifyUpdateInputsIncorrectNonce1[4],
        verifyUpdateInputsIncorrectNonce1[5],
        {
          from: dataManager,
        }
      );

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        6,
        treeIds[2],
        updateIpfsHashes[2]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        6,
        treeIds[2],
        updateIpfsHashes[2],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          6,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INCORRECT_PLANTER_NONCE);

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        7,
        "planter1 nonce is not correct"
      );
    });

    it("verifyUpdate must be reject permission (one planter && no token minted)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      let treeIds = [];
      let planters = [];
      let updateIpfsHashes = [];

      for (let i = 0; i < 4; i++) {
        treeIds[i] = i + 10001;
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here updated";
        planters[i] = account.address;
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        account,
        3,
        ipfsHashs[2],
        birthDate,
        countryCode[2]
      );

      await treeFactoryInstance.verifyTree(
        3,
        account.address,
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
        account,
        4,
        ipfsHashs[3],
        birthDate,
        countryCode[3]
      );

      await treeFactoryInstance.verifyTree(
        4,
        account.address,
        ipfsHashs[3],
        birthDate,
        countryCode[3],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //--------------------------------------------- check

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.UPDATE_TIME_NOT_REACH);

      await Common.travelTime(TimeEnumes.days, 60);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        10007,
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        10007,
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(
          TreeFactoryErrorMsg.ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE
        );

      await treeFactoryInstance.listTree(10007, "ipfsHash", {
        from: dataManager,
      });

      await treeFactoryInstance.assignTree(10007, account.address, {
        from: dataManager,
      });

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        10007,
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        10007,
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.TREE_NOT_PLANTED);
    });

    it("verifyUpdate must be reject signature (no token minted)", async () => {
      //-----------------------------> reject wrong ipfhashes
      //-----------------------------> reject wrong nonce

      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      let treeIds = [];
      let planters = [];
      let updateIpfsHashes = [];

      for (let i = 0; i < 4; i++) {
        treeIds[i] = i + 10001;
        updateIpfsHashes[i] = "some ipfs " + (i + 5) + " hash here updated";
        planters[i] = account.address;
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        account,
        3,
        ipfsHashs[2],
        birthDate,
        countryCode[2]
      );

      await treeFactoryInstance.verifyTree(
        3,
        account.address,
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
        account,
        4,
        ipfsHashs[3],
        birthDate,
        countryCode[3]
      );

      await treeFactoryInstance.verifyTree(
        4,
        account.address,
        ipfsHashs[3],
        birthDate,
        countryCode[3],
        sign.v,
        sign.r,
        sign.s,
        { from: dataManager }
      );

      //--------------------------------------------- check

      await Common.travelTime(TimeEnumes.days, 60);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        0,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        0,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account2.address,
          verifyUpdateInputsIncorrectNonce1[1],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          verifyUpdateInputsIncorrectNonce1[1],
          updateIpfsHashes[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        10007,
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        10007,
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance
        .verifyUpdate(
          5,
          account.address,
          treeIds[0],
          verifyUpdateInputsIncorrectNonce1[2],
          verifyUpdateInputsIncorrectNonce1[3],
          verifyUpdateInputsIncorrectNonce1[4],
          verifyUpdateInputsIncorrectNonce1[5],
          {
            from: dataManager,
          }
        )
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      validSign1 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        5,
        treeIds[0],
        updateIpfsHashes[0]
      );

      verifyUpdateInputsIncorrectNonce1 = [
        5,
        treeIds[0],
        updateIpfsHashes[0],
        validSign1.v,
        validSign1.r,
        validSign1.s,
      ];

      await treeFactoryInstance.verifyUpdate(
        5,
        account.address,
        verifyUpdateInputsIncorrectNonce1[1],
        verifyUpdateInputsIncorrectNonce1[2],
        verifyUpdateInputsIncorrectNonce1[3],
        verifyUpdateInputsIncorrectNonce1[4],
        verifyUpdateInputsIncorrectNonce1[5],
        {
          from: dataManager,
        }
      );
    });

    //--------------------------------> verifyTreeBatch test

    it("verifyTreeBatch must be successfull (2 planter , 2 treeId per planter)", async () => {
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
      const eventTx = await treeFactoryInstance.verifyTreeBatch(input, {
        from: dataManager,
      });

      truffleAssert.eventEmitted(eventTx, "TreeVerifiedWithSign", (ev) => {
        for (let i = 0; i < 4; i++) {
          if (i < 2) {
            return Number(ev.treeId) == i + 1 && Number(ev.nonce) == i + 1 && ev.planter == account.address;
          } else {
            return (
              Number(ev.treeId) == i + 1 && Number(ev.nonce) == i - 2 + 1 && ev.planter == account2.address
            );
          }
        }
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

    it("verifyUpdteSignature (token minted)", async () => {
      const treeTokenInstance = await Tree.new({
        from: deployerAccount,
      });

      await treeTokenInstance.initialize(arInstance.address, "", {
        from: deployerAccount,
      });

      planterFundInstnce = await PlanterFund.new({
        from: deployerAccount,
      });

      await planterFundInstnce.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const wethFundInstance = await WethFund.new({
        from: deployerAccount,
      });

      await wethFundInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const wethInstance = await Token.new("WETH", "weth", {
        from: accounts[0],
      });

      const daiInstance = await Token.new("DAI", "dai", {
        from: accounts[0],
      });

      const dexRouterInstance = await UniswapV2Router02New.new(
        daiInstance.address,
        wethInstance.address,
        { from: deployerAccount }
      );

      await wethInstance.setMint(
        dexRouterInstance.address,
        web3.utils.toWei("125000", "Ether")
      );
      await daiInstance.setMint(
        dexRouterInstance.address,
        web3.utils.toWei("250000000", "Ether")
      );

      const regularSaleInstance = await RegularSale.new({
        from: deployerAccount,
      });

      await regularSaleInstance.initialize(
        arInstance.address,
        web3.utils.toWei("7"),
        {
          from: deployerAccount,
        }
      );

      const attributeInstance = await Attribute.new({
        from: deployerAccount,
      });

      await attributeInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const allocationInstance = await Allocation.new({
        from: deployerAccount,
      });

      await allocationInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      const iSaleInstance = await IncrementalSale.new({
        from: deployerAccount,
      });

      await iSaleInstance.initialize(arInstance.address, {
        from: deployerAccount,
      });

      await Common.addTreejerContractRole(
        arInstance,
        treeFactoryInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        iSaleInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        wethFundInstance.address,
        deployerAccount
      );
      await Common.addTreejerContractRole(
        arInstance,
        attributeInstance.address,
        deployerAccount
      );

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

      await allocationInstance.assignAllocationToTree(100, 10000, 0, {
        from: dataManager,
      });

      await iSaleInstance.setTreeFactoryAddress(treeFactoryInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setWethFundAddress(wethFundInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });
      await iSaleInstance.setAllocationAddress(allocationInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setRegularSaleAddress(regularSaleInstance.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setPlanterFundAddress(planterFundInstnce.address, {
        from: deployerAccount,
      });

      await iSaleInstance.setAttributesAddress(attributeInstance.address, {
        from: deployerAccount,
      });

      //-------------treeFactoryInstance

      await treeFactoryInstance.setContractAddresses(
        0,
        planterFundInstnce.address,
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

      //-------------wethFundInstance
      await wethFundInstance.setWethTokenAddress(wethInstance.address, {
        from: deployerAccount,
      });

      await wethFundInstance.setPlanterFundContractAddress(
        planterFundInstnce.address,
        {
          from: deployerAccount,
        }
      );

      await wethFundInstance.setDexRouterAddress(dexRouterInstance.address, {
        from: deployerAccount,
      });

      //--------------attributeInstance

      await attributeInstance.setTreeTokenAddress(treeTokenInstance.address, {
        from: deployerAccount,
      });

      //--------------planterFund

      await planterFundInstnce.setPlanterContractAddress(
        planterInstance.address,
        {
          from: deployerAccount,
        }
      );

      //create IncrementalSale
      await iSaleInstance.createIncrementalSale(
        101,
        web3.utils.toWei("0.1"),
        100,
        10,
        web3.utils.toWei("0.01"),
        { from: dataManager }
      );

      await wethInstance.setMint(userAccount3, web3.utils.toWei("10"));

      await wethInstance.approve(
        iSaleInstance.address,
        web3.utils.toWei("10"),
        {
          from: userAccount3,
        }
      );

      await iSaleInstance.fundTree(5, zeroAddress, zeroAddress, 0, {
        from: userAccount3,
      });

      let account = await web3.eth.accounts.create();
      const treeId = 101;
      const ipfsHash = "ipfsHash";
      const updateIpfsHash = "updateIpfsHash";
      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = 2;
      const nonce1 = 1;
      const nonce2 = 2;
      const nonce3 = 3;

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

      await treeFactoryInstance.assignTree(treeId, account.address, {
        from: dataManager,
      });

      let sign = await Common.createMsgWithSig(
        treeFactoryInstance,
        account,
        nonce1, //nonce
        treeId,
        ipfsHash,
        birthDate,
        countryCode
      );

      await treeFactoryInstance.verifyAssignedTree(
        nonce1,
        account.address,
        treeId,
        ipfsHash,
        birthDate,
        countryCode,
        sign.v,
        sign.r,
        sign.s,

        { from: dataManager }
      );

      let validSign = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        nonce2,
        treeId,
        updateIpfsHash
      );

      await Common.travelTime(TimeEnumes.days, 60);

      const totalBalanceBeforeVerifyUpdate =
        await planterFundInstnce.totalBalances();

      await treeFactoryInstance.verifyUpdate(
        nonce2,
        account.address,
        treeId,
        updateIpfsHash,
        validSign.v,
        validSign.r,
        validSign.s,

        {
          from: dataManager,
        }
      );

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        2,
        "planterNonce is incorrect"
      );

      const totalBalanceAfterVerifyUpdate =
        await planterFundInstnce.totalBalances();

      const planterBalanceAfterVerify = await planterFundInstnce.balances(
        account.address
      );

      const treeToPlanterTotalClaimedAfterVerify =
        await planterFundInstnce.treeToPlanterTotalClaimed(treeId);

      assert.equal(
        Number(totalBalanceBeforeVerifyUpdate.planter),
        Number(
          Math.Big(totalBalanceAfterVerifyUpdate.planter).add(
            planterBalanceAfterVerify
          )
        ),
        "planter balance after verify is incorrect"
      );

      assert.equal(
        Number(treeToPlanterTotalClaimedAfterVerify),
        Number(planterBalanceAfterVerify),
        "planter balance after verify is incorrect"
      );

      ////////////// update 2

      let validSign2 = await Common.createUpdateTreeMsgWithSig(
        treeFactoryInstance,
        account,
        nonce3,
        treeId,
        updateIpfsHash
      );

      await Common.travelTime(TimeEnumes.days, 60);

      await treeFactoryInstance.verifyUpdate(
        nonce3,
        account.address,
        treeId,
        updateIpfsHash,
        validSign2.v,
        validSign2.r,
        validSign2.s,

        {
          from: dataManager,
        }
      );

      assert.equal(
        Number(await treeFactoryInstance.plantersNonce(account.address)),
        3,
        "planterNonce is incorrect"
      );

      const totalBalanceAfterVerifyUpdate2 =
        await planterFundInstnce.totalBalances();

      const planterBalanceAfterVerify2 = await planterFundInstnce.balances(
        account.address
      );

      const treeToPlanterTotalClaimedAfterVerify2 =
        await planterFundInstnce.treeToPlanterTotalClaimed(treeId);

      assert.equal(
        Number(totalBalanceBeforeVerifyUpdate.planter),
        Number(
          Math.Big(totalBalanceAfterVerifyUpdate2.planter).add(
            planterBalanceAfterVerify2
          )
        ),
        "planter balance after verify is incorrect"
      );

      assert.equal(
        Number(treeToPlanterTotalClaimedAfterVerify2),
        Number(planterBalanceAfterVerify2),
        "planter balance after verify is incorrect"
      );
    });

    it("verifyTreeBatch mint 10001 && 10004 && 10006 && 10007 (2 planter , 2 treeId per planter)", async () => {
      let account = await web3.eth.accounts.create();
      let account2 = await web3.eth.accounts.create();

      let ipfsHashs = [];

      let treeIds = [10002, 10003, 10005];
      let treeSpecs = ["ipfs", "ipfs1", "ipfs2"];

      for (let i = 0; i < 4; i++) {
        ipfsHashs[i] = "some ipfs " + i + " hash here";
      }

      const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
      const countryCode = [1, 2, 3, 4];

      await treeFactoryInstance.listTreeBatch(treeIds, treeSpecs);

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
      await treeFactoryInstance.verifyTreeBatch(input, {
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
        10007,
        "lastRegualarTreeId not true updated"
      );

      treeIds = [10001, 10004, 10006, 10007];

      for (let i = 0; i < 4; i++) {
        //-----------------------> check data for planter 1

        let planter = i < 2 ? account.address : account2.address;

        let treeFactoryResultAfterVerify2 =
          await treeFactoryInstance.trees.call(treeIds[i]);

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

        assert.isTrue(
          Number(treeFactoryResultAfterVerify2.plantDate) <
            Number(plantDate) + 5 &&
            Number(treeFactoryResultAfterVerify2.plantDate) >
              Number(plantDate) - 5,

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

    it("verifyTreeBatch reject because of Permission denied", async () => {
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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("Permission denied");

      await planterInstance.updateSupplyCap(account.address, 3);

      await treeFactoryInstance
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith("Permission denied");

      await planterInstance.updateSupplyCap(account.address, 4);

      await treeFactoryInstance.verifyTreeBatch(input, {
        from: dataManager,
      });
    });

    it("verifyTreeBatch reject because of nonce incorrect", async () => {
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
        .verifyTreeBatch(input, {
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
        .verifyTreeBatch(input, {
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
        .verifyTreeBatch(input, {
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
        .verifyTreeBatch(input, {
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
        .verifyTreeBatch(input, {
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

      await treeFactoryInstance.verifyTreeBatch(input, {
        from: dataManager,
      });

      assert.equal(
        await treeFactoryInstance.plantersNonce(account.address),
        6,
        "planter nonce is not correct"
      );
    });

    it("verifyTreeBatch reject because of check signature", async () => {
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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      //-----------------------------> reject wrong nonce

      await treeFactoryInstance
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      //--------------------

      //-----------------------------> reject planter nonce

      await treeFactoryInstance
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

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
        .verifyTreeBatch(input, {
          from: dataManager,
        })
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);
    });

    //--------------------------------> verifyTree test

    it("verifyTree must be successfull", async () => {
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

      const eventTx = await treeFactoryInstance.verifyTree(
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

      truffleAssert.eventEmitted(eventTx, "TreeVerifiedWithSign", (ev) => {
        return Number(ev.treeId) == 100001 && Number(ev.nonce) == 1 && ev.planter == account.address;
      });

      sign = await Common.createMsgWithSigPlantTree(
        treeFactoryInstance,
        account,
        2,
        ipfsHashs[1],
        birthDate,
        countryCode[1]
      );

      plantDate[1] = await Common.timeInitial(TimeEnumes.seconds, 0);

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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

    it("verifyTree reject because of Permission denied", async () => {
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

      await treeFactoryInstance.verifyTree(
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

      await treeFactoryInstance.verifyTree(
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

    it("verifyTree reject because of nonce incorrect", async () => {
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
        .verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        .verifyTree(
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

      await treeFactoryInstance.verifyTree(
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
        .verifyTree(
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

      await treeFactoryInstance.verifyTree(
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

    it("verifyTree reject because of check signature", async () => {
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
        .verifyTree(
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
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

      await treeFactoryInstance
        .verifyTree(
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
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);
      //-----------------------------> reject wrong nonce

      await treeFactoryInstance
        .verifyTree(
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
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);

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
        .verifyTree(
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
        .should.be.rejectedWith(TreeFactoryErrorMsg.INVALID_SIGNATURE);
    });
  });
});
