require("dotenv").config();

const Allocation = artifacts.require("Allocation.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("Call FinnacialModel Methods...");

  await Allocation.deployed().then(async (instance) => {
    await instance.addAllocationData(1500, 0, 500, 500, 500, 7000, 0, 0, {
      from: accounts[0],
    });

    await instance.addAllocationData(5500, 500, 1000, 1000, 1000, 1000, 0, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(0, 10000, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(10001, 0, 1, {
      from: accounts[0],
    });
  });
};
