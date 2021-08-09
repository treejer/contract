const Units = require("ethereumjs-units");
const { time } = require("@openzeppelin/test-helpers");
var Common = {};

const assert = require("chai").assert;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");

const AUCTION_ROLE = web3.utils.soliditySha3("AUCTION_ROLE");
const INCREMENTAL_SELL_ROLE = web3.utils.soliditySha3("INCREMENTAL_SELL_ROLE");
const TREE_FACTORY_ROLE = web3.utils.soliditySha3("TREE_FACTORY_ROLE");
const REGULAR_SELL_ROLE = web3.utils.soliditySha3("REGULAR_SELL_ROLE");
const FUNDS_ROLE = web3.utils.soliditySha3("FUNDS_ROLE");

const Math = require("./math");

Common.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

Common.addPlanter = async (instance, account, adminAccount) => {
  await instance.grantRole(PLANTER_ROLE, account, { from: adminAccount });
};

Common.addFundsRole = async (instance, account, adminAccount) => {
  await instance.grantRole(FUNDS_ROLE, account, { from: adminAccount });
};

Common.addAdmin = async (instance, account, adminAccount) => {
  await instance.grantRole(DEFAULT_ADMIN_ROLE, account, { from: adminAccount });
};

Common.addAuctionRole = async (instance, address, adminAccount) => {
  await instance.grantRole(AUCTION_ROLE, address, { from: adminAccount });
};
Common.addIncrementalSellRole = async (instance, address, adminAccount) => {
  await instance.grantRole(INCREMENTAL_SELL_ROLE, address, {
    from: adminAccount,
  });
};

Common.addTreeFactoryRole = async (instance, address, adminAccount) => {
  await instance.grantRole(TREE_FACTORY_ROLE, address, { from: adminAccount });
};

Common.addRegularSellRole = async (instance, address, adminAccount) => {
  await instance.grantRole(REGULAR_SELL_ROLE, address, { from: adminAccount });
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

  // await instance.approve(
  //   spender,
  //   Units.convert("999999999999999999999", "eth", "wei"),
  //   { from: account }
  // );
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
  treeFactoryInstance,
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
  await Common.addTreeFactoryRole(
    arInstance,
    treeFactoryInstance.address,
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

  await treeFactoryInstance.addTree(treeId, ipfsHash, {
    from: deployerAccount,
  });

  await treeFactoryInstance.assignTreeToPlanter(treeId, planterAddress, {
    from: deployerAccount,
  });

  await treeFactoryInstance.plantTree(
    treeId,
    ipfsHash,
    birthDate,
    countryCode,
    {
      from: planterAddress,
    }
  );
  await treeFactoryInstance.verifyPlant(treeId, true, {
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

  const tx = await planterInstance.planterJoin(
    planterType,
    longitude,
    latitude,
    countryCode,
    refferedBy,
    organizationAddress,
    { from: planterAddress }
  );
  return tx;
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
  const tx = await instance.organizationJoin(
    organizationAddress,
    longitude,
    latitude,
    countryCode,
    capcity,
    refferedBy,
    { from: adminAccount }
  );
  return tx;
};
Common.joinSimplePlanterFromTreeFactory = async (
  planterInstance,
  planterType,
  planterAddress,
  refferedBy,
  organizationAddress,
  treeFactoryInstance,
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
  treeFactoryAddress,
  auctionAddress,
  financialModelInstance,
  daiFundInstance,
  daiInstance,
  planterFundInstnce,
  treeId,
  fundsPercent,
  fundAmount,
  tokenOwner,
  treeFactoryInstance
) => {
  await Common.addTreeFactoryRole(
    arInstance,
    treeFactoryAddress,
    deployerAccount
  );

  await financialModelInstance.addFundDistributionModel(
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
  await financialModelInstance.assignTreeFundDistributionModel(0, 10, 0, {
    from: deployerAccount,
  });

  await Common.addAuctionRole(arInstance, auctionAddress, deployerAccount);

  await Common.addTreeFactoryRole(
    arInstance,
    treeFactoryAddress,
    deployerAccount
  );

  await treeFactoryInstance.availability(treeId, 1, {
    from: auctionAddress,
  });

  await treeFactoryInstance.updateOwner(treeId, tokenOwner, {
    from: auctionAddress,
  });

  await daiInstance.setMint(daiFundInstance.address, fundAmount);

  await daiFundInstance.setDaiTokenAddress(daiInstance.address, {
    from: deployerAccount,
  });

  await daiFundInstance.setPlanterFundContractAddress(
    planterFundInstnce.address,
    { from: deployerAccount }
  );

  await Common.addFundsRole(
    arInstance,
    daiFundInstance.address,
    deployerAccount
  );

  let tx = await daiFundInstance.fundTree(
    treeId,
    fundAmount,
    fundsPercent.planterFund,
    fundsPercent.referralFund,
    fundsPercent.treeResearch,
    fundsPercent.localDevelop,
    fundsPercent.rescueFund,
    fundsPercent.treejerDevelop,
    fundsPercent.reserveFund1,
    fundsPercent.reserveFund2,
    {
      from: auctionAddress,
    }
  );
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
  treeFactoryInstance,
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

  await treeFactoryInstance.regularPlantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

Common.regularPlantTreeSuccessOrganization = async (
  arInstance,
  treeFactoryInstance,
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

  await treeFactoryInstance.regularPlantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

module.exports = Common;
