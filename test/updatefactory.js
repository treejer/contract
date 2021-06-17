const AccessRestriction = artifacts.require("AccessRestriction");
const UpdateFactory = artifacts.require("UpdateFactory");
const Tree = artifacts.require("Tree");
const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
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

contract("UpdateFactory", (accounts) => {
  let arInstance;
  let updateInstance;
  let treeInstance;
  let gbInstance;
  let treeTokenInstance;
  const deployerAccount = accounts[0];
  const ownerAccount = accounts[1];
  const planterAccount = accounts[2];
  const otherPlanterAccount = accounts[3];
  const ambAccount = accounts[4];
  const other2PlanterAccount = accounts[5];
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
    await treeInstance.setGBFactoryAddress(gbInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setUpdateFactoryAddress(updateInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await updateInstance.setTreeFactoryAddress(treeInstance.address, {
      from: deployerAccount,
    });
    await updateInstance.setGBFactoryAddress(gbInstance.address, {
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
  it("should add updates", async () => {
    Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    Common.addTree(treeInstance, ownerAccount);
    let treeId = 0;
    let imageHash = "0x14dsahjdauhdiw012564";
    let tx = await updateInstance.post(treeId, imageHash, {
      from: ownerAccount,
    });
    truffleAssert.eventEmitted(tx, "UpdateAdded", (ev) => {
      return (
        ev.updateId.toString() === "0" &&
        ev.treeId.toString() === treeId.toString() &&
        ev.imageHash.toString() === imageHash.toString()
      );
    });
  });
  it("should add updates with gsn", async () => {
    let env = await GsnTestEnvironment.startGsn("localhost");
    const {
      forwarderAddress,
      relayHubAddress,
      paymasterAddress,
    } = env.contractsDeployment;
    await updateInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });
    let paymaster = await WhitelistPaymaster.new(arInstance.address);
    await paymaster.setWhitelistTarget(updateInstance.address, {
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
    const newPlanter = gsnProvider.newAccount();
    provider = new ethers.providers.Web3Provider(gsnProvider);
    let signer = provider.getSigner(newPlanter.address, newPlanter.privateKey);
    let contract = await new ethers.Contract(
      updateInstance.address,
      updateInstance.abi,
      signer
    );
    //for increasing index
    await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    await Common.addTree(treeInstance, ownerAccount);
    let treeId = 0;
    let imageHash = "0x14dsahjdauhdiw012564";
    let tx = await updateInstance.post(treeId, imageHash, {
      from: ownerAccount,
    });
    await Common.addPlanter(arInstance, newPlanter.address, deployerAccount);
    // also must plant tree with gsn
    await treeInstance.setTrustedForwarder(forwarderAddress, {
      from: deployerAccount,
    });
    await paymaster.setWhitelistTarget(treeInstance.address, {
      from: deployerAccount,
    });
    let treecontract = await new ethers.Contract(
      treeInstance.address,
      treeInstance.abi,
      signer
    );
    await treecontract.plant(0, ["", "38.0962", "46.2738"], ["1", "1"]);
    let treeId1 = 1;
    let imageHash1 = "0x14dsahjdauhdiw444012564";
    const transaction = await contract.post(treeId1, imageHash1, {
      from: newPlanter.address,
    });
    let result = await truffleAssert.createTransactionResult(
      updateInstance,
      transaction.hash
    );
    truffleAssert.eventEmitted(result, "UpdateAdded", (ev) => {
      return (
        ev.updateId.toString() === "1" &&
        ev.treeId.toString() === treeId1.toString() &&
        ev.imageHash.toString() === imageHash1.toString()
      );
    });
  });
  it("should accept update by admin", async () => {
    Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    Common.addTree(treeInstance, ownerAccount);
    let treeId = 0;
    let imageHash = "0x14dsahjdauhdiw012564";
    let tx = await updateInstance.post(treeId, imageHash, {
      from: ownerAccount,
    });
    let tx1 = await updateInstance.acceptUpdate(0, { from: deployerAccount });
    truffleAssert.eventEmitted(tx1, "UpdateAccepted", (ev) => {
      return (
        ev.updateId.toString() === "0" &&
        ev.byWho.toString() === deployerAccount
      );
    });
  });
  it("should accept update by other planter of GB", async () => {
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addPlanter(arInstance, otherPlanterAccount, deployerAccount);
    Common.addAmbassador(arInstance, ambAccount, deployerAccount);
    await Common.sleep(1000);
    Common.addGB(
      gbInstance,
      ambAccount,
      [planterAccount, otherPlanterAccount],
      "title - test"
    );
    await Common.sleep(1000);
    Common.addTree(treeInstance, planterAccount);
    let treeId = 0;
    let imageHash = "0x14dsahjdauhdiw012564";
    let tx = await updateInstance.post(treeId, imageHash, {
      from: planterAccount,
    });
    await Common.sleep(1000);
    let tx1 = await updateInstance.acceptUpdate(0, {
      from: otherPlanterAccount,
    });
    truffleAssert.eventEmitted(tx1, "UpdateAccepted", (ev) => {
      return (
        ev.updateId.toString() === "0" &&
        ev.byWho.toString() === otherPlanterAccount
      );
    });
  });
  it("can't accept update by other GB ", async () => {
    Common.addPlanter(arInstance, planterAccount, deployerAccount);
    Common.addPlanter(arInstance, otherPlanterAccount, deployerAccount);
    Common.addAmbassador(arInstance, ambAccount, deployerAccount);
    Common.addGB(
      gbInstance,
      ambAccount,
      [planterAccount, otherPlanterAccount],
      "title - test"
    );
    Common.addTree(treeInstance, planterAccount);
    let treeId = 0;
    let imageHash = "0x14dsahjdauhdiw012564";
    let tx = await updateInstance.post(treeId, imageHash, {
      from: planterAccount,
    });
    Common.addPlanter(arInstance, other2PlanterAccount, deployerAccount);
    return await updateInstance
      .acceptUpdate(0, { from: other2PlanterAccount })
      .then(assert.fail)
      .catch((error) => {
        assert.include(
          error.message,
          "only one of planters of that greenBlock can accept update!",
          "should throw an exception."
        );
      });
  });
});
