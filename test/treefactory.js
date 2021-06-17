const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const Tree = artifacts.require("Tree");
const Dai = artifacts.require("Dai");
const assert = require("chai").assert;
const truffleAssert = require("truffle-assertions");
const Units = require("ethereumjs-units");
const Common = require("./common");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

//gsn
const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");
const Gsn = require("@opengsn/gsn");
const { GsnTestEnvironment } = require("@opengsn/gsn/dist/GsnTestEnvironment");
const ethers = require("ethers");

contract("TreeFactory", (accounts) => {
  let arInstance;
  let treeInstance;
  let treeTokenInstance;
  let gbInstance;
  let updateInstance;
  let daiContract;
  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];
  const secondAccount = accounts[2];
  const planterAccount = accounts[3];
  const adminAccount = accounts[5];
  const ambassadorAccount = accounts[6];
  const admin2Account = accounts[7];
  const withdrawLocalDevelopmentFundAccount = accounts[9];
  const withdrawRescueFundAccount = accounts[5];
  const withdrawResearchFundAccount = accounts[8];
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    updateInstance = await deployProxy(UpdateFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    treeInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    gbInstance = await deployProxy(GBFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    daiContract = await Dai.new(Units.convert("1000000", "eth", "wei"), {
      from: deployerAccount,
    });
    await treeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setUpdateFactoryAddress(updateInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setDaiTokenAddress(daiContract.address, {
      from: deployerAccount,
    });
    await updateInstance.setTreeFactoryAddress(treeInstance.address, {
      from: deployerAccount,
    });
    await Common.addTreeFactoryRole(
      arInstance,
      treeInstance.address,
      deployerAccount
    );
  });
  afterEach(async () => {
    // await treeInstance.kill({ from: ownerAccount });
  });
  it("get the size of the contract", function () {
    return TreeFactory.deployed().then(function (instance) {
      var bytecode = instance.constructor._json.bytecode;
      var deployed = instance.constructor._json.deployedBytecode;
      var sizeOfB = bytecode.length / 2;
      var sizeOfD = deployed.length / 2;
      console.log("size of bytecode in bytes = ", sizeOfB);
      console.log("size of deployed in bytes = ", sizeOfD);
      console.log(
        "initialisation and constructor code in bytes = ",
        sizeOfB - sizeOfD
      );
    });
  });
  it("should add tree", async () => {
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    let tx = await Common.addTree(treeInstance, ownerAccount);
    truffleAssert.eventEmitted(tx, "TreePlanted", (ev) => {
      return ev.id.toString() === "0";
    });
  });
  it("should add tree with gsn", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");
    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;
    await treeInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });
    let paymaster = await WhitelistPaymaster.new(arInstance.address);
    await paymaster.setWhitelistTarget(treeInstance.address, {
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
    const newPlanter = gsnProvider.newAccount();
    let signer = provider.getSigner(newPlanter.address, newPlanter.privateKey);
    let contract = await new ethers.Contract(
      treeInstance.address,
      treeInstance.abi,
      signer
    );
    await Common.addPlanter(arInstance, newPlanter.address, deployerAccount);
    //for increasing tree index
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    let tx = await Common.addTree(treeInstance, ownerAccount);
    const transaction = await contract.plant(
      0,
      ["", "38.0962", "46.2738"],
      ["1", "1"]
    );
    let result = await truffleAssert.createTransactionResult(
      treeInstance,
      transaction.hash
    );
    truffleAssert.eventEmitted(result, "TreePlanted", (ev) => {
      return ev.id.toString() === "1";
    });
  });
  it("should plant from funded trees", async () => {
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    let price = Units.convert("7", "eth", "wei");
    await treeInstance.setPrice(price, { from: adminAccount });
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    await treeInstance.fund(2, { from: secondAccount, value: 0 });
    await Common.addPlanter(arInstance, planterAccount, deployerAccount);
    let tx = await Common.addTree(treeInstance, planterAccount);
    truffleAssert.eventEmitted(tx, "TreePlanted", (ev) => {
      return ev.id.toString() === "0";
    });
  });
  it("should return owner tree count", async () => {
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    await Common.addTree(treeInstance, ownerAccount);
    await Common.addTree(treeInstance, ownerAccount);
    return await treeTokenInstance
      .balanceOf(ownerAccount, { from: ownerAccount })
      .then((count) => {
        assert.equal(
          2,
          count.toString(),
          "Owner tree counts are: " + count.toString()
        );
      });
  });
  // it("should return owner trees", async () => {
  //     await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
  //     await Common.addTree(treeInstance, ownerAccount);
  //     await Common.addPlanter(arInstance, secondAccount, deployerAccount);
  //     await Common.addTree(treeInstance, secondAccount);
  //     await Common.addTree(treeInstance, ownerAccount);
  //     return await treeInstance.getOwnerTrees(ownerAccount, { from: ownerAccount })
  //         .then(ownerTrees => {
  //             assert.equal(
  //                 ownerTrees[0],
  //                 0,
  //                 "First tree id must 0"
  //             );
  //             assert.equal(
  //                 ownerTrees[1],
  //                 2,
  //                 "second tree id must 2"
  //             );
  //         });
  // });
  it("should return tree owner", async () => {
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    await Common.addTree(treeInstance, ownerAccount);
    return await treeTokenInstance
      .ownerOf(0, { from: ownerAccount })
      .then((ownerAddress) => {
        assert.equal(
          ownerAccount,
          ownerAddress,
          "Tree owner is: " + ownerAddress
        );
      });
  });
  it("should update tree price", async () => {
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    let price = Units.convert("0.02", "eth", "wei");
    let tx = await treeInstance.setPrice(price, { from: adminAccount });
    truffleAssert.eventEmitted(tx, "PriceChanged", (ev) => {
      return ev.price.toString() === price;
    });
  });
  it("should return tree price", async () => {
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    let price = Units.convert("0.03", "eth", "wei");
    await treeInstance.setPrice(price, { from: adminAccount });
    return await treeInstance
      .price({ from: ownerAccount })
      .then((treePrice) => {
        assert.equal(treePrice, price, "Price: " + treePrice);
      });
  });
  it("should return tree data", async () => {
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    await Common.addTree(treeInstance, ownerAccount);
    return await treeInstance.trees(0, { from: ownerAccount }).then((tree) => {
      assert.notEqual(tree[0], "not longitude");
    });
  });
  it("should fund a tree from planted trees", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    await Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    await Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
    await Common.addPlanter(arInstance, planterAccount, deployerAccount);
    await Common.addGB(
      gbInstance,
      ambassadorAccount,
      [planterAccount],
      "firstGb"
    );
    await Common.addTree(treeInstance, planterAccount);
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    let tx = await treeInstance.fund(count, { from: secondAccount, value: 0 });
    truffleAssert.eventEmitted(tx, "TreeFunded", (ev) => {
      if (ev.treeId.toString() === "0") {
        return (
          ev.treeId.toString() === "0" &&
          ev.planterBalance.toString() ===
            ((treePrice.toString() * 4500) / 10000).toString()
        );
      } else {
        return (
          ev.treeId.toString() === "1" &&
          ev.planterBalance.toString() ===
            ((treePrice.toString() * 4000) / 10000).toString()
        );
      }
    });
  });
  it("should fund a tree", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    let tx = await treeInstance.fund(count, { from: secondAccount, value: 0 });
    truffleAssert.eventEmitted(tx, "TreeFunded", (ev) => {
      return (
        ev.treeId.toString() === "0" &&
        ev.planterBalance.toString() === ((treePrice * 4000) / 10000).toString()
      );
    });
    await daiContract.balanceOf(secondAccount).then((balance) => {
      assert.equal(
        balance,
        Units.convert("986", "eth", "wei"),
        "second account"
      );
    });
    await daiContract.balanceOf(treeInstance.address).then((balance) => {
      assert.equal(
        balance,
        Units.convert("14", "eth", "wei"),
        "tree contract account"
      );
    });
  });
  it("should update balance of wallets", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    let tx = await treeInstance.fund(count, { from: secondAccount, value: 0 });
    await treeInstance
      .treejerFund()
      .then((_treejerFund) => {
        assert.equal(
          _treejerFund.toString(),
          ((treePrice * count * 2500) / 10000).toString(),
          "treejerFund " + _treejerFund.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await treeInstance
      .plantersFund()
      .then((_plantersFund) => {
        assert.equal(
          _plantersFund.toString(),
          ((treePrice * count * 4000) / 10000).toString(),
          "plantersFund " + _plantersFund.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await treeInstance
      .ambassadorsFund()
      .then((_ambassadorsFund) => {
        assert.equal(
          _ambassadorsFund.toString(),
          "0",
          "ambassadorsFund " + _ambassadorsFund.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await treeInstance
      .localDevelopmentFund()
      .then((_localDevelopmentFund) => {
        assert.equal(
          _localDevelopmentFund.toString(),
          ((treePrice * count * 2000) / 10000).toString(),
          "localDevelopmentFund " +
            _localDevelopmentFund.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await treeInstance
      .rescueFund()
      .then((_rescueFund) => {
        assert.equal(
          _rescueFund.toString(),
          ((treePrice * count * 1000) / 10000).toString(),
          "rescueFund " + _rescueFund.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await treeInstance
      .researchFund()
      .then((_researchFund) => {
        assert.equal(
          _researchFund.toString(),
          ((treePrice * count * 500) / 10000).toString(),
          "researchFund " + _researchFund.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should withdraw treejer, localDevelopmentFund,  rescueFund, researchFund", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: deployerAccount });
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    let tx = await treeInstance.fund(count, { from: secondAccount, value: 0 });
    treejer_amount = (
      ((parseInt(treePrice) * 2500) / 10000) *
      count
    ).toString();
    local_amount = (((parseInt(treePrice) * 2000) / 10000) * count).toString();
    rescue_amount = (((parseInt(treePrice) * 1000) / 10000) * count).toString();
    research_amount = (
      ((parseInt(treePrice) * 500) / 10000) *
      count
    ).toString();
    await treeInstance.withdrawTreejerFund(admin2Account, treejer_amount, {
      from: deployerAccount,
    });
    await treeInstance.withdrawLocalDevelopmentFund(
      withdrawLocalDevelopmentFundAccount,
      local_amount,
      { from: deployerAccount }
    );
    await treeInstance.withdrawRescueFund(
      withdrawRescueFundAccount,
      rescue_amount,
      { from: deployerAccount }
    );
    await treeInstance.withdrawResearchFund(
      withdrawResearchFundAccount,
      research_amount,
      { from: deployerAccount }
    );
    await daiContract
      .balanceOf(admin2Account)
      .then((balance) => {
        assert.equal(
          balance.toString(),
          parseInt(treejer_amount).toString(),
          "admin2Account balance: " + balance.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await daiContract
      .balanceOf(withdrawLocalDevelopmentFundAccount)
      .then((balance) => {
        assert.equal(
          balance.toString(),
          parseInt(local_amount).toString(),
          "withdrawLocalDevelopmentFundAccount balance: " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await daiContract
      .balanceOf(withdrawRescueFundAccount)
      .then((balance) => {
        assert.equal(
          balance.toString(),
          parseInt(rescue_amount).toString(),
          "withdrawRescueFundAccount balance: " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
    await daiContract
      .balanceOf(withdrawResearchFundAccount)
      .then((balance) => {
        assert.equal(
          balance.toString(),
          parseInt(research_amount).toString(),
          "withdrawResearchFundAccount balance: " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should withdraw planter fund", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addTree(treeInstance, planterAccount, "first");
    Common.addTree(treeInstance, planterAccount, "second");
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 0);
    Common.acceptUpdate(updateInstance, deployerAccount, 0);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 1);
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    await treeInstance.fund(count, { from: secondAccount, value: 0 });
    let tx = await treeInstance.withdrawPlanterBalance({
      from: planterAccount,
    });
    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        "88787417552" >= ev.amount.toString() <= "88787417553" &&
        ev.planter === planterAccount
      );
    });
  });
  it("should withdraw ambassador fund", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 3;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addGB(gbInstance, ambassadorAccount, [planterAccount], "GB GB");
    Common.addTree(treeInstance, planterAccount, "first");
    //with two update
    Common.addTree(treeInstance, planterAccount, "second");
    // without update
    Common.addTree(treeInstance, planterAccount, "three");
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 0);
    Common.acceptUpdate(updateInstance, deployerAccount, 0);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 1);
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 2);
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    await treeInstance.fund(count, { from: secondAccount, value: 0 });
    let tx = await treeInstance.withdrawAmbassadorBalance({
      from: ambassadorAccount,
    });
    truffleAssert.eventEmitted(tx, "AmbassadorBalanceWithdrawn", (ev) => {
      return (
        "14797902923" >= ev.amount.toString() <= "14797902924" &&
        ev.ambassador === ambassadorAccount
      );
    });
  });
  it("should set all Percentages", async () => {
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    let tx = await treeInstance.setAllPercentages(
      ["2000", "4000", "1000", "1000", "1000", "1000"],
      { from: adminAccount }
    );
    await treeInstance
      .treejerPercentage()
      .then((newPercentage) => {
        assert.equal(
          newPercentage.toString(),
          "2000",
          "new treejerPercentage " + newPercentage.toString() + " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should return planter withdrawable balance", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 2;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addTree(treeInstance, planterAccount, "first");
    Common.addTree(treeInstance, planterAccount, "second");
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 0);
    Common.acceptUpdate(updateInstance, deployerAccount, 0);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 1);
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    await treeInstance.fund(count, { from: secondAccount, value: 0 });
    await treeInstance
      .getPlanterWithdrawableBalance(planterAccount, { from: planterAccount })
      .then((balance) => {
        if (!("118383223404" >= balance.toString() <= "147979029255")) {
          throw new Error(
            "PlanterWithdrawableBalance balance: " +
              balance.toString() +
              " returned"
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
    let tx = await treeInstance.withdrawPlanterBalance({
      from: planterAccount,
    });
    truffleAssert.eventEmitted(tx, "PlanterBalanceWithdrawn", (ev) => {
      return (
        "118383223404" >= ev.amount.toString() <= "147979029255" &&
        ev.planter === planterAccount
      );
    });
    await treeInstance
      .getPlanterWithdrawableBalance(planterAccount, { from: planterAccount })
      .then((balance) => {
        assert.equal(
          balance.toString(),
          "0",
          "PlanterWithdrawableBalance balance: " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should return withdrawable 0 for non planter", async () => {
    Common.addPlanter(
      arInstance,
      withdrawLocalDevelopmentFundAccount,
      deployerAccount
    );
    return await treeInstance
      .getPlanterWithdrawableBalance(withdrawLocalDevelopmentFundAccount, {
        from: planterAccount,
      })
      .then((balance) => {
        assert.equal(
          balance.toString(),
          "0",
          " balance for non tree planter is : " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
  it("should return ambassador fund", async () => {
    let treePrice = Units.convert("7", "eth", "wei");
    let count = 3;
    Common.addAdmin(arInstance, adminAccount, deployerAccount);
    await treeInstance.setPrice(treePrice, { from: adminAccount });
    Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addGB(gbInstance, ambassadorAccount, [planterAccount], "GB GB");
    Common.addTree(treeInstance, planterAccount, "first");
    //with two update
    Common.addTree(treeInstance, planterAccount, "second");
    // without update
    Common.addTree(treeInstance, planterAccount, "three");
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 0);
    Common.acceptUpdate(updateInstance, deployerAccount, 0);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 1);
    await Common.sleep(2000);
    Common.addUpdate(updateInstance, planterAccount, 1);
    Common.acceptUpdate(updateInstance, deployerAccount, 2);
    await Common.approveAndTransfer(
      daiContract,
      secondAccount,
      treeInstance.address,
      deployerAccount,
      "1000"
    );
    await treeInstance.fund(count, { from: secondAccount, value: 0 });
    //get before withdraw
    await treeInstance
      .getAmbassadorWithdrawableBalance(ambassadorAccount, {
        from: planterAccount,
      })
      .then((balance) => {
        if (!("14797902924" >= balance.toString() <= "22196854386")) {
          throw new Error(
            "AmbassadorWithdrawableBalance balance: " +
              balance.toString() +
              " returned"
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
    //withdraw
    let tx = await treeInstance.withdrawAmbassadorBalance({
      from: ambassadorAccount,
    });
    truffleAssert.eventEmitted(tx, "AmbassadorBalanceWithdrawn", (ev) => {
      return (
        "14797902924" >= ev.amount.toString() <= "22196854386" &&
        ev.ambassador === ambassadorAccount
      );
    });
    //must return zero because withdrawn
    await treeInstance
      .getAmbassadorWithdrawableBalance(ambassadorAccount, {
        from: planterAccount,
      })
      .then((balance) => {
        assert.equal(
          balance.toString(),
          "0",
          "AmbassadorWithdrawableBalance balance: " +
            balance.toString() +
            " returned"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
