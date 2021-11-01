require("dotenv").config();

const Allocation = artifacts.require("Allocation.sol");

module.exports = async function (deployer, network, accounts) {
  console.log("Call FinnacialModel Methods...");

  await Allocation.deployed().then(async (instance) => {
    await instance.addAllocationData(4500, 500, 500, 1000, 1000, 2500, 0, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(0, 0, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(1, 9, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(10, 99, 0, {
      from: accounts[0],
    });

    await instance.assignAllocationToTree(100, 10000, 0, {
      from: accounts[0],
    });
  });
};
