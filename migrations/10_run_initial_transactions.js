require("dotenv").config();

const TreeFactory = artifacts.require("TreeFactory.sol");
const Treasury = artifacts.require("Treasury.sol");
const Planter = artifacts.require("Planter.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");

//gsn
var WhitelistPaymaster = artifacts.require("WhitelistPaymaster.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let treeFactoryAddress = TreeFactory.address;
  let treasuryAddress = Treasury.address;

  //gsn
  let trustedForwarder;
  let relayHub;
  let paymasterAddress = WhitelistPaymaster.address;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
    relayHub = require("../build/gsn/RelayHub.json").address;
  } else {
    trustedForwarder = process.env.GSN_FORWARDER;
    relayHub = process.env.GSN_RELAY_HUB;
  }

  console.log("Call Tree Attribute Methods...");
  await TreeAttribute.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(TreeFactory.address);
  });

  console.log("Call Treasury Methods...");

  await Treasury.deployed().then(async (instance) => {
    await instance.setTrustedForwarder(trustedForwarder);
    await instance.setPlanterContractAddress(Planter.address);
    await instance.setTreeResearchAddress(process.env.TREE_RESEARCH_ADDRESS);
    await instance.setLocalDevelopAddress(process.env.LOCAL_DEVELOP_ADDRESS);
    await instance.setRescueFundAddress(process.env.RESCUE_FUND_ADDRESS);
    await instance.setTreejerDevelopAddress(
      process.env.TREEJER_DEVELOP_ADDRESS
    );
    await instance.setReserveFund1Address(process.env.RESERVE_FUND_ADDRESS1);
    await instance.setReserveFund2Address(process.env.RESERVE_FUND_ADDRESS2);

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

  console.log("Call IncrementalSell Methods...");
  await IncrementalSell.deployed().then(async (instance) => {
    await instance.setTreeFactoryAddress(treeFactoryAddress);
    await instance.setTreasuryAddress(treasuryAddress);

    await instance.addTreeSells(101, web3.utils.toWei("0.01"), 100, 10, 1000, {
      from: accounts[0],
    });
  });
};
