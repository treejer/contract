const Units = require("ethereumjs-units");
const { time } = require("@openzeppelin/test-helpers");
var Common = {};

const assert = require("chai").assert;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");

const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const GENESIS_TREE_ROLE = web3.utils.soliditySha3("GENESIS_TREE_ROLE");
const REGULAR_SELL_ROLE = web3.utils.soliditySha3("REGULAR_SELL_ROLE");

const Math = require("./math");

Common.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

Common.addPlanter = async (instance, account, adminAccount) => {
  await instance.grantRole(PLANTER_ROLE, account, { from: adminAccount });
};

Common.addAdmin = async (instance, account, adminAccount) => {
  await instance.grantRole(DEFAULT_ADMIN_ROLE, account, { from: adminAccount });
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

  await genesisTreeInstance.assignTreeToPlanter(treeId, planterAddress, {
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
    fundsPercent.referralFund,
    fundsPercent.treeResearch,
    fundsPercent.localDevelop,
    fundsPercent.rescueFund,
    fundsPercent.treejerDevelop,
    fundsPercent.reserveFund1,
    fundsPercent.reserveFund2,
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
