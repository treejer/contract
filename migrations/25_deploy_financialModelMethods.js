require("dotenv").config();

const FinancialModel = artifacts.require("FinancialModel.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("Call Treasury Methods...");

  await FinancialModel.deployed().then(async (instance) => {
    await instance.addFundDistributionModel(
      4500,
      500,
      500,
      1000,
      1000,
      2500,
      0,
      0,
      {
        from: accounts[0],
      }
    );

    await instance.assignTreeFundDistributionModel(0, 0, 0, {
      from: accounts[0],
    });

    await instance.assignTreeFundDistributionModel(1, 9, 0, {
      from: accounts[0],
    });

    await instance.assignTreeFundDistributionModel(10, 99, 0, {
      from: accounts[0],
    });

    await instance.assignTreeFundDistributionModel(100, 10000, 0, {
      from: accounts[0],
    });
  });
};
