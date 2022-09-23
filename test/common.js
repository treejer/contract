const Units = require("ethereumjs-units");
const { time } = require("@openzeppelin/test-helpers");
var Common = {};
// const { web3 } = require("@openzeppelin/test-environment");
const assert = require("chai").assert;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const PLANTER_ROLE = web3.utils.soliditySha3("PLANTER_ROLE");
const DATA_MANAGER_ROLE = web3.utils.soliditySha3("DATA_MANAGER_ROLE");
const VERIFIER_ROLE = web3.utils.soliditySha3("VERIFIER_ROLE");
const SCRIPT_ROLE = web3.utils.soliditySha3("SCRIPT_ROLE");

const TREEBOX_SCRIPT = web3.utils.soliditySha3("TREEBOX_SCRIPT");

const TREEJER_CONTRACT_ROLE = web3.utils.soliditySha3("TREEJER_CONTRACT_ROLE");

Common.TREEBOX_SCRIPT = TREEBOX_SCRIPT;

const Math = require("./math");

Common.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

Common.addPlanter = async (instance, account, adminAccount) => {
  await instance.grantRole(PLANTER_ROLE, account, { from: adminAccount });
};

Common.addTreeBoxScript = async (instance, account, adminAccount) => {
  await instance.grantRole(TREEBOX_SCRIPT, account, { from: adminAccount });
};

Common.getNewAccountPublicKey = async () => {
  const account = web3.eth.accounts.create();
  return account.address;
};

Common.getAccount = async () => {
  return web3.eth.accounts.create();
};

Common.addTreejerContractRole = async (instance, account, adminAccount) => {
  await instance.grantRole(TREEJER_CONTRACT_ROLE, account, {
    from: adminAccount,
  });
};

Common.addVerifierRole = async (instance, account, adminAccount) => {
  await instance.grantRole(VERIFIER_ROLE, account, {
    from: adminAccount,
  });
};

Common.addAdmin = async (instance, account, adminAccount) => {
  await instance.grantRole(DEFAULT_ADMIN_ROLE, account, { from: adminAccount });
};

Common.addDataManager = async (instance, account, adminAccount) => {
  await instance.grantRole(DATA_MANAGER_ROLE, account, { from: adminAccount });
};

Common.addScriptRole = async (instance, account, adminAccount) => {
  await instance.grantRole(SCRIPT_ROLE, account, { from: adminAccount });
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
  planterInstance,
  dataManager
) => {
  await Common.addTreejerContractRole(
    arInstance,
    treeFactoryInstance.address,
    deployerAccount
  );

  await new Promise((resolve, reject) => {
    planterList.map(async (item) => {
      await Common.addPlanter(arInstance, item, deployerAccount);
      if (planterList[planterList.length - 1] == item) {
        resolve();
      }
    });
  });

  await new Promise((resolve, reject) => {
    planterList.map(async (item) => {
      await Common.joinSimplePlanter(
        planterInstance,
        1,
        item,
        zeroAddress,
        zeroAddress
      );
      if (planterList[planterList.length - 1] == item) {
        resolve();
      }
    });
  });

  await treeFactoryInstance.listTree(treeId, ipfsHash, {
    from: dataManager,
  });

  await treeFactoryInstance.assignTree(treeId, planterAddress, {
    from: dataManager,
  });

  await treeFactoryInstance.plantAssignedTree(
    treeId,
    ipfsHash,
    birthDate,
    countryCode,
    {
      from: planterAddress,
    }
  );
  await treeFactoryInstance.verifyAssignedTree(treeId, true, {
    from: dataManager,
  });
};
Common.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
Common.joinSimplePlanter = async (
  planterInstance,
  planterType,
  planterAddress,
  invitedBy,
  organizationAddress
) => {
  const longitude = 1;
  const latitude = 2;
  const countryCode = 10;

  const tx = await planterInstance.join(
    planterType,
    longitude,
    latitude,
    countryCode,
    invitedBy,
    organizationAddress,
    { from: planterAddress }
  );
  return tx;
};

Common.joinOrganizationPlanter = async (
  instance,
  organizationAddress,
  invitedBy,
  adminAccount
) => {
  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;
  const capcity = 1000;
  const tx = await instance.joinOrganization(
    organizationAddress,
    longitude,
    latitude,
    countryCode,
    capcity,
    invitedBy,
    { from: adminAccount }
  );
  return tx;
};
Common.joinSimplePlanterFromTreeFactory = async (
  planterInstance,
  planterType,
  planterAddress,
  invitedBy,
  organizationAddress,
  treeFactoryInstance,
  adminAccount
) => {
  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;

  await planterInstance.join(
    planterType,
    longitude,
    latitude,
    countryCode,
    invitedBy,
    organizationAddress,
    { from: planterAddress }
  );
};

Common.getTransactionFee = async (tx) => {
  const gasUsed = tx.receipt.gasUsed;
  const gasPrice = (await web3.eth.getTransaction(tx.tx)).gasPrice;

  return Math.mul(gasPrice, gasUsed);
};

Common.successJoin = async (
  arInstance,
  adminAccount,
  planterInstance,
  planterType,
  planterAddress,
  invitedBy,
  organizationAddress
) => {
  await Common.addPlanter(arInstance, planterAddress, adminAccount);

  if (invitedBy != zeroAddress) {
    await Common.addPlanter(arInstance, invitedBy, adminAccount);
  }

  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;

  await planterInstance.join(
    planterType,
    longitude,
    latitude,
    countryCode,
    invitedBy,
    organizationAddress,
    { from: planterAddress }
  );
};

Common.successJoinOrganization = async (
  arInstance,
  instance,
  organizationAddress,
  invitedBy,
  adminAccount,
  dataManager
) => {
  await Common.addPlanter(arInstance, organizationAddress, adminAccount);

  if (invitedBy != zeroAddress) {
    await Common.addPlanter(arInstance, invitedBy, adminAccount);
  }

  let longitude = 1;
  let latitude = 2;
  const countryCode = 10;
  const capcity = 1000;

  await instance.joinOrganization(
    organizationAddress,
    longitude,
    latitude,
    countryCode,
    capcity,
    invitedBy,
    { from: dataManager }
  );
};

Common.successFundTree = async (
  arInstance,
  deployerAccount,
  treeFactoryAddress,
  auctionAddress,
  allocationInstance,
  daiFundInstance,
  daiInstance,
  planterFundInstnce,
  treeId,
  fundsPercent,
  fundAmount,
  tokenOwner,
  treeFactoryInstance,
  dataManager
) => {
  await Common.addTreejerContractRole(
    arInstance,
    treeFactoryAddress,
    deployerAccount
  );

  await allocationInstance.addAllocationData(
    fundsPercent.planterFund,
    fundsPercent.referralFund,
    fundsPercent.research,
    fundsPercent.localDevelopment,
    fundsPercent.insurance,
    fundsPercent.treasury,
    fundsPercent.reserve1,
    fundsPercent.reserve2,
    {
      from: dataManager,
    }
  );
  await allocationInstance.assignAllocationToTree(0, 10, 0, {
    from: dataManager,
  });

  await Common.addTreejerContractRole(
    arInstance,
    auctionAddress,
    deployerAccount
  );

  await treeFactoryInstance.manageSaleType(treeId, 1, {
    from: auctionAddress,
  });

  await treeFactoryInstance.mintAssignedTree(treeId, tokenOwner, {
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

  await Common.addTreejerContractRole(
    arInstance,
    treeFactoryAddress,
    deployerAccount
  );

  await Common.addTreejerContractRole(
    arInstance,
    auctionAddress,
    deployerAccount
  );

  await Common.addTreejerContractRole(
    arInstance,
    daiFundInstance.address,
    deployerAccount
  );

  let tx = await daiFundInstance.fundTree(
    treeId,
    fundAmount,
    fundsPercent.planterFund,
    fundsPercent.referralFund,
    fundsPercent.research,
    fundsPercent.localDevelopment,
    fundsPercent.insurance,
    fundsPercent.treasury,
    fundsPercent.reserve1,
    fundsPercent.reserve2,
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
  await planterInstance.acceptPlanterByOrganization(planterAddress, true, {
    from: organizationAddress,
  });

  await planterInstance.updateOrganizationMemberShare(
    planterAddress,
    planterProtion,
    {
      from: organizationAddress,
    }
  );
};

Common.plantTreeSuccess = async (
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

  await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

Common.plantTreeSuccessOrganization = async (
  arInstance,
  treeFactoryInstance,
  planterInstance,
  ipfsHash,
  birthDate,
  countryCode,
  planter,
  organizationAdmin,
  deployerAccount,
  dataManager
) => {
  await Common.addPlanter(arInstance, planter, deployerAccount);
  await Common.addPlanter(arInstance, organizationAdmin, deployerAccount);
  await Common.joinOrganizationPlanter(
    planterInstance,
    organizationAdmin,
    zeroAddress,
    dataManager
  );
  await Common.joinSimplePlanter(
    planterInstance,
    3,
    planter,
    zeroAddress,
    organizationAdmin
  );
  await planterInstance.acceptPlanterByOrganization(planter, true, {
    from: organizationAdmin,
  });

  await treeFactoryInstance.plantTree(ipfsHash, birthDate, countryCode, {
    from: planter,
  });
};

Common.prepareAttributeDex = async (
  UniswapV2Router02New,
  Factory,
  TestUniswap,
  Token,
  attributeInstance,
  deployerAccount
) => {
  ////--------------------------uniswap deploy

  factoryInstance = await Factory.new(deployerAccount, {
    from: deployerAccount,
  });
  const factoryAddress = factoryInstance.address;

  wethDexInstance = await Token.new("WETH", "weth", { from: deployerAccount });

  daiDexInstance = await Token.new("DAI", "dai", { from: deployerAccount });

  bnbDexInstance = await Token.new("BNB", "bnb", {
    from: deployerAccount,
  });

  adaDexInstance = await Token.new("ADA", "ada", {
    from: deployerAccount,
  });

  dexRouterInstance = await UniswapV2Router02New.new(
    factoryAddress,
    wethDexInstance.address,
    { from: deployerAccount }
  );
  const dexRouterAddress = dexRouterInstance.address;

  testUniswapInstance = await TestUniswap.new(dexRouterAddress, {
    from: deployerAccount,
  });

  /////---------------------------addLiquidity-------------------------

  const testUniswapAddress = testUniswapInstance.address;

  await wethDexInstance.setMint(
    testUniswapAddress,
    web3.utils.toWei("125000", "Ether")
  );

  await daiDexInstance.setMint(
    testUniswapAddress,
    web3.utils.toWei("1000000000", "Ether")
  );

  await bnbDexInstance.setMint(
    testUniswapAddress,
    web3.utils.toWei("500000", "Ether")
  );

  await adaDexInstance.setMint(
    testUniswapAddress,
    web3.utils.toWei("125000000", "Ether")
  );

  await testUniswapInstance.addLiquidity(
    daiDexInstance.address,
    wethDexInstance.address,
    web3.utils.toWei("250000000", "Ether"),
    web3.utils.toWei("125000", "Ether")
  );

  await testUniswapInstance.addLiquidity(
    daiDexInstance.address,
    bnbDexInstance.address,
    web3.utils.toWei("250000000", "Ether"),
    web3.utils.toWei("500000", "Ether")
  );

  await testUniswapInstance.addLiquidity(
    daiDexInstance.address,
    adaDexInstance.address,
    web3.utils.toWei("250000000", "Ether"),
    web3.utils.toWei("125000000", "Ether")
  );

  //-------------------set address

  await attributeInstance.setDexRouterAddress(dexRouterInstance.address, {
    from: deployerAccount,
  });

  await attributeInstance.setBaseTokenAddress(daiDexInstance.address, {
    from: deployerAccount,
  });

  let list = [
    wethDexInstance.address,
    bnbDexInstance.address,
    adaDexInstance.address,
  ];

  await attributeInstance.setDexTokens(list, {
    from: deployerAccount,
  });
};

module.exports = Common;
