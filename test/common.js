const Units = require("ethereumjs-units");
const { time } = require("@openzeppelin/test-helpers");
var Common = {};

const assert = require("chai").assert;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AMBASSADOR_ROLE = web3.utils.soliditySha3("AMBASSADOR_ROLE");
const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");

const SEED_FACTORY_ROLE = web3.utils.soliditySha3("SEED_FACTORY_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const O2_FACTORY_ROLE = web3.utils.soliditySha3("O2_FACTORY_ROLE");
const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const GENESIS_TREE_ROLE = web3.utils.soliditySha3("GENESIS_TREE_ROLE");

const REGULAR_SELL_ROLE = web3.utils.soliditySha3("REGULAR_SELL_ROLE");

const Math = require("./math");

Common.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

Common.addType = async (instance, account, name = null) => {
  name = name !== null ? name : "balut";
  let scientificName = "blt";
  let o2formula = 100;
  let price = Units.convert("0.01", "eth", "wei");

  return await instance.create(name, scientificName, o2formula, price, {
    from: account,
  });
};

Common.approveAndTransfer = async (
  instance,
  account,
  spender,
  from,
  amount = "1000"
) => {
  await instance.transfer(account, Units.convert(amount, "eth", "wei"), {
    from: from,
  });

  await instance.approve(
    spender,
    Units.convert("999999999999999999999", "eth", "wei"),
    { from: account }
  );
};

Common.addGB = async (instance, ambassadorAccount, planters, title = null) => {
  title = title !== null ? title : "firstGB";
  let coordinates = [
    { lat: 25.774, lng: -80.19 },
    { lat: 18.466, lng: -66.118 },
    { lat: 32.321, lng: -64.757 },
    { lat: 25.774, lng: -80.19 },
  ];

  return await instance.create(
    title,
    JSON.stringify(coordinates),
    ambassadorAccount,
    planters,
    { from: ambassadorAccount }
  );
};

Common.addTree = async (instance, account) => {
  let typeId = 0;
  let latitude = "38.0962";
  let longitude = "46.2738";
  let height = "1";
  let diameter = "1";

  return await instance.plant(
    typeId,
    ["", latitude, longitude],
    [height, diameter],
    { from: account }
  );
};

Common.fundTree = async (instance, ownerAccount, count) => {
  await instance.fund(count, { from: ownerAccount, value: 0 });
};

Common.addUpdate = async (instance, ownerAccount, treeId = 0) => {
  await instance.post(treeId, "imageHash", { from: ownerAccount });
};

Common.acceptUpdate = async (instance, adminAccount, updateId = 0) => {
  await instance.acceptUpdate(updateId, { from: adminAccount });
};

Common.addAmbassador = async (instance, account, adminAccount) => {
  await instance.grantRole(AMBASSADOR_ROLE, account, { from: adminAccount });
};

Common.addPlanter = async (instance, account, adminAccount) => {
  await instance.grantRole(PLANTER_ROLE, account, { from: adminAccount });
};

Common.addAdmin = async (instance, account, adminAccount) => {
  await instance.grantRole(DEFAULT_ADMIN_ROLE, account, { from: adminAccount });
};

Common.addSeedFactoryRole = async (instance, address, adminAccount) => {
  await instance.grantRole(SEED_FACTORY_ROLE, address, { from: adminAccount });
};

Common.addTreeFactoryRole = async (instance, address, adminAccount) => {
  await instance.grantRole(TREE_FACTORY_ROLE, address, { from: adminAccount });
};

Common.addO2FactoryRole = async (instance, address, adminAccount) => {
  await instance.grantRole(O2_FACTORY_ROLE, address, { from: adminAccount });
};

Common.addAuctionRole = async (instance, address, adminAccount) => {
  await instance.grantRole(AUCTION_ROLE, address, { from: adminAccount });
};

Common.addGenesisTreeRole = async (instance, address, adminAccount) => {
  await instance.grantRole(GENESIS_TREE_ROLE, address, { from: adminAccount });
};

Common.addRegularSellRole = async (instance, address, adminAccount) => {
  await instance.grantRole(REGULAR_SELL_ROLE, address, { from: adminAccount });
};

Common.travelTime = async (timeFormat, timeDuration) => {
  await time.increase(time.duration[timeFormat](timeDuration));
};

Common.timeInitial = async (timeFormat, timeDuration) => {
  let x = (await time.latest()).add(time.duration[timeFormat](timeDuration));
  return x;
};
Common.getNow = async () => {
  return await time.latest();
};

Common.successPlant = async (
  genesisTreeInstance,
  arInstance,
  ipfsHash,
  treeId,
  birthDate,
  countryCode,
  planterList,
  planterAddress,
  deployerAccount,
  planterInstance
) => {
  await Common.addGenesisTreeRole(
    arInstance,
    genesisTreeInstance.address,
    deployerAccount
  );

  await planterList.map(async (item) => {
    await Common.addPlanter(arInstance, item, deployerAccount);
  });

  await planterList.map(async (item) => {
    await Common.joinSimplePlanter(
      planterInstance,
      1,
      item,
      zeroAddress,
      zeroAddress
    );
  });

  await genesisTreeInstance.addTree(treeId, ipfsHash, {
    from: deployerAccount,
  });

  await genesisTreeInstance.asignTreeToPlanter(treeId, planterAddress, {
    from: deployerAccount,
  });

  await genesisTreeInstance.plantTree(
    treeId,
    ipfsHash,
    birthDate,
    countryCode,
    {
      from: planterAddress,
    }
  );
  await genesisTreeInstance.verifyPlant(treeId, true, {
    from: deployerAccount,
  });
};
Common.joinSimplePlanter = async (
  planterInstance,
  planterType,
  planterAddress,
  refferedBy,
  organizationAddress
) => {
  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;

  await planterInstance.planterJoin(
    planterType,
    longitude,
    latitude,
    countryCode,
    refferedBy,
    organizationAddress,
    { from: planterAddress }
  );
};

Common.joinOrganizationPlanter = async (
  instance,
  organizationAddress,
  refferedBy,
  adminAccount
) => {
  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;
  const capcity = 1000;
  await instance.organizationJoin(
    organizationAddress,
    longitude,
    latitude,
    countryCode,
    capcity,
    refferedBy,
    { from: adminAccount }
  );
};
Common.joinSimplePlanterFromGenesis = async (
  planterInstance,
  planterType,
  planterAddress,
  refferedBy,
  organizationAddress,
  genesisTreeInstance,
  adminAccount
) => {
  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;

  await planterInstance.planterJoin(
    planterType,
    longitude,
    latitude,
    countryCode,
    refferedBy,
    organizationAddress,
    { from: planterAddress }
  );
};

Common.getTransactionFee = async (tx) => {
  const gasUsed = tx.receipt.gasUsed;
  const gasPrice = (await web3.eth.getTransaction(tx.tx)).gasPrice;

  return Math.mul(gasPrice, gasUsed);
};

Common.successPlanterJoin = async (
  arInstance,
  adminAccount,
  planterInstance,
  planterType,
  planterAddress,
  refferedBy,
  organizationAddress
) => {
  await Common.addPlanter(arInstance, planterAddress, adminAccount);

  if (refferedBy != zeroAddress) {
    await Common.addPlanter(arInstance, refferedBy, adminAccount);
  }

  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;

  await planterInstance.planterJoin(
    planterType,
    longitude,
    latitude,
    countryCode,
    refferedBy,
    organizationAddress,
    { from: planterAddress }
  );
};

Common.successOrganizationPlanterJoin = async (
  arInstance,
  instance,
  organizationAddress,
  refferedBy,
  adminAccount
) => {
  await Common.addPlanter(arInstance, organizationAddress, adminAccount);

  if (refferedBy != zeroAddress) {
    await Common.addPlanter(arInstance, refferedBy, adminAccount);
  }

  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;
  const capcity = 1000;

  await instance.organizationJoin(
    organizationAddress,
    longitude,
    latitude,
    countryCode,
    capcity,
    refferedBy,
    { from: adminAccount }
  );
};

Common.successFundTree = async (
  arInstance,
  deployerAccount,
  genesisTreeAddress,
  auctionAddress,
  treasuryInstance,
  treeId,
  fundsPercent,
  fundAmount,
  tokenOwner,
  genesisTreeInstance
) => {
  await Common.addGenesisTreeRole(
    arInstance,
    genesisTreeAddress,
    deployerAccount
  );

  await treasuryInstance.addFundDistributionModel(
    fundsPercent.planterFund,
    fundsPercent.gbFund,
    fundsPercent.treeResearch,
    fundsPercent.localDevelop,
    fundsPercent.rescueFund,
    fundsPercent.treejerDevelop,
    fundsPercent.otherFund1,
    fundsPercent.otherFund2,
    {
      from: deployerAccount,
    }
  );
  await treasuryInstance.assignTreeFundDistributionModel(0, 10, 0, {
    from: deployerAccount,
  });

  await Common.addAuctionRole(arInstance, auctionAddress, deployerAccount);

  await Common.addGenesisTreeRole(
    arInstance,
    genesisTreeAddress,
    deployerAccount
  );

  await genesisTreeInstance.availability(treeId, 1, {
    from: auctionAddress,
  });

  await genesisTreeInstance.updateOwner(treeId, tokenOwner, {
    from: auctionAddress,
  });

  let tx = await treasuryInstance.fundTree(treeId, {
    from: auctionAddress,
    value: fundAmount,
  });
};

Common.acceptPlanterByOrganization = async (
  planterInstance,
  organizationAddress,
  planterAddress,
  planterProtion
) => {
  await planterInstance.acceptPlanterFromOrganization(planterAddress, true, {
    from: organizationAddress,
  });

  await planterInstance.updateOrganizationPlanterPayment(
    planterAddress,
    planterProtion,
    {
      from: organizationAddress,
    }
  );
};

Common.regularPlantTreeSuccess = async (
  arInstance,
  genesisTreeInstance,
  planterInstance,
  ipfsHash,
  birthDate,
  countryCode,
  planter,
  deployerAccount
) => {
  await Common.addPlanter(arInstance, planter, deployerAccount);

  await Common.joinSimplePlanter(
    planterInstance,
    1,
    planter,
    zeroAddress,
    zeroAddress
  );

  await genesisTreeInstance.regularPlantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

Common.regularPlantTreeSuccessOrganization = async (
  arInstance,
  genesisTreeInstance,
  planterInstance,
  ipfsHash,
  birthDate,
  countryCode,
  planter,
  organizationAdmin,
  deployerAccount
) => {
  await Common.addPlanter(arInstance, planter, deployerAccount);
  await Common.addPlanter(arInstance, organizationAdmin, deployerAccount);
  await Common.joinOrganizationPlanter(
    planterInstance,
    organizationAdmin,
    zeroAddress,
    deployerAccount
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

  await genesisTreeInstance.regularPlantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

module.exports = Common;
