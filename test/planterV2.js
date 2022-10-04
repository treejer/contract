// const { accounts, contract, web3 } = require("@openzeppelin/test-environment");

const AccessRestriction = artifacts.require("AccessRestriction");
const PlanterV2 = artifacts.require("PlanterV2");

const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();

const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
  CommonErrorMsg,
  GsnErrorMsg,
  PlanterErrorMsg,
  MarketPlaceErrorMsg,
} = require("./enumes");

const MarketPlace = artifacts.require("MarketPlace");

const TreeFactoryV2 = artifacts.require("TreeFactoryV2");

const Math = require("./math");

//gsn
// const WhitelistPaymaster = artifacts.require("WhitelistPaymaster");

// const Gsn = require("@opengsn/provider");
// const { GsnTestEnvironment } = require("@opengsn/cli/dist/GsnTestEnvironment");
// const ethers = require("ethers");

contract("PlanterV2", (accounts) => {
  let planterV2Instance;
  let treeFactoryV2Instance;
  let arInstance;

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

  // before(async () => {

  // });

  beforeEach(async () => {
    arInstance = await AccessRestriction.new({
      from: deployerAccount,
    });

    await arInstance.initialize(deployerAccount, {
      from: deployerAccount,
    });

    await Common.addDataManager(arInstance, dataManager, deployerAccount);

    planterV2Instance = await PlanterV2.new({
      from: deployerAccount,
    });

    await planterV2Instance.initialize(zeroAddress, {
      from: deployerAccount,
    }).should.be.rejected;

    await planterV2Instance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    treeFactoryV2Instance = await TreeFactoryV2.new({
      from: deployerAccount,
    });

    await treeFactoryV2Instance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    ///-----------------------------deploy market place

    marketPlaceInstance = await MarketPlace.new({
      from: deployerAccount,
    });

    await marketPlaceInstance.initialize(arInstance.address, {
      from: deployerAccount,
    });

    await marketPlaceInstance.setPlanterAddress(planterV2Instance.address, {
      from: deployerAccount,
    });

    await treeFactoryV2Instance.setMarketPlaceAddress(
      marketPlaceInstance.address,
      {
        from: deployerAccount,
      }
    );

    await planterV2Instance.setMarketPlaceAddress(marketPlaceInstance.address, {
      from: deployerAccount,
    });
  });

  it("check setMarketPlaceAddress function", async () => {
    marketPlaceInstance2 = await MarketPlace.new({
      from: deployerAccount,
    });

    await marketPlaceInstance2.initialize(arInstance.address, {
      from: deployerAccount,
    });

    const address = planterV2Instance.address;

    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);

    //------------------------->reject set marketPlace function

    await planterV2Instance
      .setMarketPlaceAddress(marketPlaceInstance.address, {
        from: userAccount3,
      })
      .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN);

    await planterV2Instance.setMarketPlaceAddress(userAccount3, {
      from: deployerAccount,
    }).should.be.rejected;

    //------------------------->successfully set marketPlace function

    await planterV2Instance.setMarketPlaceAddress(
      marketPlaceInstance2.address,
      {
        from: deployerAccount,
      }
    );

    assert.equal(
      await planterV2Instance.marketPlace(),
      marketPlaceInstance2.address,
      "address dosn't set correct"
    );
  });

  it("updatePlanterType should be fail because planter has active market place model", async () => {
    const country1 = 1;
    const species1 = 10;
    const price1 = web3.utils.toWei("10");
    const count1 = 50;
    const funder = userAccount5;
    const recipient = userAccount6;
    const referrer = userAccount7;
    const amount = web3.utils.toWei("30");

    const modelId = 1;
    await marketPlaceInstance.addModel(country1, species1, price1, count1, {
      from: userAccount1,
    });

    await regularSaleInstance.updateReferralTriggerCount(2, {
      from: dataManager,
    });

    const input = [{ modelId: 3, count: 1 }];

    await daiInstance.setMint(funder, amount);

    await daiInstance.approve(marketPlaceInstance.address, amount, {
      from: funder,
    });

    //-------------------------------------------------------------

    let organizationAddress = userAccount4;
    let planter = userAccount2;
    let planter2 = userAccount3;

    await Common.addPlanter(arInstance, organizationAddress, deployerAccount);
    await Common.addPlanter(arInstance, planter, deployerAccount);
    await Common.addPlanter(arInstance, planter2, deployerAccount);

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

    //organizationAddress join
    await Common.joinOrganizationPlanter(
      planterV2Instance,
      organizationAddress,
      zeroAddress,
      dataManager
    );

    await Common.joinSimplePlanter(
      planterV2Instance,
      1,
      planter,
      zeroAddress,
      zeroAddress
    );

    await Common.joinSimplePlanter(
      planterV2Instance,
      3,
      planter2,
      zeroAddress,
      organizationAddress
    );

    await planterV2Instance.acceptPlanterByOrganization(planter2, true, {
      from: organizationAddress,
    });

    //------------------------- create model

    await marketPlaceInstance.addModel(
      1,
      2,
      web3.utils.toWei("1", "Ether"),
      1,
      { from: planter }
    );

    await marketPlaceInstance.addModel(
      1,
      2,
      web3.utils.toWei("1", "Ether"),
      1,
      { from: organizationAddress }
    );

    //---------------------------------------------

    const ipfsHash = "some ipfs hash here";
    const birthDate = parseInt(Math.divide(new Date().getTime(), 1000));
    const countryCode = 2;

    await treeFactoryV2Instance.plantMarketPlaceTree(
      ipfsHash,
      birthDate,
      countryCode,
      1,
      {
        from: planter,
      }
    );

    //----------------------------------------------

    await Common.addTreejerContractRole(
      arInstance,
      deployerAccount,
      deployerAccount
    );

    await planterV2Instance
      .updatePlanterType(1, zeroAddress, {
        from: planter,
      })
      .should.be.rejectedWith(PlanterErrorMsg.PLANTER_HAS_MODEL);

    await planterV2Instance.updatePlanterType(1, zeroAddress, {
      from: planter2,
    });

    await marketPlaceInstance.deleteModel(1, {
      from: planter,
    });

    await planterV2Instance.updatePlanterType(3, organizationAddress, {
      from: planter,
    });

    await planterV2Instance.acceptPlanterByOrganization(planter, false, {
      from: organizationAddress,
    });

    await marketPlaceInstance.addModel(
      1,
      2,
      web3.utils.toWei("1", "Ether"),
      1,
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

    await marketPlaceInstance.reduceLastPlantedOfModel(3, {
      from: planter,
    });

    let model = await marketPlaceInstance.models(3);

    assert.equal(model.deactive, 0, "result is not correct");

    await marketPlaceInstance.fundTree(input, zeroAddress, zeroAddress, {
      from: funder,
    });

    await marketPlaceInstance.reduceLastPlantedOfModel(3, {
      from: planter,
    });
  });
});
