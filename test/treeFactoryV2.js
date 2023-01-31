const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactoryV2");
const Tree = artifacts.require("Tree");
const Auction = artifacts.require("Auction");

const Planter = artifacts.require("Planter");
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

  describe("add tree,assign and plant tree,verify plant", () => {
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

      await treeFactoryInstance.setData(2, planterInstance.address, {
        from: deployerAccount,
      });
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

    it.only("verifyTreeBatchWithSignature tree", async () => {
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
        let sign = await Common.createMsgWithSig(
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

      let inputs2 = [];

      for (let i = 10; i < 20; i++) {
        let sign = await Common.createMsgWithSig(
          treeFactoryInstance,
          account2,
          i + 1,
          ipfsHashs[i],
          birthDate,
          countryCode
        );

        inputs2[i - 10] = [
          i + 1,
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
  });
});
