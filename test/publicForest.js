const AccessRestriction = artifacts.require("AccessRestriction");
const ForestFactory = artifacts.require("ForestFactory");
const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");

const PublicForest = artifacts.require("PublicForest");
const truffleAssert = require("truffle-assertions");
const Units = require("ethereumjs-units");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const Common = require("./common");
const Dai = artifacts.require("Dai");

contract("PublicForest", (accounts) => {
  let arInstance;
  let forestInstance;
  let treeInstance;
  let treeTokenInstance;
  // let publicForestInstance;

  const ownerAccount = accounts[0];
  const deployerAccount = accounts[1];

  beforeEach(async () => {
    arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
      from: deployerAccount,
    });
    treeInstance = await deployProxy(TreeFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    forestInstance = await deployProxy(ForestFactory, [arInstance.address], {
      initializer: "initialize",
      from: deployerAccount,
    });
    // publicForestInstance = await deployProxy(PublicForest, [treeInstance.address, 'Treejer'], { initializer: 'initialize', from: deployerAccount });
    treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
      initializer: "initialize",
      from: deployerAccount,
      unsafeAllowCustomTypes: true,
    });
    daiContract = await Dai.new(Units.convert("1000000", "eth", "wei"), {
      from: deployerAccount,
    });

    let treePrice = Units.convert("7", "eth", "wei");
    await treeInstance.setPrice(treePrice, { from: deployerAccount });
    await treeInstance.setTreeTokenAddress(treeTokenInstance.address, {
      from: deployerAccount,
    });
    await treeInstance.setDaiTokenAddress(daiContract.address, {
      from: deployerAccount,
    });

    await forestInstance.setTreeFactoryAddress(treeInstance.address, {
      from: deployerAccount,
    });
    await forestInstance.setDaiTokenAddress(daiContract.address, {
      from: deployerAccount,
    });

    await Common.addTreeFactoryRole(
      arInstance,
      treeInstance.address,
      deployerAccount
    );
  });

  afterEach(async () => {});

  it("should donate and fund public forest ", async () => {
    let tx = await forestInstance.createPublicForest({ from: deployerAccount });

    let pAddress = "";

    truffleAssert.eventEmitted(tx, "PublicForestCreated", (ev) => {
      pAddress = ev.forestAddress.toString();
      return pAddress != null;
    });

    publicForestInstance = await PublicForest.at(pAddress);

    await Common.approveAndTransfer(
      daiContract,
      ownerAccount,
      pAddress,
      deployerAccount,
      "1000"
    );

    let txa = await publicForestInstance.donate(
      Units.convert("14", "eth", "wei"),
      { from: ownerAccount, value: 0 }
    );

    // truffleAssert.eventEmitted(txa, 'ContributionReceived', (ev) => {

    //     console.log(ev.from.toString(), ownerAccount, ev.value.toString(), value.toString());
    //     return ev.from.toString() === ownerAccount && ev.value.toString() === value.toString();
    // });

    truffleAssert.eventEmitted(txa, "TreesAddedToForest", (ev) => {
      return ev.count.toString() === "2";
    });
  });
});
